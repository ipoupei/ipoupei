// src/modules/cartoes/hooks/useCartoesData.js
// ✅ HOOK CORRIGIDO - Query SQL válida

import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';

/**
 * Hook para leitura de dados relacionados a cartões
 * ✅ Permitido: SELECT, consultas, cálculos derivados
 * ❌ Proibido: INSERT, UPDATE, DELETE, formatação de UI, texto de exibição
 */
export const useCartoesData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ BUSCAR CARTÕES ATIVOS COM DADOS CALCULADOS
  const fetchCartoes = useCallback(async () => {
    if (!user?.id) return [];

    try {
      setLoading(true);
      setError(null);

      // Buscar cartões básicos
      const { data: cartoes, error: cartoesError } = await supabase
        .from('cartoes')
        .select(`
          id,
          nome,
          limite,
          dia_fechamento,
          dia_vencimento,
          bandeira,
          banco,
          cor,
          ativo,
          conta_debito_id,
          created_at,
          updated_at
        `)
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (cartoesError) throw cartoesError;

      // Para cada cartão, calcular dados adicionais
      const cartoesEnriquecidos = await Promise.all(
        cartoes.map(async (cartao) => {
          // Buscar gasto atual (transações não efetivadas)
          const { data: gastoAtual } = await supabase
            .from('transacoes')
            .select('valor')
            .eq('cartao_id', cartao.id)
            .eq('usuario_id', user.id)
            .eq('efetivado', false);

          const gasto_atual = gastoAtual?.reduce((total, t) => total + (parseFloat(t.valor) || 0), 0) || 0;

          // Calcular próximo vencimento
          const proximaFatura = await calcularProximaFatura(cartao);

          return {
            ...cartao,
            gasto_atual,
            proxima_fatura_vencimento: proximaFatura.data_vencimento,
            mes_referencia_atual: proximaFatura.mes_referencia
          };
        })
      );

      return cartoesEnriquecidos;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar cartões:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ BUSCAR RESUMO CONSOLIDADO POR MÊS
  const fetchResumoConsolidado = useCallback(async (mesSelecionado) => {
    if (!user?.id) return null;

    try {
      setLoading(true);
      setError(null);

      const [anoMes, mesNumero] = mesSelecionado.split('-');
      const dataInicio = new Date(parseInt(anoMes), parseInt(mesNumero) - 1, 1);
      const dataFim = new Date(parseInt(anoMes), parseInt(mesNumero), 0);

      // Buscar cartões ativos
      const { data: cartoes } = await supabase
        .from('cartoes')
        .select('id, limite, dia_vencimento')
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      if (!cartoes?.length) {
        return {
          total_faturas_abertas: 0,
          limite_total: 0,
          total_gasto_periodo: 0,
          percentual_utilizacao_medio: 0,
          proxima_fatura_vencimento: null,
          dias_proximo_vencimento: 0,
          cartoes_ativos: 0
        };
      }

      // Calcular totais
      const limite_total = cartoes.reduce((total, c) => total + (c.limite || 0), 0);

      // Buscar gastos do período
      const { data: transacoesPeriodo } = await supabase
        .from('transacoes')
        .select('valor, efetivado')
        .eq('usuario_id', user.id)
        .in('cartao_id', cartoes.map(c => c.id))
        .gte('data', dataInicio.toISOString().split('T')[0])
        .lte('data', dataFim.toISOString().split('T')[0]);

      const total_gasto_periodo = transacoesPeriodo?.reduce((total, t) => total + (parseFloat(t.valor) || 0), 0) || 0;
      const total_faturas_abertas = transacoesPeriodo?.filter(t => !t.efetivado).reduce((total, t) => total + (parseFloat(t.valor) || 0), 0) || 0;

      // Calcular próximo vencimento geral
      const hoje = new Date();
      let proximaFaturaVencimento = null;
      let diasProximoVencimento = Infinity;

      cartoes.forEach(cartao => {
        const proximaFatura = calcularProximaFaturaSync(cartao, hoje);
        const dias = Math.ceil((new Date(proximaFatura.data_vencimento) - hoje) / (1000 * 60 * 60 * 24));
        
        if (dias < diasProximoVencimento) {
          diasProximoVencimento = dias;
          proximaFaturaVencimento = proximaFatura.data_vencimento;
        }
      });

      const percentual_utilizacao_medio = limite_total > 0 ? (total_faturas_abertas / limite_total) * 100 : 0;

      return {
        total_faturas_abertas,
        limite_total,
        total_gasto_periodo,
        percentual_utilizacao_medio,
        proxima_fatura_vencimento: proximaFaturaVencimento,
        dias_proximo_vencimento: diasProximoVencimento === Infinity ? 0 : diasProximoVencimento,
        cartoes_ativos: cartoes.length
      };
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar resumo consolidado:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ BUSCAR TRANSAÇÕES DE FATURA - QUERY CORRIGIDA
  const fetchTransacoesFatura = useCallback(async (cartaoId, faturaVencimento, incluirTodas = true) => {
    if (!user?.id || !cartaoId || !faturaVencimento) return [];

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Buscando transações - QUERY CORRIGIDA:', {
        cartaoId,
        faturaVencimento,
        faturaVencimentoType: typeof faturaVencimento,
        user: user.id
      });

      // ✅ QUERY CORRIGIDA SEM CARACTERES INVÁLIDOS
      let query = supabase
        .from('transacoes')
        .select(`
          id,
          cartao_id,
          categoria_id,
          subcategoria_id,
          descricao,
          valor,
          data,
          efetivado,
          data_efetivacao,
          parcela_atual,
          total_parcelas,
          numero_parcelas,
          fatura_vencimento,
          grupo_parcelamento,
          observacoes
        `)
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .eq('fatura_vencimento', faturaVencimento)
        .order('data', { ascending: false });

      // Se incluirTodas for false, filtrar apenas efetivadas
      if (!incluirTodas) {
        query = query.eq('efetivado', true);
      }

      const { data: transacoes, error: supabaseError } = await query;

      console.log('📦 Resultado da query corrigida:', { 
        transacoes, 
        error: supabaseError, 
        count: transacoes?.length 
      });

      if (supabaseError) throw supabaseError;

      // ✅ Buscar categorias separadamente para evitar problemas de join
      const transacoesComCategorias = await Promise.all(
        (transacoes || []).map(async (transacao) => {
          let categoria = null;
          
          if (transacao.categoria_id) {
            const { data: catData } = await supabase
              .from('categorias')
              .select('nome, cor, icone')
              .eq('id', transacao.categoria_id)
              .single();
            
            categoria = catData;
          }

          return {
            ...transacao,
            categoria_nome: categoria?.nome || 'Sem categoria',
            categoria_cor: categoria?.cor || '#6B7280',
            categoria_icone: categoria?.icone || 'help'
          };
        })
      );

      console.log('✅ Transações processadas:', transacoesComCategorias);
      return transacoesComCategorias;
    } catch (err) {
      setError(err.message);
      console.error('❌ Erro ao buscar transações da fatura:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ BUSCAR FATURAS DISPONÍVEIS POR CARTÃO ORDENADAS
  const fetchFaturasDisponiveis = useCallback(async (cartaoId) => {
    if (!user?.id || !cartaoId) return [];

    try {
      setLoading(true);
      setError(null);

      console.log('💳 Buscando faturas reais para cartão:', cartaoId);

      // ✅ Buscar faturas baseadas nos vencimentos REAIS das transações
      const { data, error: supabaseError } = await supabase
        .from('transacoes')
        .select(`
          fatura_vencimento,
          efetivado,
          data_efetivacao,
          valor
        `)
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .not('fatura_vencimento', 'is', null)
        .order('fatura_vencimento', { ascending: true });

      if (supabaseError) throw supabaseError;

      console.log('📊 Transações encontradas para agrupamento:', data);

      // Agrupar por fatura_vencimento REAL
      const faturasPorVencimento = {};
      
      data.forEach(transacao => {
        const chave = transacao.fatura_vencimento;
        
        if (!faturasPorVencimento[chave]) {
          faturasPorVencimento[chave] = {
            fatura_vencimento: transacao.fatura_vencimento,
            valor_total: 0,
            total_transacoes: 0,
            transacoes_efetivadas: 0,
            data_efetivacao: null,
            status_paga: false
          };
        }
        
        faturasPorVencimento[chave].valor_total += parseFloat(transacao.valor || 0);
        faturasPorVencimento[chave].total_transacoes += 1;
        
        if (transacao.efetivado) {
          faturasPorVencimento[chave].transacoes_efetivadas += 1;
          
          if (transacao.data_efetivacao && !faturasPorVencimento[chave].data_efetivacao) {
            faturasPorVencimento[chave].data_efetivacao = transacao.data_efetivacao;
          }
        }
      });

      // Determinar status_paga
      Object.values(faturasPorVencimento).forEach(fatura => {
        fatura.status_paga = fatura.total_transacoes > 0 && 
                            fatura.transacoes_efetivadas === fatura.total_transacoes;
      });

      const resultado = Object.values(faturasPorVencimento)
        .sort((a, b) => new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento));

      console.log('✅ Faturas processadas:', resultado);
      return resultado;

    } catch (err) {
      setError(err.message);
      console.error('❌ Erro ao buscar faturas disponíveis:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ BUSCAR GASTOS POR CATEGORIA EM FATURA
  const fetchGastosPorCategoria = useCallback(async (cartaoId, faturaVencimento) => {
    if (!user?.id || !cartaoId || !faturaVencimento) {
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('transacoes')
        .select(`
          valor,
          categoria_id,
          categorias(nome, cor, icone)
        `)
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .eq('fatura_vencimento', faturaVencimento);

      if (supabaseError) throw supabaseError;

      // Agrupar por categoria
      const gastosPorCategoria = {};
      let valorTotal = 0;

      data.forEach(transacao => {
        const valor = parseFloat(transacao.valor || 0);
        valorTotal += valor;

        const categoria = transacao.categorias || { nome: 'Sem categoria', cor: '#6B7280', icone: 'help' };
        const chave = categoria.nome;

        if (!gastosPorCategoria[chave]) {
          gastosPorCategoria[chave] = {
            categoria_id: transacao.categoria_id,
            categoria_nome: categoria.nome,
            categoria_cor: categoria.cor,
            categoria_icone: categoria.icone,
            valor_total: 0,
            quantidade_transacoes: 0
          };
        }

        gastosPorCategoria[chave].valor_total += valor;
        gastosPorCategoria[chave].quantidade_transacoes += 1;
      });

      // Converter para array e calcular percentuais
      const resultado = Object.values(gastosPorCategoria)
        .map(categoria => ({
          ...categoria,
          percentual: valorTotal > 0 ? (categoria.valor_total / valorTotal) * 100 : 0
        }))
        .sort((a, b) => b.valor_total - a.valor_total);

      return resultado;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar gastos por categoria:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ VERIFICAR STATUS DE FATURA
  const verificarStatusFatura = useCallback(async (cartaoId, faturaVencimento) => {
    if (!user?.id || !cartaoId || !faturaVencimento) {
      return { 
        status_paga: false, 
        total_transacoes: 0, 
        transacoes_efetivadas: 0,
        data_efetivacao: null 
      };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('transacoes')
        .select('efetivado, data_efetivacao')
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .eq('fatura_vencimento', faturaVencimento);

      if (supabaseError) throw supabaseError;

      const transacoes_efetivadas = data.filter(t => t.efetivado === true).length;
      const status_paga = data.length > 0 && transacoes_efetivadas === data.length;
      const data_efetivacao = data.find(t => t.data_efetivacao)?.data_efetivacao || null;

      return {
        status_paga,
        total_transacoes: data.length,
        transacoes_efetivadas,
        data_efetivacao
      };
    } catch (err) {
      setError(err.message);
      console.error('Erro ao verificar status da fatura:', err);
      return { 
        status_paga: false, 
        total_transacoes: 0, 
        transacoes_efetivadas: 0,
        data_efetivacao: null 
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ CALCULAR FATURA VENCIMENTO PARA O MODAL
  const calcularFaturaVencimento = useCallback(async (cartaoId, dataCompra) => {
    if (!user?.id || !cartaoId || !dataCompra) return null;

    try {
      // Buscar dados do cartão
      const { data: cartao, error: cartaoError } = await supabase
        .from('cartoes')
        .select('dia_fechamento, dia_vencimento')
        .eq('id', cartaoId)
        .eq('usuario_id', user.id)
        .single();

      if (cartaoError) throw cartaoError;

      const dataCompraObj = new Date(dataCompra + 'T12:00:00');
      const diaFechamento = cartao.dia_fechamento || 1;
      const diaVencimento = cartao.dia_vencimento || 10;

      // Calcular data de fechamento do mês da compra
      let dataFechamento = new Date(dataCompraObj.getFullYear(), dataCompraObj.getMonth(), diaFechamento);
      
      // Se a compra foi após o fechamento, considerar próximo mês
      if (dataCompraObj > dataFechamento) {
        dataFechamento = new Date(dataCompraObj.getFullYear(), dataCompraObj.getMonth() + 1, diaFechamento);
      }
      
      // Calcular data de vencimento
      let dataVencimentoCalculada = new Date(dataFechamento.getFullYear(), dataFechamento.getMonth(), diaVencimento);
      
      // Se vencimento é antes ou igual ao fechamento, é do próximo mês
      if (diaVencimento <= diaFechamento) {
        dataVencimentoCalculada = new Date(dataFechamento.getFullYear(), dataFechamento.getMonth() + 1, diaVencimento);
      }

      return {
        data_fechamento: dataFechamento.toISOString().slice(0, 10),
        data_vencimento: dataVencimentoCalculada.toISOString().slice(0, 10),
        mes_referencia: dataVencimentoCalculada.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        })
      };
    } catch (err) {
      setError(err.message);
      console.error('Erro ao calcular fatura vencimento:', err);
      return null;
    }
  }, [user?.id]);

  // ✅ FUNÇÃO AUXILIAR PARA CALCULAR PRÓXIMA FATURA (ASYNC)
  const calcularProximaFatura = async (cartao) => {
    try {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      
      // Calcular próximo vencimento
      let proximoVencimento = new Date(anoAtual, mesAtual, cartao.dia_vencimento);
      
      // Se já passou do vencimento deste mês, calcular próximo mês
      if (proximoVencimento <= hoje) {
        proximoVencimento = new Date(anoAtual, mesAtual + 1, cartao.dia_vencimento);
      }

      return {
        data_vencimento: proximoVencimento.toISOString().slice(0, 10),
        mes_referencia: proximoVencimento.toISOString().slice(0, 7) + '-01'
      };
    } catch (err) {
      console.error('Erro ao calcular próxima fatura:', err);
      return {
        data_vencimento: null,
        mes_referencia: null
      };
    }
  };

  // ✅ FUNÇÃO AUXILIAR PARA CALCULAR PRÓXIMA FATURA (SYNC)
  const calcularProximaFaturaSync = (cartao, hoje = new Date()) => {
    try {
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      
      // Calcular próximo vencimento
      let proximoVencimento = new Date(anoAtual, mesAtual, cartao.dia_vencimento);
      
      // Se já passou do vencimento deste mês, calcular próximo mês
      if (proximoVencimento <= hoje) {
        proximoVencimento = new Date(anoAtual, mesAtual + 1, cartao.dia_vencimento);
      }

      return {
        data_vencimento: proximoVencimento.toISOString().slice(0, 10),
        mes_referencia: proximoVencimento.toISOString().slice(0, 7) + '-01'
      };
    } catch (err) {
      console.error('Erro ao calcular próxima fatura sync:', err);
      return {
        data_vencimento: null,
        mes_referencia: null
      };
    }
  };

  return {
    loading,
    error,
    
    // Funções de leitura corrigidas
    fetchCartoes,
    fetchTransacoesFatura,
    fetchFaturasDisponiveis,
    fetchResumoConsolidado,
    fetchGastosPorCategoria,
    verificarStatusFatura,
    calcularFaturaVencimento
  };
};

export default useCartoesData;