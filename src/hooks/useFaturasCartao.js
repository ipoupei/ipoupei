// Novo arquivo: src/hooks/useFaturasCartao.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

const useFaturasCartao = () => {
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Buscar faturas do usuário
  const fetchFaturas = useCallback(async (cartaoId = null, anoMes = null) => {
    if (!isAuthenticated || !user) return { success: false, error: 'Não autenticado' };

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('vw_faturas_cartao')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fatura_vencimento', { ascending: true });

      if (cartaoId) {
        query = query.eq('cartao_id', cartaoId);
      }

      if (anoMes) {
        // Filtrar por ano-mês específico
        const [ano, mes] = anoMes.split('-');
        query = query
          .gte('fatura_vencimento', `${ano}-${mes}-01`)
          .lt('fatura_vencimento', `${ano}-${String(parseInt(mes) + 1).padStart(2, '0')}-01`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFaturas(data || []);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao buscar faturas:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Buscar detalhes de uma fatura específica
  const fetchDetalhesFatura = useCallback(async (cartaoId, dataVencimento) => {
    if (!isAuthenticated || !user) return { success: false, error: 'Não autenticado' };

    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias(nome, cor),
          subcategoria:subcategorias(nome)
        `)
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .eq('fatura_vencimento', dataVencimento)
        .order('data', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('Erro ao buscar detalhes da fatura:', err);
      return { success: false, error: err.message };
    }
  }, [isAuthenticated, user]);

  return {
    faturas,
    loading,
    error,
    fetchFaturas,
    fetchDetalhesFatura
  };
};

export default useFaturasCartao;