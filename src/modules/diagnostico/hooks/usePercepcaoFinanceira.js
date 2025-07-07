// src/modules/diagnostico/hooks/usePercepcaoFinanceira.js
import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import  useAuth  from '@modules/auth/hooks/useAuth';

export const usePercepcaoFinanceira = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Salvar dados de percepção no perfil do usuário
  const salvarPercepcao = useCallback(async (dadosPercepcao) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Validar se dados estão completos
    if (!dadosPercepcao || typeof dadosPercepcao !== 'object') {
      throw new Error('Dados de percepção inválidos');
    }

    const camposObrigatorios = ['sentimentoGeral', 'controleFinanceiro', 'disciplinaGastos', 'planejamentoFuturo'];
    const camposFaltando = camposObrigatorios.filter(campo => !dadosPercepcao[campo]);
    
    if (camposFaltando.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${camposFaltando.join(', ')}`);
    }

    setLoading(true);
    setError(null);

    try {
      // Mapear dados de percepção para campos do banco
      const dadosParaSalvar = {
        sentimento_financeiro: dadosPercepcao.sentimentoGeral,
        percepcao_controle: dadosPercepcao.controleFinanceiro,
        percepcao_gastos: dadosPercepcao.disciplinaGastos,
        disciplina_financeira: dadosPercepcao.planejamentoFuturo,
        relacao_dinheiro: JSON.stringify(dadosPercepcao), // Dados completos em JSON
        updated_at: new Date().toISOString()
      };

      const { data, error: supabaseError } = await supabase
        .from('perfil_usuario')
        .update(dadosParaSalvar)
        .eq('id', user.id)
        .select();

      if (supabaseError) {
        throw supabaseError;
      }

      // Verificar se realmente atualizou algum registro
      if (!data || data.length === 0) {
        throw new Error('Nenhum registro foi atualizado');
      }

      return data[0];
    } catch (err) {
      console.error('Erro ao salvar percepção:', err);
      const mensagemErro = err.message || 'Erro desconhecido ao salvar';
      setError(mensagemErro);
      throw new Error(mensagemErro);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carregar dados de percepção existentes
  const carregarPercepcao = useCallback(async () => {
    if (!user?.id) {
      console.warn('Usuário não autenticado para carregar percepção');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('perfil_usuario')
        .select(`
          sentimento_financeiro,
          percepcao_controle,
          percepcao_gastos,
          disciplina_financeira,
          relacao_dinheiro
        `)
        .eq('id', user.id)
        .single();

      // PGRST116 = No rows found (não é erro, usuário novo)
      if (supabaseError && supabaseError.code !== 'PGRST116') {
        throw supabaseError;
      }

      if (data) {
        // Mapear de volta para o formato do componente
        const dadosPercepcao = {
          sentimentoGeral: data.sentimento_financeiro || '',
          controleFinanceiro: data.percepcao_controle || '',
          disciplinaGastos: data.percepcao_gastos || '',
          planejamentoFuturo: data.disciplina_financeira || ''
        };

        // Se temos dados JSON mais detalhados, usar eles
        if (data.relacao_dinheiro) {
          try {
            const dadosCompletos = JSON.parse(data.relacao_dinheiro);
            // Mesclar dados, priorizando os do JSON se existirem
            return { 
              ...dadosPercepcao, 
              ...dadosCompletos 
            };
          } catch (parseError) {
            console.warn('Erro ao fazer parse do JSON relacao_dinheiro:', parseError);
            // Retorna dados básicos se JSON estiver corrompido
            return dadosPercepcao;
          }
        }

        return dadosPercepcao;
      }

      // Usuário novo ou sem dados ainda
      return null;
    } catch (err) {
      console.error('Erro ao carregar percepção:', err);
      const mensagemErro = err.message || 'Erro ao carregar dados';
      setError(mensagemErro);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Verificar se percepção está completa
  const verificarPercepcaoCompleta = useCallback(async () => {
    try {
      const dados = await carregarPercepcao();
      if (!dados) return false;
      
      // Verificar se todos os campos obrigatórios estão preenchidos
      const camposObrigatorios = ['sentimentoGeral', 'controleFinanceiro', 'disciplinaGastos', 'planejamentoFuturo'];
      return camposObrigatorios.every(campo => dados[campo] && dados[campo] !== '');
    } catch (err) {
      console.error('Erro ao verificar se percepção está completa:', err);
      return false;
    }
  }, [carregarPercepcao]);

  // Limpar erro manualmente
  const limparError = useCallback(() => {
    setError(null);
  }, []);

  return {
    salvarPercepcao,
    carregarPercepcao,
    verificarPercepcaoCompleta,
    limparError,
    loading,
    error
  };
};