import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
const DiagnosticoRouter = () => {
  // Estados para controle de fluxo
  const [stage, setStage] = useState('jornada'); // jornada, diagnostico, summary
  const [selectedJornada, setSelectedJornada] = useState(null); // 'simples' ou 'completo'
  
  // Hook de diagnóstico (mockado)
  const { 
    diagnosticoData, 
    setDiagnosticoData, 
    saveDiagnostico, 
    calculaResultados,
    loading, 
    error 
  } = useDiagnostico();
  
  const navigate = useNavigate();

  // Manipulador para seleção de jornada
  const handleJornadaSelect = (jornada) => {
    setSelectedJornada(jornada);
    
    // Se usuário escolher apenas controlar gastos, pula direto para o dashboard
    if (jornada === 'simples') {
      navigate('/dashboard');
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
      
      // Salva os dados (mockado)
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
    // Navega para o dashboard
    navigate('/dashboard');
  };

  // Manipulador para cancelar o diagnóstico
  const handleCancelarDiagnostico = () => {
    if (window.confirm('Tem certeza que deseja cancelar o diagnóstico? Seu progresso será perdido.')) {
      navigate('/dashboard');
    }
  };

  // Renderiza o componente correto com base no estágio atual
  const renderStage = () => {
    switch (stage) {
      case 'jornada':
        return <JornadaSelection onSelect={handleJornadaSelect} />;
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
        return <JornadaSelection onSelect={handleJornadaSelect} />;
    }
  };

  return (
    <PageContainer
      title="Diagnóstico Financeiro"
      subtitle="Vamos entender sua situação atual para te ajudar melhor"
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

export default DiagnosticoRouter;
