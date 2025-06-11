// src/modules/diagnostico/components/MoneyInput.jsx
import React from 'react';
import InputMoney from '@shared/components/ui/InputMoney';

/**
 * Wrapper para o InputMoney com props mais simples para o diagnóstico
 */
const MoneyInput = ({
  value,
  onChange,
  placeholder = "R$ 0,00",
  size = "medium",
  autoFocus = false,
  disabled = false,
  ...props
}) => {
  // Mapear tamanhos para estilos
  const sizeStyles = {
    small: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      borderRadius: '6px'
    },
    medium: {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      borderRadius: '8px'
    },
    large: {
      padding: '1rem 1.25rem',
      fontSize: '1.125rem',
      borderRadius: '10px',
      fontWeight: '600'
    }
  };

  const baseStyle = {
    width: '100%',
    border: '2px solid #e5e7eb',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
    color: '#1f2937',
    ...sizeStyles[size]
  };

  return (
    <InputMoney
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      style={baseStyle}
      {...props}
    />
  );
};

export default MoneyInput;