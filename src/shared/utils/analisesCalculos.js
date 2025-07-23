// src/shared/utils/analisesCalculos.js
import { subMonths, differenceInDays, format } from 'date-fns';

// ===== CÁLCULOS BÁSICOS =====

/**
 * Calcula a média de receitas dos últimos N meses
 * @param {Array} transacoes - Array de transações
 * @param {number} meses - Número de meses para análise (padrão: 3)
 * @returns {number} Média mensal de receitas
 */
export const calcularMediaReceitas = (transacoes, meses = 3) => {
  if (!transacoes || transacoes.length === 0) return 0;
  
  const dataLimite = subMonths(new Date(), meses);
  
  const receitasRecentes = transacoes.filter(t => 
    t.tipo === 'receita' && 
    new Date(t.data) >= dataLimite &&
    !t.deletada &&
    t.valor > 0
  );
  
  if (receitasRecentes.length === 0) return 0;
  
  const totalReceitas = receitasRecentes.reduce((sum, t) => sum + (t.valor || 0), 0);
  return totalReceitas / meses;
};

/**
 * Calcula a média de despesas dos últimos N meses
 * @param {Array} transacoes - Array de transações
 * @param {number} meses - Número de meses para análise (padrão: 3)
 * @returns {number} Média mensal de despesas
 */
export const calcularMediaDespesas = (transacoes, meses = 3) => {
  if (!transacoes || transacoes.length === 0) return 0;
  
  const dataLimite = subMonths(new Date(), meses);
  
  const despesasRecentes = transacoes.filter(t => 
    t.tipo === 'despesa' && 
    new Date(t.data) >= dataLimite &&
    !t.deletada &&
    t.valor > 0
  );
  
  if (despesasRecentes.length === 0) return 0;
  
  const totalDespesas = despesasRecentes.reduce((sum, t) => sum + (t.valor || 0), 0);
  return totalDespesas / meses;
};

/**
 * Calcula o saldo médio mensal
 * @param {Array} transacoes - Array de transações
 * @param {number} meses - Número de meses para análise (padrão: 3)
 * @returns {number} Saldo médio mensal
 */
export const calcularSaldoMedio = (transacoes, meses = 3) => {
  const receitas = calcularMediaReceitas(transacoes, meses);
  const despesas = calcularMediaDespesas(transacoes, meses);
  return receitas - despesas;
};

// ===== ANÁLISE DE CATEGORIAS =====

/**
 * Calcula quantas horas de trabalho são necessárias para pagar determinado valor
 * @param {number} valorMensal - Valor mensal da categoria
 * @param {number} receitaMensal - Receita mensal total
 * @returns {number} Horas de trabalho necessárias
 */
export const calcularHorasTrabalho = (valorMensal, receitaMensal) => {
  if (!receitaMensal || receitaMensal <= 0) return 0;
  
  // Considera 22 dias úteis por mês, 8 horas por dia
  const horasTrabalhadasPorMes = 22 * 8;
  const salarioPorHora = receitaMensal / horasTrabalhadasPorMes;
  
  return Math.ceil(valorMensal / salarioPorHora);
};

/**
 * Mapeia categorias para ícones padrão
 * @param {string} nomeCategoria - Nome da categoria
 * @returns {string} Ícone emoji da categoria
 */
