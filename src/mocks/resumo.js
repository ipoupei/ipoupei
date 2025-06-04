// src/data/resumo.js

/**
 * Dados mockados para o resumo financeiro
 * Serão usados durante o desenvolvimento, antes da integração com Supabase
 */
export const resumoData = {
  // Dados do saldo geral
  saldo: {
    atual: 117624.00,
    previsto: 456.65,
    ultimaAtualizacao: '13/05/2025, 12:03'
  },
  
  // Dados de receitas
  receitas: {
    atual: 456.32,
    previsto: 456.65,
    ultimaAtualizacao: '13/05/2025, 12:03'
  },
  
  // Dados de despesas
  despesas: {
    atual: 456.32,
    previsto: 456.65,
    ultimaAtualizacao: '13/05/2025, 12:03'
  },
  
  // Dados de cartão de crédito
  cartaoCredito: {
    atual: 456.32,
    previsto: 456.65,
    ultimaAtualizacao: '13/05/2025, 12:03'
  },
  
  // Dados históricos (6 meses)
  historico: [
    { 
      mes: 'Dez', 
      receitas: 5500, 
      despesas: 3700, 
      saldo: 1800 
    },
    { 
      mes: 'Jan', 
      receitas: 7200, 
      despesas: 4100, 
      saldo: 3100 
    },
    { 
      mes: 'Fev', 
      receitas: 6800, 
      despesas: 3900, 
      saldo: 2900 
    },
    { 
      mes: 'Mar', 
      receitas: 6500, 
      despesas: 4500, 
      saldo: 2000 
    },
    { 
      mes: 'Abr', 
      receitas: 7000, 
      despesas: 3800, 
      saldo: 3200 
    },
    { 
      mes: 'Mai', 
      receitas: 7500, 
      despesas: 4200, 
      saldo: 3300 
    }
  ],
  
  // Metas financeiras
  metas: [
    {
      id: '1',
      titulo: 'Reserva de emergência',
      valorMeta: 15000,
      valorAtual: 8750,
      percentualConcluido: 58.3,
      dataLimite: '2023-12-31'
    },
    {
      id: '2',
      titulo: 'Viagem de férias',
      valorMeta: 5000,
      valorAtual: 3200,
      percentualConcluido: 64,
      dataLimite: '2023-07-15'
    },
    {
      id: '3',
      titulo: 'Entrada do apartamento',
      valorMeta: 50000,
      valorAtual: 12500,
      percentualConcluido: 25,
      dataLimite: '2024-06-30'
    }
  ],
  
  // Próximos lançamentos
  proximosLancamentos: [
    {
      id: '1',
      descricao: 'Pagamento de Aluguel',
      valor: 1800,
      data: '2023-06-10',
      tipo: 'despesa',
      categoria: 'Moradia',
      conta: 'Conta Corrente'
    },
    {
      id: '2',
      descricao: 'Salário',
      valor: 6500,
      data: '2023-06-05',
      tipo: 'receita',
      categoria: 'Salário',
      conta: 'Conta Corrente'
    },
    {
      id: '3',
      descricao: 'Fatura Cartão de Crédito',
      valor: 2300,
      data: '2023-06-15',
      tipo: 'despesa',
      categoria: 'Cartão de Crédito',
      conta: 'Conta Corrente'
    },
    {
      id: '4',
      descricao: 'Plano de Saúde',
      valor: 450,
      data: '2023-06-20',
      tipo: 'despesa',
      categoria: 'Saúde',
      conta: 'Conta Corrente'
    }
  ]
};

export default resumoData;