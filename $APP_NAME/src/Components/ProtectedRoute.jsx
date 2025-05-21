import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para a página de login se o usuário não estiver autenticado
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Componentes filhos a serem renderizados
 * @param {boolean} props.requireAdmin - Se a rota requer privilégios de administrador
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Mostra nada durante o carregamento para evitar flashes de redirecionamento
  if (loading) {
    return <div className="loading-screen">Carregando...</div>;
  }

  // Verifica se o usuário está autenticado
  if (!isAuthenticated) {
    // Redireciona para login e passa a localização atual para retorno
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se a rota requer privilégios de admin, verifica se o usuário tem essa permissão
  if (requireAdmin) {
    const userMetadata = user?.user_metadata;
    const isAdmin = userMetadata?.role === 'admin';
    
    if (!isAdmin) {
      // Redireciona para dashboard se não tiver permissão
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Se tudo estiver ok, renderiza os componentes filhos
  return children;
};

export default ProtectedRoute;