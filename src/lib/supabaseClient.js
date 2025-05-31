// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Erro: Variáveis de ambiente do Supabase não encontradas. Certifique-se de criar um arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );
}

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

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);

/**
 * Função para testar a conexão com o Supabase
 * Realiza uma consulta simples à tabela de contas
 */
export async function testarLeituraContas() {
  try {
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
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { success: false, error };
    }
    
    const { session } = data;
    const isAuthenticated = !!session;
    
    console.log('🔐 Status de autenticação:', isAuthenticated ? 'Autenticado' : 'Não autenticado');
    if (isAuthenticated) {
      console.log('👤 User ID:', session.user.id);
      console.log('📧 Email:', session.user.email);
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
  const baseUrl = window.location.origin;
  
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
  if (import.meta.env.DEV) {
    const config = getOAuthConfig();
    console.log('🔧 OAuth Debug Info:');
    console.log('Supabase URL:', supabaseUrl);
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

// Configurar debug automático em desenvolvimento
if (import.meta.env.DEV) {
  // Debug inicial
  debugOAuth();
  
  // Monitorar mudanças de URL
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      if (currentUrl.includes('/auth/callback')) {
        console.log('🔄 Detectada navegação para callback:', currentUrl);
        debugOAuth();
      }
    }
  }, 1000);
}

export default supabase;