// src/shared/schemas/messages.js

/**
 * Mensagens de erro padronizadas para validação
 * Centraliza todas as mensagens para facilitar manutenção e i18n
 */

// ═══════════════════════════════════════════════════════════════
// 🎯 MENSAGENS GENÉRICAS
// ═══════════════════════════════════════════════════════════════

export const GenericMessages = {
  required: (field) => `${field} é obrigatório`,
  invalid: (field) => `${field} é inválido`,
  minLength: (field, min) => `${field} deve ter pelo menos ${min} caracteres`,
  maxLength: (field, max) => `${field} deve ter no máximo ${max} caracteres`,
  minValue: (field, min) => `${field} deve ser pelo menos ${min}`,
  maxValue: (field, max) => `${field} não pode exceder ${max}`,
  mustBeNumber: (field) => `${field} deve ser um número`,
  mustBeInteger: (field) => `${field} deve ser um número inteiro`,
  mustBePositive: (field) => `${field} deve ser positivo`,
  invalidFormat: (field) => `Formato de ${field} inválido`,
  cannotBeEmpty: (field) => `${field} não pode estar vazio`,
  onlySpaces: (field) => `${field} não pode conter apenas espaços`
};

// ═══════════════════════════════════════════════════════════════
// 🎯 MENSAGENS ESPECÍFICAS POR CAMPO
// ═══════════════════════════════════════════════════════════════

