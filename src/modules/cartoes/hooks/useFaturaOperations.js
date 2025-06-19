// src/modules/cartoes/hooks/useFaturaOperations.js - ATUALIZADO PARA fatura_vencimento
import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import useAuth from '../../auth/hooks/useAuth';

/**
 * Hook para operações de fatura COM NOVA ARQUITETURA fatura_vencimento
 * ✅ REFATORADO: Usar fatura_vencimento como chave primária ao invés de mes/ano
 * ✅ REGRAS IMPLEMENTADAS:
 * - Despesas de cartão: data_efetivacao = NULL
 * - Pagamento de fatura: data_efetivacao = data do pagamento
 * - Reabrir fatura: data_efetivacao = NULL
 * - Estorno: data_efetivacao = NULL
 */
const useFaturaOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // ✅ REFATORADO: Verificar status usando fatura_vencimento
  const verificarStatusFatura = async (cartaoId, faturaVencimento) => {
    try {
      if (!faturaVencimento) {
        console.warn('faturaVencimento é obrigatório para verificar status');
        return { faturaEstaPaga: false, totalTransacoes: 0, transacoesEfetivadas: 0 };
      }

      console.log('🔍 Verificando status da fatura:', faturaVencimento);

      const { data, error } = await supabase
        .from('transacoes')
        .select('efetivado, conta_id, data_efetivacao') // ✅ INCLUIR data_efetivacao
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .eq('fatura_vencimento', faturaVencimento); // ✅ USAR fatura_vencimento

      if (error) throw error;

      const transacoesEfetivadas = data.filter(t => t.efetivado === true);
      const faturaEstaPaga = data.length > 0 && 
                            transacoesEfetivadas.length === data.length; // ✅ TODAS devem estar efetivadas

      console.log('✅ Status da fatura verificado:', {
        total: data.length,
        efetivadas: transacoesEfetivadas.length,
        paga: faturaEstaPaga
      });

      return {
        faturaEstaPaga,
        totalTransacoes: data.length,
        transacoesEfetivadas: transacoesEfetivadas.length,
        contaPagamento: transacoesEfetivadas[0]?.conta_id || null,
        dataEfetivacao: transacoesEfetivadas[0]?.data_efetivacao || null // ✅ NOVA INFO
      };
    } catch (err) {
      console.error('❌ Erro ao verificar status da fatura:', err);
      setError(err.message);
      return { faturaEstaPaga: false, totalTransacoes: 0, transacoesEfetivadas: 0 };
    }
  };

  // ✅ REFATORADO: Pagar fatura usando fatura_vencimento
  const pagarFatura = async (cartaoId, contaId, faturaVencimento, dataPagamento = null) => {
    setIsLoading(true);
    setError(null);

    try {
      // ✅ DEBUG: Log dos parâmetros recebidos
      console.log('🔍 Parâmetros recebidos em pagarFatura:', {
        cartaoId,
        contaId,
        faturaVencimento,
        dataPagamento,
        tipos: {
          cartaoId: typeof cartaoId,
          contaId: typeof contaId,
          faturaVencimento: typeof faturaVencimento,
          dataPagamento: typeof dataPagamento
        }
      });

      // ✅ VALIDAÇÕES RIGOROSAS
      if (!cartaoId) {
        throw new Error('cartaoId é obrigatório para pagar fatura');
      }

      if (!contaId) {
        throw new Error('contaId é obrigatório para pagar fatura');
      }

      if (!faturaVencimento) {
        throw new Error('fatura_vencimento é obrigatório para pagar fatura');
      }

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // ✅ Data de efetivação = data do pagamento (hoje se não informada)
      const dataEfetivacao = dataPagamento || new Date().toISOString().split('T')[0];
      
      console.log('💳 Pagando fatura com data_efetivacao:', dataEfetivacao);
      console.log('💳 Fatura vencimento:', faturaVencimento);

      // Buscar todas as transações da fatura que ainda não foram efetivadas
      const { data: transacoes, error: fetchError } = await supabase
        .from('transacoes')
        .select('id, descricao, valor')
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .eq('efetivado', false)
        .eq('fatura_vencimento', faturaVencimento); // ✅ USAR fatura_vencimento

      if (fetchError) {
        console.error('❌ Erro ao buscar transações:', fetchError);
        throw fetchError;
      }

      console.log('🔍 Transações encontradas para pagamento:', transacoes?.length || 0);
      
      if (!transacoes || transacoes.length === 0) {
        throw new Error('Nenhuma transação encontrada para esta fatura ou todas já estão pagas');
      }

      // ✅ Log das transações que serão efetivadas
      console.log('📝 Transações que serão efetivadas:', transacoes.map(t => ({
        id: t.id,
        descricao: t.descricao,
        valor: t.valor
      })));

      // ✅ NOVA REGRA: Atualizar todas as transações da fatura COM data_efetivacao
      const { error: updateError } = await supabase
        .from('transacoes')
        .update({ 
          conta_id: contaId, 
          efetivado: true,
          data_efetivacao: dataEfetivacao, // ✅ CAMPO OBRIGATÓRIO no pagamento
          updated_at: new Date().toISOString()
        })
        .in('id', transacoes.map(t => t.id));

      if (updateError) {
        console.error('❌ Erro ao atualizar transações:', updateError);
        throw updateError;
      }

      console.log('✅ Fatura paga com sucesso. Transações atualizadas:', transacoes.length);
      console.log('✅ Data de efetivação aplicada:', dataEfetivacao);

      setIsLoading(false);
      return { 
        success: true, 
        transacoesAtualizadas: transacoes.length,
        dataEfetivacao, // ✅ RETORNAR para controle
        faturaVencimento
      };

    } catch (err) {
      console.error('❌ Erro ao pagar fatura:', err);
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  // ✅ REFATORADO: Reabrir fatura usando fatura_vencimento
  const reabrirFatura = async (cartaoId, faturaVencimento) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!faturaVencimento) {
        throw new Error('fatura_vencimento é obrigatório para reabrir fatura');
      }

      console.log('🔓 Reabrindo fatura - limpando data_efetivacao');
      console.log('🔓 Fatura vencimento:', faturaVencimento);

      // Buscar todas as transações da fatura que foram efetivadas
      const { data: transacoes, error: fetchError } = await supabase
        .from('transacoes')
        .select('id')
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .eq('efetivado', true)
        .eq('fatura_vencimento', faturaVencimento); // ✅ USAR fatura_vencimento

      if (fetchError) throw fetchError;

      if (transacoes.length === 0) {
        throw new Error('Nenhuma transação efetivada encontrada para esta fatura');
      }

      // ✅ NOVA REGRA: Reverter todas as transações da fatura E limpar data_efetivacao
      const { error: updateError } = await supabase
        .from('transacoes')
        .update({ 
          conta_id: null, 
          efetivado: false,
          data_efetivacao: null, // ✅ LIMPAR data_efetivacao
          updated_at: new Date().toISOString()
        })
        .in('id', transacoes.map(t => t.id));

      if (updateError) throw updateError;

      console.log('✅ Fatura reaberta com sucesso. Transações revertidas:', transacoes.length);
      console.log('✅ data_efetivacao limpa para todas as transações');

      setIsLoading(false);
      return { 
        success: true, 
        transacoesRevertidas: transacoes.length,
        faturaVencimento
      };

    } catch (err) {
      console.error('❌ Erro ao reabrir fatura:', err);
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  // ✅ REFATORADO: Lançar estorno usando fatura_vencimento
  const lancarEstorno = async (cartaoId, valor, descricao, faturaVencimento, categoriaId = null) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!faturaVencimento) {
        throw new Error('fatura_vencimento é obrigatório para lançar estorno');
      }

      // Verificar se a fatura está aberta (não paga)
      const statusFatura = await verificarStatusFatura(cartaoId, faturaVencimento);
      
      if (statusFatura.faturaEstaPaga) {
        throw new Error('Não é possível lançar estorno em fatura que já foi paga');
      }

      console.log('💸 Lançando estorno - data_efetivacao = NULL');
      console.log('💸 Fatura vencimento:', faturaVencimento);

      // ✅ NOVA REGRA: Criar transação de estorno COM data_efetivacao = NULL
      const { data, error } = await supabase
        .from('transacoes')
        .insert([{
          usuario_id: user.id,
          cartao_id: cartaoId,
          conta_id: null,
          categoria_id: categoriaId,
          tipo: 'despesa',
          valor: -Math.abs(valor), // ✅ ESTORNO: Valor negativo
          descricao: descricao,
          data: new Date().toISOString().split('T')[0], // ✅ Data de hoje
          fatura_vencimento: faturaVencimento, // ✅ USAR fatura_vencimento da fatura selecionada
          data_efetivacao: null, // ✅ ESTORNO = NULL (é despesa de cartão)
          efetivado: false,
          observacoes: 'Estorno/Crédito no cartão',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      console.log('✅ Estorno lançado com data_efetivacao = NULL');

      setIsLoading(false);
      return { 
        success: true, 
        transacao: data[0],
        faturaVencimento
      };

    } catch (err) {
      console.error('❌ Erro ao lançar estorno:', err);
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  // ✅ REFATORADO: Buscar faturas abertas usando fatura_vencimento
  const buscarFaturasAbertas = async (cartaoId) => {
    try {
      // Buscar transações dos últimos 12 meses para identificar faturas abertas
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 12);

      const { data, error } = await supabase
        .from('transacoes')
        .select('fatura_vencimento, efetivado, data_efetivacao') // ✅ USAR fatura_vencimento
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .gte('data', dataInicio.toISOString().split('T')[0])
        .not('fatura_vencimento', 'is', null); // ✅ Apenas transações com fatura_vencimento

      if (error) throw error;

      // Agrupar por fatura_vencimento e verificar status
      const faturasPorVencimento = {};
      
      data.forEach(transacao => {
        const chave = transacao.fatura_vencimento;
        
        if (!faturasPorVencimento[chave]) {
          const dataVencimento = new Date(transacao.fatura_vencimento);
          const mesNomeCompleto = dataVencimento.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          });

          faturasPorVencimento[chave] = {
            fatura_vencimento: transacao.fatura_vencimento,
            ano: dataVencimento.getFullYear(),
            mes: dataVencimento.getMonth() + 1,
            mesNome: mesNomeCompleto.charAt(0).toUpperCase() + mesNomeCompleto.slice(1),
            transacoes: [],
            todasEfetivadas: true,
            dataEfetivacao: null // ✅ NOVA PROPRIEDADE
          };
        }
        
        faturasPorVencimento[chave].transacoes.push(transacao);
        
        if (!transacao.efetivado) {
          faturasPorVencimento[chave].todasEfetivadas = false;
        }

        // ✅ Capturar data de efetivação da primeira transação efetivada
        if (transacao.efetivado && transacao.data_efetivacao && !faturasPorVencimento[chave].dataEfetivacao) {
          faturasPorVencimento[chave].dataEfetivacao = transacao.data_efetivacao;
        }
      });

      // Retornar apenas faturas abertas (que têm pelo menos uma transação não efetivada)
      const faturasAbertas = Object.values(faturasPorVencimento)
        .filter(fatura => !fatura.todasEfetivadas)
        // ✅ ORDENAÇÃO: Cronológica crescente (mais antiga primeiro)
        .sort((a, b) => new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento));

      console.log('✅ Faturas abertas encontradas:', faturasAbertas.length);
      return faturasAbertas;

    } catch (err) {
      console.error('❌ Erro ao buscar faturas abertas:', err);
      setError(err.message);
      return [];
    }
  };

  // ✅ NOVO: Buscar faturas pagas usando fatura_vencimento
  const buscarFaturasPagas = async (cartaoId, limite = 6) => {
    try {
      // Buscar transações dos últimos 12 meses
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 12);

      const { data, error } = await supabase
        .from('transacoes')
        .select('fatura_vencimento, efetivado, data_efetivacao, valor')
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .gte('data', dataInicio.toISOString().split('T')[0])
        .not('fatura_vencimento', 'is', null);

      if (error) throw error;

      // Agrupar por fatura_vencimento
      const faturasPorVencimento = {};
      
      data.forEach(transacao => {
        const chave = transacao.fatura_vencimento;
        
        if (!faturasPorVencimento[chave]) {
          const dataVencimento = new Date(transacao.fatura_vencimento);
          const mesNomeCompleto = dataVencimento.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          });

          faturasPorVencimento[chave] = {
            fatura_vencimento: transacao.fatura_vencimento,
            ano: dataVencimento.getFullYear(),
            mes: dataVencimento.getMonth() + 1,
            mesNome: mesNomeCompleto.charAt(0).toUpperCase() + mesNomeCompleto.slice(1),
            transacoes: [],
            todasEfetivadas: true,
            valorTotal: 0,
            dataEfetivacao: null
          };
        }
        
        faturasPorVencimento[chave].transacoes.push(transacao);
        faturasPorVencimento[chave].valorTotal += parseFloat(transacao.valor || 0);
        
        if (!transacao.efetivado) {
          faturasPorVencimento[chave].todasEfetivadas = false;
        }

        if (transacao.efetivado && transacao.data_efetivacao && !faturasPorVencimento[chave].dataEfetivacao) {
          faturasPorVencimento[chave].dataEfetivacao = transacao.data_efetivacao;
        }
      });

      // Retornar apenas faturas pagas
      const faturasPagas = Object.values(faturasPorVencimento)
        .filter(fatura => fatura.todasEfetivadas && fatura.transacoes.length > 0)
        .sort((a, b) => new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento))
        .slice(0, limite);

      console.log('✅ Faturas pagas encontradas:', faturasPagas.length);
      return faturasPagas;

    } catch (err) {
      console.error('❌ Erro ao buscar faturas pagas:', err);
      setError(err.message);
      return [];
    }
  };

  // ✅ NOVO: Obter histórico completo de faturas
  const obterHistoricoFaturas = async (cartaoId, mesesAtras = 12) => {
    try {
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - mesesAtras);

      const { data, error } = await supabase
        .from('transacoes')
        .select('fatura_vencimento, efetivado, data_efetivacao, valor, data')
        .eq('cartao_id', cartaoId)
        .eq('usuario_id', user.id)
        .gte('data', dataInicio.toISOString().split('T')[0])
        .not('fatura_vencimento', 'is', null)
        .order('fatura_vencimento', { ascending: false });

      if (error) throw error;

      // Processar histórico
      const historico = {};
      
      data.forEach(transacao => {
        const chave = transacao.fatura_vencimento;
        
        if (!historico[chave]) {
          const dataVencimento = new Date(transacao.fatura_vencimento);
          
          historico[chave] = {
            fatura_vencimento: transacao.fatura_vencimento,
            dataVencimento: dataVencimento,
            mes: dataVencimento.getMonth() + 1,
            ano: dataVencimento.getFullYear(),
            mesNome: dataVencimento.toLocaleDateString('pt-BR', { 
              month: 'long', 
              year: 'numeric' 
            }).replace(/^\w/, c => c.toUpperCase()),
            valorTotal: 0,
            totalTransacoes: 0,
            transacoesEfetivadas: 0,
            status: 'aberta',
            dataEfetivacao: null
          };
        }
        
        historico[chave].valorTotal += parseFloat(transacao.valor || 0);
        historico[chave].totalTransacoes += 1;
        
        if (transacao.efetivado) {
          historico[chave].transacoesEfetivadas += 1;
          
          if (transacao.data_efetivacao && !historico[chave].dataEfetivacao) {
            historico[chave].dataEfetivacao = transacao.data_efetivacao;
          }
        }
      });

      // Definir status final
      Object.values(historico).forEach(fatura => {
        if (fatura.totalTransacoes > 0 && fatura.transacoesEfetivadas === fatura.totalTransacoes) {
          fatura.status = 'paga';
        } else if (fatura.transacoesEfetivadas > 0) {
          fatura.status = 'parcial';
        } else {
          fatura.status = 'aberta';
        }
      });

      const historicoOrdenado = Object.values(historico)
        .sort((a, b) => new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento));

      console.log('✅ Histórico de faturas processado:', historicoOrdenado.length);
      return historicoOrdenado;

    } catch (err) {
      console.error('❌ Erro ao obter histórico de faturas:', err);
      setError(err.message);
      return [];
    }
  };

  return {
    isLoading,
    error,
    verificarStatusFatura,
    pagarFatura,
    reabrirFatura,
    lancarEstorno,
    buscarFaturasAbertas,
    buscarFaturasPagas, // ✅ NOVA FUNÇÃO
    obterHistoricoFaturas, // ✅ NOVA FUNÇÃO
    setError
  };
};

export default useFaturaOperations;