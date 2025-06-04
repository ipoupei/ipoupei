// src/components/ui/Input.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de campo de texto reutilizável
 * 
 * @example
 * // Input básico
 * <Input 
 *   label="Nome" 
 *   name="nome" 
 *   placeholder="Digite seu nome"
 *   onChange={handleChange} 
 * />
 * 
 * @example
 * // Input com erro
 * <Input 
 *   label="Email" 
 *   name="email" 
 *   value={email} 
 *   onChange={handleChange} 
 *   error="Email inválido"
 * />
 */
const Input = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error = null,
  helperText = null,
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  fullWidth = true,
  ...props
}, ref) => {
  const inputId = `input-${name}`;
  
  const baseInputClasses = 'block rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500';
  const errorClasses = error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : '';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const inputClasses = [
    baseInputClasses,
    errorClasses,
    disabledClasses,
    widthClasses,
    className
  ].join(' ');
  
  const containerClasses = [
    fullWidth ? 'w-full' : '',
    containerClassName
  ].join(' ');
  
  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500" id={`${name}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  fullWidth: PropTypes.bool
};

export default Input;