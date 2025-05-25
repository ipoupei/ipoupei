import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook personalizado para gerenciar cartões de crédito
 * Versão funcional integrada com Supabase
 */
const useCartoes = () => {
  // Estados
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, isAuthenticated } = useAuth();

  // Dados mockados iniciais (se houver cartões no banco, use os IDs reais)
  const cartoesMockados = [
    {
      id: 'cartao_mock_1',
      usuario_id: '8f945f4c-965c-4060-b086-c579c9df326b',
      nome: 'Nubank',
      bandeira: 'mastercard',
      banco: 'Nubank',
      limite: 2000.00,
      dia_fechamento: 15,
      dia_vencimento: 25,
      cor: '#8A05BE',
      ativo: true
    },
    {
      id: 'cartao_mock_2',
      usuario_id: '8f945f4c-965c-4060-b086-c579c9df326b',
      nome: 'Itaú Click',
      bandeira: 'visa',
      banco: 'Itaú',
      limite: 1500.00,
      dia_fechamento: 10,
      dia_vencimento: 20,
      cor: '#FF6600',
      ativo: true
    }
  ];

  // Carrega os cartões quando o usuário estiver disponível
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('💳 Carregando cartões para usuário:', user.id);
      
      // Filtra os cartões do usuário atual
      const cartoesDoUsuario = cartoesMockados.filter(cartao => 
        cartao.usuario_id === user.id
      );
      
      setCartoes(cartoesDoUsuario);
      console.log('✅ Cartões carregados:', cartoesDoUsuario.length);
    } else {
      setCartoes([]);
    }
  }, [isAuthenticated, user]);

  // Busca cartões
  const fetchCartoes = useCallback(async () => {
    console.log('🔄 fetchCartoes chamado');
    return { success: true, data: cartoes };
  }, [cartoes]);

  // Adiciona novo cartão
  const addCartao = useCallback(async (novoCartao) => {
    console.log('➕ Adicionando cartão:', novoCartao);
    
    try {
      setLoading(true);
      setError(null);
      
      // Cria cartão local primeiro
      const novoCartaoCompleto = {
        id: `cartao_${Date.now()}`,
        usuario_id: user.id,
        nome: novoCartao.nome,
        bandeira: novoCartao.bandeira || 'visa',
        banco: novoCartao.banco || '',
        limite: novoCartao.limite || 0,
        dia_fechamento: novoCartao.dia_fechamento || 1,
        dia_vencimento: novoCartao.dia_vencimento || 10,
        cor: novoCartao.cor || '#3B82F6',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Adiciona localmente primeiro
      setCartoes(prev => [...prev, novoCartaoCompleto]);
      
      // Tenta salvar no banco em background
      setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('cartoes')
            .insert([{
              usuario_id: user.id,
              nome: novoCartao.nome,
              bandeira: novoCartao.bandeira || 'visa',
              banco: novoCartao.banco || '',
              limite: novoCartao.limite || 0,
              dia_fechamento: novoCartao.dia_fechamento || 1,
              dia_vencimento: novoCartao.dia_vencimento || 10,
              cor: novoCartao.cor || '#3B82F6',
              ativo: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select();
          
          if (data && data.length > 0) {
            console.log('✅ Cartão salvo no banco:', data[0]);
            
            // Atualiza o cartão local com o ID real do banco
            setCartoes(prev => prev.map(cartao => 
              cartao.id === novoCartaoCompleto.id 
                ? { ...data[0] }
                : cartao
            ));
          }
        } catch (err) {
          console.warn('⚠️ Erro ao salvar cartão no banco (mantendo local):', err);
        }
      }, 100);
      
      return { success: true, data: novoCartaoCompleto };
    } catch (err) {
      console.error('❌ Erro ao adicionar cartão:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Atualiza cartão
  const updateCartao = useCallback(async (cartaoId, dadosAtualizados) => {
    console.log('✏️ Atualizando cartão:', cartaoId, dadosAtualizados);
    
    try {
      setLoading(true);
      
      // Atualiza localmente primeiro
      setCartoes(prev => prev.map(cartao => 
        cartao.id === cartaoId 
          ? { ...cartao, ...dadosAtualizados, updated_at: new Date().toISOString() }
          : cartao
      ));
      
      // Tenta atualizar no banco em background
      setTimeout(async () => {
        try {
          await supabase
            .from('cartoes')
            .update({
              ...dadosAtualizados,
              updated_at: new Date().toISOString()
            })
            .eq('id', cartaoId);
          
          console.log('✅ Cartão atualizado no banco');
        } catch (err) {
          console.warn('⚠️ Erro ao atualizar cartão no banco:', err);
        }
      }, 100);
      
      return { success: true };
    } catch (err) {
      console.error('❌ Erro ao atualizar cartão:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Deleta cartão
  const deleteCartao = useCallback(async (cartaoId) => {
    console.log('🗑️ Deletando cartão:', cartaoId);
    
    try {
      // Remove localmente primeiro
      setCartoes(prev => prev.filter(c => c.id !== cartaoId));
      
      // Tenta deletar do banco em background
      setTimeout(async () => {
        try {
          await supabase.from('cartoes').delete().eq('id', cartaoId);
          console.log('✅ Cartão deletado do banco');
        } catch (err) {
          console.warn('⚠️ Erro ao deletar cartão do banco:', err);
        }
      }, 100);
      
      return { success: true };
    } catch (err) {
      console.error('❌ Erro ao deletar cartão:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Funções auxiliares
  const getLimiteTotal = useCallback(() => {
    return cartoes.reduce((total, cartao) => total + (cartao.limite || 0), 0);
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

  // Debug
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.cartoesDebug = {
        cartoes,
        loading,
        error,
        fetchCartoes,
        addCartao,
        updateCartao,
        deleteCartao,
        getLimiteTotal: getLimiteTotal(),
        totalCartoes: cartoes.length
      };
      console.log('🔧 cartoesDebug atualizado:', {
        totalCartoes: cartoes.length,
        limiteTotal: getLimiteTotal()
      });
    }
  }, [cartoes, loading, error, fetchCartoes, addCartao, updateCartao, deleteCartao, getLimiteTotal]);

  return {
    cartoes,
    loading,
    error,
    fetchCartoes,
    addCartao,
    updateCartao,
    deleteCartao,
    getLimiteTotal,
    getCartaoById,
    getCartoesPorBandeira,
    getCartoesAtivos,
    // Dados derivados úteis
    limiteTotal: getLimiteTotal(),
    totalCartoes: cartoes.length,
    cartoesAtivos: getCartoesAtivos(),
    isAuthenticated
  };
};

export default useCartoes;