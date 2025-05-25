import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import DiagnosticoRouter from './pages/diagnostico/DiagnosticoRouter';
import './App.css';
import { testarLeituraContas, verificarAutenticacao } from './lib/supabaseClient';
import { supabase } from './lib/supabaseClient';
import './index.css';
import './pages/diagnostico/Diagnostico.css';

/**
 * Componente principal da aplicação - Versão simplificada
 * Gerencia a navegação entre Dashboard e Diagnóstico baseado no perfil do usuário
 */
function App() {
  // Estados para controle de fluxo
  const [currentView, setCurrentView] = useState('loading'); // 'loading', 'dashboard', 'diagnostico'
  const [userProfile, setUserProfile] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  
  // Estado para informações de teste
  const [testeConexao, setTesteConexao] = useState({
    executado: false,
    resultado: null,
    mensagem: ""
  });

  // Função para verificar o perfil do usuário
  const verificarPerfilUsuario = async () => {
    try {
      // Primeiro verifica se o usuário está autenticado
      const authResult = await verificarAutenticacao();
      
      if (!authResult.isAuthenticated) {
        // Se não estiver autenticado, vai para diagnóstico (modo demo)
        setCurrentView('diagnostico');
        setIsFirstTime(true);
        return;
      }

      // Busca o perfil do usuário no Supabase
      const { data: perfil, error } = await supabase
        .from('perfil_usuario')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        // Erro diferente de "não encontrado"
        console.error('Erro ao buscar perfil:', error);
        setCurrentView('dashboard'); // Fallback para dashboard
        return;
      }

      if (!perfil || !perfil.diagnostico_completo) {
        // Usuário novo ou que nunca fez diagnóstico
        setIsFirstTime(true);
        setCurrentView('diagnostico');
      } else {
        // Usuário existente com diagnóstico completo
        setUserProfile(perfil);
        setCurrentView('dashboard');
      }

    } catch (err) {
      console.error('Erro ao verificar perfil do usuário:', err);
      // Em caso de erro, vai para dashboard como fallback
      setCurrentView('dashboard');
    }
  };

  // Teste de conexão com o Supabase (apenas em desenvolvimento)
  const executarTestesConexao = async () => {
    // Primeiro testa a autenticação
    const authResult = await verificarAutenticacao();
    
    // Se não estiver autenticado, não continua os testes
    if (!authResult.isAuthenticated) {
      setTesteConexao({
        executado: true,
        resultado: false,
        mensagem: "Modo demo ativo - funcionando sem autenticação para demonstração."
      });
      return;
    }
    
    // Testa a leitura de contas
    const testResult = await testarLeituraContas();
    
    if (testResult.success) {
      setTesteConexao({
        executado: true,
        resultado: true,
        mensagem: `Conexão com Supabase realizada com sucesso! Foram encontradas ${testResult.data.length} contas.`
      });
    } else {
      setTesteConexao({
        executado: true,
        resultado: false,
        mensagem: `Erro na conexão com Supabase: ${testResult.error?.message || 'Erro desconhecido'}`
      });
    }
  };

  // Hook de inicialização
  useEffect(() => {
    const inicializar = async () => {
      // Executa testes apenas em desenvolvimento
      if (import.meta.env.DEV) {
        await executarTestesConexao();
      }
      
      // Verifica o perfil do usuário para determinar a tela inicial
      await verificarPerfilUsuario();
    };

    inicializar();
  }, []);

  // Handler para quando o diagnóstico é concluído
  const handleDiagnosticoComplete = () => {
    setCurrentView('dashboard');
    setIsFirstTime(false);
  };

  // Handler para quando o usuário escolhe ir direto para o dashboard (jornada simples)
  const handleSkipToDashboard = () => {
    setCurrentView('dashboard');
    setIsFirstTime(false);
  };

  // Renderização condicional baseada no estado atual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'loading':
        return (
          <div className="loading-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f7fa'
          }}>
            <div className="loading-spinner" style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Carregando iPoupei...</p>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );
      
      case 'diagnostico':
        return (
          <DiagnosticoRouter 
            isFirstTime={isFirstTime}
            onComplete={handleDiagnosticoComplete}
            onSkipToDashboard={handleSkipToDashboard}
          />
        );
      
      case 'dashboard':
      default:
        return <Dashboard userProfile={userProfile} />;
    }
  };

  return (
    <>
      {/* Componente de teste de conexão - apenas em desenvolvimento */}
      {import.meta.env.DEV && testeConexao.executado && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            padding: '10px',
            background: testeConexao.resultado ? '#d1fae5' : '#fee2e2',
            color: testeConexao.resultado ? '#065f46' : '#b91c1c',
            zIndex: 9999,
            textAlign: 'center',
            borderBottom: '1px solid',
            borderColor: testeConexao.resultado ? '#a7f3d0' : '#fecaca',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            fontSize: '14px'
          }}
        >
          {testeConexao.mensagem}
          <button 
            style={{
              marginLeft: '10px',
              padding: '2px 10px',
              background: 'rgba(255,255,255,0.5)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setTesteConexao({...testeConexao, executado: false})}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Renderização da tela atual */}
      {renderCurrentView()}
    </>
  );
}

export default App;