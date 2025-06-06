// src/modules/contas/hooks/useContas.js - VERSÃO CORRIGIDA SEM POLLING AGRESSIVO
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';

/**
 * Hook para gerenciar contas - VERSÃO CORRIGIDA
 * ✅ Removido polling agressivo (30s)
 * ✅ Mantido apenas realtime + refresh manual
 * ✅ Performance otimizada
 */
const useContas = () => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saldoTotal, setSaldoTotal] = useState(0);

  // ✅ Função simplificada para calcular saldo real
  const calcularSaldoReal = useCallback(async (contaId, saldoInicial = 0) => {
    try {
      console.log(`💰 Calculando saldo para conta ${contaId}`);
      
      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('tipo, valor, efetivado, transferencia, conta_destino_id')
        .or(`conta_id.eq.${contaId},conta_destino_id.eq.${contaId}`)
        .eq('efetivado', true);
      
      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        return saldoInicial;
      }
      
      if (!transacoes?.length) {
        console.log(`📊 Nenhuma transação, saldo = ${saldoInicial}`);
        return saldoInicial;
      }
      
      let saldo = saldoInicial;
      
      transacoes.forEach(t => {
        const valor = t.valor || 0;
        
        if (t.transferencia) {
          // Transferência
          if (t.conta_destino_id === contaId) {
            saldo += valor; // Entrada
          } else {
            saldo -= valor; // Saída
          }
        } else {
          // Transação normal
          if (t.tipo === 'receita') {
            saldo += valor;
          } else if (t.tipo === 'despesa') {
            saldo -= valor;
          }
        }
      });
      
      console.log(`📊 Saldo calculado: ${saldo} (base: ${saldoInicial}, transações: ${transacoes.length})`);
      return saldo;
      
    } catch (error) {
      console.error('❌ Erro no cálculo:', error);
      return saldoInicial;
    }
  }, []);

  // ✅ Função principal para buscar contas
  const fetchContas = useCallback(async () => {
    if (!user) {
      setContas([]);
      setSaldoTotal(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🏦 Buscando contas...');
      
      const { data: contasData, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      
      if (contasError) throw contasError;
      
      if (!contasData?.length) {
        setContas([]);
        setSaldoTotal(0);
        return;
      }
      
      console.log(`✅ ${contasData.length} contas encontradas, calculando saldos...`);
      
      // Calcular saldos para todas as contas
      const contasComSaldo = await Promise.all(
        contasData.map(async (conta) => {
          const saldoCalculado = await calcularSaldoReal(conta.id, conta.saldo || 0);
          
          return {
            ...conta,
            saldo_inicial: conta.saldo || 0,
            saldo: saldoCalculado,
            saldo_atual: saldoCalculado
          };
        })
      );
      
      setContas(contasComSaldo);
      
      // Calcular saldo total
      const total = contasComSaldo.reduce((acc, conta) => acc + (conta.saldo || 0), 0);
      setSaldoTotal(total);
      
      console.log('✅ Saldos calculados com sucesso, total:', total);
      
    } catch (err) {
      console.error('❌ Erro ao buscar contas:', err);
      setError(err.message);
      showNotification('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, calcularSaldoReal, showNotification]);

  // ✅ Carregar contas na inicialização
  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  // ✅ Listener para mudanças em transações (APENAS REALTIME - SEM POLLING)
  useEffect(() => {
    if (!user) return;

    console.log('👂 Configurando listener para transações (REALTIME APENAS)...');
    
    // Apenas realtime - SEM polling
    const channel = supabase
      .channel(`transacoes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacoes',
          filter: `usuario_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Transação modificada via realtime:', payload.eventType);
          // Delay pequeno para garantir que a transação foi commitada
          setTimeout(() => fetchContas(), 1000);
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do realtime:', status);
      });

    // ❌ REMOVIDO: Polling a cada 30 segundos (estava causando refreshes constantes)
    // const pollInterval = setInterval(() => {
    //   console.log('🔄 Atualizando contas via polling...');
    //   fetchContas();
    // }, 30000);

    return () => {
      console.log('🧹 Limpando listeners');
      supabase.removeChannel(channel);
      // clearInterval(pollInterval); // ❌ REMOVIDO
    };
  }, [user, fetchContas]);

  // ✅ Operações CRUD simplificadas
  const addConta = useCallback(async (dadosConta) => {
    try {
      const { data, error } = await supabase
        .from('contas')
        .insert([{
          ...dadosConta,
          usuario_id: user.id,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar lista
      await fetchContas();
      return data;
    } catch (error) {
      console.error('❌ Erro ao adicionar conta:', error);
      throw error;
    }
  }, [user.id, fetchContas]);

  const updateConta = useCallback(async (contaId, dadosAtualizacao) => {
    try {
      const { data, error } = await supabase
        .from('contas')
        .update({
          ...dadosAtualizacao,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar lista
      await fetchContas();
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      throw error;
    }
  }, [user.id, fetchContas]);

  const deleteConta = useCallback(async (contaId) => {
    try {
      const { error } = await supabase
        .from('contas')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id);

      if (error) throw error;
      
      // Atualizar lista
      await fetchContas();
    } catch (error) {
      console.error('❌ Erro ao desativar conta:', error);
      throw error;
    }
  }, [user.id, fetchContas]);

  // ✅ Funções utilitárias
  const recalcularSaldos = useCallback(() => {
    console.log('🔄 Forçando recálculo de saldos...');
    return fetchContas();
  }, [fetchContas]);

  const getSaldoConta = useCallback((contaId) => {
    const conta = contas.find(c => c.id === contaId);
    return conta ? conta.saldo : 0;
  }, [contas]);

  const getSaldoTotal = useCallback(() => {
    return saldoTotal;
  }, [saldoTotal]);

  return {
    contas,
    loading,
    error,
    saldoTotal, // ✅ Adicionado para evitar recálculos
    fetchContas,
    addConta,
    updateConta,
    deleteConta,
    recalcularSaldos,
    getSaldoConta,
    getSaldoTotal
  };
};

export default useContas;