// src/context/AuthContext.js - Versão Mais Robusta
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Contexto de autenticação
const AuthContext = createContext();

/**
 * Provider de autenticação integrado com Supabase
 * Versão mais robusta com timeout e fallbacks
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Verificar sessão atual e configurar listener
  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticação...');
        
        // Timeout de segurança (10 segundos)
        timeoutId = setTimeout(() => {
          if (mounted && !initialized) {
            console.warn('⚠️ Timeout na inicialização da auth, continuando sem usuário');
            setUser(null);
            setSession(null);
            setLoading(false);
            setInitialized(true);
          }
        }, 10000);
        
        // Obter sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Limpar timeout se chegou até aqui
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          // Não tratar como erro fatal, apenas continuar sem usuário
          console.log('ℹ️ Continuando sem usuário autenticado');
        }
        
        if (mounted) {
          console.log('📋 Sessão obtida:', session ? `Usuário: ${session.user?.email}` : 'Nenhuma sessão');
          setSession(session);
          setUser(session?.user ?? null);
          
          // Se há usuário, tentar criar/verificar perfil (sem bloquear)
          if (session?.user) {
            // Executar em background, sem aguardar
            ensureUserProfile(session.user).catch(err => {
              console.warn('⚠️ Erro ao verificar perfil (não crítico):', err);
            });
          }
        }
      } catch (err) {
        console.error('❌ Erro inesperado ao verificar sessão:', err);
        if (mounted) {
          // Não tratar como erro fatal
          console.log('ℹ️ Continuando após erro inesperado');
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          console.log('✅ Autenticação inicializada');
        }
        
        // Limpar timeout se ainda existir
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    initializeAuth();

    // Configurar listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'sem usuário');
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Se já estava inicializado, não precisa mais de loading
        if (initialized) {
          setLoading(false);
        }
        
        // Criar ou atualizar perfil do usuário quando necessário (em background)
        if (event === 'SIGNED_IN' && session?.user) {
          ensureUserProfile(session.user).catch(err => {
            console.warn('⚠️ Erro ao criar perfil (não crítico):', err);
          });
        }
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [initialized]);

  // Função para garantir que o perfil do usuário existe (não bloqueia)
  const ensureUserProfile = async (user) => {
    try {
      console.log('👤 Verificando perfil do usuário:', user.email);
      
      // Verificar se perfil já existe (com timeout)
      const profilePromise = supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Timeout de 5 segundos para operações de perfil
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na verificação de perfil')), 5000);
      });
      
      const { data: existingProfile, error: fetchError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('⚠️ Erro ao buscar perfil (não crítico):', fetchError);
        return;
      }

      // Se perfil não existe, criar um novo (em background)
      if (!existingProfile) {
        console.log('➕ Criando perfil para usuário:', user.email);
        
        const profileData = {
          id: user.id,
          nome: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.email?.split('@')[0] || 
                'Usuário',
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Criar perfil sem aguardar
        supabase
          .from('perfil_usuario')
          .insert([profileData])
          .then(({ error: insertError }) => {
            if (insertError) {
              console.warn('⚠️ Erro ao criar perfil (não crítico):', insertError);
            } else {
              console.log('✅ Perfil criado com sucesso para:', user.email);
              
              // Criar categorias padrão (em background)
              createDefaultCategories(user.id).catch(err => {
                console.warn('⚠️ Erro ao criar categorias padrão (não crítico):', err);
              });
            }
          });
      } else {
        console.log('✅ Perfil já existe para:', user.email);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao garantir perfil do usuário (não crítico):', err);
    }
  };

  // Função para criar categorias padrão (não bloqueia)
  const createDefaultCategories = async (userId) => {
    try {
      console.log('📊 Criando categorias padrão para usuário:', userId);
      
      const defaultCategories = [
        // Categorias de Receita
        { nome: 'Salário', tipo: 'receita', cor: '#10B981', icone: 'briefcase', ordem: 1 },
        { nome: 'Freelance', tipo: 'receita', cor: '#3B82F6', icone: 'laptop', ordem: 2 },
        { nome: 'Investimentos', tipo: 'receita', cor: '#8B5CF6', icone: 'trending-up', ordem: 3 },
        { nome: 'Outros', tipo: 'receita', cor: '#6B7280', icone: 'plus', ordem: 4 },
        
        // Categorias de Despesa
        { nome: 'Alimentação', tipo: 'despesa', cor: '#EF4444', icone: 'utensils', ordem: 1 },
        { nome: 'Transporte', tipo: 'despesa', cor: '#F59E0B', icone: 'car', ordem: 2 },
        { nome: 'Moradia', tipo: 'despesa', cor: '#06B6D4', icone: 'home', ordem: 3 },
        { nome: 'Saúde', tipo: 'despesa', cor: '#EC4899', icone: 'heart', ordem: 4 },
        { nome: 'Educação', tipo: 'despesa', cor: '#8B5CF6', icone: 'graduation-cap', ordem: 5 },
        { nome: 'Lazer', tipo: 'despesa', cor: '#F97316', icone: 'gamepad-2', ordem: 6 },
        { nome: 'Compras', tipo: 'despesa', cor: '#84CC16', icone: 'shopping-bag', ordem: 7 },
        { nome: 'Contas', tipo: 'despesa', cor: '#64748B', icone: 'receipt', ordem: 8 }
      ];

      const categoriasComUsuario = defaultCategories.map(cat => ({
        ...cat,
        usuario_id: userId,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('categorias')
        .insert(categoriasComUsuario);

      if (error) {
        console.warn('⚠️ Erro ao criar categorias padrão (não crítico):', error);
      } else {
        console.log('✅ Categorias padrão criadas com sucesso');
      }
    } catch (err) {
      console.warn('⚠️ Erro ao criar categorias padrão (não crítico):', err);
    }
  };

  // Função de login tradicional
  const signIn = async ({ email, password }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      console.error('❌ Erro no login:', err);
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função de registro
  const signUp = async ({ email, password, nome }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: nome.trim(),
            nome: nome.trim()
          }
        }
      });

      if (error) {
        throw error;
      }

      // Se o usuário foi criado mas precisa confirmar email
      if (data.user && !data.session) {
        return {
          success: true,
          user: data.user,
          needsConfirmation: true,
          message: 'Verifique seu email para confirmar a conta'
        };
      }

      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      console.error('❌ Erro no registro:', err);
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Erro no logout:', err);
      const errorMessage = 'Erro ao fazer logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função para recuperação de senha
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Erro na recuperação de senha:', err);
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar senha
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Erro ao atualizar senha:', err);
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar perfil
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Atualizar dados de autenticação se necessário
      const authUpdates = {};
      if (userData.email && userData.email !== user?.email) {
        authUpdates.email = userData.email;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      // Atualizar perfil na tabela personalizada
      const { data, error } = await supabase
        .from('perfil_usuario')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, profile: data };
    } catch (err) {
      console.error('❌ Erro ao atualizar perfil:', err);
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login com Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Erro no login com Google:', err);
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login com GitHub
  const signInWithGitHub = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Erro no login com GitHub:', err);
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para tratar mensagens de erro
  const getAuthErrorMessage = (error) => {
    switch (error.message || error.code) {
      case 'Invalid login credentials':
        return 'Email ou senha incorretos';
      case 'Email not confirmed':
        return 'Confirme seu email antes de fazer login';
      case 'User already registered':
        return 'Este email já está cadastrado';
      case 'Weak password':
        return 'A senha deve ter pelo menos 6 caracteres';
      case 'Invalid email':
        return 'Email inválido';
      case 'Signup disabled':
        return 'Cadastro desabilitado temporariamente';
      case 'Email rate limit exceeded':
        return 'Muitas tentativas. Tente novamente mais tarde';
      default:
        return error.message || 'Erro desconhecido';
    }
  };

  // Debug em desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.authDebug = {
        user: user ? { id: user.id, email: user.email } : null,
        loading,
        error,
        isAuthenticated: !!user,
        initialized,
        session: !!session
      };
      console.log('🔧 Auth Debug atualizado:', {
        hasUser: !!user,
        loading,
        initialized,
        isAuthenticated: !!user
      });
    }
  }, [user, loading, error, initialized, session]);

  // Valores expostos pelo contexto
  const value = {
    user,
    session,
    loading,
    error,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    signInWithGoogle,
    signInWithGitHub,
    isAuthenticated: !!user,
    setError
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