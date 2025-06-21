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
   */
  const generateBackup = async () => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
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
        gerado_em: new Date().toISOString()
      };

      // 1. Dados do perfil do usuário
      const { data: perfil, error: perfilError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id', user.id)
        .single();

      if (perfilError && perfilError.code !== 'PGRST116') {
        throw perfilError;
      }
      backup.usuario = perfil || {};

      // 2. Contas
      const { data: contas, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (contasError) throw contasError;
      backup.contas = contas || [];

      // 3. Cartões
      const { data: cartoes, error: cartoesError } = await supabase
        .from('cartoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (cartoesError) throw cartoesError;
      backup.cartoes = cartoes || [];

      // 4. Categorias
      const { data: categorias, error: categoriasError } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (categoriasError) throw categoriasError;
      backup.categorias = categorias || [];

      // 5. Subcategorias
      const { data: subcategorias, error: subcategoriasError } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (subcategoriasError) throw subcategoriasError;
      backup.subcategorias = subcategorias || [];

      // 6. Transações (corrigindo o problema de relacionamento)
      const { data: transacoes, error: transacoesError } = await supabase
        .from('transacoes')
        .select(`
          *,
          conta_principal:contas!conta_id(nome, tipo),
          conta_destino:contas!conta_destino_id(nome, tipo),
          categoria:categorias(nome, tipo, cor),
          subcategoria:subcategorias(nome),
          cartao:cartoes(nome, bandeira)
        `)
        .eq('usuario_id', user.id)
        .order('data', { ascending: false });

      if (transacoesError) throw transacoesError;
      backup.transacoes = transacoes || [];

      // 7. Transferências
      const { data: transferencias, error: transferenciasError } = await supabase
        .from(        'transferencias')
        .select(`
          *,
          conta_origem:contas!conta_origem_id(nome, tipo),
          conta_destino:contas!conta_destino_id(nome, tipo)
        `)
        .eq('usuario_id', user.id)
        .order('data', { ascending: false });

      if (transferenciasError) throw transferenciasError;
      backup.transferencias = transferencias || [];

      // 8. Dívidas
      const { data: dividas, error: dividasError } = await supabase
        .from('dividas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_contratacao', { ascending: false });

      if (dividasError) throw dividasError;
      backup.dividas = dividas || [];

      // 9. Amigos e relacionamentos
      const { data: amigos, error: amigosError } = await supabase
        .from('amigos')
        .select('*')
        .or(`usuario_proprietario.eq.${user.id},usuario_convidado.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (amigosError) throw amigosError;
      backup.amigos = amigos || [];

      setBackupData(backup);
      setLoading(false);

      return { 
        success: true, 
        data: backup,
        resumo: {
          contas: backup.contas.length,
          cartoes: backup.cartoes.length,
          categorias: backup.categorias.length,
          subcategorias: backup.subcategorias.length,
          transacoes: backup.transacoes.length,
          transferencias: backup.transferencias.length,
          dividas: backup.dividas.length,
          amigos: backup.amigos.length
        }
      };

    } catch (err) {
      console.error('Erro ao gerar backup:', err);
      setError(err.message || 'Erro interno ao gerar backup');
      setLoading(false);
      return { success: false, error: err.message || 'Erro interno' };
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
   * Exclui permanentemente a conta e todos os dados
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
      // Excluir dados em ordem específica devido às foreign keys
      
      // 1. Transações (devem ser excluídas antes das contas e cartões)
      const { error: transacoesError } = await supabase
        .from('transacoes')
        .delete()
        .eq('usuario_id', user.id);

      if (transacoesError) throw transacoesError;

      // 2. Transferências
      const { error: transferenciasError } = await supabase
        .from('transferencias')
        .delete()
        .eq('usuario_id', user.id);

      if (transferenciasError) throw transferenciasError;

      // 3. Subcategorias (devem ser excluídas antes das categorias)
      const { error: subcategoriasError } = await supabase
        .from('subcategorias')
        .delete()
        .eq('usuario_id', user.id);

      if (subcategoriasError) throw subcategoriasError;

      // 4. Categorias
      const { error: categoriasError } = await supabase
        .from('categorias')
        .delete()
        .eq('usuario_id', user.id);

      if (categoriasError) throw categoriasError;

      // 5. Cartões
      const { error: cartoesError } = await supabase
        .from('cartoes')
        .delete()
        .eq('usuario_id', user.id);

      if (cartoesError) throw cartoesError;

      // 6. Contas
      const { error: contasError } = await supabase
        .from('contas')
        .delete()
        .eq('usuario_id', user.id);

      if (contasError) throw contasError;

      // 7. Dívidas
      const { error: dividasError } = await supabase
        .from('dividas')
        .delete()
        .eq('usuario_id', user.id);

      if (dividasError) throw dividasError;

      // 8. Relacionamentos (amigos)
      const { error: amigosError } = await supabase
        .from('amigos')
        .delete()
        .or(`usuario_proprietario.eq.${user.id},usuario_convidado.eq.${user.id}`);

      if (amigosError) throw amigosError;

      // 9. Perfil do usuário
      const { error: perfilError } = await supabase
        .from('perfil_usuario')
        .delete()
        .eq('id', user.id);

      if (perfilError) throw perfilError;

      // 10. Excluir conta de autenticação (admin)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        console.warn('Erro ao excluir usuário da autenticação:', authError);
        // Continua mesmo se não conseguir excluir da auth (pode ser limitação de permissão)
      }

      // Fazer logout
      await signOut();

      setLoading(false);
      return { success: true };

    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      setError(err.message || 'Erro interno ao excluir conta');
      setLoading(false);
      return { success: false, error: err.message || 'Erro interno' };
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
    deactivateAccount
  };
};

export default useDeleteAccount;