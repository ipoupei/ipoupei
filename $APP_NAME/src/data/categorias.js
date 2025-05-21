// src/data/categorias.js

/**
 * Dados mockados para categorias e subcategorias
 * Serão usados durante o desenvolvimento, antes da integração com Supabase
 */
export const categoriasData = {
  // Categorias de despesas
  despesas: [
    {
      id: '1',
      nome: 'Moradia',
      cor: '#2196F3',
      icone: 'home',
      tipo: 'despesa',
      subcategorias: [
        { id: '1-1', nome: 'Aluguel' },
        { id: '1-2', nome: 'Condomínio' },
        { id: '1-3', nome: 'IPTU' },
        { id: '1-4', nome: 'Conta de Luz' },
        { id: '1-5', nome: 'Conta de Água' },
        { id: '1-6', nome: 'Internet/TV' },
        { id: '1-7', nome: 'Manutenção' }
      ]
    },
    {
      id: '2',
      nome: 'Alimentação',
      cor: '#4CAF50',
      icone: 'utensils',
      tipo: 'despesa',
      subcategorias: [
        { id: '2-1', nome: 'Supermercado' },
        { id: '2-2', nome: 'Restaurantes' },
        { id: '2-3', nome: 'Delivery' },
        { id: '2-4', nome: 'Padaria' }
      ]
    },
    {
      id: '3',
      nome: 'Transporte',
      cor: '#FFC107',
      icone: 'car',
      tipo: 'despesa',
      subcategorias: [
        { id: '3-1', nome: 'Combustível' },
        { id: '3-2', nome: 'Transporte Público' },
        { id: '3-3', nome: 'Aplicativos de Transporte' },
        { id: '3-4', nome: 'Manutenção de Veículo' },
        { id: '3-5', nome: 'Estacionamento' },
        { id: '3-6', nome: 'IPVA/Licenciamento' }
      ]
    },
    {
      id: '4',
      nome: 'Saúde',
      cor: '#F44336',
      icone: 'heart',
      tipo: 'despesa',
      subcategorias: [
        { id: '4-1', nome: 'Plano de Saúde' },
        { id: '4-2', nome: 'Consultas Médicas' },
        { id: '4-3', nome: 'Medicamentos' },
        { id: '4-4', nome: 'Exames' },
        { id: '4-5', nome: 'Academia' }
      ]
    },
    {
      id: '5',
      nome: 'Educação',
      cor: '#9C27B0',
      icone: 'graduation-cap',
      tipo: 'despesa',
      subcategorias: [
        { id: '5-1', nome: 'Mensalidade Escolar' },
        { id: '5-2', nome: 'Cursos e Treinamentos' },
        { id: '5-3', nome: 'Material Escolar' },
        { id: '5-4', nome: 'Livros' }
      ]
    },
    {
      id: '6',
      nome: 'Lazer',
      cor: '#FF9800',
      icone: 'gamepad',
      tipo: 'despesa',
      subcategorias: [
        { id: '6-1', nome: 'Cinema/Teatro' },
        { id: '6-2', nome: 'Shows/Eventos' },
        { id: '6-3', nome: 'Viagens' },
        { id: '6-4', nome: 'Assinaturas de Streaming' },
        { id: '6-5', nome: 'Hobbies' }
      ]
    },
    {
      id: '7',
      nome: 'Vestuário',
      cor: '#00BCD4',
      icone: 'tshirt',
      tipo: 'despesa',
      subcategorias: [
        { id: '7-1', nome: 'Roupas' },
        { id: '7-2', nome: 'Calçados' },
        { id: '7-3', nome: 'Acessórios' }
      ]
    },
    {
      id: '8',
      nome: 'Despesas Pessoais',
      cor: '#607D8B',
      icone: 'user',
      tipo: 'despesa',
      subcategorias: [
        { id: '8-1', nome: 'Higiene Pessoal' },
        { id: '8-2', nome: 'Cabeleireiro/Barbearia' },
        { id: '8-3', nome: 'Cosméticos' },
        { id: '8-4', nome: 'Presentes' }
      ]
    },
    {
      id: '9',
      nome: 'Pets',
      cor: '#795548',
      icone: 'paw',
      tipo: 'despesa',
      subcategorias: [
        { id: '9-1', nome: 'Alimentação' },
        { id: '9-2', nome: 'Veterinário' },
        { id: '9-3', nome: 'Petshop/Higiene' },
        { id: '9-4', nome: 'Acessórios' }
      ]
    },
    {
      id: '10',
      nome: 'Impostos e Taxas',
      cor: '#FF5722',
      icone: 'receipt',
      tipo: 'despesa',
      subcategorias: [
        { id: '10-1', nome: 'Imposto de Renda' },
        { id: '10-2', nome: 'Tarifas Bancárias' },
        { id: '10-3', nome: 'Outros Impostos' }
      ]
    }
  ],
  
  // Categorias de receitas
  receitas: [
    {
      id: '21',
      nome: 'Salário',
      cor: '#2196F3',
      icone: 'briefcase',
      tipo: 'receita',
      subcategorias: [
        { id: '21-1', nome: 'Salário Principal' },
        { id: '21-2', nome: 'Horas Extras' },
        { id: '21-3', nome: 'Bônus' },
        { id: '21-4', nome: 'Participação nos Lucros' },
        { id: '21-5', nome: 'Décimo Terceiro' },
        { id: '21-6', nome: 'Férias' }
      ]
    },
    {
      id: '22',
      nome: 'Investimentos',
      cor: '#4CAF50',
      icone: 'chart-line',
      tipo: 'receita',
      subcategorias: [
        { id: '22-1', nome: 'Dividendos' },
        { id: '22-2', nome: 'Juros' },
        { id: '22-3', nome: 'Renda Fixa' },
        { id: '22-4', nome: 'Aluguel' },
        { id: '22-5', nome: 'Venda de Ativos' }
      ]
    },
    {
      id: '23',
      nome: 'Freelance',
      cor: '#FFC107',
      icone: 'laptop',
      tipo: 'receita',
      subcategorias: [
        { id: '23-1', nome: 'Consultoria' },
        { id: '23-2', nome: 'Projetos' },
        { id: '23-3', nome: 'Aulas Particulares' }
      ]
    },
    {
      id: '24',
      nome: 'Vendas',
      cor: '#F44336',
      icone: 'tag',
      tipo: 'receita',
      subcategorias: [
        { id: '24-1', nome: 'Produtos Físicos' },
        { id: '24-2', nome: 'Produtos Digitais' },
        { id: '24-3', nome: 'Itens Usados' }
      ]
    },
    {
      id: '25',
      nome: 'Presentes',
      cor: '#9C27B0',
      icone: 'gift',
      tipo: 'receita',
      subcategorias: [
        { id: '25-1', nome: 'Aniversário' },
        { id: '25-2', nome: 'Datas Especiais' },
        { id: '25-3', nome: 'Outros Presentes' }
      ]
    },
    {
      id: '26',
      nome: 'Reembolsos',
      cor: '#00BCD4',
      icone: 'undo',
      tipo: 'receita',
      subcategorias: [
        { id: '26-1', nome: 'Reembolso de Despesas' },
        { id: '26-2', nome: 'Devolução de Produtos' },
        { id: '26-3', nome: 'Reembolso de Seguros' }
      ]
    },
    {
      id: '27',
      nome: 'Outros',
      cor: '#607D8B',
      icone: 'dollar-sign',
      tipo: 'receita',
      subcategorias: [
        { id: '27-1', nome: 'Prêmios' },
        { id: '27-2', nome: 'Heranças' },
        { id: '27-3', nome: 'Doações' },
        { id: '27-4', nome: 'Receitas Diversas' }
      ]
    }
  ]
};

export default categoriasData;