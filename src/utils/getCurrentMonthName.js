// src/utils/getCurrentMonthName.js

/**
 * Retorna o nome do mês atual em português
 * 
 * @param {Date} date - Data para extrair o mês (padrão: data atual)
 * @param {Object} options - Opções de formatação
 * @returns {string} Nome do mês
 * 
 * @example
 * // Retorna: 'Maio' (se o mês atual for maio)
 * getCurrentMonthName();
 */
export const getCurrentMonthName = (date = new Date(), options = {}) => {
  const {
    locale = 'pt-BR',
    format = 'long',
    capitalized = true
  } = options;

  // Obtém o nome do mês com base nas opções
  const monthName = date.toLocaleString(locale, { month: format });
  
  // Aplica capitalização se necessário
  if (capitalized && monthName.length > 0) {
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }
  
  return monthName;
};

export default getCurrentMonthName;