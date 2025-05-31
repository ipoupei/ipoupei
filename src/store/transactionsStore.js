// src/store/transactionsStore.js
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Store específico para gerenciar transações
 * Separado do dashboard para melhor organização e performance
 */
export const useTransactionsStore = create((set, get) => ({
  // Estado principal
  transacoes: [],
  loading: false,
  error: null,
  
  // Filtros
  filtros: {
    tipo: 'todas', // 'todas', 'receitas', 'despesas', 'transferencias'
    periodo: {
      inicio: startOfMonth(new Date()),
      fim: endOfMonth(new Date())
    },
    categoria: null,
    conta: null,
    busca: '',
    ordenacao: 'data_desc' // 'data_asc', 'data_desc', 'valor_asc', 'valor_desc', 'categoria'
  },

  // Paginação
  paginacao: {
    pagina: 1,
    itensPorPagina: 50,
    total: 0,
    totalPaginas: 0
  },

  // Cache
  cache: {
    ultimaBusca: null,
    resultados: {},
    timestamp: null
  },

  // ===========================
  // AÇÕES BÁSICAS
  // ===========================

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // ===========================
  // GESTÃO DE FILTROS
  // ===========================

  // Atualizar filtros
  setFiltros: (novosFiltros) => {
    set(state => ({
      filtros: { ...state.filtros, ...novosFiltros },
      paginacao: { ...state.paginacao, pagina: 1 } // Reset página
    }));
    
    // Buscar automaticamente com novos filtros
    get().fetchTransacoes();
  },

  // Filtro por tipo
  setTipo: (tipo) => {
    get().setFiltros({ tipo });
  },

  // Filtro por período
  setPeriodo: (inicio, fim) => {
    get().setFiltros({ 
      periodo: { inicio, fim } 
    });
  },

  // Filtro por categoria
  setCategoria: (categoria) => {
    get().setFiltros({ categoria });
  },

  // Filtro por conta
  setConta: (conta) => {
    get().setFiltros({ conta });
  },

  // Filtro de busca textual
  setBusca: (busca) => {
    get().setFiltros({ busca });
  },

  // Ordenação
  setOrdenacao: (ordenacao) => {
    get().setFiltros({ ordenacao });
  },

  // Limpar todos os filtros
  limparFiltros: () => {
    set({
      filtros: {
        tipo: 'todas',
        periodo: {
          inicio: startOfMonth(new Date()),
          fim: endOfMonth(new Date())
        },
        categoria: null,
        conta: null,
        busca: '',
        ordenacao: 'data_desc'
      },
      paginacao: {
        pagina: 1,
        itensPorPagina: 50,
        total: 0,
        totalPaginas: 0
      }
    });
    
    get().fetchTransacoes();
  },

  // ===========================
  // BUSCAR TRANSAÇÕES
  // ===========================

  fetchTransacoes: async () => {
    const { filtros, paginacao } = get();
    
    try {
      set({ loading: true, error: null });

      console.log('🔍 Buscando transações com filtros:', filtros);

      // Construir query base
      let query = supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias(id, nome, cor, icone),
          conta:contas(id, nome, tipo),
          conta_destino:contas!transacoes_conta_destino_fkey(id, nome, tipo)
        `, { count: 'exact' });

      // Aplicar filtros
      
      // Filtro por tipo
      if (filtros.tipo !== 'todas') {
        query = query.eq('tipo', filtros.tipo);
      }

      // Filtro por período
      if (filtros.periodo.inicio && filtros.periodo.fim) {
        query = query
          .gte('data', filtros.periodo.inicio.toISOString())
          .lte('data', filtros.periodo.fim.toISOString());
      }

      // Filtro por categoria
      if (filtros.categoria) {
        query = query.eq('categoria_id', filtros.categoria);
      }

      // Filtro por conta
      if (filtros.conta) {
        query = query.or(`conta_id.eq.${filtros.conta},conta_destino.eq.${filtros.conta}`);
      }

      // Filtro por busca textual
      if (filtros.busca) {
        query = query.or(`descricao.ilike.%${filtros.busca}%,observacoes.ilike.%${filtros.busca}%`);
      }

      // Ordenação
      const [campo, direcao] = filtros.ordenacao.split('_');
      const ascending = direcao === 'asc';
      
      switch (campo) {
        case 'data':
          query = query.order('data', { ascending });
          break;
        case 'valor':
          query = query.order('valor', { ascending });
          break;
        case 'categoria':
          query = query.order('categoria_id', { ascending });
          break;
        default:
          query = query.order('data', { ascending: false });
      }

      // Paginação
      const offset = (paginacao.pagina - 1) * paginacao.itensPorPagina;
      query = query.range(offset, offset + paginacao.itensPorPagina - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Atualizar estado
      const totalPaginas = Math.ceil((count || 0) / paginacao.itensPorPagina);
      
      set({
        transacoes: data || [],
        loading: false,
        paginacao: {
          ...paginacao,
          total: count || 0,
          totalPaginas
        },
        cache: {
          ultimaBusca: new Date(),
          resultados: { [get().getCacheKey()]: data || [] },
          timestamp: new Date()
        }
      });

      console.log(`✅ ${data?.length || 0} transações carregadas (${count} total)`);
      return data || [];

    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      set({ 
        error: error.message || 'Erro ao carregar transações',
        loading: false 
      });
      throw error;
    }
  },

  // ===========================
  // PAGINAÇÃO
  // ===========================

  // Ir para página específica
  irParaPagina: (pagina) => {
    const { paginacao } = get();
    if (pagina >= 1 && pagina <= paginacao.totalPaginas) {
      set(state => ({
        paginacao: { ...state.paginacao, pagina }
      }));
      get().fetchTransacoes();
    }
  },

  // Página anterior
  paginaAnterior: () => {
    const { paginacao } = get();
    if (paginacao.pagina > 1) {
      get().irParaPagina(paginacao.pagina - 1);
    }
  },

  // Próxima página
  proximaPagina: () => {
    const { paginacao } = get();
    if (paginacao.pagina < paginacao.totalPaginas) {
      get().irParaPagina(paginacao.pagina + 1);
    }
  },

  // Alterar itens por página
  setItensPorPagina: (itensPorPagina) => {
    set(state => ({
      paginacao: { 
        ...state.paginacao, 
        itensPorPagina,
        pagina: 1 
      }
    }));
    get().fetchTransacoes();
  },

  // ===========================
  // CRUD DE TRANSAÇÕES
  // ===========================

  // Adicionar nova transação
  addTransacao: async (transacaoData) => {
    try {
      set({ loading: true });

      console.log('➕ Adicionando transação:', transacaoData);

      const { data, error } = await supabase
        .from('transacoes')
        .insert([{
          ...transacaoData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          categoria:categorias(id, nome, cor, icone),
          conta:contas(id, nome, tipo),
          conta_destino:contas!transacoes_conta_destino_fkey(id, nome, tipo)
        `)
        .single();

      if (error) throw error;

      // Atualizar lista local se a transação se encaixa nos filtros atuais
      if (get().transacaoEncaixaFiltros(data)) {
        set(state => ({
          transacoes: [data, ...state.transacoes]
        }));
      }

      // Invalidar cache
      get().invalidateCache();

      set({ loading: false });
      console.log('✅ Transação adicionada com sucesso');
      
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erro ao adicionar transação:', error);
      set({ 
        error: error.message || 'Erro ao adicionar transação',
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Atualizar transação existente
  updateTransacao: async (id, transacaoData) => {
    try {
      set({ loading: true });

      console.log('✏️ Atualizando transação:', id, transacaoData);

      const { data, error } = await supabase
        .from('transacoes')
        .update({
          ...transacaoData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          categoria:categorias(id, nome, cor, icone),
          conta:contas(id, nome, tipo),
          conta_destino:contas!transacoes_conta_destino_fkey(id, nome, tipo)
        `)
        .single();

      if (error) throw error;

      // Atualizar na lista local
      set(state => ({
        transacoes: state.transacoes.map(t => 
          t.id === id ? data : t
        )
      }));

      // Invalidar cache
      get().invalidateCache();

      set({ loading: false });
      console.log('✅ Transação atualizada com sucesso');
      
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      set({ 
        error: error.message || 'Erro ao atualizar transação',
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Excluir transação
  deleteTransacao: async (id) => {
    try {
      set({ loading: true });

      console.log('🗑️ Excluindo transação:', id);

      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remover da lista local
      set(state => ({
        transacoes: state.transacoes.filter(t => t.id !== id)
      }));

      // Invalidar cache
      get().invalidateCache();

      set({ loading: false });
      console.log('✅ Transação excluída com sucesso');
      
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao excluir transação:', error);
      set({ 
        error: error.message || 'Erro ao excluir transação',
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Duplicar transação
  duplicateTransacao: async (transacao) => {
    const { id, created_at, updated_at, ...transacaoData } = transacao;
    
    return await get().addTransacao({
      ...transacaoData,
      descricao: `${transacaoData.descricao} (cópia)`,
      data: new Date().toISOString()
    });
  },

  // ===========================
  // OPERAÇÕES EM LOTE
  // ===========================

  // Excluir múltiplas transações
  deleteMultipleTransacoes: async (ids) => {
    try {
      set({ loading: true });

      console.log('🗑️ Excluindo múltiplas transações:', ids);

      const { error } = await supabase
        .from('transacoes')
        .delete()
        .in('id', ids);

      if (error) throw error;

      // Remover da lista local
      set(state => ({
        transacoes: state.transacoes.filter(t => !ids.includes(t.id))
      }));

      // Invalidar cache
      get().invalidateCache();

      set({ loading: false });
      console.log('✅ Transações excluídas com sucesso');
      
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao excluir transações:', error);
      set({ 
        error: error.message || 'Erro ao excluir transações',
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Atualizar categoria de múltiplas transações
  updateCategoriaMultiple: async (ids, categoriaId) => {
    try {
      set({ loading: true });

      const { error } = await supabase
        .from('transacoes')
        .update({ 
          categoria_id: categoriaId,
          updated_at: new Date().toISOString()
        })
        .in('id', ids);

      if (error) throw error;

      // Recarregar dados para manter consistência
      await get().fetchTransacoes();

      set({ loading: false });
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
      set({ 
        error: error.message || 'Erro ao atualizar categoria',
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // ===========================
  // CACHE E UTILITÁRIOS
  // ===========================

  // Gerar chave do cache baseada nos filtros
  getCacheKey: () => {
    const { filtros } = get();
    return JSON.stringify(filtros);
  },

  // Invalidar cache
  invalidateCache: () => {
    set({
      cache: {
        ultimaBusca: null,
        resultados: {},
        timestamp: null
      }
    });
  },

  // Verificar se transação se encaixa nos filtros atuais
  transacaoEncaixaFiltros: (transacao) => {
    const { filtros } = get();
    
    // Verificar tipo
    if (filtros.tipo !== 'todas' && transacao.tipo !== filtros.tipo) {
      return false;
    }

    // Verificar período
    const dataTransacao = new Date(transacao.data);
    if (filtros.periodo.inicio && dataTransacao < filtros.periodo.inicio) {
      return false;
    }
    if (filtros.periodo.fim && dataTransacao > filtros.periodo.fim) {
      return false;
    }

    // Verificar categoria
    if (filtros.categoria && transacao.categoria_id !== filtros.categoria) {
      return false;
    }

    // Verificar conta
    if (filtros.conta && 
        transacao.conta_id !== filtros.conta && 
        transacao.conta_destino !== filtros.conta) {
      return false;
    }

    // Verificar busca textual
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const descricao = (transacao.descricao || '').toLowerCase();
      const observacoes = (transacao.observacoes || '').toLowerCase();
      
      if (!descricao.includes(busca) && !observacoes.includes(busca)) {
        return false;
      }
    }

    return true;
  },

  // ===========================
  // SELECTORS/GETTERS
  // ===========================

  // Obter transação por ID
  getTransacaoById: (id) => {
    const { transacoes } = get();
    return transacoes.find(t => t.id === id) || null;
  },

  // Obter total das transações filtradas
  getTotalFiltrado: () => {
    const { transacoes } = get();
    return transacoes.reduce((acc, t) => {
      if (t.tipo === 'receita') return acc + t.valor;
      if (t.tipo === 'despesa') return acc - t.valor;
      return acc;
    }, 0);
  },

  // Obter estatísticas das transações
  getEstatisticas: () => {
    const { transacoes } = get();
    
    const receitas = transacoes.filter(t => t.tipo === 'receita');
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    const transferencias = transacoes.filter(t => t.tipo === 'transferencia');

    return {
      total: transacoes.length,
      receitas: {
        quantidade: receitas.length,
        valor: receitas.reduce((acc, t) => acc + t.valor, 0)
      },
      despesas: {
        quantidade: despesas.length,
        valor: despesas.reduce((acc, t) => acc + t.valor, 0)
      },
      transferencias: {
        quantidade: transferencias.length,
        valor: transferencias.reduce((acc, t) => acc + t.valor, 0)
      }
    };
  },

  // Verificar se pode ir para página anterior
  canGoToPrevPage: () => {
    const { paginacao } = get();
    return paginacao.pagina > 1;
  },

  // Verificar se pode ir para próxima página
  canGoToNextPage: () => {
    const { paginacao } = get();
    return paginacao.pagina < paginacao.totalPaginas;
  },

  // Verificar se tem filtros ativos
  hasActiveFilters: () => {
    const { filtros } = get();
    return (
      filtros.tipo !== 'todas' ||
      filtros.categoria !== null ||
      filtros.conta !== null ||
      filtros.busca !== ''
    );
  },

  // Obter resumo dos filtros ativos
  getActiveFiltersDescription: () => {
    const { filtros } = get();
    const descriptions = [];

    if (filtros.tipo !== 'todas') {
      descriptions.push(`Tipo: ${filtros.tipo}`);
    }
    
    if (filtros.categoria) {
      descriptions.push(`Categoria selecionada`);
    }
    
    if (filtros.conta) {
      descriptions.push(`Conta selecionada`);
    }
    
    if (filtros.busca) {
      descriptions.push(`Busca: "${filtros.busca}"`);
    }

    return descriptions.join(', ');
  }
}));

// ===========================
// HOOKS PERSONALIZADOS
// ===========================

/**
 * Hook para usar transações com funcionalidades completas
 */
export const useTransactions = () => {
  const store = useTransactionsStore();
  
  return {
    // Dados
    transacoes: store.transacoes,
    loading: store.loading,
    error: store.error,
    filtros: store.filtros,
    paginacao: store.paginacao,
    
    // Ações
    fetch: store.fetchTransacoes,
    add: store.addTransacao,
    update: store.updateTransacao,
    delete: store.deleteTransacao,
    duplicate: store.duplicateTransacao,
    
    // Filtros
    setFiltros: store.setFiltros,
    setTipo: store.setTipo,
    setPeriodo: store.setPeriodo,
    setCategoria: store.setCategoria,
    setConta: store.setConta,
    setBusca: store.setBusca,
    setOrdenacao: store.setOrdenacao,
    limparFiltros: store.limparFiltros,
    
    // Paginação
    irParaPagina: store.irParaPagina,
    paginaAnterior: store.paginaAnterior,
    proximaPagina: store.proximaPagina,
    setItensPorPagina: store.setItensPorPagina,
    
    // Operações em lote
    deleteMultiple: store.deleteMultipleTransacoes,
    updateCategoriaMultiple: store.updateCategoriaMultiple,
    
    // Getters
    getById: store.getTransacaoById,
    estatisticas: store.getEstatisticas(),
    totalFiltrado: store.getTotalFiltrado(),
    hasActiveFilters: store.hasActiveFilters(),
    activeFiltersDescription: store.getActiveFiltersDescription(),
    
    // Estados
    canGoToPrev: store.canGoToPrevPage(),
    canGoToNext: store.canGoToNextPage()
  };
};

export default useTransactionsStore;