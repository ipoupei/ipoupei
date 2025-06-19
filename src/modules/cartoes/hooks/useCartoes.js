// src/modules/cartoes/hooks/useCartoes.js - REFATORADO PARA USAR fatura_vencimento
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuthStore } from '../../auth/store/authStore';
import { useUIStore } from '../../../store/uiStore';
import useCartoesStore from '../store/cartoesStore';

/**
 * Hook para gerenciar cartões COM NOVA ARQUITETURA fatura_vencimento
 * ✅ REFATORADO: Usar get_faturas_disponiveis_por_cartao e fatura_vencimento como chave
 * ✅ DIFERENCIAÇÃO: limite_usado (global) vs valor_fatura (específica)
 */
const useCartoes = () => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const { 
    setCartoes, 
    setFaturaDetalhada, 
    cartoes, 
    faturaDetalhada,
    setLoadingCartoes,
    setLoadingFatura,
    setErrorCartoes,
    setErrorFatura
  } = useCartoesStore();
  
  // Estados locais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache para evitar re-fetches desnecessários
  const [lastFetch, setLastFetch] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // ========== BUSCAR TODOS OS CARTÕES DO USUÁRIO ==========
  const fetchCartoes = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      console.warn('useCartoes: Usuário não encontrado');
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar cache
    const now = Date.now();
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION && cartoes.length > 0) {
      console.log('useCartoes: Usando cache');
      return { success: true, data: cartoes };
    }

    try {
      setLoading(true);
      setLoadingCartoes(true);
      setError(null);
      setErrorCartoes(null);

      console.log('🔍 Buscando cartões do usuário:', user.id);

      // Buscar cartões ativos do usuário
      const { data: cartoesData, error: cartoesError } = await supabase
        .from('cartoes')
        .select(`
          id,
          nome,
          bandeira,
          banco,
          limite,
          cor,
          dia_fechamento,
          dia_vencimento,
          ativo,
          conta_debito_id,
          observacoes,
          created_at,
          updated_at
        `)
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (cartoesError) {
        console.error('❌ Erro do Supabase:', cartoesError);
        throw cartoesError;
      }

      // ✅ NOVO: Para cada cartão, calcular limite usado e fatura atual usando RPCs
      const cartoesComDados = await Promise.all(
        (cartoesData || []).map(async (cartao) => {
          try {
            // ✅ NOVO: Calcular limite usado (todas transações não efetivadas do cartão)
            const { data: limiteUsado, error: limiteError } = await supabase
              .rpc('get_limite_usado_cartao', {
                p_usuario_id: user.id,
                p_cartao_id: cartao.id
              });

            if (limiteError) {
              console.error('Erro ao buscar limite usado:', cartao.id, limiteError);
              var valorLimiteUsado = 0;
            } else {
              var valorLimiteUsado = parseFloat(limiteUsado || 0);
            }

            // ✅ NOVO: Buscar fatura atual usando RPC
            const { data: faturaAtual, error: faturaError } = await supabase
              .rpc('get_fatura_atual_cartao', {
                p_usuario_id: user.id,
                p_cartao_id: cartao.id
              });

            let valorFaturaAtual = 0;
            let dataFaturaAtual = null;

            if (faturaError) {
              console.error('Erro ao buscar fatura atual:', cartao.id, faturaError);
            } else if (faturaAtual) {
              // ✅ BUSCAR: Valor da fatura atual específica
              const { data: valorFatura, error: valorError } = await supabase
                .rpc('get_fatura_cartao_valor_total', {
                  p_usuario_id: user.id,
                  p_cartao_id: cartao.id,
                  p_fatura_vencimento: faturaAtual
                });

              if (!valorError) {
                valorFaturaAtual = parseFloat(valorFatura || 0);
                dataFaturaAtual = faturaAtual;
              }
            }

            // Calcular percentual do limite usado
            const percentualLimite = cartao.limite > 0 
              ? Math.round((valorLimiteUsado / cartao.limite) * 100) 
              : 0;

            // Usar data da fatura atual ou calcular próximo vencimento
            const proximoVencimento = dataFaturaAtual || calcularProximoVencimento(cartao.dia_vencimento);

            console.log(`✅ Dados calculados para ${cartao.nome}:`, {
              limite_usado: valorLimiteUsado,
              fatura_atual: valorFaturaAtual,
              fatura_vencimento: dataFaturaAtual,
              percentual: percentualLimite
            });

            return {
              ...cartao,
              limite_usado: valorLimiteUsado, // ✅ NOVO: Limite usado real (global)
              fatura_atual: valorFaturaAtual, // ✅ NOVO: Valor da fatura atual específica
              fatura_vencimento_atual: dataFaturaAtual, // ✅ NOVO: Data de vencimento da fatura atual
              percentual_limite: percentualLimite, // ✅ CORRIGIDO: Baseado no limite usado
              vencimento: proximoVencimento,
              status: 'aberta'
            };
          } catch (err) {
            console.error('Erro ao processar cartão:', cartao.id, err);
            return {
              ...cartao,
              limite_usado: 0,
              fatura_atual: 0,
              fatura_vencimento_atual: null,
              percentual_limite: 0,
              vencimento: calcularProximoVencimento(cartao.dia_vencimento),
              status: 'aberta'
            };
          }
        })
      );

      console.log('✅ Cartões carregados com dados reais via RPCs:', cartoesComDados?.length || 0);
      setCartoes(cartoesComDados);
      setLastFetch(now);
      
      return { success: true, data: cartoesComDados || [] };

    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar cartões';
      console.error('❌ Erro ao buscar cartões:', err);
      setError(errorMessage);
      setErrorCartoes(errorMessage);
      
      if (showNotification) {
        showNotification(`Erro ao carregar cartões: ${errorMessage}`, 'error');
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      setLoadingCartoes(false);
    }
  }, [user?.id, lastFetch, cartoes.length, setCartoes, setLoadingCartoes, setErrorCartoes, showNotification]);

  // ✅ NOVO: Buscar faturas disponíveis de um cartão usando RPC
  const fetchFaturasDisponiveis = useCallback(async (cartaoId) => {
    if (!user?.id || !cartaoId) return [];

    try {
      console.log('📅 Buscando faturas disponíveis via RPC para cartão:', cartaoId);

      // ✅ NOVO: Usar RPC para buscar faturas disponíveis
      const { data: faturasData, error } = await supabase
        .rpc('get_faturas_disponiveis_por_cartao', {
          p_usuario_id: user.id,
          p_cartao_id: cartaoId
        });

      if (error) {
        console.error('Erro ao buscar faturas disponíveis via RPC:', error);
        return gerarFaturasFallback();
      }

      // ✅ PROCESSAR: Formatar dados das faturas com ordenação cronológica
      const faturas = (faturasData || [])
        .map(fatura => {
          // ✅ FORMATAÇÃO: Data de vencimento em português-br
          const dataVencimento = new Date(fatura.fatura_vencimento);
          const mesNomeCompleto = dataVencimento.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          });
          const mesNomeCapitalizado = mesNomeCompleto.charAt(0).toUpperCase() + mesNomeCompleto.slice(1);

          return {
            fatura_vencimento: fatura.fatura_vencimento, // ✅ CHAVE PRIMÁRIA
            mes: dataVencimento.getMonth() + 1,
            ano: dataVencimento.getFullYear(),
            mes_nome: mesNomeCapitalizado, // ✅ PORTUGUÊS-BR capitalizado
            valor_total: parseFloat(fatura.valor_total || 0),
            total_transacoes: parseInt(fatura.total_transacoes || 0),
            status: fatura.todas_efetivadas ? 'fechada' : 'aberta' // ✅ Status baseado na efetivação
          };
        })
        // ✅ ORDENAÇÃO: Cronológica crescente (mais antiga primeiro)
        .sort((a, b) => new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento));

      console.log('✅ Faturas disponíveis carregadas via RPC:', faturas.length);
      return faturas;

    } catch (error) {
      console.error('Erro na função fetchFaturasDisponiveis:', error);
      return gerarFaturasFallback();
    }
  }, [user?.id]);

  // ✅ REFATORADO: Buscar detalhes da fatura usando fatura_vencimento específica
  const fetchFaturaDetalhada = useCallback(async (cartaoId, faturaVencimento = null) => {
    if (!user?.id || !cartaoId) return { success: false, error: 'Dados insuficientes' };

    try {
      setLoadingFatura(true);
      setErrorFatura(null);

      // ✅ DEFINIR: Usar fatura_vencimento específica ou fatura atual como padrão
      let faturaVencimentoEscolhida = faturaVencimento;
      
      if (!faturaVencimentoEscolhida) {
        // Buscar fatura atual do cartão
        const { data: faturaAtual, error: faturaError } = await supabase
          .rpc('get_fatura_atual_cartao', {
            p_usuario_id: user.id,
            p_cartao_id: cartaoId
          });

        if (faturaError || !faturaAtual) {
          // Fallback para próximo vencimento
          const cartao = cartoes.find(c => c.id === cartaoId);
          const proximoVencimento = calcularProximoVencimento(cartao?.dia_vencimento || 15);
          faturaVencimentoEscolhida = proximoVencimento.toISOString().split('T')[0];
        } else {
          faturaVencimentoEscolhida = faturaAtual;
        }
      }

      console.log(`🔍 Buscando fatura detalhada: ${faturaVencimentoEscolhida} do cartão:`, cartaoId);

      // ✅ BUSCAR: Transações da fatura específica usando fatura_vencimento
      const { data: transacoesData, error: transacoesError } = await supabase
        .from('transacoes')
        .select(`
          id,
          descricao,
          valor,
          data,
          tipo,
          observacoes,
          parcela_atual,
          total_parcelas,
          grupo_parcelamento,
          efetivado,
          fatura_vencimento,
          categoria_id,
          categorias(
            id,
            nome,
            cor
          )
        `)
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .eq('tipo', 'despesa')
        .eq('fatura_vencimento', faturaVencimentoEscolhida) // ✅ FILTRO PRINCIPAL
        .order('data', { ascending: false });

      if (transacoesError) throw transacoesError;

      // ✅ PROCESSAR: Formatar transações
      const transacoesProcessadas = (transacoesData || []).map(transacao => {
        const categoria = transacao.categorias || {};
        const parcela = transacao.parcela_atual && transacao.total_parcelas 
          ? `${transacao.parcela_atual}/${transacao.total_parcelas}`
          : null;

        const status = transacao.efetivado ? 'Paga' : 'Fatura Aberta';

        return {
          id: transacao.id,
          descricao: transacao.descricao || 'Transação',
          categoria: categoria.nome || 'Outros',
          categoria_cor: categoria.cor || '#6B7280',
          valor: parseFloat(transacao.valor || 0),
          data: transacao.data,
          fatura_vencimento: transacao.fatura_vencimento,
          status,
          estabelecimento: extrairEstabelecimento(transacao.descricao),
          parcela,
          grupo_parcelamento: transacao.grupo_parcelamento,
          efetivado: transacao.efetivado !== false
        };
      });

      // ✅ CALCULAR: Gastos por categoria (apenas da fatura atual)
      const gastosPorCategoria = {};
      let totalGastosFatura = 0;

      transacoesProcessadas.forEach(transacao => {
        totalGastosFatura += transacao.valor;
        
        if (!gastosPorCategoria[transacao.categoria]) {
          gastosPorCategoria[transacao.categoria] = {
            categoria: transacao.categoria,
            cor: transacao.categoria_cor,
            valor: 0,
            transacoes: 0
          };
        }
        gastosPorCategoria[transacao.categoria].valor += transacao.valor;
        gastosPorCategoria[transacao.categoria].transacoes += 1;
      });

      const gastosCategoria = Object.values(gastosPorCategoria)
        .map(cat => ({
          ...cat,
          percentual: totalGastosFatura > 0 ? Math.round((cat.valor / totalGastosFatura) * 100) : 0
        }))
        .sort((a, b) => b.valor - a.valor);

      // ✅ COMPARATIVO: Buscar fatura anterior
      const dataFaturaAtual = new Date(faturaVencimentoEscolhida);
      const faturaAnterior = new Date(dataFaturaAtual);
      faturaAnterior.setMonth(faturaAnterior.getMonth() - 1);
      const faturaAnteriorStr = faturaAnterior.toISOString().split('T')[0];

      const { data: valorAnterior, error: anteriorError } = await supabase
        .rpc('get_fatura_cartao_valor_total', {
          p_usuario_id: user.id,
          p_cartao_id: cartaoId,
          p_fatura_vencimento: faturaAnteriorStr
        });

      const valorMesAnterior = parseFloat(valorAnterior || 0);
      const variacaoPercentual = valorMesAnterior > 0 
        ? Math.round(((totalGastosFatura - valorMesAnterior) / valorMesAnterior) * 100)
        : 0;

      // ✅ MONTAR: Objeto da fatura detalhada
      const faturaDetalhada = {
        transacoes: transacoesProcessadas,
        gastos_categoria: gastosCategoria,
        valor_total_fatura: totalGastosFatura, // ✅ VALOR CORRETO DA FATURA
        fatura_vencimento: faturaVencimentoEscolhida, // ✅ NOVA CHAVE PRIMÁRIA
        comparativo_mes_anterior: {
          valor_anterior: valorMesAnterior,
          variacao_percentual: variacaoPercentual,
          tendencia: variacaoPercentual > 0 ? 'alta' : variacaoPercentual < 0 ? 'baixa' : 'estavel'
        },
        insights: {
          saude_score: calcularSaudeScore(totalGastosFatura, valorMesAnterior),
          categoria_maior_gasto: gastosCategoria[0]?.categoria || 'Nenhuma',
          categoria_crescimento: gastosCategoria[1]?.categoria || 'Nenhuma',
          dica_economia: gerarDicaEconomia(gastosCategoria, variacaoPercentual)
        }
      };

      console.log('✅ Fatura detalhada carregada:', {
        fatura_vencimento: faturaVencimentoEscolhida,
        total_transacoes: transacoesProcessadas.length,
        categorias: gastosCategoria.length,
        valor_total_fatura: totalGastosFatura
      });

      setFaturaDetalhada(faturaDetalhada);
      return { success: true, data: faturaDetalhada };

    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar fatura detalhada';
      console.error('❌ Erro ao buscar fatura detalhada:', err);
      setErrorFatura(errorMessage);
      
      if (showNotification) {
        showNotification(`Erro ao carregar fatura: ${errorMessage}`, 'error');
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoadingFatura(false);
    }
  }, [user?.id, cartoes, setFaturaDetalhada, setLoadingFatura, setErrorFatura, showNotification]);

  // ✅ NOVO: Buscar detalhes de uma fatura específica (wrapper)
  const fetchFaturaEspecifica = useCallback(async (cartaoId, faturaVencimento) => {
    if (!user?.id || !cartaoId || !faturaVencimento) return null;

    try {
      console.log(`📊 Buscando detalhes da fatura ${faturaVencimento} do cartão:`, cartaoId);

      // Simplesmente chamar fetchFaturaDetalhada com fatura_vencimento
      const resultado = await fetchFaturaDetalhada(cartaoId, faturaVencimento);
      
      if (resultado.success) {
        return resultado.data;
      } else {
        return gerarFaturaVazia();
      }

    } catch (error) {
      console.error('Erro na função fetchFaturaEspecifica:', error);
      return gerarFaturaVazia();
    }
  }, [user?.id, fetchFaturaDetalhada]);

  // ✅ MANTIDO: Adicionar despesa de cartão (sempre com efetivado = false)
  const adicionarDespesaCartao = useCallback(async (cartaoId, dadosDespesa) => {
    if (!user?.id || !cartaoId) {
      return { success: false, error: 'Dados insuficientes' };
    }

    try {
      setLoading(true);

      console.log('💳 Adicionando despesa de cartão');

      // ✅ CALCULAR: fatura_vencimento baseada na data da compra
      let faturaVencimento = dadosDespesa.fatura_vencimento;
      
      if (!faturaVencimento && dadosDespesa.data) {
        // Calcular fatura_vencimento baseada no cartão e data da compra
        const cartao = cartoes.find(c => c.id === cartaoId);
        if (cartao) {
          const { data: faturaCalculada, error: calcError } = await supabase
            .rpc('calcular_fatura_vencimento', {
              p_cartao_id: cartaoId,
              p_data_compra: dadosDespesa.data
            });

          if (!calcError && faturaCalculada) {
            faturaVencimento = faturaCalculada.data_vencimento;
          }
        }
      }

      // ✅ NOVA DESPESA: Sempre com efetivado = false e fatura_vencimento
      const despesaCompleta = {
        ...dadosDespesa,
        usuario_id: user.id,
        cartao_id: cartaoId,
        tipo: 'despesa',
        efetivado: false, // ✅ SEMPRE false para despesas de cartão
        fatura_vencimento: faturaVencimento, // ✅ CAMPO OBRIGATÓRIO
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('transacoes')
        .insert([despesaCompleta])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Despesa de cartão adicionada com fatura_vencimento:', faturaVencimento);

      // Atualizar lista de cartões
      await fetchCartoes(true);

      setLoading(false);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erro ao adicionar despesa de cartão:', error);
      setError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
  }, [user?.id, cartoes, fetchCartoes]);

  // ========== EXPORTAR DADOS DOS CARTÕES ==========
  const exportarCartoes = useCallback(async () => {
    try {
      const dados = {
        cartoes,
        data_exportacao: new Date().toISOString(),
        usuario_id: user?.id,
        total_cartoes: cartoes.length,
        total_limite: cartoes.reduce((sum, c) => sum + (c.limite || 0), 0),
        total_limite_usado: cartoes.reduce((sum, c) => sum + (c.limite_usado || 0), 0),
        total_fatura_atual: cartoes.reduce((sum, c) => sum + (c.fatura_atual || 0), 0)
      };

      const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cartoes_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (showNotification) {
        showNotification('Dados dos cartões exportados com sucesso!', 'success');
      }

      return { success: true };
    } catch (err) {
      console.error('Erro ao exportar cartões:', err);
      if (showNotification) {
        showNotification('Erro ao exportar dados dos cartões', 'error');
      }
      return { success: false, error: err.message };
    }
  }, [cartoes, user?.id, showNotification]);

  // ========== CARREGAR DADOS NA INICIALIZAÇÃO ==========
  useEffect(() => {
    if (user?.id && !lastFetch) {
      fetchCartoes();
    }
  }, [user?.id, fetchCartoes, lastFetch]);

  // ========== COMPUTAÇÕES MEMOIZADAS ==========
  const cartoesAtivos = useMemo(() => 
    cartoes.filter(cartao => cartao.ativo !== false), 
    [cartoes]
  );

  const totalLimite = useMemo(() => 
    cartoesAtivos.reduce((total, cartao) => total + (cartao.limite || 0), 0),
    [cartoesAtivos]
  );

  const totalLimiteUsado = useMemo(() => 
    cartoesAtivos.reduce((total, cartao) => total + (cartao.limite_usado || 0), 0),
    [cartoesAtivos]
  );

  const cartoesOrdenados = useMemo(() => 
    cartoesAtivos.sort((a, b) => a.nome.localeCompare(b.nome)),
    [cartoesAtivos]
  );

  const estatisticas = useMemo(() => ({
    total: cartoesAtivos.length,
    totalLimite,
    totalLimiteUsado, // ✅ NOVO: Total de limite usado
    limiteMedio: cartoesAtivos.length > 0 ? totalLimite / cartoesAtivos.length : 0,
    bandeiras: [...new Set(cartoesAtivos.map(c => c.bandeira))].length,
    totalFaturaAtual: cartoesAtivos.reduce((total, cartao) => total + (cartao.fatura_atual || 0), 0), // ✅ NOVO: Total das faturas atuais
    percentualUsoMedio: cartoesAtivos.length > 0 
      ? Math.round(cartoesAtivos.reduce((sum, c) => sum + (c.percentual_limite || 0), 0) / cartoesAtivos.length)
      : 0
  }), [cartoesAtivos, totalLimite, totalLimiteUsado]);

  // ========== RETORNO DO HOOK ==========
  return {
    // Dados principais
    cartoes: cartoesOrdenados,
    cartoesAtivos,
    faturaDetalhada,
    
    // Estados
    loading,
    error,
    isLoading: loading,
    hasCartoes: cartoesAtivos.length > 0,
    hasError: !!error,
    
    // Estatísticas
    estatisticas,

    // Ações principais
    fetchCartoes,
    fetchFaturaDetalhada,

    // Funções específicas
    fetchFaturasDisponiveis,
    fetchFaturaEspecifica,
    adicionarDespesaCartao,

    // Exportação
    exportarCartoes,

    // Helpers
    clearError: () => setError(null)
  };
};

// ========== FUNÇÕES AUXILIARES ==========

/**
 * Função de fallback para gerar faturas quando não há dados
 */
const gerarFaturasFallback = () => {
  const faturas = [];
  const hoje = new Date();
  
  // Gerar faturas dos últimos 6 meses + próximos 2
  for (let i = 6; i >= -2; i--) {
    const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth() - i, hoje.getDate());
    
    let status = 'aberta';
    if (i < 0) status = 'futura';
    
    const mesNomeCompleto = dataVencimento.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    faturas.push({
      fatura_vencimento: dataVencimento.toISOString().split('T')[0],
      mes: dataVencimento.getMonth() + 1,
      ano: dataVencimento.getFullYear(),
      mes_nome: mesNomeCompleto.charAt(0).toUpperCase() + mesNomeCompleto.slice(1),
      status,
      valor_total: 0,
      total_transacoes: 0
    });
  }
  
  // ✅ ORDENAÇÃO: Cronológica crescente (mais antiga primeiro)
  return faturas.sort((a, b) => new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento));
};

