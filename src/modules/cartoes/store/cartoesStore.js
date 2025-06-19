import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useCartoesStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        cartoes: [],
        faturaDetalhada: null,
        
        // Estados de UI
        visualizacao: 'consolidada', // 'consolidada' | 'detalhada'
        cartaoSelecionado: null,
        filtroCategoria: 'Todas',
        mostrarValores: true,
        parcelasExpandidas: {},
        
        // Estados de carregamento
        isLoadingCartoes: false,
        isLoadingFatura: false,
        
        // Erros
        errorCartoes: null,
        errorFatura: null,

        // Actions para dados
        setCartoes: (cartoes) => 
          set({ cartoes }, false, 'setCartoes'),

        setFaturaDetalhada: (fatura) => 
          set({ faturaDetalhada: fatura }, false, 'setFaturaDetalhada'),

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

        // Actions para UI
        setVisualizacao: (visualizacao) => 
          set({ visualizacao }, false, 'setVisualizacao'),

        setCartaoSelecionado: (cartao) => 
          set({ cartaoSelecionado: cartao }, false, 'setCartaoSelecionado'),

        setFiltroCategoria: (categoria) => 
          set({ filtroCategoria: categoria }, false, 'setFiltroCategoria'),

        toggleMostrarValores: () => 
          set((state) => ({ 
            mostrarValores: !state.mostrarValores 
          }), false, 'toggleMostrarValores'),

        setMostrarValores: (mostrar) => 
          set({ mostrarValores: mostrar }, false, 'setMostrarValores'),

        toggleParcela: (grupoParcelamento) => 
          set((state) => ({
            parcelasExpandidas: {
              ...state.parcelasExpandidas,
              [grupoParcelamento]: !state.parcelasExpandidas[grupoParcelamento]
            }
          }), false, 'toggleParcela'),

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

        // Actions para estados de carregamento
        setLoadingCartoes: (isLoading) => 
          set({ isLoadingCartoes: isLoading }, false, 'setLoadingCartoes'),

        setLoadingFatura: (isLoading) => 
          set({ isLoadingFatura: isLoading }, false, 'setLoadingFatura'),

        // Actions para erros
        setErrorCartoes: (error) => 
          set({ errorCartoes: error }, false, 'setErrorCartoes'),

        setErrorFatura: (error) => 
          set({ errorFatura: error }, false, 'setErrorFatura'),

        clearErrors: () => 
          set({ 
            errorCartoes: null, 
            errorFatura: null 
          }, false, 'clearErrors'),

        // Actions para reset
        resetFiltros: () => 
          set({ 
            filtroCategoria: 'Todas',
            parcelasExpandidas: {}
          }, false, 'resetFiltros'),

        resetVisualizacao: () => 
          set({ 
            visualizacao: 'consolidada',
            cartaoSelecionado: null,
            faturaDetalhada: null,
            filtroCategoria: 'Todas',
            parcelasExpandidas: {}
          }, false, 'resetVisualizacao'),

        resetStore: () => 
          set({
            cartoes: [],
            faturaDetalhada: null,
            visualizacao: 'consolidada',
            cartaoSelecionado: null,
            filtroCategoria: 'Todas',
            mostrarValores: true,
            parcelasExpandidas: {},
            isLoadingCartoes: false,
            isLoadingFatura: false,
            errorCartoes: null,
            errorFatura: null
          }, false, 'resetStore'),

        // Getters computados
        getTotalCartoesAtivos: () => {
          const { cartoes } = get();
          return cartoes.filter(cartao => cartao.ativo !== false).length;
        },

        getTotalFaturas: () => {
          const { cartoes } = get();
          return cartoes.reduce((total, cartao) => 
            total + (cartao.fatura_atual || 0), 0
          );
        },

        getProximoVencimento: () => {
          const { cartoes } = get();
          if (!cartoes.length) return null;

          const hoje = new Date();
          const vencimentos = cartoes
            .map(cartao => {
              const vencimento = new Date(cartao.vencimento);
              const diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
              return { cartao, diasRestantes };
            })
            .filter(item => item.diasRestantes > 0)
            .sort((a, b) => a.diasRestantes - b.diasRestantes);

          return vencimentos[0] || null;
        },

        getCartoesPorStatus: () => {
          const { cartoes } = get();
          return cartoes.reduce((acc, cartao) => {
            const percentualUtilizacao = cartao.percentual_limite || 0;
            let status = 'saudavel';
            
            if (percentualUtilizacao > 80) status = 'critico';
            else if (percentualUtilizacao > 60) status = 'atencao';
            else if (percentualUtilizacao > 30) status = 'moderado';

            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
        },

        getCategoriasMaisGastam: () => {
          const { faturaDetalhada } = get();
          if (!faturaDetalhada?.gastos_categoria) return [];

          return faturaDetalhada.gastos_categoria
            .slice(0, 5)
            .map(categoria => ({
              nome: categoria.categoria,
              valor: categoria.valor,
              percentual: categoria.percentual,
              cor: categoria.cor
            }));
        },

        getTransacoesPorStatus: () => {
          const { faturaDetalhada } = get();
          if (!faturaDetalhada?.transacoes) return {};

          return faturaDetalhada.transacoes.reduce((acc, transacao) => {
            const status = transacao.status.toLowerCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
        },

        getInsightsPrincipais: () => {
          const { cartoes, faturaDetalhada } = get();
          const insights = [];

          // Insight sobre utilização de limite
          const cartoesAltoUso = cartoes.filter(c => c.percentual_limite > 70);
          if (cartoesAltoUso.length > 0) {
            insights.push({
              tipo: 'atencao',
              titulo: 'Alto uso de limite',
              descricao: `${cartoesAltoUso.length} cartão(ões) com uso acima de 70%`,
              acao: 'Considere reduzir gastos ou quitar a fatura'
            });
          }

          // Insight sobre vencimentos próximos
          const proximoVencimento = get().getProximoVencimento();
          if (proximoVencimento && proximoVencimento.diasRestantes <= 7) {
            insights.push({
              tipo: 'urgente',
              titulo: 'Vencimento próximo',
              descricao: `Fatura vence em ${proximoVencimento.diasRestantes} dias`,
              acao: 'Programe o pagamento'
            });
          }

          // Insight sobre categoria de maior gasto
          if (faturaDetalhada?.insights?.categoria_maior_gasto) {
            insights.push({
              tipo: 'informativo',
              titulo: 'Categoria destaque',
              descricao: `Maior gasto em ${faturaDetalhada.insights.categoria_maior_gasto}`,
              acao: 'Revise estes gastos'
            });
          }

          // Insight sobre evolução dos gastos
          if (faturaDetalhada?.comparativo_mes_anterior?.variacao_percentual) {
            const variacao = faturaDetalhada.comparativo_mes_anterior.variacao_percentual;
            if (variacao > 20) {
              insights.push({
                tipo: 'atencao',
                titulo: 'Gastos em alta',
                descricao: `Aumento de ${variacao}% em relação ao mês anterior`,
                acao: 'Identifique os gastos extras'
              });
            } else if (variacao < -10) {
              insights.push({
                tipo: 'positivo',
                titulo: 'Economia efetiva',
                descricao: `Redução de ${Math.abs(variacao)}% nos gastos`,
                acao: 'Continue controlando bem!'
              });
            }
          }

          return insights;
        },

        // Actions para análises avançadas
        analisarTendenciaGastos: (meses = 6) => {
          const { cartoes, faturaDetalhada } = get();
          
          // Esta função seria expandida com dados históricos reais
          // Por ora, retorna uma análise básica
          if (!faturaDetalhada?.comparativo_mes_anterior) return null;

          const { variacao_percentual, valor_anterior } = faturaDetalhada.comparativo_mes_anterior;
          const valorAtual = cartoes.reduce((total, c) => total + (c.fatura_atual || 0), 0);

          return {
            tendencia: variacao_percentual > 0 ? 'crescente' : 'decrescente',
            variacao_percentual,
            valor_atual: valorAtual,
            valor_anterior,
            diferenca_absoluta: valorAtual - valor_anterior,
            classificacao: variacao_percentual > 20 ? 'preocupante' : 
                          variacao_percentual > 10 ? 'atencao' : 
                          variacao_percentual > -10 ? 'estavel' : 'melhoria'
          };
        },

        calcularMetasEconomia: () => {
          const { cartoes, faturaDetalhada } = get();
          const totalAtual = cartoes.reduce((total, c) => total + (c.fatura_atual || 0), 0);
          
          if (!faturaDetalhada?.gastos_categoria) return null;

          // Sugerir economia baseada na maior categoria
          const maiorCategoria = faturaDetalhada.gastos_categoria[0];
          if (!maiorCategoria) return null;

          const economiaTarget = maiorCategoria.valor * 0.2; // 20% de redução
          const novoTotal = totalAtual - economiaTarget;

          return {
            categoria_foco: maiorCategoria.categoria,
            valor_atual_categoria: maiorCategoria.valor,
            economia_sugerida: economiaTarget,
            novo_total_estimado: novoTotal,
            percentual_economia: (economiaTarget / totalAtual) * 100,
            prazo_sugerido: 3 // meses
          };
        },

        // Actions para comparações
        compararCartoes: (cartaoId1, cartaoId2) => {
          const { cartoes } = get();
          const cartao1 = cartoes.find(c => c.id === cartaoId1);
          const cartao2 = cartoes.find(c => c.id === cartaoId2);

          if (!cartao1 || !cartao2) return null;

          return {
            cartao1: {
              nome: cartao1.nome,
              utilizacao: cartao1.percentual_limite,
              fatura: cartao1.fatura_atual,
              limite: cartao1.limite
            },
            cartao2: {
              nome: cartao2.nome,
              utilizacao: cartao2.percentual_limite,
              fatura: cartao2.fatura_atual,
              limite: cartao2.limite
            },
            comparacao: {
              maior_utilizacao: cartao1.percentual_limite > cartao2.percentual_limite ? cartao1.nome : cartao2.nome,
              maior_fatura: cartao1.fatura_atual > cartao2.fatura_atual ? cartao1.nome : cartao2.nome,
              maior_limite: cartao1.limite > cartao2.limite ? cartao1.nome : cartao2.nome,
              diferenca_fatura: Math.abs(cartao1.fatura_atual - cartao2.fatura_atual)
            }
          };
        }
      }),
      {
        name: 'cartoes-storage',
        partialize: (state) => ({
          mostrarValores: state.mostrarValores,
          visualizacao: state.visualizacao
        })
      }
    ),
    {
      name: 'cartoes-store'
    }
  )
);
export default useCartoesStore;