// src/modules/contas/hooks/useContas.js - VERSÃO COMPLETA COM TODAS AS FUNÇÕES
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';

/**
 * Hook para gerenciar contas - VERSÃO COMPLETA
 * ✅ Inclui TODAS as funções necessárias para ContasModal
 * ✅ Saldos atualizados automaticamente via triggers SQL
 * ✅ Performance máxima (sem cálculos repetitivos)
 * ✅ Consistência garantida pelo banco de dados
 */
const useContas = () => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // Estados
  const [contas, setContas] = useState([]);
  const [contasArquivadas, setContasArquivadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saldoTotal, setSaldoTotal] = useState(0);

  // ✅ FUNÇÃO 1: Buscar contas usando função SQL otimizada (com triggers)
  const fetchContas = useCallback(async (incluirArquivadas = false) => {
    if (!user?.id) {
      setContas([]);
      setContasArquivadas([]);
      setSaldoTotal(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🏦 Buscando contas via SQL otimizada para:', user.email);

      // ✅ Buscar contas ativas (saldos já calculados pelos triggers)
      const { data: contasAtivas, error: erroAtivas } = await supabase
        .rpc('ip_prod_obter_saldos_por_conta', {
          p_usuario_id: user.id,
          p_incluir_inativas: false
        });

      if (erroAtivas) {
        console.error('Erro na função SQL para contas ativas:', erroAtivas);
        throw erroAtivas;
      }

      // ✅ Buscar contas arquivadas se necessário
      let contasArquiv = [];
      if (incluirArquivadas) {
        const { data: todasContas, error: erroTodasContas } = await supabase
          .rpc('ip_prod_obter_saldos_por_conta', {
            p_usuario_id: user.id,
            p_incluir_inativas: true
          });

        if (erroTodasContas) {
          console.warn('Erro na função SQL para todas as contas:', erroTodasContas);
        } else {
          // Filtrar apenas as inativas
          contasArquiv = (todasContas || []).filter(conta => !conta.ativa);
        }
      }

      // ✅ Transformar dados para formato esperado (saldos já corretos!)
      const contasFormatadas = (contasAtivas || []).map(conta => ({
        id: conta.conta_id,
        nome: conta.conta_nome,
        tipo: conta.conta_tipo,
        saldo: conta.saldo_atual, // ✅ Já calculado pelos triggers!
        saldo_atual: conta.saldo_atual,
        saldo_inicial: conta.saldo_inicial,
        cor: conta.cor,
        banco: conta.banco,
        icone: conta.icone,
        ativo: conta.ativa,
        incluir_soma_total: conta.incluir_soma,
        total_transacoes_mes: conta.total_transacoes_mes || 0,
        observacoes: conta.observacoes,
        created_at: conta.created_at,
        updated_at: conta.updated_at
      }));

      const contasArquivadasFormatadas = contasArquiv.map(conta => ({
        id: conta.conta_id,
        nome: conta.conta_nome,
        tipo: conta.conta_tipo,
        saldo: conta.saldo_atual,
        saldo_atual: conta.saldo_atual,
        saldo_inicial: conta.saldo_inicial,
        cor: conta.cor,
        banco: conta.banco,
        icone: conta.icone,
        ativo: conta.ativa,
        incluir_soma_total: conta.incluir_soma,
        total_transacoes_mes: conta.total_transacoes_mes || 0,
        observacoes: conta.observacoes,
        created_at: conta.created_at,
        updated_at: conta.updated_at,
        arquivada: true
      }));

      // Atualizar estados
      setContas(contasFormatadas);
      setContasArquivadas(contasArquivadasFormatadas);

      // ✅ Calcular saldo total (usando função SQL ou localmente)
      const { data: saldoSQL, error: erroSaldo } = await supabase
      .rpc('ip_prod_calcular_saldo_atual', { p_usuario_id: user.id });

      if (erroSaldo) {
        console.warn('Erro na função SQL de saldo total:', erroSaldo);
        // Fallback: somar saldos localmente
        const saldoLocal = contasFormatadas
          .filter(c => c.incluir_soma_total)
          .reduce((acc, c) => acc + (c.saldo || 0), 0);
        setSaldoTotal(saldoLocal);
        console.log('✅ Saldo total (fallback):', saldoLocal);
      } else {
        setSaldoTotal(Number(saldoSQL) || 0);
        console.log('✅ Saldo total (SQL):', saldoSQL);
      }

      console.log('✅ Contas carregadas (saldos via triggers):', contasFormatadas.length);

    } catch (err) {
      console.error('❌ Erro ao buscar contas:', err);
      setError(err.message);
      showNotification('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ FUNÇÃO 2: Adicionar nova conta
  const addConta = useCallback(async (dadosConta) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      const saldoInicial = dadosConta.saldo || dadosConta.saldoInicial || 0;
      
      const { data, error } = await supabase
        .from('contas')
        .insert([{
          usuario_id: user.id,
          nome: dadosConta.nome,
          tipo: dadosConta.tipo,
          banco: dadosConta.banco || null,
          saldo_inicial: saldoInicial,
          saldo: saldoInicial, // ✅ Triggers manterão este valor atualizado
          cor: dadosConta.cor || '#3B82F6',
          ativo: true,
          incluir_soma_total: true,
          ordem: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // ✅ Não precisa recalcular - triggers fazem automaticamente
      await fetchContas();
      showNotification(`Conta "${dadosConta.nome}" criada com sucesso`, 'success');
      return data;
    } catch (error) {
      console.error('❌ Erro ao adicionar conta:', error);
      showNotification('Erro ao criar conta', 'error');
      throw error;
    }
  }, [user, fetchContas, showNotification]);

  // ✅ FUNÇÃO 3: Atualizar conta
  const updateConta = useCallback(async (contaId, dadosAtualizacao) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      // Preparar dados de atualização apenas com campos válidos
      const dadosValidos = {};
      
      if (dadosAtualizacao.nome) dadosValidos.nome = dadosAtualizacao.nome;
      if (dadosAtualizacao.tipo) dadosValidos.tipo = dadosAtualizacao.tipo;
      if (dadosAtualizacao.banco !== undefined) dadosValidos.banco = dadosAtualizacao.banco;
      if (dadosAtualizacao.cor) dadosValidos.cor = dadosAtualizacao.cor;
      
      // ✅ Se tem campo 'saldo', converter para 'saldo_inicial'
      if (dadosAtualizacao.saldo !== undefined) {
        dadosValidos.saldo_inicial = dadosAtualizacao.saldo;
      }
      if (dadosAtualizacao.saldoInicial !== undefined) {
        dadosValidos.saldo_inicial = dadosAtualizacao.saldoInicial;
      }

      dadosValidos.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('contas')
        .update(dadosValidos)
        .eq('id', contaId)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchContas();
      showNotification('Conta atualizada com sucesso', 'success');
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      showNotification('Erro ao atualizar conta', 'error');
      throw error;
    }
  }, [user, fetchContas, showNotification]);

  // ✅ FUNÇÃO 4: Arquivar conta
  const arquivarConta = useCallback(async (contaId, motivo = '') => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' };

    try {
      setLoading(true);

      const conta = contas.find(c => c.id === contaId);
      if (!conta) throw new Error('Conta não encontrada');

      const { error } = await supabase
        .from('contas')
        .update({
          ativo: false,
          observacoes: motivo ? 
            `${conta.observacoes || ''}\n[Arquivada: ${new Date().toLocaleDateString('pt-BR')}] ${motivo}`.trim() : 
            conta.observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      await fetchContas(true);
      showNotification(`Conta "${conta.nome}" foi arquivada`, 'success');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao arquivar conta:', error);
      showNotification('Erro ao arquivar conta', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [contas, user, fetchContas, showNotification]);

  // ✅ FUNÇÃO 5: Desarquivar conta
  const desarquivarConta = useCallback(async (contaId) => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' };

    try {
      setLoading(true);

      const conta = contasArquivadas.find(c => c.id === contaId);
      if (!conta) throw new Error('Conta arquivada não encontrada');

      const { error } = await supabase
        .from('contas')
        .update({
          ativo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      await fetchContas(true);
      showNotification(`Conta "${conta.nome}" foi desarquivada`, 'success');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao desarquivar conta:', error);
      showNotification('Erro ao desarquivar conta', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [contasArquivadas, user, fetchContas, showNotification]);

const corrigirSaldoConta = useCallback(async (contaId, novoSaldo, metodo = 'ajuste', motivo = '') => {
  if (!user?.id) return { success: false, error: 'Usuário não autenticado' };

  try {
    setLoading(true);

    const conta = contas.find(c => c.id === contaId) || contasArquivadas.find(c => c.id === contaId);
    if (!conta) throw new Error('Conta não encontrada');

    const saldoAtual = conta.saldo_atual || conta.saldo || 0;
    const diferenca = novoSaldo - saldoAtual;

    if (Math.abs(diferenca) < 0.01) {
      showNotification('Saldo já está correto', 'info');
      return { success: true };
    }

    if (metodo === 'saldo_inicial') {
      // =====================================================================================
      // MÉTODO 1: ALTERAR SALDO INICIAL - LÓGICA CORRIGIDA
      // =====================================================================================
      // Calcula qual deveria ser o saldo inicial para resultar no saldo desejado
      
      // 1. Buscar soma de todas as transações efetivadas da conta
      const { data: somaTransacoes, error: erroSoma } = await supabase.rpc('ip_prod_calcular_soma_transacoes_conta', {
        p_conta_id: contaId,
        p_usuario_id: user.id
      });

      if (erroSoma) {
        console.warn('RPC não disponível, calculando manualmente:', erroSoma);
        
        // Fallback: calcular manualmente
        const { data: transacoes, error: erroTransacoes } = await supabase
          .from('transacoes')
          .select('tipo, valor, conta_destino_id, conta_id')
          .or(`conta_id.eq.${contaId},conta_destino_id.eq.${contaId}`)
          .eq('usuario_id', user.id)
          .eq('efetivado', true)
          .is('cartao_id', null); // Só transações diretas na conta

        if (erroTransacoes) throw erroTransacoes;

        // Calcular soma manual
        let somaTotal = 0;
        
        (transacoes || []).forEach(t => {
          if (t.conta_id === contaId) {
            // Transação da conta (origem)
            if (t.tipo === 'receita') somaTotal += Number(t.valor);
            else if (t.tipo === 'despesa') somaTotal -= Number(t.valor);
            else if (t.tipo === 'transferencia') somaTotal -= Number(t.valor);
          } else if (t.conta_destino_id === contaId) {
            // Transferência recebida (destino)
            somaTotal += Number(t.valor);
          }
        });

        var somaFinal = somaTotal;
      } else {
        var somaFinal = Number(somaTransacoes) || 0;
      }

      // 2. Calcular novo saldo inicial CORRETAMENTE
      // ✅ FÓRMULA CORRETA: saldo_inicial = saldo_desejado - transações
      const novoSaldoInicial = novoSaldo - somaFinal;

      console.log('📊 Cálculo saldo inicial CORRIGIDO:', {
        saldoDesejado: novoSaldo,
        somaTransacoes: somaFinal,
        saldoInicialAtual: conta.saldo_inicial,
        novoSaldoInicialCalculado: novoSaldoInicial
      });

      // 3. Atualizar APENAS o saldo inicial (trigger recalculará automaticamente)
      const { error } = await supabase
        .from('contas')
        .update({
          saldo_inicial: novoSaldoInicial,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id);

      if (error) throw error;
      
      showNotification(
        `Saldo inicial alterado. Novo saldo: ${novoSaldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 
        'success'
      );

    } else {
      // =====================================================================================
      // MÉTODO 2: CRIAR TRANSAÇÃO DE AJUSTE - LÓGICA CORRIGIDA
      // =====================================================================================
      // Cria APENAS uma transação de receita ou despesa para ajustar o saldo atual
      // NÃO altera o saldo inicial!

      const tipoAjuste = diferenca > 0 ? 'receita' : 'despesa';
      const valorAjuste = Math.abs(diferenca);

      console.log('💰 Criando transação de ajuste:', {
        tipo: tipoAjuste,
        valor: valorAjuste,
        diferenca: diferenca,
        saldoAtual: saldoAtual,
        saldoDesejado: novoSaldo
      });

      // Criar transação de ajuste (trigger atualizará saldo automaticamente)
      const { error } = await supabase
        .from('transacoes')
        .insert([{
          usuario_id: user.id,
          conta_id: contaId,
          data: new Date().toISOString().split('T')[0],
          descricao: 'Ajuste de saldo manual',
          tipo: tipoAjuste,
          valor: valorAjuste,
          efetivado: true,
          ajuste_manual: true,
          motivo_ajuste: motivo || 'Correção de divergência',
          observacoes: motivo || 'Correção manual de saldo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      showNotification(
        `Ajuste de ${valorAjuste.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} criado com sucesso!`, 
        'success'
      );
    }

    // ✅ CORREÇÃO: Aguardar tempo adequado para triggers processarem
    await new Promise(resolve => setTimeout(resolve, 1500));
    await fetchContas(true); // Recarregar com arquivadas
    
    return { success: true };

  } catch (error) {
    console.error('❌ Erro ao corrigir saldo:', error);
    setError && setError(error.message); // Usar setError se existir
    showNotification('Erro ao corrigir saldo', 'error');
    return { success: false, error: error.message };
  } finally {
    setLoading(false);
  }
}, [user, contas, contasArquivadas, showNotification, fetchContas]);

  // ✅ FUNÇÃO 7: Validar consistência dos saldos
  const validarConsistencia = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('ip_prod_validar_consistencia_saldos', { p_usuario_id: user.id });

      if (error) {
        console.error('Erro ao validar consistência:', error);
        return null;
      }

      const inconsistencias = data?.filter(conta => conta.inconsistente) || [];
      
      if (inconsistencias.length > 0) {
        console.warn('⚠️ Inconsistências encontradas:', inconsistencias);
        showNotification(
          `${inconsistencias.length} conta(s) com saldo inconsistente. Recalculando...`, 
          'warning'
        );
        
        // Recalcular automaticamente
        await recalcularSaldos();
      } else {
        console.log('✅ Todos os saldos estão consistentes');
      }

      return { total: data?.length || 0, inconsistencias: inconsistencias.length };
    } catch (error) {
      console.error('Erro na validação:', error);
      return null;
    }
  }, [user?.id, showNotification]);

  // ✅ FUNÇÃO 8: Recalcular saldos de todas as contas
  const recalcularSaldos = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔄 Recalculando saldos via SQL...');

      const { data, error } = await supabase
        .rpc('ip_prod_recalcular_saldos_usuario', { p_usuario_id: user.id });

      if (error) {
        console.error('Erro ao recalcular saldos:', error);
        showNotification('Erro ao recalcular saldos', 'error');
        return;
      }

      const contasAtualizadas = data?.filter(conta => Math.abs(conta.diferenca) > 0.01) || [];
      
      if (contasAtualizadas.length > 0) {
        console.log('✅ Saldos recalculados:', contasAtualizadas);
        showNotification(
          `${contasAtualizadas.length} conta(s) tiveram saldo corrigido`, 
          'success'
        );
      }

      // Recarregar contas com dados atualizados
      await fetchContas();
      
    } catch (error) {
      console.error('Erro ao recalcular saldos:', error);
      showNotification('Erro ao recalcular saldos', 'error');
    }
  }, [user?.id, showNotification, fetchContas]);

  // ✅ FUNÇÃO 9: Excluir conta (com validação)
  const excluirConta = useCallback(async (contaId, confirmacao = false) => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' };

    try {
      setLoading(true);

      const conta = contas.find(c => c.id === contaId) || contasArquivadas.find(c => c.id === contaId);
      if (!conta) throw new Error('Conta não encontrada');

      // Verificar transações
      const { count: totalTransacoes, error: erroCount } = await supabase
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .eq('conta_id', contaId)
        .eq('usuario_id', user.id);

      if (erroCount) throw erroCount;

      if (totalTransacoes > 0 && !confirmacao) {
        return {
          success: false,
          error: 'POSSUI_TRANSACOES',
          message: `Esta conta possui ${totalTransacoes} transação(ões). Recomendamos arquivar em vez de excluir.`,
          quantidadeTransacoes: totalTransacoes
        };
      }

      // Excluir (triggers limparão saldo automaticamente)
      const { error } = await supabase
        .from('contas')
        .delete()
        .eq('id', contaId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      await fetchContas(true);
      showNotification(`Conta "${conta.nome}" foi excluída`, 'success');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao excluir conta:', error);
      showNotification('Erro ao excluir conta', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [contas, contasArquivadas, user, fetchContas, showNotification]);

  // ✅ UTILITÁRIOS
  const getSaldoConta = useCallback((contaId) => {
    const conta = contas.find(c => c.id === contaId);
    return conta ? conta.saldo_atual : 0;
  }, [contas]);

  const getSaldoTotal = useCallback(() => {
    return saldoTotal;
  }, [saldoTotal]);

  const fetchContasArquivadas = useCallback(() => {
    return fetchContas(true);
  }, [fetchContas]);

  const getTodasContas = useCallback(() => {
    return [...contas, ...contasArquivadas];
  }, [contas, contasArquivadas]);

  // ✅ FUNÇÃO ESPECIAL: Força refresh (para compatibilidade)
  const forceRefreshContas = useCallback(async (incluirArquivadas = false) => {
    console.log('🚀 === FORÇA REFRESH SOLICITADO ===');
    console.log('⏳ Aguardando triggers processarem (1 segundo)...');
    
    // ✅ Aguardar triggers processarem
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ✅ Forçar fetch
    console.log('🔄 Executando fetch forçado...');
    return fetchContas(incluirArquivadas);
  }, [fetchContas]);

  // ✅ EFEITOS
  // Carregar contas quando usuário muda
  useEffect(() => {
    if (user?.id) {
      fetchContas();
    } else {
      setContas([]);
      setContasArquivadas([]);
      setSaldoTotal(0);
    }
  }, [user?.id, fetchContas]);

  // Listener para mudanças em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`contas_transacoes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacoes',
          filter: `usuario_id=eq.${user.id}`
        },
        () => {
          // ✅ Pequeno delay para triggers executarem
          setTimeout(() => fetchContas(), 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas',
          filter: `usuario_id=eq.${user.id}`
        },
        () => {
          setTimeout(() => fetchContas(), 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchContas]);

  // ✅ RETORNO COMPLETO - TODAS AS FUNÇÕES QUE O MODAL PRECISA
  return {
    // Estados
    contas,
    contasArquivadas,
    loading,
    error,
    saldoTotal,

    // Operações básicas
    fetchContas,
    addConta,
    updateConta,
    recalcularSaldos,

    // Operações especiais
    arquivarConta,
    desarquivarConta,
    excluirConta,
    corrigirSaldoConta,     // ✅ NOVA FUNÇÃO ADICIONADA
    forceRefreshContas,     // ✅ Para compatibilidade com transferências

    // Validação e manutenção
    validarConsistencia,

    // Utilitários
    getSaldoConta,
    getSaldoTotal,
    getTodasContas,
    fetchContasArquivadas
  };
};

export default useContas;