/**
 * Gerar fatura vazia para fallback
 */
const gerarFaturaVazia = () => ({
  transacoes: [],
  gastos_categoria: [],
  valor_total_fatura: 0,
  fatura_vencimento: null,
  comparativo_mes_anterior: { 
    valor_anterior: 0, 
    variacao_percentual: 0,
    tendencia: 'estavel'
  },
  insights: {
    saude_score: 75,
    categoria_maior_gasto: 'Nenhuma',
    categoria_crescimento: 'Nenhuma',
    dica_economia: 'Continue controlando seus gastos!'
  }
});

/**
 * Calcular próximo vencimento baseado no dia de vencimento
 */
const calcularProximoVencimento = (diaVencimento, dataReferencia = new Date()) => {
  const proximoVencimento = new Date(dataReferencia);
  proximoVencimento.setDate(diaVencimento || 15); // Fallback para dia 15
  proximoVencimento.setHours(23, 59, 59, 999);

  // Se a data já passou neste mês, calcular para o próximo mês
  if (proximoVencimento < dataReferencia) {
    proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
  }

  return proximoVencimento.toISOString().split('T')[0];
};

/**
 * Extrair nome do estabelecimento da descrição da transação
 */
const extrairEstabelecimento = (descricao) => {
  if (!descricao) return 'Estabelecimento';
  
  const estabelecimentos = {
    'amazon': 'Amazon',
    'netflix': 'Netflix',
    'spotify': 'Spotify',
    'ifood': 'iFood',
    'uber': 'Uber',
    'nubank': 'Nubank',
    'magazine': 'Magazine Luiza',
    'carrefour': 'Carrefour',
    'shell': 'Shell',
    'drogasil': 'Drogasil',
    'mcdonald': 'McDonald\'s',
    'zara': 'Zara'
  };

  const descricaoLower = descricao.toLowerCase();
  for (const [key, value] of Object.entries(estabelecimentos)) {
    if (descricaoLower.includes(key)) {
      return value;
    }
  }

  return 'Estabelecimento';
};

