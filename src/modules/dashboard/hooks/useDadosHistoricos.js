import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import useAuth from "@modules/auth/hooks/useAuth";


/**
 * 📊 HOOK: Análise Histórica para Projeção
 * ✅ Analisa últimos N meses de transações efetivadas
 * ✅ Calcula mediana de saldo mensal (mais precisa que média)
 * ✅ Projeta baseado na mediana encontrada
 * ✅ Simples e direto: se mediana é +2k/mês, em 6 meses = +12k
 */
const useDadosHistoricos = (mesesAnalise = 6, mesesProjecao = 12) => {
  const { user } = useAuth();
  const [dados, setDados] = useState({
    historico: [],
    medianaReceitas: 0,
    medianaDespesas: 0,
    medianaSaldo: 0,
    projecaoEstatistica: [],
    loading: true,
    error: null,
    mesesComDados: 0
  });

  const analisarHistorico = async () => {
    if (!user?.id) return;

    try {
      setDados(prev => ({ ...prev, loading: true, error: null }));

      // 📅 Definir período de análise (últimos N meses)
      const dataFim = endOfMonth(new Date());
      const dataInicio = startOfMonth(subMonths(dataFim, mesesAnalise));

      console.log('📊 Analisando histórico:', {
        usuario: user.id,
        periodo: `${format(dataInicio, 'MM/yyyy')} até ${format(dataFim, 'MM/yyyy')}`,
        mesesAnalise
      });

      // 🔍 BUSCAR TRANSAÇÕES HISTÓRICAS EFETIVADAS
      const { data: transacoes, error: errorTransacoes } = await supabase
        .from('transacoes')
        .select(`
          id,
          data,
          valor,
          tipo,
          efetivado,
          transferencia
        `)
        .eq('usuario_id', user.id)
        .eq('efetivado', true)
        .gte('data', dataInicio.toISOString())
        .lte('data', dataFim.toISOString())
        .order('data');

      if (errorTransacoes) {
        console.error('❌ Erro ao buscar transações históricas:', errorTransacoes);
        throw errorTransacoes;
      }

      // 📊 AGRUPAR POR MÊS
      const historicoMensal = {};
      
      (transacoes || []).forEach(transacao => {
        // Pular transferências para não contar duplo
        if (transacao.transferencia) return;

        const mesAno = format(new Date(transacao.data), 'yyyy-MM');
        
        if (!historicoMensal[mesAno]) {
          historicoMensal[mesAno] = {
            mes: mesAno,
            mesFormatado: format(new Date(transacao.data), 'MMM/yy'),
            receitas: 0,
            despesas: 0,
            saldo: 0,
            totalTransacoes: 0
          };
        }

        const valor = parseFloat(transacao.valor) || 0;
        historicoMensal[mesAno].totalTransacoes++;

        if (transacao.tipo === 'receita') {
          historicoMensal[mesAno].receitas += valor;
        } else if (transacao.tipo === 'despesa') {
          historicoMensal[mesAno].despesas += valor;
        }

        historicoMensal[mesAno].saldo = historicoMensal[mesAno].receitas - historicoMensal[mesAno].despesas;
      });

      // 🔄 CONVERTER PARA ARRAY E ORDENAR
      const historicoArray = Object.values(historicoMensal)
        .sort((a, b) => new Date(a.mes) - new Date(b.mes));

      console.log('✅ Histórico processado:', {
        transacoesEncontradas: transacoes?.length || 0,
        mesesComDados: historicoArray.length,
        periodoAnalise: `${mesesAnalise} meses`
      });

      // 📈 CALCULAR MEDIANAS (mais precisa que média)
      const calcularMediana = (valores) => {
        if (valores.length === 0) return 0;
        
        const ordenados = [...valores].sort((a, b) => a - b);
        const meio = Math.floor(ordenados.length / 2);
        
        if (ordenados.length % 2 === 0) {
          return (ordenados[meio - 1] + ordenados[meio]) / 2;
        } else {
          return ordenados[meio];
        }
      };

      const receitas = historicoArray.map(h => h.receitas);
      const despesas = historicoArray.map(h => h.despesas);
      const saldos = historicoArray.map(h => h.saldo);

      const medianaReceitas = calcularMediana(receitas);
      const medianaDespesas = calcularMediana(despesas);
      const medianaSaldo = calcularMediana(saldos);

      console.log('📊 Medianas calculadas:', {
        receitas: medianaReceitas,
        despesas: medianaDespesas,
        saldo: medianaSaldo
      });

      // 🔮 GERAR PROJEÇÃO ESTATÍSTICA
      const projecaoEstatistica = [];
      const dataBase = new Date();
      
      for (let i = 1; i <= mesesProjecao; i++) {
        const dataProjecao = new Date(dataBase.getFullYear(), dataBase.getMonth() + i, 1);
        const mesFormatado = format(dataProjecao, 'MMM/yy');
        
        projecaoEstatistica.push({
          mes: format(dataProjecao, 'yyyy-MM'),
          mesFormatado,
          data: dataProjecao,
          receitasProjetadas: medianaReceitas,
          despesasProjetadas: medianaDespesas,
          saldoProjetado: medianaSaldo,
          saldoAcumulado: medianaSaldo * i, // Acumulado baseado na mediana
          origem: 'estatistica',
          confianca: Math.max(40, 90 - (i * 5)) // Confiança diminui com tempo
        });
      }

      setDados({
        historico: historicoArray,
        medianaReceitas,
        medianaDespesas,
        medianaSaldo,
        projecaoEstatistica,
        loading: false,
        error: null,
        mesesComDados: historicoArray.length
      });

    } catch (error) {
      console.error('❌ Erro ao analisar histórico:', error);
      setDados(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao analisar dados históricos'
      }));
    }
  };

  // 🔄 Buscar dados quando hook for montado ou parâmetros mudarem
  useEffect(() => {
    if (user?.id) {
      analisarHistorico();
    }
  }, [user?.id, mesesAnalise, mesesProjecao]);

  // 📊 FUNÇÕES AUXILIARES
  const obterResumoAnalise = () => {
    if (dados.historico.length === 0) {
      return {
        temDadosSuficientes: false,
        motivoIndisponivel: 'Sem dados históricos suficientes'
      };
    }

    const totalReceitas = dados.historico.reduce((acc, h) => acc + h.receitas, 0);
    const totalDespesas = dados.historico.reduce((acc, h) => acc + h.despesas, 0);
    const totalSaldo = dados.historico.reduce((acc, h) => acc + h.saldo, 0);

    return {
      temDadosSuficientes: dados.mesesComDados >= 3,
      motivoIndisponivel: dados.mesesComDados < 3 ? 'Mínimo 3 meses necessários' : null,
      mesesAnalisados: dados.mesesComDados,
      medianas: {
        receitas: dados.medianaReceitas,
        despesas: dados.medianaDespesas,
        saldo: dados.medianaSaldo
      },
      totais: {
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: totalSaldo
      },
      medias: {
        receitas: dados.mesesComDados > 0 ? totalReceitas / dados.mesesComDados : 0,
        despesas: dados.mesesComDados > 0 ? totalDespesas / dados.mesesComDados : 0,
        saldo: dados.mesesComDados > 0 ? totalSaldo / dados.mesesComDados : 0
      }
    };
  };

  const projetarSaldoFuturo = (mesesFuturos) => {
    if (!dados.medianaSaldo) return 0;
    return dados.medianaSaldo * mesesFuturos;
  };

  const obterConfianca = (mesesFuturos) => {
    // Confiança diminui com o tempo e aumenta com mais dados históricos
    const baseConfianca = Math.min(90, dados.mesesComDados * 15); // Max 90%
    const penalidade = mesesFuturos * 5; // -5% por mês futuro
    return Math.max(20, baseConfianca - penalidade);
  };

  const obterTendencia = () => {
    if (dados.historico.length < 3) return 'indefinida';
    
    const primeirosMeses = dados.historico.slice(0, Math.floor(dados.historico.length / 2));
    const ultimosMeses = dados.historico.slice(Math.floor(dados.historico.length / 2));
    
    const mediaPrimeiros = primeirosMeses.reduce((acc, h) => acc + h.saldo, 0) / primeirosMeses.length;
    const mediaUltimos = ultimosMeses.reduce((acc, h) => acc + h.saldo, 0) / ultimosMeses.length;
    
    const diferenca = mediaUltimos - mediaPrimeiros;
    
    if (diferenca > dados.medianaReceitas * 0.1) return 'crescimento';
    if (diferenca < -dados.medianaReceitas * 0.1) return 'declinio';
    return 'estavel';
  };

  return {
    // 📊 Dados principais
    ...dados,
    
    // 📈 Análises processadas
    resumoAnalise: obterResumoAnalise(),
    tendencia: obterTendencia(),
    
    // 🔮 Funções de projeção
    projetarSaldoFuturo,
    obterConfianca,
    
    // 🔄 Funções de controle
    refetch: analisarHistorico,
    
    // 📋 Metadados úteis
    metadados: {
      mesesAnalise,
      mesesProjecao,
      minimoDados: 3,
      algoritmo: 'mediana',
      proximaAtualizacao: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      fonteDados: 'historico_efetivado'
    }
  };
};

export default useDadosHistoricos;