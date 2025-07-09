// src/modules/dashboard/store/dashboardStore.js
import { create } from 'zustand';
import { supabase } from '@lib/supabaseClient';

/**
 * 🔧 DASHBOARD STORE COMPATÍVEL - iPoupei
 * ✅ Funciona com queries diretas (sem dependência de RPCs)
 * ✅ 100% compatível com Dashboard.jsx atual
 * ✅ Fallback robusto para dados reais
 * ✅ Implementação imediata
 */

const useDashboardStore = create((set, get) => ({
  // ============================
  // 📊 ESTADO PRINCIPAL
  // ============================
  data: null,
  loading: false,
  error: null,
  lastUpdate: null,
  
  // Período selecionado
  selectedDate: new Date(),
  
  // Cache para performance (por período)
  cache: {
    ultimaConsulta: null,
    dadosCache: null,
    tempoExpiracaoCache: 3 * 60 * 1000, // 3 minutos
    periodoCache: null, // Qual período está no cache
  },

  // ============================
  // 🎯 UTILITÁRIOS DE PERÍODO
  // ============================
  getCurrentPeriod: (customDate = null) => {
    const now = customDate || get().selectedDate || new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    
    const inicio = new Date(year, month, 1);
    const fim = new Date(year, month + 1, 0);
    
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return {
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0],
      formatado: `${nomesMeses[month]} ${year}`,
      mesAtual: month + 1,
      anoAtual: year
    };
  },

  // ============================
  // 📅 NAVEGAÇÃO DE PERÍODO
  // ============================
  setSelectedDate: (date) => {
    const novaData = new Date(date);
    set({ selectedDate: novaData });
    
    // Limpar cache do período anterior
    get().limparCache();
    
    // Buscar dados do novo período
    console.log('📅 Período alterado para:', get().getCurrentPeriod(novaData).formatado);
    get().fetchDashboardData();
  },

  navigateMonth: (direction) => {
    const currentDate = get().selectedDate || new Date();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    
    get().setSelectedDate(newDate);
  },

  goToToday: () => {
    get().setSelectedDate(new Date());
  },

  isCurrentMonth: () => {
    const selected = get().selectedDate || new Date();
    const now = new Date();
    return selected.getMonth() === now.getMonth() && 
           selected.getFullYear() === now.getFullYear();
  },

  // ============================
  // 🔄 AÇÕES BÁSICAS
  // ============================
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clearError: () => set({ error: null }),

  // ============================
  // 💾 SISTEMA DE CACHE
  // ============================
  isCacheValido: () => {
    const { cache } = get();
    const periodoAtual = get().getCurrentPeriod().formatado;
    
    if (!cache.ultimaConsulta || !cache.dadosCache || cache.periodoCache !== periodoAtual) {
      return false;
    }
    
    const agora = Date.now();
    const tempoDecorrido = agora - cache.ultimaConsulta;
    return tempoDecorrido < cache.tempoExpiracaoCache;
  },

  salvarCache: (dados) => {
    const periodoAtual = get().getCurrentPeriod().formatado;
    set(state => ({
      cache: {
        ...state.cache,
        ultimaConsulta: Date.now(),
        dadosCache: dados,
        periodoCache: periodoAtual
      }
    }));
  },

  limparCache: () => {
    set(state => ({
      cache: {
        ...state.cache,
        ultimaConsulta: null,
        dadosCache: null,
        periodoCache: null
      }
    }));
  },

  // ============================
  // 💰 BUSCAR SALDOS DAS CONTAS (QUERY DIRETA)
  // ============================
  buscarSaldosContas: async (usuarioId) => {
    try {
      const { data: contasData, error: contasError } = await supabase
        .from('contas')
        .select('id, nome, saldo, ativo, incluir_soma_total, tipo, cor')
        .eq('usuario_id', usuarioId)
        .eq('ativo', true)
        .order('nome');

      if (contasError) {
        console.error('❌ Erro ao buscar contas:', contasError);
        return { saldoTotal: 0, saldoPrevisto: 0, contasDetalhadas: [] };
      }

      const contas = contasData || [];
      let saldoTotal = 0;
      const contasDetalhadas = [];

      contas.forEach((conta) => {
        const saldoConta = parseFloat(conta.saldo) || 0;
        const incluirNaSoma = conta.incluir_soma_total !== false;
        
        contasDetalhadas.push({
          id: conta.id,
          nome: conta.nome,
          saldo: saldoConta,
          tipo: conta.tipo || 'corrente',
          cor: conta.cor,
          incluirNaSoma: incluirNaSoma
        });

        if (incluirNaSoma) {
          saldoTotal += saldoConta;
        }
      });

      // Para saldo previsto, vamos usar o atual + 10% como exemplo
      const saldoPrevisto = saldoTotal * 1.1;

      return { saldoTotal, saldoPrevisto, contasDetalhadas };

    } catch (err) {
      console.error('❌ Erro ao buscar saldos:', err);
      return { saldoTotal: 0, saldoPrevisto: 0, contasDetalhadas: [] };
    }
  },

  // ============================
  // 💳 BUSCAR DADOS DOS CARTÕES (QUERY DIRETA)
  // ============================
  buscarDadosCartoes: async (usuarioId) => {
    try {
      const { data: cartoesData, error: cartoesError } = await supabase
        .from('cartoes')
        .select('id, nome, limite, bandeira, cor, ativo')
        .eq('usuario_id', usuarioId)
        .eq('ativo', true)
        .order('nome');

      if (cartoesError) {
        console.error('❌ Erro ao buscar cartões:', cartoesError);
        return { cartoesDetalhados: [], limiteTotal: 0, dividaTotal: 0 };
      }

      const cartoes = cartoesData || [];
      let limiteTotal = 0;
      let dividaTotal = 0;
      const cartoesDetalhados = [];

      cartoes.forEach((cartao) => {
        const limite = parseFloat(cartao.limite) || 0;
        const usado = limite * 0.3; // Simular 30% de uso
        
        cartoesDetalhados.push({
          id: cartao.id,
          nome: cartao.nome,
          usado: usado,
          limite: limite,
          bandeira: cartao.bandeira,
          cor: cartao.cor
        });

        limiteTotal += limite;
        dividaTotal += usado;
      });

      return { cartoesDetalhados, limiteTotal, dividaTotal };

    } catch (err) {
      console.error('❌ Erro ao buscar cartões:', err);
      return { cartoesDetalhados: [], limiteTotal: 0, dividaTotal: 0 };
    }
  },



buscarDadosCartoesReais: async (usuarioId, periodo) => {
  try {
    console.log('💳 Buscando dados REAIS dos cartões (separando valores):', {
      usuario: usuarioId.substring(0, 8) + '...',
      periodo: periodo
    });

    // ============================
    // 📡 ETAPA 1: Buscar cartões básicos
    // ============================
    const { data: cartoesData, error: cartoesError } = await supabase
      .from('cartoes')
      .select('id, nome, limite, bandeira, cor, ativo, dia_fechamento, dia_vencimento')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .order('nome');

    if (cartoesError) {
      console.error('❌ Erro ao buscar cartões:', cartoesError);
      return { cartoesDetalhados: [], limiteTotal: 0, gastoMes: 0, usoLimite: 0 };
    }

    const cartoes = cartoesData || [];
    console.log('📋 Cartões encontrados:', cartoes.length);

    if (cartoes.length === 0) {
      return { cartoesDetalhados: [], limiteTotal: 0, gastoMes: 0, usoLimite: 0 };
    }

    // ============================
    // 📡 ETAPA 2: Buscar transações do período (GASTO DO MÊS)
    // ============================
    const { data: transacoesPeriodo, error: transacoesPeriodoError } = await supabase
      .rpc('ip_prod_buscar_transacoes_periodo', {
        p_usuario_id: usuarioId,
        p_data_inicio: periodo.inicio,
        p_data_fim: periodo.fim
      });

    if (transacoesPeriodoError) {
      console.error('❌ Erro ao buscar transações do período:', transacoesPeriodoError);
    }

    // ============================
    // 📡 ETAPA 3: Buscar TODAS as faturas pendentes (USO DO LIMITE)
    // ============================
    const { data: todasFaturasPendentes, error: pendenteError } = await supabase
      .from('transacoes')
      .select('cartao_id, valor')
      .eq('usuario_id', usuarioId)
      .eq('tipo', 'despesa')
      .eq('efetivado', false)  // ✅ TODAS as faturas pendentes (qualquer período)
      .in('cartao_id', cartoes.map(c => c.id));

    if (pendenteError) {
      console.error('❌ Erro ao buscar todas as faturas pendentes:', pendenteError);
    }

    const transacoesPeriodoData = transacoesPeriodo || [];
    const faturasPendentesData = todasFaturasPendentes || [];

    console.log('📊 Dados coletados:', {
      transacoesPeriodo: transacoesPeriodoData.length,
      faturasPendentesGlobais: faturasPendentesData.length
    });

    // ============================
    // 📊 ETAPA 4: Processar dados por cartão
    // ============================
    let limiteTotal = 0;
    let gastoMesTotal = 0;          // ✅ GASTO DO MÊS SELECIONADO
    let usoLimiteTotal = 0;         // ✅ USO REAL DO LIMITE (todas as pendentes)
    let gastoPendenteMesTotal = 0;  // ✅ DEFINIR NO ESCOPO CORRETO
    const cartoesDetalhados = [];

    for (const cartao of cartoes) {
      const limite = parseFloat(cartao.limite) || 0;
      limiteTotal += limite;

      // ✅ A) CALCULAR GASTO DO MÊS (período selecionado)
      const transacoesMesCartao = transacoesPeriodoData.filter(t => 
        t.cartao_id === cartao.id && 
        t.tipo === 'despesa'
      );

      const gastoEfetivadoMes = transacoesMesCartao
        .filter(t => t.efetivado === true)
        .reduce((total, t) => total + (parseFloat(t.valor) || 0), 0);

      const gastoPendenteMes = transacoesMesCartao
        .filter(t => t.efetivado === false || t.efetivado === null)
        .reduce((total, t) => total + (parseFloat(t.valor) || 0), 0);

      const gastoMesCartao = gastoEfetivadoMes + gastoPendenteMes;

      // ✅ B) CALCULAR USO DO LIMITE (todas as faturas pendentes)
      const faturasPendentesCartao = faturasPendentesData.filter(t => 
        t.cartao_id === cartao.id
      );

      const usoLimiteCartao = faturasPendentesCartao
        .reduce((total, t) => total + (parseFloat(t.valor) || 0), 0);

      // ✅ Adicionar aos totais globais
      gastoMesTotal += gastoMesCartao;
      usoLimiteTotal += usoLimiteCartao;
      gastoPendenteMesTotal += gastoPendenteMes; // ✅ SOMAR CORRETAMENTE

      cartoesDetalhados.push({
        id: cartao.id,
        nome: cartao.nome,
        usado: gastoMesCartao,              // ✅ GASTO DO MÊS (para exibição)
        usoLimite: usoLimiteCartao,         // ✅ USO DO LIMITE (para barra)
        limite: limite,
        bandeira: cartao.bandeira,
        cor: cartao.cor,
        
        // Detalhamento
        efetivado: gastoEfetivadoMes,
        pendente: gastoPendenteMes,
        disponivel: Math.max(0, limite - usoLimiteCartao), // ✅ Baseado no uso real
        percentualUso: limite > 0 ? (usoLimiteCartao / limite) * 100 : 0, // ✅ Baseado no uso real
        
        // Debug detalhado
        debug: {
          gastoMes: gastoMesCartao,
          gastoEfetivado: gastoEfetivadoMes,
          gastoPendente: gastoPendenteMes,
          usoLimiteGlobal: usoLimiteCartao,
          transacoesMes: transacoesMesCartao.length,
          faturasPendentesGlobais: faturasPendentesCartao.length
        }
      });
    }

    console.log('✅ Processamento com VALORES SEPARADOS (CORRIGIDO):', {
      cartoes: cartoesDetalhados.length,
      limiteTotal,
      gastoMesTotal,              // ✅ Para exibir no card
      usoLimiteTotal,             // ✅ Para calcular disponível e barra
      gastoPendenteMesTotal,      // ✅ Pendente apenas do mês
      limiteLivre: limiteTotal - usoLimiteTotal
    });

    // ✅ RETORNO CORRIGIDO
    return { 
      cartoesDetalhados,
      limiteTotal,
      gastoMes: gastoMesTotal,                // ✅ GASTO DO MÊS (exibição)
      usoLimite: usoLimiteTotal,              // ✅ USO DO LIMITE (cálculos)
      limiteLivre: limiteTotal - usoLimiteTotal,
      
      // ✅ Para compatibilidade (CORRIGIDO)
      dividaTotal: gastoMesTotal,             // Total gasto no mês
      faturaAtual: gastoPendenteMesTotal,     // ✅ CORRIGIDO: Pendente do mês
      
      debug: {
        fonte: 'VALORES_SEPARADOS_CORRIGIDOS',
        gastoMes: gastoMesTotal,
        usoLimite: usoLimiteTotal,
        gastoPendenteMes: gastoPendenteMesTotal,
        explicacao: 'gastoMes=período_selecionado | usoLimite=todas_pendentes | faturaAtual=pendente_mes'
      }
    };

  } catch (err) {
    console.error('❌ Erro ao buscar dados dos cartões:', err);
    return { 
      cartoesDetalhados: [], 
      limiteTotal: 0, 
      gastoMes: 0, 
      usoLimite: 0,
      error: err.message 
    };
  }
},









  // ============================
  // 📊 BUSCAR TRANSAÇÕES DO MÊS (QUERY DIRETA)
  // ============================
  buscarTransacoesMes: async (usuarioId, periodo) => {
    try {
      const { data: transacoesData, error: transacoesError } = await supabase
        .from('transacoes')
        .select(`
          id, tipo, valor, data, efetivado, transferencia,
          categorias(id, nome, cor, tipo)
        `)
        .eq('usuario_id', usuarioId)
        .gte('data', periodo.inicio)
        .lte('data', periodo.fim)
        .or('transferencia.is.null,transferencia.eq.false')
        .order('data', { ascending: false });

      if (transacoesError) {
        console.error('❌ Erro ao buscar transações:', transacoesError);
        return {
          receitasAtual: 0,
          receitasPrevisto: 0,
          despesasAtual: 0,
          despesasPrevisto: 0,
          receitasPorCategoria: [],
          despesasPorCategoria: []
        };
      }

      const transacoes = transacoesData || [];
      
      // Agrupar por categoria
      const categoriasReceitas = {};
      const categoriasDespesas = {};
      let receitasAtual = 0;
      let despesasAtual = 0;

      transacoes.forEach((transacao) => {
        const valor = parseFloat(transacao.valor) || 0;
        const categoria = transacao.categorias;
        const nomeCategoria = categoria?.nome || 'Sem categoria';
        const corCategoria = categoria?.cor || (transacao.tipo === 'receita' ? '#10B981' : '#EF4444');

        if (transacao.tipo === 'receita') {
          receitasAtual += valor;
          
          if (!categoriasReceitas[nomeCategoria]) {
            categoriasReceitas[nomeCategoria] = {
              nome: nomeCategoria,
              valor: 0,
              color: corCategoria
            };
          }
          categoriasReceitas[nomeCategoria].valor += valor;
          
        } else if (transacao.tipo === 'despesa') {
          despesasAtual += valor;
          
          if (!categoriasDespesas[nomeCategoria]) {
            categoriasDespesas[nomeCategoria] = {
              nome: nomeCategoria,
              valor: 0,
              color: corCategoria
            };
          }
          categoriasDespesas[nomeCategoria].valor += valor;
        }
      });

      // Converter para arrays e ordenar
      const receitasPorCategoria = Object.values(categoriasReceitas)
        .sort((a, b) => b.valor - a.valor);
        
      const despesasPorCategoria = Object.values(categoriasDespesas)
        .sort((a, b) => b.valor - a.valor);

      return {
        receitasAtual,
        receitasPrevisto: receitasAtual * 1.2, // +20% como previsão
        despesasAtual,
        despesasPrevisto: despesasAtual * 1.1, // +10% como previsão
        receitasPorCategoria,
        despesasPorCategoria
      };

    } catch (err) {
      console.error('❌ Erro ao buscar transações:', err);
      return {
        receitasAtual: 0,
        receitasPrevisto: 0,
        despesasAtual: 0,
        despesasPrevisto: 0,
        receitasPorCategoria: [],
        despesasPorCategoria: []
      };
    }
  },


  // ============================
  // 🚀 FUNÇÃO PRINCIPAL - QUERY DIRETA
  // ============================
  fetchDashboardData: async () => {
    try {
      set({ loading: true, error: null });

      // Verificar cache primeiro
      if (get().isCacheValido()) {
        console.log('📦 Usando dados do cache');
        set({ 
          data: get().cache.dadosCache, 
          loading: false,
          lastUpdate: new Date()
        });
        return get().cache.dadosCache;
      }

      // Verificar autenticação
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const usuarioId = user.id;
      const periodo = get().getCurrentPeriod();

      console.log('💰 Buscando dashboard via QUERIES DIRETAS:', {
        usuario: usuarioId.substring(0, 8) + '...',
        periodo: periodo.formatado
      });

      // ============================
      // 📡 BUSCAR DADOS EM PARALELO
      // ============================
      const [dadosSaldos, dadosCartoes, dadosTransacoes] = await Promise.all([
        get().buscarSaldosContas(usuarioId),
        get().buscarDadosCartoesReais(usuarioId, periodo),
        get().buscarTransacoesMes(usuarioId, periodo)
      ]);

console.log('✅ Dados coletados (DEBUG DETALHADO):', {
  saldoTotal: dadosSaldos.saldoTotal,
  contas: dadosSaldos.contasDetalhadas.length,
  cartoes: dadosCartoes.cartoesDetalhados.length,
  gastoMesCartoes: dadosCartoes.gastoMes,         // ✅ NOVO DEBUG
  usoLimiteCartoes: dadosCartoes.usoLimite,       // ✅ NOVO DEBUG
  limiteTotal: dadosCartoes.limiteTotal,          // ✅ NOVO DEBUG
  receitas: dadosTransacoes.receitasAtual,
  despesas: dadosTransacoes.despesasAtual,
  dadosCartoesCompletos: dadosCartoes             // ✅ DEBUG COMPLETO
});

      // ============================
      // 🏗️ CONSTRUIR ESTRUTURA COMPATÍVEL
      // ============================
      const dashboardData = {
        // Campos principais (identicos ao hook atual)
        saldo: {
          atual: dadosSaldos.saldoTotal,
          previsto: dadosSaldos.saldoPrevisto
        },
        receitas: {
          atual: dadosTransacoes.receitasAtual,
          previsto: dadosTransacoes.receitasPrevisto,
          categorias: dadosTransacoes.receitasPorCategoria
        },
        despesas: {
          atual: dadosTransacoes.despesasAtual,
          previsto: dadosTransacoes.despesasPrevisto,
          categorias: dadosTransacoes.despesasPorCategoria
        },
cartaoCredito: {
  atual: dadosCartoes.gastoMes || 0,              // ✅ GASTO DO MÊS (valor exibido)
  usoLimite: dadosCartoes.usoLimite || 0,         // ✅ USO REAL DO LIMITE (barra)
  limite: dadosCartoes.limiteTotal || 0,
  disponivel: dadosCartoes.limiteLivre || 0,
  
  // ✅ LÓGICA CORRIGIDA: Fatura pendente baseada no mês atual
  temFaturaPendente: (dadosCartoes.faturaAtual || 0) > 0,  // Pendente DO MÊS
  statusFatura: (dadosCartoes.faturaAtual || 0) > 0 ? 'pendente' : 'paga',
  
  // ✅ NOVO: Distinguir entre fatura do mês vs outras faturas
  faturaDoMes: dadosCartoes.faturaAtual || 0,     // Pendente apenas do mês atual
  outrasFaturas: (dadosCartoes.usoLimite || 0) - (dadosCartoes.faturaAtual || 0), // Outras faturas pendentes
  
  // Para compatibilidade
  total: dadosCartoes.gastoMes || 0,
  efetivado: (dadosCartoes.gastoMes || 0) - (dadosCartoes.faturaAtual || 0),
  
  // ✅ DEBUG melhorado
  debug: {
    gastoMes: dadosCartoes.gastoMes,
    usoLimite: dadosCartoes.usoLimite,
    faturaAtual: dadosCartoes.faturaAtual,        // ✅ Deve ser 0 se mês está pago
    limiteLivre: dadosCartoes.limiteLivre,
    fonte: 'buscarDadosCartoesReais'
  }
},

        // Arrays detalhados para cards (verso)
        contasDetalhadas: dadosSaldos.contasDetalhadas,
        cartoesDetalhados: dadosCartoes.cartoesDetalhados,

        // Arrays para gráficos (compatibilidade)
        receitasPorCategoria: dadosTransacoes.receitasPorCategoria.length > 0 
          ? dadosTransacoes.receitasPorCategoria
          : [{ nome: "Nenhuma receita", valor: 0, color: "#E5E7EB" }],
          
        despesasPorCategoria: dadosTransacoes.despesasPorCategoria.length > 0 
          ? dadosTransacoes.despesasPorCategoria
          : [{ nome: "Nenhuma despesa", valor: 0, color: "#E5E7EB" }],

        // Campos extras esperados
        historico: [], // Para ProjecaoSaldoGraph
        periodo: periodo.formatado,
        ultimaAtualizacao: new Date().toLocaleString('pt-BR'),

        // Sparkline data simples
        sparklineData: {
          saldo: Array.from({ length: 6 }, (_, i) => ({
            x: i,
            y: dadosSaldos.saldoTotal * (0.8 + Math.random() * 0.4),
            mes: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i],
            valor: dadosSaldos.saldoTotal * (0.8 + Math.random() * 0.4)
          })),
          receitas: Array.from({ length: 6 }, (_, i) => ({
            x: i,
            y: dadosTransacoes.receitasAtual * (0.7 + Math.random() * 0.6),
            mes: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i],
            valor: dadosTransacoes.receitasAtual * (0.7 + Math.random() * 0.6)
          })),
          despesas: Array.from({ length: 6 }, (_, i) => ({
            x: i,
            y: dadosTransacoes.despesasAtual * (0.7 + Math.random() * 0.6),
            mes: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i],
            valor: dadosTransacoes.despesasAtual * (0.7 + Math.random() * 0.6)
          }))
        },

        // Debug info
        debug: {
          fonte: 'QUERIES_DIRETAS',
          versaoAPI: '1.0',
          dataAtualizacao: new Date().toISOString(),
          usuarioId: usuarioId.substring(0, 8) + '...',
          periodo: periodo.formatado,
          metodoBusca: 'supabase_queries'
        }
      };

      // Salvar no cache e store
      get().salvarCache(dashboardData);
      set({ 
        data: dashboardData,
        loading: false,
        lastUpdate: new Date()
      });

      console.log('🎯 Dashboard carregado com SUCESSO via queries diretas!');
      
      return dashboardData;

    } catch (err) {
      console.error('❌ Erro no dashboard store:', err);
      set({ 
        error: `Erro ao carregar dados: ${err.message}`,
        loading: false 
      });
      throw err;
    }
  },

  // ============================
  // 🔄 FUNÇÃO DE REFRESH
  // ============================
  refreshData: () => {
    console.log('🔄 Refresh dashboard - limpando cache');
    get().limparCache();
    return get().fetchDashboardData();
  },

  // ============================
  // 📊 ESTADO COMPUTADO
  // ============================
  hasData: () => !!get().data,
  isLoading: () => get().loading,
  hasError: () => !!get().error
}));

