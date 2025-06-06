// src/shared/utils/formatCurrency.js - VERSÃO LIMPA SEM LOGS

/**
 * ✅ UTILITÁRIO DE FORMATAÇÃO MONETÁRIA LIMPO
 * Versão sem logs excessivos para produção
 */

/**
 * ✅ Formata um valor numérico para moeda brasileira (BRL)
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
    let numericValue;
    
    if (typeof value === 'string') {
      numericValue = parseStringToNumber(value);
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      numericValue = 0;
    }
    
    // Verificar se é um número válido
    if (!isValidNumber(numericValue)) {
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
    // Fallback manual em caso de erro
    return formatCurrencyFallback(value, config);
  }
};

/**
 * ✅ FUNÇÃO INTELIGENTE: Converte string para número detectando formato automaticamente
 * 
 * @param {string} str - String a ser convertida
 * @returns {number} Valor numérico
 */
export const parseStringToNumber = (str) => {
  if (!str || typeof str !== 'string') return 0;
  
  const cleanStr = str.trim();
  if (!cleanStr || cleanStr === '') return 0;
  
  // Remove símbolo de moeda e espaços
  let processedStr = cleanStr
    .replace(/R\$\s?/g, '')
    .replace(/\s/g, '')
    .trim();
  
  // ✅ DETECÇÃO INTELIGENTE DE FORMATO
  
  // Formato brasileiro com vírgula decimal: 1.234,56 ou 1234,56
  if (/^\-?\d{1,3}(?:\.\d{3})*,\d{2}$/.test(processedStr)) {
    const parts = processedStr.split(',');
    const integerPart = parts[0].replace(/\./g, ''); // Remove pontos de milhares
    const decimalPart = parts[1];
    return parseFloat(`${integerPart}.${decimalPart}`);
  }
  
  // Formato americano com ponto decimal: 1,234.56
  if (/^\-?\d{1,3}(?:,\d{3})*\.\d{2}$/.test(processedStr)) {
    const cleanAmerican = processedStr.replace(/,/g, ''); // Remove vírgulas de milhares
    return parseFloat(cleanAmerican);
  }
  
  // Número simples com vírgula decimal: 1234,56
  if (/^\-?\d+,\d{1,2}$/.test(processedStr)) {
    return parseFloat(processedStr.replace(',', '.'));
  }
  
  // Número simples com ponto decimal: 1234.56
  if (/^\-?\d+\.\d{1,2}$/.test(processedStr)) {
    return parseFloat(processedStr);
  }
  
  // ✅ FORMATO CENTAVOS: apenas números (ex: 1000 = R$ 10,00)
  if (/^\-?\d+$/.test(processedStr)) {
    const centavos = parseInt(processedStr, 10);
    return centavos / 100;
  }
  
  // ✅ ÚLTIMAS TENTATIVAS: remove tudo que não é número, vírgula ou ponto
  const numbersOnly = processedStr.replace(/[^\d,.-]/g, '');
  
  if (numbersOnly.includes(',')) {
    // Assumir formato brasileiro
    const parts = numbersOnly.split(',');
    if (parts.length === 2) {
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1].substring(0, 2); // Máximo 2 decimais
      const result = parseFloat(`${integerPart}.${decimalPart}`);
      return isNaN(result) ? 0 : result;
    }
  }
  
  if (numbersOnly.includes('.')) {
    // Assumir formato americano ou decimal simples
    const result = parseFloat(numbersOnly);
    return isNaN(result) ? 0 : result;
  }
  
  // Último recurso: apenas números como centavos
  const onlyDigits = numbersOnly.replace(/[^\d]/g, '');
  if (onlyDigits) {
    return parseInt(onlyDigits, 10) / 100;
  }
  
  return 0;
};

/**
 * ✅ Valida se um número é válido para formatação monetária
 */
export const isValidNumber = (num) => {
  return typeof num === 'number' && 
         !isNaN(num) && 
         isFinite(num) && 
         num >= -999999999999 && 
         num <= 999999999999;
};

/**
 * ✅ Fallback manual para formatação em caso de erro
 */
