// src/shared/schemas/validation.schemas.js
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// 🧱 CAMPOS BASE REUTILIZÁVEIS
// ═══════════════════════════════════════════════════════════════

const BaseFields = {
  // 💰 Valores monetários - compatível com formatação brasileira
  valor: z.string()
    .min(1, "Valor é obrigatório")
    .transform(val => {
      if (!val) return 0;
      
      // Remove tudo exceto números, vírgula e ponto
      const valorLimpo = val.toString().replace(/[^\d,.-]/g, '');
      
      // Se tem vírgula, trata como formato brasileiro (123.456,78)
      if (valorLimpo.includes(',')) {
        const partes = valorLimpo.split(',');
        const inteira = partes[0].replace(/\./g, ''); // Remove pontos da parte inteira
        const decimal = partes[1] || '00';
        const numero = parseFloat(`${inteira}.${decimal}`);
        return isNaN(numero) ? 0 : numero;
      } else {
        // Se não tem vírgula, pode ser formato americano ou sem decimais
        const numero = parseFloat(valorLimpo.replace(/\./g, '')) / 100;
        return isNaN(numero) ? 0 : numero;
      }
    })
    .refine(val => val > 0, "Valor deve ser maior que zero")
    .refine(val => val <= 1000000, "Valor não pode exceder R$ 1.000.000,00"),

  // 📅 Datas
  data: z.string()
    .min(1, "Data é obrigatória")
    .refine(date => !isNaN(Date.parse(date)), "Data inválida"),

  dataPassada: z.string()
    .min(1, "Data é obrigatória")
    .refine(date => !isNaN(Date.parse(date)), "Data inválida")
    .refine(date => new Date(date) <= new Date(), "Data não pode ser futura"),

  // 📝 Textos básicos
  nome: z.string()
    .min(1, "Nome é obrigatório")
    .max(100, "Máximo 100 caracteres")
    .transform(str => str.trim())
    .refine(str => str.length > 0, "Nome não pode ser apenas espaços"),

  descricao: z.string()
    .min(1, "Descrição é obrigatória")
    .max(255, "Máximo 255 caracteres")
    .transform(str => str.trim())
    .refine(str => str.length > 0, "Descrição não pode ser apenas espaços"),

  textoOpcional: z.string()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .transform(str => str?.trim() || null),

  // 💬 Observações opcionais
  observacoes: z.string()
    .max(300, "Máximo 300 caracteres")
    .optional()
    .transform(str => str?.trim() || null),

  // 🔗 IDs de relacionamento
  id: z.string()
    .min(1, "Seleção obrigatória"),

  idOpcional: z.string()
    .optional()
    .nullable(),

  // 🔗 IDs UUID (para novos registros do Supabase)
  uuid: z.string()
    .uuid("ID inválido")
    .optional(),

  // 🎨 Cores hexadecimais
  cor: z.string()
    .regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato #RRGGBB")
    .default("#3B82F6"),

  // 🔢 Números inteiros positivos
  numeroPositivo: z.number()
    .int("Deve ser número inteiro")
    .min(1, "Deve ser maior que zero"),

  // 🔢 Parcelas (1-48)
  parcelas: z.number()
    .int("Deve ser número inteiro")
    .min(1, "Mínimo 1 parcela")
    .max(48, "Máximo 48 parcelas"),

  // 🔢 Recorrências (1-60)
  recorrencias: z.number()
    .int("Deve ser número inteiro")
    .min(1, "Mínimo 1 recorrência")
    .max(60, "Máximo 60 recorrências"),

  // 📊 Status/Boolean
  status: z.boolean().default(true),

  // 📅 Dias do mês (1-31)
  diaMes: z.number()
    .int("Deve ser número inteiro")
    .min(1, "Dia deve ser entre 1 e 31")
    .max(31, "Dia deve ser entre 1 e 31")
};

// ═══════════════════════════════════════════════════════════════
// 🎯 SCHEMAS ESPECÍFICOS POR MODAL
// ═══════════════════════════════════════════════════════════════