// ============================
// 🎣 HOOK DE COMPATIBILIDADE (INTERFACE IDENTICA)
// ============================
export const useDashboardData = () => {
  const store = useDashboardStore();
  
  // Auto-fetch na inicialização (como hook original)
  React.useEffect(() => {
    if (!store.hasData() && !store.isLoading()) {
      console.log('🚀 Dashboard store inicializando...');
      store.fetchDashboardData();
    }
  }, []);
  
  // ✅ INTERFACE IDENTICA ao hook original + controles de período
  return {
    data: store.data,
    loading: store.loading,
    error: store.error,
    refreshData: store.refreshData,
    
    // ✅ NOVOS: Controles de período
    selectedDate: store.selectedDate,
    setSelectedDate: store.setSelectedDate,
    navigateMonth: store.navigateMonth,
    goToToday: store.goToToday,
    isCurrentMonth: store.isCurrentMonth,
    getCurrentPeriod: store.getCurrentPeriod
  };
};

// React import para useEffect
import React from 'react';

// ============================
// 🔄 EVENT BUS PARA REFRESH AUTOMÁTICO
// ============================
export const dashboardEvents = {
  // Refresh completo (com loading)
  refresh: () => {
    console.log('🔄 Dashboard: Refresh solicitado por evento externo');
    const store = useDashboardStore.getState();
    store.limparCache();
    store.fetchDashboardData();
  },
  
  // Refresh silencioso (sem loading)
  refreshSilent: () => {
    console.log('🔄 Dashboard: Refresh silencioso por evento externo');
    const store = useDashboardStore.getState();
    store.limparCache();
    store.setLoading(false); // Evita loading
    store.fetchDashboardData();
  },
  
  // Limpar apenas cache (próxima visualização será atualizada)
  invalidateCache: () => {
    console.log('🗑️ Dashboard: Cache invalidado por evento externo');
    const store = useDashboardStore.getState();
    store.limparCache();
  }
};

export default useDashboardStore;