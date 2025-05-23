import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import JornadaSelection from './JornadaSelection';
import DiagnosticoForm from './DiagnosticoForm';
import DiagnosticoSummary from './DiagnosticoSummary';
import useDiagnostico from '../../hooks/useDiagnostico';
import PageContainer from '../../Components/layout/PageContainer';
import { X } from 'lucide-react';

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

  // Determina o título baseado no contexto
  const getTitle = () => {
    if (isFirstTime) {
      return stage === 'jornada' 
        ? 'Bem-vindo ao iPoupei!' 
        : 'Diagnóstico Financeiro';
    }
    return 'Diagnóstico Financeiro';
  };

  // Determina o subtítulo baseado no contexto
  const getSubtitle = () => {
    if (isFirstTime && stage === 'jornada') {
      return 'Vamos começar organizando sua vida financeira. Escolha como deseja usar o iPoupei.';
    }
    return 'Vamos entender sua situação atual para te ajudar melhor';
  };

  return (
    <PageContainer
      title={getTitle()}
      subtitle={getSubtitle()}
      actions={
        stage !== 'jornada' ? (
          <button 
            onClick={handleCancelarDiagnostico}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Cancelar diagnóstico"
          >
            <X size={20} />
          </button>
        ) : null
      }
      contentClassName="max-w-3xl mx-auto"
    >
      {/* Banner especial para primeira vez */}
      {isFirstTime && stage === 'jornada' && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              🎉 Seja bem-vindo ao iPoupei!
            </h2>
            <p className="text-blue-700">
              Estamos muito felizes em ter você aqui. Vamos começar sua jornada financeira da melhor forma possível.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-medium">Erro ao processar diagnóstico</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Processando...</p>
        </div>
      ) : (
        renderStage()
      )}
    </PageContainer>
  );
};

DiagnosticoRouter.propTypes = {
  isFirstTime: PropTypes.bool,
  onComplete: PropTypes.func,
  onSkipToDashboard: PropTypes.func
};

export default DiagnosticoRouter;