import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useAuth from '@/modules/auth/hooks/useAuth';

/**
 * Super debugger para identificar problemas específicos de conexão
 */
const SuperDebugger = () => {
  const { user, isAuthenticated } = useAuth();
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const log = (test, success, message, data = null) => {
    console.log(`${success ? '✅' : '❌'} ${test}: ${message}`, data);
    setResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runSuperDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // 1. Verificar dados do usuário autenticado
      log('Info do Usuário', true, `Email: ${user?.email}, ID: ${user?.id}`);

      // 2. Verificar configuração do cliente Supabase
      const supabaseUrl = supabase?.supabaseUrl;
      const supabaseKey = supabase?.supabaseKey;
      log('Config Supabase', !!supabaseUrl, `URL: ${supabaseUrl?.substring(0, 30)}...`);

      // 3. Verificar sessão atual
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      log('Sessão Atual', !sessionError && !!session?.session, 
        sessionError ? sessionError.message : `Sessão ativa: ${!!session?.session}`);

      // 4. Teste de conexão básico
      const { data: testData, error: testError } = await supabase
        .from('contas')
        .select('count')
        .limit(1);
      log('Conexão Básica', !testError, 
        testError ? `Erro: ${testError.message}` : 'Conexão OK');

      // 5. Verificar se RLS está desabilitado
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('check_rls_status', { table_name: 'contas' })
        .single();
      
      if (rlsError) {
        // Se a função não existe, vamos criar uma query direta
        const { data: rlsCheck, error: rlsCheckError } = await supabase
          .from('pg_class')
          .select('relrowsecurity')
          .eq('relname', 'contas')
          .single();
        
        log('Status RLS', !rlsCheckError, 
          rlsCheckError ? 'Erro ao verificar RLS' : 
          `RLS ${rlsCheck?.relrowsecurity ? 'HABILITADO' : 'DESABILITADO'}`);
      } else {
        log('Status RLS', true, `RLS: ${rlsStatus ? 'HABILITADO' : 'DESABILITADO'}`);
      }

      // 6. Buscar TODAS as contas (ignorando usuário)
      const { data: allContas, error: allError, count: allCount } = await supabase
        .from('contas')
        .select('*', { count: 'exact' });
      
      log('Todas as Contas', !allError, 
        allError ? `Erro: ${allError.message}` : 
        `Total: ${allCount} contas encontradas`, allContas);

      // 7. Buscar contas por usuario_id específico
      if (user?.id) {
        const { data: userContas, error: userError, count: userCount } = await supabase
          .from('contas')
          .select('*', { count: 'exact' })
          .eq('usuario_id', user.id);
        
        log('Contas do Usuário', !userError, 
          userError ? `Erro: ${userError.message}` : 
          `Contas do usuário ${user.id}: ${userCount}`, userContas);

        // 8. Verificar se o usuario_id nas contas bate com o do usuário logado
        if (allContas && allContas.length > 0) {
          const userIds = [...new Set(allContas.map(c => c.usuario_id))];
          log('IDs de Usuário nas Contas', true, 
            `IDs encontrados: ${userIds.join(', ')}`, userIds);
          
          const hasMatchingId = userIds.includes(user.id);
          log('ID Compatível', hasMatchingId, 
            hasMatchingId ? 'ID do usuário encontrado nas contas' : 
            `ID do usuário (${user.id}) NÃO encontrado nas contas`);
        }
      }

      // 9. Testar inserção de conta
      const testAccount = {
        usuario_id: user?.id,
        nome: `Teste ${Date.now()}`,
        tipo: 'corrente',
        banco: 'Teste',
        saldo: 100,
        cor: '#FF0000',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('contas')
        .insert([testAccount])
        .select();

      log('Teste de Inserção', !insertError, 
        insertError ? `Erro: ${insertError.message}` : 
        'Conta teste inserida com sucesso', insertData);

      // 10. Verificar novamente após inserção
      if (!insertError) {
        const { data: afterInsert, error: afterError, count: afterCount } = await supabase
          .from('contas')
          .select('*', { count: 'exact' })
          .eq('usuario_id', user.id);
        
        log('Após Inserção', !afterError, 
          afterError ? `Erro: ${afterError.message}` : 
          `Contas após inserção: ${afterCount}`, afterInsert);
      }

      // 11. Verificar header de autorização
      const authHeader = supabase.auth.session()?.access_token;
      log('Token de Auth', !!authHeader, 
        authHeader ? 'Token presente' : 'Token ausente');

      // 12. Teste com query SQL bruta
      const { data: sqlResult, error: sqlError } = await supabase
        .rpc('get_user_contas', { user_uuid: user?.id });
      
      if (sqlError && sqlError.code === '42883') {
        // Função não existe, vamos tentar uma query direta
        log('Query SQL', false, 'Função get_user_contas não existe (normal)');
      } else {
        log('Query SQL', !sqlError, 
          sqlError ? `Erro: ${sqlError.message}` : 
          `Resultado SQL: ${sqlResult?.length || 0} contas`, sqlResult);
      }

    } catch (err) {
      log('Erro Geral', false, `Erro inesperado: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => setResults([]);

  const createMultipleTestAccounts = async () => {
    if (!user?.id) {
      alert('Usuário não disponível');
      return;
    }

    setIsRunning(true);
    
    const testAccounts = [
      {
        usuario_id: user.id,
        nome: 'Conta Corrente Teste',
        tipo: 'corrente',
        banco: 'Banco Teste',
        saldo: 1500.50,
        cor: '#3B82F6',
        ativo: true
      },
      {
        usuario_id: user.id,
        nome: 'Poupança Teste',
        tipo: 'poupanca',
        banco: 'Banco Teste',
        saldo: 5000.00,
        cor: '#10B981',
        ativo: true
      }
    ].map(account => ({
      ...account,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    try {
      const { data, error } = await supabase
        .from('contas')
        .insert(testAccounts)
        .select();

      log('Inserção Múltipla', !error, 
        error ? `Erro: ${error.message}` : 
        `${data?.length || 0} contas criadas`, data);

    } catch (err) {
      log('Erro na Inserção', false, err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
      background: 'white', 
      border: '3px solid #DC2626',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'auto',
      zIndex: 10000,
      boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#DC2626' }}>
        🚨 Super Diagnóstico - Contas
      </h3>

      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
        <p><strong>Status Básico:</strong></p>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Autenticado: {isAuthenticated ? '✅' : '❌'}</li>
          <li>User ID: {user?.id?.substring(0, 8)}...</li>
          <li>Email: {user?.email}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={runSuperDiagnostic}
          disabled={isRunning}
          style={{
            background: '#DC2626',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? '⏳ Executando...' : '🚨 Super Diagnóstico'}
        </button>

        <button 
          onClick={createMultipleTestAccounts}
          disabled={isRunning || !isAuthenticated}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: (isRunning || !isAuthenticated) ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          ➕ Criar Contas Teste
        </button>

        <button 
          onClick={clearResults}
          style={{
            background: '#6B7280',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🗑️ Limpar
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px', color: '#1F2937' }}>
            Resultados Detalhados:
          </h4>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {results.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '10px',
                  margin: '6px 0',
                  borderRadius: '6px',
                  background: result.success ? '#ECFDF5' : '#FEF2F2',
                  border: `2px solid ${result.success ? '#10B981' : '#EF4444'}`,
                  fontSize: '12px'
                }}
              >
                <div style={{ 
                  fontWeight: 'bold',
                  color: result.success ? '#065F46' : '#991B1B',
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{result.success ? '✅' : '❌'} {result.test}</span>
                  <span style={{ fontSize: '10px', fontWeight: 'normal' }}>
                    {result.timestamp}
                  </span>
                </div>
                <div style={{ 
                  color: '#374151', 
                  lineHeight: '1.4',
                  marginBottom: result.data ? '6px' : '0'
                }}>
                  {result.message}
                </div>
                {result.data && (
                  <details style={{ marginTop: '6px' }}>
                    <summary style={{ 
                      cursor: 'pointer', 
                      fontSize: '10px',
                      color: '#6B7280',
                      fontWeight: 'bold'
                    }}>
                      📋 Ver dados completos
                    </summary>
                    <pre style={{ 
                      fontSize: '9px', 
                      overflow: 'auto',
                      background: '#F9FAFB',
                      padding: '6px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      maxHeight: '150px',
                      border: '1px solid #E5E7EB'
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperDebugger;