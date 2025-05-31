import React, { useState } from 'react';
import useContas from '../hooks/useContas';
import useAuth from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

/**
 * Componente de debug para testar conexão com Supabase e carregar contas
 * Use este componente temporariamente para diagnosticar problemas
 */
const ContasDebugger = () => {
  const { user, isAuthenticated } = useAuth();
  const { contas, loading, error, fetchContas, testSupabaseConnection } = useContas();
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (test, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runFullDiagnostic = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      // Teste 1: Verificar se o Supabase está configurado
      addTestResult(
        'Configuração do Supabase',
        !!supabase,
        supabase ? 'Supabase client está configurado' : 'Supabase client não encontrado'
      );

      // Teste 2: Verificar autenticação
      addTestResult(
        'Autenticação',
        isAuthenticated && !!user,
        isAuthenticated && !!user ? 
          `Usuário autenticado: ${user.email} (ID: ${user.id})` : 
          'Usuário não autenticado'
      );

      if (!isAuthenticated || !user) {
        addTestResult('Diagnóstico', false, 'Não é possível continuar sem autenticação');
        return;
      }

      // Teste 3: Testar conexão geral
      const connectionTest = await testSupabaseConnection();
      addTestResult(
        'Conexão com banco',
        connectionTest,
        connectionTest ? 'Conexão com banco OK' : 'Falha na conexão com banco'
      );

      // Teste 4: Verificar se a tabela existe e tem estrutura correta
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from('contas')
          .select('*')
          .limit(1);

        addTestResult(
          'Estrutura da tabela',
          !tableError,
          tableError ? 
            `Erro na tabela: ${tableError.message}` : 
            'Tabela "contas" acessível'
        );
      } catch (err) {
        addTestResult('Estrutura da tabela', false, `Erro ao acessar tabela: ${err.message}`);
      }

      // Teste 5: Verificar políticas RLS (Row Level Security)
      try {
        const { data: allContas, error: rlsError } = await supabase
          .from('contas')
          .select('count', { count: 'exact', head: true });

        addTestResult(
          'Políticas de segurança',
          !rlsError,
          rlsError ? 
            `Erro de política RLS: ${rlsError.message}` : 
            'Políticas de segurança OK'
        );
      } catch (err) {
        addTestResult('Políticas de segurança', false, `Erro de RLS: ${err.message}`);
      }

      // Teste 6: Buscar contas do usuário específico
      try {
        const { data: userContas, error: userError, count } = await supabase
          .from('contas')
          .select('*', { count: 'exact' })
          .eq('usuario_id', user.id);

        addTestResult(
          'Busca de contas do usuário',
          !userError,
          userError ? 
            `Erro ao buscar contas: ${userError.message}` : 
            `Encontradas ${count || 0} contas para o usuário`,
          userContas
        );
      } catch (err) {
        addTestResult('Busca de contas do usuário', false, `Erro: ${err.message}`);
      }

      // Teste 7: Testar hook useContas
      try {
        const hookResult = await fetchContas();
        addTestResult(
          'Hook useContas',
          hookResult.success,
          hookResult.success ? 
            `Hook funcionando: ${hookResult.data?.length || 0} contas` : 
            `Hook com erro: ${hookResult.error}`
        );
      } catch (err) {
        addTestResult('Hook useContas', false, `Erro no hook: ${err.message}`);
      }

    } catch (err) {
      addTestResult('Diagnóstico geral', false, `Erro geral: ${err.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const createTestAccount = async () => {
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    try {
      setIsRunningTests(true);
      
      const testAccount = {
        usuario_id: user.id,
        nome: 'Conta Teste - ' + new Date().toLocaleString(),
        tipo: 'corrente',
        banco: 'Banco Teste',
        saldo: 1000,
        cor: '#3B82F6',
        ativo: true,
        incluir_soma_total: true,
        ordem: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('contas')
        .insert([testAccount])
        .select();

      addTestResult(
        'Criação de conta teste',
        !error,
        error ? 
          `Erro ao criar conta: ${error.message}` : 
          `Conta criada com sucesso: ${data[0]?.nome}`,
        data
      );

    } catch (err) {
      addTestResult('Criação de conta teste', false, `Erro: ${err.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      background: 'white', 
      border: '2px solid #3B82F6',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999,
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1F2937' }}>
        🔧 Debug das Contas
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <p><strong>Status atual:</strong></p>
        <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
          <li>Autenticado: {isAuthenticated ? '✅' : '❌'}</li>
          <li>Usuário: {user?.email || 'N/A'}</li>
          <li>Carregando: {loading ? '⏳' : '✅'}</li>
          <li>Contas: {contas.length}</li>
          <li>Erro: {error || 'Nenhum'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={runFullDiagnostic}
          disabled={isRunningTests}
          style={{
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: isRunningTests ? 'not-allowed' : 'pointer',
            marginRight: '8px',
            fontSize: '14px'
          }}
        >
          {isRunningTests ? '⏳ Testando...' : '🧪 Executar Diagnóstico'}
        </button>

        <button 
          onClick={createTestAccount}
          disabled={isRunningTests || !isAuthenticated}
          style={{
            background: '#10B981',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: (isRunningTests || !isAuthenticated) ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          ➕ Criar Conta Teste
        </button>
      </div>

      {testResults.length > 0 && (
        <div>
          <h4 style={{ margin: '16px 0 8px 0', fontSize: '16px' }}>Resultados:</h4>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  borderRadius: '4px',
                  background: result.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${result.success ? '#BBF7D0' : '#FECACA'}`,
                  fontSize: '12px'
                }}
              >
                <div style={{ 
                  fontWeight: 'bold',
                  color: result.success ? '#059669' : '#DC2626',
                  marginBottom: '4px'
                }}>
                  {result.success ? '✅' : '❌'} {result.test}
                </div>
                <div style={{ color: '#374151', lineHeight: '1.4' }}>
                  {result.message}
                </div>
                {result.data && (
                  <details style={{ marginTop: '4px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '11px' }}>Ver dados</summary>
                    <pre style={{ 
                      fontSize: '10px', 
                      overflow: 'auto',
                      background: '#F9FAFB',
                      padding: '4px',
                      borderRadius: '2px',
                      marginTop: '4px'
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
                <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>
                  {result.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={() => setTestResults([])}
        style={{
          background: '#6B7280',
          color: 'white',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          marginTop: '8px'
        }}
      >
        🗑️ Limpar Resultados
      </button>
    </div>
  );
};

export default ContasDebugger;