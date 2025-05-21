import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import './App.css';
import { testarLeituraContas, verificarAutenticacao } from './lib/supabaseClient';

/**
 * Componente principal da aplicação
 * Temporariamente com código de teste para validar a conexão com o Supabase
 */
function App() {
  // Estado para informações de teste
  const [testeConexao, setTesteConexao] = useState({
    executado: false,
    resultado: null,
    mensagem: ""
  });

  // Teste de conexão com o Supabase
  useEffect(() => {
    const executarTestes = async () => {
      // Primeiro testa a autenticação
      const authResult = await verificarAutenticacao();
      
      // Se não estiver autenticado, não continua os testes
      if (!authResult.isAuthenticated) {
        setTesteConexao({
          executado: true,
          resultado: false,
          mensagem: "Erro: Usuário não autenticado. A autenticação é necessária para acessar os dados devido às políticas RLS."
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
    
    // Execute os testes apenas em ambiente de desenvolvimento
    if (import.meta.env.DEV) {
      executarTestes();
    }
  }, []);

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
            onClick={() => document.body.removeChild(document.querySelector('div'))}
          >
            x
          </button>
        </div>
      )}
      
      {/* Aplicação principal */}
      <Dashboard />
    </>
  );
}

export default App;