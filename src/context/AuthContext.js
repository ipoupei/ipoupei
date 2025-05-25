// src/context/AuthContext.js - Versão Mockada para Desenvolvimento
import React, { createContext, useContext, useState, useEffect } from 'react';

// Contexto de autenticação
const AuthContext = createContext();

/**
 * Provider de autenticação mockado para desenvolvimento
 * Permite login sem Supabase configurado
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar se há um usuário autenticado ao carregar a aplicação
  useEffect(() => {
    const checkSession = () => {
      try {
        // Verifica se há um token no localStorage (simulação)
        const token = localStorage.getItem('mock_auth_token');
        const userData = localStorage.getItem('mock_user_data');
        
        if (token && userData) {
          // Simula que existe um usuário autenticado
          setUser(JSON.parse(userData));
        } else {
          setUser(null);
        }

        setLoading(false);
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setError('Falha ao verificar autenticação');
        setUser(null);
        setLoading(false);
      }
    };

    // Simula um pequeno delay de carregamento
    setTimeout(checkSession, 500);
  }, []);

  // Função de login mockada
  const signIn = async ({ email, password }) => {
    setLoading(true);
    setError(null);

    try {
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Credenciais mockadas para desenvolvimento
      const validCredentials = [
        { email: 'usuario@exemplo.com', password: 'senha123' },
        { email: 'admin@ipoupei.com', password: '123456' },
        { email: 'teste@teste.com', password: 'teste123' }
      ];
      
      const isValid = validCredentials.some(cred => 
        cred.email === email && cred.password === password
      );
      
      if (isValid) {
        // Login bem-sucedido
        const userData = {
          id: 'mock-user-123',
          email: email,
          user_metadata: {
            nome: email === 'admin@ipoupei.com' ? 'Administrador' : 'Usuário Teste'
          },
          created_at: new Date().toISOString()
        };
        
        setUser(userData);
        
        // Salva no localStorage para persistir
        localStorage.setItem('mock_auth_token', 'mock-token-123');
        localStorage.setItem('mock_user_data', JSON.stringify(userData));
        
        setLoading(false);
        return { success: true, user: userData };
      } else {
        // Credenciais inválidas
        setError('Email ou senha inválidos');
        setLoading(false);
        return { success: false, error: 'Email ou senha inválidos' };
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError(err.message || 'Falha ao fazer login');
      setLoading(false);
      return { success: false, error: err.message || 'Falha ao fazer login' };
    }
  };

  // Função de cadastro mockada
  const signUp = async ({ email, password, nome }) => {
    setLoading(true);
    setError(null);

    try {
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simula cadastro bem-sucedido
      const userData = {
        id: `mock-user-${Date.now()}`,
        email,
        user_metadata: {
          nome
        },
        created_at: new Date().toISOString()
      };
      
      setUser(userData);
      
      // Salva no localStorage
      localStorage.setItem('mock_auth_token', `mock-token-${Date.now()}`);
      localStorage.setItem('mock_user_data', JSON.stringify(userData));
      
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      setError(err.message || 'Falha ao criar conta');
      setLoading(false);
      return { success: false, error: err.message || 'Falha ao criar conta' };
    }
  };

  // Função de logout mockada
  const signOut = async () => {
    try {
      // Remove dados do localStorage
      localStorage.removeItem('mock_auth_token');
      localStorage.removeItem('mock_user_data');
      setUser(null);
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      return { success: false, error: 'Falha ao fazer logout' };
    }
  };

  // Função para recuperação de senha mockada
  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simula delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Mock: Email de recuperação enviado para:', email);
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      setError(err.message || 'Falha ao solicitar recuperação de senha');
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Função para atualizar senha mockada
  const updatePassword = async (newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simula delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Mock: Senha atualizada com sucesso');
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      setError(err.message || 'Falha ao atualizar senha');
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Função para atualizar perfil mockada
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // Simula delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualiza o usuário mockado
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...userData
        }
      };
      
      setUser(updatedUser);
      localStorage.setItem('mock_user_data', JSON.stringify(updatedUser));
      
      setLoading(false);
      return { success: true, user: updatedUser };
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message || 'Falha ao atualizar perfil');
      setLoading(false);
      return { success: false, error: err.message || 'Falha ao atualizar perfil' };
    }
  };

  // Valores expostos pelo contexto
  const value = {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para usar o contexto de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export default AuthContext;