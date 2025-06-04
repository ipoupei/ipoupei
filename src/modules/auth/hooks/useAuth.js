// src/modules/auth/hooks/useAuth.js
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook personalizado para autenticação
 * Usa Zustand store e garante inicialização correta
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
    updateProfile
  } = useAuthStore();

  // Garantir que a autenticação seja inicializada apenas uma vez
  useEffect(() => {
    if (!initialized && !loading) {
      console.log('🔄 useAuth: Inicializando autenticação...');
      initAuth();
    }
  }, [initialized, loading, initAuth]);

  // Debug logs para identificar o problema
  useEffect(() => {
    console.log('🔍 useAuth Debug:', {
      user: !!user,
      session: !!session,
      isAuthenticated,
      loading,
      initialized,
      error
    });
  }, [user, session, isAuthenticated, loading, initialized, error]);

  return {
    // Estados
    user,
    session,
    isAuthenticated,
    loading,
    initialized,
    error,
    
    // Ações
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    
    // Utilidades
    getUserId: () => user?.id,
    getUserEmail: () => user?.email,
    isLoggedIn: () => isAuthenticated && !!user
  };
};

export default useAuth;