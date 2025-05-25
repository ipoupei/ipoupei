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
    // Detecta automaticamente sessão na URL (importante para OAuth)
    detectSessionInUrl: true,
    // URL de callback para desenvolvimento
    redirectTo: import.meta.env.DEV ? 'http://localhost:5173' : undefined,
    // Configurações de storage
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Debug apenas em desenvolvimento
    debug: import.meta.env.DEV
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
      .limit(5); // Limita para não sobrecarregar
      
    if (error) {
      console.error('Erro ao buscar contas:', error);
      return { success: false, error };
    }
    
    console.log('Contas encontradas:', data);
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
    
    console.log('Usuário autenticado:', isAuthenticated);
    if (isAuthenticated) {
      console.log('User ID:', session.user.id);
      console.log('Email:', session.user.email);
      console.log('Provider:', session.user.app_metadata.provider);
    }
    
    return { success: true, isAuthenticated, session };
  } catch (err) {
    console.error('Erro inesperado ao verificar autenticação:', err);
    return { success: false, error: err };
  }
}

/**
 * Função para debug de usuários cadastrados
 * Lista usuários na tabela perfil_usuario (apenas desenvolvimento)
 */
export async function listarUsuarios() {
  if (!import.meta.env.DEV) return;
  
  try {
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('id, nome, email, created_at')
      .limit(10);
      
    if (error) {
      console.error('Erro ao listar usuários:', error);
      return;
    }
    
    console.log('Usuários cadastrados:', data);
    return data;
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
  }
}

/**
 * Função para testar criação de usuário
 * Apenas para debug em desenvolvimento
 */
export async function testarCriacaoUsuario(email, senha, nome) {
  if (!import.meta.env.DEV) {
    console.warn('Função de teste disponível apenas em desenvolvimento');
    return;
  }
  
  try {
    console.log('Testando criação de usuário:', { email, nome });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          full_name: nome,
          nome: nome
        }
      }
    });
    
    if (error) {
      console.error('Erro na criação:', error);
      return { success: false, error };
    }
    
    console.log('Resultado da criação:', data);
    
    // Verifica se o perfil foi criado
    if (data.user) {
      const { data: perfil, error: perfilError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      console.log('Perfil criado:', perfil);
      if (perfilError) {
        console.error('Erro ao buscar perfil:', perfilError);
      }
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Erro no teste de criação:', err);
    return { success: false, error: err };
  }
}

// Listener para debug de mudanças de autenticação (apenas desenvolvimento)
if (import.meta.env.DEV) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth State Changed:', event);
    if (session) {
      console.log('👤 User:', session.user.email);
      console.log('🔑 Provider:', session.user.app_metadata.provider);
    } else {
      console.log('👤 User: null');
    }
  });
  
  // Expõe funções globalmente para teste no console
  window.supabaseTest = {
    supabase,
    testarCriacaoUsuario,
    verificarAutenticacao,
    listarUsuarios
  };
  
  // Força exposição imediata
  console.log('🔧 supabaseTest configurado:', !!window.supabaseTest);
}

export default supabase;