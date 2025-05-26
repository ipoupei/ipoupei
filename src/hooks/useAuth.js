import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * Hook personalizado para usar o contexto de autenticação
 * Versão corrigida que lida melhor com o refresh da página
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  // Debug em desenvolvimento
  if (import.meta.env.DEV) {
    console.log('🔐 useAuth - Estado atual:', {
      user: context.user ? { id: context.user.id, email: context.user.email } : null,
      loading: context.loading,
      isAuthenticated: context.isAuthenticated
    });
  }

  return context;
};

export default useAuth;