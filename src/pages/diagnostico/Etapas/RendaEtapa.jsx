import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DollarSign, HelpCircle } from 'lucide-react';
import InputMoney from '../../../Components/ui/InputMoney';

/**
 * Componente da etapa de renda mensal
 * Coleta dados sobre a renda do usuário e sua característica (fixa, variável, etc.)
 */
const RendaEtapa = ({ data, onUpdateData, onNext }) => {
  // Estado local para os dados da etapa
  const [localData, setLocalData] = useState({
    rendaMensal: 0,
    tipoRenda: null
  });
  
  // Estado para controlar erros de validação
  const [errors, setErrors] = useState({});
  
  // Preenche o estado local com dados existentes (se houver)
  useEffect(() => {
    if (data && data.situacaoFinanceira) {
      setLocalData({
        rendaMensal: data.situacaoFinanceira.rendaMensal || 0,
        tipoRenda: data.situacaoFinanceira.tipoRenda
      });
    }
  }, [data]);
  
  // Manipulador para campos do tipo radio
  const handleRadioChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpa o erro se existir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Manipulador para o campo de valor monetário
  const handleMoneyChange = (value) => {
    setLocalData(prev => ({
      ...prev,
      rendaMensal: value
    }));
    
    // Limpa o erro se existir
    if (errors.rendaMensal) {
      setErrors(prev => ({ ...prev, rendaMensal: null }));
    }
  };
  
  // Verifica se os dados são válidos
  const validateData = () => {
    const newErrors = {};
    
    // Valida renda mensal
    if (!localData.rendaMensal || localData.rendaMensal <= 0) {
      newErrors.rendaMensal = 'Informe uma renda mensal válida';
    }
    
    // Valida tipo de renda
    if (!localData.tipoRenda) {
      newErrors.tipoRenda = 'Selecione o tipo da sua renda';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submete os dados e avança para a próxima etapa
  const handleSubmit = () => {
    if (validateData()) {
      onUpdateData('situacaoFinanceira', {
        rendaMensal: localData.rendaMensal,
        tipoRenda: localData.tipoRenda
      });
      onNext();
    }
  };
  
  // Opções para tipo de renda
  const tipoRendaOptions = [
    { value: 'fixa', label: 'Fixa (salário, aposentadoria, etc.)' },
    { value: 'variavel', label: 'Variável (comissões, freelance, autônomo)' },
    { value: 'mista', label: 'Mista (fixa + variável)' }
  ];

  return (
    <div>
      <div className="diagnostico-card-header">
        <div className="diagnostico-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
          <DollarSign size={24} />
        </div>
        <h2 className="diagnostico-card-title">Sua Renda Mensal</h2>
      </div>
      
      <p className="diagnostico-card-description">
        Agora vamos entender seus números, para que possamos cruzar isso com sua percepção 
        e gerar um plano totalmente personalizado.
      </p>
      
      {/* Campo de Renda Mensal */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>
            Qual sua renda mensal líquida total?
          </h3>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <HelpCircle 
              size={16} 
              style={{ color: '#9ca3af', cursor: 'help' }}
              title="Considere o valor que efetivamente 'cai na sua conta' após descontos como impostos e contribuições."
            />
          </div>
        </div>
        
        <div className="money-input-container">
          <InputMoney
            id="rendaMensal"
            name="rendaMensal"
            value={localData.rendaMensal}
            onChange={handleMoneyChange}
            placeholder="R$ 0,00"
            className={`money-input ${errors.rendaMensal ? 'error' : ''}`}
          />
        </div>
        
        {errors.rendaMensal && (
          <div className="form-error">
            <span>⚠️</span>
            {errors.rendaMensal}
          </div>
        )}
      </div>
      
      {/* Tipo de Renda */}
      <div className="form-section">
        <h3 className="form-section-title">
          Sua renda é:
        </h3>
        <div className="radio-group">
          {tipoRendaOptions.map((option) => (
            <label
              key={option.value}
              className={`radio-option ${localData.tipoRenda === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="tipoRenda"
                value={option.value}
                checked={localData.tipoRenda === option.value}
                onChange={() => handleRadioChange('tipoRenda', option.value)}
              />
              <span className="radio-option-label">{option.label}</span>
            </label>
          ))}
        </div>
        
        {errors.tipoRenda && (
          <div className="form-error">
            <span>⚠️</span>
            {errors.tipoRenda}
          </div>
        )}
      </div>
      
      {/* Nota informativa */}
      <div className="info-box info">
        <div className="info-icon">
          <HelpCircle size={20} />
        </div>
        <div className="info-content">
          <p style={{ margin: 0 }}>
            Essa informação será utilizada apenas para cálculos e análises financeiras. 
            Seus dados são protegidos e nunca serão compartilhados com terceiros.
          </p>
        </div>
      </div>
      
      {/* Controles da etapa */}
      <div style={{ paddingTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          style={{ padding: '1rem 2rem', fontSize: '1rem' }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

RendaEtapa.propTypes = {
  data: PropTypes.object,
  onUpdateData: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default RendaEtapa;