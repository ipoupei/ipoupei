// src/modules/importacao/utils/parsers/extractors/pdfExtractor.js
// Extractor para arquivos PDF - VERSÃO HÍBRIDA MULTI-FORMATO

import { BaseExtractor } from './baseExtractor.js';
import { loadPDFJS, isPDFJSReady } from './pdfLoader.js';

/**
 * Extractor para arquivos PDF com suporte a múltiplos formatos
 * Suporta tanto layout tabular quanto linear
 */
export class PDFExtractor extends BaseExtractor {
  /**
   * Verifica se pode processar o arquivo
   * @param {File} file 
   * @returns {boolean}
   */
  static canHandle(file) {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    return fileName.endsWith('.pdf') || fileType.includes('pdf');
  }
  
  /**
   * Extrai dados brutos do arquivo PDF
   * @param {File} file 
   * @returns {Promise<PDFRawData>}
   */
  static async extract(file) {
    try {
      console.log('📄 PDFExtractor: Iniciando extração de', file.name);   
      
      // Verificar/carregar PDF.js automaticamente
      if (typeof window === 'undefined' || !window.pdfjsLib) {
        const { loadPDFJS } = await import('./pdfLoader.js');
        await loadPDFJS();
      }      
      
      // Configurar worker se necessário
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textoCompleto = '';

      console.log('📖 PDF carregado:', {
        numPages: pdf.numPages,
        fingerprint: pdf.fingerprint
      });

      // Extrair texto de todas as páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`📄 Processando página ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + '\n';
      }

      if (!textoCompleto.trim()) {
        throw new Error('Nenhum texto foi extraído do PDF');
      }

      console.log('✅ PDFExtractor: Extração concluída', {
        totalPages: pdf.numPages,
        totalTextLength: textoCompleto.length,
        linesExtracted: textoCompleto.split('\n').length
      });

      // ✅ DEBUG: Mostrar primeiras linhas extraídas
      const linhasDebug = textoCompleto.split('\n').slice(0, 20);
      console.log('🔍 DEBUG - Primeiras 20 linhas extraídas:');
      linhasDebug.forEach((linha, i) => {
        console.log(`${i+1}: "${linha}"`);
      });

      return {
        rawText: textoCompleto,
        metadata: this.getMetadata(file, textoCompleto)
      };
      
    } catch (error) {
      console.error('❌ PDFExtractor: Erro na extração:', error);
      throw new Error(`Erro ao extrair dados do PDF: ${error.message}`);
    }
  }
  
  /**
   * Valida os dados extraídos do PDF
   * @param {PDFRawData} rawData 
   * @returns {ValidationResult}
   */
  static validate(rawData) {
    const errors = [];
    const warnings = [];
    
    if (!rawData.rawText || rawData.rawText.trim().length === 0) {
      errors.push('Nenhum texto foi extraído do PDF');
    }
    
    if (rawData.rawText && rawData.rawText.length < 100) {
      warnings.push('Texto extraído é muito curto - pode não conter dados suficientes');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * ✅ FUNÇÃO HÍBRIDA - Funciona com múltiplos formatos
   * @param {PDFRawData} rawData 
   * @returns {Array<Transaction>}
   */
  static parseTransactions(rawData) {
    const { rawText } = rawData;
    
    console.log('🔄 PDFExtractor: Analisando transações - VERSÃO HÍBRIDA');
    console.log('📄 Texto total extraído:', rawText.length, 'caracteres');
    
    // Detectar formato do PDF
    const formato = this._detectarFormato(rawText);
    console.log('📋 Formato detectado:', formato);
    
    // Usar parser apropriado
    if (formato === 'tabular') {
      return this._analisarTransacoesTabular(rawText);
    } else {
      return this._analisarTransacoesLinear(rawText);
    }
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Detecta o formato do PDF
   * @param {string} texto 
   * @returns {string}
   */
  static _detectarFormato(texto) {
    const linhas = texto.split('\n');
    let scoreTabular = 0;
    let scoreLinear = 0;
    
    for (const linha of linhas) {
      // Indicadores de formato tabular (novo formato)
      if (/\d{1,2}\s*\/\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+.+?\s+R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/i.test(linha)) {
        scoreTabular += 2;
      }
      if (/data\s+lançamento\s+valor/i.test(linha)) {
        scoreTabular += 3;
      }
      if (/\|\s*R\$/.test(linha)) {
        scoreTabular += 1;
      }
      
      // Indicadores de formato linear (formato antigo que funciona)
      if (/\d{2}\/\d{2}\s+[A-Z\s]+\d{2}\/\d{2}\s+\d{1,3}(?:\.\d{3})*,\d{2}/.test(linha)) {
        scoreLinear += 2;
      }
      if (/DATA\s+ESTABELECIMENTO\s+VALOR/i.test(linha)) {
        scoreLinear += 3;
      }
    }
    
    console.log('🔍 Scores de formato:', { scoreTabular, scoreLinear });
    
    return scoreTabular > scoreLinear ? 'tabular' : 'linear';
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Parser para formato tabular (novo formato) - MELHORADO
   * @param {string} texto 
   * @returns {Array}
   */
  static _analisarTransacoesTabular(texto) {
    const transacoes = [];
    const linhas = texto.split('\n');
    
    console.log('📋 Analisando formato TABULAR -', linhas.length, 'linhas');
    
    // ✅ DEBUG: Mostrar todas as linhas para entender o formato
    console.log('🔍 DEBUG - Todas as linhas:');
    linhas.forEach((linha, i) => {
      if (linha.trim().length > 0) {
        console.log(`${i+1}: "${linha.trim()}"`);
      }
    });
    
    // ✅ PADRÕES MAIS FLEXÍVEIS para formato tabular
    const padroes = [
      // Padrão 1: DD / MMM DESCRIÇÃO R$ VALOR
      {
        regex: /(\d{1,2})\s*\/\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+(.+?)\s+R\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
        grupos: { dia: 1, mes: 2, descricao: 3, valor: 4 }
      },
      // Padrão 2: DD / MMM DESCRIÇÃO VALOR (sem R$)
      {
        regex: /(\d{1,2})\s*\/\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/gi,
        grupos: { dia: 1, mes: 2, descricao: 3, valor: 4 }
      },
      // Padrão 3: Formato com hífen negativo
      {
        regex: /(\d{1,2})\s*\/\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+(.+?)\s+-\s*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
        grupos: { dia: 1, mes: 2, descricao: 3, valor: 4, isNegativo: true }
      },
      // ✅ NOVO Padrão 4: Busca mais ampla - qualquer coisa com data e valor
      {
        regex: /(\d{1,2})\s*\/\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+(.{3,100}?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
        grupos: { dia: 1, mes: 2, descricao: 3, valor: 4 }
      },
      // ✅ NOVO Padrão 5: Formato alternativo com espaços múltiplos
      {
        regex: /(\d{1,2})\s*\/\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s{2,}(.+?)\s{2,}(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
        grupos: { dia: 1, mes: 2, descricao: 3, valor: 4 }
      }
    ];
    
    // ✅ BUSCAR EM TODO O TEXTO, NÃO SÓ LINHA POR LINHA
    for (const padrao of padroes) {
      console.log(`🔍 Testando padrão: ${padrao.regex}`);
      const matches = [...texto.matchAll(padrao.regex)];
      console.log(`   Encontrados ${matches.length} matches`);
      
      for (const match of matches) {
        try {
          const dia = match[padrao.grupos.dia].padStart(2, '0');
          const mesAbrev = match[padrao.grupos.mes].toLowerCase();
          const descricao = match[padrao.grupos.descricao].trim();
          const valorStr = match[padrao.grupos.valor];
          
          console.log(`   📝 Match encontrado: ${dia}/${mesAbrev} | ${descricao} | ${valorStr}`);
          
          // Converter mês abreviado para número
          const meses = {
            'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
            'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
            'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
          };
          
          const mes = meses[mesAbrev];
          if (!mes) {
            console.log(`   ❌ Mês inválido: ${mesAbrev}`);
            continue;
          }
          
          // Limpar e processar dados
          const descricaoLimpa = this._limparDescricao(descricao);
          if (!this._isValidDescription(descricaoLimpa)) {
            console.log(`   ❌ Descrição inválida: "${descricaoLimpa}"`);
            continue;
          }
          
          const valor = this._parseValue(valorStr);
          if (valor <= 0) {
            console.log(`   ❌ Valor inválido: ${valor}`);
            continue;
          }
          
          // Determinar data completa (assumir ano atual)
          const anoAtual = new Date().getFullYear();
          const dataFormatada = `${anoAtual}-${mes}-${dia}`;
          
          // Determinar tipo
          const isNegativo = padrao.grupos.isNegativo || valorStr.includes('-');
          const tipo = isNegativo ? 'receita' : 'despesa'; // Para cartão, crédito é receita
          
          console.log(`   ✅ Transação válida: ${dataFormatada} | ${descricaoLimpa} | ${valor} | ${tipo}`);
          
          transacoes.push({
            id: Date.now() + Math.random(),
            data: dataFormatada,
            descricao: descricaoLimpa,
            valor: valor,
            tipo: tipo,
            categoria_id: '',
            categoriaTexto: '',
            subcategoria_id: '',
            subcategoriaTexto: '',
            conta_id: '',
            efetivado: true,
            observacoes: 'Importado via PDF (formato tabular)',
            origem: 'PDF',
            validada: false
          });
          
        } catch (error) {
          console.warn('⚠️ Erro ao processar match tabular:', match[0], error.message);
        }
      }
    }
    
    return this._finalizarTransacoes(transacoes);
  }
  
  /**
   * ✅ FUNÇÃO ORIGINAL: Parser para formato linear (formato antigo)
   * @param {string} texto 
   * @returns {Array}
   */
  static _analisarTransacoesLinear(texto) {
    const transacoes = [];
    const linhas = texto.split('\n');
    
    console.log('📋 Analisando formato LINEAR -', linhas.length, 'linhas');
    
    // Padrões originais que funcionam
    const padroes = [
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([+-]?\d{1,3}(?:\.\d{3})*,\d{2})/g,
      /(\d{2}\/\d{2})\s+(.+?)\s+([+-]?\d{1,3}(?:\.\d{3})*,\d{2})/g,
      /([+-]?\d{1,3}(?:\.\d{3})*,\d{2})\s+(.+?)\s+(\d{2}\/\d{2})/g,
    ];

    for (const linha of linhas) {
      for (const padrao of padroes) {
        const matches = [...linha.matchAll(padrao)];
        
        for (const match of matches) {
          let data, descricao, valor;
          
          if (padrao === padroes[0]) {
            [, data, descricao, valor] = match;
          } else if (padrao === padroes[1]) {
            [, data, descricao, valor] = match;
            data = data + '/' + new Date().getFullYear();
          } else if (padrao === padroes[2]) {
            [, valor, descricao, data] = match;
            data = data + '/' + new Date().getFullYear();
          }

          descricao = descricao.trim().replace(/\s+/g, ' ');
          valor = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
          
          const tipo = valor >= 0 ? 'receita' : 'despesa';
          valor = Math.abs(valor);

          if (valor > 0 && descricao.length > 3) {
            transacoes.push({
              id: Date.now() + Math.random(),
              data: this._converterData(data),
              descricao: descricao,
              valor: valor,
              tipo: tipo,
              categoria_id: '',
              categoriaTexto: '',
              subcategoria_id: '',
              subcategoriaTexto: '',
              conta_id: '',
              efetivado: true,
              observacoes: 'Importado via PDF (formato linear)',
              origem: 'PDF',
              validada: false
            });
          }
        }
      }
    }
    
    return this._finalizarTransacoes(transacoes);
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Verifica se linha é cabeçalho ou rodapé
   * @param {string} linha 
   * @returns {boolean}
   */
  static _isHeaderOrFooter(linha) {
    const linhaNorm = linha.toLowerCase().trim();
    
    const excludePatterns = [
      /^(data|lançamento|valor|estabelecimento)/i,
      /^(total|subtotal|saldo)/i,
      /cartão.*final/i,
      /página\s*\d+/i,
      /titular/i,
      /^ismael da s/i,
      /mastercard|visa/i,
      /^\s*-?\s*$/,
      /fatura/i
    ];
    
    return excludePatterns.some(pattern => pattern.test(linhaNorm)) || linhaNorm.length < 5;
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Limpa descrição
   * @param {string} descricao 
   * @returns {string}
   */
  static _limparDescricao(descricao) {
    return descricao
      .replace(/R\$\s*[\d.,]+/g, '') // Remove valores monetários
      .replace(/\d{2}\/\d{2}(?:\/\d{4})?/g, '') // Remove datas
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Valida descrição
   * @param {string} descricao 
   * @returns {boolean}
   */
  static _isValidDescription(descricao) {
    if (!descricao || descricao.length < 3) return false;
    
    const invalidPatterns = [
      /^(total|subtotal|saldo|data|valor)/i,
      /^\d+$/,
      /^[^a-zA-Z]*$/
    ];
    
    return !invalidPatterns.some(pattern => pattern.test(descricao));
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Parse de valor
   * @param {string} valorStr 
   * @returns {number}
   */
  static _parseValue(valorStr) {
    if (!valorStr) return 0;
    
    let valorLimpo = valorStr
      .replace(/R\$/g, '')
      .replace(/[^\d,.-]/g, '')
      .trim();
    
    const isNegativo = valorStr.includes('-') || valorStr.includes('(');
    valorLimpo = valorLimpo.replace(/[-()]/g, '');
    
    if (/\d+\.\d{3},\d{2}$/.test(valorLimpo) || /\d+,\d{2}$/.test(valorLimpo)) {
      valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
    }
    
    const valor = parseFloat(valorLimpo) || 0;
    return isNegativo ? -valor : valor;
  }
  
  /**
   * ✅ FUNÇÃO ORIGINAL: Converter data
   * @param {string} dataStr 
   * @returns {string}
   */
  static _converterData(dataStr) {
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
    return dataStr;
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Finaliza processamento das transações
   * @param {Array} transacoes 
   * @returns {Array}
   */
  static _finalizarTransacoes(transacoes) {
    // Remover duplicatas
    const transacoesUnicas = transacoes.filter((transacao, index, self) => 
      index === self.findIndex(t => 
        t.data === transacao.data && 
        t.descricao === transacao.descricao && 
        t.valor === transacao.valor
      )
    );

    console.log('📊 Resultado da análise híbrida:', {
      totalEncontradas: transacoes.length,
      totalUnicas: transacoesUnicas.length,
      duplicatasRemovidas: transacoes.length - transacoesUnicas.length
    });

    return transacoesUnicas.sort((a, b) => new Date(a.data) - new Date(b.data));
  }
  
  /**
   * Gera estatísticas dos dados extraídos do PDF
   * @param {PDFRawData} rawData 
   * @returns {Object}
   */
  static getStatistics(rawData) {
    const transactions = this.parseTransactions(rawData);
    const totalReceitas = transactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const totalDespesas = transactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
    
    return {
      totalTextLength: rawData.rawText.length,
      totalLines: rawData.rawText.split('\n').length,
      parsedTransactions: transactions.length,
      totalReceitas: totalReceitas,
      totalDespesas: totalDespesas,
      saldoLiquido: totalReceitas - totalDespesas,
      receitas: transactions.filter(t => t.tipo === 'receita').length,
      despesas: transactions.filter(t => t.tipo === 'despesa').length
    };
  }
}

export default PDFExtractor;