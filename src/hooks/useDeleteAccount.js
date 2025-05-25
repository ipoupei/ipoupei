import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook personalizado para gerenciar exclusão de conta
 * Inclui validações, backup de dados e processo seguro de exclusão
 * 
 * @returns {Object} - Objeto com funções e estados para exclusão de conta
 */
const useDeleteAccount = () => {
  // Estados locais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backupData, setBackupData] = useState(null);
  
  const { user, signOut } = useAuth();

  // Gera backup dos dados do usuário
  const generateBackup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Usuário não autenticado');
      
      const userId = user.id;
      const backup = {
        usuario: {
          id: userId,
          email: user.email,
          nome: user.user_metadata?.nome,
          created_at: user.created_at
        },
        data_backup: new Date().toISOString()
      };
      
      // Busca perfil do usuário
      const { data: perfil } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (perfil) backup.perfil = perfil;
      
      // Busca contas
      const { data: contas } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', userId);
      
      if (contas) backup.contas = contas;
      
      // Busca cartões
      const { data: cartoes } = await supabase
        .from('cartoes')
        .select('*')
        .eq('usuario_id', userId);
      
      if (cartoes) backup.cartoes = cartoes;
      
      // Busca categorias
      const { data: categorias } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', userId);
      
      if (categorias) backup.categorias = categorias;
      
      // Busca subcategorias
      const { data: subcategorias } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('usuario_id', userId);
      
      if (subcategorias) backup.subcategorias = subcategorias;
      
      // Busca transações (limitado aos últimos 12 meses para não sobrecarregar)
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      
      const { data: transacoes } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data', umAnoAtras.toISOString());
      
      if (transacoes) backup.transacoes = transacoes;
      
      // Busca dívidas
      const { data: dividas } = await supabase
        .from('dividas')
        .select('*')
        .eq('usuario_id', userId);
      
      if (dividas) backup.dividas = dividas;
      
      // Busca amigos
      const { data: amigos } = await supabase
        .from('amigos')
        .select('*')
        .or(`usuario_proprietario.eq.${userId},usuario_convidado.eq.${userId}`);
      
      if (amigos) backup.amigos = amigos;
      
      setBackupData(backup);
      return { success: true, data: backup };
      
    } catch (err) {
      console.error('Erro ao gerar backup:', err);
      setError('Não foi possível gerar o backup dos seus dados.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Exporta backup como arquivo JSON
  const downloadBackup = useCallback((backup = backupData) => {
    if (!backup) return false;
    
    try {
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ipoupei-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Erro ao baixar backup:', err);
      setError('Não foi possível baixar o backup.');
      return false;
    }
  }, [backupData]);

  // Valida se o usuário pode ser excluído
  const validateDeletion = useCallback(async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      const userId = user.id;
      const issues = [];
      
      // Verifica se há transações compartilhadas ativas
      const { data: transacoesCompartilhadas } = await supabase
        .from('transacoes')
        .select('id, descricao')
        .eq('usuario_id', userId)
        .not('compartilhada_com', 'is', null)
        .limit(5);
      
      if (transacoesCompartilhadas && transacoesCompartilhadas.length > 0) {
        issues.push({
          type: 'warning',
          title: 'Transações compartilhadas',
          message: `Você possui ${transacoesCompartilhadas.length} transação(ões) compartilhada(s). Elas serão removidas dos amigos relacionados.`
        });
      }
      
      // Verifica se há dívidas pendentes
      const { data: dividasPendentes } = await supabase
        .from('dividas')
        .select('id, descricao, valor_total')
        .eq('usuario_id', userId)
        .neq('situacao', 'quitada')
        .limit(5);
      
      if (dividasPendentes && dividasPendentes.length > 0) {
        issues.push({
          type: 'warning',
          title: 'Dívidas pendentes',
          message: `Você possui ${dividasPendentes.length} dívida(s) pendente(s). Certifique-se de quitar ou transferir para outro controle.`
        });
      }
      
      // Verifica se é proprietário de grupos de amigos
      const { data: gruposProprietario } = await supabase
        .from('amigos')
        .select('id')
        .eq('usuario_proprietario', userId)
        .eq('status', 'aceito')
        .limit(1);
      
      if (gruposProprietario && gruposProprietario.length > 0) {
        issues.push({
          type: 'warning',
          title: 'Relacionamentos ativos',
          message: 'Você possui relacionamentos ativos que serão removidos.'
        });
      }
      
      return { success: true, issues };
      
    } catch (err) {
      console.error('Erro ao validar exclusão:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Exclui todos os dados do usuário
  const deleteAllUserData = useCallback(async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      const userId = user.id;
      
      // Lista de tabelas para limpar (em ordem de dependência)
      const tablesToClean = [
        'transacoes',
        'subcategorias', 
        'categorias',
        'dividas',
        'cartoes',
        'contas',
        'amigos', // Remove relacionamentos onde é proprietário ou convidado
        'perfil_usuario'
      ];
      
      // Remove dados de cada tabela
      for (const table of tablesToClean) {
        if (table === 'amigos') {
          // Para amigos, remove onde é proprietário ou convidado
          await supabase
            .from(table)
            .delete()
            .or(`usuario_proprietario.eq.${userId},usuario_convidado.eq.${userId}`);
        } else {
          await supabase
            .from(table)
            .delete()
            .eq('usuario_id', userId);
        }
      }
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao excluir dados do usuário:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Processo completo de exclusão de conta
  const deleteAccount = useCallback(async (password, confirmText) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Usuário não autenticado');
      
      // Valida confirmação
      if (confirmText !== 'EXCLUIR MINHA CONTA') {
        throw new Error('Texto de confirmação incorreto');
      }
      
      // Primeiro, exclui todos os dados do usuário
      const deleteDataResult = await deleteAllUserData();
      if (!deleteDataResult.success) {
        throw new Error(deleteDataResult.error || 'Erro ao excluir dados');
      }
      
      // Depois, exclui a conta de autenticação
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        console.error('Erro ao excluir conta de autenticação:', authError);
        // Mesmo com erro na exclusão da auth, continua o processo
        // pois os dados já foram removidos
      }
      
      // Faz logout
      await signOut();
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      setError(err.message || 'Erro inesperado ao excluir conta');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, deleteAllUserData, signOut]);

  // Desativa conta temporariamente (alternativa à exclusão)
  const deactivateAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Usuário não autenticado');
      
      // Atualiza perfil para marcar como desativado
      const { error } = await supabase
        .from('perfil_usuario')
        .upsert({
          id: user.id,
          conta_ativa: false,
          data_desativacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Faz logout
      await signOut();
      
      return { success: true };
      
    } catch (err) {
      console.error('Erro ao desativar conta:', err);
      setError('Não foi possível desativar a conta.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, signOut]);

  return {
    loading,
    error,
    backupData,
    generateBackup,
    downloadBackup,
    validateDeletion,
    deleteAccount,
    deactivateAccount
  };
};

export default useDeleteAccount;