// src/components/ui/Select.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de seleção (dropdown) reutilizável
 * 
 * @example
 * <Select
 *   label="Categoria"
 *   name="categoria"
 *   value={categoriaId}
 *   onChange={handleChange}
 *   options={[
 *     { value: 1, label: 'Alimentação' },
 *     { value: 2, label: 'Transporte' }
 *   ]}
 * />
 */
const Select = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  error = null,
  helperText = null,
  disabled = false,
  required = false,
  placeholder = 'Selecione uma opção',
  className = '',
  containerClassName = '',
  labelClassName = '',
  fullWidth = true,
  ...props
}, ref) => {
  const selectId = `select-${name}`;
  
  const baseSelectClasses = 'block rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500';
  const errorClasses = error ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' : '';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const selectClasses = [
    baseSelectClasses,
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
        <label htmlFor={selectId} className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        id={selectId}
        name={name}
        className={selectClasses}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
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

Select.displayName = 'Select';

Select.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  fullWidth: PropTypes.bool
};

export default Select;