export const ValidationSchemas = {
  
  // 💸 DESPESAS (DespesasModal.jsx)
  despesa: z.object({
    valor: BaseFields.valor,
    data: BaseFields.data,
    descricao: BaseFields.descricao,
    categoria: BaseFields.idOpcional,
    categoriaTexto: z.string().optional().default(''),
    subcategoria: BaseFields.idOpcional,
    subcategoriaTexto: z.string().optional().default(''),
    conta: BaseFields.id,
    efetivado: BaseFields.status,
    observacoes: BaseFields.observacoes,
    
    // Específicos de despesa
    tipoDespesa: z.enum(['simples', 'recorrente', 'parcelada'], {
      errorMap: () => ({ message: "Tipo de despesa inválido" })
    }).default('simples'),
    
    numeroParcelas: z.number()
      .int("Deve ser número inteiro")
      .min(2, "Mínimo 2 parcelas")
      .max(48, "Máximo 48 parcelas")
      .optional(),
      
    totalRecorrencias: BaseFields.recorrencias.optional(),
    
    tipoRecorrencia: z.enum(['semanal', 'quinzenal', 'mensal', 'anual'], {
      errorMap: () => ({ message: "Tipo de recorrência inválido" })
    }).optional(),
    
    primeiroEfetivado: BaseFields.status.optional(),
    primeiraParcela: BaseFields.data.optional()
  }),

  // 💳 DESPESAS CARTÃO (DespesasCartaoModal.jsx)
  despesaCartao: z.object({
    valorTotal: BaseFields.valor,
    dataCompra: BaseFields.data,
    descricao: BaseFields.descricao,
    categoria: BaseFields.idOpcional,
    categoriaTexto: z.string().optional().default(''),
    subcategoria: BaseFields.idOpcional,
    subcategoriaTexto: z.string().optional().default(''),
    cartaoId: BaseFields.id,
    numeroParcelas: BaseFields.parcelas,
    faturaVencimento: BaseFields.data,
    observacoes: BaseFields.observacoes
  }),

  // 💰 RECEITAS (se existir ReceitasModal.jsx)
  receita: z.object({
    valor: BaseFields.valor,
    data: BaseFields.data,
    descricao: BaseFields.descricao,
    categoria: BaseFields.idOpcional,
    categoriaTexto: z.string().optional().default(''),
    subcategoria: BaseFields.idOpcional,
    subcategoriaTexto: z.string().optional().default(''),
    conta: BaseFields.id,
    efetivado: BaseFields.status,
    observacoes: BaseFields.observacoes,
    
    // Específicos de receita
    tipoReceita: z.enum(['simples', 'recorrente'], {
      errorMap: () => ({ message: "Tipo de receita inválido" })
    }).default('simples'),
    
    totalRecorrencias: BaseFields.recorrencias.optional(),
    tipoRecorrencia: z.enum(['semanal', 'quinzenal', 'mensal', 'anual']).optional(),
    primeiroEfetivado: BaseFields.status.optional()
  }),

  // 🏦 CONTAS (ContasModal.jsx)
  conta: z.object({
    nome: BaseFields.nome,
    tipo: z.enum(['corrente', 'poupanca', 'investimento', 'carteira'], {
      errorMap: () => ({ message: "Tipo de conta inválido" })
    }),
    banco: BaseFields.textoOpcional,
    saldo: z.string()
      .transform(val => {
        if (!val) return 0;
        
        const valorLimpo = val.toString().replace(/[^\d,.-]/g, '');
        if (valorLimpo.includes(',')) {
          const partes = valorLimpo.split(',');
          const inteira = partes[0].replace(/\./g, '');
          const decimal = partes[1] || '00';
          const numero = parseFloat(`${inteira}.${decimal}`);
          return isNaN(numero) ? 0 : numero;
        } else {
          const numero = parseFloat(valorLimpo.replace(/\./g, '')) / 100;
          return isNaN(numero) ? 0 : numero;
        }
      })
      .refine(val => val >= -1000000, "Saldo muito baixo")
      .refine(val => val <= 1000000, "Saldo muito alto"),
    cor: BaseFields.cor
  }),

  // 💳 CARTÕES (CartaoForm.jsx)
  cartao: z.object({
    nome: BaseFields.nome,
    bandeira: z.string()
      .min(1, "Bandeira é obrigatória")
      .max(50, "Máximo 50 caracteres")
      .transform(str => str.trim()),
    limite: BaseFields.valor.optional(),
    diaFechamento: BaseFields.diaMes,
    diaVencimento: BaseFields.diaMes,
    contaId: BaseFields.id,
    cor: BaseFields.cor,
    ativo: BaseFields.status.default(true)
  }),

  // 🏷️ CATEGORIAS (CategoriasModal.jsx)
  categoria: z.object({
    nome: BaseFields.nome,
    tipo: z.enum(['despesa', 'receita'], {
      errorMap: () => ({ message: "Tipo deve ser 'despesa' ou 'receita'" })
    }),
    cor: BaseFields.cor,
    ativo: BaseFields.status.default(true)
  }),

  // 🏷️ SUBCATEGORIAS (CategoriasModal.jsx)
  subcategoria: z.object({
    nome: BaseFields.nome,
    categoriaId: BaseFields.id,
    ativo: BaseFields.status.default(true)
  })
};

