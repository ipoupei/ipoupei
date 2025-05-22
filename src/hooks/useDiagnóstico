import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook personalizado para gerenciar o diagnóstico financeiro
 * Processa dados coletados e gera insights profissionais
 */
const useDiagnostico = () => {
  // Estado para armazenar os dados do diagnóstico
  const [diagnosticoData, setDiagnosticoData] = useState({
    percepcoesFinanceiras: {
      sentimento: null,
      percepcaoControle: null,
      percepcaoGastos: null,
      disciplina: null,
      relacaoDinheiro: '',
    },
    situacaoFinanceira: {
      rendaMensal: 0,
      tipoRenda: null,
      contas: [],
      cartoes: [],
      parcelamentos: [],
      dividas: [],
      despesasFixas: {
        moradia: 0,
        contas: 0,
        alimentacao: 0,
        transporte: 0,
        educacao: 0,
        saude: 0,
        outros: 0,
      },
      despesasVariaveis: {
        lazer: 0,
        compras: 0,
        imprevistos: 0,
      }
    },
    resultados: {
      notaSaudeFinanceira: 0,
      classificacao: null,
      riscosCriticos: [],
      oportunidades: [],
      planosAcao: [],
      nivelComprometimentoRenda: 0
    }
  });
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para salvar o diagnóstico no Supabase
  const saveDiagnostico = useCallback(async (dados) => {
    try {
      setLoading(true);
      setError(null);
      
      // Salva o perfil do usuário com as percepções
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfil_usuario')
        .upsert({
          sentimento_financeiro: dados.percepcoesFinanceiras.sentimento,
          percepcao_controle: dados.percepcoesFinanceiras.percepcaoControle,
          percepcao_gastos: dados.percepcoesFinanceiras.percepcaoGastos,
          disciplina_financeira: dados.percepcoesFinanceiras.disciplina,
          relacao_dinheiro: dados.percepcoesFinanceiras.relacaoDinheiro,
          renda_mensal: dados.situacaoFinanceira.rendaMensal,
          tipo_renda: dados.situacaoFinanceira.tipoRenda,
          diagnostico_completo: true,
          data_diagnostico: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (perfilError) throw perfilError;
      
      // Cadastra contas bancárias
      if (dados.situacaoFinanceira.contas.length > 0) {
        const contasFormatadas = dados.situacaoFinanceira.contas.map(conta => ({
          nome: conta.nome,
          tipo: conta.tipo,
          saldo: conta.saldo,
          ativo: true,
          origem_diagnostico: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error: contasError } = await supabase
          .from('contas')
          .insert(contasFormatadas);
        
        if (contasError) throw contasError;
      }
      
      // Cadastra cartões de crédito
      if (dados.situacaoFinanceira.cartoes.length > 0) {
        const cartoesFormatados = dados.situacaoFinanceira.cartoes.map(cartao => ({
          nome: cartao.nome,
          bandeira: cartao.bandeira,
          limite: cartao.limite,
          dia_fechamento: cartao.diaFechamento,
          dia_vencimento: cartao.diaVencimento,
          ativo: true,
          origem_diagnostico: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error: cartoesError } = await supabase
          .from('cartoes')
          .insert(cartoesFormatados);
        
        if (cartoesError) throw cartoesError;
      }
      
      // Cadastra despesas fixas como transações recorrentes
      const despesasFixas = dados.situacaoFinanceira.despesasFixas;
      const transacoesFixas = [];
      
      Object.entries(despesasFixas).forEach(([categoria, valor]) => {
        if (valor > 0) {
          transacoesFixas.push({
            descricao: `${categoria.charAt(0).toUpperCase() + categoria.slice(1)} - Despesa Fixa`,
            valor: valor,
            tipo: 'despesa',
            categoria: categoria,
            recorrente: true,
            origem_diagnostico: true,
            data: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        }
      });
      
      if (transacoesFixas.length > 0) {
        const { error: transacoesError } = await supabase
          .from('transacoes')
          .insert(transacoesFixas);
        
        if (transacoesError) throw transacoesError;
      }
      
      // Cadastra receita mensal
      const { error: receitaError } = await supabase
        .from('transacoes')
        .insert({
          descricao: 'Renda Mensal - Diagnóstico',
          valor: dados.situacaoFinanceira.rendaMensal,
          tipo: 'receita',
          categoria: 'salario',
          recorrente: true,
          origem_diagnostico: true,
          data: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      
      if (receitaError) throw receitaError;
      
      // Cadastra dívidas
      if (dados.situacaoFinanceira.dividas.length > 0) {
        const dividasFormatadas = dados.situacaoFinanceira.dividas.map(divida => ({
          descricao: divida.descricao,
          instituicao: divida.instituicao,
          valor_total: divida.valorTotal,
          valor_parcela: divida.valorParcela,
          parcelas_restantes: divida.parcelasRestantes,
          parcelas_totais: divida.parcelasTotais,
          situacao: divida.situacao,
          origem_diagnostico: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error: dividasError } = await supabase
          .from('dividas')
          .insert(dividasFormatadas);
        
        if (dividasError) throw dividasError;
      }
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao salvar diagnóstico:', err);
      setError('Não foi possível salvar o diagnóstico. Tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para calcular nota de saúde financeira
  const calcularNotaSaudeFinanceira = useCallback((dados) => {
    let nota = 100;
    const situacao = dados.situacaoFinanceira;
    
    // Calcula totais
    const totalDespesasFixas = Object.values(situacao.despesasFixas).reduce((acc, val) => acc + val, 0);
    const totalDespesasVariaveis = Object.values(situacao.despesasVariaveis).reduce((acc, val) => acc + val, 0);
    const totalParcelamentos = situacao.parcelamentos.reduce((acc, p) => acc + p.valorParcela, 0);
    const totalDividas = situacao.dividas.reduce((acc, d) => acc + d.valorParcela, 0);
    const totalDespesas = totalDespesasFixas + totalDespesasVariaveis + totalParcelamentos + totalDividas;
    
    // Nível de comprometimento da renda
    const comprometimentoRenda = (totalDespesas / situacao.rendaMensal) * 100;
    
    // Penalizações
    if (comprometimentoRenda > 80) nota -= 40;
    else if (comprometimentoRenda > 60) nota -= 25;
    else if (comprometimentoRenda > 40) nota -= 10;
    
    // Saldo em contas
    const saldoTotal = situacao.contas.reduce((acc, conta) => acc + conta.saldo, 0);
    if (saldoTotal < 0) nota -= 30;
    else if (saldoTotal < situacao.rendaMensal * 0.5) nota -= 15;
    
    // Dívidas
    const totalDividasValor = situacao.dividas.reduce((acc, d) => acc + (d.valorParcela * d.parcelasRestantes), 0);
    if (totalDividasValor > situacao.rendaMensal * 3) nota -= 25;
    else if (totalDividasValor > situacao.rendaMensal) nota -= 10;
    
    // Percepções (bônus por autoconsciência)
    if (dados.percepcoesFinanceiras.disciplina === 'disciplinado') nota += 5;
    if (dados.percepcoesFinanceiras.percepcaoGastos === 'conhecimento_total') nota += 5;
    
    return Math.max(0, Math.round(nota));
  }, []);
  
  // Função para determinar classificação financeira
  const determinarClassificacao = useCallback((nota, comprometimentoRenda, saldoTotal, rendaMensal) => {
    if (nota < 30 || comprometimentoRenda > 100 || saldoTotal < 0) {
      return 'super_deficitario';
    } else if (nota < 50 || comprometimentoRenda > 80) {
      return 'no_limite';
    } else if (nota < 70 || saldoTotal < rendaMensal) {
      return 'superavitario';
    } else {
      return 'estavel';
    }
  }, []);
  
  // Função para gerar riscos críticos
  const gerarRiscosCriticos = useCallback((dados) => {
    const riscos = [];
    const situacao = dados.situacaoFinanceira;
    
    const totalDespesas = Object.values(situacao.despesasFixas).reduce((acc, val) => acc + val, 0) +
                         Object.values(situacao.despesasVariaveis).reduce((acc, val) => acc + val, 0) +
                         situacao.parcelamentos.reduce((acc, p) => acc + p.valorParcela, 0) +
                         situacao.dividas.reduce((acc, d) => acc + d.valorParcela, 0);
    
    const comprometimentoRenda = (totalDespesas / situacao.rendaMensal) * 100;
    const saldoTotal = situacao.contas.reduce((acc, conta) => acc + conta.saldo, 0);
    
    if (comprometimentoRenda > 100) {
      riscos.push('Suas despesas superam sua renda - situação insustentável');
    }
    
    if (saldoTotal < 0) {
      riscos.push('Saldo negativo indica dependência de crédito para fechar o mês');
    }
    
    if (situacao.dividas.length > 3) {
      riscos.push('Múltiplas dívidas ativas aumentam o risco de descontrole');
    }
    
    const dividasAtrasadas = situacao.dividas.filter(d => d.situacao === 'atrasada');
    if (dividasAtrasadas.length > 0) {
      riscos.push('Dívidas em atraso prejudicam seu score e geram juros');
    }
    
    if (dados.percepcoesFinanceiras.percepcaoGastos === 'desconhecimento') {
      riscos.push('Falta de controle sobre gastos impede melhoria da situação');
    }
    
    return riscos;
  }, []);
  
  // Função para gerar oportunidades
  const gerarOportunidades = useCallback((dados) => {
    const oportunidades = [];
    const situacao = dados.situacaoFinanceira;
    
    const totalDespesasVariaveis = Object.values(situacao.despesasVariaveis).reduce((acc, val) => acc + val, 0);
    
    if (totalDespesasVariaveis > situacao.rendaMensal * 0.3) {
      oportunidades.push('Reduzir despesas variáveis pode liberar até R$ ' + 
        (totalDespesasVariaveis * 0.3).toFixed(0) + ' mensais');
    }
    
    if (situacao.dividas.length > 0) {
      oportunidades.push('Renegociar dívidas pode reduzir parcelas e juros');
    }
    
    const saldoTotal = situacao.contas.reduce((acc, conta) => acc + conta.saldo, 0);
    if (saldoTotal > 0) {
      oportunidades.push('Organizar aplicações pode fazer seu dinheiro render mais');
    }
    
    if (situacao.tipoRenda === 'variavel' && dados.percepcoesFinanceiras.disciplina !== 'disciplinado') {
      oportunidades.push('Criar reserva para meses de baixa renda trará segurança');
    }
    
    return oportunidades;
  }, []);
  
  // Função para gerar planos de ação
  const gerarPlanosAcao = useCallback((dados, classificacao) => {
    const planos = [];
    
    switch (classificacao) {
      case 'super_deficitario':
        planos.push('Emergência: cortar gastos não essenciais imediatamente');
        planos.push('Renegociar todas as dívidas para reduzir parcelas');
        planos.push('Buscar renda extra temporária');
        planos.push('Usar o app para controlar cada centavo');
        break;
        
      case 'no_limite':
        planos.push('Reduzir despesas variáveis em pelo menos 20%');
        planos.push('Reorganizar dívidas por prazo e juros');
        planos.push('Montar reserva mínima de R$ 500');
        planos.push('Acompanhar fluxo de caixa semanalmente');
        break;
        
      case 'superavitario':
        planos.push('Construir reserva de emergência (3-6 meses de gastos)');
        planos.push('Investir excedente em aplicações rentáveis');
        planos.push('Definir objetivos financeiros de médio prazo');
        break;
        
      case 'estavel':
        planos.push('Manter disciplina e aumentar investimentos');
        planos.push('Diversificar fontes de renda');
        planos.push('Planejar objetivos de longo prazo');
        break;
    }
    
    return planos;
  }, []);

  // Função principal para calcular resultados
  const calculaResultados = useCallback(async () => {
    try {
      setLoading(true);
      
      const dados = diagnosticoData;
      const situacao = dados.situacaoFinanceira;
      
      // Calcula métricas
      const totalDespesas = Object.values(situacao.despesasFixas).reduce((acc, val) => acc + val, 0) +
                           Object.values(situacao.despesasVariaveis).reduce((acc, val) => acc + val, 0) +
                           situacao.parcelamentos.reduce((acc, p) => acc + p.valorParcela, 0) +
                           situacao.dividas.reduce((acc, d) => acc + d.valorParcela, 0);
      
      const comprometimentoRenda = Math.round((totalDespesas / situacao.rendaMensal) * 100);
      const saldoTotal = situacao.contas.reduce((acc, conta) => acc + conta.saldo, 0);
      
      // Calcula nota
      const nota = calcularNotaSaudeFinanceira(dados);
      
      // Determina classificação
      const classificacao = determinarClassificacao(nota, comprometimentoRenda, saldoTotal, situacao.rendaMensal);
      
      // Gera insights
      const riscosCriticos = gerarRiscosCriticos(dados);
      const oportunidades = gerarOportunidades(dados);
      const planosAcao = gerarPlanosAcao(dados, classificacao);
      
      // Atualiza estado
      setDiagnosticoData(prev => ({
        ...prev,
        resultados: {
          notaSaudeFinanceira: nota,
          classificacao,
          riscosCriticos,
          oportunidades,
          planosAcao,
          nivelComprometimentoRenda: comprometimentoRenda
        }
      }));
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao calcular resultados:', err);
      setError('Erro ao processar diagnóstico');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [diagnosticoData, calcularNotaSaudeFinanceira, determinarClassificacao, gerarRiscosCriticos, gerarOportunidades, gerarPlanosAcao]);

  return {
    diagnosticoData,
    setDiagnosticoData,
    saveDiagnostico,
    calculaResultados,
    loading,
    error
  };
};

export default useDiagnostico;