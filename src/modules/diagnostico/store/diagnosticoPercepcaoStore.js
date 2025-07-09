// src/modules/diagnostico/store/diagnosticoPercepcaoStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@lib/supabaseClient';

const useDiagnosticoPercepcaoStore = create(
  persist(
    (set, get) => ({
      // Estado
      percepcao: {
        controleFinanceiro: '',
        disciplinaGastos: '',
        planejamentoFuturo: '',
        sentimentoGeral: '',
        // ➕ Novos campos para renda e trabalho
        rendaMensal: '',
        horasTrabalhadasMes: '',
        tipoRenda: '',
        valorHoraTrabalhada: 0
      },
      etapasCompletas: {
        intro: false,
        categorias: false,
        contas: false,
        cartoes: false,
        despesasCartao: false,
        receitas: false,
        despesasFixas: false,
        despesasVariaveis: false,
        resumo: false,
        metas: false,
        finalizacao: false
      },
      loading: false,
      error: null,
      dataUltimaAtualizacao: null,

      // Actions para Percepção
      setPercepcao: (novaPercepcao) => {
        // Validar entrada
        if (!novaPercepcao || typeof novaPercepcao !== 'object') {
          console.warn('setPercepcao: dados inválidos');
          return;
        }

        set((state) => ({
          percepcao: { ...state.percepcao, ...novaPercepcao },
          dataUltimaAtualizacao: new Date().toISOString(),
          error: null // Limpar erro ao atualizar
        }));
      },

      resetPercepcao: () => 
        set({
          percepcao: {
            controleFinanceiro: '',
            disciplinaGastos: '',
            planejamentoFuturo: '',
            sentimentoGeral: '',
            // ➕ Resetar novos campos também
            rendaMensal: '',
            horasTrabalhadasMes: '',
            tipoRenda: '',
            valorHoraTrabalhada: 0
          },
          error: null
        }),

      // Actions para Etapas
      marcarEtapaCompleta: (etapa) => {
        if (!etapa || typeof etapa !== 'string') {
          console.warn('marcarEtapaCompleta: nome da etapa inválido');
          return;
        }

        set((state) => {
          // Verificar se etapa existe
          if (!(etapa in state.etapasCompletas)) {
            console.warn(`Etapa "${etapa}" não existe`);
            return state;
          }

          return {
            etapasCompletas: {
              ...state.etapasCompletas,
              [etapa]: true
            }
          };
        });
      },

      resetEtapas: () =>
        set({
          etapasCompletas: {
            intro: false,
            categorias: false,
            contas: false,
            cartoes: false,
            despesasCartao: false,
            receitas: false,
            despesasFixas: false,
            despesasVariaveis: false,
            resumo: false,
            metas: false,
            finalizacao: false
          }
        }),

      // Actions assíncronas
      salvarPercepcaoAsync: async () => {
        const { percepcao, validarPercepcao } = get();
        
        // Validar antes de salvar
        const validacao = validarPercepcao();
        if (!validacao.valida) {
          const erro = `Dados incompletos: ${validacao.erros.join(', ')}`;
          set({ error: erro });
          throw new Error(erro);
        }

        set({ loading: true, error: null });

        try {
          // Obter usuário atual
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            throw authError;
          }

          if (!user?.id) {
            throw new Error('Usuário não autenticado');
          }

          // Preparar dados para salvar
          const dadosParaSalvar = {
            sentimento_financeiro: percepcao.sentimentoGeral,
            percepcao_controle: percepcao.controleFinanceiro,
            percepcao_gastos: percepcao.disciplinaGastos,
            disciplina_financeira: percepcao.planejamentoFuturo,
            // ➕ Novos campos de renda e horas
            renda_mensal: percepcao.rendaMensal ? parseFloat(percepcao.rendaMensal.replace(/[^\d,]/g, '').replace(',', '.')) : null,
            media_horas_trabalhadas_mes: percepcao.horasTrabalhadasMes ? parseInt(percepcao.horasTrabalhadasMes) : null,
            tipo_renda: percepcao.tipoRenda || null,
            // valor_hora_trabalhada será calculado automaticamente pelo trigger do banco
            relacao_dinheiro: JSON.stringify(percepcao),
            updated_at: new Date().toISOString()
          };

          // Salvar no Supabase
          const { data, error: supabaseError } = await supabase
            .from('perfil_usuario')
            .update(dadosParaSalvar)
            .eq('id', user.id)
            .select();

          if (supabaseError) {
            throw supabaseError;
          }

          // Verificar se realmente atualizou
          if (!data || data.length === 0) {
            throw new Error('Nenhum registro foi atualizado. Verifique se o perfil existe.');
          }

          // Atualizar estado de sucesso
          set({ 
            dataUltimaAtualizacao: new Date().toISOString(),
            loading: false,
            error: null
          });

          // Marcar etapa como completa após salvar com sucesso
          get().marcarEtapaCompleta('intro');

          return data[0];
        } catch (err) {
          const mensagemErro = err.message || 'Erro desconhecido ao salvar';
          console.error('Erro ao salvar percepção:', err);
          
          set({ 
            error: mensagemErro, 
            loading: false 
          });
          
          throw new Error(mensagemErro);
        }
      },

      carregarPercepcaoAsync: async () => {
        set({ loading: true, error: null });

        try {
          // Obter usuário atual
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            throw authError;
          }

          if (!user?.id) {
            console.warn('Usuário não autenticado para carregar percepção');
            set({ loading: false });
            return;
          }

          // Buscar dados no Supabase
          const { data, error: supabaseError } = await supabase
            .from('perfil_usuario')
            .select(`
              sentimento_financeiro,
              percepcao_controle,
              percepcao_gastos,
              disciplina_financeira,
              renda_mensal,
              tipo_renda,
              relacao_dinheiro,
              diagnostico_completo,
              data_diagnostico,
              updated_at
            `)
            .eq('id', user.id)
            .single();

          // PGRST116 = No rows found (usuário novo, não é erro)
          if (supabaseError && supabaseError.code !== 'PGRST116') {
            throw supabaseError;
          }

          if (data) {
            // Mapear dados básicos
            const percepcaoCarregada = {
              sentimentoGeral: data.sentimento_financeiro || '',
              controleFinanceiro: data.percepcao_controle || '',
              disciplinaGastos: data.percepcao_gastos || '',
              planejamentoFuturo: data.disciplina_financeira || '',
              // ➕ Novos campos de renda e horas
              rendaMensal: data.renda_mensal ? new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.renda_mensal) : '',
              horasTrabalhadasMes: data.media_horas_trabalhadas_mes?.toString() || '',
              tipoRenda: data.tipo_renda || '',
              valorHoraTrabalhada: data.valor_hora_trabalhada || 0
            };

            // Se há dados JSON, tentar fazer merge
            if (data.relacao_dinheiro) {
              try {
                const dadosCompletos = JSON.parse(data.relacao_dinheiro);
                // Priorizar dados JSON se existirem
                Object.assign(percepcaoCarregada, dadosCompletos);
              } catch (parseError) {
                console.warn('Erro ao fazer parse do JSON relacao_dinheiro:', parseError);
                // Continuar com dados básicos
              }
            }

            // Atualizar estado
            set({ 
              percepcao: percepcaoCarregada,
              dataUltimaAtualizacao: data.updated_at || new Date().toISOString(),
              loading: false,
              error: null
            });

            // Se diagnóstico está completo, marcar etapa intro como completa
            if (data.diagnostico_completo) {
              get().marcarEtapaCompleta('intro');
            }
          } else {
            // Usuário novo sem dados
            set({ loading: false, error: null });
          }
        } catch (err) {
          const mensagemErro = err.message || 'Erro ao carregar dados';
          console.error('Erro ao carregar percepção:', err);
          
          set({ 
            error: mensagemErro, 
            loading: false 
          });
        }
      },

      // Actions de utilidade
      isPercepcaoCompleta: () => {
        const { percepcao } = get();
        const camposObrigatorios = [
          'controleFinanceiro', 
          'disciplinaGastos', 
          'planejamentoFuturo', 
          'sentimentoGeral',
          // ➕ Novos campos obrigatórios
          'rendaMensal',
          'horasTrabalhadasMes', 
          'tipoRenda'
        ];
        return camposObrigatorios.every(campo => percepcao[campo] && percepcao[campo] !== '');
      },

      getProgresso: () => {
        const { etapasCompletas } = get();
        const totalEtapas = Object.keys(etapasCompletas).length;
        const etapasFeitas = Object.values(etapasCompletas).filter(Boolean).length;
        return Math.round((etapasFeitas / totalEtapas) * 100);
      },

      limparError: () => set({ error: null }),

      // Validações
      validarPercepcao: () => {
        const { percepcao } = get();
        const erros = [];

        // Validações das perguntas de percepção (mantidas como estavam)
        if (!percepcao.controleFinanceiro) {
          erros.push('Selecione como você avalia seu controle financeiro');
        }
        if (!percepcao.disciplinaGastos) {
          erros.push('Selecione a frequência do controle de gastos');
        }
        if (!percepcao.planejamentoFuturo) {
          erros.push('Selecione se você planeja seu futuro financeiro');
        }
        if (!percepcao.sentimentoGeral) {
          erros.push('Selecione como você se sente em relação ao dinheiro');
        }

        // ➕ Novas validações para renda e horas
        if (!percepcao.rendaMensal) {
          erros.push('Informe sua renda mensal');
        }
        if (!percepcao.horasTrabalhadasMes) {
          erros.push('Informe quantas horas trabalha por mês');
        }
        if (!percepcao.tipoRenda) {
          erros.push('Selecione o tipo da sua renda');
        }

        // Validações adicionais de formato
        if (percepcao.horasTrabalhadasMes && (parseInt(percepcao.horasTrabalhadasMes) < 1 || parseInt(percepcao.horasTrabalhadasMes) > 744)) {
          erros.push('Horas trabalhadas deve estar entre 1 e 744 por mês');
        }

        return {
          valida: erros.length === 0,
          erros
        };
      },

      // Função para obter status detalhado
      getStatus: () => {
        const state = get();
        return {
          percepcaoCompleta: state.isPercepcaoCompleta(),
          progresso: state.getProgresso(),
          temErro: !!state.error,
          carregando: state.loading,
          ultimaAtualizacao: state.dataUltimaAtualizacao,
          etapaAtual: Object.entries(state.etapasCompletas).find(([_, completa]) => !completa)?.[0] || 'finalizacao'
        };
      },

      // Reset completo
      resetTudo: () => {
        const { resetPercepcao, resetEtapas } = get();
        resetPercepcao();
        resetEtapas();
        set({ 
          error: null, 
          loading: false, 
          dataUltimaAtualizacao: null 
        });
      }
    }),
    {
      name: 'diagnostico-percepcao-storage',
      version: 1, // Versioning para migrations futuras
      partialize: (state) => ({
        percepcao: state.percepcao,
        etapasCompletas: state.etapasCompletas,
        dataUltimaAtualizacao: state.dataUltimaAtualizacao
      }),
      // Não persistir estados temporários
      skipHydration: false
    }
  )
);

export default useDiagnosticoPercepcaoStore;