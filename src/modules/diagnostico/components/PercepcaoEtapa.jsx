import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Brain, Heart, Target, Sparkles, TrendingUp } from 'lucide-react';

/**
 * Componente da etapa de percepção financeira
 * Coleta dados subjetivos sobre como o usuário se sente em relação às suas finanças
 * Integrado ao sistema de diagnóstico existente
 */
const PercepcaoEtapa = ({ data, onUpdateData, onNext }) => {
  // Estado local para as respostas da percepção
  const [localData, setLocalData] = useState({
    sentimento: null,
    percepcaoControle: null,
    percepcaoGastos: null,
    disciplina: null,
    relacaoDinheiro: '',
    // Campos adicionais para análise mais profunda
    controleFinanceiro: null,      // 0-10 com emojis
    ansiedadeDinheiro: null,       // 0-10 barra de intensidade
    segurancaFuturo: null          // 0-10 com emojis
  });
  
  // Estado para controle de erros
  const [errors, setErrors] = useState({});
  
  // Carrega dados existentes se houver
  useEffect(() => {
    if (data && data.percepcoesFinanceiras) {
      setLocalData(data.percepcoesFinanceiras);
    }
  }, [data]);
  
  // Atualiza uma resposta específica
  const handleUpdateField = (campo, valor) => {
    setLocalData(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    // Remove erro se existir
    if (errors[campo]) {
      setErrors(prev => ({ ...prev, [campo]: null }));
    }
  };
  
  // Valida se todas as perguntas foram respondidas
  const validateData = () => {
    const novosErros = {};
    
    if (localData.controleFinanceiro === null) {
      novosErros.controleFinanceiro = 'Por favor, avalie seu controle financeiro';
    }
    if (localData.ansiedadeDinheiro === null) {
      novosErros.ansiedadeDinheiro = 'Por favor, indique seu nível de ansiedade';
    }
    if (!localData.disciplina) {
      novosErros.disciplina = 'Por favor, selecione uma opção sobre disciplina';
    }
    if (!localData.percepcaoGastos) {
      novosErros.percepcaoGastos = 'Por favor, indique sua percepção sobre gastos';
    }
    if (localData.segurancaFuturo === null) {
      novosErros.segurancaFuturo = 'Por favor, avalie sua segurança futura';
    }
    if (!localData.relacaoDinheiro.trim()) {
      novosErros.relacaoDinheiro = 'Por favor, descreva sua relação com dinheiro';
    }
    
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };
  
  // Submete os dados e avança
  const handleSubmit = () => {
    if (validateData()) {
      // Mapeia para o formato esperado pelo sistema
      const dadosFormatados = {
        ...localData,
        sentimento: localData.controleFinanceiro <= 3 ? 'ansioso' : 
                   localData.controleFinanceiro <= 6 ? 'preocupado' : 'tranquilo',
        percepcaoControle: localData.controleFinanceiro <= 3 ? 'fora_controle' :
                          localData.controleFinanceiro <= 6 ? 'preocupante' : 'controlado'
      };
      
      onUpdateData('percepcoesFinanceiras', dadosFormatados);
      onNext();
    }
  };
  
  // Componente para escala com emojis
  const EscalaEmojis = ({ valor, onChange, emojis, label, error }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-2">
        <span className="text-2xl">{emojis[0]}</span>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <span className="text-2xl">{emojis[1]}</span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="0"
          max="10"
          value={valor || 5}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
        />
        <div 
          className="absolute top-0 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg transform -translate-y-1.5 transition-all duration-200"
          style={{ left: `calc(${((valor || 5) / 10) * 100}% - 12px)` }}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
            {valor || 5}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 px-1">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
      
      {error && (
        <div className="form-error">
          <span>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
  
  // Componente para barra de intensidade
  const BarraIntensidade = ({ valor, onChange, label, error }) => (
    <div className="space-y-3">
      <div className="text-center">
        <span className="text-sm text-gray-600 font-medium">{label}</span>
      </div>
      
      <div className="relative bg-gray-200 rounded-full h-4">
        <div 
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${((valor || 0) / 10) * 100}%`,
            background: `linear-gradient(to right, #10b981 0%, #f59e0b ${((valor || 0) / 10) * 50}%, #ef4444 100%)`
          }}
        />
        <input
          type="range"
          min="0"
          max="10"
          value={valor || 0}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>Nenhuma ansiedade</span>
        <span className="font-medium text-blue-600">{valor || 0}/10</span>
        <span>Muita ansiedade</span>
      </div>
      
      {error && (
        <div className="form-error">
          <span>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="diagnostico-card-header">
        <div className="diagnostico-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
          <Heart size={24} />
        </div>
        <h2 className="diagnostico-card-title">Como você se sente com o dinheiro?</h2>
      </div>
      
      <p className="diagnostico-card-description">
        Vamos começar pelo mais importante: <strong>como você se sente</strong> em relação ao dinheiro? 
        O que você sente é o primeiro passo para mudarmos tudo juntos.
      </p>
      
      {/* Pergunta 1: Controle Financeiro */}
      <div className="form-section">
        <h3 className="form-section-title">
          Você se sente no controle do seu dinheiro?
        </h3>
        <EscalaEmojis
          valor={localData.controleFinanceiro}
          onChange={(valor) => handleUpdateField('controleFinanceiro', valor)}
          emojis={['😣', '😌']}
          label="Nível de controle"
          error={errors.controleFinanceiro}
        />
      </div>
      
      {/* Pergunta 2: Ansiedade */}
      <div className="form-section">
        <h3 className="form-section-title">
          Pensar em dinheiro te causa ansiedade?
        </h3>
        <BarraIntensidade
          valor={localData.ansiedadeDinheiro}
          onChange={(valor) => handleUpdateField('ansiedadeDinheiro', valor)}
          label="Intensidade da ansiedade"
          error={errors.ansiedadeDinheiro}
        />
      </div>
      
      {/* Pergunta 3: Disciplina Financeira */}
      <div className="form-section">
        <h3 className="form-section-title">
          Sobre sua disciplina financeira, você se considera:
        </h3>
        <div className="radio-group">
          {[
            { value: 'disciplinado', label: 'Super disciplinado', emoji: '🎯' },
            { value: 'inconstante', label: 'Tento, mas não mantenho', emoji: '🤷‍♀️' },
            { value: 'desorganizado', label: 'Muito desorganizado', emoji: '😅' },
            { value: 'ausente', label: 'Nem penso nisso', emoji: '🤔' }
          ].map((option) => (
            <label
              key={option.value}
              className={`radio-option ${localData.disciplina === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="disciplina"
                value={option.value}
                checked={localData.disciplina === option.value}
                onChange={() => handleUpdateField('disciplina', option.value)}
              />
              <span className="radio-option-label">
                <span className="mr-2">{option.emoji}</span>
                {option.label}
              </span>
            </label>
          ))}
        </div>
        {errors.disciplina && (
          <div className="form-error">
            <span>⚠️</span>
            {errors.disciplina}
          </div>
        )}
      </div>
      
      {/* Pergunta 4: Percepção sobre gastos */}
      <div className="form-section">
        <h3 className="form-section-title">
          Sobre seus gastos mensais, você sente que:
        </h3>
        <div className="radio-group">
          {[
            { value: 'conhecimento_total', label: 'Sei exatamente pra onde vai meu dinheiro', emoji: '🎯' },
            { value: 'conhecimento_parcial', label: 'Tenho uma noção, mas não acompanho direito', emoji: '🤔' },
            { value: 'desconhecimento', label: 'Nunca sei onde foi parar meu dinheiro no mês', emoji: '😵‍💫' }
          ].map((option) => (
            <label
              key={option.value}
              className={`radio-option ${localData.percepcaoGastos === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="percepcaoGastos"
                value={option.value}
                checked={localData.percepcaoGastos === option.value}
                onChange={() => handleUpdateField('percepcaoGastos', option.value)}
              />
              <span className="radio-option-label">
                <span className="mr-2">{option.emoji}</span>
                {option.label}
              </span>
            </label>
          ))}
        </div>
        {errors.percepcaoGastos && (
          <div className="form-error">
            <span>⚠️</span>
            {errors.percepcaoGastos}
          </div>
        )}
      </div>
      
      {/* Pergunta 5: Segurança no Futuro */}
      <div className="form-section">
        <h3 className="form-section-title">
          Você se sente seguro com relação ao seu futuro financeiro?
        </h3>
        <EscalaEmojis
          valor={localData.segurancaFuturo}
          onChange={(valor) => handleUpdateField('segurancaFuturo', valor)}
          emojis={['😟', '😎']}
          label="Nível de segurança"
          error={errors.segurancaFuturo}
        />
      </div>
      
      {/* Pergunta 6: Relação com Dinheiro */}
      <div className="form-section">
        <h3 className="form-section-title">
          Sua relação com dinheiro, em uma palavra, seria:
        </h3>
        <div className="form-group">
          <input
            type="text"
            name="relacaoDinheiro"
            value={localData.relacaoDinheiro}
            onChange={(e) => handleUpdateField('relacaoDinheiro', e.target.value)}
            placeholder="Ex: Complicada, Tranquila, Desafiadora..."
            className={`form-input ${errors.relacaoDinheiro ? 'error' : ''}`}
            maxLength={50}
            style={{ fontSize: '1.125rem', padding: '1rem' }}
          />
          <p style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.875rem', 
            color: '#6b7280',
            textAlign: 'right'
          }}>
            {localData.relacaoDinheiro.length}/50 caracteres
          </p>
          {errors.relacaoDinheiro && (
            <div className="form-error">
              <span>⚠️</span>
              {errors.relacaoDinheiro}
            </div>
          )}
        </div>
      </div>
      
      {/* Mensagem de encorajamento */}
      <div className="info-box info">
        <div className="info-icon">💙</div>
        <div className="info-content">
          <h4>Suas respostas são importantes!</h4>
          <p>
            Não existem respostas certas ou erradas. O importante é entendermos 
            onde você está hoje para te ajudar a chegar onde você quer estar amanhã.
          </p>
        </div>
      </div>
      
      {/* Controles da etapa */}
      <div style={{ paddingTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          className={`btn ${validateData() ? 'btn-primary' : 'btn-disabled'}`}
          disabled={!validateData()}
          style={{ padding: '1rem 2rem', fontSize: '1rem' }}
        >
          Continuar
        </button>
        
        {Object.keys(errors).length > 0 && (
          <div className="info-box warning" style={{ marginTop: '1rem' }}>
            <div className="info-icon">⚠️</div>
            <div className="info-content">
              <p style={{ margin: 0 }}>
                Por favor, responda todas as perguntas para continuar.
              </p>
            </div>
          </div>
        )}
        
        {validateData() && (
          <div className="info-box success" style={{ marginTop: '1rem' }}>
            <div className="info-icon">✅</div>
            <div className="info-content">
              <p style={{ margin: 0 }}>
                Ótimo! Entender como você se sente é o primeiro passo para retomar o controle da sua vida financeira.
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