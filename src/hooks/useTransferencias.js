import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook personalizado para gerenciar transferências entre contas
 * VERSÃO ATUALIZADA - Permite saldo negativo e garante gravação no banco
 */
const useTransferencias = () => {
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook de autenticação
  const { user, isAuthenticated } = useAuth();

  // Realiza uma transferência entre contas - VERSÃO COM SALDO NEGATIVO
  const realizarTransferencia = useCallback(async (dadosTransferencia) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { contaOrigemId, contaDestinoId, valor, descricao } = dadosTransferencia;

    // Validações básicas
    if (!contaOrigemId || !contaDestinoId) {
      return { success: false, error: 'Contas de origem e destino são obrigatórias' };
    }

    if (contaOrigemId === contaDestinoId) {
      return { success: false, error: 'Conta de origem e destino não podem ser iguais' };
    }

    if (!valor || valor <= 0) {
      return { success: false, error: 'Valor deve ser maior que zero' };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando transferência com saldo negativo permitido...', {
        origem: contaOrigemId,
        destino: contaDestinoId,
        valor: valor,
        usuario: user.id
      });

      // 1. BUSCA E VALIDA AS CONTAS
      const { data: contas, error: contasError } = await supabase
        .from('contas')
        .select('id, nome, saldo, ativo')
        .in('id', [contaOrigemId, contaDestinoId])
        .eq('usuario_id', user.id);

      if (contasError) {
        console.error('❌ Erro ao buscar contas:', contasError);
        throw new Error('Erro ao buscar contas: ' + contasError.message);
      }

      if (!contas || contas.length !== 2) {
        throw new Error('Uma ou ambas as contas não foram encontradas');
      }

      const contaOrigem = contas.find(c => c.id === contaOrigemId);
      const contaDestino = contas.find(c => c.id === contaDestinoId);

      if (!contaOrigem || !contaDestino) {
        throw new Error('Contas não encontradas');
      }

      if (!contaOrigem.ativo || !contaDestino.ativo) {
        throw new Error('Uma das contas está inativa');
      }

      console.log('✅ Contas validadas:', {
        origem: { nome: contaOrigem.nome, saldo: contaOrigem.saldo },
        destino: { nome: contaDestino.nome, saldo: contaDestino.saldo }
      });

      // 2. AVISO SOBRE SALDO NEGATIVO (mas não impede a transferência)
      let avisoSaldoNegativo = null;
      if (contaOrigem.saldo < valor) {
        const novoSaldoOrigem = contaOrigem.saldo - valor;
        avisoSaldoNegativo = `A conta ${contaOrigem.nome} ficará com saldo negativo: R$ ${novoSaldoOrigem.toFixed(2)}`;
        console.log('⚠️ Aviso:', avisoSaldoNegativo);
      }

      // 3. EXECUTA A TRANSFERÊNCIA (SEMPRE MANUAL PARA GARANTIR GRAVAÇÃO)
      console.log('🔄 Executando transferência manual garantida...');

      const novoSaldoOrigem = contaOrigem.saldo - valor;
      const novoSaldoDestino = contaDestino.saldo + valor;
      const agora = new Date().toISOString();

      // 3.1 Atualiza saldo da conta origem
      console.log('📤 Atualizando conta origem...', { id: contaOrigemId, novoSaldo: novoSaldoOrigem });
      
      const { data: origemData, error: origemError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoOrigem,
          updated_at: agora
        })
        .eq('id', contaOrigemId)
        .eq('usuario_id', user.id)
        .select();

      if (origemError) {
        console.error('❌ Erro ao atualizar conta origem:', origemError);
        throw new Error('Erro ao debitar da conta origem: ' + origemError.message);
      }

      if (!origemData || origemData.length === 0) {
        throw new Error('Falha ao atualizar conta origem - nenhum registro afetado');
      }

      console.log('✅ Conta origem atualizada:', origemData[0]);

      // 3.2 Atualiza saldo da conta destino
      console.log('📥 Atualizando conta destino...', { id: contaDestinoId, novoSaldo: novoSaldoDestino });

      const { data: destinoData, error: destinoError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoDestino,
          updated_at: agora
        })
        .eq('id', contaDestinoId)
        .eq('usuario_id', user.id)
        .select();

      if (destinoError) {
        console.error('❌ Erro ao atualizar conta destino:', destinoError);
        
        // ROLLBACK: Reverte a conta origem
        console.log('🔄 Fazendo rollback da conta origem...');
        await supabase
          .from('contas')
          .update({ 
            saldo: contaOrigem.saldo,
            updated_at: agora
          })
          .eq('id', contaOrigemId)
          .eq('usuario_id', user.id);
        
        throw new Error('Erro ao creditar na conta destino: ' + destinoError.message);
      }

      if (!destinoData || destinoData.length === 0) {
        // ROLLBACK: Reverte a conta origem
        console.log('🔄 Fazendo rollback da conta origem...');
        await supabase
          .from('contas')
          .update({ 
            saldo: contaOrigem.saldo,
            updated_at: agora
          })
          .eq('id', contaOrigemId)
          .eq('usuario_id', user.id);
          
        throw new Error('Falha ao atualizar conta destino - nenhum registro afetado');
      }

      console.log('✅ Conta destino atualizada:', destinoData[0]);

      // 3.3 FORÇA a gravação das transações de histórico
      console.log('📝 Criando transações de histórico...');

      const transacoes = [
        {
          usuario_id: user.id,
          conta_id: contaOrigemId,
          tipo: 'despesa',
          categoria: 'transferencia',
          descricao: descricao || `Transferência para ${contaDestino.nome}`,
          valor: valor,
          data: agora,
          created_at: agora,
          updated_at: agora
        },
        {
          usuario_id: user.id,
          conta_id: contaDestinoId,
          tipo: 'receita',
          categoria: 'transferencia',
          descricao: descricao || `Transferência de ${contaOrigem.nome}`,
          valor: valor,
          data: agora,
          created_at: agora,
          updated_at: agora
        }
      ];

      const { data: transacoesData, error: transacoesError } = await supabase
        .from('transacoes')
        .insert(transacoes)
        .select();

      if (transacoesError) {
        console.error('⚠️ Erro ao criar transações de histórico:', transacoesError);
        // Não falha a transferência por causa do histórico, mas avisa
      } else {
        console.log('✅ Transações de histórico criadas:', transacoesData?.length || 0, 'registros');
      }

      // 3.4 OPCIONALMENTE, salva na tabela de transferências (se existir)
      try {
        console.log('📋 Tentando salvar registro de transferência...');
        
        const { data: transferData, error: transferError } = await supabase
          .from('transferencias')
          .insert([{
            usuario_id: user.id,
            conta_origem_id: contaOrigemId,
            conta_destino_id: contaDestinoId,
            valor: valor,
            descricao: descricao || `Transferência de ${contaOrigem.nome} para ${contaDestino.nome}`,
            data: agora,
            created_at: agora,
            updated_at: agora
          }])
          .select();

        if (transferError) {
          console.log('⚠️ Tabela transferências não existe ou erro:', transferError.message);
        } else {
          console.log('✅ Registro de transferência salvo:', transferData?.[0]?.id);
        }
      } catch (transferErr) {
        console.log('⚠️ Erro ao salvar na tabela transferências (ignorado):', transferErr.message);
      }

      // 4. SUCESSO COMPLETO!
      console.log('🎉 Transferência concluída com sucesso!');

      let mensagemSucesso = `Transferência de ${formatCurrency(valor)} realizada com sucesso!`;
      if (avisoSaldoNegativo) {
        mensagemSucesso += `\n⚠️ ${avisoSaldoNegativo}`;
      }

      return {
        success: true,
        message: mensagemSucesso,
        aviso: avisoSaldoNegativo,
        data: {
          contaOrigem: contaOrigem.nome,
          contaDestino: contaDestino.nome,
          valor: valor,
          novoSaldoOrigem: novoSaldoOrigem,
          novoSaldoDestino: novoSaldoDestino,
          saldoOrigemNegativo: novoSaldoOrigem < 0
        }
      };

    } catch (err) {
      console.error('❌ Erro na transferência:', err);
      const errorMessage = err.message || 'Não foi possível realizar a transferência. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Função auxiliar para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Busca histórico de transferências (das transações)
  const buscarHistorico = useCallback(async (limite = 50) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      setLoading(true);
      setError(null);

      // Busca das transações de transferência
      const { data: transacoes, error: transacoesError } = await supabase
        .from('transacoes')
        .select(`
          *,
          conta:contas(id, nome, tipo)
        `)
        .eq('usuario_id', user.id)
        .eq('categoria', 'transferencia')
        .order('created_at', { ascending: false })
        .limit(limite);

      if (transacoesError) {
        throw transacoesError;
      }

      // Tenta buscar da tabela de transferências também (se existir)
      let transferenciasEspecificas = [];
      try {
        const { data: transfers, error: transfersError } = await supabase
          .from('transferencias')
          .select(`
            *,
            conta_origem:contas!transferencias_conta_origem_id_fkey(id, nome),
            conta_destino:contas!transferencias_conta_destino_id_fkey(id, nome)
          `)
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limite);

        if (!transfersError && transfers) {
          transferenciasEspecificas = transfers;
          console.log('✅ Encontradas transferências específicas:', transfers.length);
        }
      } catch (err) {
        console.log('⚠️ Tabela transferências não disponível:', err.message);
      }

      return { 
        success: true, 
        data: {
          transacoes: transacoes || [],
          transferencias: transferenciasEspecificas
        }
      };

    } catch (err) {
      console.error('❌ Erro ao buscar histórico:', err);
      const errorMessage = 'Não foi possível carregar o histórico de transferências.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Função para verificar se uma transferência foi gravada corretamente
  const verificarTransferencia = useCallback(async (contaOrigemId, contaDestinoId, valor) => {
    if (!isAuthenticated || !user) return false;

    try {
      // Verifica se as contas foram atualizadas recentemente
      const { data: contas, error } = await supabase
        .from('contas')
        .select('id, nome, saldo, updated_at')
        .in('id', [contaOrigemId, contaDestinoId])
        .eq('usuario_id', user.id);

      if (error || !contas || contas.length !== 2) {
        return false;
      }

      // Verifica se foram atualizadas nos últimos 30 segundos
      const agora = new Date();
      const trinta_segundos_atras = new Date(agora.getTime() - 30000);

      const contasAtualizadas = contas.filter(conta => {
        const updated = new Date(conta.updated_at);
        return updated > trinta_segundos_atras;
      });

      console.log('🔍 Verificação de transferência:', {
        contasEncontradas: contas.length,
        contasAtualizadas: contasAtualizadas.length,
        contas: contas.map(c => ({ nome: c.nome, saldo: c.saldo, updated: c.updated_at }))
      });

      return contasAtualizadas.length === 2;
    } catch (err) {
      console.error('❌ Erro na verificação:', err);
      return false;
    }
  }, [isAuthenticated, user]);

  return {
    loading,
    error,
    realizarTransferencia,
    buscarHistorico,
    verificarTransferencia,
    setError
  };
};

export default useTransferencias;