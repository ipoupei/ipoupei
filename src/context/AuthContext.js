// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabaseClient';

// Contexto de autenticação
const AuthContext = createContext();

/**
 * Provider de autenticação para gerenciar estado de usuário
 * Futuramente será conectado ao Supabase Auth
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar se há um usuário autenticado ao carregar a aplicação
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Mock de requisição para verificar sessão atual
        // Em produção, será substituído por: 
        // const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        // Simulando verificação de autenticação
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Simula que existe um usuário autenticado
          setUser({
            id: '123456',
            email: 'usuario@exemplo.com',
            nome: 'Usuário Teste',
            avatar_url: null,
            created_at: '2023-01-01T00:00:00.000Z'
          });
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

    checkSession();

    // Monitora mudanças no estado de autenticação (será implementado com Supabase)
    // const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
    //  (event, session) => {
    //    setUser(session?.user ?? null);
    //    setLoading(false);
    //  }
    // );
    // 
    // return () => {
    //   subscription.unsubscribe();
    // };
  }, []);

  // Função de login
  const signIn = async ({ email, password }) => {
    setLoading(true);
    setError(null);

    try {
      // Mock de requisição de login
      // Em produção, será substituído por:
      // const { data, error } = await supabaseClient.auth.signInWithPassword({
      //   email,
      //   password
      // });
      
      // Simulação de login mockado
      if (email === 'usuario@exemplo.com' && password === 'senha123') {
        // Login bem-sucedido
        const userData = {
          id: '123456',
          email: 'usuario@exemplo.com',
          nome: 'Usuário Teste',
          avatar_url: null,
          created_at: '2023-01-01T00:00:00.000Z'
        };
        
        setUser(userData);
        localStorage.setItem('auth_token', 'mock_token_123');
        
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

  // Função de cadastro
  const signUp = async ({ email, password, nome }) => {
    setLoading(true);
    setError(null);

    try {
      // Mock de requisição de cadastro
      // Em produção, será substituído por:
      // const { data, error } = await supabaseClient.auth.signUp({
      //   email,
      //   password,
      //   options: {
      //     data: {
      //       nome
      //     }
      //   }
      // });
      
      // Simulação de cadastro mockado
      const userData = {
        id: '123456',
        email,
        nome,
        avatar_url: null,
        created_at: new Date().toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('auth_token', 'mock_token_123');
      
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      setError(err.message || 'Falha ao criar conta');
      setLoading(false);
      return { success: false, error: err.message || 'Falha ao criar conta' };
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      // Mock de requisição de logout
      // Em produção, será substituído por:
      // await supabaseClient.auth.signOut();
      
      // Simulação de logout mockado
      localStorage.removeItem('auth_token');
      setUser(null);
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      return { success: false, error: 'Falha ao fazer logout' };
    }
  };

  // Função para atualizar perfil
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // Mock de atualização de perfil
      // Em produção, será substituído por uma requisição real ao Supabase
      
      // Atualiza o estado do usuário
      setUser(prev => ({
        ...prev,
        ...userData
      }));
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError('Falha ao atualizar perfil');
      setLoading(false);
      return { success: false, error: 'Falha ao atualizar perfil' };
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
    updateProfile,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para usar o contexto de autenticação
 * 
 * @example
 * const { user, signIn, signOut } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export default AuthContext;