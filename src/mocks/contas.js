// src/data/contas.js

/**
 * Dados mockados para contas financeiras
 * Serão usados durante o desenvolvimento, antes da integração com Supabase
 */
export const contasData = [
  {
    id: '1',
    nome: 'Conta Corrente Principal',
    tipo: 'corrente',
    instituicao: 'Banco do Brasil',
    cor: '#2196F3',
    icone: 'landmark',
    saldo: 5432.75,
    ultimaAtualizacao: '2023-05-31T10:15:30Z',
    ativo: true,
    ordem: 1
  },
  {
    id: '2',
    nome: 'Poupança',
    tipo: 'poupanca',
    instituicao: 'Banco do Brasil',
    cor: '#4CAF50',
    icone: 'piggy-bank',
    saldo: 15750.20,
    ultimaAtualizacao: '2023-05-31T10:15:30Z',
    ativo: true,
    ordem: 2
  },
  {
    id: '3',
    nome: 'Carteira',
    tipo: 'dinheiro',
    instituicao: null,
    cor: '#FFC107',
    icone: 'wallet',
    saldo: 250.00,
    ultimaAtualizacao: '2023-05-30T18:45:00Z',
    ativo: true,
    ordem: 3
  },
  {
    id: '4',
    nome: 'Investimentos',
    tipo: 'investimento',
    instituicao: 'Nubank',
    cor: '#9C27B0',
    icone: 'trending-up',
    saldo: 40000.00,
    ultimaAtualizacao: '2023-05-31T10:15:30Z',
    ativo: true,
    ordem: 4
  },
  {
    id: '5',
    nome: 'Conta Secundária',
    tipo: 'corrente',
    instituicao: 'Itaú',
    cor: '#FF5722',
    icone: 'landmark',
    saldo: 2500.50,
    ultimaAtualizacao: '2023-05-31T10:15:30Z',
    ativo: true,
    ordem: 5
  },
  {
    id: '6',
    nome: 'Fundo de Emergência',
    tipo: 'poupanca',
    instituicao: 'Caixa',
    cor: '#00BCD4',
    icone: 'life-buoy',
    saldo: 8000.00,
    ultimaAtualizacao: '2023-05-31T10:15:30Z',
    ativo: true,
    ordem: 6
  },
  {
    id: '7',
    nome: 'Conta Antiga',
    tipo: 'corrente',
    instituicao: 'Santander',
    cor: '#607D8B',
    icone: 'landmark',
    saldo: 125.30,
    ultimaAtualizacao: '2023-01-15T14:22:10Z',
    ativo: false,
    ordem: 7
  }
];

/**
 * Definição de tipos de contas disponíveis
 */
export const tiposContas = [
  {
    id: 'corrente',
    nome: 'Conta Corrente',
    icone: 'landmark',
    descricao: 'Contas bancárias de uso diário'
  },
  {
    id: 'poupanca',
    nome: 'Poupança',
    icone: 'piggy-bank',
    descricao: 'Contas para guardar dinheiro com rendimento básico'
  },
  {
    id: 'investimento',
    nome: 'Investimento',
    icone: 'trending-up',
    descricao: 'Contas para investimentos diversos'
  },
  {
    id: 'dinheiro',
    nome: 'Dinheiro Físico',
    icone: 'wallet',
    descricao: 'Dinheiro em espécie/carteira'
  },
  {
    id: 'outros',
    nome: 'Outros',
    icone: 'more-horizontal',
    descricao: 'Outros tipos de contas financeiras'
  }
];

/**
 * Principais instituições financeiras para o autocomplete
 */
export const instituicoesFinanceiras = [
  { id: 'bb', nome: 'Banco do Brasil' },
  { id: 'caixa', nome: 'Caixa Econômica Federal' },
  { id: 'itau', nome: 'Itaú' },
  { id: 'bradesco', nome: 'Bradesco' },
  { id: 'santander', nome: 'Santander' },
  { id: 'nubank', nome: 'Nubank' },
  { id: 'inter', nome: 'Banco Inter' },
  { id: 'c6', nome: 'C6 Bank' },
  { id: 'xp', nome: 'XP Investimentos' },
  { id: 'btg', nome: 'BTG Pactual' },
  { id: 'neon', nome: 'Banco Neon' },
  { id: 'original', nome: 'Banco Original' },
  { id: 'next', nome: 'Banco Next' },
  { id: 'picpay', nome: 'PicPay' },
  { id: 'sicoob', nome: 'Sicoob' },
  { id: 'sicredi', nome: 'Sicredi' },
  { id: 'mercadopago', nome: 'Mercado Pago' },
  { id: 'pagbank', nome: 'PagBank' }
];

export default contasData;