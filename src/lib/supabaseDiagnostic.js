// supabaseDiagnostic.js - Ferramenta para diagnosticar problemas do Realtime
import { supabase } from '@lib/supabaseClient';

/**
 * Ferramentas de diagnóstico para o Supabase Realtime
 * Use isso para verificar se o problema está na configuração
 */

// ✅ 1. Verificar se o Realtime está habilitado
export const verificarRealtimeHabilitado = async () => {
  console.log('🔍 Verificando se Realtime está habilitado...');
  
  try {
    const { data, error } = await supabase
      .from('_realtime')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Realtime não está habilitado ou acessível:', error.message);
      return false;
    }
    
    console.log('✅ Realtime está habilitado');
    return true;
  } catch (err) {
    console.log('❌ Erro ao verificar Realtime:', err.message);
    return false;
  }
};

// ✅ 2. Testar conexão básica do canal
export const testarConexaoCanal = () => {
  console.log('🔍 Testando conexão básica do canal...');
  
  return new Promise((resolve) => {
    const channel = supabase
      .channel('test-connection')
      .subscribe((status) => {
        console.log(`📡 Status da conexão: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal conectado com sucesso');
          supabase.removeChannel(channel);
          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('❌ Erro na conexão do canal');
          resolve(false);
        }
      });
      
    // Timeout após 10 segundos
    setTimeout(() => {
      console.log('⏱️ Timeout na conexão do canal');
      supabase.removeChannel(channel);
      resolve(false);
    }, 10000);
  });
};

// ✅ 3. Verificar replicação da tabela transacoes
export const verificarReplicacaoTransacoes = async () => {
  console.log('🔍 Verificando replicação da tabela transacoes...');
  
  try {
    // Query para verificar se a tabela está na publicação realtime
    const { data, error } = await supabase
      .rpc('pg_publication_tables')
      .eq('pubname', 'supabase_realtime');
    
    if (error) {
      console.log('❌ Erro ao verificar publicação:', error.message);
      return false;
    }
    
    const transacoesReplicated = data?.some(table => 
      table.tablename === 'transacoes' || table.schemaname === 'public'
    );
    
    if (transacoesReplicated) {
      console.log('✅ Tabela transacoes está replicada');
      return true;
    } else {
      console.log('❌ Tabela transacoes NÃO está replicada');
      console.log('💡 Solução: Execute no SQL Editor do Supabase:');
      console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE transacoes;');
      return false;
    }
  } catch (err) {
    console.log('❌ Erro ao verificar replicação:', err.message);
    return false;
  }
};

// ✅ 4. Testar listener de transações
export const testarListenerTransacoes = (userId) => {
  console.log('🔍 Testando listener de transações...');
  
  return new Promise((resolve) => {
    let hasReceived = false;
    
    const channel = supabase
      .channel(`test-transacoes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacoes',
          filter: `usuario_id=eq.${userId}`
        },
        (payload) => {
          console.log('✅ Recebido evento de transação:', payload);
          hasReceived = true;
          supabase.removeChannel(channel);
          resolve(true);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status do listener: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Listener de transações conectado');
          console.log('💡 Agora crie uma transação para testar...');
        }
      });
    
    // Timeout após 30 segundos
    setTimeout(() => {
      if (!hasReceived) {
        console.log('⏱️ Timeout - nenhum evento recebido em 30 segundos');
        console.log('❌ Listener não está funcionando');
        supabase.removeChannel(channel);
        resolve(false);
      }
    }, 30000);
  });
};

