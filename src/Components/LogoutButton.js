// src/components/LogoutButton.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

/**
 * Botão temporário de logout para testes
 * Remover após implementar logout no header
 */
const LogoutButton = () => {
  const { signOut, loading } = useAuth();

  const handleLogout = async () => {
    try {
      console.log('Iniciando logout...');
      
      const result = await signOut();
      
      if (result.success) {
        console.log('Logout realizado com sucesso');
        // Força limpeza local e redirecionamento
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      } else {
        console.error('Erro no logout:', result.error);
      }
    } catch (err) {
      console.error('Erro inesperado no logout:', err);
      // Em caso de erro, força limpeza local
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  // Não mostra em produção
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <LogOut size={16} />
      {loading ? 'Saindo...' : 'Logout'}
    </button>
  );
};

export default LogoutButton;