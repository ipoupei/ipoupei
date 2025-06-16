// src/modules/transacoes/store/transactionsStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Store específico para gerenciar transações
 * Versão atualizada para funcionar com TransacoesPage migrada
 */
export const useTransactionsStore = create(
  subscribeWithSelector((set, get) => ({
    // ===========================
    // ESTADO PRINCIPAL
    // ===========================
    transacoes: [],
    loading: false,
    error: null,
    
    // Filtros aplicados (ativos)
    filtros: {
      tipos: [], // ['receita', 'despesa', 'transferencia']
      categorias: [],
      subcategorias: [],
      contas: [],
      cartoes: [],
      status: [], // ['efetivado', 'pendente']
      valorMinimo: 0,
      valorMaximo: 999999,
      dataInicio: null,
      dataFim: null,
      busca: '',
      periodo: {
        inicio: startOfMonth(new Date()),
        fim: endOfMonth(new Date())
      }
    },

    // Paginação
    paginacao: {
      pagina: 1,
      itensPorPagina: 100,
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
      console.log('🎯 Atualizando filtros:', novosFiltros);
      
      set(state => ({
        filtros: { ...state.filtros, ...novosFiltros },
        paginacao: { ...state.paginacao, pagina: 1 } // Reset página
      }));
      
      // Buscar automaticamente com novos filtros (debounced)
      setTimeout(() => {
        get().fetchTransacoes();
      }, 100);
    },

    // Limpar todos os filtros
    limparFiltros: () => {
      console.log('🧹 Limpando todos os filtros');
      
      set(state => ({
        filtros: {
          tipos: [],
          categorias: [],
          subcategorias: [],
          contas: [],
          cartoes: [],
          status: [],
          valorMinimo: 0,
          valorMaximo: 999999,
          dataInicio: null,
          dataFim: null,
          busca: '',
          periodo: state.filtros.periodo // Manter período atual
        },
        paginacao: {
          pagina: 1,
          itensPorPagina: 100,
          total: 0,
          totalPaginas: 0
        }
      }));
      
      get().fetchTransacoes();
    },

// ===========================
// BUSCAR TRANSAÇÕES
// ===========================

fetchTransacoes: async () => {
  const { filtros, paginacao } = get();

  set({ loading: true, error: null });

  console.log('🔍 Buscando transações com filtros:', filtros);

  try {
    // Importação dinâmica do Supabase
    const { default: supabase } = await import('@lib/supabaseClient');

    // Obter o ID do usuário antes de tudo
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      throw new Error('Usuário não autenticado');
    }
    const userId = userData.user.id;

    // Tentar buscar via RPC
    try {
      const { data, error } = await supabase.rpc('gpt_transacoes_do_mes', {
        p_usuario_id: userId,
        p_data_inicio: format(filtros.periodo.inicio, 'yyyy-MM-dd'),
        p_data_fim: format(filtros.periodo.fim, 'yyyy-MM-dd')
      });

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} transações carregadas via RPC`);

      // Aplicar filtros locais adicionais se necessário
      const transacoesFiltradas = get().aplicarFiltrosLocais(data || []);

      set({
        transacoes: transacoesFiltradas,
        loading: false,
        paginacao: {
          ...paginacao,
          total: transacoesFiltradas.length,
          totalPaginas: Math.ceil(transacoesFiltradas.length / paginacao.itensPorPagina)
        }
      });

      return transacoesFiltradas;

    } catch (rpcError) {
      console.warn('⚠️ RPC falhou, usando query manual como fallback:', rpcError);
      return await get().fetchTransacoesManual();
    }

  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error);
    set({
      error: error.message || 'Erro ao carregar transações',
      loading: false
    });
    throw error;
  }
},

    // Fallback: busca manual via query SQL
    fetchTransacoesManual: async () => {
      const { filtros, paginacao } = get();
      
      try {
        const { default: supabase } = await import('@lib/supabaseClient');
        
        // Construir query base
        let query = supabase
          .from('transacoes')
          .select(`
            *,
            categoria:categorias(id, nome, cor, icone),
            conta:contas!transacoes_conta_id_fkey(id, nome, tipo),
            conta_destino:contas!transacoes_conta_destino_id_fkey(id, nome, tipo),
            cartao:cartoes(id, nome, bandeira)
          `, { count: 'exact' });

        // Aplicar filtros básicos
        query = query
          .gte('data', filtros.periodo.inicio.toISOString())
          .lte('data', filtros.periodo.fim.toISOString());

        // Filtro por tipo
        if (filtros.tipos.length > 0) {
          query = query.in('tipo', filtros.tipos);
        }

        // Filtro por categoria
        if (filtros.categorias.length > 0) {
          query = query.in('categoria_id', filtros.categorias);
        }

        // Filtro por conta
        if (filtros.contas.length > 0) {
          query = query.or(
            filtros.contas.map(conta => `conta_id.eq.${conta}`).join(',') + ',' +
            filtros.contas.map(conta => `conta_destino_id.eq.${conta}`).join(',')
          );
        }

        // Filtro por cartão
        if (filtros.cartoes.length > 0) {
          query = query.in('cartao_id', filtros.cartoes);
        }

        // Filtro por busca textual
        if (filtros.busca) {
          query = query.or(`descricao.ilike.%${filtros.busca}%,observacoes.ilike.%${filtros.busca}%`);
        }

        // Ordenação padrão
        query = query.order('data', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        // Mapear dados para formato padrão
        const transacoesMapeadas = (data || []).map(t => ({
          id: t.id,
          data: t.data,
          tipo: t.tipo,
          valor: parseFloat(t.valor) || 0,
          descricao: t.descricao || 'Sem descrição',
          categoria_id: t.categoria_id,
          categoria_nome: t.categoria?.nome || 'Sem categoria',
          categoria_cor: t.categoria?.cor || '#6B7280',
          conta_id: t.conta_id,
          conta_nome: t.conta?.nome || 'Conta não informada',
          conta_destino_id: t.conta_destino_id,
          conta_destino_nome: t.conta_destino?.nome,
          cartao_id: t.cartao_id,
          cartao_nome: t.cartao?.nome,
          efetivado: t.efetivado !== false,
          observacoes: t.observacoes || '',
          subcategoria_id: t.subcategoria_id,
          created_at: t.created_at,
          updated_at: t.updated_at
        }));

        // Aplicar filtros adicionais
        const transacoesFiltradas = get().aplicarFiltrosLocais(transacoesMapeadas);

        // Atualizar estado
        const totalPaginas = Math.ceil((count || 0) / paginacao.itensPorPagina);
        
        set({
          transacoes: transacoesFiltradas,
          loading: false,
          paginacao: {
            ...paginacao,
            total: count || 0,
            totalPaginas
          }
        });

        console.log(`✅ ${transacoesFiltradas?.length || 0} transações carregadas (${count} total)`);
        return transacoesFiltradas;

      } catch (error) {
        console.error('❌ Erro na busca manual:', error);
        throw error;
      }
    },

    // Aplicar filtros locais (lado cliente)
    aplicarFiltrosLocais: (transacoes) => {
      const { filtros } = get();
      let filtered = [...transacoes];

      // Filtro por status
      if (filtros.status.length > 0) {
        filtered = filtered.filter(t => {
          const status = t.efetivado ? 'efetivado' : 'pendente';
          return filtros.status.includes(status);
        });
      }

      // Filtro por faixa de valores
      if (filtros.valorMinimo > 0 || filtros.valorMaximo < 999999) {
        filtered = filtered.filter(t => 
          t.valor >= filtros.valorMinimo && t.valor <= filtros.valorMaximo
        );
      }

      // Filtro por período específico (além do período base)
      if (filtros.dataInicio) {
        filtered = filtered.filter(t => new Date(t.data) >= filtros.dataInicio);
      }
      if (filtros.dataFim) {
        filtered = filtered.filter(t => new Date(t.data) <= filtros.dataFim);
      }

      return filtered;
    },

    // ===========================
    // CRUD DE TRANSAÇÕES
    // ===========================

    // Atualizar valor de grupo de transações (parceladas/recorrentes)
    updateGrupoTransacoesValor: async (transacaoId, tipoAtualizacao, novoValor) => {
      try {
        set({ loading: true });

        console.log('🔄 Atualizando grupo de transações:', {
          transacaoId,
          tipoAtualizacao,
          novoValor
        });

        const { default: supabase } = await import('@lib/supabaseClient');
        
          const { data: userData, error: userError } = await supabase.auth.getUser();

          if (userError || !userData?.user?.id) {
            throw new Error('Usuário não autenticado');
          }

          const userId = userData.user.id;

        // Chamar RPC para atualizar grupo
        const { data, error } = await supabase
          .rpc('update_grupo_transacoes_valor', {
            p_usuario_id: user.id,
            p_transacao_id: transacaoId,
            p_tipo_atualizacao: tipoAtualizacao, // 'atual' ou 'futuras'
            p_novo_valor: parseFloat(novoValor)
          });

        if (error) throw error;

        const resultado = data?.[0];
        if (!resultado) {
          throw new Error('Nenhum resultado retornado da RPC');
        }

        console.log('✅ Grupo atualizado:', {
          transacoesAtualizadas: resultado.transacoes_atualizadas,
          idsAtualizados: resultado.ids_atualizados,
          detalhes: resultado.detalhes
        });

        // Atualizar transações na store local
        if (resultado.ids_atualizados && resultado.ids_atualizados.length > 0) {
          set(state => ({
            transacoes: state.transacoes.map(t => {
              if (resultado.ids_atualizados.includes(t.id)) {
                return {
                  ...t,
                  valor: parseFloat(novoValor),
                  updated_at: new Date().toISOString()
                };
              }
              return t;
            })
          }));
        }

        set({ loading: false });
        
        return { 
          success: true, 
          data: resultado,
          message: `${resultado.transacoes_atualizadas} transação(ões) atualizada(s): ${resultado.detalhes}`
        };

      } catch (error) {
        console.error('❌ Erro ao atualizar grupo de transações:', error);
        set({ 
          error: error.message || 'Erro ao atualizar grupo de transações',
          loading: false 
        });
        return { 
          success: false, 
          error: error.message,
          message: 'Falha ao atualizar transações'
        };
      }
    },

    // Adicionar nova transação
    addTransacao: async (transacaoData) => {
      try {
        set({ loading: true });

        console.log('➕ Adicionando transação:', transacaoData);

        const { default: supabase } = await import('@lib/supabaseClient');
        
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
            conta_destino:contas!transacoes_conta_destino_fkey(id, nome, tipo),
            cartao:cartoes(id, nome, bandeira)
          `)
          .single();

        if (error) throw error;

        // Mapear dados
        const transacaoMapeada = {
          id: data.id,
          data: data.data,
          tipo: data.tipo,
          valor: parseFloat(data.valor) || 0,
          descricao: data.descricao || 'Sem descrição',
          categoria_id: data.categoria_id,
          categoria_nome: data.categoria?.nome || 'Sem categoria',
          categoria_cor: data.categoria?.cor || '#6B7280',
          conta_id: data.conta_id,
          conta_nome: data.conta?.nome || 'Conta não informada',
          cartao_id: data.cartao_id,
          cartao_nome: data.cartao?.nome,
          efetivado: data.efetivado !== false,
          observacoes: data.observacoes || ''
        };

        // Atualizar lista local se a transação se encaixa nos filtros atuais
        if (get().transacaoEncaixaFiltros(transacaoMapeada)) {
          set(state => ({
            transacoes: [transacaoMapeada, ...state.transacoes]
          }));
        }

        set({ loading: false });
        console.log('✅ Transação adicionada com sucesso');
        
        return { success: true, data: transacaoMapeada };

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

        const { default: supabase } = await import('@lib/supabaseClient');
        
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
            conta_destino:contas!transacoes_conta_destino_fkey(id, nome, tipo),
            cartao:cartoes(id, nome, bandeira)
          `)
          .single();

        if (error) throw error;

        // Mapear dados
        const transacaoMapeada = {
          id: data.id,
          data: data.data,
          tipo: data.tipo,
          valor: parseFloat(data.valor) || 0,
          descricao: data.descricao || 'Sem descrição',
          categoria_id: data.categoria_id,
          categoria_nome: data.categoria?.nome || 'Sem categoria',
          categoria_cor: data.categoria?.cor || '#6B7280',
          conta_id: data.conta_id,
          conta_nome: data.conta?.nome || 'Conta não informada',
          cartao_id: data.cartao_id,
          cartao_nome: data.cartao?.nome,
          efetivado: data.efetivado !== false,
          observacoes: data.observacoes || ''
        };

        // Atualizar na lista local
        set(state => ({
          transacoes: state.transacoes.map(t => 
            t.id === id ? transacaoMapeada : t
          )
        }));

        set({ loading: false });
        console.log('✅ Transação atualizada com sucesso');
        
        return { success: true, data: transacaoMapeada };

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

        const { default: supabase } = await import('@lib/supabaseClient');
        
        const { error } = await supabase
          .from('transacoes')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Remover da lista local
        set(state => ({
          transacoes: state.transacoes.filter(t => t.id !== id)
        }));

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

    // ===========================
    // OPERAÇÕES EM LOTE
    // ===========================

    // Excluir múltiplas transações
    deleteMultipleTransacoes: async (ids) => {
      try {
        set({ loading: true });

        console.log('🗑️ Excluindo múltiplas transações:', ids);

        const { default: supabase } = await import('@lib/supabaseClient');
        
        const { error } = await supabase
          .from('transacoes')
          .delete()
          .in('id', ids);

        if (error) throw error;

        // Remover da lista local
        set(state => ({
          transacoes: state.transacoes.filter(t => !ids.includes(t.id))
        }));

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

    // ===========================
    // UTILITÁRIOS
    // ===========================

    // Verificar se transação é parcelada ou recorrente
    isTransacaoParceladaOuRecorrente: (transacao) => {
      if (!transacao) return { isParcelada: false, isRecorrente: false, tipo: 'avulsa' };
      
      const isParcelada = (
        (transacao.tipo_receita === 'parcelada' || transacao.tipo_despesa === 'parcelada') &&
        transacao.grupo_parcelamento
      );
      
      const isRecorrente = (
        transacao.eh_recorrente === true && 
        transacao.grupo_recorrencia
      );
      
      let tipo = 'avulsa';
      if (isParcelada) tipo = 'parcelada';
      else if (isRecorrente) tipo = 'recorrente';
      
      return { 
        isParcelada, 
        isRecorrente, 
        tipo,
        grupoId: isParcelada ? transacao.grupo_parcelamento : transacao.grupo_recorrencia,
        parcelaAtual: transacao.parcela_atual,
        totalParcelas: transacao.total_parcelas,
        numeroRecorrencia: transacao.numero_recorrencia,
        totalRecorrencias: transacao.total_recorrencias
      };
    },

    // Verificar se transação se encaixa nos filtros atuais
    transacaoEncaixaFiltros: (transacao) => {
      const { filtros } = get();
      
      // Verificar tipo
      if (filtros.tipos.length > 0 && !filtros.tipos.includes(transacao.tipo)) {
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
      if (filtros.categorias.length > 0 && !filtros.categorias.includes(transacao.categoria_id)) {
        return false;
      }

      // Verificar conta
      if (filtros.contas.length > 0 && 
          !filtros.contas.includes(transacao.conta_id) && 
          !filtros.contas.includes(transacao.conta_destino_id)) {
        return false;
      }

      // Verificar cartão
      if (filtros.cartoes.length > 0 && !filtros.cartoes.includes(transacao.cartao_id)) {
        return false;
      }

      // Verificar status
      if (filtros.status.length > 0) {
        const status = transacao.efetivado ? 'efetivado' : 'pendente';
        if (!filtros.status.includes(status)) {
          return false;
        }
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

    // Verificar se tem filtros ativos
    hasActiveFilters: () => {
      const { filtros } = get();
      return (
        filtros.tipos.length > 0 ||
        filtros.categorias.length > 0 ||
        filtros.contas.length > 0 ||
        filtros.cartoes.length > 0 ||
        filtros.status.length > 0 ||
        filtros.valorMinimo > 0 ||
        filtros.valorMaximo < 999999 ||
        filtros.dataInicio !== null ||
        filtros.dataFim !== null ||
        filtros.busca !== ''
      );
    },

    // Obter resumo dos filtros ativos
    getActiveFiltersDescription: () => {
      const { filtros } = get();
      const descriptions = [];

      if (filtros.tipos.length > 0) {
        descriptions.push(`Tipos: ${filtros.tipos.join(', ')}`);
      }
      
      if (filtros.categorias.length > 0) {
        descriptions.push(`${filtros.categorias.length} categoria(s)`);
      }
      
      if (filtros.contas.length > 0) {
        descriptions.push(`${filtros.contas.length} conta(s)`);
      }

      if (filtros.cartoes.length > 0) {
        descriptions.push(`${filtros.cartoes.length} cartão(ões)`);
      }

      if (filtros.status.length > 0) {
        descriptions.push(`Status: ${filtros.status.join(', ')}`);
      }
      
      if (filtros.busca) {
        descriptions.push(`Busca: "${filtros.busca}"`);
      }

      if (filtros.valorMinimo > 0 || filtros.valorMaximo < 999999) {
        descriptions.push(`Valores: R$ ${filtros.valorMinimo} - R$ ${filtros.valorMaximo}`);
      }

      return descriptions.join(', ');
    },

    // ===========================
    // CACHE E PERFORMANCE
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

    // Reset completo do store
    reset: () => {
      set({
        transacoes: [],
        loading: false,
        error: null,
        filtros: {
          tipos: [],
          categorias: [],
          subcategorias: [],
          contas: [],
          cartoes: [],
          status: [],
          valorMinimo: 0,
          valorMaximo: 999999,
          dataInicio: null,
          dataFim: null,
          busca: '',
          periodo: {
            inicio: startOfMonth(new Date()),
            fim: endOfMonth(new Date())
          }
        },
        paginacao: {
          pagina: 1,
          itensPorPagina: 100,
          total: 0,
          totalPaginas: 0
        },
        cache: {
          ultimaBusca: null,
          resultados: {},
          timestamp: null
        }
      });
    }
  }))
);

// ===========================
// HOOKS PERSONALIZADOS
// ===========================

/**
 * Hook principal para usar transações
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
    
    // Ações principais
    fetchTransacoes: store.fetchTransacoes,
    addTransacao: store.addTransacao,
    updateTransacao: store.updateTransacao,
    deleteTransacao: store.deleteTransacao,
    deleteMultiple: store.deleteMultipleTransacoes,
    
    // Nova ação para grupos
    updateGrupoValor: store.updateGrupoTransacoesValor,
    
    // Filtros
    setFiltros: store.setFiltros,
    limparFiltros: store.limparFiltros,
    
    // Getters computados
    estatisticas: store.getEstatisticas(),
    totalFiltrado: store.getTotalFiltrado(),
    hasActiveFilters: store.hasActiveFilters(),
    activeFiltersDescription: store.getActiveFiltersDescription(),
    
    // Utilitários
    getById: store.getTransacaoById,
    isParceladaOuRecorrente: store.isTransacaoParceladaOuRecorrente,
    reset: store.reset,
    
    // Estados auxiliares
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError
  };
};

// Hook simplificado para componentes que só precisam ler dados
export const useTransactionsData = () => {
  const { transacoes, loading, error, hasActiveFilters } = useTransactionsStore();
  return { transacoes, loading, error, hasActiveFilters };
};

// Hook para filtros
export const useTransactionsFilters = () => {
  const { filtros, setFiltros, limparFiltros, hasActiveFilters } = useTransactionsStore();
  return { filtros, setFiltros, limparFiltros, hasActiveFilters };
};

export default useTransactionsStore;