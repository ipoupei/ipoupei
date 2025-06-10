// src/modules/diagnostico/store/diagnosticoFlowStore.js
import { create } from 'zustand';
import { supabase } from '../../../lib/supabaseClient';

const ETAPAS_JORNADA = [
  { id: 1, nome: 'Conhecimento Zero', descricao: 'Não sabe nem por onde começar', cor: '#ef4444' },
  { id: 2, nome: 'Despertar', descricao: 'Reconhece que precisa mudar', cor: '#f97316' },
  { id: 3, nome: 'Organização Básica', descricao: 'Começando a se organizar', cor: '#f59e0b' },
  { id: 4, nome: 'Controle Inicial', descricao: 'Tem controle básico dos gastos', cor: '#eab308' },
  { id: 5, nome: 'Disciplina Financeira', descricao: 'Desenvolve disciplina consistente', cor: '#84cc16' },
  { id: 6, nome: 'Planejamento', descricao: 'Planeja seu futuro financeiro', cor: '#22c55e' },
  { id: 7, nome: 'Reserva de Emergência', descricao: 'Tem reserva construída', cor: '#10b981' },
  { id: 8, nome: 'Investidor Iniciante', descricao: 'Começou a investir', cor: '#14b8a6' },
  { id: 9, nome: 'Investidor Experiente', descricao: 'Investe de forma estratégica', cor: '#06b6d4' },
  { id: 10, nome: 'Liberdade Financeira', descricao: 'Vive dos investimentos', cor: '#3b82f6' }
];

const FLUXO_ETAPAS = [
  {
    id: 'intro',
    titulo: '🎯 Bem-vindo ao iPoupei',
    subtitulo: 'Vamos descobrir em que etapa da jornada financeira você está',
    tipo: 'intro',
    icone: '🚀'
  },
  {
    id: 'percepcao',
    titulo: '🤔 Como você se sente?',
    subtitulo: 'Entenda sua relação atual com o dinheiro',
    tipo: 'questionario',
    icone: '💭'
  },
  {
    id: 'contas',
    titulo: '🏦 Suas Contas',
    subtitulo: 'Cadastre onde você guarda seu dinheiro',
    tipo: 'cadastro',
    modal: 'ContasModal',
    icone: '💳',
    objetivo: 'Cadastrar pelo menos 1 conta bancária'
  },
  {
    id: 'cartoes',
    titulo: '💳 Seus Cartões',
    subtitulo: 'Cadastre seus cartões de crédito',
    tipo: 'cadastro',
    modal: 'CartoesModal',
    icone: '💎',
    objetivo: 'Cadastrar cartões (se tiver)'
  },
  {
    id: 'renda',
    titulo: '💰 Sua Renda',
    subtitulo: 'Quanto dinheiro entra mensalmente?',
    tipo: 'cadastro',
    modal: 'ReceitasModal',
    icone: '📈',
    objetivo: 'Cadastrar fontes de renda'
  },
  {
    id: 'gastos-fixos',
    titulo: '🏠 Gastos Fixos',
    subtitulo: 'Aqueles gastos que sempre voltam',
    tipo: 'cadastro',
    modal: 'DespesasModal',
    icone: '📋',
    objetivo: 'Cadastrar principais gastos fixos'
  },
  {
    id: 'gastos-variaveis',
    titulo: '🛒 Gastos Variáveis',
    subtitulo: 'Seus gastos do dia a dia',
    tipo: 'cadastro',
    modal: 'DespesasModal',
    icone: '🛍️',
    objetivo: 'Cadastrar gastos variáveis típicos'
  },
  {
    id: 'dividas',
    titulo: '⚠️ Suas Dívidas',
    subtitulo: 'É hora de encarar a realidade',
    tipo: 'questionario',
    icone: '📊',
    objetivo: 'Mapear situação de dívidas'
  },
  {
    id: 'analise',
    titulo: '🧮 Analisando...',
    subtitulo: 'Calculando seu score e posição',
    tipo: 'processamento',
    icone: '⚡'
  },
  {
    id: 'resultado',
    titulo: '🎉 Seu Diagnóstico',
    subtitulo: 'Descubra onde você está e para onde vai',
    tipo: 'resultado',
    icone: '🏆'
  }
];

