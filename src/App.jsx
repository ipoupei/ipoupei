import React, { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import './App.css';
import { testarLeituraContas, verificarAutenticacao } from './lib/supabaseClient';
import './index.css';
import { AuthProvider } from './context/AuthContext';

/**
 * Componente principal da aplicação
 * Integrado com sistema de rotas do React Router e AuthProvider
 */
function App() {
  // Estado para informações de teste
  const [testeConexao, setTesteConexao] = useState({
    executado: false,
    resultado: null,
    mensagem: ""
  });

  // Teste de conexão com o Supabase (apenas em desenvolvimento)
  const executarTestesConexao = async () => {
    // Primeiro testa a autenticação
    const authResult = await verificarAutenticacao();
    
    // Se não estiver autenticado, não continua os testes
    if (!authResult.isAuthenticated) {
      setTesteConexao({
        executado: true,
        resultado: true, // Mudando para true pois é normal não estar autenticado inicialmente
        mensagem: "Supabase conectado - pronto para autenticação."
      });
      return;
    }
    
    // Testa a leitura de contas se autenticado
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
    };

    inicializar();
  }, []);

  return (
    <AuthProvider>
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
      
      {/* Sistema de rotas */}
      <AppRoutes />
      
    </AuthProvider>
  );
}

export default App;