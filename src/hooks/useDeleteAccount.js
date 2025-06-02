import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook personalizado para gerenciar exclusão de conta - VERSÃO CORRIGIDA
 * Agora com melhor integração com a estrutura do banco de dados
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
          nome: user.user_metadata?.nome || user.user_metadata?.full_name,
          created_at: user.created_at
        },
        data_backup: new Date().toISOString()
      };
      
      // CORREÇÃO: Lista de tabelas atualizada conforme estrutura do banco
      const tables = [
        'perfil_usuario', 
        'contas', 
        'cartoes', 
        'categorias', 
        'subcategorias', 
        'dividas', 
        'amigos',
        'transferencias'
      ];
      
      for (const table of tables) {
        try {
          let query = supabase.from(table).select('*');
          
          // CORREÇÃO: Tratamento específico para a tabela amigos
          if (table === 'amigos') {
            query = query.or(`usuario_proprietario.eq.${userId},usuario_convidado.eq.${userId}`);
          } 
          // CORREÇÃO: Tratamento específico para perfil_usuario
          else if (table === 'perfil_usuario') {
            query = query.eq('id', userId);
          } 
          // Para outras tabelas que têm usuario_id
          else {
            query = query.eq('usuario_id', userId);
          }
          
          const { data, error: queryError } = await query;
          
          if (queryError && queryError.code !== 'PGRST116') {
            console.warn(`Erro ao buscar dados da tabela ${table}:`, queryError);
          }
          
          if (data && data.length > 0) {
            backup[table] = data;
          }
        } catch (tableError) {
          console.warn(`Erro ao processar tabela ${table}:`, tableError);
          // Continua o processo mesmo se uma tabela falhar
        }
      }
      
      // CORREÇÃO: Busca transações com melhor filtro de data
      try {
        const umAnoAtras = new Date();
        umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
        
        const { data: transacoes, error: transError } = await supabase
          .from('transacoes')
          .select('*')
          .eq('usuario_id', userId)
          .gte('data', umAnoAtras.toISOString());
        
        if (transError) {
          console.warn('Erro ao buscar transações:', transError);
        } else if (transacoes && transacoes.length > 0) {
          backup.transacoes = transacoes;
        }
      } catch (transError) {
        console.warn('Erro ao processar transações:', transError);
      }
      
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

  // CORREÇÃO: Valida se o usuário pode ser excluído
  const validateDeletion = useCallback(async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      const userId = user.id;
      const issues = [];
      
      // CORREÇÃO: Verificações atualizadas conforme estrutura do banco
      const checks = [
        {
          table: 'transacoes',
          field: 'compartilhada_com',
          title: 'Transações compartilhadas',
          condition: 'not.is.null'
        },
        {
          table: 'dividas',
          field: 'situacao',
          title: 'Dívidas pendentes',
          condition: 'neq.quitada'
        },
        {
          table: 'amigos',
          field: 'status',
          title: 'Relacionamentos ativos',
          condition: 'eq.aceito',
          isAmigosTable: true
        }
      ];
      
      for (const check of checks) {
        try {
          let query = supabase.from(check.table).select('id');
          
          // Tratamento especial para tabela amigos
          if (check.isAmigosTable) {
            query = query.eq('usuario_proprietario', userId);
          } else {
            query = query.eq('usuario_id', userId);
          }
          
          // Aplica condições específicas
          if (check.condition) {
            if (check.condition === 'not.is.null') {
              query = query.not(check.field, 'is', null);
            } else if (check.condition.startsWith('neq.')) {
              const value = check.condition.replace('neq.', '');
              query = query.neq(check.field, value);
            } else if (check.condition.startsWith('eq.')) {
              const value = check.condition.replace('eq.', '');
              query = query.eq(check.field, value);
            }
          }
          
          const { data, error: checkError } = await query.limit(5);
          
          if (checkError) {
            console.warn(`Erro na verificação ${check.title}:`, checkError);
            continue;
          }
          
          if (data && data.length > 0) {
            issues.push({
              type: 'warning',
              title: check.title,
              message: `Você possui ${data.length} item(ns) que podem ser afetados.`
            });
          }
        } catch (checkError) {
          console.warn(`Erro ao verificar ${check.title}:`, checkError);
        }
      }
      
      return { success: true, issues };
      
    } catch (err) {
      console.error('Erro ao validar exclusão:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // CORREÇÃO: Exclui todos os dados do usuário seguindo a ordem de dependências
  const deleteAllUserData = useCallback(async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      const userId = user.id;
      
      // CORREÇÃO: Lista de tabelas em ordem de dependência (das dependentes para as principais)
      const tablesToClean = [
        'transacoes',        // Dependente de contas, cartoes, categorias
        'transferencias',    // Dependente de contas
        'subcategorias',     // Dependente de categorias
        'categorias',        // Principal
        'dividas',          // Principal
        'cartoes',          // Principal
        'contas',           // Principal
        'amigos',           // Relação especial
        'perfil_usuario'    // Principal - usuário
      ];
      
      // Remove dados de cada tabela
      for (const table of tablesToClean) {
        try {
          let deleteQuery;
          
          if (table === 'amigos') {
            // Para amigos, remove onde o usuário é proprietário OU convidado
            deleteQuery = supabase
              .from(table)
              .delete()
              .or(`usuario_proprietario.eq.${userId},usuario_convidado.eq.${userId}`);
          } else if (table === 'perfil_usuario') {
            // Para perfil_usuario, usa o ID diretamente
            deleteQuery = supabase
              .from(table)
              .delete()
              .eq('id', userId);
          } else {
            // Para outras tabelas, usa usuario_id
            deleteQuery = supabase
              .from(table)
              .delete()
              .eq('usuario_id', userId);
          }
          
          const { error: deleteError } = await deleteQuery;
          
          if (deleteError) {
            console.warn(`Erro ao deletar dados da tabela ${table}:`, deleteError);
            // Continua o processo mesmo se uma tabela falhar
          } else {
            console.log(`Dados da tabela ${table} removidos com sucesso`);
          }
        } catch (tableError) {
          console.warn(`Erro ao processar exclusão da tabela ${table}:`, tableError);
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
      
      // CORREÇÃO: Tenta excluir a conta de autenticação (pode falhar dependendo das permissões)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (authError) {
          console.warn('Aviso: Não foi possível excluir a conta de autenticação:', authError);
          // Não interrompe o processo, pois os dados já foram removidos
        }
      } catch (authError) {
        console.warn('Aviso: Erro ao tentar excluir conta de autenticação:', authError);
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

  // CORREÇÃO: Desativa conta temporariamente usando o campo correto
  const deactivateAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Usuário não autenticado');
      
      // CORREÇÃO: Atualiza perfil para marcar como desativado usando upsert
      const { error } = await supabase
        .from('perfil_usuario')
        .upsert({
          id: user.id,
          conta_ativa: false,
          data_desativacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
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