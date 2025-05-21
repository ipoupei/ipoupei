import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook personalizado para gerenciar autenticação de usuários
 * Fornece funções para login, registro, logout e recuperação de senha
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verifica a sessão atual ao carregar o componente
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      
      try {
        // Busca a sessão atual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        const { session } = data;
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        setError('Falha ao verificar autenticação');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Configura listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    // Cleanup: remove listener ao desmontar o componente
    return () => subscription.unsubscribe();
  }, []);

  // Função de login
  const signIn = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError(err.message || 'Falha ao fazer login');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função de registro
  const signUp = useCallback(async ({ email, password, nome }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            created_at: new Date().toISOString()
          }
        }
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      setError(err.message || 'Falha ao criar conta');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função de logout
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      return { success: true };
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Função para recuperação de senha
  const resetPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      setError(err.message || 'Falha ao solicitar recuperação de senha');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar senha
  const updatePassword = useCallback(async (newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      setError(err.message || 'Falha ao atualizar senha');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar o perfil do usuário
  const updateProfile = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: userData
      });
      
      if (error) throw error;
      
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message || 'Falha ao atualizar perfil');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAuthenticated: !!user
  };
};

export default useAuth;