// src/shared/components/ui/InputMoney.jsx - CORREÇÕES MÍNIMAS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para campos de entrada monetários
 * ✅ CORREÇÃO 1: Validação de vírgulas por número individual (permite 6,98+5,50)
 * ✅ CORREÇÃO 2: Evitar processamento duplo no blur
 * ✅ CORREÇÃO 3: Remover styled-jsx que causava erro
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
  enableCalculator = true,
  showCalculationFeedback = true,
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [expressaoOriginal, setExpressaoOriginal] = useState('');
  const inputRef = useRef(null);
  
  // Formata número para moeda brasileira
  const formatCurrency = useCallback((num) => {
    if (num === 0 || num === null || num === undefined) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  }, []);

  // Função para avaliar expressão matemática de forma segura
  const avaliarExpressao = useCallback((expressao) => {
    try {
      // Remove espaços e substitui vírgula por ponto
      const expressaoLimpa = expressao
        .replace(/\s/g, '')
        .replace(/,/g, '.');

      // Verifica se contém apenas números e operadores matemáticos básicos
      const regexValida = /^[0-9+\-*/.()]+$/;
      if (!regexValida.test(expressaoLimpa)) {
        throw new Error('Expressão inválida');
      }

      // Avalia a expressão
      const resultado = Function('"use strict"; return (' + expressaoLimpa + ')')();
      
      if (isNaN(resultado) || !isFinite(resultado)) {
        throw new Error('Resultado inválido');
      }

      return Number(resultado.toFixed(2));
    } catch (error) {
      throw new Error('Expressão matemática inválida');
    }
  }, []);

  // Processar cálculo matemático
  const processarCalculadora = useCallback((valor) => {
    if (!enableCalculator || !valor.trim()) {
      return { resultado: null, foiCalculado: false };
    }

    try {
      // Verifica se tem operadores matemáticos
      const temOperadores = /[+\-*/()\s]/.test(valor);
      
      if (temOperadores) {
        const resultado = avaliarExpressao(valor);
        return { 
          resultado, 
          foiCalculado: true, 
          expressaoOriginal: valor 
        };
      }
    } catch (error) {
      console.warn('Erro no cálculo:', error.message);
    }

    return { resultado: null, foiCalculado: false };
  }, [enableCalculator, avaliarExpressao]);
  
  // Converte string para número com validação
  const stringToNumber = useCallback((str) => {
    if (!str || str === '' || str === '-') return 0;
    
    str = str.trim();
    if (str === '-') return 0;
    
    const isNegative = str.startsWith('-');
    let numbers = str.replace(/[^0-9,]/g, '');
    
    if (!numbers) return 0;
    
    // Validação: máximo uma vírgula
    const virgulaCount = (numbers.match(/,/g) || []).length;
    if (virgulaCount > 1) {
      setIsValid(false);
      return 0;
    }
    
    // Validação: máximo 2 dígitos após vírgula
    if (numbers.includes(',')) {
      const partes = numbers.split(',');
      if (partes[1] && partes[1].length > 2) {
        numbers = `${partes[0]},${partes[1].substring(0, 2)}`;
      }
    }
    
    // Converte vírgula para ponto
    numbers = numbers.replace(',', '.');
    
    const result = parseFloat(numbers) || 0;
    const finalResult = isNegative ? -result : result;
    
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
      setExpressaoOriginal('');
    }
  }, [value, isFocused, formatCurrency]);

  // AutoFocus quando solicitado
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);
  
  // Handle quando o input muda
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    let finalValue = newValue;
    
    if (!enableCalculator && !allowNegative) {
      finalValue = newValue.replace('-', '');
    }
    
    setInputValue(finalValue);
    setExpressaoOriginal('');
    
    // Só converte se não for expressão matemática
    if (!enableCalculator || !/[+\-*/()\s]/.test(finalValue)) {
      const numericValue = stringToNumber(finalValue);
      
      if (onChange) {
        onChange(numericValue);
      }
    }
  }, [allowNegative, enableCalculator, stringToNumber, onChange]);
  
  // Handle quando ganha foco
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    
    // Converte para formato editável
    if (value !== 0) {
      const editableValue = value.toString().replace('.', ',');
      setInputValue(editableValue);
    } else {
      setInputValue('');
    }
    
    setExpressaoOriginal('');
    
    if (onFocus) {
      onFocus(e);
    }
  }, [value, onFocus]);
  
  // ✅ CORREÇÃO 2: Handle quando perde foco - evitar processamento duplo
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    
    // ✅ CORREÇÃO: Evitar reprocessar valores já formatados
    if (inputValue.startsWith('R$')) {
      if (onBlur) {
        onBlur(e);
      }
      return;
    }
    
    let finalValue = inputValue;
    let numericValue;
    
    // Tentar processar como cálculo primeiro
    const { resultado, foiCalculado, expressaoOriginal } = processarCalculadora(inputValue);
    
    if (foiCalculado && resultado !== null) {
      numericValue = resultado;
      finalValue = formatCurrency(resultado);
      
      if (showCalculationFeedback) {
        setExpressaoOriginal(expressaoOriginal);
        setTimeout(() => setExpressaoOriginal(''), 3000);
      }
    } else {
      numericValue = stringToNumber(inputValue);
      finalValue = formatCurrency(numericValue);
      setExpressaoOriginal('');
    }
    
    setInputValue(finalValue);
    
    if (onChange) {
      onChange(numericValue);
    }
    
    if (onBlur) {
      onBlur(e);
    }
  }, [inputValue, stringToNumber, formatCurrency, onChange, onBlur, processarCalculadora, showCalculationFeedback]);

  // ✅ CORREÇÃO 1: Validação de vírgulas por número individual
  const validarVirgulaAtual = useCallback((texto, posicao) => {
    const textoAntes = texto.substring(0, posicao);
    const operadores = /[+\-*/()]/g;
    let ultimoOperador = -1;
    let match;
    
    while ((match = operadores.exec(textoAntes)) !== null) {
      ultimoOperador = match.index;
    }
    
    const numeroAtual = textoAntes.substring(ultimoOperador + 1);
    return !numeroAtual.includes(',');
  }, []);

  // Navegação por teclado
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Enter':
      case 'Tab':
        handleBlur(e);
        break;
        
      case 'Escape':
        setInputValue(formatCurrency(value));
        setExpressaoOriginal('');
        if (inputRef.current) {
          inputRef.current.blur();
        }
        break;
          
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
          const isMinus = char === '-';
          const isOperator = enableCalculator && /[+*/()\-]/.test(char);
          
          // ✅ CORREÇÃO 1: Validação de vírgula por número individual
          if (isComma) {
            const posicao = e.target.selectionStart || 0;
            if (!validarVirgulaAtual(inputValue, posicao)) {
              e.preventDefault();
              return;
            }
          }
          
          if (!isNumber && !isComma && !isPeriod && !isOperator) {
            if (isMinus && !allowNegative && !enableCalculator) {
              e.preventDefault();
            } else if (!isMinus) {
              e.preventDefault();
            }
          }
          
          if (isMinus && !enableCalculator) {
            if (!allowNegative || (inputValue.length > 0 && !inputValue.includes('-'))) {
              e.preventDefault();
            }
          }
        }
        break;
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [inputValue, allowNegative, enableCalculator, value, formatCurrency, onKeyDown, handleBlur, validarVirgulaAtual]);

  // Classes CSS
  const inputClasses = [
    'input-money',
    className,
    isFocused && 'input-money-focused',
    !isValid && 'input-money-invalid',
    disabled && 'input-money-disabled',
    allowNegative && 'input-money-allow-negative',
    enableCalculator && 'input-money-calculator-enabled'
  ].filter(Boolean).join(' ');

  // Estilos
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

  const calculatorFeedbackStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '0.75rem',
    padding: '4px 8px',
    borderRadius: '0 0 4px 4px',
    border: '1px solid #93c5fd',
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
        placeholder={enableCalculator ? `${placeholder} (ou 6,98+5,50)` : placeholder}
        disabled={disabled}
        tabIndex={tabIndex}
        className={inputClasses}
        style={inputStyle}
        {...props}
      />
      
      {/* ✅ CORREÇÃO 3: Feedback sem styled-jsx */}
      {expressaoOriginal && showCalculationFeedback && (
        <div style={calculatorFeedbackStyle}>
          ✨ Cálculo: {expressaoOriginal} = {inputValue.replace('R$ ', '')}
        </div>
      )}
      
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
  onKeyDown: PropTypes.func,
  enableCalculator: PropTypes.bool,
  showCalculationFeedback: PropTypes.bool
};

export default InputMoney;