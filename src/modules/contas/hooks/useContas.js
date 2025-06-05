// src/modules/contas/hooks/useContas.js - VERSÃO CORRIGIDA BUG 006
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';

/**
 * Hook para gerenciar contas
 * ✅ CORREÇÃO BUG 006: Agora escuta mudanças nas transações e recalcula saldos
 * ✅ CORREÇÃO: Saldo calculado dinamicamente = saldo_inicial + receitas - despesas
 * ✅ CORREÇÃO: Invalidação automática quando transações mudam
 */
const useContas = () => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ NOVA FUNÇÃO: Calcular saldo real da conta baseado em transações
  const calcularSaldoReal = useCallback(async (contaId, saldoInicial = 0) => {
    try {
      console.log(`💰 Calculando saldo real para conta ${contaId}, saldo inicial: ${saldoInicial}`);
      
      // Buscar todas as transações efetivadas desta conta
      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('tipo, valor, efetivado')
        .eq('conta_id', contaId)
        .eq('efetivado', true); // Apenas transações efetivadas
      
      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        return saldoInicial; // Retorna saldo inicial se der erro
      }
      
      if (!transacoes || transacoes.length === 0) {
        console.log(`📊 Nenhuma transação encontrada, saldo = ${saldoInicial}`);
        return saldoInicial;
      }
      
      // Calcular saldo: saldo_inicial + receitas - despesas
      const totalReceitas = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + (t.valor || 0), 0);
      
      const totalDespesas = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + (t.valor || 0), 0);
      
      const saldoCalculado = saldoInicial + totalReceitas - totalDespesas;
      
      console.log(`📊 Conta ${contaId}:`, {
        saldoInicial,
        totalReceitas,
        totalDespesas,
        saldoCalculado,
        transacoes: transacoes.length
      });
      
      return saldoCalculado;
      
    } catch (error) {
      console.error('❌ Erro ao calcular saldo real:', error);
      return saldoInicial;
    }
  }, []);

  // ✅ FUNÇÃO CORRIGIDA: Buscar contas com saldo calculado
  const fetchContas = useCallback(async () => {
    if (!user) {
      console.log('🚫 fetchContas: Usuário não encontrado');
      setContas([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🏦 Buscando contas do usuário:', user.id);
      
      // Buscar contas básicas
      const { data: contasData, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      
      if (contasError) {
        console.error('❌ Erro ao buscar contas:', contasError);
        throw contasError;
      }
      
      if (!contasData || contasData.length === 0) {
        console.log('📝 Nenhuma conta encontrada');
        setContas([]);
        return;
      }
      
      console.log(`✅ ${contasData.length} contas encontradas, calculando saldos...`);
      
      // ✅ CORREÇÃO BUG 006: Calcular saldo real para cada conta
      const contasComSaldoCalculado = await Promise.all(
        contasData.map(async (conta) => {
          const saldoReal = await calcularSaldoReal(conta.id, conta.saldo || 0);
          
          return {
            ...conta,
            saldo_inicial: conta.saldo || 0, // Manter saldo inicial
            saldo: saldoReal, // Saldo calculado atual
            saldo_atual: saldoReal // Alias para compatibilidade
          };
        })
      );
      
      console.log('✅ Saldos calculados para todas as contas');
      setContas(contasComSaldoCalculado);
      
    } catch (err) {
      console.error('❌ Erro ao buscar contas:', err);
      setError(err.message);
      showNotification('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, calcularSaldoReal, showNotification]);

  // ✅ Recarregar contas quando usuário muda
  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  // ✅ CORREÇÃO BUG 006: Listener para mudanças em transações
  useEffect(() => {
    if (!user) return;

    console.log('👂 Configurando listener para transações...');
    
    // Escutar mudanças em transações que afetam as contas
    const channel = supabase
      .channel('transacoes_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transacoes',
          filter: `usuario_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Transação modificada, recalculando saldos...', payload.eventType);
          
          // Pequeno delay para garantir que a transação foi commitada
          setTimeout(() => {
            fetchContas();
          }, 500);
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🧹 Removendo listener de transações');
      supabase.removeChannel(channel);
    };
  }, [user, fetchContas]);

  // Adicionar conta
  const addConta = useCallback(async (dadosConta) => {
    try {
      console.log('➕ Adicionando nova conta:', dadosConta);
      
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

      console.log('✅ Conta adicionada:', data);
      
      // Recalcular todas as contas
      await fetchContas();
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao adicionar conta:', error);
      throw error;
    }
  }, [user.id, fetchContas]);

  // Atualizar conta
  const updateConta = useCallback(async (contaId, dadosAtualizacao) => {
    try {
      console.log('📝 Atualizando conta:', contaId, dadosAtualizacao);
      
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

      console.log('✅ Conta atualizada:', data);
      
      // Recalcular todas as contas
      await fetchContas();
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      throw error;
    }
  }, [user.id, fetchContas]);

  // Deletar conta (na verdade, desativar)
  const deleteConta = useCallback(async (contaId) => {
    try {
      console.log('🗑️ Desativando conta:', contaId);
      
      const { error } = await supabase
        .from('contas')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      console.log('✅ Conta desativada');
      
      // Recalcular todas as contas
      await fetchContas();
      
    } catch (error) {
      console.error('❌ Erro ao desativar conta:', error);
      throw error;
    }
  }, [user.id, fetchContas]);

  // ✅ NOVA FUNÇÃO: Forçar recálculo de saldos (útil após transações)
  const recalcularSaldos = useCallback(async () => {
    console.log('🔄 Forçando recálculo de saldos...');
    await fetchContas();
  }, [fetchContas]);

  // ✅ NOVA FUNÇÃO: Obter saldo de uma conta específica
  const getSaldoConta = useCallback((contaId) => {
    const conta = contas.find(c => c.id === contaId);
    return conta ? conta.saldo : 0;
  }, [contas]);

  // ✅ NOVA FUNÇÃO: Calcular saldo total de todas as contas
  const getSaldoTotal = useCallback(() => {
    return contas.reduce((total, conta) => total + (conta.saldo || 0), 0);
  }, [contas]);

  return {
    contas,
    loading,
    error,
    fetchContas,
    addConta,
    updateConta,
    deleteConta,
    recalcularSaldos, // ✅ Nova função
    getSaldoConta, // ✅ Nova função
    getSaldoTotal // ✅ Nova função
  };
};

export default useContas;