export const useDiagnosticoFlowStore = create((set, get) => ({
  // Estado do fluxo
  etapaAtual: 0,
  etapasCompletas: [],
  dadosColetados: {
    percepcao: {},
    contas: [],
    cartoes: [],
    receitas: [],
    despesasFixas: [],
    despesasVariaveis: [],
    dividas: {}
  },
  
  // Resultados
  scoreCalculado: null,
  etapaJornada: null,
  relatorioCompleto: null,
  
  // UI State
  modalAtivo: null,
  loading: false,
  
  // Progresso
  get progresso() {
    const { etapasCompletas, etapaAtual } = get();
    const total = FLUXO_ETAPAS.length;
    // Incluir a etapa atual como progresso
    const progresso = ((etapaAtual + 1) / total) * 100;
    return Math.round(progresso);
  },
  
  // Actions
  iniciarDiagnostico: () => {
    set({
      etapaAtual: 0,
      etapasCompletas: [],
      dadosColetados: {
        percepcao: {},
        contas: [],
        cartoes: [],
        receitas: [],
        despesasFixas: [],
        despesasVariaveis: [],
        dividas: {}
      },
      scoreCalculado: null,
      etapaJornada: null,
      relatorioCompleto: null
    });
  },
  
  proximaEtapa: () => {
    const { etapaAtual, etapasCompletas } = get();
    const etapaAtualObj = FLUXO_ETAPAS[etapaAtual];
    
    // Marcar etapa atual como completa
    if (!etapasCompletas.includes(etapaAtualObj.id)) {
      set({
        etapasCompletas: [...etapasCompletas, etapaAtualObj.id]
      });
    }
    
    // Avançar para próxima etapa
    if (etapaAtual < FLUXO_ETAPAS.length - 1) {
      set({ etapaAtual: etapaAtual + 1 });
    }
  },
  
  voltarEtapa: () => {
    const { etapaAtual } = get();
    if (etapaAtual > 0) {
      set({ etapaAtual: etapaAtual - 1 });
    }
  },
  
  irParaEtapa: (indice) => {
    set({ etapaAtual: indice });
  },
  
  // Modal management
  abrirModal: (nomeModal) => {
    set({ modalAtivo: nomeModal });
  },
  
  fecharModal: () => {
    set({ modalAtivo: null });
  },
  
  // Salvar dados por etapa
  salvarDadosPercepcao: (dados) => {
    const { dadosColetados } = get();
    set({
      dadosColetados: {
        ...dadosColetados,
        percepcao: dados
      }
    });
  },
  
  salvarDadosDividas: (dados) => {
    const { dadosColetados } = get();
    set({
      dadosColetados: {
        ...dadosColetados,
        dividas: dados
      }
    });
  },
  
  // Atualizar dados vindos dos modais existentes
  atualizarDadosContas: (contas) => {
    const { dadosColetados } = get();
    set({
      dadosColetados: {
        ...dadosColetados,
        contas: contas
      }
    });
  },
  
  atualizarDadosCartoes: (cartoes) => {
    const { dadosColetados } = get();
    set({
      dadosColetados: {
        ...dadosColetados,
        cartoes: cartoes
      }
    });
  },
  
  atualizarDadosReceitas: (receitas) => {
    const { dadosColetados } = get();
    set({
      dadosColetados: {
        ...dadosColetados,
        receitas: receitas
      }
    });
  },
  
  atualizarDadosDespesas: (despesas, tipo = 'fixas') => {
    const { dadosColetados } = get();
    const chave = tipo === 'fixas' ? 'despesasFixas' : 'despesasVariaveis';
    set({
      dadosColetados: {
        ...dadosColetados,
        [chave]: despesas
      }
    });
  },
  
  // Processamento e cálculos
  calcularScore: () => {
    const { dadosColetados } = get();
    
    let score = 0;
    let fatores = [];
    
    // Fator 1: Organização Básica (0-25 pontos)
    const temContas = dadosColetados.contas.length > 0;
    const temReceitas = dadosColetados.receitas.length > 0;
    if (temContas && temReceitas) {
      score += 25;
      fatores.push('✅ Tem organização básica');
    } else {
      fatores.push('❌ Falta organização básica');
    }
    
    // Fator 2: Controle de Gastos (0-25 pontos)
    const temGastosFixos = dadosColetados.despesasFixas.length > 0;
    const temGastosVariaveis = dadosColetados.despesasVariaveis.length > 0;
    if (temGastosFixos && temGastosVariaveis) {
      score += 25;
      fatores.push('✅ Controla seus gastos');
    } else if (temGastosFixos || temGastosVariaveis) {
      score += 12;
      fatores.push('⚠️ Controle parcial de gastos');
    } else {
      fatores.push('❌ Não controla gastos');
    }
    
    // Fator 3: Saúde Financeira (0-25 pontos)
    const rendaTotal = dadosColetados.receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
    const gastosFixosTotal = dadosColetados.despesasFixas.reduce((sum, d) => sum + (d.valor || 0), 0);
    const gastosVariaveisTotal = dadosColetados.despesasVariaveis.reduce((sum, d) => sum + (d.valor || 0), 0);
    const gastoTotal = gastosFixosTotal + gastosVariaveisTotal;
    
    if (rendaTotal > 0) {
      const percentualGasto = (gastoTotal / rendaTotal) * 100;
      if (percentualGasto < 50) {
        score += 25;
        fatores.push('✅ Excelente saúde financeira');
      } else if (percentualGasto < 80) {
        score += 15;
        fatores.push('⚠️ Saúde financeira razoável');
      } else if (percentualGasto < 100) {
        score += 5;
        fatores.push('🔴 Saúde financeira crítica');
      } else {
        fatores.push('🆘 Gastando mais que ganha');
      }
    }
    
    // Fator 4: Percepção e Disciplina (0-25 pontos)
    const percepcao = dadosColetados.percepcao;
    let pontuacaoPercepcao = 0;
    
    if (percepcao.controleFinanceiro === 'total') pontuacaoPercepcao += 8;
    else if (percepcao.controleFinanceiro === 'parcial') pontuacaoPercepcao += 5;
    else if (percepcao.controleFinanceiro === 'pouco') pontuacaoPercepcao += 2;
    
    if (percepcao.disciplinaGastos === 'sempre') pontuacaoPercepcao += 8;
    else if (percepcao.disciplinaGastos === 'as-vezes') pontuacaoPercepcao += 5;
    else if (percepcao.disciplinaGastos === 'raramente') pontuacaoPercepcao += 2;
    
    if (percepcao.planejamentoFuturo === 'sim-planos') pontuacaoPercepcao += 9;
    else if (percepcao.planejamentoFuturo === 'sim-basico') pontuacaoPercepcao += 5;
    else if (percepcao.planejamentoFuturo === 'pensando') pontuacaoPercepcao += 2;
    
    score += pontuacaoPercepcao;
    fatores.push(`💭 Percepção: ${pontuacaoPercepcao}/25 pontos`);
    
    return { score: Math.min(score, 100), fatores };
  },
  
  determinarEtapaJornada: (score) => {
    if (score <= 10) return ETAPAS_JORNADA[0]; // Conhecimento Zero
    if (score <= 20) return ETAPAS_JORNADA[1]; // Despertar
    if (score <= 35) return ETAPAS_JORNADA[2]; // Organização Básica
    if (score <= 50) return ETAPAS_JORNADA[3]; // Controle Inicial
    if (score <= 65) return ETAPAS_JORNADA[4]; // Disciplina Financeira
    if (score <= 75) return ETAPAS_JORNADA[5]; // Planejamento
    if (score <= 85) return ETAPAS_JORNADA[6]; // Reserva de Emergência
    if (score <= 92) return ETAPAS_JORNADA[7]; // Investidor Iniciante
    if (score <= 97) return ETAPAS_JORNADA[8]; // Investidor Experiente
    return ETAPAS_JORNADA[9]; // Liberdade Financeira
  },
  
  processarResultados: async () => {
    set({ loading: true });
    
    try {
      const { dadosColetados } = get();
      
      // Calcular score
      const { score, fatores } = get().calcularScore();
      const etapaJornada = get().determinarEtapaJornada(score);
      
      // Gerar relatório completo
      const relatorioCompleto = {
        score,
        etapaJornada,
        fatores,
        resumoFinanceiro: {
          rendaTotal: dadosColetados.receitas.reduce((sum, r) => sum + (r.valor || 0), 0),
          gastosFixos: dadosColetados.despesasFixas.reduce((sum, d) => sum + (d.valor || 0), 0),
          gastosVariaveis: dadosColetados.despesasVariaveis.reduce((sum, d) => sum + (d.valor || 0), 0),
          totalContas: dadosColetados.contas.length,
          totalCartoes: dadosColetados.cartoes.length
        },
        proximosPassos: gerarProximosPassos(etapaJornada, dadosColetados),
        dataCompleta: new Date().toISOString()
      };
      
      set({
        scoreCalculado: score,
        etapaJornada,
        relatorioCompleto,
        loading: false
      });
      
      // Salvar no perfil do usuário
      await salvarDiagnosticoNoPerfil(relatorioCompleto);
      
      return relatorioCompleto;
      
    } catch (error) {
      console.error('Erro ao processar resultados:', error);
      set({ loading: false });
      throw error;
    }
  },
  
  // Getters
  getEtapaAtual: () => FLUXO_ETAPAS[get().etapaAtual],
  getProximaEtapa: () => FLUXO_ETAPAS[get().etapaAtual + 1],
  isUltimaEtapa: () => get().etapaAtual >= FLUXO_ETAPAS.length - 1,
  getFluxoCompleto: () => FLUXO_ETAPAS,
  getEtapasJornada: () => ETAPAS_JORNADA
}));

// Funções auxiliares
function gerarProximosPassos(etapaJornada, dadosColetados) {
  const passos = [];
  
  if (dadosColetados.contas.length === 0) {
    passos.push('📝 Cadastre pelo menos uma conta bancária');
  }
  
  if (dadosColetados.receitas.length === 0) {
    passos.push('💰 Registre suas fontes de renda');
  }
  
  if (dadosColetados.despesasFixas.length < 3) {
    passos.push('🏠 Mapeie todos seus gastos fixos');
  }
  
  if (etapaJornada.id <= 3) {
    passos.push('📊 Use o app diariamente por 30 dias');
    passos.push('🎯 Defina metas mensais de gastos');
  }
  
  if (etapaJornada.id <= 5) {
    passos.push('💾 Crie uma reserva de emergência');
    passos.push('📈 Estude sobre investimentos básicos');
  }
  
  return passos;
}

async function salvarDiagnosticoNoPerfil(relatorio) {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from('perfil_usuario')
      .update({
        diagnostico_completo: true,
        data_diagnostico: new Date().toISOString(),
        // Salvamos dados relevantes em campos específicos se necessário
        updated_at: new Date().toISOString()
      })
      .eq('id', user.user.id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar diagnóstico:', error);
    throw error;
  }
}