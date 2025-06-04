//\src\modules\auth\store\authStore.js
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from "@lib/supabaseClient";

/**
 * Store de autenticação com Zustand
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      session: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: false,

      // Ações de autenticação
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },

      setSession: (session) => {
        set({ 
          session,
          user: session?.user || null,
          isAuthenticated: !!session?.user
        });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      setInitialized: (initialized) => {
        set({ initialized });
      },

      clearError: () => {
        set({ error: null });
      },

      // Login tradicional
      signIn: async ({ email, password }) => {
        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (error) throw error;

          set({ 
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            loading: false 
          });

          return { success: true, user: data.user, session: data.session };
        } catch (err) {
          console.error('❌ Erro no login:', err);
          const errorMessage = get().getAuthErrorMessage(err);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Registro
      signUp: async ({ email, password, nome }) => {
        try {
          set({ loading: true, error: null });

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

          if (error) throw error;

          // Se o usuário foi criado mas precisa confirmar email
          if (data.user && !data.session) {
            set({ loading: false });
            return {
              success: true,
              user: data.user,
              needsConfirmation: true,
              message: 'Verifique seu email para confirmar a conta'
            };
          }

          set({ 
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            loading: false 
          });

          return { success: true, user: data.user, session: data.session };
        } catch (err) {
          console.error('❌ Erro no registro:', err);
          const errorMessage = get().getAuthErrorMessage(err);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Logout
      signOut: async () => {
        try {
          set({ loading: true });
          
          const { error } = await supabase.auth.signOut();
          
          if (error) throw error;

          set({ 
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
            error: null
          });

          return { success: true };
        } catch (err) {
          console.error('❌ Erro no logout:', err);
          set({ error: 'Erro ao fazer logout', loading: false });
          return { success: false, error: 'Erro ao fazer logout' };
        }
      },

      // Recuperação de senha
      resetPassword: async (email) => {
        try {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password`
          });

          if (error) throw error;

          set({ loading: false });
          return { success: true };
        } catch (err) {
          console.error('❌ Erro na recuperação de senha:', err);
          const errorMessage = get().getAuthErrorMessage(err);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Atualizar senha
      updatePassword: async (newPassword) => {
        try {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.updateUser({
            password: newPassword
          });

          if (error) throw error;

          set({ loading: false });
          return { success: true };
        } catch (err) {
          console.error('❌ Erro ao atualizar senha:', err);
          const errorMessage = get().getAuthErrorMessage(err);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Atualizar perfil
      updateProfile: async (userData) => {
        try {
          set({ loading: true, error: null });

          const currentUser = get().user;
          if (!currentUser) throw new Error('Usuário não encontrado');

          // Atualizar dados de autenticação se necessário
          const authUpdates = {};
          if (userData.email && userData.email !== currentUser.email) {
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
            .eq('id', currentUser.id)
            .select()
            .single();

          if (error) throw error;

          // Atualizar o estado local
          set({ 
            user: { ...currentUser, ...userData },
            loading: false 
          });

          return { success: true, profile: data };
        } catch (err) {
          console.error('❌ Erro ao atualizar perfil:', err);
          const errorMessage = get().getAuthErrorMessage(err);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Login com Google
      signInWithGoogle: async () => {
        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/dashboard`
            }
          });

          if (error) throw error;

          return { success: true };
        } catch (err) {
          console.error('❌ Erro no login com Google:', err);
          const errorMessage = get().getAuthErrorMessage(err);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Login com GitHub
      signInWithGitHub: async () => {
        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: `${window.location.origin}/dashboard`
            }
          });

          if (error) throw error;

          return { success: true };
        } catch (err) {
          console.error('❌ Erro no login com GitHub:', err);
          const errorMessage = get().getAuthErrorMessage(err);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Inicializar autenticação
      initAuth: async () => {
        try {
          console.log('🔐 Inicializando autenticação...');
          set({ loading: true });

          // Timeout de segurança
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout na inicialização')), 10000);
          });

          // Obter sessão atual
          const sessionPromise = supabase.auth.getSession();

          const { data: { session }, error } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]);

          if (error) {
            console.warn('⚠️ Erro ao obter sessão (não crítico):', error);
          }

          console.log('📋 Sessão obtida:', session ? `Usuário: ${session.user?.email}` : 'Nenhuma sessão');

          set({
            session,
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            loading: false,
            initialized: true
          });

          // Se há usuário, garantir perfil existe (em background)
          if (session?.user) {
            get().ensureUserProfile(session.user).catch(err => {
              console.warn('⚠️ Erro ao verificar perfil (não crítico):', err);
            });
          }

          console.log('✅ Autenticação inicializada');
        } catch (err) {
          console.error('❌ Erro inesperado ao inicializar auth:', err);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
            initialized: true
          });
        }
      },

      // Garantir que o perfil do usuário existe
      ensureUserProfile: async (user) => {
        try {
          console.log('👤 Verificando perfil do usuário:', user.email);

          // Verificar se perfil já existe
          const { data: existingProfile, error: fetchError } = await supabase
            .from('perfil_usuario')
            .select('*')
            .eq('id', user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.warn('⚠️ Erro ao buscar perfil (não crítico):', fetchError);
            return;
          }

          // Se perfil não existe, criar um novo
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

            const { error: insertError } = await supabase
              .from('perfil_usuario')
              .insert([profileData]);

            if (insertError) {
              console.warn('⚠️ Erro ao criar perfil (não crítico):', insertError);
            } else {
              console.log('✅ Perfil criado com sucesso para:', user.email);
              
              // Criar categorias padrão (em background)
              get().createDefaultCategories(user.id).catch(err => {
                console.warn('⚠️ Erro ao criar categorias padrão (não crítico):', err);
              });
            }
          } else {
            console.log('✅ Perfil já existe para:', user.email);
          }
        } catch (err) {
          console.warn('⚠️ Erro ao garantir perfil do usuário (não crítico):', err);
        }
      },

      // Criar categorias padrão
      createDefaultCategories: async (userId) => {
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
      },

      // Função auxiliar para tratar mensagens de erro
      getAuthErrorMessage: (error) => {
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
      },

      // Selectors (computed values)
      getUserName: () => {
        const { user } = get();
        return user?.user_metadata?.full_name || 
               user?.user_metadata?.name || 
               user?.email?.split('@')[0] || 
               'Usuário';
      },

      getUserEmail: () => {
        const { user } = get();
        return user?.email || '';
      },

      isAdmin: () => {
        const { user } = get();
        return user?.user_metadata?.role === 'admin' || false;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Hook separado que usa React.useEffect
export const useAuthListener = () => {
  const { setSession, initAuth } = useAuthStore();

  useEffect(() => {
    // Inicializar auth
    initAuth();

    // Configurar listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'sem usuário');
      setSession(session);

      // Criar ou atualizar perfil quando necessário (em background)
      if (event === 'SIGNED_IN' && session?.user) {
        useAuthStore.getState().ensureUserProfile(session.user).catch(err => {
          console.warn('⚠️ Erro ao criar perfil (não crítico):', err);
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, initAuth]);
};

export default useAuthStore;