// ═══════════════════════════════════════════════════════════════
// 🎯 VALIDAÇÕES CONDICIONAIS AVANÇADAS
// ═══════════════════════════════════════════════════════════════

// Despesa: Validações específicas por tipo
ValidationSchemas.despesa = ValidationSchemas.despesa
  .refine(
    (data) => {
      if (data.tipoDespesa === 'parcelada') {
        return data.numeroParcelas && data.numeroParcelas >= 2;
      }
      return true;
    },
    {
      message: "Despesa parcelada deve ter pelo menos 2 parcelas",
      path: ["numeroParcelas"]
    }
  )
  .refine(
    (data) => {
      if (data.tipoDespesa === 'recorrente') {
        return data.totalRecorrencias && data.totalRecorrencias >= 2;
      }
      return true;
    },
    {
      message: "Despesa recorrente deve ter pelo menos 2 recorrências",
      path: ["totalRecorrencias"]
    }
  )
  .refine(
    (data) => {
      if (data.tipoDespesa === 'parcelada') {
        return data.primeiraParcela;
      }
      return true;
    },
    {
      message: "Data da primeira parcela é obrigatória",
      path: ["primeiraParcela"]
    }
  );

// Cartão: Validação de datas de fechamento/vencimento
ValidationSchemas.cartao = ValidationSchemas.cartao
  .refine(
    (data) => data.diaFechamento !== data.diaVencimento,
    {
      message: "Dia de fechamento deve ser diferente do dia de vencimento",
      path: ["diaVencimento"]
    }
  );

// Despesa Cartão: Validação de parcelas mínimas para valores baixos
ValidationSchemas.despesaCartao = ValidationSchemas.despesaCartao
  .refine(
    (data) => {
      if (data.numeroParcelas > 1 && data.valorTotal < 10) {
        return false;
      }
      return true;
    },
    {
      message: "Para parcelar, valor mínimo deve ser R$ 10,00",
      path: ["numeroParcelas"]
    }
  );

// ═══════════════════════════════════════════════════════════════
// 🎯 EXPORTAÇÕES SIMPLIFICADAS
// ═══════════════════════════════════════════════════════════════

export const {
  despesa: DespesaSchema,
  despesaCartao: DespesaCartaoSchema,
  receita: ReceitaSchema,
  conta: ContaSchema,
  cartao: CartaoSchema,
  categoria: CategoriaSchema,
  subcategoria: SubcategoriaSchema
} = ValidationSchemas;

// Helper para buscar schema por nome
export const getSchema = (type) => ValidationSchemas[type];

// Exportar campos base para casos especiais
export { BaseFields };

// ═══════════════════════════════════════════════════════════════
// 🎯 SCHEMAS PARA VALIDAÇÃO PARCIAL (útil para validação em tempo real)
// ═══════════════════════════════════════════════════════════════

export const PartialSchemas = {
  despesa: DespesaSchema.partial(),
  despesaCartao: DespesaCartaoSchema.partial(),
  receita: ReceitaSchema.partial(),
  conta: ContaSchema.partial(),
  cartao: CartaoSchema.partial(),
  categoria: CategoriaSchema.partial(),
  subcategoria: SubcategoriaSchema.partial()
};