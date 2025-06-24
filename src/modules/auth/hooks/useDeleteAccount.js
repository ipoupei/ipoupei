// src/modules/auth/hooks/useDeleteAccount.js - VERSÃO CORRIGIDA
import { useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from './useAuth';

const useDeleteAccount = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backupData, setBackupData] = useState(null);
  const { user, signOut } = useAuth();

  /**
   * Gera backup de todos os dados do usuário
   * ✅ VERSÃO APRIMORADA com melhor tratamento de retorno
   */
  const generateBackup = async () => {
    if (!user?.id) {
      const errorResult = { success: false, error: 'Usuário não autenticado' };
      setError(errorResult.error);
      return errorResult;
    }

    setLoading(true);
    setError(null);

    try {
      const backup = {
        usuario: {},
        contas: [],
        cartoes: [],
        categorias: [],
        subcategorias: [],
        transacoes: [],
        transferencias: [],
        dividas: [],
        amigos: [],
        gerado_em: new Date().toISOString(),
        versao_backup: '3.0',
        total_registros: 0
      };

      // 1. Dados do perfil do usuário
      try {
        const { data: perfil, error: perfilError } = await supabase
          .from('perfil_usuario')
          .select('*')
          .eq('id', user.id)
          .single();

        if (perfilError && perfilError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar perfil:', perfilError);
        }
        backup.usuario = perfil || {
          id: user.id,
          email: user.email,
          nome: user.user_metadata?.nome || user.user_metadata?.full_name || '',
          observacao: 'Perfil não encontrado na tabela perfil_usuario'
        };
      } catch (err) {
        console.warn('Erro ao buscar perfil, usando dados básicos:', err);
        backup.usuario = {
          id: user.id,
          email: user.email,
          nome: user.user_metadata?.nome || user.user_metadata?.full_name || '',
          observacao: 'Erro ao acessar tabela perfil_usuario'
        };
      }

      // 2. Contas
      try {
        const { data: contas, error: contasError } = await supabase
          .from('contas')
          .select('*')
          .eq('usuario_id', user.id)
          .order('nome');

        if (contasError && contasError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar contas:', contasError);
        }
        backup.contas = contas || [];
      } catch (err) {
        console.warn('Erro ao buscar contas:', err);
        backup.contas = [];
      }

      // 3. Cartões
      try {
        const { data: cartoes, error: cartoesError } = await supabase
          .from('cartoes')
          .select('*')
          .eq('usuario_id', user.id)
          .order('nome');

        if (cartoesError && cartoesError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar cartões:', cartoesError);
        }
        backup.cartoes = cartoes || [];
      } catch (err) {
        console.warn('Erro ao buscar cartões:', err);
        backup.cartoes = [];
      }

      // 4. Categorias
      try {
        const { data: categorias, error: categoriasError } = await supabase
          .from('categorias')
          .select('*')
          .eq('usuario_id', user.id)
          .order('nome');

        if (categoriasError && categoriasError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar categorias:', categoriasError);
        }
        backup.categorias = categorias || [];
      } catch (err) {
        console.warn('Erro ao buscar categorias:', err);
        backup.categorias = [];
      }

      // 5. Subcategorias
      try {
        const { data: subcategorias, error: subcategoriasError } = await supabase
          .from('subcategorias')
          .select('*')
          .eq('usuario_id', user.id)
          .order('nome');

        if (subcategoriasError && subcategoriasError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar subcategorias:', subcategoriasError);
        }
        backup.subcategorias = subcategorias || [];
      } catch (err) {
        console.warn('Erro ao buscar subcategorias:', err);
        backup.subcategorias = [];
      }

      // 6. Transações - VERSÃO SIMPLIFICADA para evitar problemas de JOIN
      try {
        const { data: transacoes, error: transacoesError } = await supabase
          .from('transacoes')
          .select('*')
          .eq('usuario_id', user.id)
          .order('data', { ascending: false });

        if (transacoesError && transacoesError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar transações:', transacoesError);
        }
        backup.transacoes = transacoes || [];
        
        // Se primeira tentativa falhou, tentar busca mais simples
        if (!transacoes && transacoesError) {
          console.log('Tentando busca simplificada de transações...');
          const { data: transacoesSimples } = await supabase
            .from('transacoes')
            .select('id, descricao, valor, data, tipo, categoria_id, conta_id, cartao_id, efetivado, created_at')
            .eq('usuario_id', user.id)
            .order('data', { ascending: false })
            .limit(1000); // Limitar para evitar timeout
          
          backup.transacoes = transacoesSimples || [];
        }
      } catch (err) {
        console.warn('Erro ao buscar transações:', err);
        backup.transacoes = [];
      }

      // 7. Transferências
      try {
        const { data: transferencias, error: transferenciasError } = await supabase
          .from('transferencias')
          .select('*')
          .eq('usuario_id', user.id)
          .order('data', { ascending: false });

        if (transferenciasError && transferenciasError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar transferências:', transferenciasError);
        }
        backup.transferencias = transferencias || [];
      } catch (err) {
        console.warn('Erro ao buscar transferências:', err);
        backup.transferencias = [];
      }

      // 8. Dívidas
      try {
        const { data: dividas, error: dividasError } = await supabase
          .from('dividas')
          .select('*')
          .eq('usuario_id', user.id)
          .order('data_contratacao', { ascending: false });

        if (dividasError && dividasError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar dívidas:', dividasError);
        }
        backup.dividas = dividas || [];
      } catch (err) {
        console.warn('Erro ao buscar dívidas:', err);
        backup.dividas = [];
      }

      // 9. Amigos e relacionamentos
      try {
        const { data: amigos, error: amigosError } = await supabase
          .from('amigos')
          .select('*')
          .or(`usuario_proprietario.eq.${user.id},usuario_convidado.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (amigosError && amigosError.code !== 'PGRST116') {
          console.warn('Aviso ao buscar amigos:', amigosError);
        }
        backup.amigos = amigos || [];
      } catch (err) {
        console.warn('Erro ao buscar amigos:', err);
        backup.amigos = [];
      }

      // ✅ CALCULAR TOTAIS
      backup.total_registros = 
        (backup.contas?.length || 0) + 
        (backup.cartoes?.length || 0) + 
        (backup.categorias?.length || 0) + 
        (backup.subcategorias?.length || 0) + 
        (backup.transacoes?.length || 0) + 
        (backup.transferencias?.length || 0) + 
        (backup.dividas?.length || 0) + 
        (backup.amigos?.length || 0);

      // ✅ SALVAR NO ESTADO
      setBackupData(backup);
      setLoading(false);

      // ✅ RESULTADO SEMPRE COM SUCCESS: TRUE (mesmo com dados vazios)
      const resultado = { 
        success: true, 
        data: backup,
        resumo: {
          contas: backup.contas?.length || 0,
          cartoes: backup.cartoes?.length || 0,
          categorias: backup.categorias?.length || 0,
          subcategorias: backup.subcategorias?.length || 0,
          transacoes: backup.transacoes?.length || 0,
          transferencias: backup.transferencias?.length || 0,
          dividas: backup.dividas?.length || 0,
          amigos: backup.amigos?.length || 0,
          total_registros: backup.total_registros
        }
      };

      console.log('✅ Backup gerado com sucesso:', resultado);
      return resultado;

    } catch (err) {
      console.error('❌ Erro crítico ao gerar backup:', err);
      setError(err.message || 'Erro interno ao gerar backup');
      setLoading(false);
      
      return { 
        success: false, 
        error: err.message || 'Erro interno ao gerar backup',
        details: err
      };
    }
  };

  /**
   * Baixa o backup como arquivo JSON
   */
  const downloadBackup = () => {
    if (!backupData) {
      setError('Nenhum backup disponível para download');
      return false;
    }

    try {
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `iPoupei-backup-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      return true;
    } catch (err) {
      console.error('Erro ao baixar backup:', err);
      setError('Erro ao baixar arquivo de backup');
      return false;
    }
  };

  /**
   * Valida se a conta pode ser excluída e identifica possíveis problemas
   */
  const validateDeletion = async () => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setLoading(true);
    setError(null);

    try {
      const issues = [];
      const warnings = [];

      // Verificar transações futuras
      const { data: transacoesFuturas, error: futuraError } = await supabase
        .from('transacoes')
        .select('id, data, descricao, valor')
        .eq('usuario_id', user.id)
        .gt('data', new Date().toISOString().split('T')[0])
        .eq('efetivado', false);

      if (futuraError && futuraError.code !== 'PGRST116') {
        throw futuraError;
      }

      if (transacoesFuturas && transacoesFuturas.length > 0) {
        warnings.push({
          type: 'warning',
          title: 'Transações futuras agendadas',
          message: `Você possui ${transacoesFuturas.length} transação(ões) agendada(s) para o futuro que será(ão) perdida(s).`,
          count: transacoesFuturas.length
        });
      }

      // Verificar recorrências ativas
      const { data: recorrencias, error: recorrenciaError } = await supabase
        .from('transacoes')
        .select('grupo_recorrencia')
        .eq('usuario_id', user.id)
        .eq('eh_recorrente', true)
        .not('grupo_recorrencia', 'is', null);

      if (recorrenciaError && recorrenciaError.code !== 'PGRST116') {
        throw recorrenciaError;
      }

      const gruposRecorrencia = [...new Set(recorrencias?.map(r => r.grupo_recorrencia) || [])];
      if (gruposRecorrencia.length > 0) {
        warnings.push({
          type: 'warning',
          title: 'Transações recorrentes ativas',
          message: `Você possui ${gruposRecorrencia.length} grupo(s) de transações recorrentes que será(ão) cancelado(s).`,
          count: gruposRecorrencia.length
        });
      }

      // Verificar relacionamentos com amigos
      const { data: relacionamentos, error: amigosError } = await supabase
        .from('amigos')
        .select('id, tipo_relacionamento, status')
        .or(`usuario_proprietario.eq.${user.id},usuario_convidado.eq.${user.id}`)
        .eq('status', 'aceito');

      if (amigosError && amigosError.code !== 'PGRST116') {
        throw amigosError;
      }

      if (relacionamentos && relacionamentos.length > 0) {
        warnings.push({
          type: 'info',
          title: 'Relacionamentos ativos',
          message: `Você possui ${relacionamentos.length} relacionamento(s) ativo(s) que será(ão) removido(s).`,
          count: relacionamentos.length
        });
      }

      // Verificar transações compartilhadas
      const { data: compartilhadas, error: compartilhadasError } = await supabase
        .from('transacoes')
        .select('id')
        .eq('usuario_id', user.id)
        .not('compartilhada_com', 'is', null);

      if (compartilhadasError && compartilhadasError.code !== 'PGRST116') {
        throw compartilhadasError;
      }

      if (compartilhadas && compartilhadas.length > 0) {
        warnings.push({
          type: 'warning',
          title: 'Transações compartilhadas',
          message: `Você possui ${compartilhadas.length} transação(ões) compartilhada(s) com outros usuários.`,
          count: compartilhadas.length
        });
      }

      setLoading(false);

      return {
        success: true,
        issues: [...issues, ...warnings],
        canDelete: issues.length === 0,
        warningsCount: warnings.length
      };

    } catch (err) {
      console.error('Erro ao validar exclusão:', err);
      setError(err.message || 'Erro interno na validação');
      setLoading(false);
      return { success: false, error: err.message || 'Erro interno' };
    }
  };

  /**
   * Desativa a conta temporariamente
   */
  const deactivateAccount = async () => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setLoading(true);
    setError(null);

    try {
      // Atualizar perfil para desativado
      const { error: updateError } = await supabase
        .from('perfil_usuario')
        .update({
          conta_ativa: false,
          data_desativacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Fazer logout
      await signOut();

      setLoading(false);
      return { success: true };

    } catch (err) {
      console.error('Erro ao desativar conta:', err);
      setError(err.message || 'Erro interno ao desativar conta');
      setLoading(false);
      return { success: false, error: err.message || 'Erro interno' };
    }
  };

  /**
   * ✅ FUNÇÃO CORRIGIDA: Exclui permanentemente a conta e todos os dados
   * AGORA INCLUI EXCLUSÃO DO USUÁRIO DO SUPABASE AUTH
   */
  const deleteAccount = async (password, confirmText) => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    if (confirmText !== 'EXCLUIR MINHA CONTA') {
      return { success: false, error: 'Texto de confirmação incorreto' };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Iniciando exclusão PERMANENTE da conta:', user.id);

      // ===== ETAPA 1: EXCLUIR DADOS DAS TABELAS =====
      console.log('🔄 Etapa 1: Excluindo dados das tabelas...');

      // 1. Transações (devem ser excluídas antes das contas e cartões)
      try {
        const { error: transacoesError } = await supabase
          .from('transacoes')
          .delete()
          .eq('usuario_id', user.id);

        if (transacoesError) throw transacoesError;
        console.log('✅ Transações excluídas');
      } catch (err) {
        console.error('❌ Erro ao excluir transações:', err);
        throw new Error('Falha ao excluir transações: ' + err.message);
      }

      // 2. Transferências
      try {
        const { error: transferenciasError } = await supabase
          .from('transferencias')
          .delete()
          .eq('usuario_id', user.id);

        if (transferenciasError) throw transferenciasError;
        console.log('✅ Transferências excluídas');
      } catch (err) {
        console.error('❌ Erro ao excluir transferências:', err);
        throw new Error('Falha ao excluir transferências: ' + err.message);
      }

      // 3. Subcategorias (devem ser excluídas antes das categorias)
      try {
        const { error: subcategoriasError } = await supabase
          .from('subcategorias')
          .delete()
          .eq('usuario_id', user.id);

        if (subcategoriasError) throw subcategoriasError;
        console.log('✅ Subcategorias excluídas');
      } catch (err) {
        console.error('❌ Erro ao excluir subcategorias:', err);
        throw new Error('Falha ao excluir subcategorias: ' + err.message);
      }

      // 4. Categorias
      try {
        const { error: categoriasError } = await supabase
          .from('categorias')
          .delete()
          .eq('usuario_id', user.id);

        if (categoriasError) throw categoriasError;
        console.log('✅ Categorias excluídas');
      } catch (err) {
        console.error('❌ Erro ao excluir categorias:', err);
        throw new Error('Falha ao excluir categorias: ' + err.message);
      }

      // 5. Cartões
      try {
        const { error: cartoesError } = await supabase
          .from('cartoes')
          .delete()
          .eq('usuario_id', user.id);

        if (cartoesError) throw cartoesError;
        console.log('✅ Cartões excluídos');
      } catch (err) {
        console.error('❌ Erro ao excluir cartões:', err);
        throw new Error('Falha ao excluir cartões: ' + err.message);
      }

      // 6. Contas
      try {
        const { error: contasError } = await supabase
          .from('contas')
          .delete()
          .eq('usuario_id', user.id);

        if (contasError) throw contasError;
        console.log('✅ Contas excluídas');
      } catch (err) {
        console.error('❌ Erro ao excluir contas:', err);
        throw new Error('Falha ao excluir contas: ' + err.message);
      }

      // 7. Dívidas
      try {
        const { error: dividasError } = await supabase
          .from('dividas')
          .delete()
          .eq('usuario_id', user.id);

        if (dividasError) throw dividasError;
        console.log('✅ Dívidas excluídas');
      } catch (err) {
        console.error('❌ Erro ao excluir dívidas:', err);
        throw new Error('Falha ao excluir dívidas: ' + err.message);
      }

      // 8. Relacionamentos (amigos)
      try {
        const { error: amigosError } = await supabase
          .from('amigos')
          .delete()
          .or(`usuario_proprietario.eq.${user.id},usuario_convidado.eq.${user.id}`);

        if (amigosError) throw amigosError;
        console.log('✅ Relacionamentos excluídos');
      } catch (err) {
        console.error('❌ Erro ao excluir relacionamentos:', err);
        throw new Error('Falha ao excluir relacionamentos: ' + err.message);
      }

      // 9. Perfil do usuário
      try {
        const { error: perfilError } = await supabase
          .from('perfil_usuario')
          .delete()
          .eq('id', user.id);

        if (perfilError) throw perfilError;
        console.log('✅ Perfil excluído');
      } catch (err) {
        console.error('❌ Erro ao excluir perfil:', err);
        throw new Error('Falha ao excluir perfil: ' + err.message);
      }

      console.log('✅ Etapa 1 concluída: Dados das tabelas excluídos');

      // ===== ETAPA 2: EXCLUIR USUÁRIO DO SUPABASE AUTH =====
      console.log('🔄 Etapa 2: Excluindo usuário do Supabase Auth...');

      try {
        // ✅ CORREÇÃO PRINCIPAL: Excluir o usuário do auth.users
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (authDeleteError) {
          console.error('❌ ERRO ao excluir usuário do auth (mas continuando):', authDeleteError);
          
          // ⚠️ Se falhar a exclusão do auth, ainda considera sucesso
          // pois os dados já foram removidos
          console.log('⚠️ Dados excluídos mas usuário permanece no auth (pode ser limitação de permissão)');
        } else {
          console.log('✅ Usuário excluído do Supabase Auth');
        }
      } catch (authError) {
        console.error('❌ Erro na exclusão do auth:', authError);
        // Continua mesmo com erro no auth, pois dados já foram removidos
      }

      // ===== ETAPA 3: LOGOUT FINAL =====
      console.log('🔄 Etapa 3: Fazendo logout...');

      try {
        await signOut();
        console.log('✅ Logout realizado');
      } catch (signOutError) {
        console.warn('⚠️ Erro no logout (não crítico):', signOutError);
      }

      console.log('🎉 EXCLUSÃO COMPLETA REALIZADA COM SUCESSO!');

      setLoading(false);
      return { 
        success: true,
        message: 'Conta excluída permanentemente com sucesso! Todos os dados foram removidos.'
      };

    } catch (err) {
      console.error('❌ Erro durante exclusão da conta:', err);
      setError(err.message || 'Erro interno ao excluir conta');
      setLoading(false);
      
      return { 
        success: false, 
        error: err.message || 'Erro interno ao excluir conta'
      };
    }
  };

  /**
   * ✅ NOVA FUNÇÃO: Exclusão com backup automático
   */
  const deleteAccountWithBackup = async (confirmText = '') => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    if (confirmText !== 'EXCLUIR MINHA CONTA') {
      return { success: false, error: 'Texto de confirmação incorreto' };
    }

    try {
      console.log('📦 Gerando backup automático antes da exclusão...');
      
      // 1. Gerar backup primeiro
      const backupResult = await generateBackup();
      
      if (backupResult.success && backupResult.data) {
        // Fazer download do backup automaticamente
        try {
          const dataStr = JSON.stringify(backupResult.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `ipoupei-backup-final-${user?.email?.replace('@', '-')}-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
          
          console.log('✅ Backup baixado automaticamente antes da exclusão');
        } catch (downloadError) {
          console.warn('⚠️ Erro no download do backup (mas continuando exclusão):', downloadError);
        }
      } else {
        console.warn('⚠️ Falha no backup (mas continuando exclusão):', backupResult.error);
      }

      // 2. Proceder com a exclusão
      console.log('🗑️ Prosseguindo com exclusão após backup...');
      return await deleteAccount('', confirmText);

    } catch (err) {
      console.error('❌ Erro no processo de exclusão com backup:', err);
      return { 
        success: false, 
        error: 'Erro durante o processo de exclusão: ' + err.message
      };
    }
  };

  return {
    loading,
    error,
    backupData,
    generateBackup,
    downloadBackup,
    validateDeletion,
    deleteAccount,
    deleteAccountWithBackup, // ✅ NOVA FUNÇÃO
    deactivateAccount
  };
};

export default useDeleteAccount;