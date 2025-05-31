import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';
import { categoriasStore } from '../store/categoriasStore';

/**
 * Hook personalizado para gerenciar categorias e subcategorias (receitas e despesas)
 * Versão com store global para sincronização perfeita entre componentes
 */
const useCategorias = () => {
  // Estado para armazenar as categorias
  const [categorias, setCategorias] = useState([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook de autenticação
  const { user, isAuthenticated, loading: authLoading, initialized } = useAuth();

  // Busca todas as categorias e subcategorias do usuário logado
  const fetchCategorias = useCallback(async () => {
    // Aguarda a inicialização da autenticação terminar
    if (authLoading || !initialized) {
      return { success: false, error: 'Aguardando autenticação' };
    }

    if (!isAuthenticated || !user) {
      setCategorias([]);
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Busca as categorias principais do usuário
      const { data: dataCategoria, error: errorCategoria } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      
      if (errorCategoria) throw errorCategoria;
      
      // Busca todas as subcategorias do usuário
      const { data: dataSubcategorias, error: errorSubcategorias } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome', { ascending: true });
      
      if (errorSubcategorias) throw errorSubcategorias;
      
      // Combina os dados e organiza as subcategorias sob suas categorias pai
      const categoriasCombinadas = (dataCategoria || []).map(categoria => {
        // Filtra as subcategorias que pertencem a esta categoria
        const subcategoriasDestaCat = (dataSubcategorias || [])
          .filter(subcategoria => subcategoria.categoria_id === categoria.id);
        
        // Retorna a categoria com suas subcategorias
        return {
          ...categoria,
          subcategorias: subcategoriasDestaCat
        };
      });
      
      setCategorias(categoriasCombinadas);
      return { success: true, data: categoriasCombinadas };
    } catch (err) {
      console.error('❌ useCategorias - Erro ao buscar categorias:', err);
      const errorMessage = 'Não foi possível carregar suas categorias. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [authLoading, initialized, isAuthenticated, user]);

  // Carrega as categorias quando a autenticação estiver pronta
  useEffect(() => {
    // Só executa quando a autenticação terminou de inicializar
    if (!authLoading && initialized) {
      if (isAuthenticated && user) {
        fetchCategorias();
      } else {
        setCategorias([]);
        setLoading(false);
        setError(null);
      }
    }
  }, [authLoading, initialized, isAuthenticated, user, fetchCategorias]);

  // Listener para mudanças da store global
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const unsubscribe = categoriasStore.subscribe((event) => {
      // Sempre recarrega os dados quando há mudanças
      // Pequeno delay para garantir que o banco foi atualizado
      setTimeout(() => {
        fetchCategorias();
      }, 100);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user, fetchCategorias]);

  // Adiciona uma nova categoria
  const addCategoria = useCallback(async (novaCategoria) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para inserção
      const dadosCategoria = {
        ...novaCategoria,
        usuario_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ativo: true,
        // A ordem será a última + 1 para o tipo específico
        ordem: categorias
          .filter(c => c.tipo === novaCategoria.tipo)
          .reduce((max, c) => Math.max(max, c.ordem || 0), 0) + 1
      };
      
      // Chama a API para adicionar a categoria
      const { data, error } = await supabase
        .from('categorias')
        .insert([dadosCategoria])
        .select();
      
      if (error) throw error;
      
      // Adiciona a nova categoria com um array vazio de subcategorias
      if (data && data.length > 0) {
        const novaCategoriaCompleta = {
          ...data[0],
          subcategorias: []
        };
        
        setCategorias(prev => [...prev, novaCategoriaCompleta]);
        
        // Notifica a store sobre a mudança
        categoriasStore.categoriaAdicionada(novaCategoriaCompleta);
        
        return { success: true, data: novaCategoriaCompleta };
      } else {
        throw new Error('Erro ao adicionar categoria: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useCategorias - Erro ao adicionar categoria:', err);
      const errorMessage = 'Não foi possível adicionar a categoria. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [categorias, isAuthenticated, user]);

  // Atualiza uma categoria
  const updateCategoria = useCallback(async (categoriaId, dadosAtualizados) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para atualização
      const dadosCategoria = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };
      
      // Remove campos que não devem ser atualizados
      delete dadosCategoria.id;
      delete dadosCategoria.usuario_id;
      delete dadosCategoria.created_at;
      delete dadosCategoria.subcategorias;
      
      // Chama a API para atualizar a categoria
      const { data, error } = await supabase
        .from('categorias')
        .update(dadosCategoria)
        .eq('id', categoriaId)
        .eq('usuario_id', user.id)
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        setCategorias(prev => prev.map(categoria => {
          if (categoria.id === categoriaId) {
            return {
              ...data[0],
              subcategorias: categoria.subcategorias
            };
          }
          return categoria;
        }));
        
        // Notifica a store sobre a mudança
        categoriasStore.categoriaAtualizada(data[0]);
        
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao atualizar categoria: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useCategorias - Erro ao atualizar categoria:', err);
      const errorMessage = 'Não foi possível atualizar a categoria. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Exclui uma categoria
  const deleteCategoria = useCallback(async (categoriaId) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Verifica se a categoria tem transações associadas
      const { data: transacoes, error: errorTransacoes } = await supabase
        .from('transacoes')
        .select('id')
        .eq('categoria_id', categoriaId)
        .eq('usuario_id', user.id)
        .limit(1);
      
      if (errorTransacoes) {
        console.warn('⚠️ useCategorias - Erro ao verificar transações:', errorTransacoes);
      }
      
      // Se tem transações, apenas desativa; senão, exclui fisicamente
      if (transacoes && transacoes.length > 0) {
        // Desativa categoria
        const { error: errorUpdate } = await supabase
          .from('categorias')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', categoriaId)
          .eq('usuario_id', user.id);
        
        if (errorUpdate) throw errorUpdate;
        
        // Desativa subcategorias
        const { error: errorSubcategorias } = await supabase
          .from('subcategorias')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('categoria_id', categoriaId)
          .eq('usuario_id', user.id);
        
        if (errorSubcategorias) {
          console.warn('⚠️ useCategorias - Erro ao desativar subcategorias:', errorSubcategorias);
        }
      } else {
        // Exclui subcategorias fisicamente
        const { error: errorSubcategorias } = await supabase
          .from('subcategorias')
          .delete()
          .eq('categoria_id', categoriaId)
          .eq('usuario_id', user.id);
        
        if (errorSubcategorias) {
          console.warn('⚠️ useCategorias - Erro ao excluir subcategorias:', errorSubcategorias);
        }
        
        // Exclui categoria fisicamente
        const { error } = await supabase
          .from('categorias')
          .delete()
          .eq('id', categoriaId)
          .eq('usuario_id', user.id);
        
        if (error) throw error;
      }
      
      // Atualiza o estado local
      setCategorias(prev => {
        const novaLista = prev.filter(categoria => categoria.id !== categoriaId);
        return novaLista;
      });
      
      // Notifica a store sobre a mudança
      categoriasStore.categoriaRemovida(categoriaId);
      
      return { success: true };
    } catch (err) {
      console.error('❌ useCategorias - Erro ao excluir categoria:', err);
      const errorMessage = 'Não foi possível excluir a categoria. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // ==================== FUNÇÕES DE SUBCATEGORIAS ====================

  // Adiciona uma nova subcategoria
  const addSubcategoria = useCallback(async (categoriaId, novaSubcategoria) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para inserção
      const dadosSubcategoria = {
        ...novaSubcategoria,
        categoria_id: categoriaId,
        usuario_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ativo: true
      };
      
      // Chama a API para adicionar a subcategoria
      const { data, error } = await supabase
        .from('subcategorias')
        .insert([dadosSubcategoria])
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        const novaSubcategoriaCompleta = data[0];
        
        setCategorias(prev => prev.map(categoria => {
          if (categoria.id === categoriaId) {
            return {
              ...categoria,
              subcategorias: [...(categoria.subcategorias || []), novaSubcategoriaCompleta]
            };
          }
          return categoria;
        }));
        
        // Notifica a store sobre a mudança
        categoriasStore.subcategoriaAdicionada(categoriaId, novaSubcategoriaCompleta);
        
        return { success: true, data: novaSubcategoriaCompleta };
      } else {
        throw new Error('Erro ao adicionar subcategoria: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useCategorias - Erro ao adicionar subcategoria:', err);
      const errorMessage = 'Não foi possível adicionar a subcategoria. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Atualiza uma subcategoria
  const updateSubcategoria = useCallback(async (categoriaId, subcategoriaId, dadosAtualizados) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para atualização
      const dadosSubcategoria = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };
      
      // Remove campos que não devem ser atualizados
      delete dadosSubcategoria.id;
      delete dadosSubcategoria.categoria_id;
      delete dadosSubcategoria.usuario_id;
      delete dadosSubcategoria.created_at;
      
      // Chama a API para atualizar a subcategoria
      const { data, error } = await supabase
        .from('subcategorias')
        .update(dadosSubcategoria)
        .eq('id', subcategoriaId)
        .eq('categoria_id', categoriaId)
        .eq('usuario_id', user.id)
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        const subcategoriaAtualizada = data[0];
        
        setCategorias(prev => prev.map(categoria => {
          if (categoria.id === categoriaId) {
            return {
              ...categoria,
              subcategorias: (categoria.subcategorias || []).map(sub => 
                sub.id === subcategoriaId ? subcategoriaAtualizada : sub
              )
            };
          }
          return categoria;
        }));
        
        // Notifica a store sobre a mudança
        categoriasStore.subcategoriaAtualizada(categoriaId, subcategoriaAtualizada);
        
        return { success: true, data: subcategoriaAtualizada };
      } else {
        throw new Error('Erro ao atualizar subcategoria: dados não retornados');
      }
    } catch (err) {
      console.error('❌ useCategorias - Erro ao atualizar subcategoria:', err);
      const errorMessage = 'Não foi possível atualizar a subcategoria. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Exclui uma subcategoria
  const deleteSubcategoria = useCallback(async (categoriaId, subcategoriaId) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Verifica se a subcategoria tem transações associadas
      const { data: transacoes, error: errorTransacoes } = await supabase
        .from('transacoes')
        .select('id')
        .eq('subcategoria_id', subcategoriaId)
        .eq('usuario_id', user.id)
        .limit(1);
      
      if (errorTransacoes) {
        console.warn('⚠️ useCategorias - Erro ao verificar transações da subcategoria:', errorTransacoes);
      }
      
      // Se tem transações, apenas desativa; senão, exclui fisicamente
      if (transacoes && transacoes.length > 0) {
        const { error: errorUpdate } = await supabase
          .from('subcategorias')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', subcategoriaId)
          .eq('categoria_id', categoriaId)
          .eq('usuario_id', user.id);
        
        if (errorUpdate) throw errorUpdate;
      } else {
        const { error } = await supabase
          .from('subcategorias')
          .delete()
          .eq('id', subcategoriaId)
          .eq('categoria_id', categoriaId)
          .eq('usuario_id', user.id);
        
        if (error) throw error;
      }
      
      // Atualiza o estado local
      setCategorias(prev => prev.map(categoria => {
        if (categoria.id === categoriaId) {
          return {
            ...categoria,
            subcategorias: (categoria.subcategorias || []).filter(sub => sub.id !== subcategoriaId)
          };
        }
        return categoria;
      }));
      
      // Notifica a store sobre a mudança
      categoriasStore.subcategoriaRemovida(categoriaId, subcategoriaId);
      
      return { success: true };
    } catch (err) {
      console.error('❌ useCategorias - Erro ao excluir subcategoria:', err);
      const errorMessage = 'Não foi possível excluir a subcategoria. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Busca subcategorias de uma categoria específica
  const getSubcategoriasPorCategoria = useCallback((categoriaId) => {
    const categoria = categorias.find(cat => cat.id === categoriaId);
    return categoria?.subcategorias || [];
  }, [categorias]);

  // Busca subcategoria por ID
  const getSubcategoriaById = useCallback((categoriaId, subcategoriaId) => {
    const categoria = categorias.find(cat => cat.id === categoriaId);
    return categoria?.subcategorias?.find(sub => sub.id === subcategoriaId);
  }, [categorias]);

  // ==================== FUNÇÕES AUXILIARES EXISTENTES ====================

  // Função auxiliar para buscar categorias por tipo
  const getCategoriasPorTipo = useCallback((tipo) => {
    return categorias.filter(categoria => categoria.tipo === tipo);
  }, [categorias]);

  // Função auxiliar para buscar categoria por ID
  const getCategoriaById = useCallback((id) => {
    return categorias.find(categoria => categoria.id === id);
  }, [categorias]);

  // Função para refresh manual (para uso quando necessário)
  const refreshCategorias = useCallback(() => {
    return fetchCategorias();
  }, [fetchCategorias]);

  // Retorna os dados e funções
  return {
    categorias,
    loading,
    error,
    fetchCategorias,
    refreshCategorias, // Para refresh manual quando necessário
    
    // Funções de categorias
    addCategoria,
    updateCategoria,
    deleteCategoria,
    getCategoriasPorTipo,
    getCategoriaById,
    
    // Funções de subcategorias
    addSubcategoria,
    updateSubcategoria,
    deleteSubcategoria,
    getSubcategoriasPorCategoria,
    getSubcategoriaById,
    
    // Dados derivados úteis
    categoriasReceita: getCategoriasPorTipo('receita'),
    categoriasDespesa: getCategoriasPorTipo('despesa'),
    totalCategorias: categorias.length,
    totalSubcategorias: categorias.reduce((total, cat) => total + (cat.subcategorias?.length || 0), 0),
    isAuthenticated,
    
    // Estados da autenticação para debug
    authLoading,
    initialized
  };
};

export default useCategorias;