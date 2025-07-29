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

   // ✅ LIMPAR authStore
   set({ 
     user: null,
     session: null,
     isAuthenticated: false,
     loading: false,
     error: null
   });

   // ✅ LIMPAR TODAS AS STORES - CAMINHOS CORRETOS
   try {
     console.log('🧹 Limpando TODAS as stores no logout...');
     
     // ✅ STORES CONFIRMADAS COM CAMINHOS EXATOS
     const storeImports = await Promise.allSettled([
       // Stores principais
       import('@/modules/transacoes/store/transactionsStore').then(m => m.useTransactionsStore),
       import('@/modules/dashboard/store/dashboardStore').then(m => m.useDashboardStore || m.default),
       import('@/modules/diagnostico/store/diagnosticoPercepcaoStore').then(m => m.default),
       import('@/modules/contas/store/contasStore').then(m => m.default),
       import('@/modules/cartoes/store/useCartoesStore').then(m => m.default),
       import('@/modules/diagnostico/store/diagnosticoEmocionalStore').then(m => m.default),
       import('@/modules/diagnostico/store/diagnosticoFlowStore').then(m => m.default),
       import('@/store/uiStore').then(m => m.useUIStore || m.default),
       import('@/modules/categorias/store/categoriasStore').then(m => m.default),
     ]);

     // ✅ Resetar cada store com proteção
     storeImports.forEach((result, index) => {
       if (result.status === 'fulfilled' && result.value?.getState) {
         try {
           const store = result.value.getState();
           if (typeof store.reset === 'function') {
             store.reset();
             console.log(`✅ Store ${index} resetada com sucesso`);
           } else {
             console.warn(`⚠️ Store ${index} não tem função reset`);
           }
         } catch (resetError) {
           console.warn(`⚠️ Erro ao resetar store ${index}:`, resetError.message);
         }
       } else if (result.status === 'rejected') {
         console.warn(`⚠️ Falha ao importar store ${index}:`, result.reason?.message);
       }
     });
     
     // ✅ Limpar localStorage relacionado ao usuário
     console.log('🗑️ Limpando localStorage...');
     const keysToRemove = [];
     
     for (let i = 0; i < localStorage.length; i++) {
       const key = localStorage.key(i);
       if (key && (
         key.includes('auth-storage') || 
         key.includes('diagnostico') || 
         key.includes('dashboard') ||
         key.includes('contas') ||
         key.includes('transacoes') ||
         key.includes('cartoes') ||
         key.includes('categorias') ||
         key.includes('user-') ||
         key.includes('ipoupei-')
       )) {
         keysToRemove.push(key);
       }
     }
     
     keysToRemove.forEach(key => {
       try {
         localStorage.removeItem(key);
         console.log(`🗑️ Removido: ${key}`);
       } catch (e) {
         console.warn(`⚠️ Erro ao remover ${key}:`, e.message);
       }
     });
     
     // ✅ Eventos globais para limpeza
     window.dispatchEvent(new CustomEvent('user-logout-complete'));
     window.dispatchEvent(new CustomEvent('clear-all-caches'));
     
     console.log(`✅ LOGOUT COMPLETO: ${storeImports.length} stores processadas, ${keysToRemove.length} chaves removidas`);
     
   } catch (globalError) {
     console.error('❌ Erro crítico durante logout:', globalError);
   }

   // ✅ FORÇA RELOAD IMEDIATO PARA GARANTIR LIMPEZA TOTAL
   console.log('🔄 Forçando reload da página para limpeza total...');
   window.location.href = '/login';

 } catch (err) {
   console.error('❌ Erro no logout:', err);
   set({ error: 'Erro ao fazer logout', loading: false });
   
   // ✅ FALLBACK: Reload mesmo em caso de erro
   console.log('🔄 Erro no logout - forçando reload por segurança...');
   window.location.href = '/login';
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
              //get().createDefaultCategories(user.id).catch(err => {
                //console.warn('⚠️ Erro ao criar categorias padrão (não crítico):', err);
             // });
            }
          } else {
            console.log('✅ Perfil já existe para:', user.email);
          }
        } catch (err) {
          console.warn('⚠️ Erro ao garantir perfil do usuário (não crítico):', err);
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
// SUBSTITUIR COMPLETAMENTE a função verificarERedirecionarDiagnostico

const verificarERedirecionarDiagnostico = async (userId) => {
  try {
    console.log('🔍 === INÍCIO VERIFICAÇÃO DIAGNÓSTICO ===');
    console.log('🔍 UserId:', userId);
    console.log('🔍 URL atual:', window.location.href);
    console.log('🔍 Pathname:', window.location.pathname);
    
    // ✅ PROTEÇÃO 1: Verificar se é refresh muito recente
    const lastLoginCheck = sessionStorage.getItem('last-login-check');
    const currentTime = Date.now();
    
    if (lastLoginCheck && (currentTime - parseInt(lastLoginCheck)) < 10000) {
      console.log('🔄 REFRESH/RELOAD DETECTADO - Pulando verificação (menos de 10s)');
      return;
    }
    
    // ✅ PROTEÇÃO 2: Não verificar em rotas especiais
    const currentPath = window.location.pathname;
    const rotasEspeciais = [
      '/diagnostico', 
      '/login', 
      '/auth/callback', 
      '/reset-password',
      '/susto-consciente'
    ];
    
    if (rotasEspeciais.some(rota => currentPath.startsWith(rota))) {
      console.log('📍 ROTA ESPECIAL DETECTADA - Pulando:', currentPath);
      return;
    }
    
    // ✅ PROTEÇÃO 3: Verificar se já está verificando
    const verificandoKey = `verificando-diagnostico-${userId}`;
    if (sessionStorage.getItem(verificandoKey)) {
      console.log('🔄 VERIFICAÇÃO JÁ EM ANDAMENTO - Pulando');
      return;
    }
    
    // ✅ PROTEÇÃO 4: Só verificar em rotas específicas (root ou dashboard)
    const rotasQueVerificam = ['/', '/dashboard'];
    if (!rotasQueVerificam.includes(currentPath)) {
      console.log('📍 ROTA NÃO REQUER VERIFICAÇÃO:', currentPath);
      return;
    }
    
    console.log('✅ TODAS AS PROTEÇÕES PASSARAM - Prosseguindo com verificação');
    sessionStorage.setItem(verificandoKey, 'true');
    sessionStorage.setItem('last-login-check', currentTime.toString());
    
    // Aguardar estabilidade
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Buscar etapa do diagnóstico
    console.log('🔍 Consultando banco de dados...');
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('diagnostico_etapa_atual')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ ERRO AO BUSCAR ETAPA:', error);
      sessionStorage.removeItem(verificandoKey);
      return;
    }

    const etapaAtual = data?.diagnostico_etapa_atual || 0;
    
    console.log('📋 === RESULTADO DA CONSULTA ===');
    console.log('📋 Etapa atual no banco:', etapaAtual);
    console.log('📋 Precisa completar diagnóstico:', etapaAtual < 9);
    
    if (etapaAtual < 9) {
      console.log('🔄 === EXECUTANDO REDIRECIONAMENTO ===');
      console.log('🔄 Salvando etapa no sessionStorage:', etapaAtual);
      
      // Salvar etapa para o DiagnosticoRouter
      sessionStorage.setItem('diagnostico-etapa-redirect', etapaAtual.toString());
      
      // Limpar flag
      sessionStorage.removeItem(verificandoKey);
      
      console.log('🔄 Redirecionando para diagnóstico...');
      window.location.replace('/diagnostico');
      
    } else {
      console.log('✅ DIAGNÓSTICO COMPLETO - Usuário pode continuar normalmente');
      sessionStorage.removeItem(verificandoKey);
    }
    
  } catch (error) {
    console.error('❌ ERRO INESPERADO NA VERIFICAÇÃO:', error);
    sessionStorage.removeItem(`verificando-diagnostico-${userId}`);
  }
};
// Hook separado que usa React.useEffect
// SUBSTITUIR COMPLETAMENTE o useAuthListener no authStore.js

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

      // ✅ LÓGICA CORRIGIDA: Tratar cada evento separadamente
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔑 EVENTO DE LOGIN DETECTADO');
        
        // Criar perfil se necessário
        useAuthStore.getState().ensureUserProfile(session.user).catch(err => {
          console.warn('⚠️ Erro ao criar perfil (não crítico):', err);
        });

        // ✅ VERIFICAR DIAGNÓSTICO APENAS EM LOGIN REAL
        console.log('🔍 Iniciando verificação de diagnóstico...');
        setTimeout(() => {
          verificarERedirecionarDiagnostico(session.user.id).catch(err => {
            console.warn('⚠️ Erro ao verificar diagnóstico (não crítico):', err);
          });
        }, 2000);
        
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 EVENTO DE LOGOUT');
        // Limpar cache de verificação
        sessionStorage.removeItem('last-login-check');
        console.log('🧹 Cache de login limpo');
        
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 TOKEN ATUALIZADO - NÃO VERIFICAR DIAGNÓSTICO');
        // Token refresh não deve verificar diagnóstico
        
      } else {
        console.log(`🔄 Evento ${event} - Sem ação especial`);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, initAuth]);
};

export default useAuthStore;