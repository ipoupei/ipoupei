import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente para proteger rotas que requerem autenticação
 * Versão híbrida que funciona com Context E Zustand
 */
const ProtectedRoute = ({ children }) => {
  let user = null;
  let isAuthenticated = false;
  let loading = false;
  let initialized = false;

  // Tentar usar Zustand primeiro, se falhar usar Context
  try {
    // Importação dinâmica para evitar erro se store não existir
    const { useAuthStore } = require('../store/authStore');
    const authState = useAuthStore.getState();
    
    user = authState.user;
    isAuthenticated = authState.isAuthenticated;
    loading = authState.loading;
    initialized = authState.initialized;
    
    console.log('🔧 ProtectedRoute usando Zustand:', { isAuthenticated, initialized });
  } catch (error) {
    // Fallback para Context se Zustand não estiver disponível
    console.log('🔧 ProtectedRoute fallback para Context');
    
    try {
      const { useAuth } = require('../context/AuthContext');
      const authContext = useAuth();
      
      user = authContext.user;
      isAuthenticated = authContext.isAuthenticated;
      loading = authContext.loading;
      initialized = authContext.initialized;
    } catch (contextError) {
      console.warn('Nem Zustand nem Context disponível');
      // Permitir acesso se nenhum sistema de auth estiver disponível
      return children;
    }
  }

  // Mostrar loading enquanto não inicializou
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!isAuthenticated || !user) {
    console.log('🔒 Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  // Se está autenticado, renderizar o componente
  console.log('✅ Usuário autenticado:', user.email);
  return children;
};

export default ProtectedRoute;