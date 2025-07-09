// src/modules/transacoes/store/transactionsStore.js - VERSÃO CORRIGIDA COM RPC
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Store específico para gerenciar transações COM FUNCIONALIDADES CORRIGIDAS
 * ✅ CORREÇÕES IMPLEMENTADAS:
 * - Identificação correta de transações parceladas/recorrentes
 * - Método updateGrupoTransacoesValor funcional 
 * - Função isParceladaOuRecorrente corrigida
 * - Carregamento de dados com todos os campos necessários
 * - Tratamento adequado de data_efetivacao
 * - BUG FIX 22: Lógica corrigida para exibir parcelas no mês de vencimento da fatura
 * - BUG FIX 2: Modal de edição de ajuste de saldo preenchido corretamente
 * - ✅ NOVA: Função toggleEfetivadoRPC para corrigir problema de relacionamento ambíguo
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

        // Tentar buscar via RPC CORRIGIDA
        try {
          const periodoEfetivo = {
            inicio: filtros.dataInicio || format(filtros.periodo.inicio, 'yyyy-MM-dd'),
            fim: filtros.dataFim || format(filtros.periodo.fim, 'yyyy-MM-dd')
          };

          const { data, error } = await supabase.rpc('ip_prod_buscar_transacoes_periodo', {
            p_usuario_id: userId,
            p_data_inicio: periodoEfetivo.inicio,
            p_data_fim: periodoEfetivo.fim
          });

          if (error) throw error;

          console.log(`✅ ${data?.length || 0} transações carregadas via RPC CORRIGIDA`);
          
          // ✅ DADOS JÁ VEM NO FORMATO CORRETO DA NOVA RPC
          console.log('🔍 [DEBUG] Primeira transação da RPC:', data?.[0] ? {
            id: data[0].id,
            descricao: data[0].descricao,
            grupo_parcelamento: data[0].grupo_parcelamento,
            grupo_recorrencia: data[0].grupo_recorrencia,
            parcela_atual: data[0].parcela_atual,
            total_parcelas: data[0].total_parcelas
          } : 'nenhuma');

          // ===== BUG FIX 22: Filtrar parcelas de cartão para mostrar apenas no mês de vencimento =====
          const transacoesFiltradas = get().aplicarFiltrosCartaoParcelas(data || []);

          // Aplicar filtros locais adicionais se necessário
          const transacoesFinais = get().aplicarFiltrosLocais(transacoesFiltradas);

          set({
            transacoes: transacoesFinais,
            loading: false,
            paginacao: {
              ...paginacao,
              total: transacoesFinais.length,
              totalPaginas: Math.ceil(transacoesFinais.length / paginacao.itensPorPagina)
            }
          });

          return transacoesFinais;

        } catch (rpcError) {
          console.warn('⚠️ RPC ip_prod_buscar_transacoes_periodo falhou, usando query manual como fallback:', rpcError);
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

    // ===== BUG FIX 22: Nova função para filtrar parcelas de cartão =====
    aplicarFiltrosCartaoParcelas: (transacoes) => {

          const aplicarFiltrosCartaoParcelas = (transacoes) => {
            const { filtros } = get();
            
            // ✅ USAR MESMO PERÍODO EFETIVO
            const periodoEfetivo = {
              inicio: filtros.dataInicio ? new Date(filtros.dataInicio) : new Date(filtros.periodo.inicio),
              fim: filtros.dataFim ? new Date(filtros.dataFim) : new Date(filtros.periodo.fim)
            };
            
            const periodoInicio = periodoEfetivo.inicio;
            const periodoFim = periodoEfetivo.fim;
            
            // ... resto da função permanece igual
          }


      const { filtros } = get();
      
      // Obter período atual de forma mais explícita
      const periodoInicio = new Date(filtros.periodo.inicio);
      const periodoFim = new Date(filtros.periodo.fim);
      
      console.log('🔍 [DEBUG] Período atual (store):', {
        inicio: periodoInicio.toISOString(),
        fim: periodoFim.toISOString(),
        mes: periodoInicio.getMonth() + 1,
        ano: periodoInicio.getFullYear()
      });
      
      return transacoes.filter(transacao => {
        // Se não é transação de cartão, manter sempre
        if (!transacao.cartao_id || transacao.tipo !== 'despesa') {
          return true;
        }

        // ✅ REGRA CORRIGIDA: Para parcelas de cartão, verificar fatura_vencimento
        if (transacao.fatura_vencimento) {
          // Converter data de vencimento para Date
          const dataVencimento = new Date(transacao.fatura_vencimento + 'T00:00:00');
          
          // Verificar se a data de vencimento está no período atual
          const vencimentoNoPeriodo = dataVencimento >= periodoInicio && dataVencimento <= periodoFim;
          
          console.log('💳 [DEBUG] Verificando parcela de cartão (store):', {
            descricao: transacao.descricao,
            dataCompra: transacao.data,
            faturaVencimento: transacao.fatura_vencimento,
            dataVencimentoParsed: dataVencimento.toISOString(),
            periodoInicio: periodoInicio.toISOString(),
            periodoFim: periodoFim.toISOString(),
            vencimentoNoPeriodo,
            mesVencimento: dataVencimento.getMonth() + 1,
            anoVencimento: dataVencimento.getFullYear(),
            mesPeriodo: periodoInicio.getMonth() + 1,
            anoPeriodo: periodoInicio.getFullYear()
          });
          
          return vencimentoNoPeriodo;
        }

        // Se é transação de cartão mas não tem fatura_vencimento, 
        // tratar como transação avulsa (usar data da compra)
        const dataTransacao = new Date(transacao.data);
        const transacaoNoPeriodo = dataTransacao >= periodoInicio && dataTransacao <= periodoFim;
        
        console.log('💳 [DEBUG] Transação de cartão sem fatura_vencimento (store):', {
          descricao: transacao.descricao,
          dataCompra: transacao.data,
          transacaoNoPeriodo
        });
        
        return transacaoNoPeriodo;
      });
    },

    // Fallback: busca manual via query SQL
    fetchTransacoesManual: async () => {
      const { filtros, paginacao } = get();
      
      try {
        const { default: supabase } = await import('@lib/supabaseClient');
        
        // Construir query base - ✅ INCLUIR TODOS OS CAMPOS NECESSÁRIOS
        let query = supabase
          .from('transacoes')
          .select(`
            *,
            categoria:categorias(id, nome, cor, icone),
            conta_origem:contas!transacoes_conta_id_fkey(id, nome, tipo),
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

        // ✅ Mapear dados para formato padrão INCLUINDO TODOS OS CAMPOS
        const transacoesMapeadas = (data || []).map(t => ({
          id: t.id,
          data: t.data,
          data_efetivacao: t.data_efetivacao,
          tipo: t.tipo,
          valor: parseFloat(t.valor) || 0,
          descricao: t.descricao || 'Sem descrição',
          categoria_id: t.categoria_id,
          categoria_nome: t.categoria?.nome || 'Sem categoria',
          categoria_cor: t.categoria?.cor || '#6B7280',
          conta_id: t.conta_id,
          conta_nome: t.conta_origem?.nome || 'Conta não informada',
          conta_destino_id: t.conta_destino_id,
          conta_destino_nome: t.conta_destino?.nome,
          cartao_id: t.cartao_id,
          cartao_nome: t.cartao?.nome,
          efetivado: t.efetivado !== false,
          observacoes: t.observacoes || '',
          subcategoria_id: t.subcategoria_id,
          transferencia: t.transferencia || false,
          
          // ✅ CAMPOS PARA IDENTIFICAR GRUPOS (CORRIGIDO)
          grupo_parcelamento: t.grupo_parcelamento,
          grupo_recorrencia: t.grupo_recorrencia,
          parcela_atual: t.parcela_atual,
          total_parcelas: t.total_parcelas,
          numero_recorrencia: t.numero_recorrencia,
          total_recorrencias: t.total_recorrencias,
          eh_recorrente: t.eh_recorrente,
          tipo_recorrencia: t.tipo_recorrencia,
          fatura_vencimento: t.fatura_vencimento, // ✅ CAMPO NECESSÁRIO PARA BUG FIX 22
          
          created_at: t.created_at,
          updated_at: t.updated_at
        }));

        // ===== BUG FIX 22: Aplicar filtro de parcelas de cartão =====
        const transacoesFiltradas = get().aplicarFiltrosCartaoParcelas(transacoesMapeadas);

        // Aplicar filtros adicionais
        const transacoesFinais = get().aplicarFiltrosLocais(transacoesFiltradas);

        // Atualizar estado
        const totalPaginas = Math.ceil((count || 0) / paginacao.itensPorPagina);
        
        set({
          transacoes: transacoesFinais,
          loading: false,
          paginacao: {
            ...paginacao,
            total: count || 0,
            totalPaginas
          }
        });

        console.log(`✅ ${transacoesFinais?.length || 0} transações carregadas (${count} total)`);
        return transacoesFinais;

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

    // ✅ NOVA FUNÇÃO: Toggle efetivado via RPC (SOLUÇÃO PARA O BUG)
    toggleEfetivadoRPC: async (transacaoId, novoStatus) => {
      try {
        set({ loading: true, error: null });

        console.log('🔄 [RPC] Atualizando efetivação:', {
          transacaoId,
          novoStatus
        });

        const { default: supabase } = await import('@lib/supabaseClient');
        
        // Obter usuário autenticado
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) {
          throw new Error('Usuário não autenticado');
        }

        // Chamar RPC
        const { data, error } = await supabase.rpc('ip_prod_atualizar_efetivacao_transacao', {
          p_transacao_id: transacaoId,
          p_usuario_id: userData.user.id,
          p_efetivado: novoStatus
        });

        if (error) {
          console.error('❌ [RPC] Erro do Supabase:', error);
          throw new Error(error.message || 'Erro na comunicação com o servidor');
        }

        // Verificar resultado da RPC
        if (!data || !data.success) {
          console.error('❌ [RPC] RPC retornou erro:', data);
          
          // Tratamento específico para erros de cartão
          if (data?.details?.tipo === 'cartao_credito') {
            const errorMsg = `${data.error}\n\nCartão: ${data.details.cartao_nome}\n${data.details.sugestao}`;
            throw new Error(errorMsg);
          }
          
          throw new Error(data?.error || 'Erro desconhecido na operação');
        }

        // ✅ ATUALIZAR ESTADO LOCAL (Single Source of Truth)
        set(state => ({
          transacoes: state.transacoes.map(transacao => 
            transacao.id === transacaoId 
              ? { 
                  ...transacao, 
                  efetivado: novoStatus,
                  updated_at: new Date().toISOString()
                }
              : transacao
          ),
          loading: false
        }));

        console.log('✅ [RPC] Efetivação atualizada com sucesso:', data.message);

        return { 
          success: true, 
          message: data.message,
          data: data.data
        };

      } catch (error) {
        console.error('❌ [RPC] Erro ao atualizar efetivação:', error);
        
        set({ 
          error: error.message,
          loading: false 
        });

        return { 
          success: false, 
          error: error.message 
        };
      }
    },

    // ✅ MÉTODO CORRIGIDO: Atualizar valor de grupo de transações
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

        // ✅ IMPLEMENTAÇÃO MANUAL se RPC não existe
        try {
          // Primeiro, buscar a transação para identificar o grupo
          const { data: transacao, error: transacaoError } = await supabase
            .from('transacoes')
            .select('*')
            .eq('id', transacaoId)
            .eq('usuario_id', userId)
            .single();

          if (transacaoError || !transacao) {
            throw new Error('Transação não encontrada');
          }

          console.log('📋 Transação encontrada:', transacao);

          // Identificar o tipo de grupo
          const grupoId = transacao.grupo_parcelamento || transacao.grupo_recorrencia;
          const isParcelamento = Boolean(transacao.grupo_parcelamento);
          
          if (!grupoId) {
            throw new Error('Transação não pertence a um grupo');
          }

          console.log('🎯 Grupo identificado:', {
            grupoId,
            isParcelamento,
            tipoAtualizacao
          });

          // ✅ CORREÇÃO: Construir query corretamente
          let query = supabase
            .from('transacoes')
            .update({ 
              valor: parseFloat(novoValor),
              updated_at: new Date().toISOString()
            })
            .eq('usuario_id', userId);

          // Aplicar filtro do grupo
          if (isParcelamento) {
            query = query.eq('grupo_parcelamento', grupoId);
          } else {
            query = query.eq('grupo_recorrencia', grupoId);
          }

          // ✅ CORREÇÃO: Aplicar filtro por escopo de forma CORRETA
          if (tipoAtualizacao === 'atual') {
            // Só a transação atual
            query = query.eq('id', transacaoId);
          } else if (tipoAtualizacao === 'futuras') {
            // ✅ CORREÇÃO: Query SQL correta - Esta transação OU transações não efetivadas
            // Usar duas queries separadas para evitar problemas de sintaxe
            
            // Primeiro, atualizar a transação atual
            const { error: currentError } = await supabase
              .from('transacoes')
              .update({ 
                valor: parseFloat(novoValor),
                updated_at: new Date().toISOString()
              })
              .eq('id', transacaoId)
              .eq('usuario_id', userId);

            if (currentError) throw currentError;

            // Depois, atualizar as futuras não efetivadas do mesmo grupo
            let futureQuery = supabase
              .from('transacoes')
              .update({ 
                valor: parseFloat(novoValor),
                updated_at: new Date().toISOString()
              })
              .eq('usuario_id', userId)
              .eq('efetivado', false)
              .neq('id', transacaoId); // Excluir a atual que já foi atualizada

            // Aplicar filtro do grupo para as futuras
            if (isParcelamento) {
              futureQuery = futureQuery.eq('grupo_parcelamento', grupoId);
            } else {
              futureQuery = futureQuery.eq('grupo_recorrencia', grupoId);
            }

            const { data: transacoesFuturas, error: futureError } = await futureQuery.select('id');

            if (futureError) throw futureError;

            // Retornar resultado combinado
            const idsAtualizados = [transacaoId, ...(transacoesFuturas?.map(t => t.id) || [])];
            const quantidadeAtualizada = idsAtualizados.length;

            console.log('✅ Atualização concluída (modo futuras):', {
              quantidadeAtualizada,
              idsAtualizados
            });

            // Atualizar transações na store local
            if (idsAtualizados.length > 0) {
              set(state => ({
                transacoes: state.transacoes.map(t => {
                  if (idsAtualizados.includes(t.id)) {
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

            const mensagem = `${quantidadeAtualizada} transação(ões) do grupo atualizadas com sucesso!`;

            return { 
              success: true, 
              data: {
                transacoes_atualizadas: quantidadeAtualizada,
                ids_atualizados: idsAtualizados,
                detalhes: `Escopo: ${tipoAtualizacao}, Novo valor: ${novoValor}`
              },
              message: mensagem
            };
          }

          // Para escopo 'atual', executar a query simples
          const { data: transacoesAtualizadas, error: updateError } = await query.select('id');

          if (updateError) throw updateError;

          const quantidadeAtualizada = transacoesAtualizadas?.length || 0;
          const idsAtualizados = transacoesAtualizadas?.map(t => t.id) || [];

          console.log('✅ Atualização concluída (modo atual):', {
            quantidadeAtualizada,
            idsAtualizados
          });

          // Atualizar transações na store local
          if (idsAtualizados.length > 0) {
            set(state => ({
              transacoes: state.transacoes.map(t => {
                if (idsAtualizados.includes(t.id)) {
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

          const mensagem = 'Transação atualizada com sucesso!';

          return { 
            success: true, 
            data: {
              transacoes_atualizadas: quantidadeAtualizada,
              ids_atualizados: idsAtualizados,
              detalhes: `Escopo: ${tipoAtualizacao}, Novo valor: ${novoValor}`
            },
            message: mensagem
          };

        } catch (error) {
          throw error;
        }

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
    
    // ✅ NOVA FUNÇÃO: Determinar data_efetivacao baseada no tipo de transação
    determinarDataEfetivacao: (transacaoData) => {
      const { tipo, cartao_id, data } = transacaoData;

      // ✅ REGRA 1: Despesas de cartão = NULL
      if (tipo === 'despesa' && cartao_id) {
        console.log('💳 Despesa de cartão - data_efetivacao = NULL');
        return null;
      }

      // ✅ REGRA 2: Receitas, despesas normais e transferências = data da transação
      if (tipo === 'receita' || tipo === 'despesa' || tipo === 'transferencia') {
        console.log(`💰 ${tipo} - data_efetivacao = data da transação`);
        return data;
      }

      // ✅ REGRA 3: Outros casos (fallback) = data da transação
      console.log('🔄 Caso padrão - data_efetivacao = data da transação');
      return data;
    },

    // ✅ Adicionar nova transação COM data_efetivacao
    addTransacao: async (transacaoData) => {
      try {
        set({ loading: true });

        console.log('➕ Adicionando transação:', transacaoData);

        const { default: supabase } = await import('@lib/supabaseClient');
        
        // ✅ DETERMINAR data_efetivacao baseada nas regras
        const dataEfetivacao = get().determinarDataEfetivacao(transacaoData);
        
        const { data, error } = await supabase
          .from('transacoes')
          .insert([{
            ...transacaoData,
            data_efetivacao: dataEfetivacao,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            categoria:categorias(id, nome, cor, icone),
            conta_origem:contas!transacoes_conta_id_fkey(id, nome, tipo),
            conta_destino:contas!transacoes_conta_destino_id_fkey(id, nome, tipo),
            cartao:cartoes(id, nome, bandeira)
          `)
          .single();

        if (error) throw error;

        // ✅ Mapear dados INCLUINDO TODOS OS CAMPOS
        const transacaoMapeada = {
          id: data.id,
          data: data.data,
          data_efetivacao: data.data_efetivacao,
          tipo: data.tipo,
          valor: parseFloat(data.valor) || 0,
          descricao: data.descricao || 'Sem descrição',
          categoria_id: data.categoria_id,
          categoria_nome: data.categoria?.nome || 'Sem categoria',
          categoria_cor: data.categoria?.cor || '#6B7280',
          conta_id: data.conta_id,
          conta_nome: data.conta_origem?.nome || 'Conta não informada',
          conta_destino_id: data.conta_destino_id,
          conta_destino_nome: data.conta_destino?.nome,
          cartao_id: data.cartao_id,
          cartao_nome: data.cartao?.nome,
          efetivado: data.efetivado !== false,
          observacoes: data.observacoes || '',
          
          // ✅ CAMPOS DE GRUPO
          grupo_parcelamento: data.grupo_parcelamento,
          grupo_recorrencia: data.grupo_recorrencia,
          parcela_atual: data.parcela_atual,
          total_parcelas: data.total_parcelas,
          numero_recorrencia: data.numero_recorrencia,
          total_recorrencias: data.total_recorrencias,
          eh_recorrente: data.eh_recorrente,
          tipo_recorrencia: data.tipo_recorrencia,
          fatura_vencimento: data.fatura_vencimento // ✅ CAMPO NECESSÁRIO PARA BUG FIX 22
        };

        // Atualizar lista local se a transação se encaixa nos filtros atuais
        if (get().transacaoEncaixaFiltros(transacaoMapeada)) {
          set(state => ({
            transacoes: [transacaoMapeada, ...state.transacoes]
          }));
        }

        set({ loading: false });
        console.log('✅ Transação adicionada com sucesso - data_efetivacao:', dataEfetivacao);
        
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

    // ✅ Atualizar transação existente COM data_efetivacao
    updateTransacao: async (id, transacaoData) => {
      try {
        set({ loading: true });

        console.log('✏️ Atualizando transação:', id, transacaoData);

        const { default: supabase } = await import('@lib/supabaseClient');
        
        // ===== BUG FIX 2: Garantir que campos sejam preenchidos corretamente no modal =====
        // Se está atualizando dados que afetam data_efetivacao, recalcular
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
            const novaDataEfetivacao = get().determinarDataEfetivacao(dadosCompletos);
            updateData.data_efetivacao = novaDataEfetivacao;
            
            console.log('🔄 Recalculando data_efetivacao:', novaDataEfetivacao);
          }
        }
        
        const { data, error } = await supabase
          .from('transacoes')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select(`
            *,
            categoria:categorias(id, nome, cor, icone),
            conta_origem:contas!transacoes_conta_id_fkey(id, nome, tipo),
            conta_destino:contas!transacoes_conta_destino_id_fkey(id, nome, tipo),
            cartao:cartoes(id, nome, bandeira)
          `)
          .single();

        if (error) throw error;

        // ✅ Mapear dados INCLUINDO TODOS OS CAMPOS
        const transacaoMapeada = {
          id: data.id,
          data: data.data,
          data_efetivacao: data.data_efetivacao,
          tipo: data.tipo,
          valor: parseFloat(data.valor) || 0,
          descricao: data.descricao || 'Sem descrição',
          categoria_id: data.categoria_id,
          categoria_nome: data.categoria?.nome || 'Sem categoria',
          categoria_cor: data.categoria?.cor || '#6B7280',
          conta_id: data.conta_id,
          conta_nome: data.conta_origem?.nome || 'Conta não informada',
          conta_destino_id: data.conta_destino_id,
          conta_destino_nome: data.conta_destino?.nome,
          cartao_id: data.cartao_id,
          cartao_nome: data.cartao?.nome,
          efetivado: data.efetivado !== false,
          observacoes: data.observacoes || '',
          
          // ✅ CAMPOS DE GRUPO
          grupo_parcelamento: data.grupo_parcelamento,
          grupo_recorrencia: data.grupo_recorrencia,
          parcela_atual: data.parcela_atual,
          total_parcelas: data.total_parcelas,
          numero_recorrencia: data.numero_recorrencia,
          total_recorrencias: data.total_recorrencias,
          eh_recorrente: data.eh_recorrente,
          tipo_recorrencia: data.tipo_recorrencia,
          fatura_vencimento: data.fatura_vencimento // ✅ CAMPO NECESSÁRIO PARA BUG FIX 22
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
    // UTILITÁRIOS
    // ===========================

    // ✅ FUNÇÃO CORRIGIDA: Verificar se transação é parcelada ou recorrente
    isParceladaOuRecorrente: (transacao) => {
      if (!transacao) return { isParcelada: false, isRecorrente: false, tipo: 'avulsa' };
      
      console.log('🔍 Analisando transação para identificar tipo:', {
        id: transacao.id,
        grupo_parcelamento: transacao.grupo_parcelamento,
        grupo_recorrencia: transacao.grupo_recorrencia,
        parcela_atual: transacao.parcela_atual,
        total_parcelas: transacao.total_parcelas
      });
      
      const isParcelada = Boolean(transacao.grupo_parcelamento);
      const isRecorrente = Boolean(transacao.grupo_recorrencia);
      
      let tipo = 'avulsa';
      if (isParcelada) tipo = 'parcelada';
      else if (isRecorrente) tipo = 'previsivel';
      
      const resultado = { 
        isParcelada, 
        isRecorrente, 
        tipo,
        grupoId: isParcelada ? transacao.grupo_parcelamento : transacao.grupo_recorrencia,
        parcelaAtual: transacao.parcela_atual,
        totalParcelas: transacao.total_parcelas,
        numeroRecorrencia: transacao.numero_recorrencia,
        totalRecorrencias: transacao.total_recorrencias
      };
      
      console.log('📊 Resultado da análise:', resultado);
      
      return resultado;
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

    // ===== BUG FIX 2: Função melhorada para obter transação por ID com todos os campos =====
    getTransacaoById: (id) => {
      const { transacoes } = get();
      const transacao = transacoes.find(t => t.id === id);
      
      if (!transacao) {
        console.warn('⚠️ Transação não encontrada no store local:', id);
        return null;
      }

      // ✅ Garantir que todos os campos necessários estão presentes
      const transacaoCompleta = {
        id: transacao.id,
        data: transacao.data,
        data_efetivacao: transacao.data_efetivacao,
        tipo: transacao.tipo,
        valor: transacao.valor,
        descricao: transacao.descricao || '',
        categoria_id: transacao.categoria_id,
        categoria_nome: transacao.categoria_nome || 'Sem categoria',
        categoria_cor: transacao.categoria_cor || '#6B7280',
        conta_id: transacao.conta_id,
        conta_nome: transacao.conta_nome || 'Conta não informada',
        conta_destino_id: transacao.conta_destino_id,
        conta_destino_nome: transacao.conta_destino_nome,
        cartao_id: transacao.cartao_id,
        cartao_nome: transacao.cartao_nome,
        efetivado: transacao.efetivado !== false,
        observacoes: transacao.observacoes || '',
        subcategoria_id: transacao.subcategoria_id,
        transferencia: transacao.transferencia || false,
        
        // ✅ CAMPOS DE GRUPO
        grupo_parcelamento: transacao.grupo_parcelamento,
        grupo_recorrencia: transacao.grupo_recorrencia,
        parcela_atual: transacao.parcela_atual,
        total_parcelas: transacao.total_parcelas,
        numero_recorrencia: transacao.numero_recorrencia,
        total_recorrencias: transacao.total_recorrencias,
        eh_recorrente: transacao.eh_recorrente,
        tipo_recorrencia: transacao.tipo_recorrencia,
        fatura_vencimento: transacao.fatura_vencimento,
        
        created_at: transacao.created_at,
        updated_at: transacao.updated_at
      };

      console.log('📋 Transação encontrada com todos os campos:', transacaoCompleta);
      return transacaoCompleta;
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

    // ✅ Obter estatísticas incluindo data_efetivacao
    getEstatisticas: () => {
      const { transacoes } = get();
      
      const receitas = transacoes.filter(t => t.tipo === 'receita');
      const despesas = transacoes.filter(t => t.tipo === 'despesa');
      const transferencias = transacoes.filter(t => t.tipo === 'transferencia');
      
      // ✅ Estatísticas por data de efetivação
      const efetivadas = transacoes.filter(t => t.data_efetivacao !== null);
      const naoEfetivadas = transacoes.filter(t => t.data_efetivacao === null);

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
        },
        // ✅ NOVAS ESTATÍSTICAS
        efetivacao: {
          efetivadas: {
            quantidade: efetivadas.length,
            valor: efetivadas.reduce((acc, t) => acc + t.valor, 0)
          },
          naoEfetivadas: {
            quantidade: naoEfetivadas.length,
            valor: naoEfetivadas.reduce((acc, t) => acc + t.valor, 0)
          },
          percentualEfetivado: transacoes.length > 0 ? (efetivadas.length / transacoes.length * 100).toFixed(1) : 0
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
 * Hook principal para usar transações - COMPATIBILIDADE
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
    
    // ✅ NOVA AÇÃO: Toggle efetivado via RPC
    toggleEfetivado: store.toggleEfetivadoRPC,
    
    // ✅ AÇÃO CORRIGIDA para grupos
    updateGrupoValor: store.updateGrupoTransacoesValor,
    
    // ✅ AÇÕES para data_efetivacao
    determinarDataEfetivacao: store.determinarDataEfetivacao,
    
    // Filtros
    setFiltros: store.setFiltros,
    limparFiltros: store.limparFiltros,
    
    // Getters computados
    estatisticas: store.getEstatisticas(),
    totalFiltrado: store.getTotalFiltrado(),
    hasActiveFilters: store.hasActiveFilters(),
    activeFiltersDescription: store.getActiveFiltersDescription(),
    
    // ✅ UTILITÁRIO CORRIGIDO
    getById: store.getTransacaoById,
    isParceladaOuRecorrente: store.isParceladaOuRecorrente,
    transacaoEncaixaFiltros: store.transacaoEncaixaFiltros,
    reset: store.reset,
    
    // Estados auxiliares
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    
    // Cache e performance
    getCacheKey: store.getCacheKey,
    invalidateCache: store.invalidateCache
  };
};

export default useTransactionsStore;