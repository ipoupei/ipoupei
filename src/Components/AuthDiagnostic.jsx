// Componente temporário para diagnosticar problemas de exclusão de usuário
// USAR APENAS EM DESENVOLVIMENTO - REMOVER APÓS TESTE

import React, { useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@/modules/auth/hooks/useAuth';

const AuthDiagnostic = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, message, details = null) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);

    try {
      // 1. Verificar se usuário está autenticado
      addResult(
        'Usuário Autenticado',
        !!user,
        user ? `Usuário: ${user.email}` : 'Nenhum usuário logado',
        user ? { id: user.id, email: user.email } : null
      );

      if (!user) {
        addResult('ERRO', false, 'Precisa estar logado para executar diagnósticos');
        return;
      }

      // 2. Verificar permissões básicas do Supabase
      addResult(
        'Cliente Supabase',
        !!supabase,
        'Cliente Supabase inicializado',
        { url: supabase.supabaseUrl }
      );

      // 3. Verificar se consegue acessar dados do usuário atual
      try {
        const { data: profile, error: profileError } = await supabase
          .from('perfil_usuario')
          .select('*')
          .eq('id', user.id)
          .single();

        addResult(
          'Acesso ao Perfil',
          !profileError,
          profileError ? `Erro: ${profileError.message}` : 'Perfil acessado com sucesso',
          profile
        );
      } catch (err) {
        addResult('Acesso ao Perfil', false, `Erro inesperado: ${err.message}`);
      }

      // 4. Verificar se auth.admin está disponível
      addResult(
        'Auth Admin Disponível',
        !!supabase.auth.admin,
        supabase.auth.admin ? 'Auth Admin está disponível' : 'Auth Admin não está disponível'
      );

      // 5. Tentar listar usuários (teste de permissão admin)
      try {
        const { data: users, error: listError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1
        });

        addResult(
          'Permissões Admin',
          !listError,
          listError 
            ? `Erro ao listar usuários: ${listError.message}` 
            : 'Permissões admin funcionando',
          listError ? { error: listError } : { userCount: users?.users?.length || 0 }
        );
      } catch (err) {
        addResult(
          'Permissões Admin',
          false,
          `Erro inesperado ao testar admin: ${err.message}`,
          { error: err.message }
        );
      }

      // 6. Verificar se consegue buscar o próprio usuário via admin
      try {
        const { data: adminUser, error: getUserError } = await supabase.auth.admin.getUserById(user.id);

        addResult(
          'Buscar Usuário Admin',
          !getUserError,
          getUserError 
            ? `Erro ao buscar usuário: ${getUserError.message}`
            : 'Consegue buscar usuário via admin',
          adminUser ? { user: adminUser.user } : { error: getUserError }
        );
      } catch (err) {
        addResult(
          'Buscar Usuário Admin',
          false,
          `Erro inesperado: ${err.message}`
        );
      }

      // 7. Verificar configuração de Service Role
      try {
        // Tentar uma operação que requer service role
        const { data, error } = await supabase
          .from('auth.users')
          .select('id')
          .limit(1);

        addResult(
          'Service Role Key',
          !error,
          error 
            ? `Service Role não configurada ou sem permissão: ${error.message}`
            : 'Service Role configurada corretamente',
          error ? { error } : { hasServiceRole: true }
        );
      } catch (err) {
        addResult(
          'Service Role Key',
          false,
          `Erro ao verificar Service Role: ${err.message}`
        );
      }

      // 8. Simular teste de deleteUser (SEM EXECUTAR)
      addResult(
        'Simulação DeleteUser',
        true,
        `Comando seria: supabase.auth.admin.deleteUser('${user.id}')`,
        {
          userId: user.id,
          warning: 'NÃO EXECUTADO - apenas simulação'
        }
      );

    } catch (error) {
      addResult('ERRO GERAL', false, `Erro durante diagnósticos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteUserSafely = async () => {
    if (!user) {
      alert('Precisa estar logado para testar');
      return;
    }

    const confirmDelete = window.confirm(
      `⚠️ ATENÇÃO: Este teste vai tentar excluir sua conta de verdade!\n\n` +
      `Usuário: ${user.email}\n` +
      `ID: ${user.id}\n\n` +
      `Tem certeza que quer prosseguir?\n\n` +
      `(Recomendo usar uma conta de teste)`
    );

    if (!confirmDelete) return;

    setLoading(true);
    addResult('TESTE REAL DELETE', true, 'Iniciando teste real de exclusão...');

    try {
      // Primeiro, tentar listar o usuário para confirmar que existe
      const { data: beforeDelete, error: beforeError } = await supabase.auth.admin.getUserById(user.id);
      
      addResult(
        'Usuário Existe Antes',
        !beforeError,
        beforeError ? `Erro: ${beforeError.message}` : 'Usuário encontrado',
        beforeDelete
      );

      // Tentar excluir
      const { data: deleteResult, error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      addResult(
        'Resultado Delete',
        !deleteError,
        deleteError ? `ERRO AO EXCLUIR: ${deleteError.message}` : 'Usuário excluído com sucesso!',
        { deleteResult, deleteError }
      );

      // Verificar se realmente foi excluído
      setTimeout(async () => {
        try {
          const { data: afterDelete, error: afterError } = await supabase.auth.admin.getUserById(user.id);
          
          addResult(
            'Verificação Pós-Delete',
            !!afterError, // SUCESSO = erro (usuário não existe mais)
            afterError 
              ? `✅ Usuário realmente excluído: ${afterError.message}`
              : `❌ Usuário ainda existe após exclusão!`,
            { afterDelete, afterError }
          );
        } catch (err) {
          addResult(
            'Verificação Pós-Delete',
            true,
            `✅ Usuário não encontrado (provavelmente excluído): ${err.message}`
          );
        }
      }, 2000);

    } catch (error) {
      addResult(
        'ERRO NO TESTE',
        false,
        `Erro durante teste de exclusão: ${error.message}`,
        { error }
      );
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    const report = {
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
      results: results,
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `auth-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'system-ui'
    }}>
      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#856404', margin: '0 0 0.5rem 0' }}>
          🔬 Diagnóstico de Auth - APENAS DESENVOLVIMENTO
        </h2>
        <p style={{ color: '#856404', margin: 0, fontSize: '0.9rem' }}>
          Este componente deve ser removido antes de ir para produção.
          Use apenas para diagnosticar problemas de exclusão de usuário.
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={runDiagnostics}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '1rem'
          }}
        >
          {loading ? 'Executando...' : 'Executar Diagnósticos'}
        </button>

        <button 
          onClick={testDeleteUserSafely}
          disabled={loading || !user}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !user ? 'not-allowed' : 'pointer',
            marginRight: '1rem'
          }}
        >
          ⚠️ Teste Real Delete (CUIDADO!)
        </button>

        {results.length > 0 && (
          <button 
            onClick={exportResults}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📄 Exportar Relatório
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div>
          <h3>Resultados dos Testes:</h3>
          {results.map((result, index) => (
            <div 
              key={index}
              style={{
                padding: '1rem',
                marginBottom: '0.5rem',
                border: `1px solid ${result.success ? '#28a745' : '#dc3545'}`,
                borderRadius: '4px',
                backgroundColor: result.success ? '#d4edda' : '#f8d7da'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <strong style={{ 
                  color: result.success ? '#155724' : '#721c24' 
                }}>
                  {result.success ? '✅' : '❌'} {result.test}
                </strong>
                <small style={{ color: '#666' }}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </small>
              </div>
              
              <p style={{ 
                margin: '0.5rem 0',
                color: result.success ? '#155724' : '#721c24' 
              }}>
                {result.message}
              </p>
              
              {result.details && (
                <details>
                  <summary style={{ cursor: 'pointer', color: '#666' }}>
                    Ver detalhes
                  </summary>
                  <pre style={{ 
                    background: '#f8f9fa',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem'
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuthDiagnostic;