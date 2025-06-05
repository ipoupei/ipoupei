// src/shared/utils/formatCurrency.js - VERSÃO ULTRA MELHORADA E CORRIGIDA

/**
 * ✅ UTILITÁRIO DE FORMATAÇÃO MONETÁRIA ULTRA CORRIGIDO
 * Resolve todos os problemas de interpretação de valores
 * Suporte completo ao padrão brasileiro e internacional
 * Sistema inteligente de detecção de formato
 */

/**
 * ✅ Formata um valor numérico para moeda brasileira (BRL)
 * Versão ultra robusta que detecta automaticamente o formato de entrada
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
    
    console.log('💰 formatCurrency input:', value, typeof value);
    
    if (typeof value === 'string') {
      numericValue = parseStringToNumber(value);
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      numericValue = 0;
    }
    
    // Verificar se é um número válido
    if (!isValidNumber(numericValue)) {
      console.warn('⚠️ Valor inválido para formatação:', value);
      numericValue = 0;
    }
    
    console.log('💰 Valor numérico final:', numericValue);
    
    // Formatação usando Intl.NumberFormat
    const formatter = new Intl.NumberFormat(config.locale, {
      style: config.showSymbol ? 'currency' : 'decimal',
      currency: config.currency,
      minimumFractionDigits: config.minimumFractionDigits,
      maximumFractionDigits: config.maximumFractionDigits
    });
    
    const formatted = formatter.format(numericValue);
    console.log('💰 Valor formatado:', formatted);
    
    return formatted;
    
  } catch (error) {
    console.error('❌ Erro na formatação de moeda:', error);
    
    // Fallback manual em caso de erro
    return formatCurrencyFallback(value, config);
  }
};

/**
 * ✅ FUNÇÃO INTELIGENTE: Converte string para número detectando formato automaticamente
 * Detecta se é formato brasileiro (1.234,56) ou americano (1,234.56) ou centavos (1000)
 * 
 * @param {string} str - String a ser convertida
 * @returns {number} Valor numérico
 */
