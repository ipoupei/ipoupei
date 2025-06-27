// src/shared/components/ui/InputMoney.jsx - COM CALCULADORA INTEGRADA
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para campos de entrada monetários
 * ✅ NOVO: Calculadora integrada (5+3,50 → 8,50)
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
  enableCalculator = true, // ✅ NOVO: Prop para habilitar/desabilitar calculadora
  showCalculationFeedback = true, // ✅ NOVO: Mostrar feedback do cálculo
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [expressaoOriginal, setExpressaoOriginal] = useState(''); // ✅ NOVO: Para feedback
  const inputRef = useRef(null);
  
  // ✅ Formata número para moeda brasileira
  const formatCurrency = useCallback((num) => {
    if (num === 0 || num === null || num === undefined) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  }, []);

  // ✅ NOVO: Função para avaliar expressão matemática de forma segura
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

  // ✅ NOVO: Processar cálculo matemático
  const processarCalculadora = useCallback((valor) => {
    if (!enableCalculator || !valor.trim()) {
      return { resultado: null, foiCalculado: false };
    }

    try {
      // Verifica se tem operadores matemáticos
const temOperadores = /[+\-*/()\s]/.test(valor); // ✅ Incluir espaços também
      
      if (temOperadores) {
        // É uma expressão matemática
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
      setExpressaoOriginal(''); // Limpa feedback quando valor muda externamente
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
  
  // ✅ CORREÇÃO: Para calculadora, permitir todos os operadores
  let finalValue = newValue;
  
  if (!enableCalculator && !allowNegative) {
    // Só remove minus se não é calculadora E não permite negativo
    finalValue = newValue.replace('-', '');
  }
  
  setInputValue(finalValue);
    setExpressaoOriginal(''); // Limpa feedback ao digitar
    
    // Converte e envia o valor numérico (só se não for expressão)
    if (!enableCalculator || !/[+\-*/()]/.test(finalValue)) {
    const numericValue = stringToNumber(finalValue);
    
    if (onChange) {
      onChange(numericValue);
    }
  }
}, [allowNegative, enableCalculator, stringToNumber, onChange]);
  
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
    
    setExpressaoOriginal(''); // Limpa feedback ao focar
    
    if (onFocus) {
      onFocus(e);
    }
  }, [value, onFocus]);
  
  // ✅ Handle quando perde foco - COM CALCULADORA
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    
    let finalValue = inputValue;
    let numericValue;
    
    // ✅ NOVO: Tentar processar como cálculo primeiro
    const { resultado, foiCalculado, expressaoOriginal } = processarCalculadora(inputValue);
    
    if (foiCalculado && resultado !== null) {
      // Foi um cálculo válido
      numericValue = resultado;
      finalValue = resultado.toFixed(2).replace('.', ',');
      
      if (showCalculationFeedback) {
        setExpressaoOriginal(expressaoOriginal);
        // Limpa feedback após 3 segundos
        setTimeout(() => setExpressaoOriginal(''), 3000);
      }
    } else {
      // Processamento normal
      numericValue = stringToNumber(inputValue);
      setExpressaoOriginal('');
    }
    
    // Formata para exibição
    setInputValue(formatCurrency(numericValue));
    
    // Garante que o parent component tem o valor correto
    if (onChange) {
      onChange(numericValue);
    }
    
    if (onBlur) {
      onBlur(e);
    }
  }, [inputValue, stringToNumber, formatCurrency, onChange, onBlur, processarCalculadora, showCalculationFeedback]);

  // ✅ Navegação por teclado SIMPLIFICADA + CALCULADORA
const handleKeyDown = useCallback((e) => {
  switch (e.key) {
    case 'Enter':
    case 'Tab':
      // Força processamento da calculadora
      handleBlur(e);
      break;
      
    case 'Escape':
      // Cancela edição e volta ao valor original
      setInputValue(formatCurrency(value));
      setExpressaoOriginal('');
      if (inputRef.current) {
        inputRef.current.blur();
      }
      break;
        
      // ✅ Permite apenas números, vírgula, ponto, sinal de menos E operadores matemáticos
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
        
        // ✅ CORREÇÃO: Lógica melhorada para sinal de menos
        const isMinus = char === '-';
        const isOperator = enableCalculator && /[+*/()\-]/.test(char); // ✅ Incluir - explicitamente
        
        // ✅ NOVA LÓGICA: Permitir operadores quando calculadora habilitada
        if (!isNumber && !isComma && !isPeriod && !isOperator) {
          // Se não permite negativo E não é calculadora, bloquear minus
          if (isMinus && !allowNegative && !enableCalculator) {
            e.preventDefault();
          }
          // Outros caracteres não permitidos
          else if (!isMinus) {
            e.preventDefault();
          }
        }
        
        // ✅ Previne múltiplas vírgulas
        if (isComma && inputValue.includes(',')) {
          e.preventDefault();
        }
        
        // ✅ CORREÇÃO: Lógica do minus ajustada para calculadora
        if (isMinus && !enableCalculator) {
          // Sem calculadora: só permite minus no início se allowNegative
          if (!allowNegative || (inputValue.length > 0 && !inputValue.includes('-'))) {
            e.preventDefault();
          }
        }
        // Com calculadora: minus sempre permitido como operador
      }
      break;
    }
    
  if (onKeyDown) {
    onKeyDown(e);
  }
}, [inputValue, allowNegative, enableCalculator, value, formatCurrency, onKeyDown, handleBlur]);

  // ✅ CORREÇÃO: Classes CSS sem styled-jsx
  const inputClasses = [
    'input-money',
    className,
    isFocused && 'input-money-focused',
    !isValid && 'input-money-invalid',
    disabled && 'input-money-disabled',
    allowNegative && 'input-money-allow-negative',
    enableCalculator && 'input-money-calculator-enabled' // ✅ NOVO
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

  // ✅ NOVO: Estilo para feedback da calculadora
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
        placeholder={enableCalculator ? `${placeholder} (ou 5+3,50)` : placeholder}
        disabled={disabled}
        tabIndex={tabIndex}
        className={inputClasses}
        style={inputStyle}
        {...props}
      />
      
      {/* ✅ NOVO: Feedback da calculadora */}
      {expressaoOriginal && showCalculationFeedback && (
        <div style={calculatorFeedbackStyle}>
          ✨ Cálculo: {expressaoOriginal} = {inputValue.replace('R$ ', '')}
        </div>
      )}
      
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
  onKeyDown: PropTypes.func,
  enableCalculator: PropTypes.bool, // ✅ NOVO
  showCalculationFeedback: PropTypes.bool // ✅ NOVO
};

export default InputMoney;
