// src/shared/schemas/validation.schemas.js
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// 🎯 SCHEMAS SUPER SIMPLES E ESTÁVEIS
// ═══════════════════════════════════════════════════════════════

// 💸 DESPESAS - Schema básico
export const DespesaSchema = z.object({
  valor: z.string().min(1, "Valor é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  categoriaTexto: z.string().default(""),
  subcategoria: z.string().default(""),
  subcategoriaTexto: z.string().default(""),
  conta: z.string().min(1, "Conta é obrigatória"),
  efetivado: z.boolean().default(true),
  observacoes: z.string().default(""),
  tipoDespesa: z.enum(['simples', 'recorrente', 'parcelada']).default('simples'),
  numeroParcelas: z.number().default(1),
  totalRecorrencias: z.number().default(1),
  tipoRecorrencia: z.enum(['semanal', 'quinzenal', 'mensal', 'anual']).default('mensal'),
  primeiroEfetivado: z.boolean().default(true),
  primeiraParcela: z.string().default("")
});

// 💳 DESPESAS CARTÃO - Schema básico
export const DespesaCartaoSchema = z.object({
  valorTotal: z.string().min(1, "Valor é obrigatório"),
  dataCompra: z.string().min(1, "Data é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  categoriaTexto: z.string().default(""),
  subcategoria: z.string().default(""),
  subcategoriaTexto: z.string().default(""),
  cartaoId: z.string().min(1, "Cartão é obrigatório"),
  numeroParcelas: z.number().min(1).default(1),
  faturaVencimento: z.string().min(1, "Fatura é obrigatória"),
  observacoes: z.string().default("")
});

// 💰 RECEITAS - Schema básico
export const ReceitaSchema = z.object({
  valor: z.string().min(1, "Valor é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  categoriaTexto: z.string().default(""),
  subcategoria: z.string().default(""),
  subcategoriaTexto: z.string().default(""),
  conta: z.string().min(1, "Conta é obrigatória"),
  efetivado: z.boolean().default(true),
  observacoes: z.string().default(""),
  tipoReceita: z.enum(['simples', 'recorrente']).default('simples'),
  totalRecorrencias: z.number().default(1),
  tipoRecorrencia: z.enum(['semanal', 'quinzenal', 'mensal', 'anual']).default('mensal'),
  primeiroEfetivado: z.boolean().default(true)
});

// 🏦 CONTAS - Schema básico
export const ContaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(['corrente', 'poupanca', 'investimento', 'carteira']),
  banco: z.string().default(""),
  saldo: z.number().default(0),
  cor: z.string().default("#3B82F6"),
  ativo: z.boolean().default(true)
});

// 💳 CARTÕES - Schema básico
export const CartaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  bandeira: z.string().min(1, "Bandeira é obrigatória"),
  limite: z.number().default(0),
  diaFechamento: z.number().min(1).max(31),
  diaVencimento: z.number().min(1).max(31),
  contaId: z.string().min(1, "Conta é obrigatória"),
  cor: z.string().default("#8B5CF6"),
  ativo: z.boolean().default(true)
});

// 🏷️ CATEGORIAS - Schema básico
export const CategoriaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(['despesa', 'receita']),
  cor: z.string().default("#3498db"),
  ativo: z.boolean().default(true)
});

// 🏷️ SUBCATEGORIAS - Schema básico
export const SubcategoriaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoriaId: z.string().min(1, "Categoria é obrigatória"),
  ativo: z.boolean().default(true)
});

// 🔄 TRANSFERÊNCIAS - Schema básico
export const TransferenciaSchema = z.object({
  contaOrigemId: z.string().min(1, "Conta de origem é obrigatória"),
  contaDestinoId: z.string().min(1, "Conta de destino é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  descricao: z.string().default(""),
  observacoes: z.string().default("")
});

// ═══════════════════════════════════════════════════════════════
// 🎯 EXPORTAÇÕES SIMPLES
// ═══════════════════════════════════════════════════════════════

export const getSchema = (type) => {
  const schemas = {
    despesa: DespesaSchema,
    despesaCartao: DespesaCartaoSchema,
    receita: ReceitaSchema,
    conta: ContaSchema,
    cartao: CartaoSchema,
    categoria: CategoriaSchema,
    subcategoria: SubcategoriaSchema,
    transferencia: TransferenciaSchema
  };
  return schemas[type];
};