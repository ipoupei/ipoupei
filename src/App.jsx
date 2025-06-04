import React, { useEffect, useState } from 'react';
import AppRoutes from '@routes/AppRoutes';
import './App.css';
import './index.css';
import { testarLeituraContas, verificarAutenticacao } from '@lib/supabaseClient';
import { useAuthListener } from '@modules/auth/store/authStore';

/**
 * Componente principal da aplicação iPoupei
 * MELHORADO: Usa useAuthListener (padrão do authStore) + mantém testes de conexão
 * Sistema 100% Zustand - SEM dupla inicialização
 */
function App() {
  // Hook de autenticação que inicializa tudo automaticamente
  // MELHORADO: Usa o padrão correto do authStore.js
  useAuthListener();
  
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

  // Hook de inicialização (melhorado - SEM dupla inicialização)
  useEffect(() => {
    const inicializar = async () => {
      // Executa testes apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('🔧 App: Executando testes de conexão...');
        await executarTestesConexao();
      }
    };

    inicializar();
  }, []); // REMOVIDO initAuth - já é feito pelo useAuthListener

  return (
    <>
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
      
      {/* Sistema de rotas */}
      <AppRoutes />
    </>
  );
}

export default App;