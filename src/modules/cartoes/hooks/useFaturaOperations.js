// src/modules/cartoes/hooks/useFaturaOperations.js
// ✅ APENAS OPERAÇÕES DE ESCRITA - SEM LEITURA DE LISTAS
// ❌ PROIBIDO: SELECT para listas, formatação de UI, texto de exibição
// ✅ ATUALIZADO: Novas funcionalidades de pagamento parcial e parcelado

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';
import useCategorias from '@modules/categorias/hooks/useCategorias';

/**
 * Hook para operações de escrita relacionadas a faturas
 * ✅ Permitido: INSERT, UPDATE, DELETE, RPCs de operação
 * ❌ Proibido: SELECT de listas, formatação de UI, texto de exibição
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
   * Calcula a próxima data de vencimento baseada no cartão
   */
  const calcularProximaFatura = (cartao) => {
    const hoje = new Date();
    const diaVencimento = cartao.dia_vencimento;
    const diaFechamento = cartao.dia_fechamento;
    
    let proximaFatura = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
    
    // Se ainda não passou do fechamento deste mês
    if (hoje.getDate() <= diaFechamento) {
      proximaFatura = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVencimento);
    } else {
      // Se já passou do fechamento, próxima fatura é mês seguinte
      proximaFatura = new Date(hoje.getFullYear(), hoje.getMonth() + 2, diaVencimento);
    }
    
    return proximaFatura.toISOString().split('T')[0];
  };

  /**
   * Gera data de fatura para uma parcela específica
   * SEMPRE usa o dia de vencimento do cartão, independente da data inicial
   */
  const gerarDataFaturaParcela = (faturaInicialString, mesesAFrente, diaVencimento) => {
    // Converter string para Date e extrair ano/mês
    const dataInicial = new Date(faturaInicialString + 'T00:00:00');
    const anoInicial = dataInicial.getFullYear();
    const mesInicial = dataInicial.getMonth(); // 0-based
    
    // Calcular o novo mês/ano
    const novoAno = anoInicial + Math.floor((mesInicial + mesesAFrente) / 12);
    const novoMes = (mesInicial + mesesAFrente) % 12;
    
    // Criar nova data SEMPRE no dia de vencimento do cartão
    const novaData = new Date(novoAno, novoMes, diaVencimento);
    
    // Verificar se o dia existe no mês (ex: 31 em fevereiro)
    if (novaData.getDate() !== diaVencimento) {
      // Se o dia não existe, usar o último dia do mês
      novaData.setDate(0);
    }
    
    const resultado = novaData.toISOString().split('T')[0];
    console.log(`  -> Calculando: ${faturaInicialString} + ${mesesAFrente} meses (dia ${diaVencimento}) = ${resultado}`);
    
    return resultado;
  };

  // ✅ PAGAR FATURA - Implementação direta sem RPC
  const pagarFatura = async (cartaoId, faturaVencimento, valorPago, dataPagamento) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!cartaoId) throw new Error('cartaoId é obrigatório');
      if (!faturaVencimento) throw new Error('faturaVencimento é obrigatório');
      if (!valorPago || valorPago <= 0) throw new Error('valorPago deve ser maior que zero');
      if (!dataPagamento) throw new Error('dataPagamento é obrigatório');

      // Marcar todas as transações da fatura como efetivadas
      const { data, error: updateError } = await supabase
        .from('transacoes')
        .update({ 
          efetivado: true,
          data_efetivacao: dataPagamento,
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', user.id)
        .eq('cartao_id', cartaoId)
        .eq('fatura_vencimento', faturaVencimento)
        .eq('efetivado', false)
        .select();

      if (updateError) throw updateError;

      return {
        success: true,
        transacoes_afetadas: data?.length || 0,
        message: `Fatura paga com sucesso. ${data?.length || 0} transações efetivadas.`
      };

    } catch (err) {
      console.error('Erro ao pagar fatura:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pagamento parcial da fatura - NOVA FUNCIONALIDADE
   */
  const pagarFaturaParcial = async (cartaoId, faturaVencimento, valorTotal, valorPago, faturaDestinoRestante, dataPagamento, cartao) => {
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

    if (!dataPagamento) {
      setError('Data de pagamento é obrigatória');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Marcar fatura como paga (usando função existente)
      const resultadoPagamento = await pagarFatura(cartaoId, faturaVencimento, valorPago, dataPagamento);
      
      if (!resultadoPagamento.success) {
        throw new Error(resultadoPagamento.error || 'Erro ao pagar fatura');
      }

      // 2. Garantir que existem as categorias de dívida
      const categorias = await garantirCategoriaDividas();
      if (!categorias) {
        throw new Error('Erro ao criar categorias necessárias');
      }

      // 3. Calcular valor restante e criar nova transação
      const valorRestante = valorTotal - valorPago;
      
      const dataFaturaOriginal = new Date(faturaVencimento);
      const mesReferencia = dataFaturaOriginal.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });

      // Usar a função de criar despesa existente
      const resultadoDespesa = await criarDespesaCartao({
        cartao_id: cartaoId,
        categoria_id: categorias.categoriaId,
        subcategoria_id: categorias.subcategoriaId,
        descricao: `Saldo pendente da fatura de ${mesReferencia}. Atenção: usuário deve editar e incluir os juros.`,
        valor: valorRestante,
        data_compra: dataPagamento,
        fatura_vencimento: faturaDestinoRestante,
        observacoes: `Saldo remanescente de pagamento parcial. Valor original: R$ ${valorTotal.toFixed(2)}, Valor pago: R$ ${valorPago.toFixed(2)} em ${new Date(dataPagamento).toLocaleDateString('pt-BR')}`
      });

      if (!resultadoDespesa.success) {
        throw new Error(resultadoDespesa.error || 'Erro ao criar transação de saldo pendente');
      }

      return { success: true };
    } catch (err) {
      console.error('Erro ao processar pagamento parcial:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pagamento parcelado da fatura - NOVA FUNCIONALIDADE
   */
  const pagarFaturaParcelado = async (cartaoId, faturaVencimento, valorTotal, numeroParcelas, valorParcela, faturaInicialVencimento, dataPagamento, cartao) => {
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

    if (!faturaInicialVencimento) {
      setError('Fatura inicial para as parcelas é obrigatória');
      return { success: false };
    }

    if (!dataPagamento) {
      setError('Data de pagamento é obrigatória');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Marcar fatura original como paga (usando função existente)
      const resultadoPagamento = await pagarFatura(cartaoId, faturaVencimento, valorTotal, dataPagamento);
      
      if (!resultadoPagamento.success) {
        throw new Error(resultadoPagamento.error || 'Erro ao pagar fatura');
      }

      // 2. Garantir que existem as categorias de dívida
      const categorias = await garantirCategoriaDividas();
      if (!categorias) {
        throw new Error('Erro ao criar categorias necessárias');
      }

      // 3. Criar parcelas com o valor informado pelo banco
      const valorTotalParcelado = numeroParcelas * valorParcela;
      const prejuizoParcelamento = valorTotalParcelado - valorTotal;

      const resultadoParcelamento = await criarDespesaParcelada({
        cartao_id: cartaoId,
        categoria_id: categorias.categoriaId,
        subcategoria_id: categorias.subcategoriaId,
        descricao: 'Parcelamento de fatura do cartão',
        valor_total: valorTotalParcelado, // Valor total com juros do banco
        valor_parcela: valorParcela, // Valor informado pelo banco
        numero_parcelas: numeroParcelas,
        data_compra: dataPagamento,
        fatura_vencimento: faturaInicialVencimento,
        observacoes: `Parcelamento da fatura original de R$ ${valorTotal.toFixed(2)} paga em ${new Date(dataPagamento).toLocaleDateString('pt-BR')}. Prejuízo: R$ ${prejuizoParcelamento.toFixed(2)} (${((prejuizoParcelamento / valorTotal) * 100).toFixed(1)}%)`
      });

      if (!resultadoParcelamento.success) {
        throw new Error(resultadoParcelamento.error || 'Erro ao criar parcelamento');
      }

      return { 
        success: true, 
        grupoParcelamento: resultadoParcelamento.grupo_parcelamento,
        valorTotalParcelado,
        prejuizoParcelamento
      };
    } catch (err) {
      console.error('Erro ao processar pagamento parcelado:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar opções de fatura para parcelamento - NOVA FUNCIONALIDADE
   * Gera opções de fatura baseado nos dias de fechamento e vencimento do cartão
   */
  const buscarOpcoesFatura = async (cartaoId, dataCompra) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return [];
    }

    try {
      // Buscar dados do cartão
      const { data: cartaoData, error: cartaoError } = await supabase
        .from('cartoes')
        .select('dia_fechamento, dia_vencimento, nome')
        .eq('id', cartaoId)
        .eq('usuario_id', user.id)
        .single();

      if (cartaoError) {
        throw new Error(`Erro ao buscar dados do cartão: ${cartaoError.message}`);
      }

      const hoje = new Date();
      const opcoes = [];

      // Gerar 6 opções: 2 antes da atual + atual + 3 depois
      for (let i = -2; i <= 3; i++) {
        // Calcular a data base sempre no dia de vencimento do cartão
        const dataBase = new Date(hoje.getFullYear(), hoje.getMonth() + i, cartaoData.dia_vencimento);
        
        // Verificar se o dia existe no mês (ex: 31 em fevereiro)
        if (dataBase.getDate() !== cartaoData.dia_vencimento) {
          // Se o dia não existe, usar o último dia do mês
          dataBase.setDate(0);
        }

        const valorOpcao = dataBase.toISOString().split('T')[0];
        const labelOpcao = `${dataBase.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} - Venc: ${dataBase.toLocaleDateString('pt-BR')}`;
        
        // Calcular data de fechamento (sempre um mês antes do vencimento)
        const dataFechamento = new Date(dataBase.getFullYear(), dataBase.getMonth() - 1, cartaoData.dia_fechamento);
        
        opcoes.push({
          valor_opcao: valorOpcao,
          label_opcao: labelOpcao,
          data_fechamento: dataFechamento.toISOString().split('T')[0],
          data_vencimento: valorOpcao,
          is_default: i === 0 // A opção atual é o padrão
        });
      }

      return opcoes;
    } catch (err) {
      console.error('Erro ao buscar opções de fatura:', err);
      setError(err.message);
      return [];
    }
  };

  // ✅ CRIAR DESPESA NO CARTÃO
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

      // Validações
      if (!cartao_id) throw new Error('cartao_id é obrigatório');
      if (!categoria_id) throw new Error('categoria_id é obrigatório');
      if (!descricao) throw new Error('descricao é obrigatória');
      if (!valor || valor <= 0) throw new Error('valor deve ser maior que zero');
      if (!data_compra) throw new Error('data_compra é obrigatória');
      if (!fatura_vencimento) throw new Error('fatura_vencimento é obrigatório');

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
          fatura_vencimento,
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

  // ✅ CRIAR DESPESA PARCELADA - Implementação direta sem RPC
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
        valor_parcela, // NOVO: valor específico da parcela
        numero_parcelas,
        data_compra,
        fatura_vencimento,
        subcategoria_id = null,
        observacoes = null
      } = dadosParcelamento;

      // Validações
      if (!cartao_id) throw new Error('cartao_id é obrigatório');
      if (!categoria_id) throw new Error('categoria_id é obrigatório');
      if (!descricao) throw new Error('descricao é obrigatória');
      if (!valor_total || valor_total <= 0) throw new Error('valor_total deve ser maior que zero');
      if (!numero_parcelas || numero_parcelas <= 0) throw new Error('numero_parcelas deve ser maior que zero');
      if (!data_compra) throw new Error('data_compra é obrigatória');
      if (!fatura_vencimento) throw new Error('fatura_vencimento é obrigatório');

      // Gerar UUID para o grupo de parcelamento
      const grupoParcelamento = crypto.randomUUID();
      
      // Usar valor da parcela informado pelo usuário (do banco) ou calcular
      // CORREÇÃO: Usar o valor exato informado pelo usuário, sem arredondamento
      const valorParcelaFinal = valor_parcela || (valor_total / numero_parcelas);

      // Buscar dados do cartão para calcular próximas faturas
      const { data: cartaoData, error: cartaoError } = await supabase
        .from('cartoes')
        .select('dia_fechamento, dia_vencimento')
        .eq('id', cartao_id)
        .eq('usuario_id', user.id)
        .single();

      if (cartaoError) throw cartaoError;

      // Criar array de parcelas
      const parcelas = [];

      // Log para debug
      console.log('=== DEBUG PARCELAMENTO ===');
      console.log('Fatura vencimento inicial:', fatura_vencimento);
      console.log('Dia vencimento do cartão:', cartaoData.dia_vencimento);
      console.log('Valor parcela informado:', valor_parcela);
      console.log('Valor parcela final:', valorParcelaFinal);

      for (let i = 1; i <= numero_parcelas; i++) {
        // CORREÇÃO PRINCIPAL: TODAS as parcelas devem usar o dia de vencimento do cartão
        // Calcular data correta baseada na fatura inicial + meses
        const dataVencimentoFinal = gerarDataFaturaParcela(fatura_vencimento, i - 1, cartaoData.dia_vencimento);

        console.log(`Parcela ${i}: Data = ${dataVencimentoFinal}, Valor = ${valorParcelaFinal}`);

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

      // Inserir todas as parcelas
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

      // Validações
      if (!cartao_id) throw new Error('cartao_id é obrigatório');
      if (!descricao) throw new Error('descricao é obrigatória');
      if (!valor || valor <= 0) throw new Error('valor deve ser maior que zero');
      if (!fatura_vencimento) throw new Error('fatura_vencimento é obrigatório');

      const { data, error: insertError } = await supabase
        .from('transacoes')
        .insert([{
          usuario_id: user.id,
          cartao_id,
          categoria_id,
          tipo: 'despesa',
          descricao,
          valor: -Math.abs(valor), // Estorno é valor negativo
          data: data_estorno,
          fatura_vencimento,
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
  const excluirGrupoParcelas = async (grupoParcelamento) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!grupoParcelamento) throw new Error('grupoParcelamento é obrigatório');

      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('grupo_parcelamento', grupoParcelamento)
        .eq('usuario_id', user.id);

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

      // Validações
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
    
    // ✅ OPERAÇÕES DE FATURA (originais + novas)
    pagarFatura,
    pagarFaturaParcial, // ✅ NOVA
    pagarFaturaParcelado, // ✅ NOVA
    buscarOpcoesFatura, // ✅ NOVA
    
    // Operações de transação
    criarDespesaCartao,
    criarDespesaParcelada,
    lancarEstorno,
    editarTransacao,
    excluirTransacao,
    excluirGrupoParcelas,
    
    // Operações de cartão
    criarCartao,
    editarCartao,
    arquivarCartao,
    reativarCartao
  };
};

export default useFaturaOperations;