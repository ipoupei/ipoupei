// src/shared/hooks/useValidation.js
import { useState, useCallback, useMemo, useRef } from 'react';

/**
 * Hook universal de validação com Zod - VERSÃO ESTÁVEL
 * 
 * @param {Object} schema - Schema Zod para validação
 * @param {Object} options - Opções de configuração
 * @returns {Object} - Funções e estados de validação
 */
export const useValidation = (schema, options = {}) => {
  const {
    validateOnChange = false,
    clearOnSuccess = true
  } = options;

  // Estados básicos
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  
  // Ref para evitar re-renders desnecessários
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  /**
   * Valida dados completos com o schema
   */
  const validate = useCallback(async (data) => {
    try {
      setIsValidating(true);
      
      // Usar safeParse ao invés de parseAsync para melhor controle
      const result = schemaRef.current.safeParse(data);
      
      if (result.success) {
        if (clearOnSuccess) {
          setErrors({});
        }
        
        return {
          success: true,
          data: result.data,
          errors: {}
        };
      } else {
        // Processar erros do Zod
        const fieldErrors = {};
        
        result.error.errors.forEach(err => {
          const fieldName = err.path[0];
          if (fieldName) {
            fieldErrors[fieldName] = err.message;
          }
        });
        
        setErrors(fieldErrors);
        
        return {
          success: false,
          data: null,
          errors: fieldErrors
        };
      }
      
    } catch (error) {
      const fieldErrors = { general: 'Erro inesperado na validação' };
      setErrors(fieldErrors);
      
      return {
        success: false,
        data: null,
        errors: fieldErrors
      };
      
    } finally {
      setIsValidating(false);
    }
  }, [clearOnSuccess]);

  /**
   * Valida um campo específico
   */
  const validateField = useCallback(async (fieldName, value) => {
    try {
      // Criar objeto temporário para validação
      const tempData = { [fieldName]: value };
      const result = schemaRef.current.pick({ [fieldName]: true }).safeParse(tempData);
      
      if (result.success) {
        // Remover erro do campo
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        
        return { success: true, error: null };
      } else {
        const errorMessage = result.error.errors[0]?.message || 'Erro de validação';
        
        // Adicionar erro do campo
        setErrors(prev => ({
          ...prev,
          [fieldName]: errorMessage
        }));
        
        return { success: false, error: errorMessage };
      }
      
    } catch (error) {
      // Se o campo não existe no schema, ignorar
      return { success: true, error: null };
    }
  }, []);

  /**
   * Limpa erro de um campo específico
   */
  const clearError = useCallback((fieldName) => {
    setErrors(prev => {
      if (!prev[fieldName]) return prev; // Evitar re-render desnecessário
      
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Limpa todos os erros
   */
  const clearAllErrors = useCallback(() => {
    setErrors(prev => {
      if (Object.keys(prev).length === 0) return prev; // Evitar re-render
      return {};
    });
  }, []);

  // Computadas estáveis
  const hasAnyError = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const errorCount = useMemo(() => Object.keys(errors).length, [errors]);
  const hasError = useCallback((fieldName) => Boolean(errors[fieldName]), [errors]);
  const getError = useCallback((fieldName) => errors[fieldName] || null, [errors]);

  return {
    // Estados
    errors,
    isValidating,
    hasAnyError,
    errorCount,
    
    // Funções principais
    validate,
    validateField,
    
    // Funções de limpeza
    clearError,
    clearAllErrors,
    
    // Funções de verificação
    hasError,
    getError
  };
};

/**
 * Hook especializado para validação de formulários - VERSÃO ESTÁVEL
 */
export const useFormValidation = (schema, initialData = {}, options = {}) => {
  const [formData, setFormData] = useState(initialData);
  const validation = useValidation(schema, options);
  
  // Refs para dados iniciais e schema (evitar re-renders)
  const initialDataRef = useRef(initialData);
  const validationRef = useRef(validation);
  validationRef.current = validation;

  /**
   * Handler universal para inputs - ESTÁVEL
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Limpar erro do campo ao digitar
    if (name) {
      validationRef.current.clearError(name);
    }
  }, []);

  /**
   * Submissão do formulário - ESTÁVEL
   */
  const handleSubmit = useCallback((onSubmitCallback) => {
    return async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      
      const result = await validationRef.current.validate(formData);
      
      if (result.success && onSubmitCallback) {
        try {
          await onSubmitCallback(result.data);
        } catch (error) {
          console.error('Erro na submissão:', error);
        }
      }
      
      return result;
    };
  }, [formData]);

  /**
   * Reset do formulário - ESTÁVEL
   */
  const resetForm = useCallback((newData = initialDataRef.current) => {
    setFormData(newData);
    validationRef.current.clearAllErrors();
  }, []);

  /**
   * Atualizar campo específico - ESTÁVEL
   */
  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    validationRef.current.clearError(fieldName);
  }, []);

  /**
   * Atualizar múltiplos campos - ESTÁVEL
   */
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Limpar erros dos campos atualizados
    Object.keys(updates).forEach(field => {
      validationRef.current.clearError(field);
    });
  }, []);

  return {
    // Dados do formulário
    formData,
    setFormData,
    
    // Validação (re-exportar sem criar novas referências)
    errors: validation.errors,
    isValidating: validation.isValidating,
    hasAnyError: validation.hasAnyError,
    errorCount: validation.errorCount,
    validate: validation.validate,
    validateField: validation.validateField,
    clearError: validation.clearError,
    clearAllErrors: validation.clearAllErrors,
    hasError: validation.hasError,
    getError: validation.getError,
    
    // Handlers específicos do formulário
    handleChange,
    handleSubmit,
    updateField,
    updateFields,
    resetForm
  };
};

export default useValidation;