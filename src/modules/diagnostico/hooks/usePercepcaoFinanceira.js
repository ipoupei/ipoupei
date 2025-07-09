// src/modules/diagnostico/hooks/usePercepcaoFinanceira.js
import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';

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

    // ➕ Campos obrigatórios agora incluem renda e horas
    const camposObrigatorios = [
      'sentimentoGeral', 
      'controleFinanceiro', 
      'disciplinaGastos', 
      'planejamentoFuturo',
      'rendaMensal',
      'horasTrabalhadasMes',
      'tipoRenda'
    ];
    
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
        // ➕ Novos campos de renda e horas
        renda_mensal: dadosPercepcao.rendaMensal ? parseFloat(dadosPercepcao.rendaMensal.replace(/[^\d,]/g, '').replace(',', '.')) : null,
        media_horas_trabalhadas_mes: dadosPercepcao.horasTrabalhadasMes ? parseInt(dadosPercepcao.horasTrabalhadasMes) : null,
        tipo_renda: dadosPercepcao.tipoRenda || null,
        // valor_hora_trabalhada será calculado automaticamente pelo trigger do banco
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
          renda_mensal,
          media_horas_trabalhadas_mes,
          tipo_renda,
          valor_hora_trabalhada,
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
      
      // ➕ Verificar se todos os campos obrigatórios estão preenchidos (incluindo novos)
      const camposObrigatorios = [
        'sentimentoGeral', 
        'controleFinanceiro', 
        'disciplinaGastos', 
        'planejamentoFuturo',
        'rendaMensal',
        'horasTrabalhadasMes',
        'tipoRenda'
      ];
      
      return camposObrigatorios.every(campo => dados[campo] && dados[campo] !== '');
    } catch (err) {
      console.error('Erro ao verificar se percepção está completa:', err);
      return false;
    }
  }, [carregarPercepcao]);

  // ➕ Nova função para calcular valor da hora trabalhada
  const calcularValorHora = useCallback((rendaMensal, horasMes) => {
    if (!rendaMensal || !horasMes) return 0;
    
    try {
      // Converter renda de string formatada para número
      const rendaNumero = typeof rendaMensal === 'string' 
        ? parseFloat(rendaMensal.replace(/[^\d,]/g, '').replace(',', '.'))
        : rendaMensal;
      
      const horasNumero = typeof horasMes === 'string' 
        ? parseInt(horasMes) 
        : horasMes;
      
      if (rendaNumero > 0 && horasNumero > 0) {
        return (rendaNumero / horasNumero).toFixed(2);
      }
      
      return 0;
    } catch (err) {
      console.warn('Erro ao calcular valor da hora:', err);
      return 0;
    }
  }, []);

  // ➕ Nova função para validar dados de renda
  const validarDadosRenda = useCallback((dados) => {
    const erros = [];
    
    if (!dados.rendaMensal) {
      erros.push('Renda mensal é obrigatória');
    }
    
    if (!dados.horasTrabalhadasMes) {
      erros.push('Horas trabalhadas por mês é obrigatório');
    } else {
      const horas = parseInt(dados.horasTrabalhadasMes);
      if (horas < 1 || horas > 744) {
        erros.push('Horas trabalhadas deve estar entre 1 e 744 por mês');
      }
    }
    
    if (!dados.tipoRenda) {
      erros.push('Tipo de renda é obrigatório');
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  }, []);

  // Limpar erro manualmente
  const limparError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Funções existentes
    salvarPercepcao,
    carregarPercepcao,
    verificarPercepcaoCompleta,
    limparError,
    loading,
    error,
    // ➕ Novas funções utilitárias
    calcularValorHora,
    validarDadosRenda
  };
};