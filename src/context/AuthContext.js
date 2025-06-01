// src/context/AuthContext.js - Versão Otimizada para OAuth
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticação...');
        
        const isCallbackPage = window.location.pathname.includes('/auth/callback');
        
        if (isCallbackPage) {
          console.log('📍 Detectada página de callback, aguardando processamento...');
          timeoutId = setTimeout(() => {
            if (mounted && !initialized) {
              console.warn('⚠️ Timeout na página de callback');
              setUser(null);
              setSession(null);
              setLoading(false);
              setInitialized(true);
            }
          }, 20000);
        } else {
          timeoutId = setTimeout(() => {
            if (mounted && !initialized) {
              console.warn('⚠️ Timeout na inicialização da auth');
              setUser(null);
              setSession(null);
              setLoading(false);
              setInitialized(true);
            }
          }, 10000);
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          if (!isCallbackPage) {
            console.log('ℹ️ Continuando sem usuário autenticado');
          }
        }
        
        if (mounted) {
          console.log('📋 Sessão obtida:', session ? `Usuário: ${session.user?.email}` : 'Nenhuma sessão');
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            ensureUserProfile(session.user).catch(err => {
              console.warn('⚠️ Erro ao verificar perfil (não crítico):', err);
            });
          }
        }
      } catch (err) {
        console.error('❌ Erro inesperado ao verificar sessão:', err);
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          console.log('✅ Autenticação inicializada');
        }
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'sem usuário');
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event)) {
          setLoading(false);
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          ensureUserProfile(session.user).catch(err => {
            console.warn('⚠️ Erro ao criar perfil (não crítico):', err);
          });
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setError(null);
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  const ensureUserProfile = async (user) => {
    try {
      console.log('👤 Verificando perfil do usuário:', user.email);
      
      const { data: existingProfile, error: fetchError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('⚠️ Erro ao buscar perfil (não crítico):', fetchError);
        return;
      }

      if (!existingProfile) {
        console.log('➕ Criando perfil para usuário:', user.email);
        
        const profileData = {
          id: user.id,
          nome: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.email?.split('@')[0] || 
                'Usuário',
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('perfil_usuario')
          .insert([profileData]);

        if (insertError) {
          console.warn('⚠️ Erro ao criar perfil (não crítico):', insertError);
        } else {
          console.log('✅ Perfil criado com sucesso para:', user.email);
          createDefaultCategories(user.id).catch(err => {
            console.warn('⚠️ Erro ao criar categorias padrão (não crítico):', err);
          });
        }
      } else {
        console.log('✅ Perfil já existe para:', user.email);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao garantir perfil do usuário (não crítico):', err);
    }
  };

  const createDefaultCategories = async (userId) => {
    try {
      console.log('📊 Criando categorias padrão para usuário:', userId);
      
      const defaultCategories = [
        { nome: 'Salário', tipo: 'receita', cor: '#10B981', icone: 'briefcase', ordem: 1 },
        { nome: 'Freelance', tipo: 'receita', cor: '#3B82F6', icone: 'laptop', ordem: 2 },
        { nome: 'Investimentos', tipo: 'receita', cor: '#8B5CF6', icone: 'trending-up', ordem: 3 },
        { nome: 'Outros', tipo: 'receita', cor: '#6B7280', icone: 'plus', ordem: 4 },
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

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const authUpdates = {};
      if (userData.email && userData.email !== user?.email) {
        authUpdates.email = userData.email;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

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

  // ⚡ VERSÃO OTIMIZADA DO LOGIN COM GOOGLE
  const signInWithGoogle = async () => {
    try {
      console.log('🔄 Iniciando login com Google...');
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ⚡ REDIRECT IMEDIATO após autenticação
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Permite trocar de conta mais facilmente
            include_granted_scopes: 'true'
          },
          // ⚡ ACELERA o processo
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('❌ Erro no signInWithOAuth:', error);
        throw error;
      }

      console.log('✅ Redirecionamento para Google iniciado');
      return { success: true };
      
    } catch (err) {
      console.error('❌ Erro no login com Google:', err);
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGitHub = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
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
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const getAuthErrorMessage = (error) => {
    const message = error.message || error.code || '';
    
    switch (message) {
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
      case 'OAuth error':
      case 'Provider authentication failed':
        return 'Erro na autenticação com Google. Tente novamente.';
      case 'Provider not enabled':
        return 'Login com Google não configurado. Contate o suporte.';
      case 'Authorization code exchange failed':
        return 'Falha na autenticação com Google. Tente novamente.';
      default:
        if (message.includes('oauth') || message.includes('provider')) {
          return 'Erro na autenticação com Google. Tente novamente.';
        }
        return message || 'Erro desconhecido';
    }
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      window.authDebug = {
        user: user ? { 
          id: user.id, 
          email: user.email,
          metadata: user.user_metadata 
        } : null,
        loading,
        error,
        isAuthenticated: !!user,
        initialized,
        session: session ? {
          access_token: session.access_token ? 'presente' : 'ausente',
          refresh_token: session.refresh_token ? 'presente' : 'ausente'
        } : null
      };
      
      console.log('🔧 Auth Debug atualizado:', {
        hasUser: !!user,
        userEmail: user?.email,
        loading,
        initialized,
        isAuthenticated: !!user,
        currentPath: window.location.pathname
      });
    }
  }, [user, loading, error, initialized, session]);

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

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export default AuthContext;