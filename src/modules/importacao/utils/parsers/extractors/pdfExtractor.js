// src/modules/importacao/utils/parsers/extractors/pdfExtractor.js
// Extractor para arquivos PDF - VERSÃO HÍBRIDA MULTI-FORMATO CORRIGIDA

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
   * ✅ FUNÇÃO HÍBRIDA CORRIGIDA - Funciona com múltiplos formatos
   * @param {PDFRawData} rawData 
   * @returns {Array<Transaction>}
   */
  static parseTransactions(rawData) {
    const { rawText } = rawData;
    
    console.log('🔄 PDFExtractor: Analisando transações - VERSÃO HÍBRIDA CORRIGIDA');
    console.log('📄 Texto total extraído:', rawText.length, 'caracteres');
    
    // Detectar formato do PDF
    const formato = this._detectarFormato(rawText);
    console.log('📋 Formato detectado:', formato);
    
    // Usar parser apropriado
    if (formato === 'fatura_cartao') {
      return this._analisarFaturaCartao(rawText);
    } else if (formato === 'tabular') {
      return this._analisarTransacoesTabular(rawText);
    } else {
      return this._analisarTransacoesLinear(rawText);
    }
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Detecta o formato do PDF
   * @param {string} texto 
   * @returns {string}
   */
  static _detectarFormato(texto) {
    const linhas = texto.split('\n');
    let scoreFaturaCartao = 0;
    let scoreTabular = 0;
    let scoreLinear = 0;
    
    for (const linha of linhas) {
      const linhaNorm = linha.toLowerCase().trim();
      
      // Indicadores de fatura de cartão (novo padrão identificado)
      if (/\d{2}\/\d{2}\s+[A-Z\s]+\d{1,3}(?:\.\d{3})*,\d{2}/.test(linha)) {
        scoreFaturaCartao += 3;
      }
      if (/estabelecimento|alimentação|vestuário|hobby|saúde/.test(linhaNorm)) {
        scoreFaturaCartao += 2;
      }
      if (/mastercard|visa|cartão/.test(linhaNorm)) {
        scoreFaturaCartao += 2;
      }
      if (/^\s+[A-Z\s]+\.[A-Z\s]+/.test(linha)) { // Linha de categoria indentada
        scoreFaturaCartao += 2;
      }
      
      // Indicadores de formato tabular (outros formatos)
      if (/\d{1,2}\s*\/\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+.+?\s+R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/i.test(linha)) {
        scoreTabular += 2;
      }
      if (/data\s+lançamento\s+valor/i.test(linha)) {
        scoreTabular += 3;
      }
      
      // Indicadores de formato linear (formato antigo)
      if (/\d{2}\/\d{2}\s+[A-Z\s]+\d{2}\/\d{2}\s+\d{1,3}(?:\.\d{3})*,\d{2}/.test(linha)) {
        scoreLinear += 2;
      }
      if (/DATA\s+ESTABELECIMENTO\s+VALOR/i.test(linha)) {
        scoreLinear += 3;
      }
    }
    
    console.log('🔍 Scores de formato:', { scoreFaturaCartao, scoreTabular, scoreLinear });
    
    if (scoreFaturaCartao > scoreTabular && scoreFaturaCartao > scoreLinear) {
      return 'fatura_cartao';
    } else if (scoreTabular > scoreLinear) {
      return 'tabular';
    } else {
      return 'linear';
    }
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Parser específico para fatura de cartão (baseado no PDF enviado)
   * @param {string} texto 
   * @returns {Array}
   */
  static _analisarFaturaCartao(texto) {
    const transacoes = [];
    
    console.log('💳 Analisando FATURA DE CARTÃO');
    console.log('📄 Primeiros 500 caracteres do texto:');
    console.log(texto.substring(0, 500));
    
    // ✅ USAR REGEX GLOBAL NO TEXTO INTEIRO ao invés de processar linha por linha
    // Padrões para capturar transações diretamente do texto completo
    const padroes = [
      // Padrão 1: DD/MM ESTABELECIMENTO VALOR (formato principal)
      /(\d{2}\/\d{2})\s+([A-Z][A-Z\s\*\-\.0-9]+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
      
      // Padrão 2: DD/MM ESTABELECIMENTO VALOR com possíveis caracteres especiais
      /(\d{2}\/\d{2})\s+([A-Z\*][A-Z\s\*\-\.0-9\/]+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
      
      // Padrão 3: Mais flexível para capturar estabelecimentos com números
      /(\d{2}\/\d{2})\s+([A-Z][A-Z\s\*\-\.0-9\/]{3,50}?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g
    ];
    
    console.log('🔍 Testando padrões regex...');
    
    for (let p = 0; p < padroes.length; p++) {
      const padrao = padroes[p];
      console.log(`\n🔍 Testando padrão ${p + 1}:`, padrao);
      
      const matches = [...texto.matchAll(padrao)];
      console.log(`   Encontrados ${matches.length} matches`);
      
      for (const match of matches) {
        try {
          const [textoCompleto, data, estabelecimento, valorStr] = match;
          
          console.log(`   📝 Match bruto: "${textoCompleto}"`);
          console.log(`   📅 Data: "${data}"`);
          console.log(`   🏪 Estabelecimento bruto: "${estabelecimento}"`);
          console.log(`   💰 Valor: "${valorStr}"`);
          
          // Limpar estabelecimento
          const estabelecimentoLimpo = this._limparEstabelecimento(estabelecimento);
          console.log(`   🧹 Estabelecimento limpo: "${estabelecimentoLimpo}"`);
          
          if (!this._isValidEstabelecimento(estabelecimentoLimpo)) {
            console.log(`   ❌ Estabelecimento inválido: "${estabelecimentoLimpo}"`);
            continue;
          }
          
          const valor = this._parseValue(valorStr);
          if (valor <= 0) {
            console.log(`   ❌ Valor inválido: ${valor}`);
            continue;
          }
          
          const dataFormatada = this._converterDataCartao(data);
          
          // ✅ NÃO capturar categoria - deixar sempre vazio conforme solicitado
          const categoria = ''; // Sempre vazio
          
          console.log(`   📂 Categoria: deixada vazia conforme solicitado`);
          
          const transacao = {
            id: Date.now() + Math.random(),
            data: dataFormatada,
            descricao: estabelecimentoLimpo,
            valor: Math.abs(valor),
            tipo: 'despesa',
            categoria_id: '',
            categoriaTexto: '', // Sempre vazio
            subcategoria_id: '',
            subcategoriaTexto: '',
            conta_id: '',
            efetivado: true,
            observacoes: 'Importado via PDF (fatura cartão)',
            origem: 'PDF',
            validada: false
          };
          
          transacoes.push(transacao);
          
          console.log(`   ✅ Transação criada: ${dataFormatada} | ${estabelecimentoLimpo} | R$ ${valor}`);
          
        } catch (error) {
          console.warn('⚠️ Erro ao processar match de fatura:', error.message);
        }
      }
      
      // Se encontrou transações com este padrão, parar de testar outros
      if (transacoes.length > 0) {
        console.log(`✅ Padrão ${p + 1} funcionou! Encontradas ${transacoes.length} transações`);
        break;
      }
    }
    
    // ✅ FALLBACK: Se não encontrou nada, tentar padrão mais simples
    if (transacoes.length === 0) {
      console.log('🔄 Tentando padrão fallback mais simples...');
      
      const fallbackPadrao = /(\d{2}\/\d{2})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g;
      const fallbackMatches = [...texto.matchAll(fallbackPadrao)];
      
      console.log(`🔍 Padrão fallback encontrou ${fallbackMatches.length} matches`);
      
      for (const match of fallbackMatches.slice(0, 10)) { // Limitar a 10 para evitar spam
        const [textoCompleto, data, estabelecimento, valorStr] = match;
        
        const estabelecimentoLimpo = this._limparEstabelecimento(estabelecimento);
        
        if (this._isValidEstabelecimento(estabelecimentoLimpo) && 
            !this._isHeaderOrFooter(textoCompleto)) {
          
          const valor = this._parseValue(valorStr);
          if (valor > 0) {
            console.log(`🎯 Fallback match: ${data} | ${estabelecimentoLimpo} | ${valorStr}`);
            
            transacoes.push({
              id: Date.now() + Math.random(),
              data: this._converterDataCartao(data),
              descricao: estabelecimentoLimpo,
              valor: Math.abs(valor),
              tipo: 'despesa',
              categoria_id: '',
              categoriaTexto: '', // Sempre vazio
              subcategoria_id: '',
              subcategoriaTexto: '',
              conta_id: '',
              efetivado: true,
              observacoes: 'Importado via PDF (fatura cartão - fallback)',
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
   * ✅ FUNÇÃO MELHORADA: Parser para formato tabular (outros formatos)
   * @param {string} texto 
   * @returns {Array}
   */
  static _analisarTransacoesTabular(texto) {
    const transacoes = [];
    
    console.log('📋 Analisando formato TABULAR');
    
    // Padrões mais específicos para formato tabular
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
      }
    ];
    
    for (const padrao of padroes) {
      const matches = [...texto.matchAll(padrao.regex)];
      
      for (const match of matches) {
        try {
          const dia = match[padrao.grupos.dia].padStart(2, '0');
          const mesAbrev = match[padrao.grupos.mes].toLowerCase();
          const descricao = match[padrao.grupos.descricao].trim();
          const valorStr = match[padrao.grupos.valor];
          
          // Converter mês abreviado para número
          const meses = {
            'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
            'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
            'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
          };
          
          const mes = meses[mesAbrev];
          if (!mes) continue;
          
          const descricaoLimpa = this._limparDescricao(descricao);
          if (!this._isValidDescription(descricaoLimpa)) continue;
          
          const valor = this._parseValue(valorStr);
          if (valor <= 0) continue;
          
          const anoAtual = new Date().getFullYear();
          const dataFormatada = `${anoAtual}-${mes}-${dia}`;
          const tipo = valor >= 0 ? 'despesa' : 'receita';
          
          transacoes.push({
            id: Date.now() + Math.random(),
            data: dataFormatada,
            descricao: descricaoLimpa,
            valor: Math.abs(valor),
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
          console.warn('⚠️ Erro ao processar match tabular:', error.message);
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
   * ✅ FUNÇÃO MELHORADA: Limpa nome do estabelecimento
   * @param {string} estabelecimento 
   * @returns {string}
   */
  static _limparEstabelecimento(estabelecimento) {
    return estabelecimento
      .replace(/\d{1,3}(?:\.\d{3})*,\d{2}.*$/, '') // Remove valor monetário e tudo após
      .replace(/R\$.*$/, '') // Remove R$ e tudo após
      .replace(/\s+(ALIMENTAÇÃO|VESTUÁRIO|HOBBY|SAÚDE|DIVERSOS|VEÍCULOS|TURISMO).*$/i, '') // Remove categorias conhecidas
      .replace(/\s+\.[A-Z\s]+$/, '') // Remove categorias com ponto
      .replace(/\s+\d{2}\/\d{2}.*$/, '') // Remove datas extras
      .replace(/\s{2,}/g, ' ') // Normaliza espaços múltiplos
      .trim()
      .substring(0, 100); // Limita tamanho
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Valida nome do estabelecimento
   * @param {string} estabelecimento 
   * @returns {boolean}
   */
  static _isValidEstabelecimento(estabelecimento) {
    if (!estabelecimento || estabelecimento.length < 2) return false;
    
    // Rejeitar se contém apenas números ou caracteres especiais
    if (/^[\d\s\.,\-\*]*$/.test(estabelecimento)) return false;
    
    // Rejeitar headers e footers conhecidos
    const invalidPatterns = [
      /^(data|estabelecimento|valor|total|subtotal)/i,
      /^(lançamento|compra|saque)/i,
      /^ismael/i,
      /^(continua|pc\s*-|personalité)/i,
      /^(limite|encargo|juros)/i,
      /^(mastercard|visa|cartão)/i,
      /^(titular|final)/i,
      /^[A-Z]{2,}\s*\d+/, // Códigos como "VK045"
      /^\d{5,}/, // Códigos numéricos longos
      /^(com|sem)\s+(seguro|vencimento)/i,
      /^(pagamento|parcela)/i
    ];
    
    // Deve ter pelo menos uma letra
    if (!/[A-Za-z]/.test(estabelecimento)) return false;
    
    return !invalidPatterns.some(pattern => pattern.test(estabelecimento));
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Converte data de cartão (DD/MM para YYYY-MM-DD)
   * @param {string} dataStr 
   * @returns {string}
   */
  static _converterDataCartao(dataStr) {
    const [dia, mes] = dataStr.split('/');
    const anoAtual = new Date().getFullYear();
    return `${anoAtual}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  /**
   * ✅ NOVA FUNÇÃO: Cria objeto de transação padronizada
   * @param {Object} dadosTransacao 
   * @returns {Object}
   */
  static _criarTransacao(dadosTransacao) {
    const { data, estabelecimento, valor } = dadosTransacao;
    
    // Para cartão de crédito, todas são despesas
    const tipo = 'despesa';
    
    return {
      id: Date.now() + Math.random(),
      data: data,
      descricao: estabelecimento,
      valor: Math.abs(valor),
      tipo: tipo,
      categoria_id: '',
      categoriaTexto: '', // Sempre vazio conforme solicitado
      subcategoria_id: '',
      subcategoriaTexto: '',
      conta_id: '',
      efetivado: true,
      observacoes: 'Importado via PDF (fatura cartão)',
      origem: 'PDF',
      validada: false
    };
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Verifica se linha é cabeçalho ou rodapé
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
      /fatura/i,
      /^(continua|pc\s*-|personalité)/i,
      /^\d{10,}/, // Códigos longos
      /^[A-Z]{2,}\s*\d+\s*[A-Z]+/, // Códigos tipo "VK045"
      /limite|encargo|juros/i
    ];
    
    return excludePatterns.some(pattern => pattern.test(linhaNorm)) || linhaNorm.length < 5;
  }
  
  /**
   * ✅ FUNÇÃO MELHORADA: Limpa descrição
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
   * ✅ FUNÇÃO MELHORADA: Valida descrição
   * @param {string} descricao 
   * @returns {boolean}
   */
  static _isValidDescription(descricao) {
    if (!descricao || descricao.length < 3) return false;
    
    const invalidPatterns = [
      /^(total|subtotal|saldo|data|valor)/i,
      /^\d+$/,
      /^[^a-zA-Z]*$/,
      /^(lançamento|compra)/i
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
    
    // Formato brasileiro: 1.234,56
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
   * ✅ FUNÇÃO MELHORADA: Finaliza processamento das transações
   * @param {Array} transacoes 
   * @returns {Array}
   */
  static _finalizarTransacoes(transacoes) {
    // Remover duplicatas
    const transacoesUnicas = transacoes.filter((transacao, index, self) => 
      index === self.findIndex(t => 
        t.data === transacao.data && 
        t.descricao === transacao.descricao && 
        Math.abs(t.valor - transacao.valor) < 0.01 // Comparação de float com tolerância
      )
    );

    console.log('📊 Resultado da análise híbrida corrigida:', {
      totalEncontradas: transacoes.length,
      totalUnicas: transacoesUnicas.length,
      duplicatasRemovidas: transacoes.length - transacoesUnicas.length
    });

    // Mostrar amostra das transações processadas
    if (transacoesUnicas.length > 0) {
      console.log('🔍 Amostra das transações processadas:');
      transacoesUnicas.slice(0, 5).forEach((t, i) => {
        console.log(`  ${i+1}. ${t.data} | ${t.descricao} | R$ ${t.valor.toFixed(2)} | ${t.tipo}`);
      });
    }

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