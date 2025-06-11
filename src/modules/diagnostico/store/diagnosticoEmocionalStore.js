// src/modules/diagnostico/store/diagnosticoEmocionalStore.js - VERSÃO CORRIGIDA
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useDiagnosticoEmocionalStore = create(
  persist(
    (set, get) => ({
      // ===== ESTADO DO DIAGNÓSTICO =====
      rendaMensal: 0,
      sobraOuFalta: null, // 'sobra' | 'falta' | 'zerado' | 'nao_sei'
      gastosMensais: 0,
      gastosPorCategoria: {},
      vilao: null, // 'casa' | 'transporte' | 'lazer' | 'cartao' | 'desconhecido'
      dividas: '',
      saldoContas: null,
      etapaAtual: 0,
      diagnosticoCompleto: false,

      // ===== NAVEGAÇÃO =====
      etapas: [
        'welcome',
        'renda', 
        'gastos-mensais',
        'dividas',
        'vilao',
        'saldo-contas',
        'resumo',
        'plano'
      ],

      // ===== ACTIONS BÁSICAS =====
      setRendaMensal: (valor) => set({ rendaMensal: valor }),
      setSobraOuFalta: (opcao) => set({ sobraOuFalta: opcao }),
      setGastosMensais: (valor) => set({ gastosMensais: valor }),
      setGastosPorCategoria: (gastos) => set({ gastosPorCategoria: gastos }),
      setVilao: (opcao) => set({ vilao: opcao }),
      setDividas: (info) => set({ dividas: info }),
      setSaldoContas: (info) => set({ saldoContas: info }),

      // ===== NAVEGAÇÃO =====
      nextEtapa: () => {
        const { etapaAtual, etapas } = get();
        if (etapaAtual < etapas.length - 1) {
          set({ etapaAtual: etapaAtual + 1 });
          return true;
        }
        return false;
      },

      prevEtapa: () => {
        const { etapaAtual } = get();
        if (etapaAtual > 0) {
          set({ etapaAtual: etapaAtual - 1 });
          return true;
        }
        return false;
      },

      irParaEtapa: (indice) => {
        const { etapas } = get();
        if (indice >= 0 && indice < etapas.length) {
          set({ etapaAtual: indice });
          return true;
        }
        return false;
      },

      getEtapaAtual: () => {
        const { etapaAtual, etapas } = get();
        return etapas[etapaAtual];
      },

      getProgresso: () => {
        const { etapaAtual, etapas } = get();
        return Math.round(((etapaAtual + 1) / etapas.length) * 100);
      },

      // ===== CÁLCULOS DO DIAGNÓSTICO - CORRIGIDO =====
      calcularSituacaoFinanceira: () => {
        const { rendaMensal, sobraOuFalta, vilao, dividas, gastosMensais } = get();
        
        // ✅ DEBUG - Log dos dados para verificar formato
        console.log('🔍 DEBUG - Dados do diagnóstico:', {
          rendaMensal,
          sobraOuFalta,
          vilao,
          dividas: {
            tipo: typeof dividas,
            valor: dividas
          },
          gastosMensais
        });
        
        let situacao = {
          tipo: 'equilibrado', // 'critico' | 'atencao' | 'equilibrado' | 'bom'
          titulo: '',
          descricao: '',
          deficit: 0,
          projecao6meses: 0,
          mensagem: '',
          alerta: '',
          recomendacao: ''
        };

        // ✅ CALCULA DEFICIT BASEADO NOS GASTOS REAIS OU ESTIMATIVA
        let deficitReal = 0;
        if (gastosMensais > 0) {
          deficitReal = gastosMensais - rendaMensal;
        } else {
          // Estimativa baseada na resposta sobre sobra/falta
          if (sobraOuFalta === 'falta') {
            const percentualDeficit = vilao === 'cartao' ? 0.3 : 0.2;
            deficitReal = rendaMensal * percentualDeficit;
          }
        }

        // ✅ CLASSIFICAÇÃO MELHORADA
        if (deficitReal > rendaMensal * 0.2 || sobraOuFalta === 'falta') {
          situacao.tipo = 'critico';
          situacao.titulo = '🚨 Situação Crítica';
          situacao.descricao = 'Gastos muito acima da renda';
          situacao.deficit = Math.abs(deficitReal);
          situacao.projecao6meses = situacao.deficit * 6;
          situacao.alerta = `Você pode estar gastando R$ ${situacao.deficit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais do que ganha todo mês.`;
          situacao.recomendacao = `Se continuar assim, em 6 meses pode acumular uma dívida de R$ ${situacao.projecao6meses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
          
        } else if (deficitReal > 0 || sobraOuFalta === 'zerado') {
          situacao.tipo = 'atencao';
          situacao.titulo = '⚠️ No Fio da Navalha';
          situacao.descricao = 'Gastando quase toda a renda';
          situacao.alerta = 'Você está gastando quase toda sua renda todo mês.';
          situacao.recomendacao = 'Qualquer imprevisto pode te levar ao vermelho. É hora de criar uma reserva!';
          
        } else if (sobraOuFalta === 'sobra') {
          if (vilao === 'desconhecido' || vilao === 'cartao') {
            situacao.tipo = 'atencao';
            situacao.titulo = '🤔 Dinheiro Sumindo?';
            situacao.descricao = 'Sobra dinheiro mas sem controle';
            situacao.alerta = 'Você até sobra dinheiro, mas não sabe onde ele vai.';
            situacao.recomendacao = 'Com organização, você pode economizar muito mais!';
          } else {
            situacao.tipo = 'bom';
            situacao.titulo = '😊 Situação Controlada';
            situacao.descricao = 'Sobra dinheiro e tem controle';
            situacao.alerta = 'Você tem sobra e sabe onde gasta seu dinheiro.';
            situacao.recomendacao = 'Vamos otimizar ainda mais seus gastos e fazer seu dinheiro render!';
          }
        } else if (sobraOuFalta === 'nao_sei') {
          situacao.tipo = 'atencao';
          situacao.titulo = '😵 Perdido nas Finanças?';
          situacao.descricao = 'Sem controle financeiro';
          situacao.alerta = 'Sem controle, é impossível ter uma vida financeira saudável.';
          situacao.recomendacao = 'Vamos te ensinar a organizar tudo de forma simples!';
        }

        // ✅ VERIFICA DÍVIDAS - TRATAMENTO CORRETO PARA DIFERENTES TIPOS
        const temDividas = (() => {
          if (!dividas) return false;
          
          // Se for string simples
          if (typeof dividas === 'string') {
            return dividas.trim().length > 0 && dividas !== 'nao';
          }
          
          // Se for objeto (novo formato)
          if (typeof dividas === 'object') {
            // Formato simples: { tipo: 'simples', tem: true/false, motivo: 'nao'|'sim'|'nao_sei' }
            if (dividas.tipo === 'simples') {
              return dividas.tem === true || dividas.motivo === 'sim';
            }
            
            // Formato detalhado: { tipo: 'detalhado', dividas: [...], totalValor: 1500 }
            if (dividas.tipo === 'detalhado') {
              return dividas.dividas && dividas.dividas.length > 0;
            }
            
            // Formato com situacao
            if (dividas.situacao) {
              return dividas.situacao !== 'nao';
            }
          }
          
          return false;
        })();

        // ✅ AGRAVA A SITUAÇÃO SE TEM DÍVIDAS
        if (temDividas) {
          if (situacao.tipo === 'bom') situacao.tipo = 'atencao';
          if (situacao.tipo === 'equilibrado') situacao.tipo = 'atencao';
          if (situacao.tipo === 'atencao') situacao.tipo = 'critico';
          
          situacao.alerta += ' E ainda tem dívidas pendentes.';
          
          // ✅ LOG PARA DEBUG
          console.log('🚨 Dívidas detectadas:', {
            dividas,
            temDividas,
            situacaoFinal: situacao.tipo
          });
        }

        // Garante que tenha uma mensagem
        if (!situacao.mensagem) {
          situacao.mensagem = situacao.alerta;
        }

        console.log('✅ Situação calculada:', situacao);
        return situacao;
      },

      finalizarDiagnostico: () => {
        set({ diagnosticoCompleto: true });
      },

      resetarDiagnostico: () => set({
        rendaMensal: 0,
        sobraOuFalta: null,
        gastosMensais: 0,
        gastosPorCategoria: {},
        vilao: null,
        dividas: '',
        saldoContas: null,
        etapaAtual: 0,
        diagnosticoCompleto: false
      }),

      // ===== GETTERS COMPUTADOS =====
      get podeAvancar() {
        const { etapaAtual, rendaMensal, sobraOuFalta, vilao } = get();
        const etapa = get().getEtapaAtual();
        
        switch (etapa) {
          case 'welcome':
            return true;
          case 'renda':
            return rendaMensal > 0 && sobraOuFalta !== null;
          case 'gastos-mensais':
            return true; // Sempre pode avançar (gastos são opcionais)
          case 'dividas':
            return true; // Campo opcional
          case 'vilao':
            return vilao !== null;
          case 'saldo-contas':
            return true; // Campo opcional
          case 'resumo':
            return true;
          case 'plano':
            return true;
          default:
            return false;
        }
      }
    }),
    {
      name: 'diagnostico-emocional',
      version: 3 // ✅ Incrementei a versão para limpar cache antigo
    }
  )
);

export default useDiagnosticoEmocionalStore;