import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook personalizado para gerenciar amigos e familiares
 */
const useAmigos = () => {
  // Estado para armazenar os amigos
  const [amigos, setAmigos] = useState([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca todos os amigos do usuário
  const fetchAmigos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Busca amigos onde o usuário atual é o owner ou é um amigo aceito
      const { data, error } = await supabase
        .from('amigos')
        .select(`
          *,
          usuario_convidado:usuarios!amigos_usuario_convidado_fkey(id, nome, email),
          usuario_proprietario:usuarios!amigos_usuario_proprietario_fkey(id, nome, email)
        `)
        .or('usuario_proprietario.eq.' + (await supabase.auth.getUser()).data.user?.id + ',usuario_convidado.eq.' + (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAmigos(data || []);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao buscar amigos:', err);
      setError('Não foi possível carregar seus amigos. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega os amigos ao inicializar o hook
  useEffect(() => {
    fetchAmigos();
  }, [fetchAmigos]);

  // Envia convite para um amigo
  const enviarConvite = useCallback(async (email, nome, tipo = 'amigo') => {
    try {
      setLoading(true);
      setError(null);
      
      // Verifica se o usuário existe
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('email', email)
        .single();
      
      const currentUser = await supabase.auth.getUser();
      
      // Prepara os dados do convite
      const dadosConvite = {
        usuario_proprietario: currentUser.data.user?.id,
        email_convidado: email,
        nome_convidado: nome,
        tipo_relacionamento: tipo,
        status: 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Se o usuário já existe, adiciona o ID
      if (usuarioExistente) {
        dadosConvite.usuario_convidado = usuarioExistente.id;
      }
      
      // Insere o convite
      const { data, error } = await supabase
        .from('amigos')
        .insert([dadosConvite])
        .select();
      
      if (error) throw error;
      
      // Atualiza a lista local
      await fetchAmigos();
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      setError('Não foi possível enviar o convite. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAmigos]);

  // Aceita um convite
  const aceitarConvite = useCallback(async (conviteId) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('amigos')
        .update({
          status: 'aceito',
          data_aceite: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conviteId)
        .select();
      
      if (error) throw error;
      
      // Atualiza a lista local
      await fetchAmigos();
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Erro ao aceitar convite:', err);
      setError('Não foi possível aceitar o convite. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAmigos]);

  // Rejeita um convite
  const rejeitarConvite = useCallback(async (conviteId) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('amigos')
        .update({
          status: 'rejeitado',
          updated_at: new Date().toISOString()
        })
        .eq('id', conviteId)
        .select();
      
      if (error) throw error;
      
      // Atualiza a lista local
      await fetchAmigos();
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Erro ao rejeitar convite:', err);
      setError('Não foi possível rejeitar o convite. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAmigos]);

  // Remove um amigo
  const removerAmigo = useCallback(async (amigoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('amigos')
        .delete()
        .eq('id', amigoId);
      
      if (error) throw error;
      
      // Atualiza a lista local
      setAmigos(prev => prev.filter(amigo => amigo.id !== amigoId));
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao remover amigo:', err);
      setError('Não foi possível remover o amigo. Por favor, tente novamente.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca amigos aceitos para usar em formulários
  const getAmigosAtivos = useCallback(() => {
    return amigos.filter(amigo => amigo.status === 'aceito');
  }, [amigos]);

  // Busca convites pendentes recebidos
  const getConvitesPendentes = useCallback(async () => {
    try {
      const currentUser = await supabase.auth.getUser();
      
      return amigos.filter(amigo => 
        amigo.status === 'pendente' && 
        amigo.usuario_convidado === currentUser.data.user?.id
      );
    } catch (err) {
      console.error('Erro ao buscar convites pendentes:', err);
      return [];
    }
  }, [amigos]);

  return {
    amigos,
    loading,
    error,
    fetchAmigos,
    enviarConvite,
    aceitarConvite,
    rejeitarConvite,
    removerAmigo,
    getAmigosAtivos,
    getConvitesPendentes
  };
};
export default useAmigos;