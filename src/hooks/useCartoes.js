// src/hooks/useCartoes.js - Hook para gerenciar cartões
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const useCartoes = () => {
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar todos os cartões do usuário
  const fetchCartoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('cartoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;

      console.log('✅ Cartões carregados:', data?.length || 0);
      setCartoes(data || []);
      return { success: true, data: data || [] };

    } catch (err) {
      console.error('❌ Erro ao buscar cartões:', err);
      setError(err.message);
      
      // Retornar dados mock em caso de erro para desenvolvimento
      const mockCartoes = [
        { 
          id: '1', 
          nome: 'Nubank Roxinho', 
          bandeira: 'Mastercard', 
          cor: '#8A05BE',
          limite: 10000,
          dia_vencimento: 15,
          dia_fechamento: 5
        },
        { 
          id: '2', 
          nome: 'Inter Gold', 
          bandeira: 'Visa', 
          cor: '#FF7A00',
          limite: 5000,
          dia_vencimento: 10,
          dia_fechamento: 3
        },
        { 
          id: '3', 
          nome: 'C6 Bank', 
          bandeira: 'Mastercard', 
          cor: '#FFD700',
          limite: 8000,
          dia_vencimento: 20,
          dia_fechamento: 8
        }
      ];
      
      setCartoes(mockCartoes);
      return { success: false, error: err.message, data: mockCartoes };

    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar cartão específico por ID
  const fetchCartao = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('cartoes')
        .select('*')
        .eq('id', id)
        .eq('usuario_id', user.id)
        .single();

      if (error) throw error;

      return { success: true, data };

    } catch (err) {
      console.error('❌ Erro ao buscar cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar novo cartão
  const createCartao = useCallback(async (dadosCartao) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const novoCartao = {
        ...dadosCartao,
        usuario_id: user.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('cartoes')
        .insert([novoCartao])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      setCartoes(prev => [...prev, data]);

      console.log('✅ Cartão criado:', data);
      return { success: true, data };

    } catch (err) {
      console.error('❌ Erro ao criar cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar cartão existente
  const updateCartao = useCallback(async (id, dadosAtualizados) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('cartoes')
        .update({
          ...dadosAtualizados,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      setCartoes(prev => prev.map(cartao => 
        cartao.id === id ? { ...cartao, ...data } : cartao
      ));

      console.log('✅ Cartão atualizado:', data);
      return { success: true, data };

    } catch (err) {
      console.error('❌ Erro ao atualizar cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir cartão
  const deleteCartao = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('cartoes')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      // Remover da lista local
      setCartoes(prev => prev.filter(cartao => cartao.id !== id));

      console.log('✅ Cartão excluído:', id);
      return { success: true };

    } catch (err) {
      console.error('❌ Erro ao excluir cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar limite utilizado de um cartão
  const fetchLimiteUtilizado = useCallback(async (cartaoId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar soma das transações não pagas do cartão
      const { data, error } = await supabase
        .from('transacoes')
        .select('valor')
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .eq('tipo', 'despesa')
        .is('data_pagamento', null); // Transações não pagas

      if (error) throw error;

      const limiteUtilizado = data?.reduce((total, transacao) => total + transacao.valor, 0) || 0;

      return { success: true, data: limiteUtilizado };

    } catch (err) {
      console.error('❌ Erro ao calcular limite utilizado:', err);
      return { success: false, error: err.message, data: 0 };
    }
  }, []);

  // Obter estatísticas dos cartões
  const getEstatisticasCartoes = useCallback(() => {
    if (!cartoes.length) return null;

    const totalCartoes = cartoes.length;
    const limiteTotal = cartoes.reduce((acc, cartao) => acc + (cartao.limite || 0), 0);
    const cartaoMaiorLimite = cartoes.reduce((maior, cartao) => 
      (cartao.limite || 0) > (maior.limite || 0) ? cartao : maior
    , cartoes[0]);

    return {
      totalCartoes,
      limiteTotal,
      cartaoMaiorLimite,
      limiteMedio: limiteTotal / totalCartoes
    };
  }, [cartoes]);

  // Validar dados do cartão
  const validarCartao = useCallback((dadosCartao) => {
    const erros = [];

    if (!dadosCartao.nome || dadosCartao.nome.trim().length === 0) {
      erros.push('Nome do cartão é obrigatório');
    }

    if (!dadosCartao.bandeira) {
      erros.push('Bandeira do cartão é obrigatória');
    }

    if (!dadosCartao.limite || dadosCartao.limite <= 0) {
      erros.push('Limite deve ser maior que zero');
    }

    if (!dadosCartao.dia_vencimento || dadosCartao.dia_vencimento < 1 || dadosCartao.dia_vencimento > 31) {
      erros.push('Dia de vencimento deve estar entre 1 e 31');
    }

    if (!dadosCartao.dia_fechamento || dadosCartao.dia_fechamento < 1 || dadosCartao.dia_fechamento > 31) {
      erros.push('Dia de fechamento deve estar entre 1 e 31');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }, []);

  // Carregar cartões na inicialização
  useEffect(() => {
    fetchCartoes();
  }, [fetchCartoes]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    cartoes,
    loading,
    error,
    fetchCartoes,
    fetchCartao,
    createCartao,
    updateCartao,
    deleteCartao,
    fetchLimiteUtilizado,
    getEstatisticasCartoes,
    validarCartao,
    clearError
  };
};

export default useCartoes;