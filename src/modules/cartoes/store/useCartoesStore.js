// src/modules/cartoes/store/useCartoesStore.js
// ✅ REFATORADO: Ajustado para nova estrutura de dados (categoria_nome)
// ❌ PROIBIDO: Chamadas ao banco, lógica de negócio, formatação

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Store para gerenciar APENAS estado de UI do módulo cartões
 * ✅ Permitido: Estados, filtros, UI helpers, flags de loading
 * ❌ Proibido: Chamadas ao Supabase, lógica de negócio, formatação
 */
export const useCartoesStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ===============================
        // ESTADO DE DADOS (gerenciado pelos hooks)
        // ===============================
        cartoes: [],
        transacoesFatura: [],
        faturasDisponiveis: [],
        resumoConsolidado: null,
        
        // ===============================
        // ESTADO DE UI
        // ===============================
        
        // Visualização sempre inicia consolidada
        visualizacao: 'consolidada', // 'consolidada' | 'detalhada'
        cartaoSelecionado: null,
        faturaAtual: null,
        modalAberto: null, // 'criar-cartao' | 'editar-cartao' | 'despesa' | 'parcelamento' | 'estorno'
        
        // Mês selecionado para visão consolidada
        mesSelecionado: null, // Formato: YYYY-MM
        
        // Filtros
        filtroStatus: 'todos', // 'todos' | 'ativos' | 'arquivados'
        filtroCategoria: 'todas',
        filtroPeriodo: null,
        filtroTexto: '',
        
        // Configurações de exibição
        mostrarValores: true,
        exibirModoCompacto: false,
        ordenacao: 'nome', // 'nome' | 'limite' | 'vencimento' | 'valor_fatura'
        direcaoOrdenacao: 'asc', // 'asc' | 'desc'
        
        // Estados de expansão/colapso
        cartoesExpandidos: {}, // { [cartaoId]: boolean }
        parcelasExpandidas: {}, // { [grupoParcelamento]: boolean }
        categoriasExpandidas: {}, // { [categoria]: boolean }
        
        // Estados de carregamento por contexto
        loadingStates: {
          cartoes: false,
          faturas: false,
          transacoes: false,
          operacao: false
        },
        
        // Estados de erro por contexto
        errorStates: {
          cartoes: null,
          faturas: null,
          transacoes: null,
          operacao: null
        },
        
        // ===============================
        // ACTIONS PARA DADOS
        // ===============================
        
        setCartoes: (cartoes) => 
          set({ cartoes }, false, 'setCartoes'),

        addCartao: (cartao) => 
          set((state) => ({ 
            cartoes: [...state.cartoes, cartao] 
          }), false, 'addCartao'),

        updateCartao: (cartaoId, dadosAtualizacao) => 
          set((state) => ({
            cartoes: state.cartoes.map(cartao => 
              cartao.id === cartaoId 
                ? { ...cartao, ...dadosAtualizacao }
                : cartao
            )
          }), false, 'updateCartao'),

        removeCartao: (cartaoId) => 
          set((state) => ({
            cartoes: state.cartoes.filter(cartao => cartao.id !== cartaoId)
          }), false, 'removeCartao'),

        setTransacoesFatura: (transacoes) => {
          console.log('🏪 STORE: Recebendo transações com nova estrutura:', {
            transacoes,
            length: transacoes?.length || 0,
            primeiraTransacao: transacoes?.[0] ? {
              id: transacoes[0].id,
              descricao: transacoes[0].descricao,
              categoria_nome: transacoes[0].categoria_nome, // ✅ Nova estrutura
              conta_pagamento_nome: transacoes[0].conta_pagamento_nome // ✅ Nova informação
            } : 'nenhuma'
          });
          set({ transacoesFatura: transacoes }, false, 'setTransacoesFatura');
        },

        addTransacao: (transacao) => 
          set((state) => ({ 
            transacoesFatura: [...state.transacoesFatura, transacao] 
          }), false, 'addTransacao'),

        updateTransacao: (transacaoId, dadosAtualizacao) => 
          set((state) => ({
            transacoesFatura: state.transacoesFatura.map(transacao => 
              transacao.id === transacaoId 
                ? { ...transacao, ...dadosAtualizacao }
                : transacao
            )
          }), false, 'updateTransacao'),

        removeTransacao: (transacaoId) => 
          set((state) => ({
            transacoesFatura: state.transacoesFatura.filter(t => t.id !== transacaoId)
          }), false, 'removeTransacao'),

        setFaturasDisponiveis: (faturas) => 
          set({ faturasDisponiveis: faturas }, false, 'setFaturasDisponiveis'),

        setResumoConsolidado: (resumo) => 
          set({ resumoConsolidado: resumo }, false, 'setResumoConsolidado'),

        // ===============================
        // ACTIONS PARA UI
        // ===============================
        
        // Visualização e navegação
        setVisualizacao: (visualizacao) => 
          set({ visualizacao }, false, 'setVisualizacao'),

        setCartaoSelecionado: (cartao) => 
          set({ cartaoSelecionado: cartao }, false, 'setCartaoSelecionado'),

        setFaturaAtual: (fatura) => 
          set({ faturaAtual: fatura }, false, 'setFaturaAtual'),

        setModalAberto: (modal) => 
          set({ modalAberto: modal }, false, 'setModalAberto'),

        fecharModal: () => 
          set({ modalAberto: null }, false, 'fecharModal'),

        setMesSelecionado: (mes) => 
          set({ mesSelecionado: mes }, false, 'setMesSelecionado'),

        // Filtros
        setFiltroStatus: (status) => 
          set({ filtroStatus: status }, false, 'setFiltroStatus'),

        setFiltroCategoria: (categoria) => 
          set({ filtroCategoria: categoria }, false, 'setFiltroCategoria'),

        setFiltroPeriodo: (periodo) => 
          set({ filtroPeriodo: periodo }, false, 'setFiltroPeriodo'),

        setFiltroTexto: (texto) => 
          set({ filtroTexto: texto }, false, 'setFiltroTexto'),

        resetFiltros: () => 
          set({ 
            filtroStatus: 'todos',
            filtroCategoria: 'todas',
            filtroPeriodo: null,
            filtroTexto: ''
          }, false, 'resetFiltros'),

        // Configurações de exibição
        toggleMostrarValores: () => 
          set((state) => ({ 
            mostrarValores: !state.mostrarValores 
          }), false, 'toggleMostrarValores'),

        setMostrarValores: (mostrar) => 
          set({ mostrarValores: mostrar }, false, 'setMostrarValores'),

        toggleModoCompacto: () => 
          set((state) => ({ 
            exibirModoCompacto: !state.exibirModoCompacto 
          }), false, 'toggleModoCompacto'),

        setModoCompacto: (compacto) => 
          set({ exibirModoCompacto: compacto }, false, 'setModoCompacto'),

        setOrdenacao: (campo, direcao = null) => 
          set((state) => ({
            ordenacao: campo,
            direcaoOrdenacao: direcao || (
              state.ordenacao === campo && state.direcaoOrdenacao === 'asc' 
                ? 'desc' 
                : 'asc'
            )
          }), false, 'setOrdenacao'),

        // Estados de expansão/colapso
        toggleCartaoExpandido: (cartaoId) => 
          set((state) => ({
            cartoesExpandidos: {
              ...state.cartoesExpandidos,
              [cartaoId]: !state.cartoesExpandidos[cartaoId]
            }
          }), false, 'toggleCartaoExpandido'),

        expandirCartao: (cartaoId) => 
          set((state) => ({
            cartoesExpandidos: {
              ...state.cartoesExpandidos,
              [cartaoId]: true
            }
          }), false, 'expandirCartao'),

        recolherCartao: (cartaoId) => 
          set((state) => ({
            cartoesExpandidos: {
              ...state.cartoesExpandidos,
              [cartaoId]: false
            }
          }), false, 'recolherCartao'),

        toggleParcelaExpandida: (grupoParcelamento) => 
          set((state) => ({
            parcelasExpandidas: {
              ...state.parcelasExpandidas,
              [grupoParcelamento]: !state.parcelasExpandidas[grupoParcelamento]
            }
          }), false, 'toggleParcelaExpandida'),

        expandirParcela: (grupoParcelamento) => 
          set((state) => ({
            parcelasExpandidas: {
              ...state.parcelasExpandidas,
              [grupoParcelamento]: true
            }
          }), false, 'expandirParcela'),

        recolherParcela: (grupoParcelamento) => 
          set((state) => ({
            parcelasExpandidas: {
              ...state.parcelasExpandidas,
              [grupoParcelamento]: false
            }
          }), false, 'recolherParcela'),

        toggleCategoriaExpandida: (categoria) => 
          set((state) => ({
            categoriasExpandidas: {
              ...state.categoriasExpandidas,
              [categoria]: !state.categoriasExpandidas[categoria]
            }
          }), false, 'toggleCategoriaExpandida'),

        // ===============================
        // ESTADOS DE CARREGAMENTO
        // ===============================
        
        setLoading: (contexto, isLoading) => 
          set((state) => ({
            loadingStates: {
              ...state.loadingStates,
              [contexto]: isLoading
            }
          }), false, 'setLoading'),

        setLoadingCartoes: (isLoading) => 
          set((state) => ({
            loadingStates: {
              ...state.loadingStates,
              cartoes: isLoading
            }
          }), false, 'setLoadingCartoes'),

        setLoadingFaturas: (isLoading) => 
          set((state) => ({
            loadingStates: {
              ...state.loadingStates,
              faturas: isLoading
            }
          }), false, 'setLoadingFaturas'),

        setLoadingTransacoes: (isLoading) => 
          set((state) => ({
            loadingStates: {
              ...state.loadingStates,
              transacoes: isLoading
            }
          }), false, 'setLoadingTransacoes'),

        setLoadingOperacao: (isLoading) => 
          set((state) => ({
            loadingStates: {
              ...state.loadingStates,
              operacao: isLoading
            }
          }), false, 'setLoadingOperacao'),

        // ===============================
        // ESTADOS DE ERRO
        // ===============================
        
        setError: (contexto, error) => 
          set((state) => ({
            errorStates: {
              ...state.errorStates,
              [contexto]: error
            }
          }), false, 'setError'),

        setErrorCartoes: (error) => 
          set((state) => ({
            errorStates: {
              ...state.errorStates,
              cartoes: error
            }
          }), false, 'setErrorCartoes'),

        setErrorFaturas: (error) => 
          set((state) => ({
            errorStates: {
              ...state.errorStates,
              faturas: error
            }
          }), false, 'setErrorFaturas'),

        setErrorTransacoes: (error) => 
          set((state) => ({
            errorStates: {
              ...state.errorStates,
              transacoes: error
            }
          }), false, 'setErrorTransacoes'),

        setErrorOperacao: (error) => 
          set((state) => ({
            errorStates: {
              ...state.errorStates,
              operacao: error
            }
          }), false, 'setErrorOperacao'),

        clearErrors: () => 
          set({ 
            errorStates: {
              cartoes: null,
              faturas: null,
              transacoes: null,
              operacao: null
            }
          }, false, 'clearErrors'),

        clearError: (contexto) => 
          set((state) => ({
            errorStates: {
              ...state.errorStates,
              [contexto]: null
            }
          }), false, 'clearError'),

        // ===============================
        // GETTERS COMPUTADOS (SEM FORMATAÇÃO)
        // ===============================
        
        getCartoesAtivos: () => {
          const { cartoes } = get();
          return cartoes.filter(cartao => cartao.ativo !== false);
        },

        getCartoesArquivados: () => {
          const { cartoes } = get();
          return cartoes.filter(cartao => cartao.ativo === false);
        },

        getCartoesFiltrados: () => {
          const { 
            cartoes, 
            filtroStatus, 
            filtroTexto,
            ordenacao,
            direcaoOrdenacao 
          } = get();
          
          let cartoesFiltrados = [...cartoes];

          // Filtro por status
          if (filtroStatus === 'ativos') {
            cartoesFiltrados = cartoesFiltrados.filter(c => c.ativo !== false);
          } else if (filtroStatus === 'arquivados') {
            cartoesFiltrados = cartoesFiltrados.filter(c => c.ativo === false);
          }

          // Filtro por texto
          if (filtroTexto) {
            const texto = filtroTexto.toLowerCase();
            cartoesFiltrados = cartoesFiltrados.filter(cartao => 
              cartao.nome?.toLowerCase().includes(texto) ||
              cartao.bandeira?.toLowerCase().includes(texto) ||
              cartao.banco?.toLowerCase().includes(texto)
            );
          }

          // Ordenação
          cartoesFiltrados.sort((a, b) => {
            let valorA = a[ordenacao];
            let valorB = b[ordenacao];

            // Tratar valores numéricos
            if (ordenacao === 'limite') {
              valorA = parseFloat(valorA) || 0;
              valorB = parseFloat(valorB) || 0;
            }

            // Tratar strings
            if (typeof valorA === 'string') {
              valorA = valorA.toLowerCase();
              valorB = valorB.toLowerCase();
            }

            if (valorA < valorB) return direcaoOrdenacao === 'asc' ? -1 : 1;
            if (valorA > valorB) return direcaoOrdenacao === 'asc' ? 1 : -1;
            return 0;
          });

          return cartoesFiltrados;
        },

        // ✅ FUNÇÃO CORRIGIDA: getTransacoesFiltradas - Nova estrutura de dados
        getTransacoesFiltradas: () => {
          const { 
            transacoesFatura, 
            filtroCategoria,
            filtroTexto 
          } = get();
          
          console.log('🔍 GETTER: Filtrando transações com nova estrutura:', {
            original: transacoesFatura,
            originalLength: transacoesFatura?.length || 0,
            filtroCategoria,
            filtroTexto,
            primeiraTransacao: transacoesFatura?.[0] ? {
              categoria_nome: transacoesFatura[0].categoria_nome,
              conta_pagamento_nome: transacoesFatura[0].conta_pagamento_nome
            } : 'nenhuma'
          });
          
          let transacoesFiltradas = [...(transacoesFatura || [])];

          // ✅ CORRIGIDO: Filtro por categoria - nova estrutura
          if (filtroCategoria !== 'todas' && filtroCategoria !== 'Todas') {
            console.log('🔍 GETTER: Aplicando filtro de categoria:', filtroCategoria);
            transacoesFiltradas = transacoesFiltradas.filter(t => 
              t.categoria_nome === filtroCategoria // ✅ USAR categoria_nome
            );
          }

          // ✅ CORRIGIDO: Filtro por texto - nova estrutura
          if (filtroTexto) {
            console.log('🔍 GETTER: Aplicando filtro de texto:', filtroTexto);
            const texto = filtroTexto.toLowerCase();
            transacoesFiltradas = transacoesFiltradas.filter(transacao => 
              transacao.descricao?.toLowerCase().includes(texto) ||
              transacao.categoria_nome?.toLowerCase().includes(texto) || // ✅ USAR categoria_nome
              transacao.conta_pagamento_nome?.toLowerCase().includes(texto) // ✅ NOVO: buscar por conta
            );
          }

          console.log('✅ GETTER: Resultado filtrado:', {
            filtradas: transacoesFiltradas,
            length: transacoesFiltradas.length
          });

          return transacoesFiltradas;
        },

        // ✅ FUNÇÃO CORRIGIDA: getCategoriasUnicas - Nova estrutura de dados
        getCategoriasUnicas: () => {
          const { transacoesFatura } = get();
          const categorias = new Set();
          
          transacoesFatura.forEach(transacao => {
            if (transacao.categoria_nome) { // ✅ USAR categoria_nome
              categorias.add(transacao.categoria_nome);
            }
          });
          
          const resultado = Array.from(categorias).sort();
          
          console.log('📋 CATEGORIAS ÚNICAS encontradas:', {
            categorias: resultado,
            total: resultado.length
          });
          
          return resultado;
        },

        getTotalCartoesAtivos: () => {
          return get().getCartoesAtivos().length;
        },

        hasErrors: () => {
          const { errorStates } = get();
          return Object.values(errorStates).some(error => error !== null);
        },

        isLoading: () => {
          const { loadingStates } = get();
          return Object.values(loadingStates).some(loading => loading === true);
        },

        isLoadingContexto: (contexto) => {
          const { loadingStates } = get();
          return loadingStates[contexto] || false;
        },

        getErrorContexto: (contexto) => {
          const { errorStates } = get();
          return errorStates[contexto] || null;
        },

        // ===============================
        // ACTIONS DE RESET
        // ===============================
        
        resetVisualizacao: () => 
          set({ 
            visualizacao: 'consolidada',
            cartaoSelecionado: null,
            faturaAtual: null,
            modalAberto: null
          }, false, 'resetVisualizacao'),

        resetExpansoes: () => 
          set({ 
            cartoesExpandidos: {},
            parcelasExpandidas: {},
            categoriasExpandidas: {}
          }, false, 'resetExpansoes'),

        resetStore: () => 
          set({
            cartoes: [],
            transacoesFatura: [],
            faturasDisponiveis: [],
            resumoConsolidado: null,
            visualizacao: 'consolidada',
            cartaoSelecionado: null,
            faturaAtual: null,
            modalAberto: null,
            mesSelecionado: null,
            filtroStatus: 'todos',
            filtroCategoria: 'todas',
            filtroPeriodo: null,
            filtroTexto: '',
            mostrarValores: true,
            exibirModoCompacto: false,
            ordenacao: 'nome',
            direcaoOrdenacao: 'asc',
            cartoesExpandidos: {},
            parcelasExpandidas: {},
            categoriasExpandidas: {},
            loadingStates: {
              cartoes: false,
              faturas: false,
              transacoes: false,
              operacao: false
            },
            errorStates: {
              cartoes: null,
              faturas: null,
              transacoes: null,
              operacao: null
            }
          }, false, 'resetStore')
      }),
      {
        name: 'cartoes-ui-storage',
        partialize: (state) => ({
          mostrarValores: state.mostrarValores,
          exibirModoCompacto: state.exibirModoCompacto,
          ordenacao: state.ordenacao,
          direcaoOrdenacao: state.direcaoOrdenacao,
          mesSelecionado: state.mesSelecionado
        })
      }
    ),
    {
      name: 'cartoes-store'
    }
  )
);

export default useCartoesStore;