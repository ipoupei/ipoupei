// src/modules/dashboard/store/dashboardStore.js
import { create } from 'zustand';
import { supabase } from '@lib/supabaseClient';
import React from 'react';

/**
 * 🔧 DASHBOARD STORE REFATORADO COMPLETO - iPoupei
 * ✅ Data correta para transações de cartão (fatura_vencimento)
 * ✅ Separação correta entre efetivadas vs pendentes
 * ✅ Inclusão de TODAS as despesas (cartão + dinheiro)
 * ✅ Exclusão correta de transferências
 * ✅ Performance otimizada com cache
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
  realtimeChannel: null,
  realtimeSubscribed: false,
  debounceTimer: null,
  
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
  // 💰 BUSCAR SALDOS DAS CONTAS
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

      // Para saldo previsto, usar o atual (sem inflacionar artificialmente)
      const saldoPrevisto = saldoTotal;

      return { saldoTotal, saldoPrevisto, contasDetalhadas };

    } catch (err) {
      console.error('❌ Erro ao buscar saldos:', err);
      return { saldoTotal: 0, saldoPrevisto: 0, contasDetalhadas: [] };
    }
  },

  // ============================
  // 💳 BUSCAR DADOS DOS CARTÕES (CORRIGIDO)
  // ============================
  buscarDadosCartoesReais: async (usuarioId, periodo) => {
    try {
      console.log('💳 Buscando dados REAIS dos cartões (data correta):', {
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
      // 📡 ETAPA 2: Buscar transações do período (FATURA_VENCIMENTO)
      // ============================
      const { data: transacoesPeriodo, error: transacoesPeriodoError } = await supabase
        .from('transacoes')
        .select('cartao_id, valor, efetivado, fatura_vencimento')
        .eq('usuario_id', usuarioId)
        .eq('tipo', 'despesa')
        .not('cartao_id', 'is', null)
        .gte('fatura_vencimento', periodo.inicio)
        .lte('fatura_vencimento', periodo.fim);

      if (transacoesPeriodoError) {
        console.error('❌ Erro ao buscar transações do período (cartão):', transacoesPeriodoError);
      }

      // ============================
      // 📡 ETAPA 3: Buscar TODAS as faturas pendentes (USO DO LIMITE)
      // ============================
      const { data: todasFaturasPendentes, error: pendenteError } = await supabase
        .from('transacoes')
        .select('cartao_id, valor')
        .eq('usuario_id', usuarioId)
        .eq('tipo', 'despesa')
        .eq('efetivado', false)
        .in('cartao_id', cartoes.map(c => c.id));

      if (pendenteError) {
        console.error('❌ Erro ao buscar todas as faturas pendentes:', pendenteError);
      }

      const transacoesPeriodoData = transacoesPeriodo || [];
      const faturasPendentesData = todasFaturasPendentes || [];

      console.log('📊 Dados coletados (cartão):', {
        transacoesPeriodo: transacoesPeriodoData.length,
        faturasPendentesGlobais: faturasPendentesData.length
      });

      // ============================
      // 📊 ETAPA 4: Processar dados por cartão
      // ============================
      let limiteTotal = 0;
      let gastoMesTotal = 0;
      let usoLimiteTotal = 0;
      let gastoPendenteMesTotal = 0;
      const cartoesDetalhados = [];

      for (const cartao of cartoes) {
        const limite = parseFloat(cartao.limite) || 0;
        limiteTotal += limite;

        // ✅ A) CALCULAR GASTO DO MÊS (período selecionado com fatura_vencimento)
        const transacoesMesCartao = transacoesPeriodoData.filter(t => 
          t.cartao_id === cartao.id
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
        gastoPendenteMesTotal += gastoPendenteMes;

        cartoesDetalhados.push({
          id: cartao.id,
          nome: cartao.nome,
          usado: gastoMesCartao,
          usoLimite: usoLimiteCartao,
          limite: limite,
          bandeira: cartao.bandeira,
          cor: cartao.cor,
          
          // Detalhamento
          efetivado: gastoEfetivadoMes,
          pendente: gastoPendenteMes,
          disponivel: Math.max(0, limite - usoLimiteCartao),
          percentualUso: limite > 0 ? (usoLimiteCartao / limite) * 100 : 0,
          
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

      console.log('✅ Processamento cartões (data correta):', {
        cartoes: cartoesDetalhados.length,
        limiteTotal,
        gastoMesTotal,
        usoLimiteTotal,
        gastoPendenteMesTotal,
        limiteLivre: limiteTotal - usoLimiteTotal
      });

      return { 
        cartoesDetalhados,
        limiteTotal,
        gastoMes: gastoMesTotal,
        usoLimite: usoLimiteTotal,
        limiteLivre: limiteTotal - usoLimiteTotal,
        dividaTotal: gastoMesTotal,
        faturaAtual: gastoPendenteMesTotal,
        
        debug: {
          fonte: 'CARTAO_DATA_CORRETA_FATURA_VENCIMENTO',
          gastoMes: gastoMesTotal,
          usoLimite: usoLimiteTotal,
          gastoPendenteMes: gastoPendenteMesTotal,
          explicacao: 'gastoMes=fatura_vencimento_periodo | usoLimite=todas_pendentes'
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
  // 📊 BUSCAR TRANSAÇÕES DO MÊS (CORRIGIDO COMPLETO)
  // ============================
  buscarTransacoesMes: async (usuarioId, periodo) => {
    try {
      console.log('📊 Buscando transações do mês (data correta para cartão):', {
        usuario: usuarioId.substring(0, 8) + '...',
        periodo: periodo.formatado
      });

      // ============================
      // 📡 BUSCAR EM DUAS ETAPAS: CARTÃO + OUTRAS
      // ============================
      
      // 1️⃣ TRANSAÇÕES DE CARTÃO (usar fatura_vencimento)
      const { data: transacoesCartao, error: errorCartao } = await supabase
        .from('transacoes')
        .select(`
          id, tipo, valor, data, efetivado, transferencia, cartao_id, fatura_vencimento,
          categorias(id, nome, cor, tipo)
        `)
        .eq('usuario_id', usuarioId)
        .or('transferencia.is.null,transferencia.eq.false')
        .not('cartao_id', 'is', null) // ✅ HAS cartao_id
        .gte('fatura_vencimento', periodo.inicio)
        .lte('fatura_vencimento', periodo.fim)
        .order('fatura_vencimento', { ascending: false });

      // 2️⃣ TRANSAÇÕES NORMAIS (usar data)
      const { data: transacoesNormais, error: errorNormais } = await supabase
        .from('transacoes')
        .select(`
          id, tipo, valor, data, efetivado, transferencia, cartao_id, fatura_vencimento,
          categorias(id, nome, cor, tipo)
        `)
        .eq('usuario_id', usuarioId)
        .or('transferencia.is.null,transferencia.eq.false')
        .is('cartao_id', null) // ✅ NO cartao_id
        .gte('data', periodo.inicio)
        .lte('data', periodo.fim)
        .order('data', { ascending: false });

      // ============================
      // 🔍 VERIFICAR ERROS E COMBINAR RESULTADOS
      // ============================
      if (errorCartao) {
        console.error('❌ Erro ao buscar transações de cartão:', errorCartao);
      }
      
      if (errorNormais) {
        console.error('❌ Erro ao buscar transações normais:', errorNormais);
      }

      // ✅ Retorno em caso de erro
      if (errorCartao && errorNormais) {
        console.error('❌ Erro ao buscar ambos os tipos de transação');
        return {
          receitasAtual: 0,
          receitasPrevisto: 0,
          despesasAtual: 0,
          despesasPrevisto: 0,
          receitasPorCategoria: [],
          despesasPorCategoria: []
        };
      }

      // Combinar resultados
      const transacoesData = [
        ...(transacoesCartao || []),
        ...(transacoesNormais || [])
      ];

      console.log('📋 Transações encontradas:', {
        cartao: (transacoesCartao || []).length,
        normais: (transacoesNormais || []).length,
        total: transacoesData.length
      });

      // ============================
      // 🧮 SEPARAR EFETIVADAS vs PENDENTES (CORRIGIDO)
      // ============================
      const categoriasReceitas = {};
      const categoriasDespesas = {};
      
      let receitasEfetivadas = 0;    // ✅ JÁ RECEBIDAS
      let receitasPendentes = 0;     // ✅ A RECEBER
      let despesasEfetivadas = 0;    // ✅ JÁ GASTAS  
      let despesasPendentes = 0;     // ✅ PENDENTES

      const transacoes = transacoesData;

      transacoes.forEach((transacao) => {
        const valor = parseFloat(transacao.valor) || 0;
        const categoria = transacao.categorias;
        const nomeCategoria = categoria?.nome || 'Sem categoria';
        const corCategoria = categoria?.cor || (transacao.tipo === 'receita' ? '#10B981' : '#EF4444');
        const isEfetivada = transacao.efetivado === true;
        const isCartao = !!transacao.cartao_id;

        // ✅ LOG DETALHADO PARA DEBUG
        const dataRelevante = isCartao ? transacao.fatura_vencimento : transacao.data;
        if (isCartao) {
          console.log(`💳 Transação de cartão: ${transacao.tipo} - R$ ${valor} - Efetivada: ${isEfetivada} - Data: ${dataRelevante}`);
        }

        if (transacao.tipo === 'receita') {
          // ✅ RECEITAS: todas (dinheiro + cartão)
          if (isEfetivada) {
            receitasEfetivadas += valor;
          } else {
            receitasPendentes += valor;
          }
          
          // Agrupar por categoria (todas as receitas)
          if (!categoriasReceitas[nomeCategoria]) {
            categoriasReceitas[nomeCategoria] = {
              nome: nomeCategoria,
              valor: 0,
              color: corCategoria
            };
          }
          categoriasReceitas[nomeCategoria].valor += valor;
          
        } else if (transacao.tipo === 'despesa') {
          // ✅ DESPESAS: todas (dinheiro + cartão)
          if (isEfetivada) {
            despesasEfetivadas += valor;
          } else {
            despesasPendentes += valor;
          }
          
          // Agrupar por categoria (todas as despesas)
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

      // ============================
      // 🎯 CALCULAR TOTAIS CORRETOS
      // ============================
      const receitasAtual = receitasEfetivadas;              // ✅ JÁ RECEBIDAS
      const receitasPrevisto = receitasEfetivadas + receitasPendentes; // ✅ TOTAL

      const despesasAtual = despesasEfetivadas;              // ✅ JÁ GASTAS
      const despesasPrevisto = despesasEfetivadas + despesasPendentes; // ✅ TOTAL

      // Converter para arrays e ordenar
      const receitasPorCategoria = Object.values(categoriasReceitas)
        .sort((a, b) => b.valor - a.valor);
        
      const despesasPorCategoria = Object.values(categoriasDespesas)
        .sort((a, b) => b.valor - a.valor);

      // ============================
      // 📊 LOG DE VERIFICAÇÃO DETALHADO
      // ============================
      console.log('✅ VALORES CORRIGIDOS CALCULADOS (incluindo cartão com data correta):');
      console.log('💚 RECEITAS:');
      console.log(`   • Efetivadas (já recebidas): R$ ${receitasEfetivadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   • Pendentes (a receber): R$ ${receitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   • Total previsto: R$ ${receitasPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log('💸 DESPESAS (incluindo cartão com data correta):');
      console.log(`   • Efetivadas (já gastas): R$ ${despesasEfetivadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   • Pendentes: R$ ${despesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   • Total previsto: R$ ${despesasPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

      // ✅ Contagem por tipo
      const transacoesCartaoCount = (transacoesCartao || []).length;
      const transacoesNormaisCount = (transacoesNormais || []).length;
      
      console.log('📊 BREAKDOWN POR TIPO:');
      console.log(`   • Transações de cartão: ${transacoesCartaoCount}`);
      console.log(`   • Transações dinheiro: ${transacoesNormaisCount}`);
      console.log(`   • Total processadas: ${transacoes.length}`);

      return {
        // ✅ VALORES CORRETOS
        receitasAtual,        // JÁ RECEBIDAS
        receitasPrevisto,     // TOTAL (efetivadas + pendentes)
        despesasAtual,        // JÁ GASTAS
        despesasPrevisto,     // TOTAL (efetivadas + pendentes)
        
        // Arrays para gráficos
        receitasPorCategoria,
        despesasPorCategoria,
        
        // ✅ DADOS EXTRAS PARA DEBUG
        debug: {
          receitasEfetivadas,
          receitasPendentes,
          despesasEfetivadas,
          despesasPendentes,
          totalTransacoes: transacoes.length,
          transacoesCartao: transacoesCartaoCount,
          transacoesDinheiro: transacoesNormaisCount,
          fonte: 'buscarTransacoesMes_DATA_CORRETA_CARTAO_COMPLETA'
        }
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
  // 🚀 FUNÇÃO PRINCIPAL - REFATORADA
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

      console.log('💰 Buscando dashboard REFATORADO COMPLETO:', {
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

      console.log('✅ Dados coletados REFATORADOS:', {
        saldoTotal: dadosSaldos.saldoTotal,
        contas: dadosSaldos.contasDetalhadas.length,
        cartoes: dadosCartoes.cartoesDetalhados.length,
        gastoMesCartoes: dadosCartoes.gastoMes,
        usoLimiteCartoes: dadosCartoes.usoLimite,
        limiteTotal: dadosCartoes.limiteTotal,
        receitasAtual: dadosTransacoes.receitasAtual,
        despesasAtual: dadosTransacoes.despesasAtual,
        debugTransacoes: dadosTransacoes.debug
      });

      // ============================
      // 🏗️ CONSTRUIR ESTRUTURA FINAL
      // ============================
      const dashboardData = {
        // Campos principais
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
          atual: dadosCartoes.gastoMes || 0,
          usoLimite: dadosCartoes.usoLimite || 0,
          limite: dadosCartoes.limiteTotal || 0,
          disponivel: dadosCartoes.limiteLivre || 0,
          
          // ✅ LÓGICA CORRIGIDA
          temFaturaPendente: (dadosCartoes.faturaAtual || 0) > 0,
          statusFatura: (dadosCartoes.faturaAtual || 0) > 0 ? 'pendente' : 'paga',
          
          // ✅ NOVO: Separação clara
          faturaDoMes: dadosCartoes.faturaAtual || 0,
          outrasFaturas: (dadosCartoes.usoLimite || 0) - (dadosCartoes.faturaAtual || 0),
          
          // Para compatibilidade
          total: dadosCartoes.gastoMes || 0,
          efetivado: (dadosCartoes.gastoMes || 0) - (dadosCartoes.faturaAtual || 0),
          
          // ✅ DEBUG melhorado
          debug: {
            gastoMes: dadosCartoes.gastoMes,
            usoLimite: dadosCartoes.usoLimite,
            faturaAtual: dadosCartoes.faturaAtual,
            limiteLivre: dadosCartoes.limiteLivre,
            fonte: 'REFATORADO_DATA_CORRETA'
          }
        },

        // Arrays detalhados
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
          fonte: 'DASHBOARD_REFATORADO_COMPLETO',
          versaoAPI: '2.0',
          dataAtualizacao: new Date().toISOString(),
          usuarioId: usuarioId.substring(0, 8) + '...',
          periodo: periodo.formatado,
          metodoBusca: 'queries_diretas_data_correta',
          transacoesDebug: dadosTransacoes.debug,
          cartoesDebug: dadosCartoes.debug
        }
      };

      // Salvar no cache e store
      get().salvarCache(dashboardData);
      set({ 
        data: dashboardData,
        loading: false,
        lastUpdate: new Date()
      });

      console.log('🎯 Dashboard REFATORADO carregado com SUCESSO!');
      console.log('📊 Resumo final:', {
        receitas: `R$ ${dadosTransacoes.receitasAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        despesas: `R$ ${dadosTransacoes.despesasAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        saldo: `R$ ${dadosSaldos.saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        cartoes: `R$ ${dadosCartoes.gastoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });
      
      return dashboardData;

    } catch (err) {
      console.error('❌ Erro no dashboard store refatorado:', err);
      set({ 
        error: `Erro ao carregar dados: ${err.message}`,
        loading: false 
      });
      throw err;
    }
  },

  // ============================
  // 📡 REAL-TIME E REFRESH
  // ============================
  setupRealtimeListeners: () => {
    const { realtimeSubscribed } = get();
    if (realtimeSubscribed) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.id) return;

      console.log('📡 Configurando Dashboard Real-time REFATORADO para:', user.email);

      const channel = supabase
        .channel(`dashboard_refatorado_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transacoes',
            filter: `usuario_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 DASHBOARD: Transação alterada (refatorado):', payload.eventType);
            // ✅ Delay para triggers processarem
            setTimeout(() => get().refreshData(), 1200);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contas',
            filter: `usuario_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 DASHBOARD: Conta alterada (refatorado):', payload.eventType);
            setTimeout(() => get().refreshData(), 800);
          }
        )
        .subscribe((status) => {
          console.log('📡 Dashboard Real-time status (refatorado):', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Dashboard listeners REFATORADOS ATIVOS!');
            set({ realtimeChannel: channel, realtimeSubscribed: true });
          }
        });
    });
  },

  debouncedRefresh: () => {
    const state = get();
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    
    const timer = setTimeout(() => {
      console.log('🔄 Dashboard: Auto-refresh refatorado por mudança');
      get().refreshData();
    }, 1500);
    
    set({ debounceTimer: timer });
  },

  refreshData: () => {
    console.log('🔄 Refresh dashboard REFATORADO - limpando cache');
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
// 🎣 HOOK DE COMPATIBILIDADE (REFATORADO)
// ============================
export const useDashboardData = () => {
  const store = useDashboardStore();
  
  // Auto-fetch na inicialização
  React.useEffect(() => {
    if (!store.hasData() && !store.isLoading()) {
      console.log('🚀 Dashboard store REFATORADO inicializando...');
      store.fetchDashboardData();
    }
    
    // ✅ Setup listeners real-time
    store.setupRealtimeListeners();
    
    // ✅ Cleanup
    return () => {
      if (store.realtimeChannel) {
        console.log('🧹 Limpando canal real-time do dashboard');
        supabase.removeChannel(store.realtimeChannel);
      }
      if (store.debounceTimer) {
        clearTimeout(store.debounceTimer);
      }
    };
  }, []);
  
  // ✅ Interface compatível
  return {
    data: store.data,
    loading: store.loading,
    error: store.error,
    refreshData: store.refreshData,
    
    // ✅ Controles de período
    selectedDate: store.selectedDate,
    setSelectedDate: store.setSelectedDate,
    navigateMonth: store.navigateMonth,
    goToToday: store.goToToday,
    isCurrentMonth: store.isCurrentMonth,
    getCurrentPeriod: store.getCurrentPeriod
  };
};

// ============================
// 🔄 EVENT BUS REFATORADO
// ============================
export const dashboardEvents = {
  // Refresh completo (com loading)
  refresh: () => {
    console.log('🔄 Dashboard: Refresh solicitado por evento externo (refatorado)');
    const store = useDashboardStore.getState();
    store.limparCache();
    store.fetchDashboardData();
  },
  
  // Refresh silencioso (sem loading)
  refreshSilent: () => {
    console.log('🔄 Dashboard: Refresh silencioso por evento externo (refatorado)');
    const store = useDashboardStore.getState();
    store.limparCache();
    store.setLoading(false);
    store.fetchDashboardData();
  },
  
  // Limpar apenas cache
  invalidateCache: () => {
    console.log('🗑️ Dashboard: Cache invalidado por evento externo (refatorado)');
    const store = useDashboardStore.getState();
    store.limparCache();
  },

  // ✅ NOVO: Refresh após mudanças em transações
  refreshAfterTransaction: () => {
    console.log('💳 Dashboard: Refresh após mudança em transação');
    const store = useDashboardStore.getState();
    store.limparCache();
    // Delay maior para garantir que triggers processaram
    setTimeout(() => store.fetchDashboardData(), 2000);
  }
};

export default useDashboardStore;