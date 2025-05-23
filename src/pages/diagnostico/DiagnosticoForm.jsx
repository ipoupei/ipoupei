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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Barra de progresso */}
      <div className="progress-container">
        <div className="progress-info">
          <span className="progress-step">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="progress-percentage">
            {Math.round(((currentStep + (completedSteps.includes(currentStep) ? 1 : 0)) / steps.length) * 100)}% concluído
          </span>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentStep + (completedSteps.includes(currentStep) ? 1 : 0)) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        {/* Navegação entre etapas */}
        <div className="step-navigation">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleGoToStep(index)}
              disabled={!completedSteps.includes(index) && index !== 0 && index > Math.max(...completedSteps, 0) + 1}
              className={`step-nav-button ${
                index === currentStep
                  ? 'current'
                  : completedSteps.includes(index)
                  ? 'completed'
                  : 'inactive'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>
      </div>
      
      {/* Componente da etapa atual */}
      <div className="diagnostico-card">
        <CurrentStepComponent 
          data={formData}
          onUpdateData={handleUpdateFormData}
          onNext={handleNextStep}
        />
      </div>
      
      {/* Botões de navegação e controle */}
      <div className="navigation-controls">
        <div className="nav-left">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="btn btn-secondary"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
          )}
        </div>
        
        <div className="nav-right">
          {/* Botão para pular etapa (exceto a última) */}
          {!isLastStep && (
            <button
              type="button"
              onClick={handleSkipStep}
              className="skip-button"
            >
              Pular esta etapa
            </button>
          )}
          
          {/* Botão de próximo/finalizar */}
          <button
            type="button"
            onClick={handleNextStep}
            className={`btn ${isLastStep ? 'btn-success' : 'btn-primary'}`}
          >
            {isLastStep ? (
              <>
                <Save size={16} />
                Finalizar diagnóstico
              </>
            ) : (
              <>
                Próximo
                <ChevronRight size={16} />
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