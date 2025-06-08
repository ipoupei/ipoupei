// src/modules/diagnostico/pages/Diagnostico.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import useAuth from '@/modules/auth/hooks/useAuth';

// Componentes do diagnóstico
import DiagnosticoRouter from '../components/DiagnosticoRouter';
import WelcomeModal from '../components/WelcomeModal';

/**
 * Página principal do diagnóstico financeiro
 * Gerencia o fluxo completo do diagnóstico
 */
const Diagnostico = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diagnosticoStarted, setDiagnosticoStarted] = useState(false);

  // Verifica se é primeira vez do usuário
  useEffect(() => {
    const verificarPrimeiraVez = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: perfil, error } = await supabase
          .from('perfil_usuario')
          .select('diagnostico_completo')
          .eq('id', user.id)
          .single();

        const jaFezDiagnostico = perfil?.diagnostico_completo || false;
        
        setIsFirstTime(!jaFezDiagnostico);
        // Só mostra welcome se é primeira vez E não começou o diagnóstico ainda
        setShowWelcome(!jaFezDiagnostico && !diagnosticoStarted);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar primeira vez:', error);
        setIsFirstTime(true);
        setShowWelcome(!diagnosticoStarted);
        setLoading(false);
      }
    };

    verificarPrimeiraVez();
  }, [user?.id, diagnosticoStarted]);

  // Handler para começar diagnóstico (fecha modal e vai para router)
  const handleStartDiagnostico = () => {
    console.log('Iniciando diagnóstico...');
    setShowWelcome(false);
    setDiagnosticoStarted(true);
  };

  // Handler para pular para dashboard
  const handleSkipToDashboard = () => {
    console.log('Pulando para dashboard...');
    navigate('/dashboard');
  };

  // Handler para conclusão do diagnóstico
  const handleDiagnosticoComplete = () => {
    console.log('Diagnóstico concluído, redirecionando para dashboard...');
    navigate('/dashboard');
  };

  // Handler para fechar welcome modal sem escolher
  const handleCloseWelcome = () => {
    setShowWelcome(false);
    setDiagnosticoStarted(true);
  };

  console.log('Estado atual:', { 
    loading, 
    isFirstTime, 
    showWelcome, 
    diagnosticoStarted,
    userId: user?.id 
  });

  if (loading) {
    return (
      <div className="diagnostico-wrapper">
        <div className="diagnostico-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Carregando diagnóstico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Modal de boas-vindas para primeira vez */}
      {showWelcome && (
        <WelcomeModal
          isOpen={showWelcome}
          onClose={handleCloseWelcome}
          onStartDiagnostico={handleStartDiagnostico}
          onSkipToDashboard={handleSkipToDashboard}
        />
      )}

      {/* Router principal do diagnóstico - sempre renderizado quando não está loading */}
      {!loading && (
        <DiagnosticoRouter
          isFirstTime={isFirstTime}
          onComplete={handleDiagnosticoComplete}
          onSkipToDashboard={handleSkipToDashboard}
        />
      )}
    </div>
  );
};

export default Diagnostico;