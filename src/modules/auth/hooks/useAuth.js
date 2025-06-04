// src/modules/auth/hooks/useAuth.js
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook personalizado para autenticação
 * MELHORADO: Usa initAuth do store + mantém debug logs + evita dupla inicialização
 * Compatível 100% com o authStore.js original do projeto iPoupei
 */
const useAuth = () => {
  const {
    user,
    session,
    isAuthenticated,
    loading,
    initialized,
    error,
    initAuth,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    updatePassword,
    signInWithGoogle,
    signInWithGitHub,
    clearError,
    setUser,
    setSession,
    setLoading,
    setError,
    setInitialized,
    getUserName,
    getUserEmail,
    isAdmin
  } = useAuthStore();

  // Garantir que a autenticação seja inicializada apenas uma vez
  // MELHORADO: Evita múltiplas inicializações
  useEffect(() => {
    if (!initialized && !loading && initAuth) {
      console.log('🔄 useAuth: Inicializando autenticação...');
      initAuth();
    }
  }, [initialized, loading, initAuth]);

  // Debug logs úteis para desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 useAuth Debug:', {
        user: !!user,
        session: !!session,
        isAuthenticated,
        loading,
        initialized,
        error: error ? 'Há erro' : 'Sem erro'
      });
    }
  }, [user, session, isAuthenticated, loading, initialized, error]);

  return {
    // Estados principais
    user,
    session,
    isAuthenticated,
    loading,
    initialized,
    error,
    
    // Ações de autenticação
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    updatePassword,
    signInWithGoogle,
    signInWithGitHub,
    
    // Ações auxiliares
    clearError,
    setUser,
    setSession,
    setLoading,
    setError,
    setInitialized,
    
    // Funções computadas (getters) do store original
    getUserName,
    getUserEmail,
    isAdmin,
    
    // Utilidades extras
    getUserId: () => user?.id,
    isLoggedIn: () => isAuthenticated && !!user,
    
    // Debug info (removível em produção)
    _debug: {
      source: 'zustand-authStore-enhanced',
      hasUser: !!user,
      userEmail: user?.email
    }
  };
};

export default useAuth;