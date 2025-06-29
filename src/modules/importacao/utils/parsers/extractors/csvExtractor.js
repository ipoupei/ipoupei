// src/modules/importacao/utils/parsers/extractors/csvExtractor.js
// Extractor para arquivos CSV e TXT - VERSÃO COM SUPORTE AO FORMATO BRADESCO

import { BaseExtractor } from './baseExtractor.js';

/**
 * Extractor para arquivos CSV e TXT
 * VERSÃO ATUALIZADA: Suporta contexto de importação + formato Bradesco
 */
export class CSVExtractor extends BaseExtractor {
  /**
   * Verifica se pode processar o arquivo
   * @param {File} file 
   * @returns {boolean}
   */
  static canHandle(file) {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Por extensão
    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      return true;
    }
    
    // Por MIME type
    if (fileType.includes('csv') || 
        fileType.includes('text/plain') || 
        fileType.includes('text/csv')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Extrai dados brutos do arquivo CSV/TXT
   * @param {File} file 
   * @returns {Promise<CSVRawData>}
   */
  static async extract(file) {
    try {
      console.log('📄 CSVExtractor: Iniciando extração de', file.name);
      
      // Ler conteúdo do arquivo
      const text = await file.text();
      const cleanText = this._cleanText(text);
      
      if (!cleanText.trim()) {
        throw new Error('Arquivo está vazio ou contém apenas espaços em branco');
      }
      
      // Analisar estrutura do CSV
      const analysis = this._analyzeCSVStructure(cleanText);
      
      // Dividir em linhas
      const lines = cleanText.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Nenhuma linha válida encontrada no arquivo');
      }
      
      const result = {
        rawText: cleanText,
        lines: lines,
        analysis: analysis,
        metadata: this.getMetadata(file, cleanText)
      };
      
      console.log('✅ CSVExtractor: Extração concluída', {
        totalLines: lines.length,
        separator: analysis.separator,
        hasHeader: analysis.hasHeader,
        columnCount: analysis.columnCount,
        formatType: analysis.formatType
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ CSVExtractor: Erro na extração:', error);
      throw new Error(`Erro ao extrair dados do CSV: ${error.message}`);
    }
  }
  
  /**
   * Valida os dados extraídos do CSV
   * @param {CSVRawData} rawData 
   * @returns {ValidationResult}
   */
  static validate(rawData) {
    const errors = [];
    const warnings = [];
    
    // Validações básicas
    if (!rawData.lines || rawData.lines.length === 0) {
      errors.push('Nenhuma linha encontrada no arquivo');
    }
    
    if (rawData.lines && rawData.lines.length < 2) {
      warnings.push('Arquivo tem apenas uma linha - pode não conter dados suficientes');
    }
    
    if (!rawData.analysis.separator) {
      errors.push('Não foi possível detectar o separador de colunas');
    }
    
    // Validação específica por formato
    if (rawData.analysis.formatType === 'bradesco') {
      if (rawData.analysis.columnCount < 5) {
        warnings.push('Formato Bradesco deve ter pelo menos 5 colunas (Data, Histórico, Docto, Crédito, Débito)');
      }
    } else {
      if (rawData.analysis.columnCount < 3) {
        warnings.push('Arquivo tem menos de 3 colunas - pode faltar dados essenciais (data, descrição, valor)');
      }
    }
    
    // Verificar consistência das colunas
    const inconsistentRows = this._checkColumnConsistency(rawData.lines, rawData.analysis.separator);
    if (inconsistentRows.length > 0) {
      warnings.push(`${inconsistentRows.length} linha(s) com número de colunas inconsistente`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * ✅ NOVA ASSINATURA: Converte dados brutos em transações COM CONTEXTO
   * @param {CSVRawData} rawData 
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
    
    console.log('🔄 CSVExtractor: Processando transações COM CONTEXTO', {
      totalLines: lines.length,
      formatType: analysis.formatType,
      separator: analysis.separator,
      tipoImportacao,
      contaId,
      cartaoId,
      faturaVencimento
    });
    
    // ✅ NOVA LÓGICA: Escolher parser baseado no formato detectado
    switch (analysis.formatType) {
      case 'bradesco':
        return this._parseBradescoFormat(rawData, context);
      case 'generic':
      default:
        return this._parseGenericFormat(rawData, context);
    }
  }
  
  /**
   * ✅ NOVO MÉTODO: Parser específico para formato Bradesco
   * @param {CSVRawData} rawData 
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
    
    const transacoes = [];
    const startIndex = analysis.hasHeader ? 1 : 0;
    const separator = analysis.separator;
    
    console.log('🏦 CSVExtractor: Processando formato BRADESCO', {
      startIndex,
      separator,
      colunas: analysis.columns,
      primeirasLinhas: lines.slice(0, 3)
    });
    
    // ✅ MAPEAR COLUNAS DINAMICAMENTE
    const columnMap = this._mapBradescoColumns(analysis.columns);
    console.log('🗂️ Mapeamento de colunas Bradesco:', columnMap);
    
    lines.slice(startIndex).forEach((line, index) => {
      try {
        const parts = line.split(separator).map(p => p.trim());
        
        console.log(`🔍 Linha ${index + 1}:`, parts);
        
        if (parts.length >= 5) {
          // ✅ USAR MAPEAMENTO DINÂMICO DE COLUNAS
          const dataStr = parts[columnMap.data] || '';
          const historico = parts[columnMap.historico] || '';
          const docto = parts[columnMap.docto] || '';
          const creditoStr = parts[columnMap.credito] || '0';
          const debitoStr = parts[columnMap.debito] || '0';
          const saldoStr = parts[columnMap.saldo] || '';
          
          console.log(`📊 Valores mapeados:`, {
            data: dataStr,
            historico: historico,
            docto: docto,
            credito: creditoStr,
            debito: debitoStr,
            saldo: saldoStr
          });
          
          if (dataStr && historico) {
            const data = this._parseDate(dataStr);
            const credito = this._parseValue(creditoStr) || 0;
            const debito = this._parseValue(debitoStr) || 0;
            
            console.log(`💰 Valores processados: credito=${credito}, debito=${debito}`);
            
            // ✅ LÓGICA BRADESCO: Se tem crédito, é receita; se tem débito, é despesa
            if (data && (credito > 0 || debito > 0)) {
              const isCredito = credito > 0;
              const valor = isCredito ? credito : debito;
              
              // ✅ APLICAR LÓGICA BASEADA NO CONTEXTO
              let tipoTransacao;
              if (tipoImportacao === 'cartao') {
                tipoTransacao = 'despesa'; // Para cartão, sempre despesa
              } else {
                tipoTransacao = isCredito ? 'receita' : 'despesa';
              }
              
              // ✅ APLICAR STATUS BASEADO NO CONTEXTO
              let efetivado;
              if (tipoImportacao === 'cartao') {
                efetivado = false; // Cartão sempre false
              } else {
                efetivado = new Date(data) <= new Date(); // Conta: efetivado se data <= hoje
              }
              
              // ✅ DESCRIÇÃO MELHORADA: Combinar histórico + docto se disponível
              let descricao = historico.trim();
              if (docto && docto.trim() && docto.trim() !== '0' && !descricao.includes(docto.trim())) {
                descricao += ` - Doc:${docto.trim()}`;
              }
              
              transacoes.push({
                id: startIndex + index + 1,
                data,
                descricao: descricao,
                valor: valor,
                tipo: tipoTransacao,
                categoria_id: '',
                categoriaTexto: '',
                subcategoria_id: '',
                subcategoriaTexto: '',
                // ✅ APLICAR CAMPOS BASEADOS NO CONTEXTO
                conta_id: tipoImportacao === 'conta' ? contaId : '',
                cartao_id: tipoImportacao === 'cartao' ? cartaoId : '',
                fatura_vencimento: tipoImportacao === 'cartao' ? faturaVencimento : '',
                efetivado: efetivado,
                observacoes: `Importado de extrato Bradesco - ${isCredito ? 'Crédito' : 'Débito'}`,
                origem: 'CSV-Bradesco',
                linhaBruta: line,
                indiceOriginal: startIndex + index + 1,
                // ✅ METADADOS ESPECÍFICOS DO BRADESCO
                bradesco: {
                  docto: docto,
                  credito: creditoStr,
                  debito: debitoStr,
                  saldo: saldoStr
                }
              });
              
              console.log(`✅ Transação Bradesco criada: ${data} | ${descricao} | ${tipoTransacao} | R$ ${valor.toFixed(2)}`);
            } else {
              console.log(`⚠️ Linha ignorada - sem valores válidos: credito=${credito}, debito=${debito}`);
            }
          } else {
            console.log(`⚠️ Linha ignorada - campos obrigatórios vazios: data="${dataStr}", historico="${historico}"`);
          }
        } else {
          console.log(`⚠️ Linha ignorada - colunas insuficientes: ${parts.length} < 5`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao processar linha Bradesco ${startIndex + index + 1}:`, error.message);
      }
    });
    
    console.log('✅ CSVExtractor: Transações Bradesco processadas:', {
      totalProcessadas: transacoes.length,
      receitas: transacoes.filter(t => t.tipo === 'receita').length,
      despesas: transacoes.filter(t => t.tipo === 'despesa').length
    });
    
    return transacoes;
  }
  
  /**
   * ✅ MÉTODO ORIGINAL: Parser genérico (mantém compatibilidade)
   * @param {CSVRawData} rawData 
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
    const startIndex = analysis.hasHeader ? 1 : 0;
    const separator = analysis.separator;
    
    console.log('📄 CSVExtractor: Processando formato GENÉRICO', {
      startIndex,
      separator
    });
    
    lines.slice(startIndex).forEach((line, index) => {
      try {
        const parts = line.split(separator).map(p => p.trim());
        
        if (parts.length >= 3) {
          // Assumir formato básico: Data, Descrição, Valor
          const [dataStr, descricao, valorStr, ...resto] = parts;
          
          if (dataStr && descricao && valorStr) {
            const data = this._parseDate(dataStr);
            const valor = this._parseValue(valorStr);
            
            if (data && !isNaN(valor) && valor !== 0) {
              // ✅ APLICAR LÓGICA BASEADA NO CONTEXTO
              let tipoTransacao;
              if (tipoImportacao === 'cartao') {
                tipoTransacao = 'despesa'; // Para cartão, sempre despesa
              } else {
                tipoTransacao = valor >= 0 ? 'receita' : 'despesa';
              }
              
              // ✅ APLICAR STATUS BASEADO NO CONTEXTO
              let efetivado;
              if (tipoImportacao === 'cartao') {
                efetivado = false; // Cartão sempre false
              } else {
                efetivado = new Date(data) <= new Date(); // Conta: efetivado se data <= hoje
              }
              
              transacoes.push({
                id: startIndex + index + 1,
                data,
                descricao: descricao.trim(),
                valor: Math.abs(valor),
                tipo: tipoTransacao,
                categoria_id: '',
                categoriaTexto: '',
                subcategoria_id: '',
                subcategoriaTexto: '',
                // ✅ APLICAR CAMPOS BASEADOS NO CONTEXTO
                conta_id: tipoImportacao === 'conta' ? contaId : '',
                cartao_id: tipoImportacao === 'cartao' ? cartaoId : '',
                fatura_vencimento: tipoImportacao === 'cartao' ? faturaVencimento : '',
                efetivado: efetivado,
                observacoes: resto.length > 0 ? resto.join(' ').trim() : '',
                origem: 'CSV',
                linhaBruta: line,
                indiceOriginal: startIndex + index + 1
              });
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao processar linha genérica ${startIndex + index + 1}:`, error.message);
      }
    });
    
    console.log('✅ CSVExtractor: Transações genéricas processadas:', {
      totalProcessadas: transacoes.length,
      receitas: transacoes.filter(t => t.tipo === 'receita').length,
      despesas: transacoes.filter(t => t.tipo === 'despesa').length
    });
    
    return transacoes;
  }
  
  /**
   * ✅ VERSÃO COMPATÍVEL: Mantém assinatura antiga
   * @param {CSVRawData} rawData 
   * @returns {Array<Transaction>}
   */
  static parseTransactionsLegacy(rawData) {
    return this.parseTransactions(rawData, {});
  }
  
  /**
   * ✅ VERSÃO MELHORADA: Analisa estrutura e detecta formato
   * @param {string} content 
   * @returns {CSVAnalysis}
   */
  static _analyzeCSVStructure(content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return {
        separator: ';',
        hasHeader: false,
        columnCount: 0,
        encoding: 'UTF-8',
        formatType: 'generic'
      };
    }
    
    // Detectar separador
    const separadores = [';', ',', '\t', '|'];
    let separador = ';';
    let maxColunas = 0;
    
    for (const sep of separadores) {
      const cols = lines[0]?.split(sep) || [];
      if (cols.length > maxColunas) {
        maxColunas = cols.length;
        separador = sep;
      }
    }
    
    // Analisar primeira linha para detectar cabeçalho e formato
    const firstLine = lines[0].toLowerCase();
    const columns = lines[0].split(separador).map(col => col.trim());
    
    // ✅ DETECÇÃO DE FORMATO BRADESCO
    const isBradescoFormat = this._detectBradescoFormat(firstLine, columns);
    
    // Detectar se tem cabeçalho
    const hasHeader = firstLine.includes('data') || 
                     firstLine.includes('date') || 
                     firstLine.includes('valor') || 
                     firstLine.includes('value') || 
                     firstLine.includes('descricao') || 
                     firstLine.includes('description') ||
                     firstLine.includes('histórico') ||
                     firstLine.includes('historico') ||
                     firstLine.includes('crédito') ||
                     firstLine.includes('credito') ||
                     firstLine.includes('débito') ||
                     firstLine.includes('debito');
    
    return {
      separator: separador,
      hasHeader: hasHeader,
      columnCount: maxColunas,
      encoding: 'UTF-8',
      formatType: isBradescoFormat ? 'bradesco' : 'generic',
      columns: columns,
      sampleRows: lines.slice(0, 5)
    };
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Mapeia colunas do formato Bradesco dinamicamente
   * @param {Array<string>} columns 
   * @returns {Object} Mapeamento de colunas
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
    
    // ✅ FUNÇÃO PARA NORMALIZAR TEXTO
    const normalizeText = (text) => {
      return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, '') // Remove caracteres especiais
        .trim();
    };
    
    console.log('🗂️ Mapeando colunas Bradesco:', {
      originalColumns: columns,
      normalizedColumns: columns.map(normalizeText)
    });
    
    // ✅ MAPEAMENTO INTELIGENTE baseado no nome das colunas (normalizado)
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
    
    console.log('🗂️ Mapeamento final:', map);
    return map;
  }

  /**
   * ✅ NOVA FUNÇÃO: Detecta formato Bradesco
   * @param {string} firstLine 
   * @param {Array<string>} columns 
   * @returns {boolean}
   */
  static _detectBradescoFormat(firstLine, columns) {
    console.log('🔍 Analisando detecção Bradesco:', {
      firstLine: firstLine,
      columns: columns,
      columnCount: columns.length
    });
    
    // ✅ NORMALIZAR TEXTO para remover acentos e caracteres especiais
    const normalizeText = (text) => {
      return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, '') // Remove caracteres especiais
        .trim();
    };
    
    const normalizedLine = normalizeText(firstLine);
    const normalizedColumns = columns.map(col => normalizeText(col));
    
    console.log('🔍 Texto normalizado:', {
      normalizedLine,
      normalizedColumns
    });
    
    // ✅ VERIFICAÇÕES MAIS FLEXÍVEIS
    const hasData = normalizedLine.includes('data');
    const hasHistorico = normalizedLine.includes('historico') || normalizedLine.includes('hist');
    const hasCredito = normalizedLine.includes('credito') || normalizedLine.includes('credit');
    const hasDebito = normalizedLine.includes('debito') || normalizedLine.includes('debit');
    const hasDocto = normalizedLine.includes('docto') || normalizedLine.includes('documento');
    const hasSaldo = normalizedLine.includes('saldo');
    
    // ✅ CONTAGEM DE INDICADORES
    const indicators = [hasData, hasHistorico, hasCredito, hasDebito, hasDocto, hasSaldo];
    const indicatorCount = indicators.filter(Boolean).length;
    
    // ✅ VERIFICAÇÃO POR ESTRUTURA DE COLUNAS (fallback)
    const hasMinimumColumns = columns.length >= 5;
    const hasTypicalColumnCount = columns.length === 6; // Data,Hist,Docto,Cred,Deb,Saldo
    
    // ✅ LÓGICA DE DETECÇÃO: deve ter pelo menos 3 indicadores OU estrutura típica
    const detectedByIndicators = indicatorCount >= 3;
    const detectedByStructure = hasMinimumColumns && hasTypicalColumnCount;
    const detected = detectedByIndicators || detectedByStructure;
    
    console.log('🔍 Detecção formato Bradesco:', {
      hasData,
      hasHistorico, 
      hasCredito,
      hasDebito,
      hasDocto,
      hasSaldo,
      indicatorCount,
      hasMinimumColumns,
      hasTypicalColumnCount,
      detectedByIndicators,
      detectedByStructure,
      columnCount: columns.length,
      detected: detected
    });
    
    return detected;
  }
  
  /**
   * Verifica consistência do número de colunas
   * @param {Array<string>} lines 
   * @param {string} separator 
   * @returns {Array<number>} Índices das linhas inconsistentes
   */
  static _checkColumnConsistency(lines, separator) {
    if (lines.length === 0) return [];
    
    const expectedColumns = lines[0].split(separator).length;
    const inconsistentRows = [];
    
    lines.forEach((line, index) => {
      const columnCount = line.split(separator).length;
      if (columnCount !== expectedColumns) {
        inconsistentRows.push(index + 1); // 1-based para usuário
      }
    });
    
    return inconsistentRows;
  }
  
  /**
   * Parser de data
   * @param {string} dateStr 
   * @returns {string} Data no formato YYYY-MM-DD
   */
  static _parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Remover espaços e caracteres especiais desnecessários
    const cleaned = dateStr.trim().replace(/[^\d\/\-\.]/g, '');
    
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
      /^(\d{2})-(\d{2})-(\d{4})$/,   // DD-MM-YYYY
      /^(\d{2})\.(\d{2})\.(\d{4})$/  // DD.MM.YYYY
    ];
    
    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      const match = cleaned.match(format);
      