const obterIconeCategoria = (nomeCategoria) => {
  if (!nomeCategoria) return '📝';
  
  const categoria = nomeCategoria.toLowerCase();
  
  // Mapeamento de categorias comuns para ícones
  const mapeamento = {
    'alimentacao': '🍽️',
    'alimentação': '🍽️',
    'comida': '🍽️',
    'supermercado': '🛒',
    'mercado': '🛒',
    'transporte': '🚗',
    'combustivel': '⛽',
    'combustível': '⛽',
    'gasolina': '⛽',
    'uber': '🚕',
    'taxi': '🚕',
    'moradia': '🏠',
    'aluguel': '🏠',
    'casa': '🏠',
    'condominio': '🏠',
    'condomínio': '🏠',
    'saude': '💊',
    'saúde': '💊',
    'medico': '👩‍⚕️',
    'médico': '👩‍⚕️',
    'farmacia': '💊',
    'farmácia': '💊',
    'lazer': '🎉',
    'entretenimento': '🎬',
    'cinema': '🎬',
    'restaurante': '🍽️',
    'bar': '🍺',
    'viagem': '✈️',
    'educacao': '📚',
    'educação': '📚',
    'escola': '🎓',
    'curso': '📖',
    'roupas': '👕',
    'vestuario': '👗',
    'vestuário': '👗',
    'shopping': '🛍️',
    'cartao': '💳',
    'cartão': '💳',
    'financiamento': '🏦',
    'emprestimo': '💰',
    'empréstimo': '💰',
    'investimento': '📈',
    'poupanca': '💰',
    'poupança': '💰',
    'trabalho': '💼',
    'salario': '💰',
    'salário': '💰',
    'freelance': '💻',
    'outros': '📝',
    'diversos': '📄'
  };
  
  // Busca por palavras-chave
  for (const [chave, icone] of Object.entries(mapeamento)) {
    if (categoria.includes(chave)) {
      return icone;
    }
  }
  
  return '📝'; // Ícone padrão
};

/**
 * Analisa gastos por categoria e retorna informações detalhadas
 * @param {Array} transacoes - Array de transações
 * @param {number} receitas - Receita mensal média
 * @param {number} meses - Número de meses para análise (padrão: 3)
 * @returns {Object} Análise detalhada por categoria
 */
export const analisarGastosPorCategoria = (transacoes, receitas, meses = 3) => {
  if (!transacoes || transacoes.length === 0) {
    return {
      todas: [],
      principais: [],
      totalCategorias: 0,
      representatividadePrincipais: 0
    };
  }
  
  const dataLimite = subMonths(new Date(), meses);
  
  const despesasRecentes = transacoes.filter(t => 
    t.tipo === 'despesa' && 
    new Date(t.data) >= dataLimite &&
    !t.deletada &&
    t.valor > 0
  );
  
  if (despesasRecentes.length === 0) {
    return {
      todas: [],
      principais: [],
      totalCategorias: 0,
      representatividadePrincipais: 0
    };
  }
  
  // Agrupar por categoria
  const gastosPorCategoria = despesasRecentes.reduce((acc, transacao) => {
    const categoria = transacao.categoria_nome || 'Sem categoria';
    const icone = transacao.categoria_icone || obterIconeCategoria(categoria);
    
    if (!acc[categoria]) {
      acc[categoria] = {
        nome: categoria,
        icone,
        valor: 0,
        quantidade: 0,
        transacoes: []
      };
    }
    
    acc[categoria].valor += transacao.valor || 0;
    acc[categoria].quantidade += 1;
    acc[categoria].transacoes.push(transacao);
    
    return acc;
  }, {});
  
  // Converter para array e calcular métricas
  const categorias = Object.values(gastosPorCategoria)
    .map(categoria => ({
      ...categoria,
      valorMedio: categoria.valor / meses,
      percentualRenda: receitas > 0 ? (categoria.valor / meses / receitas) * 100 : 0,
      horasTrabalho: calcularHorasTrabalho(categoria.valor / meses, receitas),
      percentualDespesas: 0 // Calculado depois
    }))
    .sort((a, b) => b.valorMedio - a.valorMedio);
  
  // Calcular percentual das despesas totais
  const totalDespesas = categorias.reduce((sum, c) => sum + c.valorMedio, 0);
  categorias.forEach(categoria => {
    categoria.percentualDespesas = totalDespesas > 0 ? (categoria.valorMedio / totalDespesas) * 100 : 0;
  });
  
  // Selecionar categorias até representar 90% das despesas
  let acumulado = 0;
  const categoriasPrincipais = [];
  
  for (const categoria of categorias) {
    categoriasPrincipais.push(categoria);
    acumulado += categoria.valorMedio;
    
    if (totalDespesas > 0 && (acumulado / totalDespesas) >= 0.9) {
      break;
    }
  }
  
  return {
    todas: categorias,
    principais: categoriasPrincipais,
    totalCategorias: categorias.length,
    representatividadePrincipais: totalDespesas > 0 ? (acumulado / totalDespesas) * 100 : 0
  };
};

