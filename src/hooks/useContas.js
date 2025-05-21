import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook personalizado para gerenciar contas bancárias
 * Conectado ao Supabase para operações CRUD reais
 * 
 * @returns {Object} - Objeto com dados e funções de manipulação de contas
 */
const useContas = () => {
  // Estado para armazenar as contas
  const [contas, setContas] = useState([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca todas as contas no banco de dados
  const fetchContas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Chama a API para buscar as contas
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      
      setContas(data || []);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao buscar contas:', err);
      setError('Não foi possível carregar suas contas. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega as contas ao inicializar o hook
  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  // Adiciona uma nova conta
  const addConta = useCallback(async (novaConta) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para inserção
      const dadosConta = {
        ...novaConta,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // A ordem será a última + 1
        ordem: contas.length > 0 
          ? Math.max(...contas.map(c => c.ordem || 0)) + 1 
          : 1
      };
      
      // Chama a API para adicionar a conta
      const { data, error } = await supabase
        .from('contas')
        .insert([dadosConta])
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local com a nova conta
      if (data && data.length > 0) {
        setContas(prev => [...prev, data[0]]);
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao adicionar conta: dados não retornados');
      }
    } catch (err) {
      console.error('Erro ao adicionar conta:', err);
      setError('Não foi possível adicionar a conta. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [contas]);

  // Atualiza uma conta existente
  const updateConta = useCallback(async (contaId, dadosAtualizados) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para atualização
      const dadosConta = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };
      
      // Chama a API para atualizar a conta
      const { data, error } = await supabase
        .from('contas')
        .update(dadosConta)
        .eq('id', contaId)
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        setContas(prev => 
          prev.map(conta => 
            conta.id === contaId ? data[0] : conta
          )
        );
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao atualizar conta: dados não retornados');
      }
    } catch (err) {
      console.error('Erro ao atualizar conta:', err);
      setError('Não foi possível atualizar a conta. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Exclui uma conta
  const deleteConta = useCallback(async (contaId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Chama a API para excluir a conta
      const { error } = await supabase
        .from('contas')
        .delete()
        .eq('id', contaId);
      
      if (error) throw error;
      
      // Atualiza o estado local removendo a conta
      setContas(prev => prev.filter(conta => conta.id !== contaId));
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      setError('Não foi possível excluir a conta. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Retorna os dados e funções
  return {
    contas,
    loading,
    error,
    fetchContas,
    addConta,
    updateConta,
    deleteConta
  };
};

export default useContas;