      if (match) {
        if (i === 1) {
          // YYYY-MM-DD (já no formato correto)
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
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
      }
    }
    
    // Se não conseguiu parsear, tentar Date.parse como fallback
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      // Ignorar erro do fallback
    }
    
    console.warn(`⚠️ Não foi possível parsear a data: "${dateStr}"`);
    return null;
  }
  
  /**
   * Parser de valor
   * @param {string} valueStr 
   * @returns {number} Valor numérico
   */
  static _parseValue(valueStr) {
    if (!valueStr) return 0;
    
    // Converter para string e limpar
    let cleaned = valueStr.toString().trim();
    
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
    
    // Detectar formato brasileiro (1.234,56) vs americano (1,234.56)
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
   * Gera estatísticas dos dados extraídos
   * @param {CSVRawData} rawData 
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
      separator: rawData.analysis.separator,
      encoding: rawData.analysis.encoding,
      formatType: rawData.analysis.formatType
    };
  }
}

/**
 * @typedef {Object} ImportContext
 * @property {string} tipoImportacao - 'conta' ou 'cartao'
 * @property {string} contaId - ID da conta (se tipo='conta')
 * @property {string} cartaoId - ID do cartão (se tipo='cartao')
 * @property {string} faturaVencimento - Data de vencimento da fatura (se tipo='cartao')
 */

/**
 * @typedef {Object} CSVRawData
 * @property {string} rawText - Texto bruto do arquivo
 * @property {Array<string>} lines - Linhas do arquivo
 * @property {CSVAnalysis} analysis - Análise da estrutura
 * @property {FileMetadata} metadata - Metadados do arquivo
 */

/**
 * @typedef {Object} CSVAnalysis
 * @property {string} separator - Separador detectado
 * @property {boolean} hasHeader - Se tem linha de cabeçalho
 * @property {number} columnCount - Número de colunas
 * @property {string} encoding - Encoding detectado
 * @property {string} formatType - Tipo de formato detectado ('generic', 'bradesco')
 * @property {Array<string>} columns - Nomes das colunas
 * @property {Array<string>} sampleRows - Primeiras linhas para preview
 */

export default CSVExtractor;