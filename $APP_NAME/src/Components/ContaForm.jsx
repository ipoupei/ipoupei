import React, { useState } from 'react';
import './ContaForm.css';
import InputMoney from './ui/InputMoney';

/**
 * Formulário simplificado para criação de contas bancárias
 */
const ContaForm = ({ onSave, onCancel }) => {
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'corrente',
    instituicao: '',
    saldo: 0
  });
  
  // Estado de erros
  const [errors, setErrors] = useState({});

  // Manipula mudanças nos campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa o erro ao modificar o campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Manipula mudanças no campo de saldo
  const handleSaldoChange = (value) => {
    setFormData(prev => ({
      ...prev,
      saldo: value
    }));
    
    // Limpa o erro ao modificar o campo
    if (errors.saldo) {
      setErrors(prev => ({
        ...prev,
        saldo: null
      }));
    }
  };

  // Valida o formulário
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome da conta é obrigatório';
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Manipula o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form className="conta-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="nome">Nome da Conta</label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          placeholder="Ex: Nubank, Itaú, Carteira"
          className={errors.nome ? 'has-error' : ''}
        />
        {errors.nome && <p className="error-message">{errors.nome}</p>}
      </div>
      
      <div className="form-field">
        <label htmlFor="saldo">Saldo Inicial</label>
        <InputMoney
          name="saldo"
          value={formData.saldo}
          onChange={handleSaldoChange}
          placeholder="R$ 0,00"
          error={errors.saldo}
        />
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="cancel-button"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="save-button"
        >
          Salvar
        </button>
      </div>
    </form>
  );
};

export default ContaForm;