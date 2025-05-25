import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook personalizado para gerenciar categorias (receitas e despesas)
 * Versão final integrada com Supabase
 */
const useCategorias = () => {
  // Estado para armazenar as categorias
  const [categorias, setCategorias] = useState([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook de autenticação
  const { user, isAuthenticated } = useAuth();

  // Busca todas as categorias e subcategorias do usuário logado
  const fetchCategorias = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCategorias([]);
      setLoading(false);
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
      console.error('Erro ao buscar categorias:', err);
      const errorMessage = 'Não foi possível carregar suas categorias. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Carrega as categorias quando o usuário muda ou componente monta
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCategorias();
    } else {
      setCategorias([]);
      setLoading(false);
    }
  }, [fetchCategorias, isAuthenticated, user]);

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
        return { success: true, data: novaCategoriaCompleta };
      } else {
        throw new Error('Erro ao adicionar categoria: dados não retornados');
      }
    } catch (err) {
      console.error('Erro ao adicionar categoria:', err);
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
        
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao atualizar categoria: dados não retornados');
      }
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err);
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
      
      if (errorTransacoes) throw errorTransacoes;
      
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
        
        if (errorSubcategorias) throw errorSubcategorias;
      } else {
        // Exclui subcategorias fisicamente
        const { error: errorSubcategorias } = await supabase
          .from('subcategorias')
          .delete()
          .eq('categoria_id', categoriaId)
          .eq('usuario_id', user.id);
        
        if (errorSubcategorias) throw errorSubcategorias;
        
        // Exclui categoria fisicamente
        const { error } = await supabase
          .from('categorias')
          .delete()
          .eq('id', categoriaId)
          .eq('usuario_id', user.id);
        
        if (error) throw error;
      }
      
      // Atualiza o estado local
      setCategorias(prev => prev.filter(categoria => categoria.id !== categoriaId));
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
      const errorMessage = 'Não foi possível excluir a categoria. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Função auxiliar para buscar categorias por tipo
  const getCategoriasPorTipo = useCallback((tipo) => {
    return categorias.filter(categoria => categoria.tipo === tipo);
  }, [categorias]);

  // Função auxiliar para buscar categoria por ID
  const getCategoriaById = useCallback((id) => {
    return categorias.find(categoria => categoria.id === id);
  }, [categorias]);

  // Expor para debug apenas em desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.categoriasDebug = {
        categorias,
        updateCategoria,
        deleteCategoria,
        addCategoria,
        loading,
        error
      };
    }
  }, [categorias, updateCategoria, deleteCategoria, addCategoria, loading, error]);

  // Retorna os dados e funções
  return {
    categorias,
    loading,
    error,
    fetchCategorias,
    addCategoria,
    updateCategoria,
    deleteCategoria,
    getCategoriasPorTipo,
    getCategoriaById,
    // Dados derivados úteis
    categoriasReceita: getCategoriasPorTipo('receita'),
    categoriasDespesa: getCategoriasPorTipo('despesa'),
    totalCategorias: categorias.length,
    isAuthenticated
  };
};

export default useCategorias;