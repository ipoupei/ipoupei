// src/utils/validateForm.js - Utilitários de Validação

/**
 * Valida se um campo é obrigatório
 * @param {string} value - Valor a ser validado
 * @param {string} fieldName - Nome do campo (opcional)
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateRequired = (value, fieldName = 'Campo') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} é obrigatório`;
  }
  return null;
};

/**
 * Valida formato de email
 * @param {string} email - Email a ser validado
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateEmail = (email) => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email.trim())) {
    return 'Email inválido';
  }
  
  return null;
};

/**
 * Valida senha
 * @param {string} password - Senha a ser validada
 * @param {number} minLength - Comprimento mínimo (padrão: 6)
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) return null;
  
  if (password.length < minLength) {
    return `Senha deve ter pelo menos ${minLength} caracteres`;
  }
  
  return null;
};

/**
 * Valida se duas senhas coincidem
 * @param {string} password - Senha principal
 * @param {string} confirmPassword - Confirmação da senha
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) return 'Confirmação de senha é obrigatória';
  
  if (password !== confirmPassword) {
    return 'As senhas não coincidem';
  }
  
  return null;
};

/**
 * Valida nome completo
 * @param {string} name - Nome a ser validado
 * @param {number} minLength - Comprimento mínimo (padrão: 2)
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateName = (name, minLength = 2) => {
  if (!name || name.trim() === '') {
    return 'Nome é obrigatório';
  }
  
  if (name.trim().length < minLength) {
    return `Nome deve ter pelo menos ${minLength} caracteres`;
  }
  
  // Verificar se contém apenas letras, espaços e acentos
  const nameRegex = /^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+$/;
  if (!nameRegex.test(name.trim())) {
    return 'Nome deve conter apenas letras';
  }
  
  return null;
};

/**
 * Valida CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateCPF = (cpf) => {
  if (!cpf) return null;
  
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return 'CPF deve ter 11 dígitos';
  }
  
  // Verifica se não são todos iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return 'CPF inválido';
  }
  
  // Validação do algoritmo do CPF
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
    return 'CPF inválido';
  }
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
    return 'CPF inválido';
  }
  
  return null;
};

/**
 * Valida telefone brasileiro
 * @param {string} phone - Telefone a ser validado
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validatePhone = (phone) => {
  if (!phone) return null;
  
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se tem 10 ou 11 dígitos (com DDD)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return 'Telefone deve ter 10 ou 11 dígitos';
  }
  
  // Verifica se começa com DDD válido (11-99)
  const ddd = cleanPhone.substring(0, 2);
  if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
    return 'DDD inválido';
  }
  
  return null;
};

/**
 * Valida CEP brasileiro
 * @param {string} cep - CEP a ser validado
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateCEP = (cep) => {
  if (!cep) return null;
  
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/\D/g, '');
  
  // Verifica se tem 8 dígitos
  if (cleanCEP.length !== 8) {
    return 'CEP deve ter 8 dígitos';
  }
  
  // Verifica se não são todos zeros
  if (cleanCEP === '00000000') {
    return 'CEP inválido';
  }
  
  return null;
};

/**
 * Valida valor monetário
 * @param {number|string} value - Valor a ser validado
 * @param {number} min - Valor mínimo (opcional)
 * @param {number} max - Valor máximo (opcional)
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateCurrency = (value, min = 0, max = null) => {
  if (value === null || value === undefined || value === '') {
    return 'Valor é obrigatório';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'Valor deve ser um número válido';
  }
  
  if (numValue < min) {
    return `Valor deve ser maior ou igual a ${min}`;
  }
  
  if (max !== null && numValue > max) {
    return `Valor deve ser menor ou igual a ${max}`;
  }
  
  return null;
};

/**
 * Valida data
 * @param {string|Date} date - Data a ser validada
 * @param {boolean} allowFuture - Se permite datas futuras (padrão: true)
 * @param {boolean} allowPast - Se permite datas passadas (padrão: true)
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateDate = (date, allowFuture = true, allowPast = true) => {
  if (!date) return 'Data é obrigatória';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const inputDate = new Date(dateObj);
  inputDate.setHours(0, 0, 0, 0);
  
  if (!allowFuture && inputDate > today) {
    return 'Data não pode ser no futuro';
  }
  
  if (!allowPast && inputDate < today) {
    return 'Data não pode ser no passado';
  }
  
  return null;
};

/**
 * Valida URL
 * @param {string} url - URL a ser validada
 * @param {boolean} requireProtocol - Se exige protocolo (padrão: false)
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateURL = (url, requireProtocol = false) => {
  if (!url) return null;
  
  try {
    let testUrl = url.trim();
    
    // Adiciona protocolo se não tiver e não for obrigatório
    if (!requireProtocol && !testUrl.match(/^https?:\/\//)) {
      testUrl = 'https://' + testUrl;
    }
    
    new URL(testUrl);
    return null;
  } catch {
    return 'URL inválida';
  }
};

/**
 * Valida comprimento de texto
 * @param {string} text - Texto a ser validado
 * @param {number} min - Comprimento mínimo
 * @param {number} max - Comprimento máximo
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateLength = (text, min = 0, max = null) => {
  if (!text) text = '';
  
  const length = text.length;
  
  if (length < min) {
    return `Deve ter pelo menos ${min} caracteres`;
  }
  
  if (max !== null && length > max) {
    return `Deve ter no máximo ${max} caracteres`;
  }
  
  return null;
};

/**
 * Valida se valor está em uma lista de opções
 * @param {any} value - Valor a ser validado
 * @param {Array} options - Lista de opções válidas
 * @param {string} fieldName - Nome do campo (opcional)
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateOptions = (value, options, fieldName = 'Valor') => {
  if (!value) return `${fieldName} é obrigatório`;
  
  if (!options.includes(value)) {
    return `${fieldName} inválido`;
  }
  
  return null;
};

/**
 * Valida múltiplos campos usando um objeto de regras
 * @param {Object} data - Dados a serem validados
 * @param {Object} rules - Regras de validação
 * @returns {Object} - Objeto com erros (vazio se tudo válido)
 * 
 * Exemplo de uso:
 * const errors = validateMultiple(
 *   { email: 'test@test.com', password: '123' },
 *   {
 *     email: [validateRequired, validateEmail],
 *     password: [(val) => validatePassword(val, 6)]
 *   }
 * );
 */
