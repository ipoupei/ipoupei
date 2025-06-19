// src/store/dashboardStore.js - VERSÃO APRIMORADA COM data_efetivacao
import { create } from 'zustand';
import { supabase } from '@lib/supabaseClient';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Store para gerenciar dados do dashboard COM NOVA FUNCIONALIDADE data_efetivacao
 * ✅ VERSÃO APRIMORADA: Mantém compatibilidade com o DashboardContent
 * ✅ NOVA LÓGICA: Considera data_efetivacao para cálculos de saldos
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

  // ✅ PRINCIPAL: Buscar dados usando consultas diretas COM data_efetivacao
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

      // ✅ NOVA LÓGICA: Calcular totais considerando data_efetivacao
      const saldoTotalContas = contasResult.reduce((acc, conta) => acc + (conta.saldo || 0), 0);
      
      // Separar transações efetivadas e não efetivadas
      const transacoesEfetivadas = transacoesResult.filter(t => t.data_efetivacao !== null);
      const transacoesNaoEfetivadas = transacoesResult.filter(t => t.data_efetivacao === null);
      
      const receitasEfetivadas = transacoesEfetivadas.filter(t => t.tipo === 'receita');
      const despesasEfetivadas = transacoesEfetivadas.filter(t => t.tipo === 'despesa');
      
      const receitasNaoEfetivadas = transacoesNaoEfetivadas.filter(t => t.tipo === 'receita');
      const despesasNaoEfetivadas = transacoesNaoEfetivadas.filter(t => t.tipo === 'despesa');
      
      const totalReceitasEfetivadas = receitasEfetivadas.reduce((acc, r) => acc + (r.valor || 0), 0);
      const totalDespesasEfetivadas = despesasEfetivadas.reduce((acc, d) => acc + (d.valor || 0), 0);
      
      const totalReceitasNaoEfetivadas = receitasNaoEfetivadas.reduce((acc, r) => acc + (r.valor || 0), 0);
      const totalDespesasNaoEfetivadas = despesasNaoEfetivadas.reduce((acc, d) => acc + (d.valor || 0), 0);

      // Agrupar por categorias (apenas efetivadas para o dashboard principal)
      const receitasPorCategoria = get().groupByCategoria(receitasEfetivadas, categoriasResult);
      const despesasPorCategoria = get().groupByCategoria(despesasEfetivadas, categoriasResult);

      // ✅ NOVA ESTRUTURA: Incluir dados de efetivação
      const structuredData = {
        // Saldo
        saldo: {
          atual: saldoTotalContas,
          previsto: saldoTotalContas + (totalReceitasEfetivadas - totalDespesasEfetivadas) + (totalReceitasNaoEfetivadas - totalDespesasNaoEfetivadas)
        },

        // Receitas
        receitas: {
          atual: totalReceitasEfetivadas,
          previsto: totalReceitasEfetivadas + totalReceitasNaoEfetivadas,
          efetivadas: totalReceitasEfetivadas, // ✅ NOVO
          nao_efetivadas: totalReceitasNaoEfetivadas, // ✅ NOVO
          categorias: receitasPorCategoria.map(cat => ({
            nome: cat.categoria.nome,
            valor: cat.total
          }))
        },

        // Despesas
        despesas: {
          atual: totalDespesasEfetivadas,
          previsto: totalDespesasEfetivadas + totalDespesasNaoEfetivadas,
          efetivadas: totalDespesasEfetivadas, // ✅ NOVO
          nao_efetivadas: totalDespesasNaoEfetivadas, // ✅ NOVO
          categorias: despesasPorCategoria.map(cat => ({
            nome: cat.categoria.nome,
            valor: cat.total
          }))
        },

        // ✅ NOVO: Cartão de Crédito baseado em transações não efetivadas
        cartaoCredito: {
          atual: totalDespesasNaoEfetivadas, // Gastos em faturas abertas
          limite: 0, // TODO: implementar busca de limites
          previsto: totalDespesasNaoEfetivadas
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

        // ✅ NOVO: Resumo geral com dados de efetivação
        resumo: {
          totalContas: contasResult.length,
          totalCartoes: 0, // TODO: implementar
          totalCategorias: categoriasResult.length,
          totalTransacoes: transacoesResult.length,
          transacoesEfetivadas: transacoesEfetivadas.length,
          transacoesNaoEfetivadas: transacoesNaoEfetivadas.length,
          percentualEfetivado: transacoesResult.length > 0 ? ((transacoesEfetivadas.length / transacoesResult.length) * 100).toFixed(1) : 0,
          saldoLiquido: saldoTotalContas,
          balanco: totalReceitasEfetivadas - totalDespesasEfetivadas,
          balancoTotal: (totalReceitasEfetivadas + totalReceitasNaoEfetivadas) - (totalDespesasEfetivadas + totalDespesasNaoEfetivadas),
          percentualGasto: (totalReceitasEfetivadas > 0) ? ((totalDespesasEfetivadas / totalReceitasEfetivadas) * 100).toFixed(1) : 0
        },

        // Dados brutos para debug
        raw: {
          contas: contasResult,
          categorias: categoriasResult,
          transacoes: transacoesResult,
          transacoesEfetivadas,
          transacoesNaoEfetivadas
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

      console.log('✅ Dados do dashboard estruturados com sucesso:', {
        saldoTotal: saldoTotalContas,
        receitasEfetivadas: totalReceitasEfetivadas,
        despesasEfetivadas: totalDespesasEfetivadas,
        receitasNaoEfetivadas: totalReceitasNaoEfetivadas,
        despesasNaoEfetivadas: totalDespesasNaoEfetivadas
      });
      
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

  // ✅ Buscar transações do período INCLUINDO data_efetivacao
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
      
      // ✅ Log para debug de data_efetivacao
      if (data?.length > 0) {
        const comEfetivacao = data.filter(t => t.data_efetivacao !== null).length;
        const semEfetivacao = data.filter(t => t.data_efetivacao === null).length;
        console.log(`📅 Transações: ${comEfetivacao} efetivadas, ${semEfetivacao} não efetivadas`);
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return [];
    }
  },

  // Agrupar transações por categoria (apenas efetivadas)
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

  // ✅ Adicionar nova transação COM data_efetivacao
  addTransacao: async (transacaoData) => {
    try {
      set({ loading: true });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // ✅ DETERMINAR data_efetivacao baseada no tipo de transação
      let dataEfetivacao = null;
      
      if (transacaoData.tipo === 'receita' || transacaoData.tipo === 'despesa' || transacaoData.tipo === 'transferencia') {
        // Se não é despesa de cartão, data_efetivacao = data da transação
        if (!transacaoData.cartao_id) {
          dataEfetivacao = transacaoData.data;
        }
        // Se é despesa de cartão, data_efetivacao = NULL (já é o padrão)
      }

      console.log('➕ Adicionando transação COM data_efetivacao:', dataEfetivacao);

      const { data, error } = await supabase
        .from('transacoes')
        .insert([{
          ...transacaoData,
          usuario_id: user.id,
          data_efetivacao: dataEfetivacao // ✅ CAMPO OBRIGATÓRIO
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

  // ✅ Atualizar transação existente COM data_efetivacao
  updateTransacao: async (id, transacaoData) => {
    try {
      set({ loading: true });

      // ✅ Se está atualizando dados que afetam data_efetivacao, recalcular
      let updateData = { ...transacaoData };
      if (transacaoData.tipo || transacaoData.cartao_id || transacaoData.data) {
        // Buscar dados atuais da transação
        const { data: transacaoAtual } = await supabase
          .from('transacoes')
          .select('*')
          .eq('id', id)
          .single();

        if (transacaoAtual) {
          // Mesclar dados atuais com novos
          const dadosCompletos = { ...transacaoAtual, ...transacaoData };
          
          // Determinar nova data_efetivacao
          let novaDataEfetivacao = null;
          if (dadosCompletos.tipo === 'receita' || dadosCompletos.tipo === 'despesa' || dadosCompletos.tipo === 'transferencia') {
            if (!dadosCompletos.cartao_id) {
              novaDataEfetivacao = dadosCompletos.data;
            }
          }
          
          updateData.data_efetivacao = novaDataEfetivacao;
          
          console.log('🔄 Recalculando data_efetivacao:', novaDataEfetivacao);
        }
      }

      const { data, error } = await supabase
        .from('transacoes')
        .update(updateData)
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

  // ✅ Selectors (computed values) - COMPATIBILIDADE COM DASHBOARDCONTENT + data_efetivacao
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

  // ✅ NOVOS GETTERS: Incluir dados de efetivação
  getTotalReceitasEfetivadas: () => {
    const { data } = get();
    return data?.receitas?.efetivadas || 0;
  },

  getTotalDespesasEfetivadas: () => {
    const { data } = get();
    return data?.despesas?.efetivadas || 0;
  },

  getTotalReceitasNaoEfetivadas: () => {
    const { data } = get();
    return data?.receitas?.nao_efetivadas || 0;
  },

  getTotalDespesasNaoEfetivadas: () => {
    const { data } = get();
    return data?.despesas?.nao_efetivadas || 0;
  },

  getSaldoPeriodo: () => {
    const receitas = get().getTotalReceitas();
    const despesas = get().getTotalDespesas();
    return receitas - despesas;
  },

  // ✅ NOVO: Saldo considerando transações não efetivadas
  getSaldoPrevisto: () => {
    const { data } = get();
    return data?.saldo?.previsto || 0;
  },

  getPercentualGasto: () => {
    const receitas = get().getTotalReceitas();
    const despesas = get().getTotalDespesas();
    return receitas > 0 ? (despesas / receitas) * 100 : 0;
  },

  // ✅ NOVO: Percentual de efetivação
  getPercentualEfetivado: () => {
    const { data } = get();
    return parseFloat(data?.resumo?.percentualEfetivado || 0);
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

  // ✅ NOVO: Insights baseados em efetivação
  getInsightsEfetivacao: () => {
    const { data } = get();
    if (!data?.resumo) return null;

    const { 
      transacoesEfetivadas, 
      transacoesNaoEfetivadas, 
      percentualEfetivado 
    } = data.resumo;

    const insights = [];

    if (parseFloat(percentualEfetivado) < 50) {
      insights.push({
        tipo: 'atencao',
        titulo: 'Muitas transações pendentes',
        descricao: `${transacoesNaoEfetivadas} transações ainda não foram efetivadas`,
        acao: 'Revise pagamentos de faturas e transferências pendentes'
      });
    }

    if (transacoesNaoEfetivadas > 0) {
      insights.push({
        tipo: 'informativo',
        titulo: 'Transações não efetivadas',
        descricao: `${transacoesNaoEfetivadas} transações ainda não impactaram seu saldo`,
        acao: 'Acompanhe os vencimentos para planejar melhor'
      });
    }

    return insights;
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

// ✅ Hook personalizado para usar dados específicos do dashboard COM data_efetivacao
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
    
    // Computed values tradicionais
    saldoTotal: store.getSaldoTotal(),
    totalReceitas: store.getTotalReceitas(),
    totalDespesas: store.getTotalDespesas(),
    saldoPeriodo: store.getSaldoPeriodo(),
    percentualGasto: store.getPercentualGasto(),
    statusFinanceiro: store.getStatusFinanceiro(),
    periodoFormatado: store.getPeriodoFormatado(),
    
    // ✅ NOVOS computed values com data_efetivacao
    receitasEfetivadas: store.getTotalReceitasEfetivadas(),
    despesasEfetivadas: store.getTotalDespesasEfetivadas(),
    receitasNaoEfetivadas: store.getTotalReceitasNaoEfetivadas(),
    despesasNaoEfetivadas: store.getTotalDespesasNaoEfetivadas(),
    saldoPrevisto: store.getSaldoPrevisto(),
    percentualEfetivado: store.getPercentualEfetivado(),
    insightsEfetivacao: store.getInsightsEfetivacao(),
    
    // Estados
    hasData: store.hasData(),
    isLoading: store.isLoading(),
    hasError: store.hasError(),
    errorMessage: store.getErrorMessage(),
    lastUpdate: store.getLastUpdate()
  };
};

export default useDashboardStore;