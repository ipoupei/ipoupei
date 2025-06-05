// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação mais robusta das variáveis de ambiente
const hasValidConfig = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'your_supabase_url_here' && 
                      supabaseAnonKey !== 'your_supabase_anon_key_here' &&
                      supabaseUrl.startsWith('https://');

// Log de debug apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config Debug:');
  console.log('URL presente:', !!supabaseUrl);
  console.log('Key presente:', !!supabaseAnonKey);
  console.log('Config válida:', hasValidConfig);
}

// Cliente Supabase ou Mock para desenvolvimento
let supabase;

if (hasValidConfig) {
  // Configurações do cliente Supabase
  const supabaseConfig = {
    auth: {
      // Configurações específicas para OAuth
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // URL de callback para OAuth
      redirectTo: undefined, // Será definido dinamicamente nas funções de login
      // Configurações específicas para o fluxo OAuth
      flowType: 'pkce' // Usar PKCE para maior segurança
    },
    // Configurações globais
    global: {
      headers: {
        'X-Client-Info': 'iPoupei-Web-App'
      }
    }
  };

  // Cria o cliente Supabase
  supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);
} else {
  // Cliente Mock para desenvolvimento/fallback
  console.warn('⚠️ Supabase não configurado corretamente. Usando cliente mock.');
  
  // Mock que simula a API do Supabase
  const createMockResponse = (data = null, error = null) => 
    Promise.resolve({ data, error });

  const createMockQueryBuilder = () => ({
    select: () => createMockQueryBuilder(),
    insert: () => createMockQueryBuilder(),
    update: () => createMockQueryBuilder(),
    delete: () => createMockQueryBuilder(),
    eq: () => createMockQueryBuilder(),
    neq: () => createMockQueryBuilder(),
    gt: () => createMockQueryBuilder(),
    gte: () => createMockQueryBuilder(),
    lt: () => createMockQueryBuilder(),
    lte: () => createMockQueryBuilder(),
    like: () => createMockQueryBuilder(),
    ilike: () => createMockQueryBuilder(),
    is: () => createMockQueryBuilder(),
    in: () => createMockQueryBuilder(),
    contains: () => createMockQueryBuilder(),
    containedBy: () => createMockQueryBuilder(),
    rangeGt: () => createMockQueryBuilder(),
    rangeGte: () => createMockQueryBuilder(),
    rangeLt: () => createMockQueryBuilder(),
    rangeLte: () => createMockQueryBuilder(),
    rangeAdjacent: () => createMockQueryBuilder(),
    overlaps: () => createMockQueryBuilder(),
    textSearch: () => createMockQueryBuilder(),
    match: () => createMockQueryBuilder(),
    not: () => createMockQueryBuilder(),
    or: () => createMockQueryBuilder(),
    filter: () => createMockQueryBuilder(),
    order: () => createMockQueryBuilder(),
    limit: () => createMockQueryBuilder(),
    range: () => createMockQueryBuilder(),
    abortSignal: () => createMockQueryBuilder(),
    single: () => createMockResponse([]),
    maybeSingle: () => createMockResponse(null),
    then: (resolve) => resolve({ data: [], error: null }),
    catch: (reject) => reject(null)
  });

  supabase = {
    auth: {
      signUp: (credentials) => {
        console.log('Mock: signUp chamado', credentials);
        return createMockResponse({ user: null, session: null });
      },
      signInWithPassword: (credentials) => {
        console.log('Mock: signInWithPassword chamado', credentials);
        return createMockResponse({ user: null, session: null });
      },
      signInWithOAuth: (provider) => {
        console.log('Mock: signInWithOAuth chamado', provider);
        return createMockResponse({ user: null, session: null });
      },
      signOut: () => {
        console.log('Mock: signOut chamado');
        return createMockResponse();
      },
      getSession: () => {
        console.log('Mock: getSession chamado');
        return createMockResponse({ session: null });
      },
      getUser: () => {
        console.log('Mock: getUser chamado');
        return createMockResponse({ user: null });
      },
      onAuthStateChange: (callback) => {
        console.log('Mock: onAuthStateChange configurado');
        // Simular callback inicial
        setTimeout(() => callback('SIGNED_OUT', null), 100);
        return { 
          data: { 
            subscription: {
              unsubscribe: () => console.log('Mock: Auth listener removido')
            }
          } 
        };
      },
      resetPasswordForEmail: (email) => {
        console.log('Mock: resetPasswordForEmail chamado', email);
        return createMockResponse();
      }
    },
    from: (table) => {
      console.log(`Mock: Consultando tabela '${table}'`);
      return createMockQueryBuilder();
    },
    storage: {
      from: (bucket) => ({
        upload: (path, file) => {
          console.log(`Mock: Upload para bucket '${bucket}', path '${path}'`);
          return createMockResponse();
        },
        download: (path) => {
          console.log(`Mock: Download do bucket '${bucket}', path '${path}'`);
          return createMockResponse();
        },
        remove: (paths) => {
          console.log(`Mock: Remoção do bucket '${bucket}', paths:`, paths);
          return createMockResponse();
        },
        list: (path) => {
          console.log(`Mock: Listagem do bucket '${bucket}', path '${path}'`);
          return createMockResponse([]);
        },
        getPublicUrl: (path) => {
          console.log(`Mock: URL pública do bucket '${bucket}', path '${path}'`);
          return { data: { publicUrl: `mock://bucket/${bucket}/${path}` } };
        }
      })
    },
    rpc: (fn, params) => {
      console.log(`Mock: RPC '${fn}' chamado com params:`, params);
      return createMockResponse();
    }
  };
}

