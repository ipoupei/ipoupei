import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// Componentes
import WelcomeModal from './WelcomeModal';
import ContasEtapa from '../Etapas/ContasEtapa';
import CartoesEtapa from '../Etapas/CartoesEtapa';
import DespesasFixasEtapa from '../Etapas/DespesasFixasEtapa';
import DespesasVariaveisEtapa from '../Etapas/DespesasVariaveisEtapa';
import DividasEtapa from '../Etapas/DividasEtapa';
import DiagnosticoSummary from './DiagnosticoSummary';


// Hooks
import useDiagnostico from '../hooks/useDiagnostico.js';

// Estilos
import '../styles/Diagnostico.css';

/**
 * Router que gerencia a jornada linear de diagnóstico
 * Cada etapa é uma página completa
 */
const DiagnosticoRouter = ({ 
  isFirstTime = false, 
  onComplete = () => {}, 
  onSkipToDashboard = () => {} 
}) => {
  const navigate = useNavigate();
  
  // Lista ordenada de etapas
  const etapas = [
    'contas',
    'cartoes', 
    'despesas-fixas',
    'despesas-variaveis', 
    'dividas',
    'summary'
  ];
  
  // Estados
  const [showWelcome, setShowWelcome] = useState(isFirstTime);
  const [currentEtapaIndex, setCurrentEtapaIndex] = useState(0);
  const [diagnosticoData, setDiagnosticoData] = useState({});
  
  // Hook do diagnóstico
  const { saveDiagnostico, loading, error } = useDiagnostico();
  
  // Etapa atual
  const currentEtapa = etapas[currentEtapaIndex];
  
  // Handlers do Welcome Modal
  const handleSkipToDashboard = () => {
    console.log('🏃‍♂️ Pulando para dashboard');
    setShowWelcome(false);
    onSkipToDashboard();
  };

  const handleStartDiagnosticoCompleto = () => {
    console.log('🎯 Iniciando diagnóstico completo');
    setShowWelcome(false);
    // Poderia começar em uma etapa de "percepção" se existir
    setCurrentEtapaIndex(0); // Por enquanto começa nas contas
  };

  const handleStartContas = () => {
    console.log('🏦 Iniciando jornada pelas contas');
    setShowWelcome(false);
    setCurrentEtapaIndex(0); // Começa na etapa de contas
  };

  // Handlers de navegação entre etapas
  const handleNextEtapa = useCallback(() => {
    console.log(`➡️ Avançando da etapa ${currentEtapa}`);
    
    if (currentEtapaIndex < etapas.length - 1) {
      setCurrentEtapaIndex(prev => prev + 1);
    } else {
      // Última etapa - finalizar
      handleFinalizarDiagnostico();
    }
  }, [currentEtapaIndex, currentEtapa, etapas.length]);

  const handlePrevEtapa = useCallback(() => {
    console.log(`⬅️ Voltando da etapa ${currentEtapa}`);
    
    if (currentEtapaIndex > 0) {
      setCurrentEtapaIndex(prev => prev - 1);
    } else {
      // Primeira etapa - voltar para welcome
      setShowWelcome(true);
    }
  }, [currentEtapaIndex, currentEtapa]);

  const handleUpdateEtapaData = useCallback((etapa, data) => {
    console.log(`📝 Atualizando dados da etapa ${etapa}:`, data);
    setDiagnosticoData(prev => ({
      ...prev,
      [etapa]: data
    }));
  }, []);

  const handleFinalizarDiagnostico = useCallback(async () => {
    console.log('🎉 Finalizando diagnóstico com dados:', diagnosticoData);
    
    try {
      // Salvar dados do diagnóstico
      await saveDiagnostico(diagnosticoData);
      
      // Chamar callback de conclusão
      onComplete();
    } catch (error) {
      console.error('❌ Erro ao finalizar diagnóstico:', error);
    }
  }, [diagnosticoData, saveDiagnostico, onComplete]);

  // Renderizar etapa atual
  const renderCurrentEtapa = useCallback(() => {
    const etapaProps = {
      onNext: handleNextEtapa,
      onPrev: handlePrevEtapa,
      etapaData: diagnosticoData[currentEtapa] || {},
      onUpdateEtapa: handleUpdateEtapaData,
      isFirstEtapa: currentEtapaIndex === 0,
      isLastEtapa: currentEtapaIndex === etapas.length - 1,
      etapaAtual: currentEtapaIndex + 1,
      totalEtapas: etapas.length
    };

    switch (currentEtapa) {
      case 'contas':
        return <ContasEtapa {...etapaProps} />;
      
      case 'cartoes':
        return <CartoesEtapa {...etapaProps} />;
      
      case 'despesas-fixas':
        return <DespesasFixasEtapa {...etapaProps} />;
      
      case 'despesas-variaveis':
        return <DespesasVariaveisEtapa {...etapaProps} />;
      
      case 'dividas':
        return <DividasEtapa {...etapaProps} />;
      
      case 'summary':
        return (
          <DiagnosticoSummary 
            diagnosticoData={diagnosticoData}
            onFinish={handleFinalizarDiagnostico}
          />
        );
      
      default:
        return <ContasEtapa {...etapaProps} />;
    }
  }, [
    currentEtapa, 
    currentEtapaIndex, 
    etapas.length, 
    diagnosticoData, 
    handleNextEtapa, 
    handlePrevEtapa, 
    handleUpdateEtapaData,
    handleFinalizarDiagnostico
  ]);

  // Loading state
  if (loading) {
    return (
      <div className="diagnostico-wrapper">
        <div className="diagnostico-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Salvando seu progresso...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="diagnostico-wrapper">
      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onStartDiagnostico={handleStartDiagnosticoCompleto}
        onSkipToDashboard={handleSkipToDashboard}
        onStartContas={handleStartContas}
      />

      {/* Container das Etapas */}
      {!showWelcome && (
        <div className="diagnostico-container">
          {/* Progress Bar */}
          <div className="diagnostico-progress">
            <div className="progress-header">
              <h2 className="progress-title">
                Etapa {currentEtapaIndex + 1} de {etapas.length}
              </h2>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${((currentEtapaIndex + 1) / etapas.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="info-box error">
              <div className="info-icon">⚠️</div>
              <div className="info-content">
                <h4>Erro no diagnóstico</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Etapa Atual */}
          <div className="diagnostico-etapa">
            {renderCurrentEtapa()}
          </div>
        </div>
      )}
    </div>
  );
};

DiagnosticoRouter.propTypes = {
  isFirstTime: PropTypes.bool,
  onComplete: PropTypes.func,
  onSkipToDashboard: PropTypes.func
};

export default DiagnosticoRouter;