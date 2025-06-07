// src/modules/cartoes/hooks/useCartoes.js - VERSÃO OTIMIZADA
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';

const useCartoes = () => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // Estados otimizados
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache dos cartões para evitar re-fetches desnecessários
  const [lastFetch, setLastFetch] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Buscar todos os cartões do usuário
  const fetchCartoes = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      console.warn('useCartoes: Usuário não encontrado');
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar cache
    const now = Date.now();
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      console.log('useCartoes: Usando cache');
      return { success: true, data: cartoes };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando cartões do usuário:', user.id);

      const { data, error: supabaseError } = await supabase
        .from('cartoes')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true });

      if (supabaseError) {
        console.error('❌ Erro do Supabase:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ Cartões carregados:', data?.length || 0);
      setCartoes(data || []);
      setLastFetch(now);
      
      return { success: true, data: data || [] };

    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar cartões';
      console.error('❌ Erro ao buscar cartões:', err);
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, lastFetch, cartoes]);

  // Buscar cartão específico por ID
  const fetchCartao = useCallback(async (id) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('cartoes')
        .select('*')
        .eq('id', id)
        .eq('usuario_id', user.id)
        .single();

      if (supabaseError) throw supabaseError;

      return { success: true, data };

    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar cartão';
      console.error('❌ Erro ao buscar cartão:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Criar novo cartão
  const createCartao = useCallback(async (dadosCartao) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      // Validação dos dados
      const validation = validarCartao(dadosCartao);
      if (!validation.valido) {
        throw new Error(validation.erros[0]);
      }

      const novoCartao = {
        ...dadosCartao,
        usuario_id: user.id,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('➕ Criando cartão:', novoCartao);

      const { data, error: supabaseError } = await supabase
        .from('cartoes')
        .insert([novoCartao])
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ Erro do Supabase ao criar:', supabaseError);
        throw supabaseError;
      }

      // Atualizar lista local
      setCartoes(prev => [...prev, data]);
      setLastFetch(Date.now());

      console.log('✅ Cartão criado com sucesso:', data.id);
      showNotification('Cartão criado com sucesso!', 'success');
      
      return { success: true, data };

    } catch (err) {
      const errorMessage = err.message || 'Erro ao criar cartão';
      console.error('❌ Erro ao criar cartão:', err);
      setError(errorMessage);
      showNotification(`Erro ao criar cartão: ${errorMessage}`, 'error');
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, showNotification]);

  // Atualizar cartão existente
  const updateCartao = useCallback(async (id, dadosAtualizados) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      // Validação dos dados
      const validation = validarCartao(dadosAtualizados);
      if (!validation.valido) {
        throw new Error(validation.erros[0]);
      }

      const dadosComTimestamp = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };

      console.log('✏️ Atualizando cartão:', id, dadosComTimestamp);

      const { data, error: supabaseError } = await supabase
        .from('cartoes')
        .update(dadosComTimestamp)
        .eq('id', id)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ Erro do Supabase ao atualizar:', supabaseError);
        throw supabaseError;
      }

      // Atualizar lista local
      setCartoes(prev => prev.map(cartao => 
        cartao.id === id ? data : cartao
      ));
      setLastFetch(Date.now());

      console.log('✅ Cartão atualizado com sucesso:', id);
      showNotification('Cartão atualizado com sucesso!', 'success');
      
      return { success: true, data };

    } catch (err) {
      const errorMessage = err.message || 'Erro ao atualizar cartão';
      console.error('❌ Erro ao atualizar cartão:', err);
      setError(errorMessage);
      showNotification(`Erro ao atualizar cartão: ${errorMessage}`, 'error');
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, showNotification]);

  // Arquivar cartão (soft delete)
  const archiveCartao = useCallback(async (id) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📁 Arquivando cartão:', id);

      const { error: supabaseError } = await supabase
        .from('cartoes')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (supabaseError) {
        console.error('❌ Erro do Supabase ao arquivar:', supabaseError);
        throw supabaseError;
      }

      // Remover da lista local
      setCartoes(prev => prev.filter(cartao => cartao.id !== id));
      setLastFetch(Date.now());

      console.log('✅ Cartão arquivado com sucesso:', id);
      showNotification('Cartão arquivado com sucesso!', 'success');
      
      return { success: true };

    } catch (err) {
      const errorMessage = err.message || 'Erro ao arquivar cartão';
      console.error('❌ Erro ao arquivar cartão:', err);
      setError(errorMessage);
      showNotification(`Erro ao arquivar cartão: ${errorMessage}`, 'error');
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, showNotification]);

  // Excluir cartão permanentemente
  const deleteCartao = useCallback(async (id) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🗑️ Excluindo cartão permanentemente:', id);

      const { error: supabaseError } = await supabase
        .from('cartoes')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (supabaseError) {
        console.error('❌ Erro do Supabase ao excluir:', supabaseError);
        throw supabaseError;
      }

      // Remover da lista local
      setCartoes(prev => prev.filter(cartao => cartao.id !== id));
      setLastFetch(Date.now());

      console.log('✅ Cartão excluído permanentemente:', id);
      showNotification('Cartão excluído permanentemente!', 'success');
      
      return { success: true };

    } catch (err) {
      const errorMessage = err.message || 'Erro ao excluir cartão';
      console.error('❌ Erro ao excluir cartão:', err);
      setError(errorMessage);
      showNotification(`Erro ao excluir cartão: ${errorMessage}`, 'error');
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, showNotification]);

  // Limpar cache e forçar reload
  const invalidateCache = useCallback(() => {
    setLastFetch(null);
    fetchCartoes(true);
  }, [fetchCartoes]);

  // Carregar dados na inicialização
  useEffect(() => {
    if (user?.id && !lastFetch) {
      fetchCartoes();
    }
  }, [user?.id, fetchCartoes, lastFetch]);

  // Computações memoizadas
  const cartoesAtivos = useMemo(() => 
    cartoes.filter(cartao => cartao.ativo !== false), 
    [cartoes]
  );

  const totalLimite = useMemo(() => 
    cartoesAtivos.reduce((total, cartao) => total + (cartao.limite || 0), 0),
    [cartoesAtivos]
  );

  const cartoesOrdenados = useMemo(() => 
    cartoesAtivos.sort((a, b) => a.nome.localeCompare(b.nome)),
    [cartoesAtivos]
  );

  const estatisticas = useMemo(() => ({
    total: cartoesAtivos.length,
    totalLimite,
    limiteMedio: cartoesAtivos.length > 0 ? totalLimite / cartoesAtivos.length : 0,
    bandeiras: [...new Set(cartoesAtivos.map(c => c.bandeira))].length
  }), [cartoesAtivos, totalLimite]);

  // Função de validação otimizada
  const validarCartao = useCallback((dados) => {
    const erros = [];

    if (!dados.nome?.trim()) {
      erros.push('Nome do cartão é obrigatório');
    }

    if (!dados.bandeira?.trim()) {
      erros.push('Bandeira é obrigatória');
    }

    if (!dados.limite || dados.limite <= 0) {
      erros.push('Limite deve ser maior que zero');
    }

    if (dados.limite > 1000000) {
      erros.push('Limite não pode ser maior que R$ 1.000.000');
    }

    if (!dados.dia_vencimento || dados.dia_vencimento < 1 || dados.dia_vencimento > 31) {
      erros.push('Dia de vencimento deve estar entre 1 e 31');
    }

    if (!dados.dia_fechamento || dados.dia_fechamento < 1 || dados.dia_fechamento > 31) {
      erros.push('Dia de fechamento deve estar entre 1 e 31');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }, []);

  // Buscar cartão por nome/bandeira
  const buscarCartao = useCallback((termo) => {
    if (!termo) return cartoesAtivos;
    
    const termoLower = termo.toLowerCase();
    return cartoesAtivos.filter(cartao => 
      cartao.nome.toLowerCase().includes(termoLower) ||
      cartao.bandeira.toLowerCase().includes(termoLower)
    );
  }, [cartoesAtivos]);

  // Retorno do hook otimizado
  return {
    // Dados
    cartoes: cartoesOrdenados,
    cartoesAtivos,
    loading,
    error,
    estatisticas,

    // Ações
    fetchCartoes,
    fetchCartao,
    createCartao,
    updateCartao,
    archiveCartao,
    deleteCartao,
    invalidateCache,

    // Utilitários
    validarCartao,
    buscarCartao,

    // Estado
    hasCartoes: cartoesAtivos.length > 0,
    isLoading: loading,
    hasError: !!error,

    // Helpers
    clearError: () => setError(null)
  };
};

export default useCartoes;