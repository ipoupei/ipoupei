// src/modules/contas/store/contasStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@lib/supabaseClient';

/**
 * Store Zustand para gerenciamento de Contas
 * ✅ Substitui useState local do useContas.js
 * ✅ Estados reativos para componentes
 * ✅ Funções assíncronas integradas
 * ✅ Compatível com forceRefreshContas após transferências
 */

const useContasStore = create(
  subscribeWithSelector((set, get) => ({
    // ===== ESTADOS =====
    contas: [],
    contasArquivadas: [],
    saldoTotal: 0,
    loading: false,
    error: null,
    
    // Controle interno
    lastFetchTime: 0,
    fetchCount: 0,

    
    // ===== ACTIONS =====
    
    /**
     * ✅ FUNÇÃO PRINCIPAL: Buscar contas com mapeamento correto da RPC
     */
    fetchContas: async (incluirArquivadas = false, forceRefresh = false) => {
      const state = get();
      const now = Date.now();
      
      // Incrementar contador para debug
      set({ fetchCount: state.fetchCount + 1 });
      const currentFetchCount = state.fetchCount + 1;

      // Obter usuário atual do auth (assumindo que existe em algum store global)
      let user;
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;
      } catch (authError) {
        console.error('❌ Erro ao obter usuário:', authError);
        set({ error: 'Usuário não autenticado' });
        return;
      }

      if (!user?.id) {
        set({ 
          contas: [], 
          contasArquivadas: [], 
          saldoTotal: 0,
          error: 'Usuário não encontrado'
        });
        return;
      }

      // Debounce inteligente (exceto se forçado)
      if (!forceRefresh && (now - state.lastFetchTime) < 1000) {
        console.log(`⏳ [${currentFetchCount}] Fetch muito recente, pulando...`);
        return;
      }

      try {
        set({ 
          loading: true, 
          error: null, 
          lastFetchTime: now 
        });

        console.log(`🏦 [${currentFetchCount}] === INICIANDO FETCH CONTAS ===`);
        console.log(`🔍 [${currentFetchCount}] Usuário: ${user.email}`);
        console.log(`🔍 [${currentFetchCount}] incluirArquivadas: ${incluirArquivadas} | forceRefresh: ${forceRefresh}`);

        // ✅ PASSO 1: Buscar contas ativas via RPC
        console.log(`🔄 [${currentFetchCount}] Executando RPC obter_saldos_por_conta (ativas)...`);
        
        const { data: contasAtivas, error: erroAtivas } = await supabase
          .rpc('obter_saldos_por_conta', {
            p_usuario_id: user.id,
            p_incluir_inativas: false
          });

        if (erroAtivas) {
          console.error(`❌ [${currentFetchCount}] Erro na RPC (ativas):`, erroAtivas);
          throw erroAtivas;
        }

        console.log(`✅ [${currentFetchCount}] RPC ativas retornou:`, contasAtivas?.length || 0, 'contas');
        
        // ✅ DEBUG: Mostrar estrutura retornada pela RPC
        if (contasAtivas && contasAtivas.length > 0) {
          const primeiraContaRPC = contasAtivas[0];
          console.log(`🔍 [${currentFetchCount}] Estrutura da RPC:`, Object.keys(primeiraContaRPC));
          console.log(`💰 [${currentFetchCount}] Primeira conta RPC:`, {
            id: primeiraContaRPC.conta_id,
            nome: primeiraContaRPC.conta_nome,
            saldo_atual: primeiraContaRPC.saldo_atual,
            saldo_inicial: primeiraContaRPC.saldo_inicial,
            ativa: primeiraContaRPC.ativa
          });
        }

        // ✅ PASSO 2: Buscar contas inativas se necessário
        let contasInativas = [];
        if (incluirArquivadas) {
          console.log(`🔄 [${currentFetchCount}] Executando RPC obter_saldos_por_conta (todas)...`);
          
          const { data: todasContas, error: erroTodas } = await supabase
            .rpc('obter_saldos_por_conta', {
              p_usuario_id: user.id,
              p_incluir_inativas: true
            });

          if (erroTodas) {
            console.warn(`⚠️ [${currentFetchCount}] Erro na RPC (todas):`, erroTodas);
          } else {
            // Filtrar apenas as inativas
            contasInativas = (todasContas || []).filter(conta => !conta.ativa);
            console.log(`✅ [${currentFetchCount}] Encontradas ${contasInativas.length} contas inativas`);
          }
        }

        // ✅ PASSO 3: Transformar dados da RPC para formato do componente
        const contasAtivasFormatadas = (contasAtivas || []).map(conta => ({
          id: conta.conta_id,           // ✅ RPC retorna 'conta_id'
          nome: conta.conta_nome,       // ✅ RPC retorna 'conta_nome' 
          tipo: conta.conta_tipo,       // ✅ RPC retorna 'conta_tipo'
          saldo: conta.saldo_atual,     // ✅ RPC retorna 'saldo_atual'
          saldo_atual: conta.saldo_atual,
          saldo_inicial: conta.saldo_inicial || 0,
          cor: conta.cor || '#3B82F6',
          banco: conta.banco,
          icone: conta.icone,
          ativo: conta.ativa,           // ✅ RPC retorna 'ativa' 
          incluir_soma_total: conta.incluir_soma !== false, // ✅ RPC retorna 'incluir_soma'
          total_transacoes_mes: conta.total_transacoes_mes || 0,
          observacoes: conta.observacoes,
          created_at: conta.created_at,
          updated_at: conta.updated_at,
          ordem: conta.ordem || 1
        }));

        const contasInativasFormatadas = contasInativas.map(conta => ({
          id: conta.conta_id,
          nome: conta.conta_nome,
          tipo: conta.conta_tipo,
          saldo: conta.saldo_atual,
          saldo_atual: conta.saldo_atual,
          saldo_inicial: conta.saldo_inicial || 0,
          cor: conta.cor || '#3B82F6',
          banco: conta.banco,
          icone: conta.icone,
          ativo: conta.ativa,
          incluir_soma_total: conta.incluir_soma !== false,
          total_transacoes_mes: conta.total_transacoes_mes || 0,
          observacoes: conta.observacoes,
          created_at: conta.created_at,
          updated_at: conta.updated_at,
          ordem: conta.ordem || 1,
          arquivada: true
        }));

        // ✅ DEBUG: Mostrar dados formatados
        console.log(`📋 [${currentFetchCount}] Contas ativas formatadas:`, 
          contasAtivasFormatadas.map(c => `${c.nome}: R$ ${c.saldo}`).join(', ')
        );

        // ✅ PASSO 4: Calcular saldo total usando RPC
        console.log(`🧮 [${currentFetchCount}] Calculando saldo total...`);
        
        let saldoFinal = 0;
        try {
          const { data: saldoRPC, error: erroSaldo } = await supabase
            .rpc('IP_Prod_calcular_saldo_atual', { usuario: user.id });

          if (erroSaldo) {
            console.warn(`⚠️ [${currentFetchCount}] Erro na RPC saldo total:`, erroSaldo);
            // Fallback: calcular localmente
            saldoFinal = contasAtivasFormatadas
              .filter(c => c.incluir_soma_total)
              .reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);
            console.log(`✅ [${currentFetchCount}] Saldo total (fallback): R$ ${saldoFinal}`);
          } else {
            saldoFinal = Number(saldoRPC) || 0;
            console.log(`✅ [${currentFetchCount}] Saldo total (RPC): R$ ${saldoFinal}`);
          }
        } catch (saldoError) {
          console.warn(`⚠️ [${currentFetchCount}] Erro calculando saldo:`, saldoError);
          // Sempre funcional: calcular localmente
          saldoFinal = contasAtivasFormatadas
            .filter(c => c.incluir_soma_total)
            .reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);
          console.log(`✅ [${currentFetchCount}] Saldo total (emergency): R$ ${saldoFinal}`);
        }

        // ✅ PASSO 5: Atualizar store
        set({
          contas: contasAtivasFormatadas,
          contasArquivadas: contasInativasFormatadas,
          saldoTotal: saldoFinal,
          loading: false,
          error: null
        });

        console.log(`✅ [${currentFetchCount}] === FETCH CONTAS CONCLUÍDO ===`);
        console.log(`📊 [${currentFetchCount}] Resultado: ${contasAtivasFormatadas.length} ativas, ${contasInativasFormatadas.length} arquivadas, Total: R$ ${saldoFinal}`);

      } catch (err) {
        console.error(`❌ [${currentFetchCount}] ERRO CRÍTICO:`, err);
        
        // ✅ Tentar fallback direto da tabela
        console.log(`🔄 [${currentFetchCount}] Tentando fallback direto...`);
        
        try {
          const { data: contasDiretas, error: erroDireto } = await supabase
            .from('contas')
            .select('*')
            .eq('usuario_id', user.id)
            .eq('ativo', true)
            .order('nome');

          if (!erroDireto && contasDiretas) {
            const contasFallback = contasDiretas.map(conta => ({
              id: conta.id,
              nome: conta.nome,
              tipo: conta.tipo,
              saldo: conta.saldo || conta.saldo_inicial || 0,
              saldo_atual: conta.saldo || conta.saldo_inicial || 0,
              saldo_inicial: conta.saldo_inicial || 0,
              cor: conta.cor || '#3B82F6',
              banco: conta.banco,
              ativo: conta.ativo,
              incluir_soma_total: conta.incluir_soma_total !== false,
              observacoes: conta.observacoes,
              created_at: conta.created_at,
              updated_at: conta.updated_at
            }));

            const saldoFallback = contasFallback
              .filter(c => c.incluir_soma_total)
              .reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);

            set({
              contas: contasFallback,
              saldoTotal: saldoFallback,
              loading: false,
              error: null
            });

            console.log(`✅ [${currentFetchCount}] Fallback OK: ${contasFallback.length} contas`);
          } else {
            throw new Error('Fallback também falhou');
          }
        } catch (fallbackError) {
          console.error(`❌ [${currentFetchCount}] Fallback falhou:`, fallbackError);
          set({
            loading: false,
            error: err.message || 'Erro ao carregar contas'
          });
        }
      }
    },

    /**
     * ✅ FUNÇÃO ESPECIAL: Forçar refresh após transferências
     */
    forceRefreshContas: async (incluirArquivadas = false) => {
      console.log('🚀 === FORÇA REFRESH SOLICITADO ===');
      console.log('⏳ Aguardando triggers processarem (2 segundos)...');
      
      // ✅ Aguardar triggers processarem
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ✅ Forçar fetch ignorando debounce
      console.log('🔄 Executando fetch forçado...');
      return get().fetchContas(incluirArquivadas, true);
    },

    /**
     * ✅ Buscar contas arquivadas
     */
    fetchContasArquivadas: async () => {
      return get().fetchContas(true);
    },

    /**
     * ✅ Obter todas as contas (ativas + arquivadas)
     */
    getTodasContas: () => {
      const state = get();
      return [...state.contas, ...state.contasArquivadas];
    },

    /**
     * ✅ Obter saldo de uma conta específica
     */
    getSaldoConta: (contaId) => {
      const state = get();
      const conta = state.contas.find(c => c.id === contaId);
      return conta ? Number(conta.saldo_atual || conta.saldo || 0) : 0;
    },

    /**
     * ✅ Obter saldo total
     */
    getSaldoTotal: () => {
      const state = get();
      return Number(state.saldoTotal || 0);
    },

    /**
     * ✅ Adicionar nova conta
     */
    addConta: async (dadosConta) => {
      let user;
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;
      } catch (authError) {
        throw new Error('Usuário não autenticado');
      }

      if (!user?.id) throw new Error('Usuário não autenticado');

      try {
        const saldoInicial = Number(dadosConta.saldo || dadosConta.saldoInicial || 0);
        
        const { data, error } = await supabase
          .from('contas')
          .insert([{
            ...dadosConta,
            usuario_id: user.id,
            ativo: true,
            saldo_inicial: saldoInicial,
            saldo: saldoInicial,
            incluir_soma_total: true,
            ordem: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;

        // ✅ Refresh forçado após criação
        await get().forceRefreshContas();
        return data;
      } catch (error) {
        console.error('❌ Erro ao adicionar conta:', error);
        set({ error: error.message });
        throw error;
      }
    },

    /**
     * ✅ Atualizar conta
     */
    updateConta: async (contaId, dadosAtualizacao) => {
      let user;
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;
      } catch (authError) {
        throw new Error('Usuário não autenticado');
      }

      if (!user?.id) throw new Error('Usuário não autenticado');

      try {
        // Converter saldo para saldo_inicial se necessário
        if (dadosAtualizacao.saldo !== undefined) {
          dadosAtualizacao.saldo_inicial = Number(dadosAtualizacao.saldo);
          delete dadosAtualizacao.saldo;
        }

        const { data, error } = await supabase
          .from('contas')
          .update({
            ...dadosAtualizacao,
            updated_at: new Date().toISOString()
          })
          .eq('id', contaId)
          .eq('usuario_id', user.id)
          .select()
          .single();

        if (error) throw error;

        // ✅ Refresh forçado após atualização
        await get().forceRefreshContas();
        return data;
      } catch (error) {
        console.error('❌ Erro ao atualizar conta:', error);
        set({ error: error.message });
        throw error;
      }
    },

    /**
     * ✅ Arquivar conta
     */
    arquivarConta: async (contaId, motivo = '') => {
      let user;
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;
      } catch (authError) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      if (!user?.id) return { success: false, error: 'Usuário não autenticado' };

      try {
        set({ loading: true });

        const state = get();
        const conta = state.contas.find(c => c.id === contaId);
        if (!conta) throw new Error('Conta não encontrada');

        const { error } = await supabase
          .from('contas')
          .update({
            ativo: false,
            observacoes: motivo ? 
              `${conta.observacoes || ''}\n[Arquivada: ${new Date().toLocaleDateString('pt-BR')}] ${motivo}`.trim() : 
              conta.observacoes,
            updated_at: new Date().toISOString()
          })
          .eq('id', contaId)
          .eq('usuario_id', user.id);

        if (error) throw error;

        await get().forceRefreshContas(true);
        return { success: true };

      } catch (error) {
        console.error('❌ Erro ao arquivar conta:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      } finally {
        set({ loading: false });
      }
    },

    /**
     * ✅ Desarquivar conta
     */
    desarquivarConta: async (contaId) => {
      let user;
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;
      } catch (authError) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      if (!user?.id) return { success: false, error: 'Usuário não autenticado' };

      try {
        set({ loading: true });

        const state = get();
        const conta = state.contasArquivadas.find(c => c.id === contaId);
        if (!conta) throw new Error('Conta arquivada não encontrada');

        const { error } = await supabase
          .from('contas')
          .update({
            ativo: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', contaId)
          .eq('usuario_id', user.id);

        if (error) throw error;

        await get().forceRefreshContas(true);
        return { success: true };

      } catch (error) {
        console.error('❌ Erro ao desarquivar conta:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      } finally {
        set({ loading: false });
      }
    },

    /**
     * ✅ Limpar erros
     */
    clearError: () => {
      set({ error: null });
    },

    /**
     * ✅ Reset da store
     */
    reset: () => {
      set({
        contas: [],
        contasArquivadas: [],
        saldoTotal: 0,
        loading: false,
        error: null,
        lastFetchTime: 0,
        fetchCount: 0
      });
    }
  }))
);

export default useContasStore;