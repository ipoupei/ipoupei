import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook personalizado para gerenciar cartões de crédito
 * Versão integrada com Supabase seguindo o mesmo padrão das contas
 */
const useCartoes = () => {
  // Estados
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(false); // Começar com false
  const [error, setError] = useState(null);

  // Hook de autenticação com novo campo initialized
  const { user, isAuthenticated, loading: authLoading, initialized } = useAuth();

  // Debug do estado da autenticação
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('💳 useCartoes - Estado da autenticação:', {
        isAuthenticated,
        hasUser: !!user,
        authLoading,
        initialized,
        userId: user?.id?.substring(0, 8)
      });
    }
  }, [isAuthenticated, user, authLoading, initialized]);

  // Busca todos os cartões do usuário logado
  const fetchCartoes = useCallback(async () => {
    // Aguarda a inicialização da autenticação terminar
    if (authLoading || !initialized) {
      console.log('⏳ useCartoes - Aguardando inicialização da auth...');
      return { success: false, error: 'Aguardando autenticação' };
    }

    if (!isAuthenticated || !user) {
      console.log('❌ useCartoes - Usuário não autenticado');
      setCartoes([]);
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useCartoes - Buscando cartões para usuário:', user.id);
      
      // Busca os cartões do usuário
      const { data, error, count } = await supabase
        .from('cartoes')
        .select('*', { count: 'exact' })
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      
      console.log('📊 useCartoes - Resultado da busca:', {
        data,
        error,
        count,
        dataLength: data?.length
      });
      
      if (error) throw error;
      
      setCartoes(data || []);
      console.log('✅ useCartoes - Cartões carregados:', data?.length || 0);
      return { success: true, data };
    } catch (err) {
      console.error('❌ useCartoes - Erro ao buscar cartões:', err);
      const errorMessage = 'Não foi possível carregar seus cartões. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [authLoading, initialized, isAuthenticated, user]);

  // Carrega os cartões quando a autenticação estiver pronta
  useEffect(() => {
    console.log('🔄 useCartoes - Effect disparado:', {
      authLoading,
      initialized,
      isAuthenticated,
      hasUser: !!user
    });
    
    // Só executa quando a autenticação terminou de inicializar
    if (!authLoading && initialized) {
      if (isAuthenticated && user) {
        console.log('🚀 useCartoes - Executando fetchCartoes...');
        fetchCartoes();
      } else {
        console.log('🧹 useCartoes - Limpando cartões (usuário não autenticado)');
        setCartoes([]);
        setLoading(false);
        setError(null);
      }
    }
  }, [authLoading, initialized, isAuthenticated, user, fetchCartoes]);

  // Adiciona um novo cartão
  const addCartao = useCallback(async (novoCartao) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('➕ useCartoes - Adicionando cartão:', novoCartao);
      
      // Prepara os dados para inserção
      const dadosCartao = {
        usuario_id: user.id,
        nome: novoCartao.nome?.trim() || '',
        bandeira: novoCartao.bandeira || 'visa',
        banco: novoCartao.banco?.trim() || '',
        limite: Number(novoCartao.limite) || 0,
        dia_fechamento: Number(novoCartao.dia_fechamento) || 1,
        dia_vencimento: Number(novoCartao.dia_vencimento) || 10,
        cor: novoCartao.cor || '#8A05BE',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 useCartoes - Dados preparados:', dadosCartao);
      
      // Chama a API para adicionar o cartão
      const { data, error } = await supabase
        .from('cartoes')
        .insert([dadosCartao])
        .select();
      
      console.log('📊 useCartoes - Resultado da inserção:', { data, error });
      
      if (error) throw error;
      
      // Adiciona o novo cartão ao estado local
      if (data && data.length > 0) {
        const novoCartaoCompleto = data[0];
        setCartoes(prev => {
          const novaLista = [...prev, novoCartaoCompleto];
          console.log('📋 useCartoes - Lista atualizada:', novaLista.length, 'cartões');
          return novaLista;
        });
        
        console.log('✅ useCartoes - Cartão adicionado com sucesso');
        return { success: true, data: novoCartaoCompleto };
      } else {
        throw new Error('Erro ao adicionar cartão: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useCartoes - Erro ao adicionar cartão:', err);
      const errorMessage = 'Não foi possível adicionar o cartão. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Atualiza um cartão
  const updateCartao = useCallback(async (cartaoId, dadosAtualizados) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('✏️ useCartoes - Atualizando cartão:', cartaoId, dadosAtualizados);
      
      // Prepara os dados para atualização
      const dadosCartao = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };
      
      // Remove campos que não devem ser atualizados
      delete dadosCartao.id;
      delete dadosCartao.usuario_id;
      delete dadosCartao.created_at;
      
      // Chama a API para atualizar o cartão
      const { data, error } = await supabase
        .from('cartoes')
        .update(dadosCartao)
        .eq('id', cartaoId)
        .eq('usuario_id', user.id)
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        setCartoes(prev => prev.map(cartao => 
          cartao.id === cartaoId ? data[0] : cartao
        ));
        
        console.log('✅ useCartoes - Cartão atualizado com sucesso');
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao atualizar cartão: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useCartoes - Erro ao atualizar cartão:', err);
      const errorMessage = 'Não foi possível atualizar o cartão. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Exclui um cartão
  const deleteCartao = useCallback(async (cartaoId) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🗑️ useCartoes - Excluindo cartão:', cartaoId);
      
      // Verifica se o cartão tem transações associadas
      const { data: transacoes, error: errorTransacoes } = await supabase
        .from('transacoes')
        .select('id')
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .limit(1);
      
      if (errorTransacoes) {
        console.warn('⚠️ useCartoes - Erro ao verificar transações:', errorTransacoes);
      }
      
      // Se tem transações, apenas desativa; senão, exclui fisicamente
      if (transacoes && transacoes.length > 0) {
        console.log('📝 useCartoes - Cartão tem transações, desativando...');
        const { error: errorUpdate } = await supabase
          .from('cartoes')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', cartaoId)
          .eq('usuario_id', user.id);
        
        if (errorUpdate) throw errorUpdate;
      } else {
        console.log('🗑️ useCartoes - Cartão sem transações, excluindo fisicamente...');
        const { error } = await supabase
          .from('cartoes')
          .delete()
          .eq('id', cartaoId)
          .eq('usuario_id', user.id);
        
        if (error) throw error;
      }
      
      // Atualiza o estado local
      setCartoes(prev => {
        const novaLista = prev.filter(cartao => cartao.id !== cartaoId);
        console.log('📋 useCartoes - Lista após exclusão:', novaLista.length, 'cartões');
        return novaLista;
      });
      
      console.log('✅ useCartoes - Cartão excluído com sucesso');
      return { success: true };
      
    } catch (err) {
      console.error('❌ useCartoes - Erro ao excluir cartão:', err);
      const errorMessage = 'Não foi possível excluir o cartão. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Busca faturas do cartão (se implementado)
  const getFaturasCartao = useCallback(async (cartaoId, mes, ano) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      console.log('🧾 useCartoes - Buscando faturas do cartão:', cartaoId, mes, ano);
      
      // Se você tiver uma tabela específica de faturas, use ela
      // Por enquanto, vou buscar transações do cartão
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .gte('data', `${ano}-${String(mes).padStart(2, '0')}-01`)
        .lt('data', `${ano}-${String(mes + 1).padStart(2, '0')}-01`)
        .order('data', { ascending: false });
      
      if (error) throw error;
      
      const valorTotal = data?.reduce((total, transacao) => total + (transacao.valor || 0), 0) || 0;
      
      return { 
        success: true, 
        data: {
          transacoes: data || [],
          valorTotal,
          mes,
          ano
        }
      };
    } catch (err) {
      console.error('❌ useCartoes - Erro ao buscar faturas:', err);
      return { success: false, error: err.message };
    }
  }, [isAuthenticated, user]);

  // Funções auxiliares
  const getLimiteTotal = useCallback(() => {
    const total = cartoes.reduce((sum, cartao) => sum + (Number(cartao.limite) || 0), 0);
    if (import.meta.env.DEV) {
      console.log('💰 useCartoes - Limite total calculado:', total, 'de', cartoes.length, 'cartões');
    }
    return total;
  }, [cartoes]);

  const getCartaoById = useCallback((id) => {
    return cartoes.find(cartao => cartao.id === id);
  }, [cartoes]);

  const getCartoesPorBandeira = useCallback((bandeira) => {
    return cartoes.filter(cartao => cartao.bandeira === bandeira);
  }, [cartoes]);

  const getCartoesAtivos = useCallback(() => {
    return cartoes.filter(cartao => cartao.ativo);
  }, [cartoes]);

  const getCartoesPorBanco = useCallback((banco) => {
    return cartoes.filter(cartao => cartao.banco === banco);
  }, [cartoes]);

  const getCartoesVencendoEm = useCallback((dias = 7) => {
    const hoje = new Date();
    const dataLimite = new Date(hoje.getTime() + (dias * 24 * 60 * 60 * 1000));
    
    return cartoes.filter(cartao => {
      const diaVencimento = cartao.dia_vencimento;
      const proximoVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
      
      // Se o vencimento já passou neste mês, considera o próximo mês
      if (proximoVencimento < hoje) {
        proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
      }
      
      return proximoVencimento <= dataLimite;
    });
  }, [cartoes]);

  // Debug em desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV) {
      const debugInfo = {
        cartoes,
        loading,
        error,
        authLoading,
        initialized,
        isAuthenticated,
        user: user ? { id: user.id, email: user.email } : null,
        totalCartoes: cartoes.length,
        limiteTotal: getLimiteTotal(),
        fetchCartoes,
        addCartao,
        updateCartao,
        deleteCartao,
        getFaturasCartao
      };
      
      window.cartoesDebug = debugInfo;
      console.log('🔧 useCartoes - Debug info atualizado:', {
        totalCartoes: cartoes.length,
        loading,
        authLoading,
        initialized,
        isAuthenticated
      });
    }
  }, [cartoes, loading, error, authLoading, initialized, isAuthenticated, user, getLimiteTotal, fetchCartoes, addCartao, updateCartao, deleteCartao, getFaturasCartao]);

  return {
    cartoes,
    loading,
    error,
    fetchCartoes,
    addCartao,
    updateCartao,
    deleteCartao,
    getFaturasCartao,
    getLimiteTotal,
    getCartaoById,
    getCartoesPorBandeira,
    getCartoesAtivos,
    getCartoesPorBanco,
    getCartoesVencendoEm,
    // Dados derivados úteis
    limiteTotal: getLimiteTotal(),
    totalCartoes: cartoes.length,
    cartoesAtivos: getCartoesAtivos(),
    cartoesVencendoEm7Dias: getCartoesVencendoEm(7),
    isAuthenticated,
    // Estados da autenticação para debug
    authLoading,
    initialized
  };
};

export default useCartoes;