// ===== SAÚDE FINANCEIRA =====

/**
 * Calcula a saúde financeira atual com base nas transações
 * @param {Array} transacoes - Array de transações
 * @param {number} meses - Número de meses para análise (padrão: 3)
 * @returns {Object} Análise completa da saúde financeira
 */
export const calcularSaudeFinanceira = (transacoes, meses = 3) => {
  const receitas = calcularMediaReceitas(transacoes, meses);
  const despesas = calcularMediaDespesas(transacoes, meses);
  const saldo = receitas - despesas;
  const comprometimento = receitas > 0 ? (despesas / receitas) * 100 : 100;
  
  // Determinar status da situação
  let status;
  if (saldo < 0) {
    status = {
      tipo: 'critica',
      icone: '🔴',
      titulo: 'Situação Crítica',
      descricao: 'Suas despesas excedem suas receitas. É necessário ação imediata.',
      cor: 'danger'
    };
  } else if (receitas === 0) {
    status = {
      tipo: 'sem_dados',
      icone: '⚪',
      titulo: 'Dados Insuficientes',
      descricao: 'Continue registrando transações para análise completa.',
      cor: 'neutral'
    };
  } else if (saldo / receitas < 0.05) {
    status = {
      tipo: 'atencao',
      icone: '🟡',
      titulo: 'Situação de Atenção',
      descricao: 'Margem muito baixa para emergências. Revisar gastos.',
      cor: 'warning'
    };
  } else if (saldo / receitas < 0.15) {
    status = {
      tipo: 'regular',
      icone: '🟠',
      titulo: 'Situação Regular',
      descricao: 'Situação estável, mas há oportunidades de melhoria.',
      cor: 'info'
    };
  } else if (saldo / receitas < 0.25) {
    status = {
      tipo: 'boa',
      icone: '🟢',
      titulo: 'Situação Boa',
      descricao: 'Finanças equilibradas com boa margem de segurança.',
      cor: 'success'
    };
  } else {
    status = {
      tipo: 'excelente',
      icone: '🟢',
      titulo: 'Situação Excelente',
      descricao: 'Ótima capacidade de poupança e investimento.',
      cor: 'success'
    };
  }
  
  return {
    receitas,
    despesas,
    saldo,
    comprometimento,
    taxaPoupanca: receitas > 0 ? Math.max(0, (saldo / receitas) * 100) : 0,
    diasTrabalhadosParaDespesas: receitas > 0 ? Math.ceil((despesas / receitas) * 30) : 30,
    status
  };
};

// ===== PROJEÇÕES FUTURAS =====

/**
 * Calcula projeção futura baseada no saldo mensal atual
 * @param {number} saldoMensal - Saldo mensal atual
 * @param {number} meses - Número de meses para projetar (padrão: 24)
 * @returns {Object} Projeções futuras detalhadas
 */
export const calcularProjecaoFutura = (saldoMensal, meses = 24) => {
  const projecoes = [];
  let acumulado = 0;
  
  for (let mes = 1; mes <= meses; mes++) {
    acumulado += saldoMensal;
    projecoes.push({
      mes,
      saldoMensal,
      saldoAcumulado: acumulado,
      situacao: acumulado >= 0 ? 'positiva' : 'negativa'
    });
  }
  
  return {
    projecoes,
    em6Meses: saldoMensal * 6,
    em12Meses: saldoMensal * 12,
    em24Meses: saldoMensal * 24,
    tendencia: saldoMensal >= 0 ? 'crescimento' : 'endividamento',
    pontoEquilibrio: saldoMensal < 0 ? Math.ceil(Math.abs(saldoMensal)) : null,
    saldoMensal
  };
};

// ===== SIMULAÇÃO DE INVESTIMENTO =====

/**
 * Simula o resultado de economizar uma porcentagem das despesas e investir
 * @param {number} despesasMensais - Despesas mensais atuais
 * @param {number} percentualEconomia - Percentual de economia (padrão: 0.1 = 10%)
 * @param {number} taxaAnual - Taxa anual de rendimento (padrão: 0.15 = 15%)
 * @returns {Object} Simulação de economia e investimento
 */
