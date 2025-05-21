// src/utils/validateForm.js

/**
 * Utilitário para validação de formulários
 * Contém funções para validar diferentes tipos de dados
 */

/**
 * Valida se um campo está preenchido
 * 
 * @param {string} value - Valor a ser validado
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 * 
 * @example
 * // Retorna: 'Este campo é obrigatório'
 * validateRequired('');
 */
export const validateRequired = (value, message = 'Este campo é obrigatório') => {
  if (value === undefined || value === null || value === '') {
    return message;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return message;
  }
  
  return null;
};

/**
 * Valida se um valor é um email válido
 * 
 * @param {string} value - Email a ser validado
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 * 
 * @example
 * // Retorna: 'Email inválido'
 * validateEmail('email-invalido');
 */
export const validateEmail = (value, message = 'Email inválido') => {
  if (!value) return null; // Não valida se vazio (use validateRequired para isso)
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(value)) {
    return message;
  }
  
  return null;
};

/**
 * Valida o tamanho mínimo de uma string
 * 
 * @param {string} value - Valor a ser validado
 * @param {number} minLength - Comprimento mínimo
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 * 
 * @example
 * // Retorna: 'Mínimo de 6 caracteres'
 * validateMinLength('12345', 6);
 */
export const validateMinLength = (value, minLength, message) => {
  if (!value) return null; // Não valida se vazio (use validateRequired para isso)
  
  // Mensagem padrão se não fornecida
  const errorMessage = message || `Mínimo de ${minLength} caracteres`;
  
  if (value.length < minLength) {
    return errorMessage;
  }
  
  return null;
};

/**
 * Valida o tamanho máximo de uma string
 * 
 * @param {string} value - Valor a ser validado
 * @param {number} maxLength - Comprimento máximo
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 */
export const validateMaxLength = (value, maxLength, message) => {
  if (!value) return null; // Não valida se vazio
  
  // Mensagem padrão se não fornecida
  const errorMessage = message || `Máximo de ${maxLength} caracteres`;
  
  if (value.length > maxLength) {
    return errorMessage;
  }
  
  return null;
};

/**
 * Valida se um valor numérico está dentro de um intervalo
 * 
 * @param {number} value - Valor a ser validado
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 */
export const validateRange = (value, min, max, message) => {
  if (value === null || value === undefined || value === '') return null;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'Valor não é um número';
  }
  
  // Mensagem padrão se não fornecida
  const errorMessage = message || `Valor deve estar entre ${min} e ${max}`;
  
  if (numValue < min || numValue > max) {
    return errorMessage;
  }
  
  return null;
};

/**
 * Valida se um valor é um número
 * 
 * @param {any} value - Valor a ser validado
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 */
export const validateNumber = (value, message = 'Deve ser um número válido') => {
  if (value === null || value === undefined || value === '') return null;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return message;
  }
  
  return null;
};

/**
 * Valida se uma data é maior ou igual a uma data mínima
 * 
 * @param {Date|string} value - Data a ser validada
 * @param {Date|string} minDate - Data mínima
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 */
export const validateMinDate = (value, minDate, message) => {
  if (!value) return null;
  
  const dateValue = value instanceof Date ? value : new Date(value);
  const minDateValue = minDate instanceof Date ? minDate : new Date(minDate);
  
  // Mensagem padrão se não fornecida
  const errorMessage = message || `Data deve ser posterior a ${minDateValue.toLocaleDateString()}`;
  
  if (isNaN(dateValue.getTime()) || isNaN(minDateValue.getTime())) {
    return 'Data inválida';
  }
  
  if (dateValue < minDateValue) {
    return errorMessage;
  }
  
  return null;
};

/**
 * Valida se duas senhas correspondem
 * 
 * @param {string} value - Senha a ser validada
 * @param {string} confirmValue - Confirmação da senha
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 */
export const validatePasswordMatch = (value, confirmValue, message = 'As senhas não correspondem') => {
  if (!value || !confirmValue) return null;
  
  if (value !== confirmValue) {
    return message;
  }
  
  return null;
};

/**
 * Valida um CPF
 * 
 * @param {string} value - CPF a ser validado
 * @param {string} message - Mensagem de erro customizada (opcional)
 * @returns {string|null} Mensagem de erro ou null se válido
 */
export const validateCPF = (value, message = 'CPF inválido') => {
  if (!value) return null;
  
  // Remove caracteres não numéricos
  const cpf = value.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) {
    return message;
  }
  
  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1+$/.test(cpf)) {
    return message;
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cpf.charAt(9))) {
    return message;
  }
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cpf.charAt(10))) {
    return message;
  }
  
  return null;
};

/**
 * Função para executar múltiplas validações em série
 * 
 * @param {any} value - Valor a ser validado
 * @param {...Function} validators - Funções de validação a serem aplicadas
 * @returns {string|null} Primeiro erro encontrado ou null se valor for válido
 * 
 * @example
 * // Valida se o email é obrigatório e tem formato válido
 * const error = validateAll(email, 
 *   (v) => validateRequired(v), 
 *   (v) => validateEmail(v)
 * );
 */
export const validateAll = (value, ...validators) => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  
  return null;
};

/**
 * Valida um objeto de formulário completo
 * 
 * @param {Object} values - Objeto com valores do formulário
 * @param {Object} validationRules - Objeto com regras de validação
 * @returns {Object} Objeto com erros de validação
 * 
 * @example
 * const errors = validateForm(
 *   { name: 'João', email: '' },
 *   { 
 *     name: [(v) => validateRequired(v)],
 *     email: [(v) => validateRequired(v), (v) => validateEmail(v)]
 *   }
 * );
 */
export const validateForm = (values, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(fieldName => {
    const fieldValue = values[fieldName];
    const fieldValidators = validationRules[fieldName];
    
    for (const validator of fieldValidators) {
      const error = validator(fieldValue, values);
      
      if (error) {
        errors[fieldName] = error;
        break;
      }
    }
  });
  
  return errors;
};

export default {
  validateRequired,
  validateEmail,
  validateMinLength,
  validateMaxLength,
  validateRange,
  validateNumber,
  validateMinDate,
  validatePasswordMatch,
  validateCPF,
  validateAll,
  validateForm
};