import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Brain } from 'lucide-react';

/**
 * Componente da etapa de percepção financeira
 * Coleta dados sobre como o usuário percebe e sente sua situação financeira
 */
const PercepcaoEtapa = ({ data, onUpdateData, onNext }) => {
  // Estado local para os dados da etapa
  const [localData, setLocalData] = useState({
    sentimento: null,
    percepcaoControle: null,
    percepcaoGastos: null,
    disciplina: null,
    relacaoDinheiro: ''
  });
  
  // Preenche o estado local com dados existentes (se houver)
  useEffect(() => {
    if (data && data.percepcoesFinanceiras) {
      setLocalData(data.percepcoesFinanceiras);
    }
  }, [data]);
  
  // Manipulador para campos do tipo radio
  const handleRadioChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Manipulador para campos do tipo text
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setLocalData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Verifica se todos os campos obrigatórios foram preenchidos
  const isComplete = () => {
    return (
      localData.sentimento && 
      localData.percepcaoControle && 
      localData.percepcaoGastos && 
      localData.disciplina && 
      localData.relacaoDinheiro.trim() !== ''
    );
  };
  
  // Submete os dados atualizados e avança para a próxima etapa
  const handleSubmit = () => {
    onUpdateData('percepcoesFinanceiras', localData);
    onNext();
  };
  
  // Opções para cada pergunta
  const sentimentoOptions = [
    { value: 'tranquilo', label: 'Tranquilo' },
    { value: 'preocupado', label: 'Levemente preocupado' },
    { value: 'ansioso', label: 'Ansioso' },
    { value: 'desesperado', label: 'Desesperado' }
  ];
  
  const percepcaoControleOptions = [
    { value: 'controlado', label: 'Está sob controle' },
    { value: 'melhoravel', label: 'Dá pra melhorar, mas não é grave' },
    { value: 'preocupante', label: 'Me preocupo, mas não sei o que fazer' },
    { value: 'fora_controle', label: 'Fora de controle, estou perdido' }
  ];
  
  const percepcaoGastosOptions = [
    { value: 'conhecimento_total', label: 'Sei exatamente pra onde vai meu dinheiro' },
    { value: 'conhecimento_parcial', label: 'Tenho uma noção, mas não acompanho direito' },
    { value: 'desconhecimento', label: 'Nunca sei onde foi parar meu dinheiro no mês' }
  ];
  
  const disciplinaOptions = [
    { value: 'disciplinado', label: 'Super disciplinado' },
    { value: 'inconstante', label: 'Tento, mas não mantenho' },
    { value: 'desorganizado', label: 'Muito desorganizado' },
    { value: 'ausente', label: 'Nem penso nisso' }
  ];

  return (
    <div>
      <div className="diagnostico-card-header">
        <div className="diagnostico-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
          <Brain size={24} />
        </div>
        <h2 className="diagnostico-card-title">Sua Percepção Financeira</h2>
      </div>
      
      <p className="diagnostico-card-description">
        Antes de falarmos sobre números, queremos entender como você se sente em relação às suas finanças.
        Suas respostas nos ajudarão a personalizar sua experiência e plano de ação.
      </p>
      
      {/* Pergunta 1: Sentimento */}
      <div className="form-section">
        <h3 className="form-section-title">
          Quando você pensa nas suas finanças hoje, você se sente:
        </h3>
        <div className="radio-group">
          {sentimentoOptions.map((option) => (
            <label
              key={option.value}
              className={`radio-option ${localData.sentimento === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="sentimento"
                value={option.value}
                checked={localData.sentimento === option.value}
                onChange={() => handleRadioChange('sentimento', option.value)}
              />
              <span className="radio-option-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Pergunta 2: Percepção de Controle */}
      <div className="form-section">
        <h3 className="form-section-title">
          Sua percepção sobre sua situação financeira hoje:
        </h3>
        <div className="radio-group">
          {percepcaoControleOptions.map((option) => (
            <label
              key={option.value}
              className={`radio-option ${localData.percepcaoControle === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="percepcaoControle"
                value={option.value}
                checked={localData.percepcaoControle === option.value}
                onChange={() => handleRadioChange('percepcaoControle', option.value)}
              />
              <span className="radio-option-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Pergunta 3: Percepção de Gastos */}
      <div className="form-section">
        <h3 className="form-section-title">
          Atualmente, você sente que:
        </h3>
        <div className="radio-group">
          {percepcaoGastosOptions.map((option) => (
            <label
              key={option.value}
              className={`radio-option ${localData.percepcaoGastos === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="percepcaoGastos"
                value={option.value}
                checked={localData.percepcaoGastos === option.value}
                onChange={() => handleRadioChange('percepcaoGastos', option.value)}
              />
              <span className="radio-option-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Pergunta 4: Disciplina */}
      <div className="form-section">
        <h3 className="form-section-title">
          Sobre sua disciplina financeira, você se considera:
        </h3>
        <div className="radio-group">
          {disciplinaOptions.map((option) => (
            <label
              key={option.value}
              className={`radio-option ${localData.disciplina === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="disciplina"
                value={option.value}
                checked={localData.disciplina === option.value}
                onChange={() => handleRadioChange('disciplina', option.value)}
              />
              <span className="radio-option-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Pergunta 5: Relação com Dinheiro */}
      <div className="form-section">
        <h3 className="form-section-title">
          Sua relação com dinheiro, em uma palavra, seria:
        </h3>
        <div className="form-group">
          <input
            type="text"
            name="relacaoDinheiro"
            value={localData.relacaoDinheiro}
            onChange={handleTextChange}
            placeholder="Ex: Complicada, Tranquila, Desafiadora..."
            className="form-input"
            maxLength={20}
            style={{ fontSize: '1.125rem', padding: '1rem' }}
          />
          <p style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.875rem', 
            color: '#6b7280',
            textAlign: 'right'
          }}>
            {localData.relacaoDinheiro.length}/20 caracteres
          </p>
        </div>
      </div>
      
      {/* Controles da etapa */}
      <div style={{ paddingTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          className={`btn ${isComplete() ? 'btn-primary' : 'btn-disabled'}`}
          disabled={!isComplete()}
          style={{ padding: '1rem 2rem', fontSize: '1rem' }}
        >
          Continuar
        </button>
        
        {!isComplete() && (
          <div className="info-box warning" style={{ marginTop: '1rem' }}>
            <div className="info-icon">⚠️</div>
            <div className="info-content">
              <p style={{ margin: 0 }}>
                Por favor, responda todas as perguntas para continuar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

PercepcaoEtapa.propTypes = {
  data: PropTypes.object,
  onUpdateData: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default PercepcaoEtapa;