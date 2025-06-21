// src/shared/components/ui/InputMoney.jsx - ERRO CORRIGIDO
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para campos de entrada monetários
 * ✅ CORREÇÃO: Removido styled-jsx que causava erro
 * ✅ CORREÇÃO: Formatação de valor mais inteligente
 * ✅ CORREÇÃO: Suporte completo a valores negativos
 */
const InputMoney = ({
  name,
  id,
  value = 0,
  onChange,
  placeholder = 'R$ 0,00',
  allowNegative = false,
  disabled = false,
  className = '',
  style = {},
  autoFocus = false,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef(null);
  
  // ✅ Formata número para moeda brasileira
  const formatCurrency = useCallback((num) => {
    if (num === 0 || num === null || num === undefined) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  }, []);
  
  // ✅ Converte string para número com validação aprimorada
  const stringToNumber = useCallback((str) => {
    if (!str || str === '' || str === '-') return 0;
    
    // Remove espaços
    str = str.trim();
    
    // Se for só o sinal de menos, retorna 0
    if (str === '-') return 0;
    
    // Detecta se é negativo
    const isNegative = str.startsWith('-');
    
    // Remove tudo exceto números e vírgula
    let numbers = str.replace(/[^0-9,]/g, '');
    
    if (!numbers) return 0;
    
    // ✅ VALIDAÇÃO: Máximo uma vírgula
    const virgulaCount = (numbers.match(/,/g) || []).length;
    if (virgulaCount > 1) {
      setIsValid(false);
      return 0;
    }
    
    // ✅ VALIDAÇÃO: Máximo 2 dígitos após vírgula
    if (numbers.includes(',')) {
      const partes = numbers.split(',');
      if (partes[1] && partes[1].length > 2) {
        // Trunca para 2 dígitos
        numbers = `${partes[0]},${partes[1].substring(0, 2)}`;
      }
    }
    
    // Converte vírgula para ponto
    numbers = numbers.replace(',', '.');
    
    const result = parseFloat(numbers) || 0;
    const finalResult = isNegative ? -result : result;
    
    // ✅ VALIDAÇÃO: Verifica se é um número válido
    if (isNaN(finalResult) || !isFinite(finalResult)) {
      setIsValid(false);
      return 0;
    }
    
    setIsValid(true);
    return finalResult;
  }, []);
  
  // Atualiza input quando value prop muda (apenas se não estiver focado)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatCurrency(value));
    }
  }, [value, isFocused, formatCurrency]);

  // ✅ AutoFocus quando solicitado
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);
  
  // ✅ Handle quando o input muda com validação
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Se não permite negativo, remove o sinal de menos
    const finalValue = allowNegative ? newValue : newValue.replace('-', '');
    
    setInputValue(finalValue);
    
    // Converte e envia o valor numérico
    const numericValue = stringToNumber(finalValue);
    
    if (onChange) {
      onChange(numericValue);
    }
  }, [allowNegative, stringToNumber, onChange]);
  
  // ✅ Handle quando ganha foco
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    
    // Converte para formato editável
    if (value !== 0) {
      const editableValue = value.toString().replace('.', ',');
      setInputValue(editableValue);
    } else {
      setInputValue('');
    }
    
    if (onFocus) {
      onFocus(e);
    }
  }, [value, onFocus]);
  
  // ✅ Handle quando perde foco
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    
    // Pega o valor atual e formata
    const numericValue = stringToNumber(inputValue);
    setInputValue(formatCurrency(numericValue));
    
    // Garante que o parent component tem o valor correto
    if (onChange) {
      onChange(numericValue);
    }
    
    if (onBlur) {
      onBlur(e);
    }
  }, [inputValue, stringToNumber, formatCurrency, onChange, onBlur]);

  // ✅ Navegação por teclado SIMPLIFICADA
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Enter':
        // Força formatação e validação
        handleBlur(e);
        break;
        
      case 'Escape':
        // Cancela edição e volta ao valor original
        setInputValue(formatCurrency(value));
        if (inputRef.current) {
          inputRef.current.blur();
        }
        break;
        
      // ✅ Permite apenas números, vírgula, ponto e sinal de menos
      default:
        const allowedKeys = [
          'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
          'ArrowUp', 'ArrowDown', 'Home', 'End', 'Control', 'Alt', 'Shift'
        ];
        
        if (!allowedKeys.includes(e.key)) {
          const char = e.key;
          const isNumber = /\d/.test(char);
          const isComma = char === ',';
          const isPeriod = char === '.';
          const isMinus = char === '-' && allowNegative;
          
          if (!isNumber && !isComma && !isPeriod && !isMinus) {
            e.preventDefault();
          }
          
          // ✅ Previne múltiplas vírgulas
          if (isComma && inputValue.includes(',')) {
            e.preventDefault();
          }
          
          // ✅ Previne sinal de menos no meio
          if (isMinus && (inputValue.length > 0 || inputValue.includes('-'))) {
            e.preventDefault();
          }
        }
        break;
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [inputValue, allowNegative, value, formatCurrency, onKeyDown, handleBlur]);

  // ✅ CORREÇÃO: Classes CSS sem styled-jsx
  const inputClasses = [
    'input-money',
    className,
    isFocused && 'input-money-focused',
    !isValid && 'input-money-invalid',
    disabled && 'input-money-disabled',
    allowNegative && 'input-money-allow-negative'
  ].filter(Boolean).join(' ');

  // ✅ CORREÇÃO: Estilos inline em vez de styled-jsx
  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
    width: '100%'
  };

  const inputStyle = {
    ...style,
    fontFamily: 'monospace',
    textAlign: 'right',
    transition: 'all 0.2s ease',
    ...(isFocused && { 
      borderColor: isValid ? '#10b981' : '#ef4444',
      boxShadow: `0 0 0 2px ${isValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
    }),
    ...(isFocused && { transform: 'scale(1.02)' }),
    ...(!isValid && { 
      backgroundColor: '#fef2f2',
      borderColor: '#ef4444'
    }),
    ...(disabled && { 
      opacity: 0.6,
      cursor: 'not-allowed'
    })
  };

  const errorStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '0.75rem',
    padding: '4px 8px',
    borderRadius: '0 0 4px 4px',
    border: '1px solid #fecaca',
    zIndex: 10
  };

  return (
    <div style={containerStyle}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        tabIndex={tabIndex}
        className={inputClasses}
        style={inputStyle}
        {...props}
      />
      
      {/* ✅ Indicador de valor inválido */}
      {!isValid && (
        <div style={errorStyle}>
          Formato inválido. Use apenas números e vírgula.
        </div>
      )}
    </div>
  );
};

InputMoney.propTypes = {
  name: PropTypes.string,
  id: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  allowNegative: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  autoFocus: PropTypes.bool,
  tabIndex: PropTypes.number,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func
};

export default InputMoney;