/**
 * Calcular score de saúde financeira do cartão
 */
const calcularSaudeScore = (gastoAtual, gastoAnterior) => {
  let score = 75; // Score base

  if (gastoAnterior > 0) {
    const variacao = (gastoAtual - gastoAnterior) / gastoAnterior;
    
    if (variacao <= -0.1) score += 15; // Reduziu mais de 10%
    else if (variacao <= 0) score += 10; // Reduziu ou manteve
    else if (variacao <= 0.1) score -= 5; // Aumentou até 10%
    else if (variacao <= 0.3) score -= 15; // Aumentou até 30%
    else score -= 25; // Aumentou mais de 30%
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Gerar dica de economia baseada nos gastos
 */
const gerarDicaEconomia = (categorias, variacao) => {
  if (!categorias || !categorias.length) {
    return 'Mantenha o controle dos seus gastos registrando todas as transações.';
  }

  const categoriaDestaque = categorias[0];
  
  if (variacao > 20) {
    return `Seus gastos subiram ${variacao}% este mês. Revise suas despesas em ${categoriaDestaque?.categoria || 'geral'}.`;
  } else if (variacao > 0) {
    return `Pequeno aumento nos gastos. Fique atento à categoria ${categoriaDestaque?.categoria || 'principal'}.`;
  } else {
    return 'Parabéns! Você conseguiu controlar bem seus gastos este mês. Continue assim!';
  }
};

export default useCartoes;