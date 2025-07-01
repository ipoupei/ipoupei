import React, { useEffect, useState, Suspense } from 'react';
import AppRoutes from '@routes/AppRoutes';
import './App.css';
import './index.css';
import { testarLeituraContas, verificarAutenticacao } from '@lib/supabaseClient';
import { useAuthListener } from '@modules/auth/store/authStore';

/**
 * 🔥 APP.JSX CORRIGIDO - FIX RENDER SILENCIOSO
 * PROBLEMA: React executava hooks mas não renderizava DOM
 * SOLUÇÃO: Suspense + Error Boundary + Loading garantido
 */

// Error Boundary para capturar erros de render
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 App Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1>⚠️ Erro na Aplicação</h1>
          <p>Algo deu errado. Tente recarregar a página.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              marginTop: '1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Recarregar
          </button>
          <details style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
            <summary>Detalhes do erro</summary>
            <pre style={{ textAlign: 'left', marginTop: '0.5rem' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component robusto
const AppLoading = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f8f9fa'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ marginTop: '1rem', color: '#6b7280' }}>
      Carregando iPoupei...
    </p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  // 🔥 FIX: Auth state com loading explícito
  const authState = useAuthListener();
  const [appReady, setAppReady] = useState(false);
  
  // Estado para informações de teste (mantido do código original)
  const [testeConexao, setTesteConexao] = useState({
    executado: false,
    resultado: null,
    mensagem: ""
  });

  // Teste de conexão com o Supabase (mantido e melhorado)
  const executarTestesConexao = async () => {
    try {
      const authResult = await verificarAutenticacao();
      
      if (!authResult.isAuthenticated) {
        setTesteConexao({
          executado: true,
          resultado: true,
          mensagem: "✅ Supabase conectado - pronto para autenticação."
        });
        return;
      }
      
      const testResult = await testarLeituraContas();
      
      if (testResult.success) {
        setTesteConexao({
          executado: true,
          resultado: true,
          mensagem: `✅ Conexão Supabase OK! Encontradas ${testResult.data.length} contas.`
        });
      } else {
        setTesteConexao({
          executado: true,
          resultado: false,
          mensagem: `❌ Erro Supabase: ${testResult.error?.message || 'Erro desconhecido'}`
        });
      }
    } catch (error) {
      setTesteConexao({
        executado: true,
        resultado: false,
        mensagem: `❌ Erro inesperado: ${error.message}`
      });
    }
  };

  // 🔥 FIX: Inicialização garantida
  useEffect(() => {
    const inicializar = async () => {
      try {
        console.log('🚀 App: Iniciando aplicação...');
        
        // Executa testes apenas em desenvolvimento
        if (import.meta.env.DEV) {
          console.log('🔧 App: Executando testes de conexão...');
          await executarTestesConexao();
        }
        
        // 🔥 GARANTIR que app está pronto
        setAppReady(true);
        console.log('✅ App: Aplicação pronta!');
        
      } catch (error) {
        console.error('❌ App: Erro na inicialização:', error);
        // Mesmo com erro, marca como pronto para não travar
        setAppReady(true);
      }
    };

    // 🔥 Delay mínimo para garantir DOM
    const timer = setTimeout(inicializar, 100);
    return () => clearTimeout(timer);
  }, []);

  // 🔥 FIX: Loading states explícitos
  if (!appReady) {
    return <AppLoading />;
  }

  return (
    <AppErrorBoundary>
      {/* Componente de teste de conexão - mantido e melhorado */}
      {import.meta.env.DEV && testeConexao.executado && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            padding: '8px 16px',
            background: testeConexao.resultado 
              ? 'linear-gradient(90deg, #d1fae5, #a7f3d0)' 
              : 'linear-gradient(90deg, #fee2e2, #fecaca)',
            color: testeConexao.resultado ? '#065f46' : '#b91c1c',
            zIndex: 9999,
            textAlign: 'center',
            borderBottom: '1px solid',
            borderColor: testeConexao.resultado ? '#10b981' : '#ef4444',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          <span>🔧 DEV: {testeConexao.mensagem}</span>
          <button 
            style={{
              marginLeft: '12px',
              padding: '2px 8px',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            onClick={() => setTesteConexao({...testeConexao, executado: false})}
          >
            ×
          </button>
        </div>
      )}
      
      {/* 🔥 FIX: Suspense + Error handling */}
      <Suspense fallback={<AppLoading />}>
        <div id="app-container" style={{ minHeight: '100vh' }}>
          <AppRoutes />
        </div>
      </Suspense>
    </AppErrorBoundary>
  );
}

export default App;