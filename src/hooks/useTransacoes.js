// src/hooks/useTransacoes.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook básico para transações
 * Busca receitas e despesas reais do banco
 */
const useTransacoes = () => {
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, isAuthenticated } = useAuth();

  // Busca transações do banco
  const fetchTransacoes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setTransacoes([]);
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Busca transações com categorias
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias(id, nome, tipo, cor)
        `)
        .eq('usuario_id', user.id)
        .order('data', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      setTransacoes(data || []);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Erro ao buscar transações:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Carrega transações quando usuário muda
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransacoes();
    } else {
      setTransacoes([]);
    }
  }, [isAuthenticated, user, fetchTransacoes]);

  // Funções auxiliares para cálculos
  const getReceitas = useCallback(() => {
    return transacoes.filter(t => t.tipo === 'receita');
  }, [transacoes]);

  const getDespesas = useCallback(() => {
    return transacoes.filter(t => t.tipo === 'despesa');
  }, [transacoes]);

  const getTotalReceitas = useCallback(() => {
    return getReceitas().reduce((total, t) => total + (t.valor || 0), 0);
  }, [getReceitas]);

  const getTotalDespesas = useCallback(() => {
    return getDespesas().reduce((total, t) => total + (t.valor || 0), 0);
  }, [getDespesas]);

  // Agrupa por categoria
  const getReceitasPorCategoria = useCallback(() => {
    const receitas = getReceitas();
    const grupos = {};
    
    receitas.forEach(transacao => {
      const categoria = transacao.categoria?.nome || 'Sem categoria';
      const cor = transacao.categoria?.cor || '#3B82F6';
      
      if (!grupos[categoria]) {
        grupos[categoria] = {
          nome: categoria,
          valor: 0,
          color: cor
        };
      }
      grupos[categoria].valor += transacao.valor || 0;
    });
    
    return Object.values(grupos);
  }, [getReceitas]);

  const getDespesasPorCategoria = useCallback(() => {
    const despesas = getDespesas();
    const grupos = {};
    
    despesas.forEach(transacao => {
      const categoria = transacao.categoria?.nome || 'Sem categoria';
      const cor = transacao.categoria?.cor || '#EF4444';
      
      if (!grupos[categoria]) {
        grupos[categoria] = {
          nome: categoria,
          valor: 0,
          color: cor
        };
      }
      grupos[categoria].valor += transacao.valor || 0;
    });
    
    return Object.values(grupos);
  }, [getDespesas]);

  return {
    transacoes,
    loading,
    error,
    fetchTransacoes,
    getReceitas,
    getDespesas,
    getTotalReceitas,
    getTotalDespesas,
    getReceitasPorCategoria,
    getDespesasPorCategoria
  };
};

export default useTransacoes;