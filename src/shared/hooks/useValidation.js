// src/shared/hooks/useValidation.js
import { useState, useCallback, useMemo } from 'react';

/**
 * Hook universal de validação com Zod
 * 
 * @param {Object} schema - Schema Zod para validação
 * @param {Object} options - Opções de configuração
 * @param {boolean} options.validateOnChange - Validar ao digitar (padrão: false)
 * @param {boolean} options.clearOnSuccess - Limpar erros em validação bem-sucedida (padrão: true)
 * @param {Function} options.onSuccess - Callback executado em validação bem-sucedida
 * @param {Function} options.onError - Callback executado em validação com erro
 * 
 * @returns {Object} - Funções e estados de validação
 */
export const useValidation = (schema, options = {}) => {
  const {
    validateOnChange = false,
    clearOnSuccess = true,
    onSuccess,
    onError
  } = options;

  // Estado dos erros de validação
  const [errors, setErrors] = useState({});
  
  // Estado de loading/validating
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Valida dados completos com o schema
   * @param {Object} data - Dados para validar
   * @returns {Object} - Resultado da validação
   */
  const validate = useCallback(async (data) => {
    try {
      setIsValidating(true);
      
      // Executar validação com Zod
      const validatedData = await schema.parseAsync(data);
      
      // Limpar erros se configurado
      if (clearOnSuccess) {
        setErrors({});
      }
      
      // Callback de sucesso
      if (onSuccess) {
        onSuccess(validatedData);
      }
      
      return {
        success: true,
        data: validatedData,
        errors: {}
      };
      
    } catch (error) {
      // Processar erros do Zod
      const fieldErrors = {};
      
      if (error.errors) {
        error.errors.forEach(err => {
          const fieldName = err.path[0];
          if (fieldName) {
            fieldErrors[fieldName] = err.message;
          }
        });
      } else {
        // Erro genérico
        fieldErrors.general = error.message || 'Erro de validação';
      }
      
      setErrors(fieldErrors);
      
      // Callback de erro
      if (onError) {
        onError(fieldErrors);
      }
      
      return {
        success: false,
        data: null,
        errors: fieldErrors
      };
      
    } finally {
      setIsValidating(false);
    }
  }, [schema, clearOnSuccess, onSuccess, onError]);

  /**
   * Valida um campo específico
   * @param {string} fieldName - Nome do campo
   * @param {any} value - Valor do campo
   * @returns {Object} - Resultado da validação do campo
   */
  const validateField = useCallback(async (fieldName, value) => {
    try {
      // Criar schema parcial para o campo específico
      const fieldSchema = schema.shape[fieldName];
      
      if (!fieldSchema) {
        console.warn(`Campo '${fieldName}' não encontrado no schema`);
        return { success: true, error: null };
      }
      
      // Validar apenas o campo
      await fieldSchema.parseAsync(value);
      
      // Remover erro do campo se validação passou
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      
      return { success: true, error: null };
      
    } catch (error) {
      const errorMessage = error.errors?.[0]?.message || error.message || 'Erro de validação';
      
      // Adicionar erro do campo
      setErrors(prev => ({
        ...prev,
        [fieldName]: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [schema]);

  /**
   * Limpa erro de um campo específico
   * @param {string} fieldName - Nome do campo
   */
  const clearError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Limpa todos os erros
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Verifica se existe erro em um campo específico
   * @param {string} fieldName - Nome do campo
   * @returns {boolean} - Se há erro no campo
   */
  const hasError = useCallback((fieldName) => {
    return Boolean(errors[fieldName]);
  }, [errors]);

  /**
   * Obtém a mensagem de erro de um campo
   * @param {string} fieldName - Nome do campo
   * @returns {string|null} - Mensagem de erro ou null
   */
  const getError = useCallback((fieldName) => {
    return errors[fieldName] || null;
  }, [errors]);

  /**
   * Handler genérico para inputs de formulário
   * @param {Object} formData - Dados atuais do formulário
   * @param {Function} setFormData - Setter dos dados do formulário
   * @returns {Function} - Handler para onChange
   */
  const createFieldHandler = useCallback((formData, setFormData) => {
    return (e) => {
      const { name, value, type, checked } = e.target;
      const newValue = type === 'checkbox' ? checked : value;
      
      // Atualizar dados do formulário
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
      
      // Validar em tempo real se configurado
      if (validateOnChange && name) {
        validateField(name, newValue);
      } else {
        // Apenas limpar erro ao digitar
        clearError(name);
      }
    };
  }, [validateOnChange, validateField, clearError]);

  /**
   * Verifica se o formulário tem erros
   */
  const hasAnyError = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  /**
   * Conta o número de erros
   */
  const errorCount = useMemo(() => {
    return Object.keys(errors).length;
  }, [errors]);

  /**
   * Lista de campos com erro
   */
  const errorFields = useMemo(() => {
    return Object.keys(errors);
  }, [errors]);

  /**
   * Primeira mensagem de erro (útil para foco)
   */
  const firstError = useMemo(() => {
    const firstField = Object.keys(errors)[0];
    return firstField ? { field: firstField, message: errors[firstField] } : null;
  }, [errors]);

  return {
    // Estados
    errors,
    isValidating,
    hasAnyError,
    errorCount,
    errorFields,
    firstError,
    
    // Funções principais
    validate,
    validateField,
    
    // Funções de limpeza
    clearError,
    clearAllErrors,
    
    // Funções de verificação
    hasError,
    getError,
    
    // Helpers para formulários
    createFieldHandler
  };
};

/**
 * Hook especializado para validação de formulários
 * Combina useValidation com useState para gerenciar dados do formulário
 * 
 * @param {Object} schema - Schema Zod
 * @param {Object} initialData - Dados iniciais do formulário
 * @param {Object} options - Opções do useValidation
 * @returns {Object} - Estados e funções completas para formulário
 */
export const useFormValidation = (schema, initialData = {}, options = {}) => {
  const [formData, setFormData] = useState(initialData);
  const validation = useValidation(schema, options);

  /**
   * Handler universal para inputs
   */
  const handleChange = validation.createFieldHandler(formData, setFormData);

  /**
   * Reset do formulário
   */
  const resetForm = useCallback((newData = initialData) => {
    setFormData(newData);
    validation.clearAllErrors();
  }, [initialData, validation]);

  /**
   * Submissão do formulário com validação
   */
  const handleSubmit = useCallback(async (onSubmit) => {
    const result = await validation.validate(formData);
    
    if (result.success && onSubmit) {
      await onSubmit(result.data);
    }
    
    return result;
  }, [formData, validation]);

  /**
   * Atualizar dados específicos do formulário
   */
  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Limpar erro do campo
    validation.clearError(fieldName);
  }, [validation]);

  /**
   * Atualizar múltiplos campos de uma vez
   */
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Limpar erros dos campos atualizados
    Object.keys(updates).forEach(field => {
      validation.clearError(field);
    });
  }, [validation]);

  return {
    // Dados do formulário
    formData,
    setFormData,
    
    // Validação
    ...validation,
    
    // Handlers
    handleChange,
    handleSubmit,
    
    // Funções de atualização
    updateField,
    updateFields,
    resetForm
  };
};

export default useValidation;