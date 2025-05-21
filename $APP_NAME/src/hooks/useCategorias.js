import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook personalizado para gerenciar categorias (receitas e despesas)
 * Conectado ao Supabase para operações CRUD reais
 * 
 * @returns {Object} - Objeto com dados e funções de manipulação de categorias
 */
const useCategorias = () => {
  // Estado para armazenar as categorias
  const [categorias, setCategorias] = useState([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca todas as categorias e subcategorias
  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Busca as categorias principais
      const { data: dataCategoria, error: errorCategoria } = await supabase
        .from('categorias')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (errorCategoria) throw errorCategoria;
      
      // Agora busca todas as subcategorias
      const { data: dataSubcategorias, error: errorSubcategorias } = await supabase
        .from('subcategorias')
        .select('*')
        .order('nome', { ascending: true });
      
      if (errorSubcategorias) throw errorSubcategorias;
      
      // Combina os dados e organiza as subcategorias sob suas categorias pai
      const categoriasCombinadas = dataCategoria.map(categoria => {
        // Filtra as subcategorias que pertencem a esta categoria
        const subcategoriasDestaCat = dataSubcategorias
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
      setError('Não foi possível carregar suas categorias. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega as categorias ao inicializar o hook
  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Adiciona uma nova categoria
  const addCategoria = useCallback(async (novaCategoria) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para inserção
      const dadosCategoria = {
        ...novaCategoria,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // A ordem será a última + 1
        ordem: categorias.length > 0 
          ? Math.max(...categorias.map(c => c.ordem || 0)) + 1 
          : 1
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
      setError('Não foi possível adicionar a categoria. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [categorias]);

  // Adiciona uma subcategoria
  const addSubcategoria = useCallback(async (categoriaId, novaSubcategoria) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para inserção
      const dadosSubcategoria = {
        ...novaSubcategoria,
        categoria_id: categoriaId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Chama a API para adicionar a subcategoria
      const { data, error } = await supabase
        .from('subcategorias')
        .insert([dadosSubcategoria])
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        setCategorias(prev => prev.map(categoria => {
          if (categoria.id === categoriaId) {
            return {
              ...categoria,
              subcategorias: [...categoria.subcategorias, data[0]]
            };
          }
          return categoria;
        }));
        
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao adicionar subcategoria: dados não retornados');
      }
    } catch (err) {
      console.error('Erro ao adicionar subcategoria:', err);
      setError('Não foi possível adicionar a subcategoria. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza uma categoria
  const updateCategoria = useCallback(async (categoriaId, dadosAtualizados) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para atualização
      const dadosCategoria = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };
      
      // Chama a API para atualizar a categoria
      const { data, error } = await supabase
        .from('categorias')
        .update(dadosCategoria)
        .eq('id', categoriaId)
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
      setError('Não foi possível atualizar a categoria. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza uma subcategoria
  const updateSubcategoria = useCallback(async (categoriaId, subcategoriaId, dadosAtualizados) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara os dados para atualização
      const dadosSubcategoria = {
        ...dadosAtualizados,
        updated_at: new Date().toISOString()
      };
      
      // Chama a API para atualizar a subcategoria
      const { data, error } = await supabase
        .from('subcategorias')
        .update(dadosSubcategoria)
        .eq('id', subcategoriaId)
        .select();
      
      if (error) throw error;
      
      // Atualiza o estado local
      if (data && data.length > 0) {
        setCategorias(prev => prev.map(categoria => {
          if (categoria.id === categoriaId) {
            return {
              ...categoria,
              subcategorias: categoria.subcategorias.map(subcategoria => 
                subcategoria.id === subcategoriaId ? data[0] : subcategoria
              )
            };
          }
          return categoria;
        }));
        
        return { success: true, data: data[0] };
      } else {
        throw new Error('Erro ao atualizar subcategoria: dados não retornados');
      }
    } catch (err) {
      console.error('Erro ao atualizar subcategoria:', err);
      setError('Não foi possível atualizar a subcategoria. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Exclui uma categoria
  const deleteCategoria = useCallback(async (categoriaId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verifica se a categoria tem subcategorias
      const categoria = categorias.find(cat => cat.id === categoriaId);
      
      if (categoria && categoria.subcategorias.length > 0) {
        // Primeiro exclui todas as subcategorias
        const { error: errorSubcategorias } = await supabase
          .from('subcategorias')
          .delete()
          .eq('categoria_id', categoriaId);
        
        if (errorSubcategorias) throw errorSubcategorias;
      }
      
      // Depois exclui a categoria
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoriaId);
      
      if (error) throw error;
      
      // Atualiza o estado local
      setCategorias(prev => prev.filter(categoria => categoria.id !== categoriaId));
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
      setError('Não foi possível excluir a categoria. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [categorias]);

  // Exclui uma subcategoria
  const deleteSubcategoria = useCallback(async (categoriaId, subcategoriaId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Chama a API para excluir a subcategoria
      const { error } = await supabase
        .from('subcategorias')
        .delete()
        .eq('id', subcategoriaId);
      
      if (error) throw error;
      
      // Atualiza o estado local
      setCategorias(prev => prev.map(categoria => {
        if (categoria.id === categoriaId) {
          return {
            ...categoria,
            subcategorias: categoria.subcategorias.filter(
              subcategoria => subcategoria.id !== subcategoriaId
            )
          };
        }
        return categoria;
      }));
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir subcategoria:', err);
      setError('Não foi possível excluir a subcategoria. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Retorna os dados e funções
  return {
    categorias,
    loading,
    error,
    fetchCategorias,
    addCategoria,
    addSubcategoria,
    updateCategoria,
    updateSubcategoria,
    deleteCategoria,
    deleteSubcategoria
  };
};

export default useCategorias;