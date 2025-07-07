import { useState, useEffect, useMemo } from 'react';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useDadosRecorrentes from './useDadosRecorrentes';
import useDadosHistoricos from './useDadosHistoricos';
import { useDashboardData } from '@modules/dashboard/store/dashboardStore';

/**
 * 🔄 HOOK: Projeção Combinada
 * ✅ Combina método direto (programado) + estatístico (mediana)
 * ✅ Disponibiliza 3 tipos: 'planejada', 'estatistica', 'comparar'
 * ✅ Valida disponibilidade de cada método
 * ✅ Gera dados prontos para o gráfico
 */
const useProjecaoCombinada = (mesesProjecao = 12) => {
  const { data: dashboardData } = useDashboardData();
  const saldoAtual = dashboardData?.saldo?.atual || 0;
  
  // 📋 Hooks dos métodos individuais
  const dadosRecorrentes = useDadosRecorrentes(mesesProjecao);
  const dadosHistoricos = useDadosHistoricos(6, mesesProjecao);
  
  const [tipoAtivo, setTipoAtivo] = useState('planejada');
  const [dadosGrafico, setDadosGrafico] = useState([]);

  // ✅ VERIFICAR DISPONIBILIDADE DOS MÉTODOS
  const disponibilidade = useMemo(() => {
    const planejadaDisponivel = dadosRecorrentes.temDadosSuficientes;
    const estatisticaDisponivel = dadosHistoricos.resumoAnalise.temDadosSuficientes;
    
    return {
      planejada: {
        disponivel: planejadaDisponivel,
        motivo: planejadaDisponivel 
          ? `${dadosRecorrentes.totalEncontrado} transações programadas`
          : 'Nenhuma transação programada encontrada'
      },
      estatistica: {
        disponivel: estatisticaDisponivel,
        motivo: estatisticaDisponivel
          ? `Baseada em ${dadosHistoricos.mesesComDados} meses de histórico`
          : dadosHistoricos.resumoAnalise.motivoIndisponivel || 'Dados insuficientes'
      },
      comparar: {
        disponivel: planejadaDisponivel && estatisticaDisponivel,
        motivo: planejadaDisponivel && estatisticaDisponivel
          ? 'Ambos os métodos disponíveis'
          : 'Necessário dados programados E histórico'
      }
    };
  }, [
    dadosRecorrentes.temDadosSuficientes,
    dadosRecorrentes.totalEncontrado,
    dadosHistoricos.resumoAnalise.temDadosSuficientes,
    dadosHistoricos.mesesComDados,
    dadosHistoricos.resumoAnalise.motivoIndisponivel
  ]);

  // 📊 GERAR DADOS PARA GRÁFICO
  const gerarDadosGrafico = useMemo(() => {
    console.log('🔄 Gerando dados do gráfico:', {
      tipo: tipoAtivo,
      saldoAtual,
      disponibilidade: disponibilidade[tipoAtivo]
    });

    const dadosCalculados = [];
    const dataBase = new Date();

    // 📅 Gerar meses futuros
    for (let i = 1; i <= mesesProjecao; i++) {
      const dataProjecao = addMonths(dataBase, i);
      const mesAno = format(dataProjecao, 'yyyy-MM');
      const mesFormatado = format(dataProjecao, 'MMM/yy', { locale: ptBR });

      let pontoGrafico = {
        mes: mesFormatado,
        mesCompleto: format(dataProjecao, 'MMMM yyyy', { locale: ptBR }),
        data: dataProjecao,
        mesIndex: i
      };

      // 📋 MÉTODO PLANEJADO
      if (tipoAtivo === 'planejada' && disponibilidade.planejada.disponivel) {
        const dadosMes = dadosRecorrentes.resumoPorMes.find(r => r.mes === mesAno);
        
        pontoGrafico = {
          ...pontoGrafico,
          saldoMensal: dadosMes?.saldo || 0,
          receitas: dadosMes?.receitas || 0,
          despesas: dadosMes?.despesas || 0,
          transacoes: dadosMes?.totalTransacoes || 0,
          tipo: 'planejada',
          origem: 'dados_programados',
          confianca: dadosMes ? 85 : 10, // Alta confiança se tem dados
          detalhes: dadosMes?.transacoes || []
        };
      }

      // 📊 MÉTODO ESTATÍSTICO  
      else if (tipoAtivo === 'estatistica' && disponibilidade.estatistica.disponivel) {
        pontoGrafico = {
          ...pontoGrafico,
          saldoMensal: dadosHistoricos.medianaSaldo,
          receitas: dadosHistoricos.medianaReceitas,
          despesas: dadosHistoricos.medianaDespesas,
          transacoes: 0,
          tipo: 'estatistica',
          origem: 'analise_historica',
          confianca: dadosHistoricos.obterConfianca(i),
          detalhes: [`Baseado em mediana de ${dadosHistoricos.mesesComDados} meses`]
        };
      }

      // 🔄 MÉTODO COMPARAÇÃO
      else if (tipoAtivo === 'comparar' && disponibilidade.comparar.disponivel) {
        const dadosMes = dadosRecorrentes.resumoPorMes.find(r => r.mes === mesAno);
        
        console.log(`🔍 Comparação mês ${i}:`, {
          mesAno,
          dadosMes: dadosMes?.saldo || 0,
          mediana: dadosHistoricos.medianaSaldo
        });
        
        pontoGrafico = {
          ...pontoGrafico,
          // Dados mensais separados
          saldoMensalPlanejado: dadosMes?.saldo || 0,
          saldoMensalEstatistico: dadosHistoricos.medianaSaldo,
          // Saldo mensal combinado
          saldoMensal: dadosMes ? 
            (dadosMes.saldo + dadosHistoricos.medianaSaldo) / 2 : 
            dadosHistoricos.medianaSaldo,
          tipo: 'comparacao',
          origem: 'ambos_metodos',
          confianca: dadosMes ? 90 : dadosHistoricos.obterConfianca(i)
        };
      }

      // ❌ Método não disponível
      else {
        pontoGrafico = {
          ...pontoGrafico,
          saldoMensal: 0,
          receitas: 0,
          despesas: 0,
          transacoes: 0,
          tipo: 'indisponivel',
          origem: 'sem_dados',
          confianca: 0,
          detalhes: [disponibilidade[tipoAtivo]?.motivo || 'Dados não disponíveis']
        };
      }

      dadosCalculados.push(pontoGrafico);
    }

    // 🔢 CALCULAR SALDO ACUMULADO (partindo do saldo atual)
    let saldoAcumulado = saldoAtual;
    let saldoAcumuladoPlanejado = saldoAtual;
    let saldoAcumuladoEstatistico = saldoAtual;
    
    dadosCalculados.forEach((ponto, index) => {
      saldoAcumulado += ponto.saldoMensal || 0;
      ponto.saldoAcumulado = saldoAcumulado;
      
      // Para modo comparação, calcular acumulados separados
      if (tipoAtivo === 'comparar') {
        saldoAcumuladoPlanejado += ponto.saldoMensalPlanejado || 0;
        saldoAcumuladoEstatistico += ponto.saldoMensalEstatistico || 0;
        ponto.saldoPlanejado = saldoAcumuladoPlanejado;
        ponto.saldoEstatistico = saldoAcumuladoEstatistico;
        
        console.log(`📊 Ponto ${index + 1}:`, {
          mes: ponto.mes,
          saldoAcumulado: ponto.saldoAcumulado,
          saldoPlanejado: ponto.saldoPlanejado,
          saldoEstatistico: ponto.saldoEstatistico
        });
      }
    });

    console.log('✅ Dados do gráfico gerados:', {
      pontos: dadosCalculados.length,
      tipo: tipoAtivo,
      saldoInicial: saldoAtual,
      saldoFinal: dadosCalculados[dadosCalculados.length - 1]?.saldoAcumulado,
      // Debug comparação
      primeirosPontos: dadosCalculados.slice(0, 2).map(p => ({
        mes: p.mes,
        saldoAcumulado: p.saldoAcumulado,
        saldoPlanejado: p.saldoPlanejado,
        saldoEstatistico: p.saldoEstatistico,
        tipo: p.tipo
      }))
    });

    return dadosCalculados;
  }, [
    tipoAtivo,
    saldoAtual,
    mesesProjecao,
    dadosRecorrentes.resumoPorMes,
    dadosHistoricos.medianaSaldo,
    dadosHistoricos.medianaReceitas,
    dadosHistoricos.medianaDespesas,
    dadosHistoricos.mesesComDados,
    disponibilidade
  ]);

  // 🔄 Atualizar dados do gráfico
  useEffect(() => {
    setDadosGrafico(gerarDadosGrafico);
  }, [gerarDadosGrafico]);

  // 📊 RESUMOS E INDICADORES
  const obterResumoProjecao = () => {
    if (dadosGrafico.length === 0) return null;

    const ultimoPonto = dadosGrafico[dadosGrafico.length - 1];
    const crescimentoTotal = ultimoPonto.saldoAcumulado - saldoAtual;
    const crescimentoMensal = crescimentoTotal / mesesProjecao;

    return {
      saldoAtual,
      saldoFinal: ultimoPonto.saldoAcumulado,
      crescimentoTotal,
      crescimentoMensal,
      tendencia: crescimentoTotal > 0 ? 'positiva' : 'negativa',
      confiancaMedia: dadosGrafico.reduce((acc, p) => acc + p.confianca, 0) / dadosGrafico.length,
      mesesProjetados: mesesProjecao,
      tipoProjecao: tipoAtivo
    };
  };

  const obterIndicadoresDetalhados = () => {
    if (!disponibilidade[tipoAtivo]?.disponivel) {
      return {
        status: 'indisponivel',
        motivo: disponibilidade[tipoAtivo]?.motivo,
        sugestao: getSugestaoMelhoria()
      };
    }

    const resumo = obterResumoProjecao();
    if (!resumo) return null;

    return {
      status: 'disponivel',
      resumo,
      detalhes: {
        fonte: tipoAtivo === 'planejada' ? 'Transações programadas' : 
               tipoAtivo === 'estatistica' ? 'Análise histórica' : 'Métodos combinados',
        precisao: resumo.confiancaMedia > 70 ? 'Alta' : 
                  resumo.confiancaMedia > 50 ? 'Média' : 'Baixa',
        recomendacao: getRecomendacao(resumo)
      }
    };
  };

  const getSugestaoMelhoria = () => {
    if (!disponibilidade.planejada.disponivel && !disponibilidade.estatistica.disponivel) {
      return 'Adicione transações recorrentes ou aguarde acumular mais histórico';
    }
    if (!disponibilidade.planejada.disponivel) {
      return 'Configure suas receitas e despesas recorrentes para projeção mais precisa';
    }
    if (!disponibilidade.estatistica.disponivel) {
      return 'Continue usando o app para acumular histórico para análise estatística';
    }
    return null;
  };

  const getRecomendacao = (resumo) => {
    if (resumo.tendencia === 'positiva' && resumo.crescimentoMensal > 1000) {
      return 'Excelente! Considere investir o excedente.';
    }
    if (resumo.tendencia === 'negativa') {
      return 'Atenção: revise seus gastos ou aumente receitas.';
    }
    return 'Situação estável. Monitore regularmente.';
  };

  // 🔄 FUNÇÃO PARA ALTERNAR TIPO
  const alternarTipo = (novoTipo) => {
    if (disponibilidade[novoTipo]?.disponivel) {
      setTipoAtivo(novoTipo);
    }
  };

  // 📋 LOADING E ERROR STATES
  const loading = dadosRecorrentes.loading || dadosHistoricos.loading;
  const error = dadosRecorrentes.error || dadosHistoricos.error;

  return {
    // 📊 Dados principais
    dadosGrafico,
    tipoAtivo,
    disponibilidade,
    
    // 📈 Análises
    resumoProjecao: obterResumoProjecao(),
    indicadores: obterIndicadoresDetalhados(),
    
    // 🔄 Controles
    alternarTipo,
    refetch: () => {
      dadosRecorrentes.refetch();
      dadosHistoricos.refetch();
    },
    
    // 📋 Estados
    loading,
    error,
    
    // 🔍 Dados dos hooks individuais (para debug/detalhes)
    dadosRecorrentes: {
      resumoPorMes: dadosRecorrentes.resumoPorMes,
      totalEncontrado: dadosRecorrentes.totalEncontrado
    },
    dadosHistoricos: {
      medianaSaldo: dadosHistoricos.medianaSaldo,
      mesesComDados: dadosHistoricos.mesesComDados,
      tendencia: dadosHistoricos.tendencia
    },
    
    // 📋 Metadados
    metadados: {
      mesesProjecao,
      saldoBase: saldoAtual,
      metodosDisponiveis: Object.keys(disponibilidade).filter(k => disponibilidade[k].disponivel),
      ultimaAtualizacao: new Date()
    }
  };
};

export default useProjecaoCombinada;