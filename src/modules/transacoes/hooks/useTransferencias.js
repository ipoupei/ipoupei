// src/hooks/useTransferencias.js - VERSÃO CORRIGIDA COM data_efetivacao
import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@/modules/auth/hooks/useAuth'; 

/**
 * Hook para gerenciar transferências entre contas - CORRIGIDO
 * ✅ NOVA FUNCIONALIDADE: Inclui data_efetivacao para transferências
 * Permite saldos negativos e cria transações vinculadas
 * Corrige problemas de formatação e validação
 */
const useTransferencias = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useAuth();

  // Realizar transferência entre contas - CORRIGIDO COM data_efetivacao
  const realizarTransferencia = useCallback(async (dadosTransferencia) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      const { contaOrigemId, contaDestinoId, valor, descricao } = dadosTransferencia;

      // Validações básicas corrigidas
      if (!contaOrigemId || !contaDestinoId) {
        return { success: false, error: 'Contas de origem e destino são obrigatórias' };
      }

      // Validação de valor ULTRA CORRIGIDA
      let valorNumerico;
      
      if (typeof valor === 'string') {
        // Remove formatação brasileira
        const valorLimpo = valor
          .replace(/\./g, '') // Remove pontos (milhares)
          .replace(',', '.'); // Substitui vírgula por ponto
        valorNumerico = parseFloat(valorLimpo);
      } else {
        valorNumerico = Number(valor);
      }
      
      // Arredonda para 2 casas decimais para evitar problemas de precisão
      valorNumerico = Math.round(valorNumerico * 100) / 100;
      
      console.log('=== DEBUG HOOK TRANSFERÊNCIA ===');
      console.log('Valor original:', valor);
      console.log('Valor numérico final:', valorNumerico);
      
      if (!valorNumerico || valorNumerico <= 0 || isNaN(valorNumerico)) {
        return { success: false, error: 'Valor deve ser um número maior que zero' };
      }

      if (contaOrigemId === contaDestinoId) {
        return { success: false, error: 'Conta de origem e destino devem ser diferentes' };
      }

      // Buscar as contas com validação aprimorada
      const { data: contas, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .in('id', [contaOrigemId, contaDestinoId])
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      if (contasError) {
        console.error('Erro ao buscar contas:', contasError);
        throw new Error('Erro ao acessar dados das contas');
      }

      if (!contas || contas.length !== 2) {
        return { success: false, error: 'Uma ou ambas as contas não foram encontradas ou estão inativas' };
      }

      const contaOrigem = contas.find(c => c.id === contaOrigemId);
      const contaDestino = contas.find(c => c.id === contaDestinoId);

      if (!contaOrigem || !contaDestino) {
        return { success: false, error: 'Erro ao identificar as contas para transferência' };
      }

      // Gerar identificador único para a transferência (sem usar grupo_transferencia)
      const timestamp = new Date().toISOString();
      const identificadorTransferencia = `TRANS_${timestamp.replace(/[-:.T]/g, '')}_${Math.random().toString(36).substr(2, 5)}`;
      const dataAtual = new Date().toISOString().split('T')[0];

      // ✅ NOVA REGRA: Para transferências, data_efetivacao = data da transação
      const dataEfetivacao = dataAtual;

      // Criar as transações da transferência COM data_efetivacao
      const transacoes = [
        {
          usuario_id: user.id,
          data: dataAtual,
          data_efetivacao: dataEfetivacao, // ✅ NOVO CAMPO
          descricao: `Transferência para ${contaDestino.nome}${descricao ? ` - ${descricao}` : ''} [${identificadorTransferencia}]`,
          conta_id: contaOrigemId,
          valor: valorNumerico,
          tipo: 'despesa',
          efetivado: true,
          transferencia: true,
          observacoes: descricao || null,
          created_at: timestamp,
          updated_at: timestamp
        },
        {
          usuario_id: user.id,
          data: dataAtual,
          data_efetivacao: dataEfetivacao, // ✅ NOVO CAMPO
          descricao: `Transferência de ${contaOrigem.nome}${descricao ? ` - ${descricao}` : ''} [${identificadorTransferencia}]`,
          conta_id: contaDestinoId,
          valor: valorNumerico,
          tipo: 'receita',
          efetivado: true,
          transferencia: true,
          observacoes: descricao || null,
          created_at: timestamp,
          updated_at: timestamp
        }
      ];

      console.log('Transações preparadas COM data_efetivacao:', transacoes);

      // Inserir as transações
      const { data: transacoesInseridas, error: transacoesError } = await supabase
        .from('transacoes')
        .insert(transacoes)
        .select();

      if (transacoesError) {
        console.error('Erro ao inserir transações:', transacoesError);
        throw new Error('Erro ao registrar transações da transferência: ' + transacoesError.message);
      }
      
      console.log('Transações inseridas COM data_efetivacao:', transacoesInseridas);

      // Calcular novos saldos com ALTA PRECISÃO
      const saldoOrigemAtual = parseFloat(contaOrigem.saldo) || 0;
      const saldoDestinoAtual = parseFloat(contaDestino.saldo) || 0;
      
      const novoSaldoOrigem = Math.round((saldoOrigemAtual - valorNumerico) * 100) / 100;
      const novoSaldoDestino = Math.round((saldoDestinoAtual + valorNumerico) * 100) / 100;
      
      console.log('Cálculo de saldos:');
      console.log('- Origem atual:', saldoOrigemAtual, '- valor:', valorNumerico, '= novo:', novoSaldoOrigem);
      console.log('- Destino atual:', saldoDestinoAtual, '+ valor:', valorNumerico, '= novo:', novoSaldoDestino);

      // Atualizar saldo da conta de origem
      const { error: origemError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoOrigem,
          updated_at: timestamp
        })
        .eq('id', contaOrigemId)
        .eq('usuario_id', user.id);

      if (origemError) {
        console.error('Erro ao atualizar conta origem:', origemError);
        throw new Error('Erro ao atualizar saldo da conta de origem');
      }

      // Atualizar saldo da conta de destino
      const { error: destinoError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoDestino,
          updated_at: timestamp
        })
        .eq('id', contaDestinoId)
        .eq('usuario_id', user.id);

      if (destinoError) {
        console.error('Erro ao atualizar conta destino:', destinoError);
        throw new Error('Erro ao atualizar saldo da conta de destino');
      }

      // Verificar se ficou com saldo negativo
      const avisoSaldoNegativo = novoSaldoOrigem < 0;

      return { 
        success: true, 
        message: avisoSaldoNegativo 
          ? `Transferência realizada! ${contaOrigem.nome} ficou com saldo negativo.`
          : 'Transferência realizada com sucesso!',
        aviso: avisoSaldoNegativo,
        dados: {
          identificadorTransferencia,
          contaOrigem: contaOrigem.nome,
          contaDestino: contaDestino.nome,
          valor: valorNumerico,
          novoSaldoOrigem,
          novoSaldoDestino,
          dataEfetivacao // ✅ INCLUIR na resposta para debug
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

      // Verificar se encontrou as duas transações com valor correto
      const valorNumerico = Number(valor);
      const transacaoOrigem = transacoes?.find(t => 
        t.conta_id === contaOrigemId && t.tipo === 'despesa' && Number(t.valor) === valorNumerico
      );
      
      const transacaoDestino = transacoes?.find(t => 
        t.conta_id === contaDestinoId && t.tipo === 'receita' && Number(t.valor) === valorNumerico
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
        .limit(limite * 2); // Multiplica por 2 porque cada transferência tem 2 transações

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
              data_efetivacao: origem.data_efetivacao, // ✅ INCLUIR no histórico
              valor: Number(origem.valor),
              descricao: origem.observacoes,
              contaOrigem: origem.conta,
              contaDestino: destino.conta,
              created_at: origem.created_at
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limite); // Limita o resultado final

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

  // Cancelar transferência (reverter) - CORRIGIDO
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
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      if (contasError) throw contasError;

      const contaOrigem = contas.find(c => c.id === origem.conta_id);
      const contaDestino = contas.find(c => c.id === destino.conta_id);

      if (!contaOrigem || !contaDestino) {
        return { success: false, error: 'Contas não encontradas para reversão' };
      }

      const timestamp = new Date().toISOString();
      const valorTransferencia = Number(origem.valor);

      // Reverter os saldos com cálculos corretos
      const novoSaldoOrigem = Number(contaOrigem.saldo) + valorTransferencia; // Adiciona de volta
      const novoSaldoDestino = Number(contaDestino.saldo) - valorTransferencia; // Remove

      // Atualizar conta origem
      const { error: origemError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoOrigem,
          updated_at: timestamp
        })
        .eq('id', origem.conta_id)
        .eq('usuario_id', user.id);

      if (origemError) throw origemError;

      // Atualizar conta destino
      const { error: destinoError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoDestino,
          updated_at: timestamp
        })
        .eq('id', destino.conta_id)
        .eq('usuario_id', user.id);

      if (destinoError) throw destinoError;

      // Remover transações da transferência
      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('grupo_transferencia', grupoTransferencia)
        .eq('usuario_id', user.id);

      if (deleteError) throw deleteError;

      return { 
        success: true, 
        message: 'Transferência cancelada e saldos revertidos com sucesso',
        dados: {
          contaOrigem: contaOrigem.nome,
          contaDestino: contaDestino.nome,
          valor: valorTransferencia,
          novoSaldoOrigem,
          novoSaldoDestino
        }
      };

    } catch (err) {
      console.error('❌ Erro ao cancelar transferência:', err);
      const errorMessage = err.message || 'Erro ao cancelar transferência';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Obter estatísticas de transferências
  const obterEstatisticasTransferencias = useCallback(async (mesAno = null) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('transacoes')
        .select('valor, data, data_efetivacao, created_at') // ✅ INCLUIR data_efetivacao
        .eq('usuario_id', user.id)
        .eq('transferencia', true)
        .eq('tipo', 'despesa'); // Conta apenas uma vez por transferência

      // Filtrar por mês/ano se especificado
      if (mesAno) {
        const [ano, mes] = mesAno.split('-');
        const inicioMes = `${ano}-${mes}-01`;
        const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0]; // Último dia do mês
        query = query.gte('data', inicioMes).lte('data', fimMes);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const transferencias = data || [];
      const totalTransferencias = transferencias.length;
      const valorTotal = transferencias.reduce((sum, t) => sum + Number(t.valor), 0);
      const valorMedio = totalTransferencias > 0 ? valorTotal / totalTransferencias : 0;

      // Agrupar por dia para estatísticas diárias
      const transferenciasRecentes = transferencias
        .slice(0, 30) // Últimas 30 transferências
        .reduce((acc, t) => {
          const data = t.data;
          if (!acc[data]) {
            acc[data] = { quantidade: 0, valor: 0 };
          }
          acc[data].quantidade += 1;
          acc[data].valor += Number(t.valor);
          return acc;
        }, {});

      return {
        success: true,
        data: {
          totalTransferencias,
          valorTotal,
          valorMedio,
          transferenciasRecentes: Object.entries(transferenciasRecentes)
            .map(([data, stats]) => ({ data, ...stats }))
            .sort((a, b) => new Date(b.data) - new Date(a.data))
        }
      };

    } catch (err) {
      console.error('❌ Erro ao obter estatísticas:', err);
      const errorMessage = 'Erro ao calcular estatísticas de transferências';
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
    obterEstatisticasTransferencias,
    clearError
  };
};

export default useTransferencias;