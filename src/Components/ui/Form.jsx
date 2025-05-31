// src/components/ui/Form.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Conjunto de componentes de formulário padronizados
 * Seguem o design system e são totalmente acessíveis
 */

// Form Group - Container para campo + label + erro
export const FormGroup = ({ children, className = '', ...props }) => (
  <div className={`form-group ${className}`} {...props}>
    {children}
  </div>
);

// Form Label - Label acessível com ícone opcional
export const FormLabel = ({ 
  htmlFor, 
  children, 
  icon, 
  required = false, 
  className = '',
  ...props 
}) => (
  <label 
    htmlFor={htmlFor}
    className={`form-label ${required ? 'form-label--required' : ''} ${className}`}
    {...props}
  >
    {icon && <span className="form-label-icon">{icon}</span>}
    {children}
  </label>
);

// Form Input - Input base otimizado
export const FormInput = forwardRef(({ 
  error, 
  className = '', 
  ...props 
}, ref) => (
  <input
    ref={ref}
    className={`form-input ${error ? 'form-input--error' : ''} ${className}`}
    {...props}
  />
));

FormInput.displayName = 'FormInput';

// Form Textarea
export const FormTextarea = forwardRef(({ 
  error, 
  className = '', 
  rows = 3,
  ...props 
}, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={`form-input ${error ? 'form-input--error' : ''} ${className}`}
    {...props}
  />
));

FormTextarea.displayName = 'FormTextarea';

// Form Select
export const FormSelect = forwardRef(({ 
  options = [], 
  error, 
  placeholder = 'Selecione uma opção',
  className = '', 
  ...props 
}, ref) => (
  <select
    ref={ref}
    className={`form-input ${error ? 'form-input--error' : ''} ${className}`}
    {...props}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map(option => (
      <option 
        key={option.value} 
        value={option.value}
        disabled={option.disabled}
      >
        {option.label}
      </option>
    ))}
  </select>
));

FormSelect.displayName = 'FormSelect';

// Form Error - Exibe erro do campo
export const FormError = ({ error, className = '' }) => {
  if (!error) return null;
  
  return (
    <div className={`form-error ${className}`} role="alert">
      {error}
    </div>
  );
};

// Form Helper - Texto de ajuda
export const FormHelper = ({ children, className = '' }) => (
  <div className={`form-helper ${className}`}>
    {children}
  </div>
);

// Checkbox personalizado
export const FormCheckbox = forwardRef(({ 
  label, 
  error, 
  className = '',
  ...props 
}, ref) => (
  <div className={`form-checkbox-group ${className}`}>
    <label className="form-checkbox-label">
      <input
        ref={ref}
        type="checkbox"
        className={`form-checkbox ${error ? 'form-checkbox--error' : ''}`}
        {...props}
      />
      <span className="form-checkbox-text">{label}</span>
    </label>
    <FormError error={error} />
  </div>
));

FormCheckbox.displayName = 'FormCheckbox';

// Radio Group
export const FormRadioGroup = ({ 
  options = [], 
  name, 
  value, 
  onChange, 
  error,
  className = '',
  ...props 
}) => (
  <div className={`form-radio-group ${className}`} {...props}>
    {options.map(option => (
      <label key={option.value} className="form-radio-label">
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={onChange}
          className={`form-radio ${error ? 'form-radio--error' : ''}`}
          disabled={option.disabled}
        />
        <span className="form-radio-text">{option.label}</span>
      </label>
    ))}
    <FormError error={error} />
  </div>
);

// Form Field - Componente completo com tudo
export const FormField = forwardRef(({
  type = 'text',
  label,
  icon,
  required = false,
  error,
  helper,
  options = [], // Para select
  placeholder,
  className = '',
  fieldClassName = '',
  ...props
}, ref) => {
  const inputId = `field-${Math.random().toString(36).substr(2, 9)}`;
  
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <FormTextarea
            ref={ref}
            id={inputId}
            error={error}
            placeholder={placeholder}
            className={fieldClassName}
            {...props}
          />
        );
      
      case 'select':
        return (
          <FormSelect
            ref={ref}
            id={inputId}
            options={options}
            error={error}
            placeholder={placeholder}
            className={fieldClassName}
            {...props}
          />
        );
      
      case 'checkbox':
        return (
          <FormCheckbox
            ref={ref}
            id={inputId}
            label={label}
            error={error}
            className={fieldClassName}
            {...props}
          />
        );
      
      default:
        return (
          <FormInput
            ref={ref}
            type={type}
            id={inputId}
            error={error}
            placeholder={placeholder}
            className={fieldClassName}
            {...props}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <FormGroup className={className}>
        {renderInput()}
      </FormGroup>
    );
  }

  return (
    <FormGroup className={className}>
      {label && (
        <FormLabel
          htmlFor={inputId}
          icon={icon}
          required={required}
        >
          {label}
        </FormLabel>
      )}
      
      {renderInput()}
      
      <FormError error={error} />
      
      {helper && <FormHelper>{helper}</FormHelper>}
    </FormGroup>
  );
});

FormField.displayName = 'FormField';

// Form Actions - Container para botões
export const FormActions = ({ 
  children, 
  align = 'end', 
  className = '' 
}) => (
  <div className={`form-actions form-actions--${align} ${className}`}>
    {children}
  </div>
);

// Estilos adicionais para componentes específicos
const additionalStyles = `
.form-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

.form-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.form-checkbox--error {
  accent-color: var(--color-danger);
}

.form-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

.form-radio {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.form-radio--error {
  accent-color: var(--color-danger);
}

.form-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.form-actions--start {
  justify-content: flex-start;
}

.form-actions--center {
  justify-content: center;
}

.form-actions--end {
  justify-content: flex-end;
}

.form-actions--between {
  justify-content: space-between;
}

.form-label-icon {
  display: inline-flex;
  align-items: center;
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions--between {
    flex-direction: column-reverse;
  }
}
`;

// Injetar estilos se não existirem
if (typeof document !== 'undefined') {
  const styleId = 'form-components-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = additionalStyles;
    document.head.appendChild(style);
  }
}

// PropTypes
FormGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

FormLabel.propTypes = {
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  required: PropTypes.bool,
  className: PropTypes.string
};

FormInput.propTypes = {
  error: PropTypes.string,
  className: PropTypes.string
};

FormTextarea.propTypes = {
  error: PropTypes.string,
  className: PropTypes.string,
  rows: PropTypes.number
};

FormSelect.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  })),
  error: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string
};

FormError.propTypes = {
  error: PropTypes.string,
  className: PropTypes.string
};

FormHelper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

FormCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  className: PropTypes.string
};

FormRadioGroup.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  })).isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  className: PropTypes.string
};

FormField.propTypes = {
  type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'textarea', 'select', 'checkbox']),
  label: PropTypes.string,
  icon: PropTypes.node,
  required: PropTypes.bool,
  error: PropTypes.string,
  helper: PropTypes.string,
  options: PropTypes.array,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  fieldClassName: PropTypes.string
};

FormActions.propTypes = {
  children: PropTypes.node.isRequired,
  align: PropTypes.oneOf(['start', 'center', 'end', 'between']),
  className: PropTypes.string
};

export default {
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormError,
  FormHelper,
  FormCheckbox,
  FormRadioGroup,
  FormField,
  FormActions
};