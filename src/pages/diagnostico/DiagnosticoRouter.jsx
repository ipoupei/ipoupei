import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import JornadaSelection from './JornadaSelection';
import DiagnosticoForm from './DiagnosticoForm';
import DiagnosticoSummary from './DiagnosticoSummary';
import useDiagnostico from '../../hooks/useDiagnostico';
import { X } from 'lucide-react';
import './Diagnostico.css';

/**
 * Componente principal que gerencia o fluxo do diagnóstico financeiro
 * Controla a navegação entre as diferentes etapas do diagnóstico
 */
const DiagnosticoRouter = ({ 
  isFirstTime = false, 
  onComplete = () => {}, 
  onSkipToDashboard = () => {} 
}) => {
  // Estados para controle de fluxo
  const [stage, setStage] = useState('jornada'); // jornada, diagnostico, summary
  const [selectedJornada, setSelectedJornada] = useState(null); // 'simples' ou 'completo'
  
  // Hook de diagnóstico
  const { 
    diagnosticoData, 
    setDiagnosticoData, 
    saveDiagnostico, 
    calculaResultados,
    loading, 
    error 
  } = useDiagnostico();

  // Manipulador para seleção de jornada
  const handleJornadaSelect = (jornada) => {
    setSelectedJornada(jornada);
    
    // Se usuário escolher apenas controlar gastos, vai direto para o dashboard
    if (jornada === 'simples') {
      onSkipToDashboard();
      return;
    }
    
    // Se escolher transformação financeira, segue para o diagnóstico completo
    setStage('diagnostico');
  };

  // Manipulador para submissão do diagnóstico completo
  const handleDiagnosticoSubmit = async (formData) => {
    try {
      // Atualiza os dados do diagnóstico
      setDiagnosticoData(formData);
      
      // Salva os dados
      await saveDiagnostico(formData);
      
      // Calcula resultados e gera insights
      await calculaResultados();
      
      // Avança para o resumo
      setStage('summary');
    } catch (error) {
      console.error('Erro ao processar diagnóstico:', error);
    }
  };

  // Manipulador para finalização do diagnóstico
  const handleFinalizarDiagnostico = () => {
    // Chama callback para informar que o diagnóstico foi concluído
    onComplete();
  };

  // Manipulador para cancelar o diagnóstico
  const handleCancelarDiagnostico = () => {
    if (isFirstTime) {
      // Se é primeira vez, pergunta se quer ir direto para dashboard
      if (window.confirm('Deseja pular o diagnóstico e ir direto para o painel de controle?')) {
        onSkipToDashboard();
      }
    } else {
      // Se não é primeira vez, apenas confirma o cancelamento
      if (window.confirm('Tem certeza que deseja cancelar o diagnóstico? Seu progresso será perdido.')) {
        onComplete(); // Volta para onde estava
      }
    }
  };

  // Renderiza o loading state
  if (loading) {
    return (
      <div className="diagnostico-wrapper">
        <div className="diagnostico-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Processando seu diagnóstico...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza o componente correto com base no estágio atual
  const renderStage = () => {
    switch (stage) {
      case 'jornada':
        return (
          <JornadaSelection 
            onSelect={handleJornadaSelect}
            isFirstTime={isFirstTime}
          />
        );
      case 'diagnostico':
        return (
          <DiagnosticoForm 
            onSubmit={handleDiagnosticoSubmit} 
            onCancel={handleCancelarDiagnostico}
            initialData={diagnosticoData}
          />
        );
      case 'summary':
        return (
          <DiagnosticoSummary 
            diagnosticoData={diagnosticoData} 
            onFinish={handleFinalizarDiagnostico} 
          />
        );
      default:
        return (
          <JornadaSelection 
            onSelect={handleJornadaSelect}
            isFirstTime={isFirstTime}
          />
        );
    }
  };

  return (
    <div className="diagnostico-wrapper">
      <div className="diagnostico-container">
        {/* Header */}
        <div className="diagnostico-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="diagnostico-title">
                {isFirstTime && stage === 'jornada' ? 'Bem-vindo ao iPoupei!' : 'Diagnóstico Financeiro'}
              </h1>
              <p className="diagnostico-subtitle">
                {isFirstTime && stage === 'jornada' 
                  ? 'Vamos começar organizando sua vida financeira. Escolha como deseja usar o iPoupei.'
                  : 'Vamos entender sua situação atual para te ajudar melhor'
                }
              </p>
            </div>
            {stage !== 'jornada' && (
              <button 
                onClick={handleCancelarDiagnostico}
                className="btn btn-secondary"
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '0.5rem'
                }}
                aria-label="Cancelar diagnóstico"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Banner especial para primeira vez */}
        {isFirstTime && stage === 'jornada' && (
          <div className="info-box success" style={{ margin: '1.5rem 2rem' }}>
            <div className="info-icon">🎉</div>
            <div className="info-content">
              <h4>Seja bem-vindo ao iPoupei!</h4>
              <p>Estamos muito felizes em ter você aqui. Vamos começar sua jornada financeira da melhor forma possível.</p>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="info-box error" style={{ margin: '1.5rem 2rem' }}>
            <div className="info-icon">⚠️</div>
            <div className="info-content">
              <h4>Erro ao processar diagnóstico</h4>
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="diagnostico-content">
          {renderStage()}
        </div>
      </div>
    </div>
  );
};

DiagnosticoRouter.propTypes = {
  isFirstTime: PropTypes.bool,
  onComplete: PropTypes.func,
  onSkipToDashboard: PropTypes.func
};

export default DiagnosticoRouter;