// src/hooks/useDashboardData.js - RPC DIRETO SEM LOOPS
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@/modules/auth/hooks/useAuth';

/**
 * Hook para dashboard usando RPC SEM DEPENDÊNCIAS PROBLEMÁTICAS
 * ✅ Sem usePeriodo (estava causando loops)
 * ✅ Período fixo por enquanto
 * ✅ RPC direto e simples
 */
const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useAuth();
  const isFetching = useRef(false);

  // ✅ PERÍODO FIXO por enquanto (dezembro 2024)
  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const inicio = new Date(year, month, 1);
    const fim = new Date(year, month + 1, 0);
    
    return {
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0],
      formatado: inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    };
  };

  // ✅ Função para buscar dados via RPC
  const fetchDashboardData = async () => {
    if (!isAuthenticated || !user?.id || isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);

      const usuarioId = user.id;
      const periodo = getCurrentPeriod();

      console.log('📊 Buscando dashboard via RPC:', {
        usuario: usuarioId,
        periodo: periodo.formatado,
        dataInicio: periodo.inicio,
        dataFim: periodo.fim
      });

      // ✅ Buscar dados básicos via RPC (removendo função problemática)
      const results = await Promise.allSettled([
        // 1. Saldo atual
        supabase.rpc('gpt_saldo_atual', { usuario: usuarioId }),
        
        // 2. Receitas do mês
        supabase.rpc('gpt_receitas_efetivadas_mes', { 
          usuario: usuarioId, 
          data_inicio: periodo.inicio, 
          data_fim: periodo.fim 
        }),
        
        // 3. Despesas do mês
        supabase.rpc('gpt_despesas_efetivadas_mes', { 
          usuario: usuarioId, 
          data_inicio: periodo.inicio, 
          data_fim: periodo.fim 
        }),
        
        // 4. Contas detalhadas
        supabase.rpc('obter_saldos_por_conta', { 
          p_usuario_id: usuarioId, 
          p_incluir_inativas: false 
        }),
        
        // 5. Cartões via query direta (substituindo RPC problemática)
        supabase
          .from('cartoes')
          .select('id, nome, limite, bandeira, cor, ativo')
          .eq('usuario_id', usuarioId)
          .eq('ativo', true)
      ]);

      // ✅ Processar resultados
      const [saldoResult, receitasResult, despesasResult, contasResult, cartoesResult] = results;

      const saldoAtual = saldoResult.status === 'fulfilled' && !saldoResult.value.error 
        ? Number(saldoResult.value.data) || 0 : 0;
      
      const receitasAtual = receitasResult.status === 'fulfilled' && !receitasResult.value.error 
        ? Number(receitasResult.value.data) || 0 : 0;
      
      const despesasAtual = despesasResult.status === 'fulfilled' && !despesasResult.value.error 
        ? Number(despesasResult.value.data) || 0 : 0;

      const contasDetalhadas = contasResult.status === 'fulfilled' && !contasResult.value.error 
        ? contasResult.value.data || [] : [];

      const cartoesData = cartoesResult.status === 'fulfilled' && !cartoesResult.value.error 
        ? cartoesResult.value.data || [] : [];

      // ✅ Estruturar dados finais
      const dashboardData = {
        saldo: {
          atual: saldoAtual,
          previsto: saldoAtual + (receitasAtual - despesasAtual)
        },
        receitas: {
          atual: receitasAtual,
          previsto: receitasAtual * 1.1,
          categorias: [] // TODO: implementar depois
        },
        despesas: {
          atual: despesasAtual,
          previsto: despesasAtual * 1.05,
          categorias: [] // TODO: implementar depois
        },
        cartaoCredito: {
          atual: cartoesData.reduce((acc, cartao) => acc + (cartao.limite * 0.3), 0), // Simula 30% usado
          limite: cartoesData.reduce((acc, cartao) => acc + (cartao.limite || 0), 0)
        },
        contasDetalhadas: contasDetalhadas.map(conta => ({
          nome: conta.conta_nome || 'Conta',
          saldo: conta.saldo_atual || 0,
          tipo: conta.conta_tipo || 'corrente'
        })),
        cartoesDetalhados: cartoesData.map(cartao => ({
          nome: cartao.nome || 'Cartão',
          usado: (cartao.limite || 0) * 0.3, // Simula 30% usado
          limite: cartao.limite || 0
        })),
        receitasPorCategoria: [
          { nome: "Sem dados", valor: 0, color: "#E5E7EB" }
        ],
        despesasPorCategoria: [
          { nome: "Sem dados", valor: 0, color: "#E5E7EB" }
        ],
        historico: [],
        periodo: periodo.formatado,
        ultimaAtualizacao: new Date().toLocaleString('pt-BR')
      };

      setData(dashboardData);
      setLoading(false);

      console.log('✅ Dashboard carregado via RPC:', {
        saldo: saldoAtual,
        receitas: receitasAtual,
        despesas: despesasAtual,
        contas: contasDetalhadas.length,
        cartoes: cartoesData.length
      });

    } catch (err) {
      console.error('❌ Erro ao carregar dashboard:', err);
      setError('Erro ao carregar dados');
      setLoading(false);
    } finally {
      isFetching.current = false;
    }
  };

  // ✅ Effect MINIMAL - apenas quando user muda
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchDashboardData();
    } else {
      setData(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]); // APENAS 2 dependências

  // ✅ Função de refresh
  const refreshData = () => {
    console.log('🔄 Refresh do dashboard');
    fetchDashboardData();
  };

  return { 
    data, 
    loading, 
    error,
    refreshData
  };
};

export default useDashboardData;