export const formatCurrencyFallback = (value, config) => {
  try {
    const numValue = typeof value === 'number' ? value : parseStringToNumber(String(value));
    const absValue = Math.abs(numValue);
    const signal = numValue < 0 ? '-' : '';
    
    const formatted = absValue.toFixed(2);
    const [integer, decimal] = formatted.split('.');
    
    // Adicionar separadores de milhares
    const integerFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return config.showSymbol 
      ? `${signal}R$ ${integerFormatted},${decimal}`
      : `${signal}${integerFormatted},${decimal}`;
  } catch (error) {
    return config.showSymbol ? 'R$ 0,00' : '0,00';
  }
};

/**
 * ✅ Formata um valor para moeda sem o símbolo R$
 */
export const formatCurrencyWithoutSymbol = (value) => {
  return formatCurrency(value, { showSymbol: false });
};

/**
 * ✅ Formata um valor para moeda com precisão personalizada
 */
export const formatCurrencyWithPrecision = (value, precision = 2) => {
  return formatCurrency(value, { 
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
};

/**
 * ✅ Formata um valor como porcentagem
 */
export const formatPercent = (value, precision = 1) => {
  try {
    const numericValue = typeof value === 'number' ? value : parseStringToNumber(String(value));
    
    if (!isValidNumber(numericValue)) {
      return '0%';
    }
    
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
    
    return formatter.format(numericValue);
  } catch (error) {
    return '0%';
  }
};

/**
 * ✅ Formata um número simples com separadores brasileiros
 */
export const formatNumber = (value, precision = 0) => {
  try {
    const numericValue = typeof value === 'number' ? value : parseStringToNumber(String(value));
    
    if (!isValidNumber(numericValue)) {
      return '0';
    }
    
    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
    
    return formatter.format(numericValue);
  } catch (error) {
    return '0';
  }
};

/**
 * ✅ FUNÇÃO MELHORADA: Converte uma string de moeda brasileira para número
 */
export const parseCurrency = (currencyString) => {
  try {
    if (!currencyString) return 0;
    return parseStringToNumber(String(currencyString));
  } catch (error) {
    return 0;
  }
};

/**
 * ✅ Valida se uma string é um valor monetário válido
 */
export const isCurrencyValid = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // Tenta converter e verifica se o resultado é válido
  const numericValue = parseStringToNumber(value);
  return isValidNumber(numericValue);
};

/**
 * ✅ Formata um valor para exibição compacta (K, M, B)
 */
export const formatCurrencyCompact = (value) => {
  try {
    const numericValue = typeof value === 'number' ? value : parseStringToNumber(String(value));
    
    if (!isValidNumber(numericValue)) {
      return 'R$ 0,00';
    }
    
    const absValue = Math.abs(numericValue);
    const signal = numericValue < 0 ? '-' : '';
    
    if (absValue >= 1000000000) {
      return `${signal}R$ ${(absValue / 1000000000).toFixed(1)}B`;
    } else if (absValue >= 1000000) {
      return `${signal}R$ ${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${signal}R$ ${(absValue / 1000).toFixed(1)}K`;
    } else {
      return formatCurrency(numericValue);
    }
  } catch (error) {
    return 'R$ 0,00';
  }
};

/**
 * ✅ NOVA FUNÇÃO: Mascarar input em tempo real
 */
export const maskCurrencyInput = (inputValue, previousValue = '') => {
  if (!inputValue || inputValue === '') return '';
  
  // Remove tudo que não é dígito
  const digitsOnly = inputValue.replace(/\D/g, '');
  
  if (!digitsOnly || digitsOnly === '0') return '';
  
  // Converte para centavos e formata
  const valueInCents = parseInt(digitsOnly, 10);
  const valueInReais = valueInCents / 100;
  
  // Formatar com vírgula brasileira
  return valueInReais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * ✅ NOVA FUNÇÃO: Comparar valores monetários com tolerância
 */
export const compareCurrencyValues = (value1, value2, tolerance = 0.01) => {
  const num1 = typeof value1 === 'number' ? value1 : parseStringToNumber(String(value1));
  const num2 = typeof value2 === 'number' ? value2 : parseStringToNumber(String(value2));
  
  return Math.abs(num1 - num2) <= tolerance;
};

// Exportação padrão
export default formatCurrency;