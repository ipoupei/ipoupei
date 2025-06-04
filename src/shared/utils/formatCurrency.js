// src/utils/formatCurrency.js - Versão corrigida e robusta

/**
 * Formata um valor numérico para moeda brasileira (BRL)
 * Versão corrigida que resolve problemas de formatação
 * 
 * @param {number|string} value - Valor a ser formatado
 * @param {Object} options - Opções de formatação
 * @returns {string} Valor formatado em BRL
 */
export const formatCurrency = (value, options = {}) => {
  // Configurações padrão
  const defaultOptions = {
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    showSymbol: true,
    locale: 'pt-BR'
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    // Converter para número, tratando diferentes tipos de entrada
    let numericValue;
    
    if (typeof value === 'string') {
      // Remove espaços e substitui vírgula por ponto
      const cleanValue = value.trim().replace(',', '.');
      numericValue = parseFloat(cleanValue);
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      numericValue = 0;
    }
    
    // Verificar se é um número válido
    if (isNaN(numericValue) || !isFinite(numericValue)) {
      numericValue = 0;
    }
    
    // Formatação usando Intl.NumberFormat
    const formatter = new Intl.NumberFormat(config.locale, {
      style: config.showSymbol ? 'currency' : 'decimal',
      currency: config.currency,
      minimumFractionDigits: config.minimumFractionDigits,
      maximumFractionDigits: config.maximumFractionDigits
    });
    
    return formatter.format(numericValue);
    
  } catch (error) {
    console.error('Erro na formatação de moeda:', error);
    
    // Fallback manual em caso de erro
    const fallbackValue = Number(value) || 0;
    const formattedValue = fallbackValue.toFixed(2).replace('.', ',');
    const [inteiros, decimais] = formattedValue.split(',');
    
    // Adicionar separadores de milhares
    const integersFormatted = inteiros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return config.showSymbol 
      ? `R$ ${integersFormatted},${decimais}`
      : `${integersFormatted},${decimais}`;
  }
};

/**
 * Formata um valor para moeda sem o símbolo R$
 * 
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado sem símbolo
 */
export const formatCurrencyWithoutSymbol = (value) => {
  return formatCurrency(value, { showSymbol: false });
};

/**
 * Formata um valor para moeda com precisão personalizada
 * 
 * @param {number|string} value - Valor a ser formatado
 * @param {number} precision - Número de casas decimais
 * @returns {string} Valor formatado com precisão customizada
 */
export const formatCurrencyWithPrecision = (value, precision = 2) => {
  return formatCurrency(value, { 
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
};

/**
 * Formata um valor como porcentagem
 * 
 * @param {number|string} value - Valor a ser formatado (0.1 = 10%)
 * @param {number} precision - Número de casas decimais
 * @returns {string} Valor formatado como porcentagem
 */
export const formatPercent = (value, precision = 1) => {
  try {
    const numericValue = Number(value) || 0;
    
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
    
    return formatter.format(numericValue);
  } catch (error) {
    console.error('Erro na formatação de porcentagem:', error);
    return '0%';
  }
};

/**
 * Formata um número simples com separadores brasileiros
 * 
 * @param {number|string} value - Valor a ser formatado
 * @param {number} precision - Número de casas decimais
 * @returns {string} Número formatado
 */
export const formatNumber = (value, precision = 0) => {
  try {
    const numericValue = Number(value) || 0;
    
    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
    
    return formatter.format(numericValue);
  } catch (error) {
    console.error('Erro na formatação de número:', error);
    return '0';
  }
};

/**
 * Converte uma string de moeda brasileira para número
 * 
 * @param {string} currencyString - String no formato "R$ 1.234,56"
 * @returns {number} Valor numérico
 */
export const parseCurrency = (currencyString) => {
  try {
    if (!currencyString || typeof currencyString !== 'string') {
      return 0;
    }
    
    // Remove símbolos e espaços
    const cleanString = currencyString
      .replace(/R\$\s?/g, '')
      .replace(/\s/g, '')
      .trim();
    
    // Se contém vírgula, assumir formato brasileiro
    if (cleanString.includes(',')) {
      // Formato brasileiro: 1.234,56
      const parts = cleanString.split(',');
      const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
      const decimalPart = parts[1] || '00';
      
      return parseFloat(`${integerPart}.${decimalPart}`);
    } else {
      // Formato americano ou número simples: 1234.56
      return parseFloat(cleanString.replace(/\./g, ''));
    }
  } catch (error) {
    console.error('Erro ao converter moeda para número:', error);
    return 0;
  }
};

/**
 * Valida se uma string é um valor monetário válido
 * 
 * @param {string} value - Valor a ser validado
 * @returns {boolean} True se válido
 */
export const isCurrencyValid = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // Regex para formato brasileiro: R$ 1.234,56 ou 1.234,56 ou 1234,56
  const brazilianCurrencyRegex = /^R?\$?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)$/;
  
  return brazilianCurrencyRegex.test(value.trim());
};

/**
 * Formata um valor para exibição compacta (K, M, B)
 * 
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado de forma compacta
 */
export const formatCurrencyCompact = (value) => {
  try {
    const numericValue = Number(value) || 0;
    
    if (Math.abs(numericValue) >= 1000000000) {
      return `R$ ${(numericValue / 1000000000).toFixed(1)}B`;
    } else if (Math.abs(numericValue) >= 1000000) {
      return `R$ ${(numericValue / 1000000).toFixed(1)}M`;
    } else if (Math.abs(numericValue) >= 1000) {
      return `R$ ${(numericValue / 1000).toFixed(1)}K`;
    } else {
      return formatCurrency(numericValue);
    }
  } catch (error) {
    console.error('Erro na formatação compacta:', error);
    return 'R$ 0,00';
  }
};

// Exportação padrão
export default formatCurrency;