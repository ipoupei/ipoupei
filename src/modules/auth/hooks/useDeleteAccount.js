import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@/modules/auth/hooks/useAuth'; 

/**
 * Hook personalizado para gerenciar exclusão de conta - VERSÃO COM EDGE FUNCTION
 * ✅ Usa Edge Function para exclusão real com Service Role
 * ✅ Backup e validações mantidas do código anterior
 * ✅ Exclusão completa - usuário pode se cadastrar novamente
 */
const useDeleteAccount = () => {
  // Estados locais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backupData, setBackupData] = useState(null);
  
  const { user, signOut } = useAuth();

  // ✅ MANTIDO: Função de backup (igual ao código anterior)
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
          created_at: user.created_at,
          user_metadata: user.user_metadata
        },
        data_backup: new Date().toISOString(),
        versao_backup: '3.0' // 🔥 ATUALIZADO: nova versão com Edge Function
      };
      
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
      
      const estatisticas = {};
      
      for (const table of tables) {
        try {
          let query = supabase.from(table).select('*');
          
          if (table === 'amigos') {
            query = query.or(`usuario_proprietario.eq.${userId},usuario_convidado.eq.${userId}`);
          } 
          else if (table === 'perfil_usuario') {
            query = query.eq('id', userId);
          } 
          else {
            query = query.eq('usuario_id', userId);
          }
          
          const { data, error: queryError } = await query;
          
          if (queryError && queryError.code !== 'PGRST116') {
            console.warn(`Erro ao buscar dados da tabela ${table}:`, queryError);
            estatisticas[table] = { erro: queryError.message };
          } else {
            backup[table] = data || [];
            estatisticas[table] = { registros: (data || []).length };
            
            if (table === 'categorias' && data && data.length > 0) {
              console.log(`📋 Backup: ${data.length} categoria(s) encontrada(s):`, 
                data.map(cat => cat.nome).join(', '));
            }
          }
        } catch (tableError) {
          console.warn(`Erro ao processar tabela ${table}:`, tableError);
          estatisticas[table] = { erro: tableError.message };
        }
      }
      
      // Buscar transações
      try {
        const { data: transacoes, error: transError } = await supabase
          .from('transacoes')
          .select(`
            *,
            categorias!inner(nome, cor),
            contas!inner(nome, tipo)
          `)
          .eq('usuario_id', userId)
          .order('data', { ascending: false })
          .limit(1000);
        
        if (transError) {
          console.warn('Erro ao buscar transações:', transError);
          estatisticas.transacoes = { erro: transError.message };
        } else {
          backup.transacoes = transacoes || [];
          estatisticas.transacoes = { registros: (transacoes || []).length };
        }
      } catch (transError) {
        console.warn('Erro ao processar transações:', transError);
        estatisticas.transacoes = { erro: transError.message };
      }
      
      backup.estatisticas = estatisticas;
      backup.resumo = {
        total_tabelas: Object.keys(estatisticas).length,
        total_registros: Object.values(estatisticas)
          .filter(stat => stat.registros !== undefined)
          .reduce((sum, stat) => sum + stat.registros, 0),
        tabelas_com_dados: Object.entries(estatisticas)
          .filter(([_, stat]) => stat.registros > 0)
          .map(([tabela, _]) => tabela)
      };
      
      console.log('✅ Backup gerado com sucesso:', backup.resumo);
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

  // ✅ MANTIDO: Função de download (igual ao código anterior)
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

  // ✅ MANTIDO: Função de validação (igual ao código anterior)
  const validateDeletion = useCallback(async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      const userId = user.id;
      const issues = [];
      
      const checks = [
        {
          table: 'transacoes',
          field: 'compartilhada_com',
          title: 'Transações compartilhadas',
          condition: 'not.is.null',
          severity: 'warning'
        },
        {
          table: 'transacoes',
          field: 'efetivado',
          title: 'Transações não efetivadas',
          condition: 'eq.false',
          severity: 'warning'
        },
        {
          table: 'dividas',
          field: 'situacao',
          title: 'Dívidas pendentes',
          condition: 'neq.quitada',
          severity: 'error'
        },
        {
          table: 'amigos',
          field: 'status',
          title: 'Relacionamentos ativos',
          condition: 'eq.aceito',
          isAmigosTable: true,
          severity: 'warning'
        },
        {
          table: 'categorias',
          field: 'usuario_id',
          title: 'Categorias personalizadas',
          condition: 'eq.' + userId,
          severity: 'info',
          customMessage: 'categoria(s) personalizada(s) serão perdidas permanentemente'
        }
      ];
      
      for (const check of checks) {
        try {
          let query = supabase.from(check.table).select('id, nome');
          
          if (check.isAmigosTable) {
            query = query.eq('usuario_proprietario', userId);
          } else if (check.condition.startsWith('eq.') && check.table === 'categorias') {
            query = query.eq('usuario_id', userId);
          } else {
            query = query.eq('usuario_id', userId);
          }
          
          if (check.condition && check.table !== 'categorias') {
            if (check.condition === 'not.is.null') {
              query = query.not(check.field, 'is', null);
            } else if (check.condition.startsWith('neq.')) {
              const value = check.condition.replace('neq.', '');
              query = query.neq(check.field, value);
            } else if (check.condition.startsWith('eq.') && check.field !== 'usuario_id') {
              const value = check.condition.replace('eq.', '');
              query = query.eq(check.field, value);
            }
          }
          
          const { data, error: checkError } = await query.limit(10);
          
          if (checkError) {
            console.warn(`Erro na verificação ${check.title}:`, checkError);
            continue;
          }
          
          if (data && data.length > 0) {
            const message = check.customMessage 
              ? `${data.length} ${check.customMessage}`
              : `Você possui ${data.length} item(ns) que podem ser afetados.`;
            
            issues.push({
              type: check.severity,
              title: check.title,
              message: message,
              count: data.length,
              items: data.slice(0, 5).map(item => item.nome).filter(Boolean)
            });
            
            if (check.table === 'categorias') {
              console.log(`📋 Validação: ${data.length} categoria(s) personalizada(s) serão excluídas`);
            }
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

  // 🔥 NOVA FUNÇÃO: Chama Edge Function para exclusão real
  const callDeleteUserFunction = useCallback(async (userId, confirmText) => {
    try {
      console.log('🚀 Chamando Edge Function para exclusão...');
      
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: {
          userId: userId,
          confirmText: confirmText
        }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw new Error(`Erro na função de exclusão: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ Edge Function retornou erro:', data.error);
        throw new Error(data.error || 'Erro desconhecido na exclusão');
      }

      console.log('✅ Edge Function executada com sucesso:', data.message);
      return data;

    } catch (err) {
      console.error('💥 Erro ao chamar Edge Function:', err);
      throw err;
    }
  }, []);

  // 🔥 MELHORADO: Exclusão usando Edge Function
  const deleteAccount = useCallback(async (password, confirmText) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Usuário não autenticado');
      
      // Valida confirmação
      if (confirmText !== 'EXCLUIR MINHA CONTA') {
        throw new Error('Texto de confirmação incorreto');
      }
      
      console.log('🗑️ Iniciando processo de exclusão via Edge Function:', user.email);
      
      // 🔥 PRINCIPAL MUDANÇA: Chama Edge Function em vez de fazer exclusão local
      const deleteResult = await callDeleteUserFunction(user.id, confirmText);
      
      console.log('✅ Conta excluída com sucesso via Edge Function!');
      
      // Fazer logout após sucesso
      await signOut();
      
      return { 
        success: true, 
        message: deleteResult.message,
        totalExcluidos: deleteResult.totalDeleted
      };
      
    } catch (err) {
      console.error('❌ Erro ao excluir conta:', err);
      setError(err.message || 'Erro inesperado ao excluir conta');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, signOut, callDeleteUserFunction]);

  // 🔥 MANTIDO: Desativação de conta (para quem não quer exclusão permanente)
  const deactivateAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Usuário não autenticado');
      
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
    deleteAccount, // 🔥 Agora usa Edge Function
    deactivateAccount
  };
};

export default useDeleteAccount;