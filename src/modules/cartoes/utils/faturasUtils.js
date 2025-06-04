// src/utils/faturasUtils.js
import { format, addMonths, differenceInDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Utilitários para trabalhar com faturas de cartão de crédito
 */

// Calcular data de vencimento da fatura baseada na transação
export const calcularDataVencimentoFatura = (dataTransacao, diaFechamento = 5, diaVencimento = 10) => {
  const dataTransacaoObj = new Date(dataTransacao);
  let mesVencimento = dataTransacaoObj.getMonth();
  let anoVencimento = dataTransacaoObj.getFullYear();

  // Se a transação foi após o fechamento, vai para a próxima fatura
  if (dataTransacaoObj.getDate() > diaFechamento) {
    mesVencimento += 1;
    if (mesVencimento > 11) {
      mesVencimento = 0;
      anoVencimento += 1;
    }
  }

  return new Date(anoVencimento, mesVencimento, diaVencimento);
};

// Determinar status da fatura baseado na data de vencimento
export const determinarStatusFatura = (dataVencimento) => {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diasParaVencimento = differenceInDays(vencimento, hoje);
  
  if (diasParaVencimento < 0) {
    return {
      status: 'vencida',
      cor: 'red',
      icone: 'alert-circle',
      texto: 'Vencida',
      prioridade: 4
    };
  } else if (diasParaVencimento <= 3) {
    return {
      status: 'vence_breve',
      cor: 'orange',
      icone: 'clock',
      texto: 'Vence em breve',
      prioridade: 3
    };
  } else if (diasParaVencimento <= 7) {
    return {
      status: 'proximo_vencimento',
      cor: 'yellow',
      icone: 'clock',
      texto: 'Próximo vencimento',
      prioridade: 2
    };
  } else {
    return {
      status: 'em_dia',
      cor: 'green',
      icone: 'check-circle',
      texto: 'Em dia',
      prioridade: 1
    };
  }
};

// Agrupar transações por fatura
export const agruparTransacoesPorFatura = (transacoes, cartoes) => {
  const faturasPorPeriodo = {};

  transacoes.forEach(transacao => {
    const cartao = cartoes.find(c => c.id === transacao.cartao_id);
    if (!cartao) return;

    const dataVencimento = calcularDataVencimentoFatura(
      transacao.data,
      cartao.dia_fechamento,
      cartao.dia_vencimento
    );

    const chaveVencimento = format(dataVencimento, 'yyyy-MM-dd');
    const chaveFatura = `${cartao.id}_${chaveVencimento}`;

    if (!faturasPorPeriodo[chaveFatura]) {
      faturasPorPeriodo[chaveFatura] = {
        cartao_id: cartao.id,
        cartao_nome: cartao.nome,
        cartao_bandeira: cartao.bandeira,
        fatura_vencimento: chaveVencimento,
        valor_total_fatura: 0,
        total_compras: 0,
        total_parcelas: 0,
        transacoes: [],
        status: determinarStatusFatura(dataVencimento)
      };
    }

    faturasPorPeriodo[chaveFatura].valor_total_fatura += (transacao.valor || 0);
    faturasPorPeriodo[chaveFatura].total_compras += 1;
    faturasPorPeriodo[chaveFatura].total_parcelas += (transacao.numero_parcelas || 1);
    faturasPorPeriodo[chaveFatura].transacoes.push(transacao);
  });

  return Object.values(faturasPorPeriodo);
};

// Formatar período da fatura
export const formatarPeriodoFatura = (dataVencimento, diaFechamento = 5) => {
  const vencimento = new Date(dataVencimento);
  
  // Período de fechamento anterior
  const inicioFatura = new Date(vencimento);
  inicioFatura.setMonth(inicioFatura.getMonth() - 1);
  inicioFatura.setDate(diaFechamento + 1);
  
  const fimFatura = new Date(vencimento);
  fimFatura.setDate(diaFechamento);

  return {
    inicio: inicioFatura,
    fim: fimFatura,
    textoFormatado: `${format(inicioFatura, 'dd/MM', { locale: ptBR })} - ${format(fimFatura, 'dd/MM/yyyy', { locale: ptBR })}`
  };
};

// Calcular estatísticas de uma fatura
export const calcularEstatisticasFatura = (fatura) => {
  if (!fatura || !fatura.transacoes) return null;

  const transacoes = fatura.transacoes;
  const totalTransacoes = transacoes.length;
  const valorMedio = totalTransacoes > 0 ? fatura.valor_total_fatura / totalTransacoes : 0;

  // Agrupar por categoria
  const porCategoria = {};
  transacoes.forEach(t => {
    const categoria = t.categoria?.nome || 'Sem categoria';
    if (!porCategoria[categoria]) {
      porCategoria[categoria] = { valor: 0, quantidade: 0, cor: t.categoria?.cor };
    }
    porCategoria[categoria].valor += t.valor || 0;
    porCategoria[categoria].quantidade += 1;
  });

  // Ordenar categorias por valor
  const categorias = Object.entries(porCategoria)
    .map(([nome, dados]) => ({ nome, ...dados }))
    .sort((a, b) => b.valor - a.valor);

  // Transações por dia
  const porDia = {};
  transacoes.forEach(t => {
    const dia = format(new Date(t.data), 'yyyy-MM-dd');
    if (!porDia[dia]) {
      porDia[dia] = { valor: 0, quantidade: 0 };
    }
    porDia[dia].valor += t.valor || 0;
    porDia[dia].quantidade += 1;
  });

  const diasOrdenados = Object.entries(porDia)
    .map(([dia, dados]) => ({ dia, ...dados }))
    .sort((a, b) => new Date(b.dia) - new Date(a.dia));

  return {
    totalTransacoes,
    valorTotal: fatura.valor_total_fatura,
    valorMedio,
    maiorCategoria: categorias[0] || null,
    categorias,
    porDia: diasOrdenados,
    distribuicaoTemporal: calcularDistribuicaoTemporal(transacoes)
  };
};

// Calcular distribuição temporal das transações
const calcularDistribuicaoTemporal = (transacoes) => {
  const porSemana = { 1: 0, 2: 0, 3: 0, 4: 0 }; // Semanas do mês
  const porDiaSemana = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // Dom-Sab

  transacoes.forEach(t => {
    const data = new Date(t.data);
    const semanaDoMes = Math.ceil(data.getDate() / 7);
    const diaSemana = data.getDay();

    porSemana[semanaDoMes] = (porSemana[semanaDoMes] || 0) + (t.valor || 0);
    porDiaSemana[diaSemana] += (t.valor || 0);
  });

  return { porSemana, porDiaSemana };
};

// Comparar duas faturas
export const compararFaturas = (fatura1, fatura2) => {
  if (!fatura1 || !fatura2) return null;

  const diferencaValor = fatura2.valor_total_fatura - fatura1.valor_total_fatura;
  const percentualVariacao = fatura1.valor_total_fatura > 0 ? 
    (diferencaValor / fatura1.valor_total_fatura) * 100 : 0;

  const diferencaTransacoes = fatura2.total_compras - fatura1.total_compras;

  return {
    valor: {
      diferenca: diferencaValor,
      percentual: percentualVariacao,
      situacao: diferencaValor > 0 ? 'aumento' : diferencaValor < 0 ? 'reducao' : 'igual'
    },
    transacoes: {
      diferenca: diferencaTransacoes,
      percentual: fatura1.total_compras > 0 ? (diferencaTransacoes / fatura1.total_compras) * 100 : 0,
      situacao: diferencaTransacoes > 0 ? 'aumento' : diferencaTransacoes < 0 ? 'reducao' : 'igual'
    }
  };
};

// Gerar opções de período para seleção
export const gerarOpcoesPeriodo = (mesesAntes = 3, mesesDepois = 3) => {
  const opcoes = [];
  const hoje = new Date();

  for (let i = -mesesAntes; i <= mesesDepois; i++) {
    const data = addMonths(hoje, i);
    const anoMes = format(data, 'yyyy-MM');
    
    opcoes.push({
      value: anoMes,
      label: format(data, 'MMMM yyyy', { locale: ptBR }),
      isCurrent: i === 0,
      isPast: i < 0,
      isFuture: i > 0,
      data
    });
  }

  return opcoes;
};

// Filtrar faturas por critérios
export const filtrarFaturas = (faturas, filtros) => {
  return faturas.filter(fatura => {
    // Filtro por cartão
    if (filtros.cartaoId && fatura.cartao_id !== filtros.cartaoId) {
      return false;
    }

    // Filtro por período
    if (filtros.anoMes) {
      const faturaAnoMes = format(new Date(fatura.fatura_vencimento), 'yyyy-MM');
      if (faturaAnoMes !== filtros.anoMes) {
        return false;
      }
    }

    // Filtro por status
    if (filtros.status && fatura.status?.status !== filtros.status) {
      return false;
    }

    // Filtro por valor mínimo
    if (filtros.valorMinimo && fatura.valor_total_fatura < filtros.valorMinimo) {
      return false;
    }

    // Filtro por valor máximo
    if (filtros.valorMaximo && fatura.valor_total_fatura > filtros.valorMaximo) {
      return false;
    }

    return true;
  });
};

// Obter resumo geral das faturas
export const obterResumoFaturas = (faturas) => {
  if (!faturas || faturas.length === 0) {
    return {
      totalFaturas: 0,
      valorTotal: 0,
      valorMedio: 0,
      proximasVencer: 0,
      vencidas: 0,
      emDia: 0
    };
  }

  const totalFaturas = faturas.length;
  const valorTotal = faturas.reduce((acc, f) => acc + f.valor_total_fatura, 0);
  const valorMedio = valorTotal / totalFaturas;

  // Contadores por status
  const contadores = faturas.reduce((acc, fatura) => {
    const status = fatura.status?.status || 'em_dia';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalFaturas,
    valorTotal,
    valorMedio,
    proximasVencer: (contadores.vence_breve || 0) + (contadores.proximo_vencimento || 0),
    vencidas: contadores.vencida || 0,
    emDia: contadores.em_dia || 0,
    distribuicaoPorStatus: contadores
  };
};

// Validar dados de fatura
export const validarDadosFatura = (dadosFatura) => {
  const erros = [];

  if (!dadosFatura.cartao_id) {
    erros.push('Cartão é obrigatório');
  }

  if (!dadosFatura.fatura_vencimento) {
    erros.push('Data de vencimento é obrigatória');
  }

  if (!dadosFatura.valor_total_fatura || dadosFatura.valor_total_fatura <= 0) {
    erros.push('Valor da fatura deve ser maior que zero');
  }

  if (!dadosFatura.transacoes || dadosFatura.transacoes.length === 0) {
    erros.push('Fatura deve conter pelo menos uma transação');
  }

  return {
    valido: erros.length === 0,
    erros
  };
};

export default {
  calcularDataVencimentoFatura,
  determinarStatusFatura,
  agruparTransacoesPorFatura,
  formatarPeriodoFatura,
  calcularEstatisticasFatura,
  compararFaturas,
  gerarOpcoesPeriodo,
  filtrarFaturas,
  obterResumoFaturas,
  validarDadosFatura
};