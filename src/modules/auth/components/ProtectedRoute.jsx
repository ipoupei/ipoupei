import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuth from '@modules/auth/hooks/useAuth';

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para login se não estiver autenticado
 * ATUALIZADO: Usa o hook useAuth do Zustand
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto não inicializou ou está carregando
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location,
          redirectTo: location.pathname + location.search 
        }} 
        replace 
      />
    );
  }

  // Se estiver autenticado, renderizar o componente
  return children;
};

export default ProtectedRoute;