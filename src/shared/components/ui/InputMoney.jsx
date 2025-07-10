// src/shared/components/ui/InputMoney.jsx - VERSÃO COM CORREÇÃO INLINE DE ESTILOS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para campos de entrada monetários
 * ✅ CORREÇÃO INLINE: Estilos ajustados para consistência visual
 * ✅ MANTÉM: Toda funcionalidade de calculadora e validação
 * ✅ SEGURO: Apenas mudanças nos estilos inline, sem dependências CSS
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

  // ✅ CORREÇÃO 1: Função para avaliar expressão matemática SEM pontos
  const avaliarExpressao = useCallback((expressao) => {
    try {
      // Remove espaços e substitui vírgula por ponto (sem pontos de milhares)
      const expressaoLimpa = expressao
        .replace(/\s/g, '')
        .replace(/,/g, '.');

      // Verifica se contém apenas números e operadores matemáticos básicos (SEM PONTOS)
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
  
  // ✅ CORREÇÃO 3: Converte string para número com validação RIGOROSA de casas decimais
  const stringToNumber = useCallback((str) => {
    if (!str || str === '' || str === '-') return 0;
    
    str = str.trim();
    if (str === '-') return 0;
    
    const isNegative = str.startsWith('-');
    let numbers = str.replace(/[^0-9,]/g, ''); // Remove tudo exceto números e vírgulas
    
    if (!numbers) return 0;
    
    // Validação: máximo uma vírgula
    const virgulaCount = (numbers.match(/,/g) || []).length;
    if (virgulaCount > 1) {
      setIsValid(false);
      return 0;
    }
    
    // ✅ CORREÇÃO 3: Validação RIGOROSA de máximo 2 dígitos após vírgula
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

  // ✅ CORREÇÃO 3 DEFINITIVA: Validação em tempo real de casas decimais (APENAS para números)
  const validarCasasDecimais = useCallback((texto) => {
    // Se não tem vírgula, é válido
    if (!texto.includes(',')) return true;
    
    // Se é uma expressão matemática, validar cada número separadamente
    if (/[+\-*/()]/.test(texto)) {
      // Dividir por operadores e validar cada parte
      const numeros = texto.split(/[+\-*/()]/);
      
      for (const numero of numeros) {
        const numeroLimpo = numero.trim();
        if (numeroLimpo && numeroLimpo.includes(',')) {
          const partes = numeroLimpo.split(',');
          // Se há mais de uma vírgula no número, é inválido
          if (partes.length > 2) return false;
          // Se a parte decimal tem mais de 2 dígitos, é inválido
          if (partes[1] && partes[1].length > 2) return false;
        }
      }
      return true;
    }
    
    // Para números simples, validação normal
    const partes = texto.split(',');
    // Se há mais de uma vírgula, já é inválido
    if (partes.length > 2) return false;
    
    // Se a parte decimal tem mais de 2 dígitos
    if (partes[1] && partes[1].length > 2) return false;
    
    return true;
  }, []);

  // ✅ CORREÇÃO 4: Validação de vírgulas por número individual
  const validarVirgulaAtual = useCallback((texto, posicao) => {
    // Encontra o início do número atual (após último operador)
    const textoAntes = texto.substring(0, posicao);
    const operadores = /[+\-*/()]/g;
    let ultimoOperador = -1;
    let match;
    
    // Procura o último operador antes da posição atual
    while ((match = operadores.exec(textoAntes)) !== null) {
      ultimoOperador = match.index;
    }
    
    // Extrai apenas o número atual (após o último operador)
    const numeroAtual = textoAntes.substring(ultimoOperador + 1);
    
    // Verifica se o número atual já tem vírgula
    const jaTemVirgula = numeroAtual.includes(',');
    
    return !jaTemVirgula;
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
  
  // ✅ CORREÇÃO 3 + DEBUG: Handle quando o input muda COM validação em tempo real
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    let finalValue = newValue;
    
    if (!enableCalculator && !allowNegative) {
      finalValue = newValue.replace('-', '');
    }

    // ✅ CORREÇÃO 3: Validação em tempo real de casas decimais CORRIGIDA
    if (!validarCasasDecimais(finalValue)) {
      // Se é expressão matemática, corrigir apenas a parte decimal problemática
      if (/[+\-*/()]/.test(finalValue)) {
        // Dividir por operadores, corrigir cada número e reconstruir
        finalValue = finalValue.replace(/(\d+,\d{3,})/g, (match) => {
          const partes = match.split(',');
          return `${partes[0]},${partes[1].substring(0, 2)}`;
        });
      } else {
        // Para números simples, correção normal
        if (finalValue.includes(',')) {
          const partes = finalValue.split(',');
          if (partes[1] && partes[1].length > 2) {
            finalValue = `${partes[0]},${partes[1].substring(0, 2)}`;
          }
        }
      }
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
  }, [allowNegative, enableCalculator, stringToNumber, onChange, validarCasasDecimais]);

  // ✅ CORREÇÃO 2: Evento onPaste customizado para controlar colagem
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    
    // Limpa o texto colado: remove caracteres inválidos e pontos
    const cleanText = pastedText
      .replace(/[^\d,+\-*/()]/g, '') // Remove tudo exceto números, vírgulas e operadores
      .replace(/\./g, ''); // ✅ CORREÇÃO 1: Remove pontos sempre
    
    if (cleanText) {
      const cursorPos = e.target.selectionStart || 0;
      const endPos = e.target.selectionEnd || cursorPos;
      
      const beforeCursor = inputValue.slice(0, cursorPos);
      const afterCursor = inputValue.slice(endPos);
      const newValue = beforeCursor + cleanText + afterCursor;
      
      // Valida o resultado antes de aplicar
      if (validarCasasDecimais(newValue)) {
        setInputValue(newValue);
        
        // Se não é expressão matemática, converte imediatamente
        if (!enableCalculator || !/[+\-*/()\s]/.test(newValue)) {
          const numericValue = stringToNumber(newValue);
          if (onChange) {
            onChange(numericValue);
          }
        }
        
        // Move cursor para após o texto colado
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(
              cursorPos + cleanText.length,
              cursorPos + cleanText.length
            );
          }
        }, 0);
      }
    }
  }, [inputValue, validarCasasDecimais, enableCalculator, stringToNumber, onChange]);
  
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
  
  // ✅ CORREÇÃO 5: Handle quando perde foco - evitar processamento duplo
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    
    // Evitar reprocessar valores já formatados
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

  // ✅ CORREÇÃO 6: Navegação por teclado SIMPLIFICADA e DEFINITIVA
  const handleKeyDown = useCallback((e) => {
    const char = e.key;

    // ✅ LISTA COMPLETA de teclas SEMPRE permitidas
    const alwaysAllowedKeys = [
      // Navegação e edição
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
      'Home', 'End', 'PageUp', 'PageDown',
      // Modificadores para atalhos
      'Control', 'Alt', 'Shift', 'Meta', 'CapsLock',
      // Atalhos comuns
      'c', 'v', 'x', 'a', 'z', 'y'
    ];

    // ✅ PERMITIR teclas especiais SEMPRE
    if (alwaysAllowedKeys.includes(char)) {
      // Ações especiais para algumas teclas
      if (char === 'Enter' || char === 'Tab') {
        handleBlur(e);
      } else if (char === 'Escape') {
        setInputValue(formatCurrency(value));
        setExpressaoOriginal('');
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
      
      // Chamar onKeyDown externo se existir
      if (onKeyDown) {
        onKeyDown(e);
      }
      return; // ✅ SAIR AQUI - não fazer mais validações
    }

    // ✅ A partir daqui, só validar caracteres digitáveis

    // ❌ SEMPRE BLOQUEAR: Pontos
    if (char === '.') {
      e.preventDefault();
      return;
    }

    // ✅ SEMPRE PERMITIR: Números (0-9)
    if (/^[0-9]$/.test(char)) {
      if (onKeyDown) onKeyDown(e);
      return;
    }

    // ✅ PERMITIR: Operadores matemáticos (se calculadora habilitada)
    if (enableCalculator && /^[+\-*/()]$/.test(char)) {
      if (onKeyDown) onKeyDown(e);
      return;
    }

    // ✅ PERMITIR: Vírgula (se válida)
    if (char === ',') {
      const posicao = e.target.selectionStart || 0;
      const podeVirgula = validarVirgulaAtual(inputValue, posicao);
      
      if (podeVirgula) {
        if (onKeyDown) onKeyDown(e);
        return;
      } else {
        e.preventDefault();
        return;
      }
    }

    // ✅ PERMITIR: Minus (se permitido)
    if (char === '-') {
      if (enableCalculator) {
        // No modo calculadora, minus é operador
        if (onKeyDown) onKeyDown(e);
        return;
      } else if (allowNegative && !inputValue.includes('-')) {
        // No modo normal, minus apenas se permitir negativos
        if (onKeyDown) onKeyDown(e);
        return;
      }
    }

    // ❌ BLOQUEAR: Qualquer outro caractere
    e.preventDefault();
    
  }, [inputValue, allowNegative, enableCalculator, value, formatCurrency, onKeyDown, handleBlur, validarVirgulaAtual]);

  // ===== 🎨 ESTILOS INLINE PADRÃO DA PLATAFORMA =====
  
  // Estilo base que replica exatamente os inputs do modal
  const inputStyleBase = {
    width: '100%',
    padding: '10px 16px',
    border: '2px solid #E9ECEF',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Roboto', sans-serif",
    background: 'white',
    color: '#333333',
    outline: 'none',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    height: '44px',
    minHeight: '44px',
    lineHeight: '1.5',
    boxSizing: 'border-box',
    transition: 'all 0.25s ease',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    ...style // Permite override externo
  };

  // Modificações baseadas no estado
  const inputStyleFinal = {
    ...inputStyleBase,
    // Focus state
    ...(isFocused && { 
      borderColor: isValid ? '#008080' : '#DC3545',
      boxShadow: isValid ? 
        '0 0 0 3px rgba(0, 128, 128, 0.1)' : 
        '0 0 0 3px rgba(239, 68, 68, 0.1)'
    }),
    // Error state
    ...(!isValid && { 
      borderColor: '#DC3545',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
    }),
    // Disabled state
    ...(disabled && { 
      opacity: 0.6,
      cursor: 'not-allowed',
      background: '#F8F9FA'
    })
  };

  // Container style
  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
    width: '100%'
  };

  // Feedback styles
  const feedbackStyleBase = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '0 0 4px 4px',
    zIndex: 10,
    fontFamily: "'Roboto', sans-serif"
  };

  const errorStyle = {
    ...feedbackStyleBase,
    background: '#FEE2E2',
    color: '#DC2626',
    border: '1px solid #FECACA'
  };

  const calculatorFeedbackStyle = {
    ...feedbackStyleBase,
    background: '#DBEAFE',
    color: '#1D4ED8',
    border: '1px solid #93C5FD'
  };

  // Classes CSS para compatibilidade (se houver CSS externo)
  const inputClasses = [
    'input-money',
    'input-text', // Classe padrão do modal
    className,
    isFocused && 'input-money-focused',
    !isValid && 'input-money-invalid error',
    disabled && 'input-money-disabled',
    allowNegative && 'input-money-allow-negative',
    enableCalculator && 'input-money-calculator-enabled'
  ].filter(Boolean).join(' ');

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
        onPaste={handlePaste}
        placeholder={enableCalculator ? `${placeholder} (ex: 2504*1,03)` : placeholder}
        disabled={disabled}
        tabIndex={tabIndex}
        className={inputClasses}
        style={inputStyleFinal}
        {...props}
      />
      
      {/* Feedback de cálculo */}
      {expressaoOriginal && showCalculationFeedback && (
        <div style={calculatorFeedbackStyle}>
          ✨ Cálculo: {expressaoOriginal} = {inputValue.replace('R$ ', '')}
        </div>
      )}
      
      {/* Feedback de erro */}
      {!isValid && (
        <div style={errorStyle}>
          Formato inválido. Use apenas números e vírgula (máximo 2 casas decimais).
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