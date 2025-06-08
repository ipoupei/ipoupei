// src/modules/contas/hooks/useContas.js - VERSÃO FINAL COM TRIGGERS AUTOMÁTICOS
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';

/**
 * Hook para gerenciar contas - VERSÃO FINAL COM TRIGGERS
 * ✅ Saldos atualizados automaticamente via triggers SQL
 * ✅ Performance máxima (sem cálculos repetitivos)
 * ✅ Consistência garantida pelo banco de dados
 * ✅ Funções de manutenção e validação integradas
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
        .rpc('obter_saldos_por_conta', {
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
          .rpc('obter_saldos_por_conta', {
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
        .rpc('gpt_saldo_atual', { usuario: user.id });

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

  // ✅ FUNÇÃO 2: Validar consistência dos saldos
  const validarConsistencia = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('validar_consistencia_saldos', { p_usuario_id: user.id });

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

  // ✅ FUNÇÃO 3: Recalcular saldos de todas as contas
  const recalcularSaldos = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔄 Recalculando saldos via SQL...');

      const { data, error } = await supabase
        .rpc('recalcular_saldos_usuario', { p_usuario_id: user.id });

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

  // ✅ FUNÇÃO 4: Adicionar nova conta
  const addConta = useCallback(async (dadosConta) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      const saldoInicial = dadosConta.saldo || dadosConta.saldoInicial || 0;
      
      const { data, error } = await supabase
        .from('contas')
        .insert([{
          ...dadosConta,
          usuario_id: user.id,
          ativo: true,
          saldo_inicial: saldoInicial,
          saldo: saldoInicial, // ✅ Triggers manterão este valor atualizado
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

  // ✅ FUNÇÃO 5: Atualizar conta
  const updateConta = useCallback(async (contaId, dadosAtualizacao) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      // Se tem campo 'saldo', converter para 'saldo_inicial'
      if (dadosAtualizacao.saldo !== undefined) {
        dadosAtualizacao.saldo_inicial = dadosAtualizacao.saldo;
        delete dadosAtualizacao.saldo;
      }

      // ✅ Se alterando saldo_inicial, os triggers recalcularão automaticamente
      const { data, error } = await supabase
        .from('contas')
        .update({
          ...dadosAtualizacao,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // ✅ Se mudou saldo_inicial, forçar recálculo via trigger
      if (dadosAtualizacao.saldo_inicial !== undefined) {
        await supabase.rpc('atualizar_saldo_conta', { p_conta_id: contaId });
      }

      await fetchContas();
      showNotification('Conta atualizada com sucesso', 'success');
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      showNotification('Erro ao atualizar conta', 'error');
      throw error;
    }
  }, [user, fetchContas, showNotification]);

  // ✅ FUNÇÃO 6: Arquivar conta
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

      await fetchContas();
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

  // ✅ FUNÇÃO 7: Desarquivar conta
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

  // ✅ FUNÇÃO 8: Excluir conta (com validação)
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

  // ✅ FUNÇÃO 9: Corrigir saldo manualmente
  const corrigirSaldoConta = useCallback(async (contaId, novoSaldo, metodo = 'ajuste', motivo = '') => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' };

    try {
      setLoading(true);

      const conta = contas.find(c => c.id === contaId) || contasArquivadas.find(c => c.id === contaId);
      if (!conta) throw new Error('Conta não encontrada');

      const saldoAtual = conta.saldo_atual || 0;
      const diferenca = novoSaldo - saldoAtual;

      if (Math.abs(diferenca) < 0.01) {
        showNotification('Saldo já está correto', 'info');
        return { success: true };
      }

      if (metodo === 'saldo_inicial') {
        // Alterar saldo inicial (triggers recalcularão)
        const novoSaldoInicial = conta.saldo_inicial + diferenca;

        const { error } = await supabase
          .from('contas')
          .update({
            saldo_inicial: novoSaldoInicial,
            updated_at: new Date().toISOString()
          })
          .eq('id', contaId)
          .eq('usuario_id', user.id);

        if (error) throw error;
        
        // Forçar recálculo via trigger
        await supabase.rpc('atualizar_saldo_conta', { p_conta_id: contaId });
        
        showNotification(`Saldo inicial alterado para ${novoSaldoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 'success');

      } else {
        // Criar transação de ajuste (triggers atualizarão saldo)
        const ajuste = {
          usuario_id: user.id,
          conta_id: contaId,
          data: new Date().toISOString().split('T')[0],
          descricao: 'Ajuste de saldo manual',
          tipo: diferenca > 0 ? 'receita' : 'despesa',
          valor: Math.abs(diferenca),
          efetivado: true,
          ajuste_manual: true,
          motivo_ajuste: motivo || 'Correção de divergência',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('transacoes')
          .insert([ajuste]);

        if (error) throw error;
        showNotification(`Ajuste de ${Math.abs(diferenca).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} criado`, 'success');
      }

      // ✅ Aguardar um pouco para triggers executarem
      setTimeout(() => fetchContas(true), 500);
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao corrigir saldo:', error);
      showNotification('Erro ao corrigir saldo', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, contas, contasArquivadas, fetchContas, showNotification]);

  // ✅ FUNÇÃO 10: Sincronizar todos os saldos do sistema
  const sincronizarSaldosSistema = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔄 Sincronizando saldos do sistema...');

      const { data, error } = await supabase
        .rpc('sincronizar_saldos_sistema');

      if (error) {
        console.error('Erro na sincronização:', error);
        showNotification('Erro na sincronização', 'error');
        return;
      }

      const resultado = data?.[0];
      if (resultado?.contas_atualizadas > 0) {
        showNotification(
          `Sincronização concluída: ${resultado.contas_atualizadas}/${resultado.total_contas_processadas} contas atualizadas`,
          'success'
        );
      } else {
        showNotification('Todos os saldos já estavam sincronizados', 'info');
      }

      await fetchContas();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      showNotification('Erro na sincronização', 'error');
    }
  }, [user?.id, showNotification, fetchContas]);

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

  // ✅ EFEITOS
  // Carregar contas quando usuário muda
  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  // Validar consistência periodicamente
  useEffect(() => {
    if (!user?.id) return;

    const validarPeriodicamente = async () => {
      await validarConsistencia();
    };

    // Validar na inicialização
    setTimeout(validarPeriodicamente, 2000);

    // Validar a cada 5 minutos
    const interval = setInterval(validarPeriodicamente, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id, validarConsistencia]);

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

  // ✅ RETORNO COMPLETO
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
    corrigirSaldoConta,

    // Validação e manutenção
    validarConsistencia,
    sincronizarSaldosSistema,

    // Utilitários
    getSaldoConta,
    getSaldoTotal,
    getTodasContas,
    fetchContasArquivadas
  };
};

export default useContas;