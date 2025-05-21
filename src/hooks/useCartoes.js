import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook personalizado para gerenciar cartões de crédito
 * Conectado ao Supabase para operações CRUD reais
 * 
 * @returns {Object} - Objeto com dados e funções de manipulação de cartões
 */
const useCartoes = () => {
  // Estado para armazenar os cartões
  const [cartoes, setCartoes] = useState([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca todos os cartões
  const fetchCartoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Chama a API para buscar os cartões
      const { data, error } = await supabase
        .from('cartoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCartoes(data || []);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao buscar cartões:', err);
      setError('Não foi possível carregar seus cartões. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega os cartões ao inicializar o hook
  useEffect(() => {
    fetchCartoes();
  }, [fetchCartoes]);

  // Adiciona um novo cartão
  const addCartao = useCallback(async (novoCartao) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para inserção
      const dadosCartao = {
        ...novoCartao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Chama a API para adicionar o cartão
      const { data, error } = await supabase
        .from('cartoes')
        .insert([dadosCartao])
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local com o novo cartão
      if (data && data.length > 0) {
        setCartoes(prev => [...prev, data[0]]);
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao adicionar cartão: dados não retornados');
      }
    } catch (err) {
      console.error('Erro ao adicionar cartão:', err);
      setError('Não foi possível adicionar o cartão. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um cartão existente
  const updateCartao = useCallback(async (cartaoId, dadosAtualizados) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para atualização
      const dadosCartao = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };
      
      // Chama a API para atualizar o cartão
      const { data, error } = await supabase
        .from('cartoes')
        .update(dadosCartao)
        .eq('id', cartaoId)
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        setCartoes(prev => 
          prev.map(cartao => 
            cartao.id === cartaoId ? data[0] : cartao
          )
        );
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao atualizar cartão: dados não retornados');
      }
    } catch (err) {
      console.error('Erro ao atualizar cartão:', err);
      setError('Não foi possível atualizar o cartão. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Exclui um cartão
  const deleteCartao = useCallback(async (cartaoId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Chama a API para excluir o cartão
      const { error } = await supabase
        .from('cartoes')
        .delete()
        .eq('id', cartaoId);
      
      if (error) throw error;
      
      // Atualiza o estado local removendo o cartão
      setCartoes(prev => prev.filter(cartao => cartao.id !== cartaoId));
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir cartão:', err);
      setError('Não foi possível excluir o cartão. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Retorna os dados e funções
  return {
    cartoes,
    loading,
    error,
    fetchCartoes,
    addCartao,
    updateCartao,
    deleteCartao
  };
};

export default useCartoes;