// ✅ 5. Executar diagnóstico completo
export const executarDiagnosticoCompleto = async (userId) => {
  console.log('🚀 Executando diagnóstico completo do Supabase Realtime...');
  console.log('=' .repeat(60));
  
  const resultados = {
    realtimeHabilitado: false,
    conexaoCanal: false,
    replicacaoTransacoes: false,
    listenerFuncionando: false
  };
  
  // 1. Verificar Realtime
  resultados.realtimeHabilitado = await verificarRealtimeHabilitado();
  
  // 2. Testar conexão
  resultados.conexaoCanal = await testarConexaoCanal();
  
  // 3. Verificar replicação
  resultados.replicacaoTransacoes = await verificarReplicacaoTransacoes();
  
  // 4. Testar listener (apenas se os outros passaram)
  if (resultados.conexaoCanal && resultados.replicacaoTransacoes) {
    console.log('💡 Teste do listener iniciado - crie uma transação nos próximos 30 segundos...');
    resultados.listenerFuncionando = await testarListenerTransacoes(userId);
  }
  
  // Relatório final
  console.log('=' .repeat(60));
  console.log('📊 RELATÓRIO FINAL:');
  console.log(`   Realtime Habilitado: ${resultados.realtimeHabilitado ? '✅' : '❌'}`);
  console.log(`   Conexão do Canal: ${resultados.conexaoCanal ? '✅' : '❌'}`);
  console.log(`   Replicação Transações: ${resultados.replicacaoTransacoes ? '✅' : '❌'}`);
  console.log(`   Listener Funcionando: ${resultados.listenerFuncionando ? '✅' : '❌'}`);
  
  const tudoFuncionando = Object.values(resultados).every(Boolean);
  
  if (tudoFuncionando) {
    console.log('🎉 TUDO FUNCIONANDO! O problema pode estar no código do React.');
    console.log('💡 Sugestão: Use polling como backup no useContas.');
  } else {
    console.log('⚠️ PROBLEMAS ENCONTRADOS!');
    console.log('💡 Soluções:');
    
    if (!resultados.realtimeHabilitado) {
      console.log('   1. Habilite Realtime no Dashboard do Supabase');
    }
    
    if (!resultados.replicacaoTransacoes) {
      console.log('   2. Execute: ALTER PUBLICATION supabase_realtime ADD TABLE transacoes;');
    }
    
    if (!resultados.conexaoCanal) {
      console.log('   3. Verifique sua conexão de internet e configuração do Supabase');
    }
  }
  
  console.log('=' .repeat(60));
  
  return resultados;
};

// ✅ 6. Forçar recálculo de saldos (função de emergência)
export const forcarRecalculoSaldos = async (userId) => {
  console.log('🔄 Forçando recálculo de saldos...');
  
  try {
    // Buscar todas as contas
    const { data: contas, error: contasError } = await supabase
      .from('contas')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ativo', true);
    
    if (contasError) throw contasError;
    
    for (const conta of contas) {
      // Calcular saldo real
      const { data: transacoes, error: transacoesError } = await supabase
        .from('transacoes')
        .select('tipo, valor, efetivado, transferencia, conta_destino_id')
        .or(`conta_id.eq.${conta.id},conta_destino_id.eq.${conta.id}`)
        .eq('efetivado', true);
      
      if (transacoesError) {
        console.error(`❌ Erro ao calcular saldo da conta ${conta.nome}:`, transacoesError);
        continue;
      }
      
      let saldo = conta.saldo || 0; // saldo inicial
      
      transacoes?.forEach(t => {
        const valor = t.valor || 0;
        
        if (t.transferencia) {
          if (t.conta_destino_id === conta.id) {
            saldo += valor; // Entrada
          } else {
            saldo -= valor; // Saída
          }
        } else {
          if (t.tipo === 'receita') {
            saldo += valor;
          } else if (t.tipo === 'despesa') {
            saldo -= valor;
          }
        }
      });
      
      console.log(`💰 Conta ${conta.nome}: saldo inicial ${conta.saldo} → saldo calculado ${saldo}`);
      
      // Atualizar saldo na conta (opcional - apenas para debug)
      // Descomente se quiser persistir o saldo calculado
      /*
      const { error: updateError } = await supabase
        .from('contas')
        .update({ saldo_atual: saldo })
        .eq('id', conta.id);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar saldo da conta ${conta.nome}:`, updateError);
      }
      */
    }
    
    console.log('✅ Recálculo de saldos concluído');
  } catch (error) {
    console.error('❌ Erro no recálculo de saldos:', error);
  }
};

// ✅ Como usar este diagnóstico:
console.log(`
🔧 COMO USAR O DIAGNÓSTICO:

// No console do navegador ou componente React:
import { executarDiagnosticoCompleto } from './supabaseDiagnostic';

// Execute o diagnóstico completo
executarDiagnosticoCompleto('seu-user-id-aqui');

// Ou teste individualmente:
import { testarConexaoCanal, verificarReplicacaoTransacoes } from './supabaseDiagnostic';

testarConexaoCanal();
verificarReplicacaoTransacoes();
`);

export default {
  verificarRealtimeHabilitado,
  testarConexaoCanal,
  verificarReplicacaoTransacoes,
  testarListenerTransacoes,
  executarDiagnosticoCompleto,
  forcarRecalculoSaldos
};