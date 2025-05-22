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
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
          <Brain size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Sua Percepção Financeira</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Antes de falarmos sobre números, queremos entender como você se sente em relação às suas finanças.
        Suas respostas nos ajudarão a personalizar sua experiência e plano de ação.
      </p>
      
      {/* Pergunta 1: Sentimento */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Quando você pensa nas suas finanças hoje, você se sente:
        </h3>
        <div className="space-y-3">
          {sentimentoOptions.map((option) => (
            <label
              key={option.value}
              className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                localData.sentimento === option.value
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="sentimento"
                  value={option.value}
                  checked={localData.sentimento === option.value}
                  onChange={() => handleRadioChange('sentimento', option.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Pergunta 2: Percepção de Controle */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Sua percepção sobre sua situação financeira hoje:
        </h3>
        <div className="space-y-3">
          {percepcaoControleOptions.map((option) => (
            <label
              key={option.value}
              className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                localData.percepcaoControle === option.value
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="percepcaoControle"
                  value={option.value}
                  checked={localData.percepcaoControle === option.value}
                  onChange={() => handleRadioChange('percepcaoControle', option.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Pergunta 3: Percepção de Gastos */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Atualmente, você sente que:
        </h3>
        <div className="space-y-3">
          {percepcaoGastosOptions.map((option) => (
            <label
              key={option.value}
              className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                localData.percepcaoGastos === option.value
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="percepcaoGastos"
                  value={option.value}
                  checked={localData.percepcaoGastos === option.value}
                  onChange={() => handleRadioChange('percepcaoGastos', option.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Pergunta 4: Disciplina */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Sobre sua disciplina financeira, você se considera:
        </h3>
        <div className="space-y-3">
          {disciplinaOptions.map((option) => (
            <label
              key={option.value}
              className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                localData.disciplina === option.value
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="disciplina"
                  value={option.value}
                  checked={localData.disciplina === option.value}
                  onChange={() => handleRadioChange('disciplina', option.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Pergunta 5: Relação com Dinheiro */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Sua relação com dinheiro, em uma palavra, seria:
        </h3>
        <input
          type="text"
          name="relacaoDinheiro"
          value={localData.relacaoDinheiro}
          onChange={handleTextChange}
          placeholder="Ex: Complicada, Tranquila, Desafiadora..."
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          maxLength={20}
        />
        <p className="mt-2 text-sm text-gray-500">
          {localData.relacaoDinheiro.length}/20 caracteres
        </p>
      </div>
      
      {/* Controles da etapa */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isComplete()
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!isComplete()}
        >
          Continuar
        </button>
        
        {!isComplete() && (
          <p className="mt-2 text-sm text-amber-600">
            Por favor, responda todas as perguntas para continuar.
          </p>
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
