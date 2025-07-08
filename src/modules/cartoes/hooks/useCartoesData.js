// src/modules/cartoes/hooks/useCartoesData.js
// ✅ REFATORADO: Para trabalhar com parcelas de outras faturas + nova lógica de efetivação + conta_id

import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';

/**
 * Hook para leitura de dados relacionados a cartões
 * ✅ NOVO: Suporte para buscar parcelas de outras faturas quando necessário
 * ✅ AJUSTADO: Considera campo conta_id nas transações efetivadas
 */
export const useCartoesData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * ✅ FUNÇÃO MANTIDA: Lógica corrigida para calcular fatura alvo
   */
  const calcularFaturaAlvoCorreto = (cartao, dataCompra) => {
    try {
      const dataCompraUTC = new Date(dataCompra + 'T12:00:00.000Z');
      const diaFechamento = cartao.dia_fechamento || 1;
      const diaVencimento = cartao.dia_vencimento || 10;
      
      console.log('🎯 CALCULANDO FATURA ALVO (useCartoesData):');
      console.log('  Data da compra:', dataCompra);
      console.log('  Dia fechamento:', diaFechamento);
      console.log('  Dia vencimento:', diaVencimento);
      
      const anoCompra = dataCompraUTC.getUTCFullYear();
      const mesCompra = dataCompraUTC.getUTCMonth();
      const diaCompra = dataCompraUTC.getUTCDate();
      
      console.log('  Dia da compra:', diaCompra);
      
      let anoFaturaAlvo = anoCompra;
      let mesFaturaAlvo = mesCompra;
      
      // Se a compra foi APÓS o fechamento, vai para próxima fatura
      if (diaCompra > diaFechamento) {
        console.log('  ✅ COMPRA APÓS FECHAMENTO - Indo para próxima fatura');
        mesFaturaAlvo = mesCompra + 1;
        
        if (mesFaturaAlvo > 11) {
          mesFaturaAlvo = 0;
          anoFaturaAlvo = anoCompra + 1;
        }
      } else {
        console.log('  ✅ COMPRA ANTES/NO FECHAMENTO - Indo para fatura atual');
      }
      
      // Calcular data de vencimento da fatura alvo
      let dataVencimentoFinal = new Date(Date.UTC(anoFaturaAlvo, mesFaturaAlvo, diaVencimento));
      
      // Se vencimento é antes ou igual ao fechamento, a fatura vence no mês seguinte
      if (diaVencimento <= diaFechamento) {
        console.log('  ⚠️ VENCIMENTO ≤ FECHAMENTO - Ajustando para mês seguinte');
        const novoMes = mesFaturaAlvo + 1;
        if (novoMes > 11) {
          dataVencimentoFinal = new Date(Date.UTC(anoFaturaAlvo + 1, 0, diaVencimento));
        } else {
          dataVencimentoFinal = new Date(Date.UTC(anoFaturaAlvo, novoMes, diaVencimento));
        }
      }
      
      // Verificar se o dia existe no mês
      if (dataVencimentoFinal.getUTCDate() !== diaVencimento) {
        dataVencimentoFinal = new Date(Date.UTC(
          dataVencimentoFinal.getUTCFullYear(), 
          dataVencimentoFinal.getUTCMonth() + 1, 
          0
        ));
        console.log('  ⚠️ DIA AJUSTADO para último dia do mês');
      }
      
      const faturaVencimentoString = dataVencimentoFinal.toISOString().split('T')[0];
      
      console.log('  🎯 RESULTADO FINAL (useCartoesData):');
      console.log('    Fatura vencimento:', faturaVencimentoString);
      
      return {
        data_fechamento: new Date(Date.UTC(anoFaturaAlvo, mesFaturaAlvo, diaFechamento)).toISOString().split('T')[0],
        data_vencimento: faturaVencimentoString,
        mes_referencia: dataVencimentoFinal.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        })
      };
      
    } catch (err) {
      console.error('❌ Erro ao calcular fatura alvo:', err);
      const hoje = new Date();
      const proximoMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, cartao.dia_vencimento || 10));
      return {
        data_fechamento: new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, cartao.dia_fechamento || 1)).toISOString().split('T')[0],
        data_vencimento: proximoMes.toISOString().split('T')[0],
        mes_referencia: proximoMes.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        })
      };
    }
  };

  const calcularDataParcela = (faturaVencimento, diaCompraOriginal) => {
  try {
    // Extrair ano e mês da fatura de vencimento
    const dataFatura = new Date(faturaVencimento + 'T12:00:00.000Z');
    const anoFatura = dataFatura.getUTCFullYear();
    const mesFatura = dataFatura.getUTCMonth();
    
    // Usar o dia da compra original, mas no mês/ano da fatura
    const diaOriginal = new Date(diaCompraOriginal + 'T12:00:00.000Z').getUTCDate();
    
    // Criar data da parcela no mês da fatura
    let dataParcela = new Date(Date.UTC(anoFatura, mesFatura, diaOriginal));
    
    // Se o dia não existe no mês da fatura (ex: 31 em fevereiro), usar último dia
    if (dataParcela.getUTCDate() !== diaOriginal) {
      dataParcela = new Date(Date.UTC(anoFatura, mesFatura + 1, 0)); // Último dia do mês
    }
    
    return dataParcela.toISOString().split('T')[0];
  } catch (err) {
    console.error('❌ Erro ao calcular data da parcela:', err);
    return diaCompraOriginal; // Fallback para data original
  }
};

  // ✅ BUSCAR CARTÕES ATIVOS COM DADOS CALCULADOS (mantida)
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
          // ✅ AJUSTADO: Buscar gasto atual (transações não efetivadas)
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

  // ✅ BUSCAR RESUMO CONSOLIDADO POR MÊS (mantida)
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

      // ✅ AJUSTADO: Buscar gastos do período (todos, não apenas não efetivados)
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

  // ✅ NOVA LÓGICA: BUSCAR TRANSAÇÕES DE FATURA com suporte a parcelas externas
  const fetchTransacoesFatura = useCallback(async (cartaoId, faturaVencimento, incluirParcelasExternas = false) => {
    if (!user?.id || !cartaoId || !faturaVencimento) return [];

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 NOVA LÓGICA: Buscando transações com suporte a parcelas externas:', {
        cartaoId,
        faturaVencimento,
        incluirParcelasExternas,
        user: user.id
      });

      // ✅ ETAPA 1: Buscar transações da fatura atual
      const { data: transacoesFaturaAtual, error: faturaError } = await supabase
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
          conta_id,
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

      if (faturaError) throw faturaError;

      console.log('📦 Transações da fatura atual:', transacoesFaturaAtual?.length || 0);

      let todasTransacoes = [...(transacoesFaturaAtual || [])];

      // ✅ ETAPA 2: Se solicitado, buscar parcelas relacionadas de outras faturas
      if (incluirParcelasExternas) {
        // Identificar grupos de parcelamento
        const gruposParcelamento = [...new Set(
          transacoesFaturaAtual
            .filter(t => t.grupo_parcelamento)
            .map(t => t.grupo_parcelamento)
        )];

        console.log('🔗 Grupos de parcelamento encontrados:', gruposParcelamento.length);

        if (gruposParcelamento.length > 0) {
          // Buscar TODAS as parcelas dos grupos encontrados (de outras faturas)
          const { data: parcelasExternas, error: parcelasError } = await supabase
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
              conta_id,
              parcela_atual,
              total_parcelas,
              numero_parcelas,
              fatura_vencimento,
              grupo_parcelamento,
              observacoes
            `)
            .eq('usuario_id', user.id)
            .eq('cartao_id', cartaoId)
            .in('grupo_parcelamento', gruposParcelamento)
            .neq('fatura_vencimento', faturaVencimento) // ✅ APENAS outras faturas
            .order('parcela_atual', { ascending: true });

          if (!parcelasError && parcelasExternas) {
            console.log('🔗 Parcelas externas encontradas:', parcelasExternas.length);
            
            // Marcar como externas para tratamento diferenciado
            const parcelasComMarcacao = parcelasExternas.map(p => ({
              ...p,
              eh_parcela_externa: true,
              pode_editar: !p.efetivado,
              pode_excluir: !p.efetivado
            }));

            todasTransacoes = [...todasTransacoes, ...parcelasComMarcacao];
          }
        }
      }

      // ✅ ETAPA 3: Marcar transações da fatura atual
      const transacoesMarcadas = todasTransacoes.map(t => ({
        ...t,
        eh_da_fatura_atual: t.fatura_vencimento === faturaVencimento,
        eh_parcela_externa: t.eh_parcela_externa || false,
        pode_editar: t.pode_editar !== undefined ? t.pode_editar : !t.efetivado,
        pode_excluir: t.pode_excluir !== undefined ? t.pode_excluir : !t.efetivado
      }));

      // ✅ ETAPA 4: Enriquecer com dados de categoria e conta
const transacoesEnriquecidas = await Promise.all(
  transacoesMarcadas.map(async (transacao) => {
    let categoria = null;
    let conta = null;
    
    // Buscar categoria
    if (transacao.categoria_id) {
      const { data: catData } = await supabase
        .from('categorias')
        .select('nome, cor, icone')
        .eq('id', transacao.categoria_id)
        .single();
      
      categoria = catData;
    }

    // Buscar informações da conta se transação foi efetivada
    if (transacao.conta_id) {
      const { data: contaData } = await supabase
        .from('contas')
        .select('nome, tipo, banco')
        .eq('id', transacao.conta_id)
        .single();
      
      conta = contaData;
    }

    // ✅ NOVO: Calcular data correta da parcela
    let dataExibicao = transacao.data;
    
    // Se é uma parcela, calcular data baseada na fatura
    if (transacao.grupo_parcelamento && transacao.fatura_vencimento) {
      dataExibicao = calcularDataParcela(transacao.fatura_vencimento, transacao.data);
    }

    return {
      ...transacao,
      data_exibicao: dataExibicao, // ✅ NOVA PROPRIEDADE: Data correta para exibir
      categoria_nome: categoria?.nome || 'Sem categoria',
      categoria_cor: categoria?.cor || '#6B7280',
      categoria_icone: categoria?.icone || 'help',
      conta_pagamento_nome: conta?.nome || null,
      conta_pagamento_tipo: conta?.tipo || null,
      conta_pagamento_banco: conta?.banco || null
    };
  })
);

      console.log('✅ NOVA LÓGICA: Transações processadas:', {
        total: transacoesEnriquecidas.length,
        faturaAtual: transacoesEnriquecidas.filter(t => t.eh_da_fatura_atual).length,
        parcelasExternas: transacoesEnriquecidas.filter(t => t.eh_parcela_externa).length
      });

      return transacoesEnriquecidas;

    } catch (err) {
      setError(err.message);
      console.error('❌ Erro ao buscar transações da fatura:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ NOVA FUNÇÃO: Buscar parcelas completas de um grupo específico
  const fetchParcelasCompletas = useCallback(async (grupoParcelamento) => {
    if (!user?.id || !grupoParcelamento) return [];

    try {
      console.log('🔗 Buscando parcelas completas do grupo:', grupoParcelamento);

      const { data: parcelas, error } = await supabase
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
          conta_id,
          parcela_atual,
          total_parcelas,
          numero_parcelas,
          fatura_vencimento,
          grupo_parcelamento,
          observacoes
        `)
        .eq('usuario_id', user.id)
        .eq('grupo_parcelamento', grupoParcelamento)
        .order('parcela_atual', { ascending: true });

      if (error) throw error;

      // Enriquecer com dados de categoria
const parcelasComDados = await Promise.all(
  (parcelas || []).map(async (parcela) => {
    let categoria = null;
    let conta = null;
    
    // Buscar categoria
    if (parcela.categoria_id) {
      const { data: catData } = await supabase
        .from('categorias')
        .select('nome, cor, icone')
        .eq('id', parcela.categoria_id)
        .single();
      
      categoria = catData;
    }

    // Buscar informações da conta se transação foi efetivada
    if (parcela.conta_id) {
      const { data: contaData } = await supabase
        .from('contas')
        .select('nome, tipo, banco')
        .eq('id', parcela.conta_id)
        .single();
      
      conta = contaData;
    }

    // ✅ NOVO: Calcular data correta da parcela
    let dataExibicao = parcela.data;
    
    // Se é uma parcela, calcular data baseada na fatura
    if (parcela.grupo_parcelamento && parcela.fatura_vencimento) {
      dataExibicao = calcularDataParcela(parcela.fatura_vencimento, parcela.data);
    }

    return {
      ...parcela,
      data_exibicao: dataExibicao, // ✅ NOVA PROPRIEDADE: Data correta para exibir
      categoria_nome: categoria?.nome || 'Sem categoria',
      categoria_cor: categoria?.cor || '#6B7280',
      categoria_icone: categoria?.icone || 'help',
      conta_pagamento_nome: conta?.nome || null,
      conta_pagamento_tipo: conta?.tipo || null,
      conta_pagamento_banco: conta?.banco || null,
      pode_editar: !parcela.efetivado,
      pode_excluir: !parcela.efetivado
    };
  })
);

      console.log('✅ Parcelas completas carregadas:', parcelasComDados.length);
      return parcelasComDados;

    } catch (err) {
      console.error('❌ Erro ao buscar parcelas completas:', err);
      return [];
    }
  }, [user?.id]);

  // ✅ AJUSTADO: BUSCAR FATURAS DISPONÍVEIS com informações de pagamento (mantida)
  const fetchFaturasDisponiveis = useCallback(async (cartaoId) => {
    if (!user?.id || !cartaoId) return [];

    try {
      setLoading(true);
      setError(null);

      console.log('💳 Buscando faturas com informações de pagamento:', cartaoId);

      // ✅ AJUSTADO: Query incluindo conta_id para identificar como foi pago
      const { data, error: supabaseError } = await supabase
        .from('transacoes')
        .select(`
          fatura_vencimento,
          efetivado,
          data_efetivacao,
          conta_id,
          valor
        `)
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .not('fatura_vencimento', 'is', null)
        .order('fatura_vencimento', { ascending: true });

      if (supabaseError) throw supabaseError;

      console.log('📊 Transações encontradas para agrupamento:', data);

      // Agrupar por fatura_vencimento
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
            status_paga: false,
            // ✅ NOVO: Informações de pagamento
            conta_pagamento_id: null,
            conta_pagamento_nome: null,
            formas_pagamento: new Set() // Para casos de múltiplas contas
          };
        }
        
        faturasPorVencimento[chave].valor_total += parseFloat(transacao.valor || 0);
        faturasPorVencimento[chave].total_transacoes += 1;
        
        if (transacao.efetivado) {
          faturasPorVencimento[chave].transacoes_efetivadas += 1;
          
          if (transacao.data_efetivacao && !faturasPorVencimento[chave].data_efetivacao) {
            faturasPorVencimento[chave].data_efetivacao = transacao.data_efetivacao;
          }

          // ✅ NOVO: Registrar conta de pagamento
          if (transacao.conta_id) {
            faturasPorVencimento[chave].formas_pagamento.add(transacao.conta_id);
            
            // Usar a primeira conta encontrada como principal
            if (!faturasPorVencimento[chave].conta_pagamento_id) {
              faturasPorVencimento[chave].conta_pagamento_id = transacao.conta_id;
            }
          }
        }
      });

      // ✅ NOVO: Buscar nomes das contas de pagamento
      const resultado = await Promise.all(
        Object.values(faturasPorVencimento).map(async (fatura) => {
          // Determinar status_paga
          fatura.status_paga = fatura.total_transacoes > 0 && 
                              fatura.transacoes_efetivadas === fatura.total_transacoes;
          
          // Converter Set para array
          fatura.formas_pagamento = Array.from(fatura.formas_pagamento);
          
          // Buscar nome da conta principal de pagamento
          if (fatura.conta_pagamento_id) {
            const { data: contaData } = await supabase
              .from('contas')
              .select('nome, tipo')
              .eq('id', fatura.conta_pagamento_id)
              .single();
            
            if (contaData) {
              fatura.conta_pagamento_nome = contaData.nome;
              fatura.conta_pagamento_tipo = contaData.tipo;
            }
          }

          return fatura;
        })
      );

      const resultadoOrdenado = resultado.sort((a, b) => 
        new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento)
      );

      console.log('✅ Faturas processadas com informações de pagamento:', resultadoOrdenado);
      return resultadoOrdenado;

    } catch (err) {
      setError(err.message);
      console.error('❌ Erro ao buscar faturas disponíveis:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ BUSCAR GASTOS POR CATEGORIA EM FATURA (mantida)
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

  // ✅ AJUSTADO: VERIFICAR STATUS DE FATURA com informações de pagamento (mantida)
  const verificarStatusFatura = useCallback(async (cartaoId, faturaVencimento) => {
    if (!user?.id || !cartaoId || !faturaVencimento) {
      return { 
        status_paga: false, 
        total_transacoes: 0, 
        transacoes_efetivadas: 0,
        data_efetivacao: null,
        // ✅ NOVO: Informações de pagamento
        conta_pagamento_id: null,
        conta_pagamento_nome: null,
        formas_pagamento: []
      };
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ AJUSTADO: Incluir conta_id na consulta
      const { data, error: supabaseError } = await supabase
        .from('transacoes')
        .select('efetivado, data_efetivacao, conta_id')
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .eq('fatura_vencimento', faturaVencimento);

      if (supabaseError) throw supabaseError;

      const transacoes_efetivadas = data.filter(t => t.efetivado === true).length;
      const status_paga = data.length > 0 && transacoes_efetivadas === data.length;
      const data_efetivacao = data.find(t => t.data_efetivacao)?.data_efetivacao || null;

      // ✅ NOVO: Identificar contas de pagamento
      const contasPagamento = [...new Set(data.filter(t => t.conta_id).map(t => t.conta_id))];
      const contaPrincipal = contasPagamento[0] || null;

      let contaPagamentoNome = null;
      if (contaPrincipal) {
        const { data: contaData } = await supabase
          .from('contas')
          .select('nome')
          .eq('id', contaPrincipal)
          .single();
        
        contaPagamentoNome = contaData?.nome || null;
      }

      return {
        status_paga,
        total_transacoes: data.length,
        transacoes_efetivadas,
        data_efetivacao,
        // ✅ NOVO: Informações de pagamento
        conta_pagamento_id: contaPrincipal,
        conta_pagamento_nome: contaPagamentoNome,
        formas_pagamento: contasPagamento
      };
    } catch (err) {
      setError(err.message);
      console.error('Erro ao verificar status da fatura:', err);
      return { 
        status_paga: false, 
        total_transacoes: 0, 
        transacoes_efetivadas: 0,
        data_efetivacao: null,
        conta_pagamento_id: null,
        conta_pagamento_nome: null,
        formas_pagamento: []
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ CALCULAR FATURA VENCIMENTO PARA O MODAL (mantida)
  const calcularFaturaVencimento = useCallback(async (cartaoId, dataCompra) => {
    if (!user?.id || !cartaoId || !dataCompra) return null;

    try {
      const { data: cartao, error: cartaoError } = await supabase
        .from('cartoes')
        .select('dia_fechamento, dia_vencimento')
        .eq('id', cartaoId)
        .eq('usuario_id', user.id)
        .single();

      if (cartaoError) throw cartaoError;

      const resultado = calcularFaturaAlvoCorreto(cartao, dataCompra);
      
      console.log('🎯 Fatura calculada no useCartoesData:', resultado);
      
      return resultado;

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
      
      let proximoVencimento = new Date(anoAtual, mesAtual, cartao.dia_vencimento);
      
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
      
      let proximoVencimento = new Date(anoAtual, mesAtual, cartao.dia_vencimento);
      
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
    
    // Funções de leitura ajustadas para nova lógica
    fetchCartoes,
    fetchTransacoesFatura, // ✅ NOVA LÓGICA: Suporte a parcelas externas
    fetchParcelasCompletas, // ✅ NOVA FUNÇÃO: Buscar parcelas completas
    fetchFaturasDisponiveis, // ✅ AJUSTADO: Inclui informações de pagamento
    fetchResumoConsolidado,
    fetchGastosPorCategoria,
    verificarStatusFatura, // ✅ AJUSTADO: Inclui informações de pagamento
    calcularFaturaVencimento,
    
    // ✅ FUNÇÃO EXPORTADA
    calcularFaturaAlvoCorreto
  };
};

export default useCartoesData;