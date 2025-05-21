import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente para campos de entrada monetários
 * Formata automaticamente o valor como moeda durante a digitação
 */
const InputMoney = ({
  name,
  id,
  value = 0,
  onChange,
  placeholder = 'R$ 0,00',
  style = {},
  ...props
}) => {
  // Referência para o input
  const inputRef = useRef(null);
  
  // Estado para o valor formatado exibido no input
  const [displayValue, setDisplayValue] = useState('');
  
  // Formata o valor para exibição como moeda 
  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === '') return 'R$ 0,00';
    
    try {
      // Converte para número e formata como moeda
      const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
      
      if (isNaN(numValue)) return 'R$ 0,00';
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(numValue);
    } catch (error) {
      console.error('Erro ao formatar valor:', error);
      return 'R$ 0,00';
    }
  };
  
  // Converte o valor formatado de volta para número
  const parseValue = (formattedValue) => {
    if (!formattedValue) return 0;
    
    // Remove todos os caracteres não numéricos
    const numericString = formattedValue.replace(/\D/g, '');
    
    if (!numericString) return 0;
    
    // Converte para número e divide por 100 para obter o valor em reais
    return parseInt(numericString, 10) / 100;
  };
  
  // Atualiza o valor exibido quando a prop value muda
  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);
  
  // Manipula mudanças no input
  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Extrai valor numérico e notifica a mudança
    const numericValue = parseValue(inputValue);
    setDisplayValue(formatCurrency(numericValue));
    onChange(numericValue);
  };
  
  // Manipula o foco no input
  const handleFocus = () => {
    // Seleciona todo o texto ao focar
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }, 0);
  };
  
  // Manipula perda de foco
  const handleBlur = () => {
    // Formata novamente o valor ao perder o foco
    const numericValue = parseValue(displayValue);
    setDisplayValue(formatCurrency(numericValue));
  };

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      style={{
        ...style
      }}
      {...props}
    />
  );
};

export default InputMoney;