/**
 * Função para testar a conexão com o Supabase
 * Realiza uma consulta simples à tabela de contas
 */
export async function testarLeituraContas() {
  try {
    if (!hasValidConfig) {
      console.log('⚠️ Teste pulado - Supabase não configurado');
      return { success: true, data: [], mock: true };
    }

    const { data, error } = await supabase
      .from('contas')
      .select('*')
      .limit(1); // Limita para otimizar o teste
      
    if (error) {
      console.error('Erro ao buscar contas:', error);
      return { success: false, error };
    }
    
    console.log('✅ Teste de conexão com Supabase realizado com sucesso');
    return { success: true, data };
  } catch (err) {
    console.error('Erro inesperado ao testar conexão:', err);
    return { success: false, error: err };
  }
}

/**
 * Função para testar a autenticação atual
 * Verifica se há um usuário autenticado
 */
export async function verificarAutenticacao() {
  try {
    if (!hasValidConfig) {
      console.log('⚠️ Verificação de auth pulada - Supabase não configurado');
      return { success: true, isAuthenticated: false, session: null, mock: true };
    }

    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { success: false, error };
    }
    
    const { session } = data;
    const isAuthenticated = !!session;
    
    if (import.meta.env.DEV) {
      console.log('🔐 Status de autenticação:', isAuthenticated ? 'Autenticado' : 'Não autenticado');
      if (isAuthenticated) {
        console.log('👤 User ID:', session.user.id);
        console.log('📧 Email:', session.user.email);
      }
    }
    
    return { success: true, isAuthenticated, session };
  } catch (err) {
    console.error('Erro inesperado ao verificar autenticação:', err);
    return { success: false, error: err };
  }
}

/**
 * Função para configurar OAuth URLs
 * Útil para debugging e configuração
 */
export function getOAuthConfig() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  return {
    google: {
      redirectTo: `${baseUrl}/auth/callback`,
      provider: 'google'
    },
    github: {
      redirectTo: `${baseUrl}/auth/callback`,
      provider: 'github'
    }
  };
}

/**
 * Função para debug do OAuth
 * Exibe informações úteis sobre a configuração
 */
export function debugOAuth() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const config = getOAuthConfig();
    console.log('🔧 OAuth Debug Info:');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Config válida:', hasValidConfig);
    console.log('Redirect URLs:', config);
    console.log('Current URL:', window.location.href);
    
    // Verificar se estamos em uma página de callback
    if (window.location.pathname.includes('/auth/callback')) {
      console.log('📍 Estamos na página de callback');
      console.log('Hash:', window.location.hash);
      console.log('Search:', window.location.search);
    }
  }
}

// Status da configuração
export const supabaseStatus = {
  isConfigured: hasValidConfig,
  isMock: !hasValidConfig,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

// Configurar debug automático em desenvolvimento
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Debug inicial
  debugOAuth();
  
  // Monitorar mudanças de URL
  let currentUrl = window.location.href;
  const urlChecker = setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      if (currentUrl.includes('/auth/callback')) {
        console.log('🔄 Detectada navegação para callback:', currentUrl);
        debugOAuth();
      }
    }
  }, 1000);
  
  // Limpar interval após 10 segundos para não consumir recursos desnecessariamente
  setTimeout(() => clearInterval(urlChecker), 10000);
}

export { supabase };
export default supabase;