export const FieldMessages = {
  
  // 💰 Valores monetários
  valor: {
    required: "Valor é obrigatório",
    positive: "Valor deve ser maior que zero",
    tooHigh: "Valor não pode exceder R$ 1.000.000,00",
    invalid: "Valor deve ser um número válido",
    format: "Use o formato: 1.234,56"
  },
  
  // 📅 Datas
  data: {
    required: "Data é obrigatória",
    invalid: "Data inválida",
    future: "Data não pode ser futura",
    past: "Data não pode ser passada",
    format: "Use o formato: DD/MM/AAAA"
  },
  
  // 📝 Descrições e nomes
  nome: {
    required: "Nome é obrigatório",
    tooShort: "Nome deve ter pelo menos 1 caractere",
    tooLong: "Nome deve ter no máximo 100 caracteres",
    onlySpaces: "Nome não pode ser apenas espaços"
  },
  
  descricao: {
    required: "Descrição é obrigatória",
    tooShort: "Descrição deve ter pelo menos 1 caractere",
    tooLong: "Descrição deve ter no máximo 255 caracteres",
    onlySpaces: "Descrição não pode ser apenas espaços"
  },
  
  // 💬 Observações
  observacoes: {
    tooLong: "Observações devem ter no máximo 300 caracteres"
  },
  
  // 🔗 Seleções obrigatórias
  categoria: {
    required: "Categoria é obrigatória",
    invalid: "Categoria selecionada é inválida"
  },
  
  conta: {
    required: "Conta é obrigatória",
    invalid: "Conta selecionada é inválida"
  },
  
  cartao: {
    required: "Cartão é obrigatório",
    invalid: "Cartão selecionado é inválido"
  },
  
  // 🎨 Cores
  cor: {
    invalid: "Cor deve estar no formato #RRGGBB",
    required: "Cor é obrigatória"
  },
  
  // 🔢 Números específicos
  parcelas: {
    min: "Mínimo 1 parcela",
    max: "Máximo 48 parcelas",
    integer: "Número de parcelas deve ser inteiro",
    minForInstallment: "Mínimo 2 parcelas para parcelamento"
  },
  
  recorrencias: {
    min: "Mínimo 1 recorrência",
    max: "Máximo 60 recorrências",
    integer: "Número de recorrências deve ser inteiro",
    minForRecurring: "Mínimo 2 recorrências para repetição"
  },
  
  // 📅 Dias do mês
  diaFechamento: {
    min: "Dia deve ser entre 1 e 31",
    max: "Dia deve ser entre 1 e 31",
    integer: "Dia deve ser um número inteiro",
    required: "Dia de fechamento é obrigatório"
  },
  
  diaVencimento: {
    min: "Dia deve ser entre 1 e 31",
    max: "Dia deve ser entre 1 e 31",
    integer: "Dia deve ser um número inteiro",
    required: "Dia de vencimento é obrigatório",
    differentFromClosure: "Dia de vencimento deve ser diferente do fechamento"
  },
  
  // 🏦 Específicos de conta
  banco: {
    tooLong: "Nome do banco deve ter no máximo 50 caracteres"
  },
  
  saldo: {
    tooLow: "Saldo muito baixo",
    tooHigh: "Saldo muito alto",
    invalid: "Saldo deve ser um número válido"
  },
  
  // 💳 Específicos de cartão
  bandeira: {
    required: "Bandeira é obrigatória",
    tooLong: "Bandeira deve ter no máximo 50 caracteres"
  },
  
  limite: {
    positive: "Limite deve ser positivo",
    tooHigh: "Limite muito alto"
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎯 MENSAGENS POR CONTEXTO/MODAL
// ═══════════════════════════════════════════════════════════════

export const ContextMessages = {
  
  // 💸 Despesas
  despesa: {
    form: {
      title: "Nova Despesa",
      subtitle: "Registre um novo gasto",
      success: "Despesa registrada com sucesso!",
      error: "Erro ao registrar despesa"
    },
    validation: {
      parcelaMinValue: "Para parcelar, valor mínimo deve ser R$ 10,00",
      parcelaMinCount: "Despesa parcelada deve ter pelo menos 2 parcelas",
      recorrenciaMinCount: "Despesa recorrente deve ter pelo menos 2 recorrências",
      firstParcelaRequired: "Data da primeira parcela é obrigatória"
    }
  },
  
  // 💳 Despesas Cartão
  despesaCartao: {
    form: {
      title: "Despesa com Cartão",
      subtitle: "Registre compras no cartão de crédito",
      success: "Despesa de cartão registrada com sucesso!",
      error: "Erro ao registrar despesa de cartão"
    },
    validation: {
      minValueForInstallment: "Para parcelar, valor mínimo deve ser R$ 10,00",
      faturaRequired: "Fatura de vencimento é obrigatória"
    }
  },
  
  // 💰 Receitas
  receita: {
    form: {
      title: "Nova Receita",
      subtitle: "Registre uma nova entrada",
      success: "Receita registrada com sucesso!",
      error: "Erro ao registrar receita"
    }
  },
  
  // 🏦 Contas
  conta: {
    form: {
      title: "Gerenciar Contas",
      subtitle: "Adicione ou edite suas contas",
      success: "Conta salva com sucesso!",
      error: "Erro ao salvar conta"
    },
    validation: {
      balanceChange: "Alteração de saldo detectada",
      createTransaction: "Criar transação de correção",
      adjustBalance: "Ajustar saldo inicial"
    }
  },
  
  // 💳 Cartões
  cartao: {
    form: {
      title: "Gerenciar Cartões",
      subtitle: "Adicione ou edite seus cartões",
      success: "Cartão salvo com sucesso!",
      error: "Erro ao salvar cartão"
    },
    validation: {
      differentDays: "Dia de fechamento deve ser diferente do dia de vencimento"
    }
  },
  
  // 🏷️ Categorias
  categoria: {
    form: {
      title: "Gerenciar Categorias",
      subtitle: "Organize suas categorias e subcategorias",
      success: "Categoria salva com sucesso!",
      error: "Erro ao salvar categoria"
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎯 MENSAGENS DE SISTEMA
// ═══════════════════════════════════════════════════════════════

export const SystemMessages = {
  loading: {
    generic: "Carregando...",
    saving: "Salvando...",
    validating: "Validando...",
    processing: "Processando...",
    loadingData: "Carregando dados...",
    submitting: "Enviando..."
  },
  
  success: {
    saved: "Salvo com sucesso!",
    updated: "Atualizado com sucesso!",
    deleted: "Excluído com sucesso!",
    created: "Criado com sucesso!"
  },
  
  error: {
    generic: "Ocorreu um erro inesperado",
    network: "Erro de conexão. Verifique sua internet",
    validation: "Por favor, corrija os erros no formulário",
    required: "Preencha todos os campos obrigatórios",
    unauthorized: "Você não tem permissão para esta ação",
    notFound: "Item não encontrado",
    conflict: "Já existe um item com estes dados"
  },
  
  confirm: {
    delete: "Tem certeza que deseja excluir?",
    discard: "Descartar alterações?",
    overwrite: "Sobrescrever dados existentes?"
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎯 HELPERS PARA GERAÇÃO DE MENSAGENS
// ═══════════════════════════════════════════════════════════════

/**
 * Gera mensagem formatada com valores dinâmicos
 * @param {string} template - Template da mensagem
 * @param {Object} values - Valores para substituição
 * @returns {string} - Mensagem formatada
 */
export const formatMessage = (template, values = {}) => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] || match;
  });
};

/**
 * Obtém mensagem específica por caminho
 * @param {string} path - Caminho da mensagem (ex: "despesa.validation.parcelaMinValue")
 * @param {Object} values - Valores para substituição
 * @returns {string} - Mensagem encontrada ou padrão
 */
export const getMessage = (path, values = {}) => {
  const pathArray = path.split('.');
  let current = { ...FieldMessages, ...ContextMessages, ...SystemMessages };
  
  for (const key of pathArray) {
    if (current[key]) {
      current = current[key];
    } else {
      return `Mensagem não encontrada: ${path}`;
    }
  }
  
  if (typeof current === 'string') {
    return formatMessage(current, values);
  }
  
  return `Mensagem inválida: ${path}`;
};

/**
 * Obtém mensagem de erro para um campo específico
 * @param {string} field - Nome do campo
 * @param {string} type - Tipo do erro
 * @param {any} value - Valor adicional (ex: limite)
 * @returns {string} - Mensagem de erro
 */
export const getFieldError = (field, type, value = null) => {
  const fieldMessages = FieldMessages[field];
  
  if (fieldMessages && fieldMessages[type]) {
    return typeof fieldMessages[type] === 'function' 
      ? fieldMessages[type](value)
      : fieldMessages[type];
  }
  
  // Fallback para mensagens genéricas
  const genericMessage = GenericMessages[type];
  if (genericMessage) {
    return typeof genericMessage === 'function'
      ? genericMessage(field, value)
      : genericMessage;
  }
  
  return `Erro em ${field}`;
};

// ═══════════════════════════════════════════════════════════════
// 🎯 MENSAGENS PARA TIPOS ESPECÍFICOS
// ═══════════════════════════════════════════════════════════════

export const TypeMessages = {
  despesa: {
    simples: "Despesa simples",
    recorrente: "Despesa recorrente", 
    parcelada: "Despesa parcelada"
  },
  
  receita: {
    simples: "Receita simples",
    recorrente: "Receita recorrente"
  },
  
  conta: {
    corrente: "Conta Corrente",
    poupanca: "Poupança", 
    investimento: "Investimentos",
    carteira: "Carteira"
  },
  
  recorrencia: {
    semanal: "Semanal",
    quinzenal: "Quinzenal", 
    mensal: "Mensal",
    anual: "Anual"
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎯 EXPORTAÇÕES PRINCIPAIS
// ═══════════════════════════════════════════════════════════════

export default {
  Generic: GenericMessages,
  Field: FieldMessages,
  Context: ContextMessages,
  System: SystemMessages,
  Type: TypeMessages,
  formatMessage,
  getMessage,
  getFieldError
};