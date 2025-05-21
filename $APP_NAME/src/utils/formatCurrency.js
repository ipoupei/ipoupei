// src/utils/formatCurrency.js

/**
 * Formata um valor numérico como moeda brasileira (R$)
 * 
 * @param {number|string} valor - Valor a ser formatado
 * @param {Object} options - Opções de formatação
 * @returns {string} Valor formatado como moeda
 * 
 * @example
 * // Retorna: 'R$ 1.234,56'
 * formatCurrency(1234.56);
 */
export const formatCurrency = (valor, options = {}) => {
  // Opções padrão
  const {
    locale = 'pt-BR',
    currency = 'BRL',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  // Se o valor for indefinido, nulo ou vazio, retorna string vazia
  if (valor === undefined || valor === null || valor === '') {
    return '';
  }

  // Converte para número se for string
  const numericValue = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;

  // Se não é um número, retorna string vazia
  if (isNaN(numericValue)) {
    return '';
  }

  // Formata o valor usando Intl.NumberFormat
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(numericValue);
};

export default formatCurrency;