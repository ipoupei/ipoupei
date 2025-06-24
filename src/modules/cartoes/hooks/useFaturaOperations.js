// src/modules/cartoes/hooks/useFaturaOperations.js
// ✅ REFATORADO: Nova lógica de pagamento - Efetivar transações + Estornos para balanceamento

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import { formatCurrency } from '@shared/utils/formatCurrency';

/**
 * Hook para operações de escrita relacionadas a faturas
 * ✅ NOVA LÓGICA: Efetivar transações existentes + Estornos para balanceamento
 */
export const useFaturaOperations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addCategoria, addSubcategoria, getCategoriasPorTipo } = useCategorias();

  /**
   * Garante que a categoria "Dívidas" e subcategoria "Cartão de Crédito" existam
   */
  const garantirCategoriaDividas = async () => {
    try {
      const categoriasDespesa = getCategoriasPorTipo('despesa');
      
      // Procurar categoria "Dívidas" existente
      let categoriaDividas = categoriasDespesa.find(cat => 
        cat.nome.toLowerCase().includes('dívida') || 
        cat.nome.toLowerCase().includes('divida')
      );

      // Se não existe, criar categoria "Dívidas"
      if (!categoriaDividas) {
        const resultadoCategoria = await addCategoria({
          nome: 'Dívidas',
          tipo: 'despesa',
          cor: '#DC2626',
          icone: 'CreditCard',
          descricao: 'Categoria para controle de dívidas e financiamentos'
        });

        if (!resultadoCategoria.success) {
          throw new Error('Erro ao criar categoria Dívidas');
        }

        categoriaDividas = resultadoCategoria.data;
      }

      // Procurar subcategoria "Cartão de Crédito"
      let subcategoriaCartao = categoriaDividas.subcategorias?.find(sub =>
        sub.nome.toLowerCase().includes('cartão') || 
        sub.nome.toLowerCase().includes('cartao')
      );

      // Se não existe, criar subcategoria "Cartão de Crédito"
      if (!subcategoriaCartao) {
        const resultadoSubcategoria = await addSubcategoria(categoriaDividas.id, {
          nome: 'Cartão de Crédito',
          descricao: 'Dívidas relacionadas a cartões de crédito'
        });

        if (!resultadoSubcategoria.success) {
          throw new Error('Erro ao criar subcategoria Cartão de Crédito');
        }

        subcategoriaCartao = resultadoSubcategoria.data;
      }

      return {
        categoriaId: categoriaDividas.id,
        subcategoriaId: subcategoriaCartao.id
      };

    } catch (err) {
      console.error('Erro ao garantir categoria de dívidas:', err);
      throw err;
    }
  };

  /**
   * Calcular fatura alvo baseada na data de fechamento
   */
  const calcularFaturaAlvo = (cartao, dataCompra) => {
    try {
      const dataCompraUTC = new Date(dataCompra + 'T12:00:00.000Z');
      const diaFechamento = cartao.dia_fechamento || 1;
      const diaVencimento = cartao.dia_vencimento || 10;
      
      const anoCompra = dataCompraUTC.getUTCFullYear();
      const mesCompra = dataCompraUTC.getUTCMonth();
      const diaCompra = dataCompraUTC.getUTCDate();
      
      let anoFaturaAlvo = anoCompra;
      let mesFaturaAlvo = mesCompra;
      
      // Se a compra foi APÓS o fechamento, vai para próxima fatura
      if (diaCompra > diaFechamento) {
        mesFaturaAlvo = mesCompra + 1;
        if (mesFaturaAlvo > 11) {
          mesFaturaAlvo = 0;
          anoFaturaAlvo = anoCompra + 1;
        }
      }
      
      // Calcular data de vencimento da fatura alvo
      let dataVencimentoFinal = new Date(Date.UTC(anoFaturaAlvo, mesFaturaAlvo, diaVencimento));
      
      // Se vencimento é antes ou igual ao fechamento, a fatura vence no mês seguinte
      if (diaVencimento <= diaFechamento) {
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
      }
      
      return dataVencimentoFinal.toISOString().split('T')[0];
      
    } catch (err) {
      console.error('❌ Erro ao calcular fatura alvo:', err);
      const hoje = new Date();
      const proximoMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, cartao.dia_vencimento || 10));
      return proximoMes.toISOString().split('T')[0];
    }
  };

  /**
   * ✅ NOVA LÓGICA: Criar estorno para balanceamento
   */
  const criarEstornoBalanceamento = async (cartaoId, faturaVencimento, valorEstorno, descricaoEstorno) => {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .insert([{
          usuario_id: user.id,
          cartao_id: cartaoId,
          categoria_id: null, // Estorno não tem categoria específica
          subcategoria_id: null,
          tipo: 'receita',
          descricao: descricaoEstorno,
          valor: -Math.abs(valorEstorno), //  estorno
          data: new Date().toISOString().split('T')[0],
          fatura_vencimento: faturaVencimento,
          efetivado: false, // Será efetivado junto com as outras transações
          data_efetivacao: null,
          observacoes: 'Estorno automático para balanceamento do pagamento da fatura',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Estorno de balanceamento criado:', {
        id: data.id,
        valor: data.valor,
        descricao: data.descricao
      });

      return { success: true, estorno: data };
    } catch (err) {
      console.error('❌ Erro ao criar estorno de balanceamento:', err);
      throw err;
    }
  };

  /**
   * ✅ NOVA LÓGICA: Pagar Fatura - Efetivar transações com conta selecionada
   */
  const pagarFatura = async (cartaoId, faturaVencimento, valorPago, dataPagamento, contaSelecionadaId) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!cartaoId) throw new Error('cartaoId é obrigatório');
      if (!faturaVencimento) throw new Error('faturaVencimento é obrigatório');
      if (!valorPago || valorPago <= 0) throw new Error('valorPago deve ser maior que zero');
      if (!dataPagamento) throw new Error('dataPagamento é obrigatório');
      if (!contaSelecionadaId) throw new Error('contaSelecionadaId é obrigatório');

      console.log('💳 NOVA LÓGICA - Efetivando pagamento da fatura:', {
        cartaoId,
        faturaVencimento,
        valorPago,
        dataPagamento,
        contaSelecionadaId
      });

      // ✅ NOVA LÓGICA: Efetivar todas as transações da fatura com a conta selecionada
      const { data: transacoesEfetivadas, error: updateError } = await supabase
        .from('transacoes')
        .update({ 
          efetivado: true,
          data_efetivacao: dataPagamento,
          conta_id: contaSelecionadaId, // ✅ ADICIONAR conta que fez o pagamento
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .eq('fatura_vencimento', faturaVencimento)
        .eq('efetivado', false)
        .select('id, descricao, valor');

      if (updateError) throw updateError;

      console.log('✅ Transações efetivadas com nova lógica:', transacoesEfetivadas?.length || 0);

      return {
        success: true,
        transacoes_afetadas: transacoesEfetivadas?.length || 0,
        valor_efetivado: valorPago,
        conta_utilizada_id: contaSelecionadaId,
        message: `Fatura paga com sucesso. ${transacoesEfetivadas?.length || 0} transações efetivadas.`
      };

    } catch (err) {
      console.error('❌ Erro ao pagar fatura:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ NOVA LÓGICA: Pagamento parcial com estorno
   */
  const pagarFaturaParcial = async (cartaoId, faturaVencimento, valorTotal, valorPago, faturaDestinoRestante, dataPagamento, contaSelecionadaId, cartao) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return { success: false };
    }

    if (valorPago <= 0 || valorPago >= valorTotal) {
      setError('Valor pago deve ser maior que zero e menor que o total da fatura');
      return { success: false };
    }

    if (!faturaDestinoRestante) {
      setError('Fatura de destino para o saldo restante é obrigatória');
      return { success: false };
    }

    if (!contaSelecionadaId) {
      setError('Conta para débito é obrigatória');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const valorRestante = valorTotal - valorPago;
      
      console.log('💳 NOVA LÓGICA - Pagamento parcial:', {
        valorTotal,
        valorPago,
        valorRestante,
        contaSelecionadaId
      });

      // ✅ ETAPA 1: Criar estorno ANTES de efetivar (faz parte da mesma fatura)
      await criarEstornoBalanceamento(
        cartaoId,
        faturaVencimento,
        valorRestante,
        'Empréstimo para cobertura do cartão'
      );

      // ✅ ETAPA 2: Efetivar todas as transações da fatura (incluindo o estorno)
      const resultadoPagamento = await pagarFatura(cartaoId, faturaVencimento, valorTotal, dataPagamento, contaSelecionadaId);
      
      if (!resultadoPagamento.success) {
        throw new Error(resultadoPagamento.error || 'Erro ao efetivar fatura');
      }

      // ✅ ETAPA 3: Criar nova despesa na fatura de destino
      const categorias = await garantirCategoriaDividas();
      
      const dataFaturaOriginal = new Date(faturaVencimento);
      const mesReferencia = dataFaturaOriginal.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });

      const resultadoDespesa = await criarDespesaCartao({
        cartao_id: cartaoId,
        categoria_id: categorias.categoriaId,
        subcategoria_id: categorias.subcategoriaId,
        descricao: `Saldo pendente da fatura de ${mesReferencia}. Editar para incluir juros.`,
        valor: valorRestante,
        data_compra: dataPagamento,
        fatura_vencimento: faturaDestinoRestante,
        observacoes: `Saldo remanescente de pagamento parcial. Valor original: ${formatCurrency(valorTotal)}, Valor pago: ${formatCurrency(valorPago)} em ${new Date(dataPagamento).toLocaleDateString('pt-BR')}`
      });

      if (!resultadoDespesa.success) {
        throw new Error(resultadoDespesa.error || 'Erro ao criar transação de saldo pendente');
      }

      console.log('✅ Pagamento parcial concluído - Nova lógica aplicada');

      return { 
        success: true,
        valor_efetivado: valorTotal,
        valor_pago_conta: valorPago,
        valor_estornado: valorRestante,
        nova_despesa_id: resultadoDespesa.transacao.id
      };

    } catch (err) {
      console.error('❌ Erro no pagamento parcial:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ NOVA LÓGICA: Pagamento parcelado com estorno
   */
  const pagarFaturaParcelado = async (cartaoId, faturaVencimento, valorTotal, numeroParcelas, valorParcela, faturaInicialVencimento, dataPagamento, contaSelecionadaId, cartao) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return { success: false };
    }

    if (numeroParcelas <= 0 || numeroParcelas > 60) {
      setError('Número de parcelas deve ser entre 1 e 60');
      return { success: false };
    }

    if (!valorParcela || valorParcela <= 0) {
      setError('Valor da parcela deve ser maior que zero');
      return { success: false };
    }

    if (!contaSelecionadaId) {
      setError('Conta para débito é obrigatória');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const valorTotalParcelado = numeroParcelas * valorParcela;
      
      console.log('💳 NOVA LÓGICA - Pagamento parcelado:', {
        valorTotal,
        numeroParcelas,
        valorParcela,
        valorTotalParcelado,
        contaSelecionadaId
      });

      // ✅ ETAPA 1: Criar estorno ANTES de efetivar (valor total volta como "empréstimo")
      await criarEstornoBalanceamento(
        cartaoId,
        faturaVencimento,
        valorTotal,
        'Empréstimo para cobertura do cartão'
      );

      // ✅ ETAPA 2: Efetivar todas as transações da fatura (resultado líquido = 0 na conta)
      const resultadoPagamento = await pagarFatura(cartaoId, faturaVencimento, valorTotal, dataPagamento, contaSelecionadaId);
      
      if (!resultadoPagamento.success) {
        throw new Error(resultadoPagamento.error || 'Erro ao efetivar fatura');
      }

      // ✅ ETAPA 3: Criar parcelas nas próximas faturas
      const categorias = await garantirCategoriaDividas();
      const prejuizoParcelamento = valorTotalParcelado - valorTotal;

      const resultadoParcelamento = await criarDespesaParcelada({
        cartao_id: cartaoId,
        categoria_id: categorias.categoriaId,
        subcategoria_id: categorias.subcategoriaId,
        descricao: 'Parcelamento de fatura do cartão',
        valor_total: valorTotalParcelado,
        valor_parcela: valorParcela,
        numero_parcelas: numeroParcelas,
        data_compra: dataPagamento,
        fatura_vencimento: faturaInicialVencimento,
        observacoes: `Parcelamento da fatura original de ${formatCurrency(valorTotal)} paga em ${new Date(dataPagamento).toLocaleDateString('pt-BR')}. Prejuízo: ${formatCurrency(prejuizoParcelamento)} (${((prejuizoParcelamento / valorTotal) * 100).toFixed(1)}%)`
      });

      if (!resultadoParcelamento.success) {
        throw new Error(resultadoParcelamento.error || 'Erro ao criar parcelamento');
      }

      console.log('✅ Pagamento parcelado concluído - Nova lógica aplicada');

      return { 
        success: true,
        valor_efetivado: valorTotal,
        valor_estornado: valorTotal,
        grupoParcelamento: resultadoParcelamento.grupo_parcelamento,
        valorTotalParcelado,
        prejuizoParcelamento
      };

    } catch (err) {
      console.error('❌ Erro no pagamento parcelado:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ NOVA LÓGICA: Reabrir fatura - Reverter efetivação
   */
  const reabrirFatura = async (cartaoId, faturaVencimento) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!cartaoId) throw new Error('cartaoId é obrigatório');
      if (!faturaVencimento) throw new Error('faturaVencimento é obrigatório');

      console.log('🔄 NOVA LÓGICA - Reabrindo fatura:', {
        cartaoId,
        faturaVencimento
      });

      // ✅ NOVA LÓGICA: Remover efetivação E conta_id das transações
      const { data: transacoesReabertas, error: updateError } = await supabase
        .from('transacoes')
        .update({ 
          efetivado: false,
          data_efetivacao: null,
          conta_id: null, // ✅ REMOVER referência da conta
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .eq('fatura_vencimento', faturaVencimento)
        .eq('efetivado', true)
        .select('id, descricao, valor');

      if (updateError) throw updateError;

      console.log('✅ Fatura reaberta com nova lógica:', transacoesReabertas?.length || 0);

      return {
        success: true,
        transacoes_afetadas: transacoesReabertas?.length || 0,
        message: `Fatura reaberta com sucesso. ${transacoesReabertas?.length || 0} transações marcadas como pendentes.`
      };

    } catch (err) {
      console.error('❌ Erro ao reabrir fatura:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Buscar opções de fatura para parcelamento
  const buscarOpcoesFatura = async (cartaoId, dataCompra) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return [];
    }

    try {
      const { data: cartaoData, error: cartaoError } = await supabase
        .from('cartoes')
        .select('dia_fechamento, dia_vencimento, nome')
        .eq('id', cartaoId)
        .eq('usuario_id', user.id)
        .single();

      if (cartaoError) {
        throw new Error(`Erro ao buscar dados do cartão: ${cartaoError.message}`);
      }

      const opcoes = [];

      // Gerar 6 opções: 2 antes da atual + atual + 3 depois
      for (let i = -2; i <= 3; i++) {
        const dataBaseTeste = new Date();
        dataBaseTeste.setMonth(dataBaseTeste.getMonth() + i);
        const dataBaseString = dataBaseTeste.toISOString().split('T')[0];
        
        const faturaCalculada = calcularFaturaAlvo(cartaoData, dataBaseString);
        const dataFatura = new Date(faturaCalculada + 'T12:00:00');
        
        const valorOpcao = faturaCalculada;
        const labelOpcao = `${dataFatura.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} - Venc: ${dataFatura.toLocaleDateString('pt-BR')}`;
        
        const dataFechamento = new Date(dataFatura.getFullYear(), dataFatura.getMonth() - 1, cartaoData.dia_fechamento);
        
        opcoes.push({
          valor_opcao: valorOpcao,
          label_opcao: labelOpcao,
          data_fechamento: dataFechamento.toISOString().split('T')[0],
          data_vencimento: valorOpcao,
          is_default: i === 0
        });
      }

      return opcoes;
    } catch (err) {
      console.error('Erro ao buscar opções de fatura:', err);
      setError(err.message);
      return [];
    }
  };

  // ✅ CRIAR DESPESA NO CARTÃO (mantida como estava)
  const criarDespesaCartao = async (dadosDespesa) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const {
        cartao_id,
        categoria_id,
        subcategoria_id = null,
        descricao,
        valor,
        data_compra,
        fatura_vencimento,
        observacoes = null
      } = dadosDespesa;

      if (!cartao_id) throw new Error('cartao_id é obrigatório');
      if (!categoria_id) throw new Error('categoria_id é obrigatório');
      if (!descricao) throw new Error('descricao é obrigatória');
      if (!valor || valor <= 0) throw new Error('valor deve ser maior que zero');
      if (!data_compra) throw new Error('data_compra é obrigatória');

      let faturaVencimentoFinal = fatura_vencimento;

      if (!faturaVencimentoFinal) {
        const { data: cartaoData, error: cartaoError } = await supabase
          .from('cartoes')
          .select('dia_fechamento, dia_vencimento')
          .eq('id', cartao_id)
          .eq('usuario_id', user.id)
          .single();

        if (cartaoError) throw cartaoError;
        faturaVencimentoFinal = calcularFaturaAlvo(cartaoData, data_compra);
      }

      const { data, error: insertError } = await supabase
        .from('transacoes')
        .insert([{
          usuario_id: user.id,
          cartao_id,
          categoria_id,
          subcategoria_id,
          tipo: 'despesa',
          descricao,
          valor,
          data: data_compra,
          fatura_vencimento: faturaVencimentoFinal,
          efetivado: false,
          data_efetivacao: null,
          observacoes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        success: true,
        transacao: data
      };

    } catch (err) {
      console.error('Erro ao criar despesa no cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ CRIAR DESPESA PARCELADA (mantida como estava)
  const criarDespesaParcelada = async (dadosParcelamento) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const {
        cartao_id,
        categoria_id,
        descricao,
        valor_total,
        valor_parcela,
        numero_parcelas,
        data_compra,
        fatura_vencimento,
        subcategoria_id = null,
        observacoes = null
      } = dadosParcelamento;

      if (!cartao_id) throw new Error('cartao_id é obrigatório');
      if (!categoria_id) throw new Error('categoria_id é obrigatório');
      if (!descricao) throw new Error('descricao é obrigatória');
      if (!valor_total || valor_total <= 0) throw new Error('valor_total deve ser maior que zero');
      if (!numero_parcelas || numero_parcelas <= 0) throw new Error('numero_parcelas deve ser maior que zero');
      if (!data_compra) throw new Error('data_compra é obrigatória');

      const grupoParcelamento = crypto.randomUUID();
      const valorParcelaFinal = valor_parcela || (valor_total / numero_parcelas);

      const { data: cartaoData, error: cartaoError } = await supabase
        .from('cartoes')
        .select('dia_fechamento, dia_vencimento')
        .eq('id', cartao_id)
        .eq('usuario_id', user.id)
        .single();

      if (cartaoError) throw cartaoError;

      let faturaVencimentoInicial = fatura_vencimento;
      
      if (!faturaVencimentoInicial) {
        faturaVencimentoInicial = calcularFaturaAlvo(cartaoData, data_compra);
      }

      const parcelas = [];

      for (let i = 1; i <= numero_parcelas; i++) {
        const dataVencimentoFinal = gerarDataFaturaParcela(faturaVencimentoInicial, i - 1, cartaoData.dia_vencimento);

        parcelas.push({
          usuario_id: user.id,
          cartao_id,
          categoria_id,
          subcategoria_id,
          tipo: 'despesa',
          descricao: `${descricao} (${i}/${numero_parcelas})`,
          valor: valorParcelaFinal,
          valor_parcela: valorParcelaFinal,
          numero_parcelas: numero_parcelas,
          parcela_atual: i,
          grupo_parcelamento: grupoParcelamento,
          data: data_compra,
          fatura_vencimento: dataVencimentoFinal,
          efetivado: false,
          observacoes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      const { data, error: insertError } = await supabase
        .from('transacoes')
        .insert(parcelas)
        .select();

      if (insertError) throw insertError;

      return {
        success: true,
        grupo_parcelamento: grupoParcelamento,
        parcelas_criadas: data?.length || 0
      };

    } catch (err) {
      console.error('Erro ao criar despesa parcelada:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para gerar data de parcela
  const gerarDataFaturaParcela = (faturaInicialString, mesesAFrente, diaVencimento) => {
    const dataInicial = new Date(faturaInicialString + 'T00:00:00');
    const anoInicial = dataInicial.getFullYear();
    const mesInicial = dataInicial.getMonth();
    
    const novoAno = anoInicial + Math.floor((mesInicial + mesesAFrente) / 12);
    const novoMes = (mesInicial + mesesAFrente) % 12;
    
    const novaData = new Date(novoAno, novoMes, diaVencimento);
    
    if (novaData.getDate() !== diaVencimento) {
      novaData.setDate(0);
    }
    
    return novaData.toISOString().split('T')[0];
  };

  // ✅ LANÇAR ESTORNO
  const lancarEstorno = async (dadosEstorno) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const {
        cartao_id,
        categoria_id = null,
        descricao,
        valor,
        fatura_vencimento,
        data_estorno = new Date().toISOString().split('T')[0],
        observacoes = 'Estorno/Crédito no cartão'
      } = dadosEstorno;

      if (!cartao_id) throw new Error('cartao_id é obrigatório');
      if (!descricao) throw new Error('descricao é obrigatória');
      if (!valor || valor <= 0) throw new Error('valor deve ser maior que zero');

      let faturaVencimentoFinal = fatura_vencimento;

      if (!faturaVencimentoFinal) {
        const { data: cartaoData, error: cartaoError } = await supabase
          .from('cartoes')
          .select('dia_fechamento, dia_vencimento')
          .eq('id', cartao_id)
          .eq('usuario_id', user.id)
          .single();

        if (cartaoError) throw cartaoError;
        faturaVencimentoFinal = calcularFaturaAlvo(cartaoData, data_estorno);
      }

      if (!faturaVencimentoFinal) {
        throw new Error('Não foi possível determinar a fatura de vencimento para o estorno');
      }

      const { data, error: insertError } = await supabase
        .from('transacoes')
        .insert([{
          usuario_id: user.id,
          cartao_id,
          categoria_id,
          tipo: 'receita',
          descricao,
          valor: -Math.abs(valor),
          data: data_estorno,
          fatura_vencimento: faturaVencimentoFinal,
          efetivado: false,
          data_efetivacao: null,
          observacoes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        success: true,
        transacao: data
      };

    } catch (err) {
      console.error('Erro ao lançar estorno:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ EDITAR TRANSAÇÃO DE CARTÃO
  const editarTransacao = async (transacaoId, dadosAtualizacao) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!transacaoId) throw new Error('transacaoId é obrigatório');

      const { data, error: updateError } = await supabase
        .from('transacoes')
        .update({
          ...dadosAtualizacao,
          updated_at: new Date().toISOString()
        })
        .eq('id', transacaoId)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        transacao: data
      };

    } catch (err) {
      console.error('Erro ao editar transação:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ EXCLUIR TRANSAÇÃO DE CARTÃO
  const excluirTransacao = async (transacaoId) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!transacaoId) throw new Error('transacaoId é obrigatório');

      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transacaoId)
        .eq('usuario_id', user.id);

      if (deleteError) throw deleteError;

      return {
        success: true,
        transacao_id: transacaoId
      };

    } catch (err) {
      console.error('Erro ao excluir transação:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ EXCLUIR GRUPO DE PARCELAS
  const excluirParcelamento = async (grupoParcelamento, parcelaAtual) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!grupoParcelamento) throw new Error('grupoParcelamento é obrigatório');

      // Se parcelaAtual for fornecida, excluir apenas essa e as futuras
      let query = supabase
        .from('transacoes')
        .delete()
        .eq('grupo_parcelamento', grupoParcelamento)
        .eq('usuario_id', user.id);

      if (parcelaAtual) {
        query = query.gte('parcela_atual', parcelaAtual);
      }

      const { error: deleteError } = await query;

      if (deleteError) throw deleteError;

      return {
        success: true,
        grupo_parcelamento: grupoParcelamento
      };

    } catch (err) {
      console.error('Erro ao excluir grupo de parcelas:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ CRIAR CARTÃO
  const criarCartao = async (dadosCartao) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const {
        nome,
        limite,
        dia_fechamento,
        dia_vencimento,
        bandeira,
        banco = null,
        conta_debito_id = null,
        cor = '#1E40AF',
        observacoes = null
      } = dadosCartao;

      if (!nome) throw new Error('nome é obrigatório');
      if (!limite || limite <= 0) throw new Error('limite deve ser maior que zero');
      if (!dia_fechamento || dia_fechamento < 1 || dia_fechamento > 31) {
        throw new Error('dia_fechamento deve estar entre 1 e 31');
      }
      if (!dia_vencimento || dia_vencimento < 1 || dia_vencimento > 31) {
        throw new Error('dia_vencimento deve estar entre 1 e 31');
      }
      if (!bandeira) throw new Error('bandeira é obrigatória');

      const { data, error: insertError } = await supabase
        .from('cartoes')
        .insert([{
          usuario_id: user.id,
          nome,
          limite,
          dia_fechamento,
          dia_vencimento,
          bandeira,
          banco,
          conta_debito_id,
          cor,
          observacoes,
          ativo: true,
          origem_diagnostico: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        success: true,
        cartao: data
      };

    } catch (err) {
      console.error('Erro ao criar cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ EDITAR CARTÃO
  const editarCartao = async (cartaoId, dadosAtualizacao) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!cartaoId) throw new Error('cartaoId é obrigatório');

      const { data, error: updateError } = await supabase
        .from('cartoes')
        .update({
          ...dadosAtualizacao,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartaoId)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        cartao: data
      };

    } catch (err) {
      console.error('Erro ao editar cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ ARQUIVAR/DESATIVAR CARTÃO
  const arquivarCartao = async (cartaoId) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!cartaoId) throw new Error('cartaoId é obrigatório');

      const { data, error: updateError } = await supabase
        .from('cartoes')
        .update({
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartaoId)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        cartao: data
      };

    } catch (err) {
      console.error('Erro ao arquivar cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ REATIVAR CARTÃO
  const reativarCartao = async (cartaoId) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!cartaoId) throw new Error('cartaoId é obrigatório');

      const { data, error: updateError } = await supabase
        .from('cartoes')
        .update({
          ativo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartaoId)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        cartao: data
      };

    } catch (err) {
      console.error('Erro ao reativar cartão:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    
    // ✅ OPERAÇÕES DE FATURA - NOVA LÓGICA
    pagarFatura,
    pagarFaturaParcial,
    pagarFaturaParcelado,
    reabrirFatura,
    buscarOpcoesFatura,
    
    // ✅ OPERAÇÕES DE TRANSAÇÃO
    criarDespesaCartao,
    criarDespesaParcelada,
    lancarEstorno,
    editarTransacao,
    excluirTransacao,
    excluirParcelamento,
    
    // Operações de cartão
    criarCartao,
    editarCartao,
    arquivarCartao,
    reativarCartao,
    
    // ✅ FUNÇÃO EXPORTADA PARA USO EXTERNO
    calcularFaturaAlvo,
    criarEstornoBalanceamento
  };
};

export default useFaturaOperations;