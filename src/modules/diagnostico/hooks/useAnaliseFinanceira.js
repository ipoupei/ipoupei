// src\modules\diagnostico\hooks\useAnaliseFinanceira.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  calcularSaudeFinanceira,
  analisarGastosPorCategoria,
  calcularProjecaoFutura,
  simularEconomiaInvestimento,
  verificarElegibilidadeAnalise
} from '@shared/utils/analisesCalculos';

/**
 * Hook para análise financeira completa
 * @param {Array} transacoes - Array de transações do usuário
 * @param {Object} opcoes - Opções de configuração da análise
 * @returns {Object} Dados da análise, status e controles
 */
export const useAnaliseFinanceira = (transacoes, opcoes = {}) => {
  const {
    mesesAnalise = 3,
    percentualEconomiaSimulacao = 0.1, // 10%
    taxaInvestimento = 0.15, // 15% ao ano (Selic jul/25)
    autoRecalcular = true
  } = opcoes;

  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analiseCompleta, setAnaliseCompleta] = useState(null);

  // Verificar elegibilidade dos dados
  const elegibilidade = useMemo(() => {
    if (!transacoes) {
      return {
        elegivel: false,
        motivo: 'Carregando transações...',
        progresso: 0
      };
    }
    
    return verificarElegibilidadeAnalise(transacoes);
  }, [transacoes]);

  // Calcular análise completa
  const calcularAnalise = useCallback(() => {
    console.log('🔍 DEBUG - Hook recebeu:', {
  totalTransacoes: transacoes?.length,
  primeiraTransacao: transacoes?.[0],
  campoData: transacoes?.[0]?.data, // ✅ Verificar se existe
  elegibilidade: elegibilidade.elegivel,
  motivoNaoElegivel: elegibilidade.motivo
});
  console.log('🔍 DEBUG - Verificando transações no hook:', {
    transacoes: transacoes?.length || 0,
    estrutura: transacoes?.[0],
    tipos: transacoes?.map(t => t.tipo),
    temReceitas: transacoes?.some(t => t.tipo === 'receita'),
    temDespesas: transacoes?.some(t => t.tipo === 'despesa')
  });

  if (!elegibilidade.elegivel || !transacoes) {
    console.log('❌ Não elegível ou sem transações');
    setAnaliseCompleta(null);
    return null;
  }
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando cálculo da análise financeira...', {
        totalTransacoes: transacoes.length,
        mesesAnalise,
        percentualEconomiaSimulacao,
        taxaInvestimento
      });

      // 1. Calcular Saúde Financeira
      const saudeFinanceira = calcularSaudeFinanceira(transacoes, mesesAnalise);
      console.log('✅ Saúde financeira calculada:', saudeFinanceira.status.titulo);

      // 2. Analisar Categorias
      const categorias = analisarGastosPorCategoria(
        transacoes, 
        saudeFinanceira.receitas, 
        mesesAnalise
      );
      console.log('✅ Categorias analisadas:', {
        total: categorias.totalCategorias,
        principais: categorias.principais.length
      });

      // 3. Calcular Projeção Futura
      const projecao = calcularProjecaoFutura(saudeFinanceira.saldo, 24);
      console.log('✅ Projeção calculada:', {
        tendencia: projecao.tendencia,
        em6Meses: projecao.em6Meses
      });

      // 4. Simular Economia e Investimento
      const simulacao = simularEconomiaInvestimento(
        saudeFinanceira.despesas,
        percentualEconomiaSimulacao,
        taxaInvestimento
      );
      console.log('✅ Simulação calculada:', {
        economiaMonsal: simulacao.premissas.economiaMonsal,
        projecoes: simulacao.projecoes.length
      });

      // 5. Montar resultado final
      const resultado = {
        // Dados principais
        saudeFinanceira,
        categorias,
        projecao,
        simulacao,
        
        // Metadados
        metadados: {
          mesesAnalisados: mesesAnalise,
          totalTransacoes: transacoes.length,
          transacoesReceitas: transacoes.filter(t => t.tipo === 'receita' && !t.deletada).length,
          transacoesDespesas: transacoes.filter(t => t.tipo === 'despesa' && !t.deletada).length,
          periodoInicio: obterDataMaisAntiga(transacoes),
          periodoFim: obterDataMaisRecente(transacoes),
          parametros: {
            percentualEconomiaSimulacao,
            taxaInvestimento,
            mesesAnalise
          },
          geradoEm: new Date().toISOString()
        },

        // Resumo executivo
        resumoExecutivo: {
          situacaoGeral: saudeFinanceira.status.tipo,
          principalCategoria: categorias.principais[0]?.nome || 'N/A',
          tendenciaFutura: projecao.tendencia,
          potencialEconomia: simulacao.premissas.economiaMonsal
        }
      };

      setAnaliseCompleta(resultado);
      setLoading(false);
      
      console.log('🎉 Análise financeira concluída com sucesso!');
      return resultado;
      
    } catch (err) {
      console.error('❌ Erro ao calcular análise:', err);
      setError(`Erro no cálculo da análise: ${err.message}`);
      setAnaliseCompleta(null);
      setLoading(false);
      return null;
    }
  }, [
    transacoes, 
    elegibilidade.elegivel, 
    mesesAnalise, 
    percentualEconomiaSimulacao, 
    taxaInvestimento
  ]);

  // Recalcular automaticamente quando dados mudarem
  useEffect(() => {
    if (autoRecalcular && elegibilidade.elegivel) {
      const timer = setTimeout(() => {
        calcularAnalise();
      }, 100); // Pequeno delay para evitar cálculos desnecessários
      
      return () => clearTimeout(timer);
    }
  }, [calcularAnalise, autoRecalcular, elegibilidade.elegivel]);

  // Função para forçar recálculo manual
  const recalcular = useCallback((novasOpcoes = {}) => {
    console.log('🔄 Recálculo manual solicitado', novasOpcoes);
    
    // Se foram passadas novas opções, podemos aplicá-las aqui
    // Por agora, apenas recalcula com as opções atuais
    calcularAnalise();
  }, [calcularAnalise]);

  // Função para obter insights rápidos
  const obterInsightsRapidos = useCallback(() => {
    if (!analiseCompleta) return [];

    const insights = [];
    const { saudeFinanceira, categorias, projecao, simulacao } = analiseCompleta;

    // Insight sobre saúde financeira
    if (saudeFinanceira.status.tipo === 'critica') {
      insights.push({
        tipo: 'alerta',
        icone: '🚨',
        titulo: 'Atenção: Déficit Mensal',
        descricao: `Você está gastando R$ ${Math.abs(saudeFinanceira.saldo).toFixed(2)} a mais do que ganha por mês`
      });
    } else if (saudeFinanceira.taxaPoupanca > 20) {
      insights.push({
        tipo: 'positivo',
        icone: '💰',
        titulo: 'Excelente Capacidade de Poupança',
        descricao: `Você consegue poupar ${saudeFinanceira.taxaPoupanca.toFixed(1)}% da sua renda`
      });
    }

    // Insight sobre categoria principal
    if (categorias.principais.length > 0) {
      const principal = categorias.principais[0];
      insights.push({
        tipo: 'info',
        icone: principal.icone,
        titulo: `Maior Gasto: ${principal.nome}`,
        descricao: `Representa ${principal.percentualRenda.toFixed(1)}% da sua renda (${principal.horasTrabalho}h de trabalho)`
      });
    }

    // Insight sobre projeção
    if (projecao.tendencia === 'endividamento') {
      insights.push({
        tipo: 'alerta',
        icone: '📉',
        titulo: 'Projeção de Endividamento',
        descricao: `Mantendo o padrão atual, você pode acumular R$ ${Math.abs(projecao.em12Meses).toFixed(2)} de dívida em 1 ano`
      });
    } else if (projecao.em12Meses > 10000) {
      insights.push({
        tipo: 'positivo',
        icone: '📈',
        titulo: 'Ótima Projeção de Poupança',
        descricao: `Em 1 ano você pode acumular R$ ${projecao.em12Meses.toFixed(2)} mantendo o padrão atual`
      });
    }

    // Insight sobre potencial de investimento
    if (simulacao.projecoes[2].montanteFinal > 100000) { // 20 anos
      insights.push({
        tipo: 'oportunidade',
        icone: '🚀',
        titulo: 'Grande Potencial de Investimento',
        descricao: `Economizando 10% e investindo, você teria R$ ${simulacao.projecoes[2].montanteFinal.toFixed(2)} em 20 anos`
      });
    }

    return insights.slice(0, 4); // Máximo 4 insights
  }, [analiseCompleta]);

  // Status resumido para UI
  const status = useMemo(() => {
    if (loading) return { tipo: 'loading', mensagem: 'Calculando análise...' };
    if (error) return { tipo: 'error', mensagem: error };
    if (!elegibilidade.elegivel) return { tipo: 'not_eligible', mensagem: elegibilidade.motivo };
    if (!analiseCompleta) return { tipo: 'no_data', mensagem: 'Dados não processados' };
    
    return { 
      tipo: 'ready', 
      mensagem: 'Análise completa disponível',
      situacao: analiseCompleta.saudeFinanceira.status.tipo
    };
  }, [loading, error, elegibilidade, analiseCompleta]);

  return {
    // Dados principais
    analise: analiseCompleta,
    
    // Estados
    loading,
    error,
    elegibilidade,
    status,
    
    // Funções
    recalcular,
    calcularAnalise,
    obterInsightsRapidos,
    
    // Dados derivados
    temDados: !!analiseCompleta,
    situacaoFinanceira: analiseCompleta?.saudeFinanceira?.status?.tipo || 'unknown',
    insightsRapidos: obterInsightsRapidos()
  };
};

// ===== FUNÇÕES AUXILIARES =====

/**
 * Obtém a data mais antiga das transações
 * @param {Array} transacoes 
 * @returns {string} Data no formato ISO
 */
const obterDataMaisAntiga = (transacoes) => {
  if (!transacoes || transacoes.length === 0) return null;
  
  return transacoes
    .filter(t => t.data && !t.deletada) // ✅ MUDAR AQUI
    .reduce((oldest, t) => 
      new Date(t.data) < new Date(oldest.data) ? t : oldest // ✅ MUDAR AQUI
    )?.data || null; // ✅ MUDAR AQUI
};

/**
 * Obtém a data mais recente das transações
 * @param {Array} transacoes 
 * @returns {string} Data no formato ISO
 */
const obterDataMaisRecente = (transacoes) => {
  if (!transacoes || transacoes.length === 0) return null;
  
  return transacoes
    .filter(t => t.data && !t.deletada) // ✅ MUDAR AQUI
    .reduce((newest, t) => 
      new Date(t.data) > new Date(newest.data) ? t : newest // ✅ MUDAR AQUI
    )?.data || null; // ✅ MUDAR AQUI
};

export default useAnaliseFinanceira;