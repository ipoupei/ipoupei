import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook personalizado para gerenciar contas bancárias
 * Versão final corrigida que resolve problemas de loading após refresh
 */
const useContas = () => {
  // Estados
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false); // Começar com false
  const [error, setError] = useState(null);

  // Hook de autenticação com novo campo initialized
  const { user, isAuthenticated, loading: authLoading, initialized } = useAuth();

  // Busca todas as contas do usuário logado
  const fetchContas = useCallback(async () => {
    // Aguarda a inicialização da autenticação terminar
    if (authLoading || !initialized) {
      return { success: false, error: 'Aguardando autenticação' };
    }

    if (!isAuthenticated || !user) {
      setContas([]);
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Busca as contas do usuário
      const { data, error, count } = await supabase
        .from('contas')
        .select('*', { count: 'exact' })
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setContas(data || []);
      return { success: true, data };
    } catch (err) {
      console.error('❌ useContas - Erro ao buscar contas:', err);
      const errorMessage = 'Não foi possível carregar suas contas. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [authLoading, initialized, isAuthenticated, user]);

  // Carrega as contas quando a autenticação estiver pronta
  useEffect(() => {
    // Só executa quando a autenticação terminou de inicializar
    if (!authLoading && initialized) {
      if (isAuthenticated && user) {
        fetchContas();
      } else {
        setContas([]);
        setLoading(false);
        setError(null);
      }
    }
  }, [authLoading, initialized, isAuthenticated, user, fetchContas]);

  // Adiciona uma nova conta
  const addConta = useCallback(async (novaConta) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para inserção
      const dadosConta = {
        usuario_id: user.id,
        nome: novaConta.nome?.trim() || '',
        tipo: novaConta.tipo || 'corrente',
        banco: novaConta.banco?.trim() || '',
        saldo: Number(novaConta.saldo) || 0,
        cor: novaConta.cor || '#3B82F6',
        ativo: true,
        incluir_soma_total: true,
        ordem: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Chama a API para adicionar a conta
      const { data, error } = await supabase
        .from('contas')
        .insert([dadosConta])
        .select();
      
      if (error) throw error;
      
      // Adiciona a nova conta ao estado local
      if (data && data.length > 0) {
        const novaContaCompleta = data[0];
        setContas(prev => [...prev, novaContaCompleta]);
        
        return { success: true, data: novaContaCompleta };
      } else {
        throw new Error('Erro ao adicionar conta: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useContas - Erro ao adicionar conta:', err);
      const errorMessage = 'Não foi possível adicionar a conta. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Atualiza uma conta
  const updateConta = useCallback(async (contaId, dadosAtualizados) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para atualização
      const dadosConta = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };
      
      // Remove campos que não devem ser atualizados
      delete dadosConta.id;
      delete dadosConta.usuario_id;
      delete dadosConta.created_at;
      
      // Chama a API para atualizar a conta
      const { data, error } = await supabase
        .from('contas')
        .update(dadosConta)
        .eq('id', contaId)
        .eq('usuario_id', user.id)
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        setContas(prev => prev.map(conta => 
          conta.id === contaId ? data[0] : conta
        ));
        
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao atualizar conta: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useContas - Erro ao atualizar conta:', err);
      const errorMessage = 'Não foi possível atualizar a conta. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Exclui uma conta
  const deleteConta = useCallback(async (contaId) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Verifica se a conta tem transações associadas
      const { data: transacoes, error: errorTransacoes } = await supabase
        .from('transacoes')
        .select('id')
        .eq('conta_id', contaId)
        .eq('usuario_id', user.id)
        .limit(1);
      
      if (errorTransacoes) {
        console.warn('⚠️ useContas - Erro ao verificar transações:', errorTransacoes);
      }
      
      // Se tem transações, apenas desativa; senão, exclui fisicamente
      if (transacoes && transacoes.length > 0) {
        const { error: errorUpdate } = await supabase
          .from('contas')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', contaId)
          .eq('usuario_id', user.id);
        
        if (errorUpdate) throw errorUpdate;
      } else {
        const { error } = await supabase
          .from('contas')
          .delete()
          .eq('id', contaId)
          .eq('usuario_id', user.id);
        
        if (error) throw error;
      }
      
      // Atualiza o estado local
      setContas(prev => {
        const novaLista = prev.filter(conta => conta.id !== contaId);
        return novaLista;
      });
      
      return { success: true };
      
    } catch (err) {
      console.error('❌ useContas - Erro ao excluir conta:', err);
      const errorMessage = 'Não foi possível excluir a conta. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Atualiza o saldo de uma conta
  const updateSaldo = useCallback(async (contaId, novoSaldo) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Chama a API para atualizar apenas o saldo
      const { data, error } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldo,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id)
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        setContas(prev => prev.map(conta => 
          conta.id === contaId ? { ...conta, saldo: novoSaldo } : conta
        ));
        
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao atualizar saldo: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useContas - Erro ao atualizar saldo:', err);
      const errorMessage = 'Não foi possível atualizar o saldo. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Funções auxiliares
  const getSaldoTotal = useCallback(() => {
    return contas.reduce((sum, conta) => sum + (Number(conta.saldo) || 0), 0);
  }, [contas]);

  const getContaById = useCallback((id) => {
    return contas.find(conta => conta.id === id);
  }, [contas]);

  const getContasPorTipo = useCallback((tipo) => {
    return contas.filter(conta => conta.tipo === tipo);
  }, [contas]);

  const getContasAtivas = useCallback(() => {
    return contas.filter(conta => conta.ativo);
  }, [contas]);

  return {
    contas,
    loading,
    error,
    fetchContas,
    addConta,
    updateConta,
    deleteConta,
    updateSaldo,
    getSaldoTotal,
    getContaById,
    getContasPorTipo,
    getContasAtivas,
    // Dados derivados úteis
    saldoTotal: getSaldoTotal(),
    totalContas: contas.length,
    contasAtivas: getContasAtivas(),
    isAuthenticated,
    // Estados da autenticação para debug
    authLoading,
    initialized
  };
};

export default useContas;