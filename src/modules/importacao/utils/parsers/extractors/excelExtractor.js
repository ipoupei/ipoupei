// src/modules/importacao/utils/parsers/extractors/excelExtractor.js
// Extractor para arquivos Excel (.xlsx, .xls) - VERSÃO CORRIGIDA PARA EXTRATOS BANCÁRIOS

import { BaseExtractor } from './baseExtractor.js';

/**
 * Extractor para arquivos Excel - VERSÃO CORRIGIDA
 * Suporta formatos .xlsx e .xls com contexto de importação
 * CORREÇÕES: Detecção de cabeçalho, parser de data com hora, filtros específicos
 */
export class ExcelExtractor extends BaseExtractor {
  /**
   * Verifica se pode processar o arquivo
   * @param {File} file 
   * @returns {boolean}
   */
  static canHandle(file) {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Por extensão
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return true;
    }
    
    // Por MIME type
    if (fileType.includes('spreadsheet') || 
        fileType.includes('excel') ||
        fileType.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
        fileType.includes('vnd.ms-excel')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Extrai dados brutos do arquivo Excel
   * @param {File} file 
   * @returns {Promise<ExcelRawData>}
   */
  static async extract(file) {
    try {
      console.log('📊 ExcelExtractor: Iniciando extração de', file.name);
      
      // Verificar se SheetJS está disponível
      if (typeof window === 'undefined' || !window.XLSX) {
        await this._loadSheetJS();
      }
      
      // Ler arquivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Processar com SheetJS
      const workbook = window.XLSX.read(arrayBuffer, {
        type: 'array',
        cellStyles: true,
        cellFormulas: true,
        cellDates: true,
        cellNF: true,
        sheetStubs: true
      });
      
      console.log('📋 Planilhas encontradas:', workbook.SheetNames);
      
      // Usar primeira planilha por padrão
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error('Nenhuma planilha válida encontrada no arquivo');
      }
      
      // Converter para CSV interno para reutilizar lógica
      const csvText = window.XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
      
      if (!csvText.trim()) {
        throw new Error('Planilha está vazia ou não contém dados válidos');
      }
      
      // ✅ NOVA ANÁLISE MELHORADA
      const analysis = this._analyzeExcelStructureImproved(csvText, worksheet);
      
      // Dividir em linhas
      const lines = csvText.split('\n').filter(line => line.trim());
      
      const result = {
        rawText: csvText,
        lines: lines,
        analysis: analysis,
        metadata: {
          ...this.getMetadata(file, csvText),
          sheetName: sheetName,
          sheetNames: workbook.SheetNames,
          isExcel: true
        },
        workbook: workbook,
        worksheet: worksheet
      };
      
      console.log('✅ ExcelExtractor: Extração concluída', {
        sheetName: sheetName,
        totalLines: lines.length,
        separator: analysis.separator,
        hasHeader: analysis.hasHeader,
        headerLineIndex: analysis.headerLineIndex,
        dataStartIndex: analysis.dataStartIndex,
        columnCount: analysis.columnCount,
        formatType: analysis.formatType
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ ExcelExtractor: Erro na extração:', error);
      throw new Error(`Erro ao extrair dados do Excel: ${error.message}`);
    }
  }
  
  /**
   * Carrega SheetJS dinamicamente
   * @private
   */
  static async _loadSheetJS() {
    if (typeof window !== 'undefined' && window.XLSX) {
      console.log('✅ SheetJS já está carregado');
      return;
    }
    
    try {
      console.log('📦 Carregando SheetJS...');
      
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ SheetJS carregado com sucesso');
          resolve();
        };
        
        script.onerror = () => {
          console.error('❌ Erro ao carregar SheetJS');
          reject(new Error('Falha ao carregar SheetJS'));
        };
        
        document.head.appendChild(script);
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar SheetJS:', error);
      throw new Error('Não foi possível carregar o processador de Excel');
    }
  }
  
  /**
   * Valida os dados extraídos do Excel
   * @param {ExcelRawData} rawData 
   * @returns {ValidationResult}
   */
  static validate(rawData) {
    const errors = [];
    const warnings = [];
    
    // Validações básicas
    if (!rawData.lines || rawData.lines.length === 0) {
      errors.push('Nenhuma linha encontrada na planilha');
    }
    
    if (rawData.lines && rawData.lines.length < 2) {
      warnings.push('Planilha tem apenas uma linha - pode não conter dados suficientes');
    }
    
    if (!rawData.analysis.separator) {
      errors.push('Não foi possível detectar a estrutura das colunas');
    }
    
    // ✅ VALIDAÇÃO MELHORADA
    if (!rawData.analysis.hasHeader) {
      warnings.push('Cabeçalho não detectado - pode afetar o mapeamento de colunas');
    }
    
    if (rawData.analysis.headerLineIndex === -1) {
      warnings.push('Linha de cabeçalho não localizada');
    }
    
    if (rawData.analysis.dataStartIndex === -1) {
      errors.push('Não foi possível localizar o início dos dados');
    }
    
    // Validação específica por formato
    if (rawData.analysis.formatType === 'extrato_bancario') {
      if (rawData.analysis.columnCount < 10) {
        warnings.push('Extrato bancário deve ter pelo menos 10 colunas');
      }
      if (!rawData.analysis.columnMapping.data || !rawData.analysis.columnMapping.valor) {
        errors.push('Colunas essenciais (Data/Valor) não encontradas no extrato');
      }
    } else if (rawData.analysis.formatType === 'bradesco') {
      if (rawData.analysis.columnCount < 5) {
        warnings.push('Formato Bradesco deve ter pelo menos 5 colunas (Data, Histórico, Docto, Crédito, Débito)');
      }
    } else {
      if (rawData.analysis.columnCount < 3) {
        warnings.push('Planilha tem menos de 3 colunas - pode faltar dados essenciais (data, descrição, valor)');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Converte dados brutos em transações COM CONTEXTO - VERSÃO CORRIGIDA
   * @param {ExcelRawData} rawData 
   * @param {ImportContext} context - Contexto de importação
   * @returns {Array<Transaction>}
   */
  static parseTransactions(rawData, context = {}) {
    const { lines, analysis } = rawData;
    const {
      tipoImportacao = 'conta',
      contaId = '',
      cartaoId = '',
      faturaVencimento = ''
    } = context;
    
    console.log('🔄 ExcelExtractor: Processando transações COM CONTEXTO CORRIGIDO', {
      totalLines: lines.length,
      formatType: analysis.formatType,
      separator: analysis.separator,
      headerLineIndex: analysis.headerLineIndex,
      dataStartIndex: analysis.dataStartIndex,
      tipoImportacao,
      contaId,
      cartaoId,
      faturaVencimento
    });
    
    // ✅ ESCOLHER PARSER BASEADO NO FORMATO DETECTADO
    switch (analysis.formatType) {
      case 'extrato_bancario':
        return this._parseExtratoBancarioFormat(rawData, context);
      case 'bradesco':
        return this._parseBradescoFormat(rawData, context);
      case 'generic':
      default:
        return this._parseGenericFormat(rawData, context);
    }
  }
  
  /**
   * ✅ NOVO MÉTODO: Parser específico para extrato bancário (formato identificado)
   * @param {ExcelRawData} rawData 
   * @param {ImportContext} context 
   * @returns {Array<Transaction>}
   */
  static _parseExtratoBancarioFormat(rawData, context) {
    const { lines, analysis } = rawData;
    const {
      tipoImportacao = 'conta',
      contaId = '',
      cartaoId = '',
      faturaVencimento = ''
    } = context;
    
    const transacoes = [];
    const startIndex = analysis.dataStartIndex;
    const separator = analysis.separator;
    const columnMapping = analysis.columnMapping;
    
    console.log('🏦 ExcelExtractor: Processando formato EXTRATO BANCÁRIO', {
      startIndex,
      separator,
      columnMapping,
      primeirasLinhas: lines.slice(startIndex, startIndex + 3)
    });
    
    if (startIndex === -1) {
      console.error('❌ Não foi possível localizar início dos dados');
      return [];
    }
    
    lines.slice(startIndex).forEach((line, index) => {
      try {
        const parts = line.split(separator).map(p => p.trim());
        
        console.log(`🔍 Linha ${startIndex + index + 1}:`, {
          line: line.substring(0, 100),
          parts: parts.slice(0, 10),
          totalParts: parts.length
        });
        
        if (parts.length >= 10) {
          // ✅ USAR MAPEAMENTO ESPECÍFICO PARA EXTRATO BANCÁRIO
          const dataStr = parts[columnMapping.data] || '';
          const categoria = parts[columnMapping.categoria] || '';
          const tipoTransacao = parts[columnMapping.tipo] || '';
          const descricao = parts[columnMapping.descricao] || '';
          const valorStr = parts[columnMapping.valor] || '';
          
          console.log(`📊 Valores mapeados (linha ${startIndex + index + 1}):`, {
            data: `[${columnMapping.data}] = "${dataStr}"`,
            categoria: `[${columnMapping.categoria}] = "${categoria}"`,
            tipo: `[${columnMapping.tipo}] = "${tipoTransacao}"`,
            descricao: `[${columnMapping.descricao}] = "${descricao}"`,
            valor: `[${columnMapping.valor}] = "${valorStr}"`
          });
          
          // ✅ FILTRAR LINHAS ESPECÍFICAS
          if (this._shouldSkipLine(descricao, categoria, tipoTransacao)) {
            console.log(`⏭️ Linha ignorada: ${descricao || categoria || tipoTransacao}`);
            return;
          }
          
          if (dataStr && descricao && valorStr) {
            const data = this._parseDateImproved(dataStr);
            const valor = this._parseValueImproved(valorStr);
            
            console.log(`💰 Valores processados (linha ${startIndex + index + 1}):`, {
              dataOriginal: dataStr,
              dataParsed: data,
              valorOriginal: valorStr, 
              valorParsed: valor,
              valorIsValid: !isNaN(valor) && valor !== 0
            });
            
            if (data && !isNaN(valor) && valor !== 0) {
              // ✅ APLICAR LÓGICA BASEADA NO CONTEXTO
              let tipoFinal;
              if (tipoImportacao === 'cartao') {
                tipoFinal = 'despesa'; // Para cartão, sempre despesa
              } else {
                tipoFinal = valor >= 0 ? 'receita' : 'despesa';
              }
              
              // ✅ APLICAR STATUS BASEADO NO CONTEXTO
              let efetivado;
              if (tipoImportacao === 'cartao') {
                efetivado = false; // Cartão sempre false
              } else {
                efetivado = new Date(data) <= new Date(); // Conta: efetivado se data <= hoje
              }
              
              // ✅ DESCRIÇÃO LIMPA: Usar apenas a descrição original + tipo se necessário
              let descricaoFinal = descricao.trim();
              
              // Adicionar apenas o tipo de transação se for útil e não estiver já incluído
              if (tipoTransacao && tipoTransacao.trim() && !descricaoFinal.includes(tipoTransacao)) {
                descricaoFinal = `${descricaoFinal} - ${tipoTransacao}`;
              }
              
              transacoes.push({
                id: startIndex + index + 1,
                data,
                descricao: descricaoFinal,
                valor: Math.abs(valor),
                tipo: tipoFinal,
                categoria_id: '',
                categoriaTexto: '', // ✅ CATEGORIA VAZIA - não usar a categoria do extrato
                subcategoria_id: '',
                subcategoriaTexto: '',
                // ✅ APLICAR CAMPOS BASEADOS NO CONTEXTO
                conta_id: tipoImportacao === 'conta' ? contaId : '',
                cartao_id: tipoImportacao === 'cartao' ? cartaoId : '',
                fatura_vencimento: tipoImportacao === 'cartao' ? faturaVencimento : '',
                efetivado: efetivado,
                observacoes: `Importado de extrato bancário - Tipo original: ${tipoTransacao}`,
                origem: 'Excel-ExtratoBancario',
                linhaBruta: line,
                indiceOriginal: startIndex + index + 1,
                // ✅ METADADOS ESPECÍFICOS DO EXTRATO
                extrato: {
                  categoria: categoria,
                  tipoOriginal: tipoTransacao,
                  valorOriginal: valorStr,
                  dataOriginal: dataStr
                }
              });
              
              console.log(`✅ Transação extrato criada: ${data} | ${descricaoFinal} | ${tipoFinal} | R$ ${Math.abs(valor).toFixed(2)}`);
            } else {
              console.log(`⚠️ Linha ignorada - dados inválidos: data="${data}", valor=${valor}, valorStr="${valorStr}"`);
            }
          } else {
            console.log(`⚠️ Linha ignorada - campos obrigatórios vazios: data="${dataStr}", descricao="${descricao}", valor="${valorStr}"`);
          }
        } else {
          console.log(`⚠️ Linha ignorada - colunas insuficientes: ${parts.length} < 10`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao processar linha extrato ${startIndex + index + 1}:`, error.message);
      }
    });
    
    console.log('✅ ExcelExtractor: Transações extrato processadas:', {
      totalProcessadas: transacoes.length,
      receitas: transacoes.filter(t => t.tipo === 'receita').length,
      despesas: transacoes.filter(t => t.tipo === 'despesa').length
    });
    
    return transacoes;
  }
  
  /**
   * Parser específico para formato Bradesco (mantido da versão anterior)
   * @param {ExcelRawData} rawData 
   * @param {ImportContext} context 
   * @returns {Array<Transaction>}
   */
  static _parseBradescoFormat(rawData, context) {
    const { lines, analysis } = rawData;
    const {
      tipoImportacao = 'conta',
      contaId = '',
      cartaoId = '',
      faturaVencimento = ''
    } = context;
    
    console.log('🏦 ExcelExtractor: Processando formato BRADESCO', {
      totalLines: lines.length,
      separator: analysis.separator,
      tipoImportacao,
      contaId
    });
    
    const transacoes = [];
    let startIndex = 0;
    
    // Encontrar onde começam os dados (pular cabeçalhos e metadados)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(analysis.separator).map(p => p.trim());
      
      // Procurar linha que parece ter dados de transação
      if (parts.length >= 5) {
        const possibleDate = parts[0] || parts[1];
        if (this._isValidDateFormat(possibleDate)) {
          startIndex = i;
          break;
        }
      }
    }
    
    console.log('🏦 Bradesco: Iniciando processamento na linha', startIndex + 1);
    
    lines.slice(startIndex).forEach((line, index) => {
      try {
        const parts = line.split(analysis.separator).map(p => p.trim());
        
        if (parts.length >= 5) {
          // Formato típico Bradesco: Data, Descrição, Documento, Débito, Crédito, Saldo
          let dataStr = parts[0];
          let descricao = parts[1];
          let documento = parts[2];
          let debito = parts[3];
          let credito = parts[4];
          let saldo = parts[5] || '';
          
          // Se primeira coluna não é data, tentar segunda
          if (!this._isValidDateFormat(dataStr) && parts.length > 1) {
            dataStr = parts[1];
            descricao = parts[2] || '';
            documento = parts[3] || '';
            debito = parts[4] || '';
            credito = parts[5] || '';
            saldo = parts[6] || '';
          }
          
          console.log(`🏦 DEBUG Bradesco linha ${startIndex + index + 1}:`, {
            dataStr,
            descricao,
            debito,
            credito,
            parts
          });
          
          if (this._isValidDateFormat(dataStr) && descricao) {
            const data = this._parseDateImproved(dataStr);
            
            if (data) {
              // Processar valores
              const valorDebito = this._parseValueImproved(debito);
              const valorCredito = this._parseValueImproved(credito);
              
              let valor = 0;
              let tipoTransacao = 'receita';
              
              if (valorDebito > 0) {
                valor = valorDebito;
                tipoTransacao = 'despesa';
              } else if (valorCredito > 0) {
                valor = valorCredito;
                tipoTransacao = 'receita';
              }
              
              if (valor > 0) {
                // Ajustar tipo baseado no contexto de importação
                if (tipoImportacao === 'cartao') {
                  tipoTransacao = 'despesa';
                }
                
                let efetivado;
                if (tipoImportacao === 'cartao') {
                  efetivado = false;
                } else {
                  efetivado = new Date(data) <= new Date();
                }
                
                // Enriquecer descrição
                let descricaoFinal = descricao;
                if (documento && !descricaoFinal.includes(documento)) {
                  descricaoFinal = `${descricaoFinal} - Doc: ${documento}`;
                }
                
                transacoes.push({
                  id: startIndex + index + 1,
                  data,
                  descricao: descricaoFinal,
                  valor: valor,
                  tipo: tipoTransacao,
                  categoria_id: '',
                  categoriaTexto: '',
                  subcategoria_id: '',
                  subcategoriaTexto: '',
                  conta_id: tipoImportacao === 'conta' ? contaId : '',
                  cartao_id: tipoImportacao === 'cartao' ? cartaoId : '',
                  fatura_vencimento: tipoImportacao === 'cartao' ? faturaVencimento : '',
                  efetivado: efetivado,
                  observacoes: `Saldo: ${saldo}`,
                  origem: 'Excel-Bradesco',
                  linhaBruta: line,
                  indiceOriginal: startIndex + index + 1
                });
                
                console.log(`✅ Transação Bradesco criada: ${data} | ${descricaoFinal} | ${tipoTransacao} | R$ ${valor.toFixed(2)}`);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao processar linha Bradesco ${startIndex + index + 1}:`, error.message);
      }
    });
    
    console.log('✅ Bradesco: Transações processadas:', {
      totalProcessadas: transacoes.length,
      receitas: transacoes.filter(t => t.tipo === 'receita').length,
      despesas: transacoes.filter(t => t.tipo === 'despesa').length
    });
    
    return transacoes;
  }
  
  /**
   * Parser genérico para Excel com detecção inteligente (mantido da versão anterior)
   * @param {ExcelRawData} rawData 
   * @param {ImportContext} context 
   * @returns {Array<Transaction>}
   */
  static _parseGenericFormat(rawData, context) {
    const { lines, analysis } = rawData;
    const {
      tipoImportacao = 'conta',
      contaId = '',
      cartaoId = '',
      faturaVencimento = ''
    } = context;
    
    const transacoes = [];
    let startIndex = 0;
    
    console.log('📊 ExcelExtractor: Processando formato GENÉRICO', {
      totalLines: lines.length,
      separator: analysis.separator,
      hasHeader: analysis.hasHeader
    });
    
    // ✅ BUSCAR LINHA DE INÍCIO DOS DADOS
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      const parts = line.split(analysis.separator).map(p => p.trim());
      
      // Pular linhas obviamente de cabeçalho/metadados
      if (this._isMetadataLine(line)) {
        console.log(`📊 Pulando linha de metadados ${i + 1}: ${line.substring(0, 50)}...`);
        continue;
      }
      
      // Procurar primeira linha com dados válidos
      if (parts.length >= 3) {
        let foundDate = false;
        let foundValue = false;
        
        for (let j = 0; j < Math.min(parts.length, 5); j++) {
          if (this._isValidDateFormat(parts[j])) {
            foundDate = true;
          }
          if (this._parseValueImproved(parts[j]) !== 0) {
            foundValue = true;
          }
        }
        
        if (foundDate && foundValue) {
          startIndex = i;
          console.log(`📊 Dados encontrados iniciando na linha ${i + 1}`);
          break;
        }
      }
    }
    
    // ✅ DETECTAR FORMATO ESPECÍFICO BASEADO NAS COLUNAS DA PRIMEIRA LINHA DE DADOS
    if (startIndex < lines.length) {
      const sampleLine = lines[startIndex];
      const sampleParts = sampleLine.split(analysis.separator).map(p => p.trim());
      const formatoDetectado = this._detectarEstruturaDinamica(sampleParts);
      
      console.log('🔍 Formato estruturado detectado:', {
        startIndex,
        sampleLine: sampleLine.substring(0, 100),
        formatoDetectado
      });
      
      // ✅ PROCESSAR LINHAS
      lines.slice(startIndex).forEach((line, index) => {
        try {
          const parts = line.split(analysis.separator).map(p => p.trim());
          
          if (parts.length >= 3) {
            const dadosLinha = this._extrairDadosDinamicos(parts, formatoDetectado);
            
            console.log(`🔍 DEBUG Linha ${startIndex + index + 1}:`, {
              parts: parts.slice(0, 5),
              dadosExtraidos: dadosLinha
            });
            
            if (dadosLinha.data && dadosLinha.descricao && dadosLinha.valor !== null && dadosLinha.valor !== 0) {
              const data = this._parseDateImproved(dadosLinha.data);
              const valor = Math.abs(dadosLinha.valor);
              
              if (data && !isNaN(valor) && valor > 0) {
                let tipoTransacao;
                if (tipoImportacao === 'cartao') {
                  tipoTransacao = 'despesa';
                } else {
                  tipoTransacao = dadosLinha.valor >= 0 ? 'receita' : 'despesa';
                }
                
                let efetivado;
                if (tipoImportacao === 'cartao') {
                  efetivado = false;
                } else {
                  efetivado = new Date(data) <= new Date();
                }
                
                transacoes.push({
                  id: startIndex + index + 1,
                  data,
                  descricao: dadosLinha.descricao,
                  valor: valor,
                  tipo: tipoTransacao,
                  categoria_id: '',
                  categoriaTexto: dadosLinha.categoria || '',
                  subcategoria_id: '',
                  subcategoriaTexto: '',
                  conta_id: tipoImportacao === 'conta' ? contaId : '',
                  cartao_id: tipoImportacao === 'cartao' ? cartaoId : '',
                  fatura_vencimento: tipoImportacao === 'cartao' ? faturaVencimento : '',
                  efetivado: efetivado,
                  observacoes: dadosLinha.observacoes || '',
                  origem: 'Excel-Generico',
                  linhaBruta: line,
                  indiceOriginal: startIndex + index + 1
                });
                
                console.log(`✅ Transação Excel criada: ${data} | ${dadosLinha.descricao} | ${tipoTransacao} | R$ ${valor.toFixed(2)}`);
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao processar linha Excel ${startIndex + index + 1}:`, error.message);
        }
      });
    }
    
    console.log('✅ ExcelExtractor: Transações genéricas processadas:', {
      totalProcessadas: transacoes.length,
      receitas: transacoes.filter(t => t.tipo === 'receita').length,
      despesas: transacoes.filter(t => t.tipo === 'despesa').length
    });
    
    return transacoes;
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Verifica se linha deve ser ignorada (filtros específicos)
   * @param {string} descricao 
   * @param {string} categoria 
   * @param {string} tipo 
   * @returns {boolean}
   */
  static _shouldSkipLine(descricao, categoria, tipo) {
    // ✅ CONCATENAR TODOS OS CAMPOS PARA ANÁLISE
    const allText = `${descricao || ''} ${categoria || ''} ${tipo || ''}`.toLowerCase().trim();
    
    console.log(`🔍 Verificando se deve pular linha: "${allText}"`);
    
    // ✅ VERIFICAÇÃO ESPECÍFICA PARA SALDO DIÁRIO
    if (allText.includes('saldo diário') || allText.includes('saldo diario')) {
      console.log(`⏭️ Pulando linha de saldo diário: "${allText}"`);
      return true;
    }
    
    // Lista de termos que indicam linhas a serem ignoradas
    const skipTerms = [
      'saldo atual',
      'saldo anterior', 
      'data e hora',
      'categoria',
      'transação',
      'transacao',
      'descrição',
      'descricao',
      'valor',
      'cliente:',
      'cpf:',
      'agência:',
      'agencia:',
      'conta:',
      'período',
      'periodo',
      'extrato',
      'lançamentos',
      'lancamentos'
    ];
    
    const shouldSkip = skipTerms.some(term => allText.includes(term));
    
    if (shouldSkip) {
      console.log(`⏭️ Pulando linha de metadados: "${allText}"`);
    }
    
    return shouldSkip;
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Parser de data com suporte a horário
   * @param {string} dateStr 
   * @returns {string}
   */
  static _parseDateImproved(dateStr) {
    if (!dateStr) return null;
    
    const cleaned = dateStr.trim();
    
    // ✅ NOVO PADRÃO: Data com horário (DD/MM/YYYY HH:MM)
    const dateTimePattern = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/;
    const match = cleaned.match(dateTimePattern);
    
    if (match) {
      const dia = match[1].padStart(2, '0');
      const mes = match[2].padStart(2, '0');
      const ano = match[3];
      
      // Validar se é uma data válida
      const date = new Date(ano, mes - 1, dia);
      if (date.getFullYear() == ano && 
          date.getMonth() == mes - 1 && 
          date.getDate() == dia) {
        return `${ano}-${mes}-${dia}`;
      }
    }
    
    // ✅ FALLBACK: Usar parser original para formatos sem horário
    return this._parseDate(dateStr);
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Parser de valor com validação rigorosa
   * @param {string} valueStr 
   * @returns {number}
   */
  static _parseValueImproved(valueStr) {
    if (!valueStr) return 0;
    
    let cleaned = valueStr.toString().trim();
    
    // ✅ VALIDAÇÃO PRÉVIA: Evitar parsing de strings que claramente não são valores
    if (this._isObviouslyNotValue(cleaned)) {
      return 0;
    }
    
    // ✅ CASOS ESPECIAIS: valores vazios ou zeros
    if (!cleaned || cleaned === '0' || cleaned === '-' || cleaned === '') {
      return 0;
    }
    
    // Detectar se é negativo (parênteses ou sinal de menos)
    const isNegative = cleaned.includes('(') || 
                      cleaned.includes(')') || 
                      cleaned.startsWith('-');
    
    // Remover tudo exceto números, vírgulas e pontos
    cleaned = cleaned.replace(/[^\d,.]/g, '');
    
    if (!cleaned) return 0;
    
    // ✅ DETECTAR FORMATO: brasileiro (1.234,56) vs americano (1,234.56)
    if (/,\d{2}$/.test(cleaned)) {
      // Formato brasileiro: remover pontos e trocar vírgula por ponto
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (/\.\d{2}$/.test(cleaned)) {
      // Formato americano: remover vírgulas
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Ambíguo - assumir formato brasileiro se tiver vírgula
      if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
    }
    
    const value = parseFloat(cleaned) || 0;
    return isNegative ? -value : value;
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Detecta se string claramente não é um valor
   * @param {string} str 
   * @returns {boolean}
   */
  static _isObviouslyNotValue(str) {
    if (!str || typeof str !== 'string') return true;
    
    const cleaned = str.trim().toLowerCase();
    
    // Strings que claramente não são valores
    const notValuePatterns = [
      /^\d{2}\/\d{2}\/\d{4}/, // Datas
      /^\d{2}\/\d{2}\/\d{2}/, // Datas curtas
      /^[a-zA-Z]/, // Começa com letra
      /cliente/,
      /cpf/,
      /agencia/,
      /conta/,
      /data/,
      /categoria/,
      /descricao/,
      /transacao/,
      /saldo/,
      /extrato/
    ];
    
    return notValuePatterns.some(pattern => pattern.test(cleaned));
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Análise melhorada da estrutura do Excel
   * @param {string} csvText 
   * @param {Object} worksheet 
   * @returns {ExcelAnalysis}
   */
  static _analyzeExcelStructureImproved(csvText, worksheet) {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    console.log('🔍 DEBUG: Analisando estrutura Excel MELHORADA:', {
      totalLines: lines.length,
      primeirasLinhas: lines.slice(0, 5),
      csvTextPreview: csvText.substring(0, 500)
    });
    
    if (lines.length === 0) {
      return {
        separator: ';',
        hasHeader: false,
        headerLineIndex: -1,
        dataStartIndex: -1,
        columnCount: 0,
        encoding: 'UTF-8',
        formatType: 'generic',
        columnMapping: {}
      };
    }
    
    const separator = ';';
    
    // ✅ BUSCAR LINHA DE CABEÇALHO REAL - PRIORIDADE CORRIGIDA
    let headerLineIndex = -1;
    let headerLine = '';
    
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i].toLowerCase();
      const lineParts = lines[i].split(separator);
      
      // ✅ PRIORIDADE 1: DETECTAR CABEÇALHO ESPECÍFICO PARA EXTRATO BANCÁRIO
      if (line.includes('data e hora') && line.includes('categoria') && line.includes('valor')) {
        headerLineIndex = i;
        headerLine = lines[i];
        console.log(`🎯 Cabeçalho de extrato bancário encontrado na linha ${i + 1}: ${headerLine}`);
        break;
      }
      // ✅ PRIORIDADE 2: DETECTAR OUTROS FORMATOS DE EXTRATO BANCÁRIO
      else if (line.includes('data e hora') || (line.includes('data') && line.includes('categoria') && line.includes('transação'))) {
        headerLineIndex = i;
        headerLine = lines[i];
        console.log(`🎯 Cabeçalho de extrato bancário (variação) encontrado na linha ${i + 1}: ${headerLine}`);
        break;
      }
      // ✅ PRIORIDADE 3: DETECTAR CABEÇALHO BRADESCO (mais restritivo)
      else if (this._detectBradescoFormatStrict(line, lineParts)) {
        headerLineIndex = i;
        headerLine = lines[i];
        console.log(`🎯 Cabeçalho Bradesco encontrado na linha ${i + 1}: ${headerLine}`);
        break;
      }
      // ✅ PRIORIDADE 4: DETECTAR CABEÇALHO GENÉRICO
      else if (line.includes('data') && (line.includes('valor') || line.includes('value'))) {
        headerLineIndex = i;
        headerLine = lines[i];
        console.log(`🎯 Cabeçalho genérico encontrado na linha ${i + 1}: ${headerLine}`);
        break;
      }
    }
    
    const hasHeader = headerLineIndex !== -1;
    const columns = headerLine ? headerLine.split(separator).map(col => col.trim()) : [];
    
    // ✅ DETECTAR INÍCIO DOS DADOS (linha após cabeçalho)
    let dataStartIndex = -1;
    
    if (hasHeader && headerLineIndex >= 0) {
      // Procurar primeira linha com dados válidos após o cabeçalho
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(separator).map(p => p.trim());
        
        if (parts.length >= 3 && !this._isMetadataLine(line)) {
          // Verificar se tem pelo menos uma data e um valor
          let hasValidDate = false;
          let hasValidValue = false;
          
          for (const part of parts) {
            if (this._isValidDateFormatImproved(part)) {
              hasValidDate = true;
            }
            if (this._parseValueImproved(part) !== 0) {
              hasValidValue = true;
            }
          }
          
          if (hasValidDate && hasValidValue) {
            dataStartIndex = i;
            console.log(`📊 Início dos dados detectado na linha ${i + 1}`);
            break;
          }
        }
      }
    }
    
    // ✅ DETECTAR FORMATO ESPECÍFICO - PRIORIDADE CORRIGIDA
    let formatType = 'generic';
    let columnMapping = {};
    
    if (hasHeader && headerLine) {
      const headerLower = headerLine.toLowerCase();
      
      // ✅ PRIORIDADE 1: EXTRATO BANCÁRIO (verificação mais específica)
      if (headerLower.includes('data e hora') && headerLower.includes('categoria') && headerLower.includes('valor')) {
        formatType = 'extrato_bancario';
        columnMapping = this._mapExtratoBancarioColumns(columns);
        console.log('🎯 Formato detectado: EXTRATO BANCÁRIO');
      }
      // ✅ PRIORIDADE 2: OUTROS TIPOS DE EXTRATO BANCÁRIO
      else if (headerLower.includes('data e hora') || (headerLower.includes('data') && headerLower.includes('categoria') && headerLower.includes('transação'))) {
        formatType = 'extrato_bancario';
        columnMapping = this._mapExtratoBancarioColumns(columns);
        console.log('🎯 Formato detectado: EXTRATO BANCÁRIO (variação)');
      }
      // ✅ PRIORIDADE 3: BRADESCO (verificação mais restritiva)
      else if (this._detectBradescoFormatStrict(headerLower, columns)) {
        formatType = 'bradesco';
        columnMapping = this._mapBradescoColumns(columns);
        console.log('🎯 Formato detectado: BRADESCO');
      }
      // ✅ PRIORIDADE 4: GENÉRICO
      else {
        formatType = 'generic';
        columnMapping = this._mapGenericColumns(columns);
        console.log('🎯 Formato detectado: GENÉRICO');
      }
    }
    
    console.log('🔍 Análise estrutural concluída:', {
      separator,
      hasHeader,
      headerLineIndex,
      dataStartIndex,
      columnCount: columns.length,
      formatType,
      columnMapping,
      columns: columns.slice(0, 10)
    });
    
    return {
      separator: separator,
      hasHeader: hasHeader,
      headerLineIndex: headerLineIndex,
      dataStartIndex: dataStartIndex,
      columnCount: columns.length,
      encoding: 'UTF-8',
      formatType: formatType,
      columns: columns,
      columnMapping: columnMapping,
      sampleRows: lines.slice(0, 5)
    };
  }
  
  /**
   * ✅ FUNÇÃO CORRIGIDA: Mapeia colunas para extrato bancário
   * @param {Array<string>} columns 
   * @returns {Object}
   */
  static _mapExtratoBancarioColumns(columns) {
    // ✅ MAPEAMENTO FIXO BASEADO NA ESTRUTURA REAL IDENTIFICADA
    const map = {
      data: 1,      // [1] "Data e hora" (30/05/2025 20:06)
      categoria: 2, // [2] "Categoria" (Contas, Transferência, etc.)
      tipo: 3,      // [3] "Transação" (Pagamento de boleto, Pix recebido, etc.)
      descricao: 5, // [5] "Descrição" (Enel, Valdevino Antonio Barboza, etc.)
      valor: 9      // [9] "Valor" (-132.28, 1,000.00, etc.)
    };
    
    console.log('🗂️ Mapeamento de colunas Extrato Bancário (FIXO):', {
      originalColumns: columns.slice(0, 10),
      mappingUsed: map,
      estruturaReal: [
        '[0] = ""',
        '[1] = "Data e hora"', 
        '[2] = "Categoria"',
        '[3] = "Transação"',
        '[4] = ""',
        '[5] = "Descrição"',
        '[6-8] = ""',
        '[9] = "Valor"',
        '[10] = ""'
      ]
    });
    
    // ✅ VALIDAÇÃO: Verificar se as colunas esperadas existem
    if (columns.length < 10) {
      console.warn('⚠️ Extrato bancário tem menos de 10 colunas, usando mapeamento padrão');
    }
    
    // ✅ MAPEAMENTO INTELIGENTE OPCIONAL (se precisar ajustar)
    columns.forEach((col, index) => {
      const colNormalized = col.toLowerCase().trim();
      
      if (colNormalized.includes('data e hora') || colNormalized.includes('data')) {
        if (index !== map.data) {
          console.log(`   🔄 Data ajustada: coluna ${map.data} → ${index}: "${col}"`);
          map.data = index;
        }
      } else if (colNormalized.includes('categoria')) {
        if (index !== map.categoria) {
          console.log(`   🔄 Categoria ajustada: coluna ${map.categoria} → ${index}: "${col}"`);
          map.categoria = index;
        }
      } else if (colNormalized.includes('transação') || colNormalized.includes('transacao')) {
        if (index !== map.tipo) {
          console.log(`   🔄 Tipo ajustado: coluna ${map.tipo} → ${index}: "${col}"`);
          map.tipo = index;
        }
      } else if (colNormalized.includes('descrição') || colNormalized.includes('descricao')) {
        if (index !== map.descricao) {
          console.log(`   🔄 Descrição ajustada: coluna ${map.descricao} → ${index}: "${col}"`);
          map.descricao = index;
        }
      } else if (colNormalized.includes('valor')) {
        if (index !== map.valor) {
          console.log(`   🔄 Valor ajustado: coluna ${map.valor} → ${index}: "${col}"`);
          map.valor = index;
        }
      }
    });
    
    console.log('🗂️ Mapeamento final para extrato bancário:', map);
    return map;
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Detecta formato Bradesco com critérios mais restritivos
   * @param {string} firstLine 
   * @param {Array<string>} columns 
   * @returns {boolean}
   */
  static _detectBradescoFormatStrict(firstLine, columns) {
    console.log('🔍 Detecção Bradesco RESTRITIVA:', {
      firstLine: firstLine.substring(0, 100),
      columns: columns.slice(0, 10)
    });
    
    const normalizeText = (text) => {
      return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .trim();
    };
    
    const normalizedLine = normalizeText(firstLine);
    
    // ✅ CRITÉRIOS MAIS RESTRITIVOS PARA BRADESCO
    const strictIndicators = {
      // NÃO deve ter "data e hora" (isso é extrato bancário)
      notDataEHora: !normalizedLine.includes('data e hora'),
      
      // Deve ter termos típicos do Bradesco
      hasHistorico: normalizedLine.includes('historico') || normalizedLine.includes('hist'),
      hasCredito: normalizedLine.includes('credito') || normalizedLine.includes('credit'),
      hasDebito: normalizedLine.includes('debito') || normalizedLine.includes('debit'),
      hasDocto: normalizedLine.includes('docto') || normalizedLine.includes('documento'),
      hasSaldo: normalizedLine.includes('saldo'),
      
      // Estrutura típica
      hasCorrectStructure: columns.length >= 5 && columns.length <= 8,
      
      // Deve ter "extrato" mas não "data e hora"
      hasExtrato: normalizedLine.includes('extrato'),
      hasContaCorrente: normalizedLine.includes('conta corrente') || normalizedLine.includes('conta corren')
    };
    
    // ✅ LÓGICA RESTRITIVA: deve satisfazer múltiplos critérios E não ser extrato bancário
    const requiredCount = [
      strictIndicators.hasHistorico,
      strictIndicators.hasCredito, 
      strictIndicators.hasDebito,
      strictIndicators.hasDocto
    ].filter(Boolean).length;
    
    const isBradescoStrict = strictIndicators.notDataEHora && 
                            requiredCount >= 2 && 
                            strictIndicators.hasCorrectStructure;
    
    console.log('🔍 Detecção Bradesco RESTRITIVA:', {
      strictIndicators,
      requiredCount,
      isBradescoStrict
    });
    
    return isBradescoStrict;
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Mapeia colunas do formato Bradesco
   * @param {Array<string>} columns 
   * @returns {Object}
   */
  static _mapBradescoColumns(columns) {
    const map = {
      data: 0,      // Padrão: primeira coluna
      historico: 1, // Padrão: segunda coluna
      docto: 2,     // Padrão: terceira coluna
      credito: 3,   // Padrão: quarta coluna
      debito: 4,    // Padrão: quinta coluna
      saldo: 5      // Padrão: sexta coluna
    };
    
    const normalizeText = (text) => {
      return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .trim();
    };
    
    console.log('🗂️ Mapeando colunas Bradesco:', {
      originalColumns: columns,
      normalizedColumns: columns.map(normalizeText)
    });
    
    columns.forEach((col, index) => {
      const colNormalized = normalizeText(col);
      
      if (colNormalized.includes('data')) {
        map.data = index;
        console.log(`   📅 Data mapeada para coluna ${index}: "${col}"`);
      } else if (colNormalized.includes('historico') || colNormalized.includes('hist')) {
        map.historico = index;
        console.log(`   📝 Histórico mapeado para coluna ${index}: "${col}"`);
      } else if (colNormalized.includes('docto') || colNormalized.includes('documento')) {
        map.docto = index;
        console.log(`   📄 Docto mapeado para coluna ${index}: "${col}"`);
      } else if (colNormalized.includes('credito') || colNormalized.includes('credit')) {
        map.credito = index;
        console.log(`   💰 Crédito mapeado para coluna ${index}: "${col}"`);
      } else if (colNormalized.includes('debito') || colNormalized.includes('debit')) {
        map.debito = index;
        console.log(`   💸 Débito mapeado para coluna ${index}: "${col}"`);
      } else if (colNormalized.includes('saldo')) {
        map.saldo = index;
        console.log(`   💳 Saldo mapeado para coluna ${index}: "${col}"`);
      }
    });
    
    console.log('🗂️ Mapeamento final Bradesco:', map);
    return map;
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Mapeia colunas genéricas
   * @param {Array<string>} columns 
   * @returns {Object}
   */
  static _mapGenericColumns(columns) {
    const map = {
      data: -1,
      descricao: -1,
      valor: -1,
      categoria: -1
    };
    
    columns.forEach((col, index) => {
      const colNormalized = col.toLowerCase().trim();
      
      if (colNormalized.includes('data') && map.data === -1) {
        map.data = index;
      } else if ((colNormalized.includes('descricao') || colNormalized.includes('description')) && map.descricao === -1) {
        map.descricao = index;
      } else if ((colNormalized.includes('valor') || colNormalized.includes('value')) && map.valor === -1) {
        map.valor = index;
      } else if (colNormalized.includes('categoria') && map.categoria === -1) {
        map.categoria = index;
      }
    });
    
    // Fallback para posições típicas
    if (map.data === -1 && columns.length >= 1) map.data = 0;
    if (map.descricao === -1 && columns.length >= 2) map.descricao = 1;
    if (map.valor === -1 && columns.length >= 3) map.valor = columns.length - 1;
    
    console.log('🗂️ Mapeamento genérico:', map);
    return map;
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Verifica se string é formato de data válido
   * @param {string} str 
   * @returns {boolean}
   */
  static _isValidDateFormatImproved(str) {
    if (!str || typeof str !== 'string') return false;
    
    const cleaned = str.trim();
    if (cleaned.length < 8) return false;
    
    const datePatterns = [
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/, // DD/MM/YYYY HH:MM
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      /^\d{2}\.\d{2}\.\d{4}$/ // DD.MM.YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(cleaned));
  }
  
  // ✅ MANTER FUNÇÕES ORIGINAIS PARA COMPATIBILIDADE
  
  /**
   * Detecta se uma linha é de metadados (cabeçalho/título)
   * @param {string} line 
   * @returns {boolean}
   */
  static _isMetadataLine(line) {
    const normalizedLine = line.toLowerCase();
    
    const metadataPatterns = [
      'extrato',
      'período',
      'saldo inicial',
      'saldo final',
      'agência',
      'conta',
      'titular',
      'cliente',
      'banco',
      'relatório',
      'cpf',
      'lançamentos'
    ];
    
    return metadataPatterns.some(pattern => normalizedLine.includes(pattern)) &&
           !this._containsTransactionData(line);
  }
  
  /**
   * Verifica se linha contém dados de transação
   * @param {string} line 
   * @returns {boolean}
   */
  static _containsTransactionData(line) {
    const parts = line.split(';').map(p => p.trim());
    
    let hasDate = false;
    let hasValue = false;
    
    for (const part of parts) {
      if (this._isValidDateFormatImproved(part)) {
        hasDate = true;
      }
      if (this._parseValueImproved(part) !== 0) {
        hasValue = true;
      }
    }
    
    return hasDate && hasValue;
  }
  
  /**
   * Detecta estrutura dinamicamente baseado na primeira linha de dados
   * @param {Array<string>} parts 
   * @returns {Object}
   */
  static _detectarEstruturaDinamica(parts) {
    const mapeamento = {
      data: -1,
      descricao: -1,
      valor: -1,
      categoria: -1
    };
    
    parts.forEach((part, index) => {
      const trimmed = part.trim();
      
      if (mapeamento.data === -1 && this._isValidDateFormatImproved(trimmed)) {
        mapeamento.data = index;
      }
      
      if (mapeamento.valor === -1 && this._parseValueImproved(trimmed) !== 0) {
        mapeamento.valor = index;
      }
      
      if (mapeamento.descricao === -1 && 
          trimmed.length > 3 && 
          !this._isValidDateFormatImproved(trimmed) && 
          this._parseValueImproved(trimmed) === 0) {
        mapeamento.descricao = index;
      }
    });
    
    if (mapeamento.data === -1 && parts.length >= 1) {
      mapeamento.data = 0;
    }
    if (mapeamento.descricao === -1 && parts.length >= 2) {
      mapeamento.descricao = 1;
    }
    if (mapeamento.valor === -1 && parts.length >= 3) {
      mapeamento.valor = parts.length - 1;
    }
    
    const isEstruturado = mapeamento.data >= 0 && 
                         mapeamento.descricao >= 0 && 
                         mapeamento.valor >= 0;
    
    console.log('🗂️ Mapeamento dinâmico:', {
      parts: parts.slice(0, 5),
      mapeamento,
      isEstruturado
    });
    
    return {
      isEstruturado,
      mapeamento
    };
  }
  
  /**
   * Extrai dados usando mapeamento dinâmico
   * @param {Array<string>} parts 
   * @param {Object} formato 
   * @returns {Object}
   */
  static _extrairDadosDinamicos(parts, formato) {
    const { mapeamento } = formato;
    
    const dados = {
      data: mapeamento.data >= 0 && mapeamento.data < parts.length ? parts[mapeamento.data] : null,
      descricao: mapeamento.descricao >= 0 && mapeamento.descricao < parts.length ? parts[mapeamento.descricao] : null,
      valorStr: mapeamento.valor >= 0 && mapeamento.valor < parts.length ? parts[mapeamento.valor] : null,
      categoria: mapeamento.categoria >= 0 && mapeamento.categoria < parts.length ? parts[mapeamento.categoria] : null,
      valor: null,
      observacoes: ''
    };
    
    if (dados.valorStr) {
      dados.valor = this._parseValueImproved(dados.valorStr);
    }
    
    if (dados.descricao) {
      dados.descricao = dados.descricao.trim();
      if (dados.descricao.length === 0) {
        dados.descricao = 'Transação importada';
      }
    } else {
      dados.descricao = 'Transação importada';
    }
    
    return dados;
  }
  
  /**
   * Verifica se string parece ser uma data válida (compatibilidade)
   * @param {string} str 
   * @returns {boolean}
   */
  static _isValidDateFormat(str) {
    return this._isValidDateFormatImproved(str);
  }
  
  /**
   * Detecta formato Bradesco (versão melhorada - mantida para compatibilidade)
   * @param {string} firstLine 
   * @param {Array<string>} columns 
   * @param {Array<string>} lines
   * @returns {boolean}
   */
  static _detectBradescoFormat(firstLine, columns, lines = []) {
    console.log('🔍 DEBUG: Detecção Bradesco avançada:', {
      firstLine: firstLine.substring(0, 100),
      columnCount: columns.length,
      totalLines: lines.length
    });
    
    const indicators = {
      hasExtrato: firstLine.includes('extrato'),
      hasContaCorrente: firstLine.includes('conta corrente'),
      hasBradescoTerms: firstLine.includes('bradesco'),
      hasTypicalColumns: columns.length >= 6 && columns.length <= 12,
      hasDataPattern: false,
      hasValuePattern: false
    };
    
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      const parts = line.split(';').map(p => p.trim());
      
      if (parts.length >= 5) {
        for (let j = 0; j < Math.min(parts.length, 3); j++) {
          if (this._isValidDateFormatImproved(parts[j])) {
            indicators.hasDataPattern = true;
            break;
          }
        }
        
        for (let j = 2; j < parts.length; j++) {
          const valor = this._parseValueImproved(parts[j]);
          if (valor !== 0) {
            indicators.hasValuePattern = true;
            break;
          }
        }
        
        if (indicators.hasDataPattern && indicators.hasValuePattern) {
          break;
        }
      }
    }
    
    const score = Object.values(indicators).filter(Boolean).length;
    const isBradesco = score >= 3;
    
    console.log('🔍 Detecção formato Bradesco (Excel melhorada):', {
      indicators,
      score,
      isBradesco
    });
    
    return isBradesco;
  }
  
  /**
   * Parser de data (compatibilidade)
   * @param {string} dateStr 
   * @returns {string}
   */
  static _parseDate(dateStr) {
    if (!dateStr) return null;
    
    const cleaned = dateStr.trim().replace(/[^\d\/\-\.]/g, '');
    
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
      /^(\d{4})-(\d{2})-(\d{2})$/,
      /^(\d{2})-(\d{2})-(\d{4})$/,
      /^(\d{2})\.(\d{2})\.(\d{4})$/
    ];
    
    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      const match = cleaned.match(format);
      
      if (match) {
        if (i === 1) {
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          const dia = match[1].padStart(2, '0');
          const mes = match[2].padStart(2, '0');
          const ano = match[3];
          
          const date = new Date(ano, mes - 1, dia);
          if (date.getFullYear() == ano && 
              date.getMonth() == mes - 1 && 
              date.getDate() == dia) {
            return `${ano}-${mes}-${dia}`;
          }
        }
      }
    }
    
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      // Ignorar erro
    }
    
    console.warn(`⚠️ Não foi possível parsear a data: "${dateStr}"`);
    return null;
  }
  
  /**
   * Parser de valor (compatibilidade)
   * @param {string} valueStr 
   * @returns {number}
   */
  static _parseValue(valueStr) {
    return this._parseValueImproved(valueStr);
  }
  
  /**
   * Gera estatísticas dos dados extraídos
   * @param {ExcelRawData} rawData 
   * @param {ImportContext} context 
   * @returns {Object} Estatísticas
   */
  static getStatistics(rawData, context = {}) {
    const transactions = this.parseTransactions(rawData, context);
    
    return {
      totalRows: rawData.lines.length,
      headerRows: rawData.analysis.hasHeader ? 1 : 0,
      dataRows: rawData.lines.length - (rawData.analysis.hasHeader ? 1 : 0),
      parsedTransactions: transactions.length,
      parseSuccessRate: rawData.lines.length > 0 ? 
        (transactions.length / (rawData.lines.length - (rawData.analysis.hasHeader ? 1 : 0))) * 100 : 0,
      columnCount: rawData.analysis.columnCount,
      formatType: rawData.analysis.formatType,
      sheetName: rawData.metadata.sheetName,
      totalSheets: rawData.metadata.sheetNames?.length || 1,
      headerLineIndex: rawData.analysis.headerLineIndex,
      dataStartIndex: rawData.analysis.dataStartIndex
    };
  }
}

export default ExcelExtractor;