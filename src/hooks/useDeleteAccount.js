import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook personalizado para gerenciar exclusão de conta
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
      
      // Lista de tabelas para fazer backup
      const tables = ['perfil_usuario', 'contas', 'cartoes', 'categorias', 'subcategorias', 'dividas', 'amigos'];
      
      for (const table of tables) {
        let query = supabase.from(table).select('*');
        
        if (table === 'amigos') {
          query = query.or(`usuario_proprietario.eq.${userId},usuario_convidado.eq.${userId}`);
        } else {
          query = query.eq('usuario_id', userId);
        }
        
        const { data } = await query;
        if (data) backup[table] = data;
      }
      
      // Busca transações dos últimos 12 meses
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      
      const { data: transacoes } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data', umAnoAtras.toISOString());
      
      if (transacoes) backup.transacoes = transacoes;
      
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
      
      // Verificações básicas
      const checks = [
        { table: 'transacoes', field: 'compartilhada_com', title: 'Transações compartilhadas' },
        { table: 'dividas', field: 'situacao', title: 'Dívidas pendentes', condition: 'neq.quitada' },
        { table: 'amigos', field: 'status', title: 'Relacionamentos ativos', condition: 'eq.aceito' }
      ];
      
      for (const check of checks) {
        let query = supabase.from(check.table).select('id');
        
        if (check.table === 'amigos') {
          query = query.eq('usuario_proprietario', userId);
        } else {
          query = query.eq('usuario_id', userId);
        }
        
        if (check.condition) {
          const [operator, value] = check.condition.split('.');
          query = query[operator](check.field, value);
        } else if (check.field) {
          query = query.not(check.field, 'is', null);
        }
        
        const { data } = await query.limit(5);
        
        if (data && data.length > 0) {
          issues.push({
            type: 'warning',
            title: check.title,
            message: `Você possui ${data.length} item(ns) que serão afetados.`
          });
        }
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
        'amigos',
        'perfil_usuario'
      ];
      
      // Remove dados de cada tabela
      for (const table of tablesToClean) {
        if (table === 'amigos') {
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