export const simularEconomiaInvestimento = (despesasMensais, percentualEconomia = 0.1, taxaAnual = 0.15) => {
  const economiaMonsal = despesasMensais * percentualEconomia;
  const taxaMensal = Math.pow(1 + taxaAnual, 1/12) - 1;
  
  /**
   * Calcula rendimento para determinado período em anos
   * @param {number} anos - Período em anos
   * @returns {Object} Resultado do investimento
   */
  const calcularRendimento = (anos) => {
    const meses = anos * 12;
    
    if (meses === 0 || economiaMonsal === 0) {
      return {
        anos,
        valorInvestido: 0,
        montanteFinal: 0,
        rendimento: 0,
        multiplicador: 1
      };
    }
    
    // Fórmula de juros compostos para anuidade (pagamentos mensais)
    // FV = PMT × [((1 + r)^n - 1) / r]
    const montante = economiaMonsal * (Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal;
    const valorInvestido = economiaMonsal * meses;
    const rendimento = montante - valorInvestido;
    
    return {
      anos,
      valorInvestido,
      montanteFinal: montante,
      rendimento,
      multiplicador: valorInvestido > 0 ? montante / valorInvestido : 1
    };
  };
  
  return {
    premissas: {
      economiaMonsal,
      percentualEconomia: percentualEconomia * 100,
      taxaAnual: taxaAnual * 100,
      baseCalculo: despesasMensais
    },
    projecoes: [
      calcularRendimento(5),
      calcularRendimento(10), 
      calcularRendimento(20),
      calcularRendimento(30)
    ],
    impactoImediato: {
      sobraMensalExtra: economiaMonsal,
      emUmAno: economiaMonsal * 12 * (1 + taxaAnual/2), // Rendimento médio no primeiro ano
      tempoParaDobrar: taxaAnual > 0 ? Math.log(2) / Math.log(1 + taxaAnual) : Infinity
    }
  };
};

// ===== FUNÇÕES DE VERIFICAÇÃO =====

/**
 * Verifica se há dados suficientes para análise
 * @param {Array} transacoes - Array de transações
 * @returns {Object} Status de elegibilidade
 */
export const verificarElegibilidadeAnalise = (transacoes) => {
  if (!transacoes || transacoes.length === 0) {
    return {
      elegivel: false,
      motivo: 'Nenhuma transação encontrada',
      progresso: 0
    };
  }

  if (transacoes.length < 10) {
    return {
      elegivel: false,
      motivo: `Mínimo de 10 transações necessárias (atual: ${transacoes.length})`,
      progresso: transacoes.length / 10
    };
  }

  const temReceitas = transacoes.some(t => t.tipo === 'receita' && !t.deletada && t.valor > 0);
  if (!temReceitas) {
    return {
      elegivel: false,
      motivo: 'Necessário ter pelo menos uma receita registrada',
      progresso: 0.5
    };
  }

  const temDespesas = transacoes.some(t => t.tipo === 'despesa' && !t.deletada && t.valor > 0);
  if (!temDespesas) {
    return {
      elegivel: false,
      motivo: 'Necessário ter pelo menos uma despesa registrada',
      progresso: 0.7
    };
  }

  const categorias = [...new Set(transacoes.map(t => t.categoria_nome))].filter(Boolean).length;
  if (categorias < 2) {
    return {
      elegivel: false,
      motivo: 'Necessário usar pelo menos 2 categorias diferentes',
      progresso: 0.8
    };
  }

  // Verificar se há transações nos últimos 60 dias
  const dataLimite = subMonths(new Date(), 2);
  const transacoesRecentes = transacoes.filter(t => 
    new Date(t.data) >= dataLimite && !t.deletada
  );
  
  if (transacoesRecentes.length < 5) {
    return {
      elegivel: false,
      motivo: 'Necessário ter atividade financeira recente (últimos 2 meses)',
      progresso: 0.9
    };
  }

  return { 
    elegivel: true, 
    progresso: 1,
    motivo: 'Dados suficientes para análise completa'
  };
};