export const parseStringToNumber = (str) => {
  if (!str || typeof str !== 'string') return 0;
  
  const cleanStr = str.trim();
  if (!cleanStr || cleanStr === '') return 0;
  
  console.log('🔍 parseStringToNumber:', cleanStr);
  
  // Remove símbolo de moeda e espaços
  let processedStr = cleanStr
    .replace(/R\$\s?/g, '')
    .replace(/\s/g, '')
    .trim();
  
  console.log('🔍 Após limpeza:', processedStr);
  
  // ✅ DETECÇÃO INTELIGENTE DE FORMATO
  
  // Formato brasileiro com vírgula decimal: 1.234,56 ou 1234,56
  if (/^\-?\d{1,3}(?:\.\d{3})*,\d{2}$/.test(processedStr)) {
    console.log('🇧🇷 Formato brasileiro detectado:', processedStr);
    const parts = processedStr.split(',');
    const integerPart = parts[0].replace(/\./g, ''); // Remove pontos de milhares
    const decimalPart = parts[1];
    const result = parseFloat(`${integerPart}.${decimalPart}`);
    console.log('🇧🇷 Resultado:', result);
    return result;
  }
  
  // Formato americano com ponto decimal: 1,234.56
  if (/^\-?\d{1,3}(?:,\d{3})*\.\d{2}$/.test(processedStr)) {
    console.log('🇺🇸 Formato americano detectado:', processedStr);
    const cleanAmerican = processedStr.replace(/,/g, ''); // Remove vírgulas de milhares
    const result = parseFloat(cleanAmerican);
    console.log('🇺🇸 Resultado:', result);
    return result;
  }
  
  // Número simples com vírgula decimal: 1234,56
  if (/^\-?\d+,\d{1,2}$/.test(processedStr)) {
    console.log('🔢 Número com vírgula detectado:', processedStr);
    const result = parseFloat(processedStr.replace(',', '.'));
    console.log('🔢 Resultado:', result);
    return result;
  }
  
  // Número simples com ponto decimal: 1234.56
  if (/^\-?\d+\.\d{1,2}$/.test(processedStr)) {
    console.log('🔢 Número com ponto detectado:', processedStr);
    const result = parseFloat(processedStr);
    console.log('🔢 Resultado:', result);
    return result;
  }
  
  // ✅ FORMATO CENTAVOS: apenas números (ex: 1000 = R$ 10,00)
  if (/^\-?\d+$/.test(processedStr)) {
    console.log('🪙 Formato centavos detectado:', processedStr);
    const centavos = parseInt(processedStr, 10);
    const result = centavos / 100;
    console.log('🪙 Resultado:', result);
    return result;
  }
  
  // ✅ ÚLTIMAS TENTATIVAS: remove tudo que não é número, vírgula ou ponto
  const numbersOnly = processedStr.replace(/[^\d,.-]/g, '');
  console.log('🔄 Apenas números:', numbersOnly);
  
  if (numbersOnly.includes(',')) {
    // Assumir formato brasileiro
    const parts = numbersOnly.split(',');
    if (parts.length === 2) {
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1].substring(0, 2); // Máximo 2 decimais
      const result = parseFloat(`${integerPart}.${decimalPart}`);
      console.log('🔄 Fallback brasileiro:', result);
      return isNaN(result) ? 0 : result;
    }
  }
  
  if (numbersOnly.includes('.')) {
    // Assumir formato americano ou decimal simples
    const result = parseFloat(numbersOnly);
    console.log('🔄 Fallback americano:', result);
    return isNaN(result) ? 0 : result;
  }
  
  // Último recurso: apenas números como centavos
  const onlyDigits = numbersOnly.replace(/[^\d]/g, '');
  if (onlyDigits) {
    const result = parseInt(onlyDigits, 10) / 100;
    console.log('🔄 Fallback centavos:', result);
    return result;
  }
  
  console.log('❌ Não foi possível converter:', str);
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
    
    const result = config.showSymbol 
      ? `${signal}R$ ${integerFormatted},${decimal}`
      : `${signal}${integerFormatted},${decimal}`;
    
    console.log('🆘 Fallback result:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro no fallback:', error);
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
    console.error('❌ Erro na formatação de porcentagem:', error);
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
    console.error('❌ Erro na formatação de número:', error);
    return '0';
  }
};

/**
 * ✅ FUNÇÃO MELHORADA: Converte uma string de moeda brasileira para número
 * Usa a função parseStringToNumber que já é super inteligente
 */
export const parseCurrency = (currencyString) => {
  try {
    if (!currencyString) return 0;
    return parseStringToNumber(String(currencyString));
  } catch (error) {
    console.error('❌ Erro ao converter moeda para número:', error);
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
    console.error('❌ Erro na formatação compacta:', error);
    return 'R$ 0,00';
  }
};

/**
 * ✅ NOVA FUNÇÃO: Mascarar input em tempo real
 * Para usar em campos de input durante a digitação
 */
export const maskCurrencyInput = (inputValue, previousValue = '') => {
  console.log('🎭 maskCurrencyInput:', { inputValue, previousValue });
  
  if (!inputValue || inputValue === '') return '';
  
  // Remove tudo que não é dígito
  const digitsOnly = inputValue.replace(/\D/g, '');
  
  if (!digitsOnly || digitsOnly === '0') return '';
  
  // Converte para centavos e formata
  const valueInCents = parseInt(digitsOnly, 10);
  const valueInReais = valueInCents / 100;
  
  // Formatar com vírgula brasileira
  const formatted = valueInReais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  console.log('🎭 Resultado mascarado:', formatted);
  return formatted;
};

/**
 * ✅ NOVA FUNÇÃO: Comparar valores monetários com tolerância
 * Útil para validações onde pode haver pequenas diferenças de precisão
 */
export const compareCurrencyValues = (value1, value2, tolerance = 0.01) => {
  const num1 = typeof value1 === 'number' ? value1 : parseStringToNumber(String(value1));
  const num2 = typeof value2 === 'number' ? value2 : parseStringToNumber(String(value2));
  
  return Math.abs(num1 - num2) <= tolerance;
};

// Exportação padrão
export default formatCurrency;