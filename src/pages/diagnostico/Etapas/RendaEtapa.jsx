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
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
          <DollarSign size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Sua Renda Mensal</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Agora vamos entender seus números, para que possamos cruzar isso com sua percepção 
        e gerar um plano totalmente personalizado.
      </p>
      
      {/* Campo de Renda Mensal */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="rendaMensal" className="block text-lg font-medium text-gray-800">
            Qual sua renda mensal líquida total?
          </label>
          <div className="relative group">
            <HelpCircle size={16} className="text-gray-400 cursor-help" />
            <div className="absolute right-0 w-64 p-2 bg-white rounded-md shadow-lg border border-gray-200 text-sm text-gray-600 hidden group-hover:block z-10">
              Considere o valor que efetivamente "cai na sua conta" após descontos como impostos e contribuições.
            </div>
          </div>
        </div>
        
        <InputMoney
          id="rendaMensal"
          name="rendaMensal"
          value={localData.rendaMensal}
          onChange={handleMoneyChange}
          placeholder="R$ 0,00"
          style={{
            display: 'block',
            width: '100%',
            padding: '0.625rem 0.75rem',
            fontSize: '1rem',
            borderRadius: '0.375rem',
            border: errors.rendaMensal ? '1px solid #ef4444' : '1px solid #d1d5db',
            boxShadow: 'none',
            outline: 'none'
          }}
        />
        
        {errors.rendaMensal && (
          <p className="mt-2 text-sm text-red-600">{errors.rendaMensal}</p>
        )}
      </div>
      
      {/* Tipo de Renda */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Sua renda é:
        </h3>
        <div className="space-y-3">
          {tipoRendaOptions.map((option) => (
            <label
              key={option.value}
              className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                localData.tipoRenda === option.value
                  ? 'bg-green-50 border-green-300'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="tipoRenda"
                  value={option.value}
                  checked={localData.tipoRenda === option.value}
                  onChange={() => handleRadioChange('tipoRenda', option.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <span className="ml-3 text-gray-700">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
        
        {errors.tipoRenda && (
          <p className="mt-2 text-sm text-red-600">{errors.tipoRenda}</p>
        )}
      </div>
      
      {/* Nota informativa */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Essa informação será utilizada apenas para cálculos e análises financeiras. 
              Seus dados são protegidos e nunca serão compartilhados com terceiros.
            </p>
          </div>
        </div>
      </div>
      
      {/* Controles da etapa */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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
