// src/store/dashboardStore.js - VERSÃO APRIMORADA COM COMPATIBILIDADE
import { create } from 'zustand';
import { supabase } from '@lib/supabaseClient';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Store para gerenciar dados do dashboard
 * VERSÃO APRIMORADA: Mantém compatibilidade com o DashboardContent
 */
export const useDashboardStore = create((set, get) => ({
  // Estado principal
  data: null,
  loading: false,
  error: null,
  lastUpdate: null,

  // Filtros e configurações
  selectedDate: new Date(),
  selectedPeriod: {
    inicio: startOfMonth(new Date()),
    fim: endOfMonth(new Date())
  },
  
  // Cache para performance
  cache: {
    contas: null,
    categorias: null,
    transacoes: null,
    lastFetch: null
  },

  // Ações básicas
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Seleção de período
  setSelectedDate: (date) => {
    const inicio = startOfMonth(date);
    const fim = endOfMonth(date);
    
    set({ 
      selectedDate: date,
      selectedPeriod: { inicio, fim }
    });

    // Buscar novos dados automaticamente
    get().fetchDashboardData();
  },

  setCustomPeriod: (inicio, fim) => {
    set({ 
      selectedPeriod: { inicio, fim },
      selectedDate: inicio // Usa data de início como referência
    });

    get().fetchDashboardData();
  },

  // PRINCIPAL: Buscar dados usando consultas diretas
  fetchDashboardData: async () => {
    const { selectedPeriod } = get();
    const { inicio, fim } = selectedPeriod;

    try {
      set({ loading: true, error: null });

      console.log('📊 Buscando dados do dashboard para período:', {
        inicio: format(inicio, 'dd/MM/yyyy'),
        fim: format(fim, 'dd/MM/yyyy')
      });

      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 Usuário autenticado:', user.email);

      // Buscar dados em paralelo usando consultas diretas
      const [
        contasResult,
        categoriasResult,
        transacoesResult
      ] = await Promise.all([
        get().fetchContas(user.id),
        get().fetchCategorias(user.id),
        get().fetchTransacoes(user.id, inicio, fim)
      ]);

      console.log('📋 Dados recebidos:', {
        contas: contasResult.length,
        categorias: categoriasResult.length,
        transacoes: transacoesResult.length
      });

      // Calcular totais
      const saldoTotalContas = contasResult.reduce((acc, conta) => acc + (conta.saldo || 0), 0);
      
      const receitas = transacoesResult.filter(t => t.tipo === 'receita');
      const despesas = transacoesResult.filter(t => t.tipo === 'despesa');
      
      const totalReceitas = receitas.reduce((acc, r) => acc + (r.valor || 0), 0);
      const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor || 0), 0);

      // Agrupar por categorias
      const receitasPorCategoria = get().groupByCategoria(receitas, categoriasResult);
      const despesasPorCategoria = get().groupByCategoria(despesas, categoriasResult);

      // Estruturar dados no formato esperado pelo Dashboard
      const structuredData = {
        // Saldo
        saldo: {
          atual: saldoTotalContas,
          previsto: saldoTotalContas + (totalReceitas - totalDespesas) // Projeção simples
        },

        // Receitas
        receitas: {
          atual: totalReceitas,
          previsto: totalReceitas * 1.05, // 5% de crescimento estimado
          categorias: receitasPorCategoria.map(cat => ({
            nome: cat.categoria.nome,
            valor: cat.total
          }))
        },

        // Despesas
        despesas: {
          atual: totalDespesas,
          previsto: totalDespesas * 0.95, // 5% de redução estimada
          categorias: despesasPorCategoria.map(cat => ({
            nome: cat.categoria.nome,
            valor: cat.total
          }))
        },

        // Cartão de Crédito (placeholder expandido)
        cartaoCredito: {
          atual: 0, // TODO: implementar busca de faturas
          limite: 0, // TODO: implementar busca de limites
          previsto: 0
        },

        // Período
        periodo: {
          inicio,
          fim,
          formatado: `${format(inicio, 'dd/MM', { locale: ptBR })} - ${format(fim, 'dd/MM', { locale: ptBR })}`
        },

        // Dados para gráficos - com cores padrão
        receitasPorCategoria: receitasPorCategoria.map(cat => ({
          nome: cat.categoria.nome,
          valor: cat.total,
          color: cat.categoria.cor || '#10B981' // Verde padrão para receitas
        })),
        
        despesasPorCategoria: despesasPorCategoria.map(cat => ({
          nome: cat.categoria.nome,
          valor: cat.total,
          color: cat.categoria.cor || '#EF4444' // Vermelho padrão para despesas
        })),
        
        // Detalhes para o verso dos cards
        contasDetalhadas: contasResult.map(conta => ({
          nome: conta.nome,
          saldo: conta.saldo || 0,
          tipo: conta.tipo || 'corrente'
        })),
        
        cartoesDetalhados: [], // TODO: implementar busca de cartões
        
        // Histórico para projeção (placeholder)
        historico: [],

        // Resumo geral
        resumo: {
          totalContas: contasResult.length,
          totalCartoes: 0, // TODO: implementar
          totalCategorias: categoriasResult.length,
          totalTransacoes: transacoesResult.length,
          saldoLiquido: saldoTotalContas,
          balanco: totalReceitas - totalDespesas,
          percentualGasto: totalReceitas > 0 ? ((totalDespesas / totalReceitas) * 100).toFixed(1) : 0
        },

        // Dados brutos para debug
        raw: {
          contas: contasResult,
          categorias: categoriasResult,
          transacoes: transacoesResult
        }
      };

      set({ 
        data: structuredData,
        loading: false,
        lastUpdate: new Date(),
        cache: {
          ...get().cache,
          lastFetch: new Date(),
          contas: contasResult,
          categorias: categoriasResult,
          transacoes: transacoesResult
        }
      });

      console.log('✅ Dados do dashboard estruturados com sucesso:', structuredData);
      return structuredData;

    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      set({ 
        error: error.message || 'Erro ao carregar dados',
        loading: false 
      });
      throw error;
    }
  },

  // Buscar contas (consulta direta)
  fetchContas: async (userId) => {
    try {
      console.log('🏦 Buscando contas para usuário:', userId);
      
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', userId)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.warn('⚠️ Erro ao buscar contas:', error);
        return [];
      }

      console.log('✅ Contas encontradas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar contas:', error);
      return [];
    }
  },

  // Buscar categorias (consulta direta)
  fetchCategorias: async (userId) => {
    try {
      console.log('📊 Buscando categorias para usuário:', userId);
      
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', userId)
        .eq('ativo', true)
        .order('tipo, ordem');

      if (error) {
        console.warn('⚠️ Erro ao buscar categorias:', error);
        return [];
      }

      console.log('✅ Categorias encontradas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return [];
    }
  },

  // Buscar transações do período (consulta direta)
  fetchTransacoes: async (userId, inicio, fim) => {
    try {
      console.log('💰 Buscando transações para período:', {
        userId,
        inicio: inicio.toISOString().split('T')[0],
        fim: fim.toISOString().split('T')[0]
      });

      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias(id, nome, cor, icone),
          conta:contas(id, nome, tipo)
        `)
        .eq('usuario_id', userId)
        .gte('data', inicio.toISOString().split('T')[0])
        .lte('data', fim.toISOString().split('T')[0])
        .order('data', { ascending: false });

      if (error) {
        console.warn('⚠️ Erro ao buscar transações:', error);
        return [];
      }

      console.log('✅ Transações encontradas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return [];
    }
  },

  // Agrupar transações por categoria
  groupByCategoria: (transacoes, categorias) => {
    const grupos = {};
    
    transacoes.forEach(transacao => {
      const categoriaId = transacao.categoria_id;
      const categoria = categorias.find(c => c.id === categoriaId) || {
        id: 'sem-categoria',
        nome: 'Sem categoria',
        cor: '#6B7280',
        icone: 'help-circle'
      };
      
      if (!grupos[categoriaId]) {
        grupos[categoriaId] = {
          categoria,
          total: 0,
          quantidade: 0,
          transacoes: []
        };
      }
      
      grupos[categoriaId].total += transacao.valor || 0;
      grupos[categoriaId].quantidade += 1;
      grupos[categoriaId].transacoes.push(transacao);
    });

    return Object.values(grupos).sort((a, b) => b.total - a.total);
  },

  // Adicionar nova transação
  addTransacao: async (transacaoData) => {
    try {
      set({ loading: true });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('transacoes')
        .insert([{
          ...transacaoData,
          usuario_id: user.id
        }])
        .select(`
          *,
          categoria:categorias(id, nome, cor, icone),
          conta:contas(id, nome, tipo)
        `)
        .single();

      if (error) throw error;

      // Recarregar dados do dashboard
      await get().fetchDashboardData();

      set({ loading: false });
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

      const { data, error } = await supabase
        .from('transacoes')
        .update(transacaoData)
        .eq('id', id)
        .select(`
          *,
          categoria:categorias(id, nome, cor, icone),
          conta:contas(id, nome, tipo)
        `)
        .single();

      if (error) throw error;

      // Recarregar dados do dashboard
      await get().fetchDashboardData();

      set({ loading: false });
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

  // Remover transação
  deleteTransacao: async (id) => {
    try {
      set({ loading: true });

      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recarregar dados do dashboard
      await get().fetchDashboardData();

      set({ loading: false });
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao remover transação:', error);
      set({ 
        error: error.message || 'Erro ao remover transação',
        loading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Invalidar cache e forçar reload
  invalidateCache: () => {
    set({
      cache: {
        contas: null,
        categorias: null,
        transacoes: null,
        lastFetch: null
      }
    });
  },

  // Refresh completo dos dados
  refreshData: async () => {
    get().invalidateCache();
    return await get().fetchDashboardData();
  },

  // Selectors (computed values) - COMPATIBILIDADE COM DASHBOARDCONTENT
  getSaldoTotal: () => {
    const { data } = get();
    return data?.saldo?.atual || 0;
  },

  getTotalReceitas: () => {
    const { data } = get();
    return data?.receitas?.atual || 0;
  },

  getTotalDespesas: () => {
    const { data } = get();
    return data?.despesas?.atual || 0;
  },

  getSaldoPeriodo: () => {
    const receitas = get().getTotalReceitas();
    const despesas = get().getTotalDespesas();
    return receitas - despesas;
  },

  getPercentualGasto: () => {
    const receitas = get().getTotalReceitas();
    const despesas = get().getTotalDespesas();
    return receitas > 0 ? (despesas / receitas) * 100 : 0;
  },

  getStatusFinanceiro: () => {
    const saldoPeriodo = get().getSaldoPeriodo();
    
    if (saldoPeriodo > 0) return 'positivo';
    if (saldoPeriodo === 0) return 'equilibrado';
    return 'negativo';
  },

  getPeriodoFormatado: () => {
    const { data } = get();
    return data?.periodo?.formatado || '';
  },

  getMaiorCategoriaDespesa: () => {
    const { data } = get();
    if (!data?.despesas?.categorias?.length) return null;
    return data.despesas.categorias[0];
  },

  getMaiorCategoriaReceita: () => {
    const { data } = get();
    if (!data?.receitas?.categorias?.length) return null;
    return data.receitas.categorias[0];
  },

  // Estados booleanos
  hasData: () => {
    const { data } = get();
    return !!data;
  },

  isLoading: () => {
    const { loading } = get();
    return loading;
  },

  hasError: () => {
    const { error } = get();
    return !!error;
  },

  getErrorMessage: () => {
    const { error } = get();
    return error || '';
  },

  getLastUpdate: () => {
    const { lastUpdate } = get();
    return lastUpdate;
  },

  isCacheValid: () => {
    const { cache } = get();
    if (!cache.lastFetch) return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return cache.lastFetch > fiveMinutesAgo;
  }
}));

// Hook personalizado para usar dados específicos do dashboard
export const useDashboardData = () => {
  const store = useDashboardStore();
  
  return {
    // Dados principais
    data: store.data,
    loading: store.loading,
    error: store.error,
    
    // Ações
    fetchData: store.fetchDashboardData,
    refresh: store.refreshData,
    refreshData: store.refreshData, // Alias para compatibilidade
    setSelectedDate: store.setSelectedDate,
    setCustomPeriod: store.setCustomPeriod,
    
    // Transações
    addTransacao: store.addTransacao,
    updateTransacao: store.updateTransacao,
    deleteTransacao: store.deleteTransacao,
    
    // Computed values
    saldoTotal: store.getSaldoTotal(),
    totalReceitas: store.getTotalReceitas(),
    totalDespesas: store.getTotalDespesas(),
    saldoPeriodo: store.getSaldoPeriodo(),
    percentualGasto: store.getPercentualGasto(),
    statusFinanceiro: store.getStatusFinanceiro(),
    periodoFormatado: store.getPeriodoFormatado(),
    
    // Estados
    hasData: store.hasData(),
    isLoading: store.isLoading(),
    hasError: store.hasError(),
    errorMessage: store.getErrorMessage(),
    lastUpdate: store.getLastUpdate()
  };
};

export default useDashboardStore;