// src/hooks/useTransferencias.js
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook para gerenciar transferências entre contas
 * Permite saldos negativos e cria transações vinculadas
 */
const useTransferencias = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useAuth();

  // Realizar transferência entre contas
  const realizarTransferencia = useCallback(async (dadosTransferencia) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      const { contaOrigemId, contaDestinoId, valor, descricao } = dadosTransferencia;

      // Validações básicas
      if (!contaOrigemId || !contaDestinoId || !valor || valor <= 0) {
        return { success: false, error: 'Dados da transferência são obrigatórios' };
      }

      if (contaOrigemId === contaDestinoId) {
        return { success: false, error: 'Conta de origem e destino devem ser diferentes' };
      }

      // Buscar as contas
      const { data: contas, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .in('id', [contaOrigemId, contaDestinoId])
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      if (contasError) throw contasError;

      if (!contas || contas.length !== 2) {
        return { success: false, error: 'Uma ou ambas as contas não foram encontradas' };
      }

      const contaOrigem = contas.find(c => c.id === contaOrigemId);
      const contaDestino = contas.find(c => c.id === contaDestinoId);

      if (!contaOrigem || !contaDestino) {
        return { success: false, error: 'Erro ao identificar as contas' };
      }

      // Gerar identificador único para o grupo de transferência
      const grupoTransferencia = crypto.randomUUID();
      const dataAtual = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString();

      // Criar as transações da transferência
      const transacoes = [
        {
          usuario_id: user.id,
          data: dataAtual,
          descricao: `Transferência para ${contaDestino.nome}${descricao ? ` - ${descricao}` : ''}`,
          conta_id: contaOrigemId,
          valor: valor,
          tipo: 'despesa',
          efetivado: true,
          transferencia: true,
          grupo_transferencia: grupoTransferencia,
          observacoes: descricao || null,
          created_at: timestamp,
          updated_at: timestamp
        },
        {
          usuario_id: user.id,
          data: dataAtual,
          descricao: `Transferência de ${contaOrigem.nome}${descricao ? ` - ${descricao}` : ''}`,
          conta_id: contaDestinoId,
          valor: valor,
          tipo: 'receita',
          efetivado: true,
          transferencia: true,
          grupo_transferencia: grupoTransferencia,
          observacoes: descricao || null,
          created_at: timestamp,
          updated_at: timestamp
        }
      ];

      // Inserir as transações
      const { error: transacoesError } = await supabase
        .from('transacoes')
        .insert(transacoes);

      if (transacoesError) throw transacoesError;

      // Calcular novos saldos
      const novoSaldoOrigem = contaOrigem.saldo - valor;
      const novoSaldoDestino = contaDestino.saldo + valor;

      // Atualizar saldo da conta de origem
      const { error: origemError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoOrigem,
          updated_at: timestamp
        })
        .eq('id', contaOrigemId)
        .eq('usuario_id', user.id);

      if (origemError) throw origemError;

      // Atualizar saldo da conta de destino
      const { error: destinoError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoDestino,
          updated_at: timestamp
        })
        .eq('id', contaDestinoId)
        .eq('usuario_id', user.id);

      if (destinoError) throw destinoError;

      // Verificar se ficou com saldo negativo
      const avisoSaldoNegativo = novoSaldoOrigem < 0;

      return { 
        success: true, 
        message: avisoSaldoNegativo 
          ? `Transferência realizada! ${contaOrigem.nome} ficou com saldo negativo.`
          : 'Transferência realizada com sucesso!',
        aviso: avisoSaldoNegativo,
        dados: {
          grupoTransferencia,
          contaOrigem: contaOrigem.nome,
          contaDestino: contaDestino.nome,
          valor,
          novoSaldoOrigem,
          novoSaldoDestino
        }
      };

    } catch (err) {
      console.error('❌ Erro ao realizar transferência:', err);
      const errorMessage = err.message || 'Erro inesperado ao realizar transferência';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Verificar se a transferência foi gravada corretamente
  const verificarTransferencia = useCallback(async (contaOrigemId, contaDestinoId, valor) => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      // Buscar transações da transferência (últimos 5 minutos)
      const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('transferencia', true)
        .gte('created_at', cincoMinutosAtras)
        .in('conta_id', [contaOrigemId, contaDestinoId]);

      if (error) {
        console.error('Erro ao verificar transferência:', error);
        return false;
      }

      // Verificar se encontrou as duas transações
      const transacaoOrigem = transacoes?.find(t => 
        t.conta_id === contaOrigemId && t.tipo === 'despesa' && t.valor === valor
      );
      
      const transacaoDestino = transacoes?.find(t => 
        t.conta_id === contaDestinoId && t.tipo === 'receita' && t.valor === valor
      );

      return !!(transacaoOrigem && transacaoDestino);

    } catch (err) {
      console.error('❌ Erro ao verificar transferência:', err);
      return false;
    }
  }, [isAuthenticated, user]);

  // Buscar histórico de transferências
  const buscarHistoricoTransferencias = useCallback(async (limite = 20) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          conta:contas(id, nome, tipo, cor)
        `)
        .eq('usuario_id', user.id)
        .eq('transferencia', true)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) throw error;

      // Agrupar por grupo_transferencia
      const transferenciasAgrupadas = {};
      
      data?.forEach(transacao => {
        const grupo = transacao.grupo_transferencia;
        if (!transferenciasAgrupadas[grupo]) {
          transferenciasAgrupadas[grupo] = [];
        }
        transferenciasAgrupadas[grupo].push(transacao);
      });

      // Converter para array de transferências completas
      const transferencias = Object.values(transferenciasAgrupadas)
        .map(grupo => {
          const origem = grupo.find(t => t.tipo === 'despesa');
          const destino = grupo.find(t => t.tipo === 'receita');
          
          if (origem && destino) {
            return {
              id: origem.grupo_transferencia,
              data: origem.data,
              valor: origem.valor,
              descricao: origem.observacoes,
              contaOrigem: origem.conta,
              contaDestino: destino.conta,
              created_at: origem.created_at
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { success: true, data: transferencias };

    } catch (err) {
      console.error('❌ Erro ao buscar histórico:', err);
      const errorMessage = 'Erro ao buscar histórico de transferências';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Cancelar transferência (reverter)
  const cancelarTransferencia = useCallback(async (grupoTransferencia) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar as transações da transferência
      const { data: transacoes, error: buscaError } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('grupo_transferencia', grupoTransferencia)
        .eq('transferencia', true);

      if (buscaError) throw buscaError;

      if (!transacoes || transacoes.length !== 2) {
        return { success: false, error: 'Transferência não encontrada ou incompleta' };
      }

      const origem = transacoes.find(t => t.tipo === 'despesa');
      const destino = transacoes.find(t => t.tipo === 'receita');

      if (!origem || !destino) {
        return { success: false, error: 'Dados da transferência inconsistentes' };
      }

      // Buscar as contas para reverter os saldos
      const { data: contas, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .in('id', [origem.conta_id, destino.conta_id])
        .eq('usuario_id', user.id);

      if (contasError) throw contasError;

      const contaOrigem = contas.find(c => c.id === origem.conta_id);
      const contaDestino = contas.find(c => c.id === destino.conta_id);

      if (!contaOrigem || !contaDestino) {
        return { success: false, error: 'Contas não encontradas' };
      }

      const timestamp = new Date().toISOString();

      // Reverter os saldos
      const { error: origemError } = await supabase
        .from('contas')
        .update({ 
          saldo: contaOrigem.saldo + origem.valor, // Adiciona de volta
          updated_at: timestamp
        })
        .eq('id', origem.conta_id);

      if (origemError) throw origemError;

      const { error: destinoError } = await supabase
        .from('contas')
        .update({ 
          saldo: contaDestino.saldo - destino.valor, // Remove
          updated_at: timestamp
        })
        .eq('id', destino.conta_id);

      if (destinoError) throw destinoError;

      // Marcar transações como canceladas (ou deletar)
      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('grupo_transferencia', grupoTransferencia)
        .eq('usuario_id', user.id);

      if (deleteError) throw deleteError;

      return { 
        success: true, 
        message: 'Transferência cancelada e saldos revertidos com sucesso' 
      };

    } catch (err) {
      console.error('❌ Erro ao cancelar transferência:', err);
      const errorMessage = 'Erro ao cancelar transferência';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    realizarTransferencia,
    verificarTransferencia,
    buscarHistoricoTransferencias,
    cancelarTransferencia,
    setError: clearError,
    clearError
  };
};

export default useTransferencias;