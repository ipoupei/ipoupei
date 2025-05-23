import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

// Importação dos componentes de etapas
import IntroEtapa from './Etapas/IntroEtapa';
import PercepcaoEtapa from './Etapas/PercepcaoEtapa';
import RendaEtapa from './Etapas/RendaEtapa';
import ContasEtapa from './Etapas/ContasEtapa';
import CartoesEtapa from './Etapas/CartoesEtapa';
import DividasEtapa from './Etapas/DividasEtapa';
import DespesasFixasEtapa from './Etapas/DespesasFixasEtapa';
import DespesasVariaveisEtapa from './Etapas/DespesasVariaveisEtapa';

/**
 * Componente principal do formulário de diagnóstico
 * Gerencia a navegação entre as diferentes etapas do formulário
 */
const DiagnosticoForm = ({ onSubmit, onCancel, initialData = {} }) => {
  // Estado para controle de etapa atual
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estado para armazenar dados do formulário
  const [formData, setFormData] = useState({
    percepcoesFinanceiras: {
      sentimento: null,
      percepcaoControle: null,
      percepcaoGastos: null,
      disciplina: null,
      relacaoDinheiro: '',
    },
    situacaoFinanceira: {
      rendaMensal: 0,
      tipoRenda: null,
      contas: [],
      cartoes: [],
      parcelamentos: [],
      dividas: [],
      despesasFixas: {
        moradia: 0,
        contas: 0,
        alimentacao: 0,
        transporte: 0,
        educacao: 0,
        saude: 0,
        outros: 0,
      },
      despesasVariaveis: {
        lazer: 0,
        compras: 0,
        imprevistos: 0,
      }
    }
  });
  
  // Estado para rastrear a conclusão de cada etapa
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // Definição das etapas do diagnóstico
  const steps = [
    { id: 'intro', title: 'Introdução', component: IntroEtapa },
    { id: 'percepcao', title: 'Sua percepção', component: PercepcaoEtapa },
    { id: 'renda', title: 'Renda mensal', component: RendaEtapa },
    { id: 'contas', title: 'Contas bancárias', component: ContasEtapa },
    { id: 'cartoes', title: 'Cartões de crédito', component: CartoesEtapa },
    { id: 'dividas', title: 'Dívidas e financiamentos', component: DividasEtapa },
    { id: 'despesas-fixas', title: 'Despesas fixas', component: DespesasFixasEtapa },
    { id: 'despesas-variaveis', title: 'Despesas variáveis', component: DespesasVariaveisEtapa },
  ];

  // Inicializa o estado com os dados iniciais, se disponíveis
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Manipulador para atualização dos dados do formulário
  const handleUpdateFormData = (section, data) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        ...data
      }
    }));
    
    // Marca a etapa atual como concluída
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
  };

  // Navegação para a próxima etapa
  const handleNextStep = () => {
    // Marca a etapa atual como concluída, se ainda não estiver
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    // Avança para a próxima etapa
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Na última etapa, envia o formulário completo
      handleSubmitForm();
    }
  };

  // Navegação para a etapa anterior
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Navegação para uma etapa específica
  const handleGoToStep = (stepIndex) => {
    // Só permite navegar para etapas já concluídas ou a próxima etapa
    if (completedSteps.includes(stepIndex) || stepIndex === 0 || stepIndex <= Math.max(...completedSteps, 0) + 1) {
      setCurrentStep(stepIndex);
      window.scrollTo(0, 0);
    }
  };

  // Manipulador para submissão do formulário completo
  const handleSubmitForm = () => {
    onSubmit(formData);
  };

  // Pular etapa atual
  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Renderização do componente atual com base na etapa
  const CurrentStepComponent = steps[currentStep].component;
  
  // Verifica se é a última etapa
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-6 pb-10 relative">
      {/* Barra de progresso */}
      <div className="sticky top-0 z-10 bg-white pt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + (completedSteps.includes(currentStep) ? 1 : 0)) / steps.length) * 100)}% concluído
          </span>
        </div>
        
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + (completedSteps.includes(currentStep) ? 1 : 0)) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        {/* Navegação entre etapas */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleGoToStep(index)}
              disabled={!completedSteps.includes(index) && index !== 0 && index > Math.max(...completedSteps, 0) + 1}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                index === currentStep
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : completedSteps.includes(index)
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'bg-gray-100 text-gray-500'
              } ${
                !completedSteps.includes(index) && index !== 0 && index > Math.max(...completedSteps, 0) + 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-opacity-80'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>
      </div>
      
      {/* Componente da etapa atual */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <CurrentStepComponent 
          data={formData}
          onUpdateData={handleUpdateFormData}
          onNext={handleNextStep}
        />
      </div>
      
      {/* Botões de navegação e controle */}
      <div className="flex justify-between pt-4">
        <div>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={16} className="mr-1" />
              Anterior
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          {/* Botão para pular etapa (exceto a última) */}
          {!isLastStep && (
            <button
              type="button"
              onClick={handleSkipStep}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Pular esta etapa
            </button>
          )}
          
          {/* Botão de próximo/finalizar */}
          <button
            type="button"
            onClick={handleNextStep}
            className={`flex items-center px-4 py-2 rounded-lg text-white transition-colors ${
              isLastStep 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLastStep ? (
              <>
                <Save size={16} className="mr-1" />
                Finalizar diagnóstico
              </>
            ) : (
              <>
                Próximo
                <ChevronRight size={16} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

DiagnosticoForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default DiagnosticoForm;