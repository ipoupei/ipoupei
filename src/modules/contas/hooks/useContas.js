// src/modules/contas/hooks/useContas.js - RECONSTRUÍDO DO ZERO
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';

/**
 * Hook para gerenciar contas - VERSÃO LIMPA
 * ✅ Código limpo e organizado
 * ✅ Usuário dinâmico
 * ✅ Saldo via função SQL com fallback
 * ✅ Todas as funcionalidades essenciais
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

  // ✅ FUNÇÃO 1: Calcular saldo de uma conta específica
  const calcularSaldoConta = useCallback(async (contaId, saldoInicial = 0) => {
    try {
      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('tipo, valor, efetivado, transferencia')
        .eq('conta_id', contaId)
        .eq('efetivado', true);

      if (error) {
        console.error('Erro ao buscar transações:', error);
        return saldoInicial;
      }

      let saldo = saldoInicial;
      
      transacoes?.forEach(t => {
        // Ignorar transferências
        if (t.transferencia) return;
        
        if (t.tipo === 'receita') {
          saldo += t.valor || 0;
        } else if (t.tipo === 'despesa') {
          saldo -= t.valor || 0;
        }
      });

      return saldo;
    } catch (err) {
      console.error('Erro no cálculo de saldo:', err);
      return saldoInicial;
    }
  }, []);

  // ✅ FUNÇÃO 2: Buscar saldo total via SQL (com fallback)
  const buscarSaldoTotalSQL = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('gpt_saldo_atual', { usuario: user.id });

      if (error) {
        console.warn('Função SQL falhou:', error.message);
        return null;
      }

      return Number(data) || 0;
    } catch (err) {
      console.warn('Erro na função SQL:', err.message);
      return null;
    }
  }, [user]);

  // ✅ FUNÇÃO 3: Buscar todas as contas
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

      console.log('🏦 Buscando contas do usuário:', user.email);

      // Buscar contas ativas
      const { data: contasAtivas, error: erroAtivas } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at');

      if (erroAtivas) throw erroAtivas;

      // Buscar contas arquivadas se necessário
      let contasArquiv = [];
      if (incluirArquivadas) {
        const { data: arquivadas, error: erroArquivadas } = await supabase
          .from('contas')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('ativo', false)
          .order('updated_at', { ascending: false });

        if (!erroArquivadas) {
          contasArquiv = arquivadas || [];
        }
      }

      // Calcular saldos das contas ativas
      const contasComSaldo = await Promise.all(
        (contasAtivas || []).map(async (conta) => {
          const saldoCalculado = await calcularSaldoConta(conta.id, conta.saldo_inicial || 0);
          return {
            ...conta,
            saldo_atual: saldoCalculado,
            saldo: saldoCalculado // Compatibilidade
          };
        })
      );

      // Calcular saldos das contas arquivadas
      const contasArquivComSaldo = await Promise.all(
        contasArquiv.map(async (conta) => {
          const saldoCalculado = await calcularSaldoConta(conta.id, conta.saldo_inicial || 0);
          return {
            ...conta,
            saldo_atual: saldoCalculado,
            saldo: saldoCalculado,
            arquivada: true
          };
        })
      );

      // Atualizar estados
      setContas(contasComSaldo);
      setContasArquivadas(contasArquivComSaldo);

      // Calcular saldo total (SQL primeiro, fallback depois)
      const saldoSQL = await buscarSaldoTotalSQL();
      if (saldoSQL !== null) {
        setSaldoTotal(saldoSQL);
        console.log('✅ Saldo total (SQL):', saldoSQL);
      } else {
        const saldoLocal = contasComSaldo.reduce((acc, c) => acc + (c.saldo_atual || 0), 0);
        setSaldoTotal(saldoLocal);
        console.log('✅ Saldo total (local):', saldoLocal);
      }

      console.log('✅ Contas carregadas:', contasComSaldo.length);

    } catch (err) {
      console.error('❌ Erro ao buscar contas:', err);
      setError(err.message);
      showNotification('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, calcularSaldoConta, buscarSaldoTotalSQL, showNotification]);

  // ✅ FUNÇÃO 4: Adicionar nova conta
  const addConta = useCallback(async (dadosConta) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('contas')
        .insert([{
          ...dadosConta,
          usuario_id: user.id,
          ativo: true,
          saldo_inicial: dadosConta.saldo || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

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

  // ✅ FUNÇÃO 8: Excluir conta
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

      if (totalTransacoes > 0) {
        return {
          success: false,
          error: 'POSSUI_TRANSACOES',
          message: `Esta conta possui ${totalTransacoes} transação(ões). Recomendamos arquivar em vez de excluir.`,
          quantidadeTransacoes: totalTransacoes
        };
      }

      if (!confirmacao) {
        return {
          success: false,
          error: 'CONFIRMACAO_NECESSARIA',
          message: 'Confirmação necessária para excluir a conta.'
        };
      }

      // Excluir
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
        // Alterar saldo inicial
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
        showNotification(`Saldo inicial alterado para ${novoSaldoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 'success');

      } else {
        // Criar transação de ajuste
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

      await fetchContas(true);
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao corrigir saldo:', error);
      showNotification('Erro ao corrigir saldo', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, contas, contasArquivadas, fetchContas, showNotification]);

  // ✅ UTILITÁRIOS
  const recalcularSaldos = useCallback(() => {
    return fetchContas();
  }, [fetchContas]);

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

  // Listener para mudanças em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`transacoes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacoes',
          filter: `usuario_id=eq.${user.id}`
        },
        () => {
          setTimeout(() => fetchContas(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchContas]);

  // ✅ RETORNO
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

    // Utilitários
    getSaldoConta,
    getSaldoTotal,
    getTodasContas,
    fetchContasArquivadas,
    calcularSaldoConta,
    buscarSaldoTotalSQL
  };
};

export default useContas;