export const validateMultiple = (data, rules) => {
  const errors = {};
  
  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field];
    
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors[field] = error;
        break; // Para no primeiro erro
      }
    }
  }
  
  return errors;
};

/**
 * Formata CPF para exibição
 * @param {string} cpf - CPF a ser formatado
 * @returns {string} - CPF formatado
 */
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata telefone para exibição
 * @param {string} phone - Telefone a ser formatado
 * @returns {string} - Telefone formatado
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Formata CEP para exibição
 * @param {string} cep - CEP a ser formatado
 * @returns {string} - CEP formatado
 */
export const formatCEP = (cep) => {
  if (!cep) return '';
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Formata valor monetário para exibição
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: 'BRL')
 * @returns {string} - Valor formatado
 */
export const formatCurrency = (value, currency = 'BRL') => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(value);
};

/**
 * Remove formatação de valor monetário
 * @param {string} formattedValue - Valor formatado
 * @returns {number} - Valor numérico
 */
export const parseCurrency = (formattedValue) => {
  if (!formattedValue) return 0;
  
  // Remove tudo exceto números, vírgula e ponto
  const cleaned = formattedValue.toString().replace(/[^\d,-]/g, '');
  
  // Converte vírgula para ponto se for o separador decimal
  const normalized = cleaned.replace(',', '.');
  
  return parseFloat(normalized) || 0;
};

/**
 * Valida formulário de login
 * @param {Object} data - Dados do formulário
 * @returns {Object} - Objeto com erros
 */
export const validateLoginForm = (data) => {
  return validateMultiple(data, {
    email: [
      (val) => validateRequired(val, 'Email'),
      validateEmail
    ],
    password: [
      (val) => validateRequired(val, 'Senha')
    ]
  });
};

/**
 * Valida formulário de registro
 * @param {Object} data - Dados do formulário
 * @returns {Object} - Objeto com erros
 */
export const validateRegisterForm = (data) => {
  const errors = validateMultiple(data, {
    nome: [
      (val) => validateRequired(val, 'Nome'),
      validateName
    ],
    email: [
      (val) => validateRequired(val, 'Email'),
      validateEmail
    ],
    password: [
      (val) => validateRequired(val, 'Senha'),
      (val) => validatePassword(val, 6)
    ]
  });
  
  // Validação da confirmação de senha
  const confirmError = validatePasswordConfirmation(data.password, data.confirmPassword);
  if (confirmError) {
    errors.confirmPassword = confirmError;
  }
  
  return errors;
};

export default {
  validateRequired,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateName,
  validateCPF,
  validatePhone,
  validateCEP,
  validateCurrency,
  validateDate,
  validateURL,
  validateLength,
  validateOptions,
  validateMultiple,
  formatCPF,
  formatPhone,
  formatCEP,
  formatCurrency,
  parseCurrency,
  validateLoginForm,
  validateRegisterForm
};