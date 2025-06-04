import React, { useState, useEffect } from 'react';

/**
 * Componente para campos de entrada monetários
 * Versão ultra simples que REALMENTE funciona com valores negativos
 */
const InputMoney = ({
  name,
  id,
  value = 0,
  onChange,
  placeholder = 'R$ 0,00',
  allowNegative = false,
  style = {},
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Formata número para moeda brasileira
  const formatCurrency = (num) => {
    if (num === 0 || num === null || num === undefined) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };
  
  // Converte string para número
  const stringToNumber = (str) => {
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
    
    // Converte vírgula para ponto
    numbers = numbers.replace(',', '.');
    
    const result = parseFloat(numbers) || 0;
    return isNegative ? -result : result;
  };
  
  // Atualiza input quando value prop muda (apenas se não estiver focado)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatCurrency(value));
    }
  }, [value, isFocused]);
  
  // Handle quando o input muda
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Se não permite negativo, remove o sinal de menos
    const finalValue = allowNegative ? newValue : newValue.replace('-', '');
    
    setInputValue(finalValue);
    
    // Converte e envia o valor numérico
    const numericValue = stringToNumber(finalValue);
    onChange(numericValue);
  };
  
  // Handle quando ganha foco
  const handleFocus = () => {
    setIsFocused(true);
    
    // Converte para formato editável
    if (value !== 0) {
      const editableValue = value.toString().replace('.', ',');
      setInputValue(editableValue);
    } else {
      setInputValue('');
    }
  };
  
  // Handle quando perde foco
  const handleBlur = () => {
    setIsFocused(false);
    
    // Pega o valor atual e formata
    const numericValue = stringToNumber(inputValue);
    setInputValue(formatCurrency(numericValue));
    
    // Garante que o parent component tem o valor correto
    onChange(numericValue);
  };

  return (
    <input
      id={id}
      name={name}
      type="text"
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      style={style}
      {...props}
    />
  );
};

export default InputMoney;