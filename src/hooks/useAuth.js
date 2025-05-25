import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * Hook personalizado para usar o contexto de autenticação
 * Versão simplificada que usa o contexto
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export default useAuth;