// src/modules/contas/hooks/useContas.js - ATUALIZADO COM NOVA LÓGICA DE SALDO
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';

/**
 * Hook para gerenciar contas - VERSÃO ATUALIZADA
 * ✅ Nova fórmula: saldo_atual = saldo_inicial + receitas_efetivadas - despesas_efetivadas
 * ✅ Inclui ajustes manuais no cálculo
 * ✅ Funcionalidade de correção de saldo
 * ✅ Arquivamento com preservação de histórico
 */
const useContas = () => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const [contas, setContas] = useState([]);
  const [contasArquivadas, setContasArquivadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saldoTotal, setSaldoTotal] = useState(0);

  // ✅ NOVA FUNÇÃO: Calcular saldo atual seguindo a fórmula atualizada
  const calcularSaldoAtual = useCallback(async (contaId, saldoInicial = 0) => {
    try {
      console.log(`💰 Calculando saldo para conta ${contaId} (saldo inicial: ${saldoInicial})`);
      
      // Buscar apenas transações efetivadas da conta específica
      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('tipo, valor, efetivado, ajuste_manual, descricao')
        .eq('conta_id', contaId)
        .eq('efetivado', true); // ✅ Apenas transações efetivadas
      
      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        return saldoInicial;
      }
      
      if (!transacoes?.length) {
        console.log(`📊 Nenhuma transação efetivada, saldo = saldo inicial (${saldoInicial})`);
        return saldoInicial;
      }
      
      // ✅ Aplicar nova fórmula: saldo_inicial + receitas - despesas
      let saldoAtual = saldoInicial;
      let totalReceitas = 0;
      let totalDespesas = 0;
      let ajustesManuais = 0;
      
      transacoes.forEach(transacao => {
        const valor = transacao.valor || 0;
        
        if (transacao.tipo === 'receita') {
          totalReceitas += valor;
          saldoAtual += valor;
        } else if (transacao.tipo === 'despesa') {
          totalDespesas += valor;
          saldoAtual -= valor;
        }
        
        // ✅ Contar ajustes manuais para logs
        if (transacao.ajuste_manual) {
          ajustesManuais += transacao.tipo === 'receita' ? valor : -valor;
        }
      });
      
      console.log(`📊 Saldo calculado:`, {
        saldoInicial,
        totalReceitas,
        totalDespesas,
        ajustesManuais,
        saldoFinal: saldoAtual,
        totalTransacoes: transacoes.length
      });
      
      return saldoAtual;
      
    } catch (error) {
      console.error('❌ Erro no cálculo de saldo:', error);
      return saldoInicial;
    }
  }, []);

  // ✅ Buscar contas com saldo calculado dinamicamente
  const fetchContas = useCallback(async (incluirArquivadas = false) => {
    if (!user) {
      setContas([]);
      setContasArquivadas([]);
      setSaldoTotal(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🏦 Buscando contas...');
      
      // Buscar contas ativas
      const { data: contasAtivas, error: contasAtivasError } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      
      if (contasAtivasError) throw contasAtivasError;
      
      // Buscar contas arquivadas se solicitado
      let contasArquivadasData = [];
      if (incluirArquivadas) {
        const { data: arquivadas, error: arquivadasError } = await supabase
          .from('contas')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('ativo', false)
          .order('updated_at', { ascending: false });
        
        if (arquivadasError) throw arquivadasError;
        contasArquivadasData = arquivadas || [];
      }
      
      // ✅ Calcular saldo atual para contas ativas
      let contasAtivasComSaldo = [];
      if (contasAtivas?.length) {
        console.log(`✅ ${contasAtivas.length} contas ativas encontradas, calculando saldos...`);
        
        contasAtivasComSaldo = await Promise.all(
          contasAtivas.map(async (conta) => {
            const saldoAtual = await calcularSaldoAtual(conta.id, conta.saldo_inicial || 0);
            
            return {
              ...conta,
              saldo_inicial: conta.saldo_inicial || 0,
              saldo_atual: saldoAtual,
              saldo: saldoAtual // ✅ Compatibilidade com código existente
            };
          })
        );
      }
      
      // ✅ Calcular saldo atual para contas arquivadas (se solicitado)
      let contasArquivadasComSaldo = [];
      if (contasArquivadasData.length) {
        console.log(`📁 ${contasArquivadasData.length} contas arquivadas encontradas, calculando saldos...`);
        
        contasArquivadasComSaldo = await Promise.all(
          contasArquivadasData.map(async (conta) => {
            const saldoAtual = await calcularSaldoAtual(conta.id, conta.saldo_inicial || 0);
            
            return {
              ...conta,
              saldo_inicial: conta.saldo_inicial || 0,
              saldo_atual: saldoAtual,
              saldo: saldoAtual,
              arquivada: true
            };
          })
        );
      }
      
      setContas(contasAtivasComSaldo);
      setContasArquivadas(contasArquivadasComSaldo);
      
      // ✅ Calcular saldo total (apenas contas ativas)
      const total = contasAtivasComSaldo.reduce((acc, conta) => acc + (conta.saldo_atual || 0), 0);
      setSaldoTotal(total);
      
      console.log('✅ Saldos calculados com sucesso, total:', total);
      
    } catch (err) {
      console.error('❌ Erro ao buscar contas:', err);
      setError(err.message);
      showNotification('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, calcularSaldoAtual, showNotification]);

  // ✅ NOVA FUNÇÃO: Corrigir saldo da conta
  const corrigirSaldoConta = useCallback(async (contaId, novoSaldo, metodo = 'ajuste', motivo = '') => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      setLoading(true);
      
      const conta = contas.find(c => c.id === contaId) || contasArquivadas.find(c => c.id === contaId);
      if (!conta) {
        throw new Error('Conta não encontrada');
      }

      const saldoAtual = conta.saldo_atual || 0;
      const diferenca = novoSaldo - saldoAtual;

      if (Math.abs(diferenca) < 0.01) {
        showNotification('Saldo já está correto', 'info');
        return { success: true };
      }

      if (metodo === 'saldo_inicial') {
        // ✅ Método 1: Alterar saldo inicial da conta
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

        showNotification(
          `Saldo inicial alterado para ${novoSaldoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
          'success'
        );

      } else {
        // ✅ Método 2: Criar transação de ajuste manual
        const transacaoAjuste = {
          usuario_id: user.id,
          conta_id: contaId,
          data: new Date().toISOString().split('T')[0],
          descricao: 'Ajuste de saldo manual',
          tipo: diferenca > 0 ? 'receita' : 'despesa',
          valor: Math.abs(diferenca),
          efetivado: true,
          ajuste_manual: true,
          motivo_ajuste: motivo || 'Correção de divergência de saldo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('transacoes')
          .insert([transacaoAjuste]);

        if (error) throw error;

        showNotification(
          `Ajuste de ${Math.abs(diferenca).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} criado com sucesso`,
          'success'
        );
      }

      // ✅ Recarregar contas para refletir mudanças
      await fetchContas(true);
      
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao corrigir saldo:', error);
      showNotification('Erro ao corrigir saldo da conta', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, contas, contasArquivadas, fetchContas, showNotification]);

  // ✅ Carregar contas na inicialização
  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  // ✅ Listener para mudanças em transações (APENAS REALTIME)
  useEffect(() => {
    if (!user) return;

    console.log('👂 Configurando listener para transações...');
    
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
        (payload) => {
          console.log('🔄 Transação modificada via realtime:', payload.eventType);
          // Delay pequeno para garantir que a transação foi commitada
          setTimeout(() => fetchContas(), 1000);
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do realtime:', status);
      });

    return () => {
      console.log('🧹 Limpando listeners');
      supabase.removeChannel(channel);
    };
  }, [user, fetchContas]);

  // ✅ Operações CRUD atualizadas

  const addConta = useCallback(async (dadosConta) => {
    try {
      const { data, error } = await supabase
        .from('contas')
        .insert([{
          ...dadosConta,
          usuario_id: user.id,
          ativo: true,
          saldo_inicial: dadosConta.saldo || 0, // ✅ Usar saldo_inicial
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchContas();
      return data;
    } catch (error) {
      console.error('❌ Erro ao adicionar conta:', error);
      throw error;
    }
  }, [user.id, fetchContas]);

  const updateConta = useCallback(async (contaId, dadosAtualizacao) => {
    try {
      // ✅ Se estiver atualizando saldo, usar saldo_inicial
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
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      throw error;
    }
  }, [user.id, fetchContas]);

  // ✅ Arquivar conta (manter funcionalidade existente)
  const arquivarConta = useCallback(async (contaId, motivoArquivamento = '') => {
    try {
      setLoading(true);
      
      const conta = contas.find(c => c.id === contaId);
      if (!conta) {
        throw new Error('Conta não encontrada');
      }

      const { error } = await supabase
        .from('contas')
        .update({ 
          ativo: false,
          observacoes: motivoArquivamento ? 
            `${conta.observacoes || ''}\n[Arquivada: ${new Date().toLocaleDateString('pt-BR')}] ${motivoArquivamento}`.trim() : 
            conta.observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId)
        .eq('usuario_id', user.id);

      if (error) throw error;
      
      await fetchContas();
      
      showNotification(
        `Conta "${conta.nome}" foi arquivada com sucesso`,
        'success'
      );
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao arquivar conta:', error);
      showNotification('Erro ao arquivar conta', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [contas, user.id, fetchContas, showNotification]);

  // ✅ Desarquivar conta
  const desarquivarConta = useCallback(async (contaId) => {
    try {
      setLoading(true);
      
      const conta = contasArquivadas.find(c => c.id === contaId);
      if (!conta) {
        throw new Error('Conta arquivada não encontrada');
      }

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
      
      showNotification(
        `Conta "${conta.nome}" foi desarquivada com sucesso`,
        'success'
      );
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao desarquivar conta:', error);
      showNotification('Erro ao desarquivar conta', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [contasArquivadas, user.id, fetchContas, showNotification]);

  // ✅ Excluir conta (funcionalidade existente)
  const excluirConta = useCallback(async (contaId, confirmacao = false) => {
    try {
      setLoading(true);
      
      let conta = contas.find(c => c.id === contaId) || contasArquivadas.find(c => c.id === contaId);
      if (!conta) {
        throw new Error('Conta não encontrada');
      }

      // Verificar se há transações associadas
      const { count: totalTransacoes, error: verificacaoError } = await supabase
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .eq('conta_id', contaId)
        .eq('usuario_id', user.id);
      
      if (verificacaoError) throw verificacaoError;
      
      if (totalTransacoes > 0) {
        return {
          success: false,
          error: 'POSSUI_TRANSACOES',
          message: `Esta conta possui ${totalTransacoes} transação(ões) registrada(s). Para manter seu histórico, recomendamos arquivar em vez de excluir.`,
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

      // Excluir conta do banco
      const { error } = await supabase
        .from('contas')
        .delete()
        .eq('id', contaId)
        .eq('usuario_id', user.id);

      if (error) throw error;
      
      await fetchContas(true);
      
      showNotification(
        `Conta "${conta.nome}" foi excluída permanentemente`,
        'success'
      );
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao excluir conta:', error);
      showNotification('Erro ao excluir conta', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [contas, contasArquivadas, user.id, fetchContas, showNotification]);

  // ✅ Utilitários
  const recalcularSaldos = useCallback(() => {
    console.log('🔄 Forçando recálculo de saldos...');
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
    
    // Operações de arquivamento e exclusão
    arquivarConta,
    desarquivarConta,
    excluirConta,
    fetchContasArquivadas,
    
    // ✅ NOVA: Função de correção de saldo
    corrigirSaldoConta,
    calcularSaldoAtual,
    
    // Utilitários
    getSaldoConta,
    getSaldoTotal,
    getTodasContas
  };
};

export default useContas;