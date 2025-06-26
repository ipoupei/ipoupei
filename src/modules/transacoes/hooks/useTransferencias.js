// src/modules/transacoes/hooks/useTransferencias.js - VERSÃO RÁPIDA
import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';
import useContasStore from '@modules/contas/store/contasStore';

/**
 * Hook para transferências - VERSÃO RÁPIDA
 * ✅ Mantém funcionalidade atual que está funcionando
 * ✅ Remove refresh global demorado
 * ✅ Usa só refresh da store de contas (mais rápido)
 * ✅ Performance otimizada
 */
const useTransferencias = () => {
  const { user } = useAuthStore();
  const forceRefreshContas = useContasStore(state => state.forceRefreshContas);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Realizar transferência (mantém lógica atual, só otimiza refresh)
  const realizarTransferencia = useCallback(async (dadosTransferencia) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      const { contaOrigemId, contaDestinoId, valor, descricao } = dadosTransferencia;

      // Validações básicas (mantém as atuais)
      if (!contaOrigemId || !contaDestinoId) {
        return { success: false, error: 'Contas de origem e destino são obrigatórias' };
      }

      // Validação de valor (mantém a atual que funciona)
      let valorNumerico;
      
      if (typeof valor === 'string') {
        const valorLimpo = valor
          .replace(/\./g, '') // Remove pontos (milhares)
          .replace(',', '.'); // Substitui vírgula por ponto
        valorNumerico = parseFloat(valorLimpo);
      } else {
        valorNumerico = Number(valor);
      }
      
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

      // Buscar as contas (mantém validação atual)
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

      const timestamp = new Date().toISOString();
      const dataTransferencia = timestamp.split('T')[0];
      const descricaoFinal = descricao || `Transferência de ${contaOrigem.nome} para ${contaDestino.nome}`;

      console.log('🔄 Iniciando transferência:', {
        contaOrigem: contaOrigem.nome,
        contaDestino: contaDestino.nome,
        valor: valorNumerico,
        descricao: descricaoFinal
      });

      // ✅ TENTAR RPC PRIMEIRO (mais rápido)
      try {
        const { data: resultTransferencia, error: transferError } = await supabase.rpc(
          'realizar_transferencia',
          {
            p_usuario_id: user.id,
            p_conta_origem_id: contaOrigemId,
            p_conta_destino_id: contaDestinoId,
            p_valor: valorNumerico
          }
        );

        if (!transferError) {
          console.log('✅ Transferência realizada com sucesso via RPC');
          
          // ✅ REFRESH RÁPIDO: Só contas, sem aguardar muito
          setTimeout(() => {
            forceRefreshContas();
          }, 500); // 500ms em vez de 2 segundos
          
          return {
            success: true,
            data: {
              contaOrigem: contaOrigem.nome,
              contaDestino: contaDestino.nome,
              valor: valorNumerico,
              data: dataTransferencia,
              descricao: descricaoFinal
            }
          };
        }
      } catch (rpcError) {
        console.log('⚠️ RPC falhou, usando método manual');
      }

      // ✅ MÉTODO MANUAL (mantém lógica atual que funciona)
      // 1. Debitar da conta origem
      const { error: debitError } = await supabase
        .from('contas')
        .update({ 
          saldo: contaOrigem.saldo - valorNumerico,
          updated_at: timestamp
        })
        .eq('id', contaOrigemId)
        .eq('usuario_id', user.id);

      if (debitError) throw debitError;

      // 2. Creditar na conta destino
      const { error: creditError } = await supabase
        .from('contas')
        .update({ 
          saldo: contaDestino.saldo + valorNumerico,
          updated_at: timestamp
        })
        .eq('id', contaDestinoId)
        .eq('usuario_id', user.id);

      if (creditError) throw creditError;

      // 3. Criar transação de saída
      const { error: saidaError } = await supabase
        .from('transacoes')
        .insert({
          usuario_id: user.id,
          conta_id: contaOrigemId,
          conta_destino_id: contaDestinoId,
          tipo: 'despesa',
          descricao: `${descricaoFinal} - Saída`,
          valor: valorNumerico,
          data: dataTransferencia,
          efetivado: true,
          transferencia: true,
          observacoes: `Transferência para ${contaDestino.nome}`,
          created_at: timestamp,
          updated_at: timestamp
        });

      if (saidaError) throw saidaError;

      // 4. Criar transação de entrada
      const { error: entradaError } = await supabase
        .from('transacoes')
        .insert({
          usuario_id: user.id,
          conta_id: contaDestinoId,
          conta_destino_id: contaOrigemId,
          tipo: 'receita',
          descricao: `${descricaoFinal} - Entrada`,
          valor: valorNumerico,
          data: dataTransferencia,
          efetivado: true,
          transferencia: true,
          observacoes: `Transferência de ${contaOrigem.nome}`,
          created_at: timestamp,
          updated_at: timestamp
        });

      if (entradaError) throw entradaError;

      console.log('✅ Transferência realizada com sucesso');

      // ✅ REFRESH RÁPIDO: Só contas, em background
      setTimeout(() => {
        forceRefreshContas();
      }, 500);

      return {
        success: true,
        data: {
          contaOrigem: contaOrigem.nome,
          contaDestino: contaDestino.nome,
          valor: valorNumerico,
          data: dataTransferencia,
          descricao: descricaoFinal
        }
      };

    } catch (err) {
      console.error('❌ Erro na transferência:', err);
      const errorMessage = err.message || 'Erro inesperado na transferência';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user, forceRefreshContas]);

  // ✅ Buscar transferências (mantém lógica atual)
  const buscarTransferenciasRecentes = useCallback(async (limite = 10) => {
    if (!user?.id) {
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('transacoes')
        .select(`
          *,
          conta:contas!conta_id(nome, tipo),
          conta_destino:contas!conta_destino_id(nome, tipo)
        `)
        .eq('usuario_id', user.id)
        .eq('transferencia', true)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (fetchError) throw fetchError;

      // Agrupar transferências (mantém lógica atual)
      const transferenciasAgrupadas = [];
      const processadas = new Set();

      data?.forEach(transacao => {
        if (processadas.has(transacao.id)) return;

        if (transacao.tipo === 'despesa') {
          const entrada = data.find(t => 
            t.tipo === 'receita' && 
            t.conta_destino_id === transacao.conta_id &&
            t.conta_id === transacao.conta_destino_id &&
            Math.abs(new Date(t.created_at) - new Date(transacao.created_at)) < 5000
          );

          transferenciasAgrupadas.push({
            id: transacao.id,
            data: transacao.data,
            valor: transacao.valor,
            descricao: transacao.descricao,
            conta_origem: transacao.conta?.nome || 'Conta não encontrada',
            conta_destino: transacao.conta_destino?.nome || 'Conta não encontrada',
            created_at: transacao.created_at,
            observacoes: transacao.observacoes
          });

          processadas.add(transacao.id);
          if (entrada) processadas.add(entrada.id);
        }
      });

      return transferenciasAgrupadas;

    } catch (err) {
      console.error('❌ Erro ao buscar transferências:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ Estornar transferência (otimizada)
  const estornarTransferencia = useCallback(async (transferenciaId, motivoEstorno = '') => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar transação original
      const { data: transacoes, error: fetchError } = await supabase
        .from('transacoes')
        .select(`
          *,
          conta:contas!conta_id(nome),
          conta_destino:contas!conta_destino_id(nome)
        `)
        .eq('usuario_id', user.id)
        .eq('transferencia', true)
        .or(`id.eq.${transferenciaId},conta_destino_id.eq.${transferenciaId},conta_id.eq.${transferenciaId}`);

      if (fetchError) throw fetchError;

      if (!transacoes || transacoes.length === 0) {
        return { success: false, error: 'Transferência não encontrada' };
      }

      const transacaoSaida = transacoes.find(t => t.tipo === 'despesa');
      if (!transacaoSaida) {
        return { success: false, error: 'Dados da transferência estão incompletos' };
      }

      const valor = transacaoSaida.valor;

      // Realizar estorno (transferência reversa)
      const resultadoEstorno = await realizarTransferencia({
        contaOrigemId: transacaoSaida.conta_destino_id,
        contaDestinoId: transacaoSaida.conta_id,
        valor: valor,
        descricao: `ESTORNO: ${transacaoSaida.descricao} - ${motivoEstorno}`.trim()
      });

      if (!resultadoEstorno.success) {
        throw new Error(resultadoEstorno.error || 'Erro ao realizar estorno');
      }

      console.log('✅ Transferência estornada com sucesso');

      return {
        success: true,
        data: {
          valor: valor,
          data: new Date().toISOString().split('T')[0],
          motivo: motivoEstorno
        }
      };

    } catch (err) {
      console.error('❌ Erro ao estornar transferência:', err);
      const errorMessage = err.message || 'Erro inesperado no estorno';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user, realizarTransferencia]);

  // ✅ Validar transferência (mantém atual)
  const validarTransferencia = useCallback(async (dadosTransferencia) => {
    if (!user?.id) {
      return { valida: false, erro: 'Usuário não autenticado' };
    }

    try {
      const { contaOrigemId, contaDestinoId, valor } = dadosTransferencia;

      if (!contaOrigemId || !contaDestinoId) {
        return { valida: false, erro: 'Contas de origem e destino são obrigatórias' };
      }

      if (contaOrigemId === contaDestinoId) {
        return { valida: false, erro: 'Conta de origem e destino devem ser diferentes' };
      }

      let valorNumerico;
      if (typeof valor === 'string') {
        const valorLimpo = valor.replace(/\./g, '').replace(',', '.');
        valorNumerico = parseFloat(valorLimpo);
      } else {
        valorNumerico = Number(valor);
      }

      if (!valorNumerico || valorNumerico <= 0 || isNaN(valorNumerico)) {
        return { valida: false, erro: 'Valor deve ser um número maior que zero' };
      }

      const { data: contas, error: contasError } = await supabase
        .from('contas')
        .select('id, nome, saldo, ativo')
        .in('id', [contaOrigemId, contaDestinoId])
        .eq('usuario_id', user.id);

      if (contasError || !contas || contas.length !== 2) {
        return { valida: false, erro: 'Uma ou ambas as contas não foram encontradas' };
      }

      const contaOrigem = contas.find(c => c.id === contaOrigemId);
      const contaDestino = contas.find(c => c.id === contaDestinoId);

      if (!contaOrigem?.ativo || !contaDestino?.ativo) {
        return { valida: false, erro: 'Uma ou ambas as contas estão inativas' };
      }

      const saldoInsuficiente = contaOrigem.saldo < valorNumerico;

      return {
        valida: true,
        dados: {
          contaOrigem,
          contaDestino,
          valorNumerico,
          saldoInsuficiente,
          novoSaldoOrigem: contaOrigem.saldo - valorNumerico,
          novoSaldoDestino: contaDestino.saldo + valorNumerico
        }
      };

    } catch (err) {
      console.error('❌ Erro na validação:', err);
      return { valida: false, erro: 'Erro ao validar transferência' };
    }
  }, [user]);

  return {
    // Estados
    loading,
    error,
    
    // Operações principais
    realizarTransferencia,
    estornarTransferencia,
    
    // Consultas
    buscarTransferenciasRecentes,
    validarTransferencia,
    
    // Utilitários
    setError
  };
};

export default useTransferencias;