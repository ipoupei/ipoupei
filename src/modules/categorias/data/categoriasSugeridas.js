// src/modules/categorias/data/categoriasSugeridas.js

/**
 * Categorias e subcategorias SIMPLIFICADAS para usuários iniciantes
 * Foco na clareza e facilidade de uso, evitando excesso de opções
 * Princípio: "Menos caixinhas, mais organização"
 */

export const categoriasSugeridasData = {
  receitas: [
    {
      id: 'receita_1',
      nome: 'Salário',
      cor: '#2563EB',
      icone: 'briefcase',
      subcategorias: [
        { nome: 'Salário mensal' },
        { nome: '13º salário e férias' },
        { nome: 'Bônus e PLR' },
        { nome: 'Horas extras' }
      ]
    },
    {
      id: 'receita_2',
      nome: 'Trabalhos extras',
      cor: '#059669',
      icone: 'dollar-sign',
      subcategorias: [
        { nome: 'Freelance e bicos' },
        { nome: 'Vendas' },
        { nome: 'Comissões' }
      ]
    },
    {
      id: 'receita_3',
      nome: 'Investimentos',
      cor: '#7C3AED',
      icone: 'trending-up',
      subcategorias: [
        { nome: 'Rendimentos de poupança' },
        { nome: 'Dividendos e juros' },
        { nome: 'Venda de investimentos' }
      ]
    },
    {
      id: 'receita_4',
      nome: 'Negócio próprio',
      cor: '#DC2626',
      icone: 'store',
      subcategorias: [
        { nome: 'Vendas do negócio' },
        { nome: 'Prestação de serviços' },
        { nome: 'Lucros' }
      ]
    },
    {
      id: 'receita_5',
      nome: 'Aluguéis',
      cor: '#EA580C',
      icone: 'home',
      subcategorias: [
        { nome: 'Aluguel de imóvel' },
        { nome: 'Airbnb e hospedagem' }
      ]
    },
    {
      id: 'receita_6',
      nome: 'Benefícios',
      cor: '#0891B2',
      icone: 'gift',
      subcategorias: [
        { nome: 'INSS e aposentadoria' },
        { nome: 'Auxílios governamentais' },
        { nome: 'Vale-alimentação e benefícios' }
      ]
    },
    {
      id: 'receita_7',
      nome: 'Transferências e PIX',
      cor: '#65A30D',
      icone: 'arrow-right',
      subcategorias: [
        { nome: 'PIX e transferências recebidas' },
        { nome: 'Depósitos' }
      ]
    },
    {
      id: 'receita_8',
      nome: 'Outros',
      cor: '#6B7280',
      icone: 'more-horizontal',
      subcategorias: [
        { nome: 'Presentes em dinheiro' },
        { nome: 'Restituição de IR' },
        { nome: 'Reembolsos' },
        { nome: 'Receitas diversas' }
      ]
    }
  ],

  despesas: [
    {
      id: 'despesa_1',
      nome: 'Moradia',
      cor: '#1E40AF',
      icone: 'home',
      subcategorias: [
        { nome: 'Aluguel ou financiamento' },
        { nome: 'Condomínio e IPTU' },
        { nome: 'Luz, água e gás' },
        { nome: 'Internet e TV' },
        { nome: 'Manutenção e reparos' }
      ]
    },
    {
      id: 'despesa_2',
      nome: 'Transporte',
      cor: '#B45309',
      icone: 'car',
      subcategorias: [
        { nome: 'Combustível' },
        { nome: 'Uber e transporte por app' },
        { nome: 'Transporte público' },
        { nome: 'Manutenção do carro' },
        { nome: 'IPVA e seguro' }
      ]
    },
    {
      id: 'despesa_3',
      nome: 'Alimentação',
      cor: '#059669',
      icone: 'utensils',
      subcategorias: [
        { nome: 'Supermercado' },
        { nome: 'Delivery e restaurantes' },
        { nome: 'Padaria e feira' }
      ]
    },
    {
      id: 'despesa_4',
      nome: 'Saúde',
      cor: '#DC2626',
      icone: 'heart',
      subcategorias: [
        { nome: 'Plano de saúde' },
        { nome: 'Farmácia e medicamentos' },
        { nome: 'Consultas e exames' },
        { nome: 'Academia e exercícios' }
      ]
    },
    {
      id: 'despesa_5',
      nome: 'Educação',
      cor: '#7C3AED',
      icone: 'book',
      subcategorias: [
        { nome: 'Escola e faculdade' },
        { nome: 'Cursos e capacitação' },
        { nome: 'Material escolar' }
      ]
    },
    {
      id: 'despesa_6',
      nome: 'Lazer',
      cor: '#EA580C',
      icone: 'smile',
      subcategorias: [
        { nome: 'Cinema e entretenimento' },
        { nome: 'Viagens e passeios' },
        { nome: 'Streaming e assinaturas' },
        { nome: 'Hobbies e diversão' }
      ]
    },
    {
      id: 'despesa_7',
      nome: 'Roupas e beleza',
      cor: '#0891B2',
      icone: 'shirt',
      subcategorias: [
        { nome: 'Roupas e calçados' },
        { nome: 'Salão e cuidados pessoais' },
        { nome: 'Acessórios e óculos' }
      ]
    },
    {
      id: 'despesa_8',
      nome: 'Família e filhos',
      cor: '#BE185D',
      icone: 'users',
      subcategorias: [
        { nome: 'Escola e creche' },
        { nome: 'Roupas e itens infantis' },
        { nome: 'Atividades das crianças' },
        { nome: 'Cuidados com filhos' }
      ]
    },
    {
      id: 'despesa_9',
      nome: 'Pets',
      cor: '#65A30D',
      icone: 'heart',
      subcategorias: [
        { nome: 'Ração e alimentação' },
        { nome: 'Veterinário e medicamentos' },
        { nome: 'Petshop e cuidados' }
      ]
    },
    {
      id: 'despesa_10',
      nome: 'Cartão e empréstimos',
      cor: '#991B1B',
      icone: 'credit-card',
      subcategorias: [
        { nome: 'Empréstimos e financiamentos' },
        { nome: 'Juros e taxas' }
      ]
    },
    {
      id: 'despesa_11',
      nome: 'Impostos e taxas',
      cor: '#7F1D1D',
      icone: 'file-text',
      subcategorias: [
        { nome: 'Imposto de Renda' },
        { nome: 'Tarifas bancárias' },
        { nome: 'Anuidades e taxas' }
      ]
    },
    {
      id: 'despesa_12',
      nome: 'Presentes e datas especiais',
      cor: '#C026D3',
      icone: 'gift',
      subcategorias: [
        { nome: 'Presentes de aniversário' },
        { nome: 'Natal e datas especiais' },
        { nome: 'Comemorações' }
      ]
    },
    {
      id: 'despesa_13',
      nome: 'Investimentos',
      cor: '#166534',
      icone: 'trending-up',
      subcategorias: [
        { nome: 'Aportes em poupança' },
        { nome: 'Investimentos diversos' },
        { nome: 'Previdência privada' }
      ]
    },
    {
      id: 'despesa_14',
      nome: 'Doações e ajuda',
      cor: '#A16207',
      icone: 'heart',
      subcategorias: [
        { nome: 'Igreja e dízimo' },
        { nome: 'Ajuda a familiares' },
        { nome: 'Doações diversas' }
      ]
    },
    {
      id: 'despesa_15',
      nome: 'Outros',
      cor: '#6B7280',
      icone: 'more-horizontal',
      subcategorias: [
        { nome: 'Gastos diversos' },
        { nome: 'Emergências' },
        { nome: 'Não classificado' }
      ]
    }
  ]
};

export default categoriasSugeridasData;