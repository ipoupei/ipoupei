// src/utils/supabaseDebug.js - VERIFICADOR DE CONFIGURAÇÃO
import { supabase } from '../lib/supabaseClient';

/**
 * Utilitário para diagnosticar problemas de configuração do Supabase
 * Use no console do navegador para verificar se tudo está configurado corretamente
 */
export const debugSupabase = async () => {
  console.log('🔍 === DIAGNÓSTICO SUPABASE ===');
  
  // 1. Verificar variáveis de ambiente
  console.log('\n📋 1. VARIÁVEIS DE AMBIENTE:');
  console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
  console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
  
  if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
    console.log('\n❌ PROBLEMA ENCONTRADO:');
    console.log('As variáveis de ambiente do Supabase não estão configuradas.');
    console.log('Crie um arquivo .env na raiz do projeto com:');
    console.log('REACT_APP_SUPABASE_URL=sua_url_aqui');
    console.log('REACT_APP_SUPABASE_ANON_KEY=sua_chave_aqui');
    return;
  }
  
  // 2. Verificar conexão
  console.log('\n🌐 2. TESTANDO CONEXÃO:');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
    } else {
      console.log('✅ Conexão estabelecida com sucesso');
      console.log('Sessão atual:', data.session ? 'Usuário logado' : 'Nenhum usuário');
    }
  } catch (err) {
    console.log('❌ Erro inesperado na conexão:', err.message);
  }
  
  // 3. Verificar tabelas
  console.log('\n📊 3. TESTANDO ACESSO ÀS TABELAS:');
  const tabelas = ['perfil_usuario', 'categorias', 'contas', 'transacoes', 'cartoes'];
  
  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${tabela}:`, error.message);
      } else {
        console.log(`✅ ${tabela}: Acesso OK`);
      }
    } catch (err) {
      console.log(`❌ ${tabela}: Erro inesperado -`, err.message);
    }
  }
  
  // 4. Verificar políticas de segurança (RLS)
  console.log('\n🔐 4. VERIFICANDO POLÍTICAS DE SEGURANÇA:');
  try {
    // Tentar criar um usuário de teste
    const { data, error } = await supabase.auth.signUp({
      email: 'teste-debug@exemplo.com',
      password: '123456',
    });
    
    if (error) {
      if (error.message.includes('User already registered')) {
        console.log('✅ Registro funcionando (usuário já existe)');
      } else {
        console.log('❌ Erro no registro:', error.message);
      }
    } else {
      console.log('✅ Registro funcionando');
    }
  } catch (err) {
    console.log('❌ Erro inesperado no teste de registro:', err.message);
  }
  
  // 5. Verificar configurações de autenticação
  console.log('\n🔑 5. CONFIGURAÇÕES DE AUTENTICAÇÃO:');
  console.log('Para verificar no Supabase Dashboard:');
  console.log('- Authentication > Settings');
  console.log('- Verificar se "Enable email confirmations" está configurado conforme necessário');
  console.log('- Verificar Site URL e Redirect URLs');
  
  console.log('\n🎯 RESUMO:');
  console.log('Se todos os itens acima estão ✅, o problema pode ser:');
  console.log('1. Cache do navegador - tente limpar');
  console.log('2. Configuração incorreta no Supabase Dashboard');
  console.log('3. Problema de rede/firewall');
  console.log('4. Políticas RLS muito restritivas');
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Verificar o console do navegador durante o login');
  console.log('2. Verificar a aba Network para ver as requisições');
  console.log('3. Testar com um email/senha conhecidos');
  console.log('4. Verificar se o email foi confirmado (se necessário)');
};

/**
 * Teste rápido de login
 */
export const testLogin = async (email = 'teste@exemplo.com', password = '123456') => {
  console.log('🧪 Testando login com:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log('❌ Erro no login:', error.message);
      
      // Diagnóstico específico por tipo de erro
      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 Possível solução: Verificar se o usuário existe e a senha está correta');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('💡 Possível solução: Confirmar email ou desabilitar confirmação no Supabase');
      }
    } else {
      console.log('✅ Login bem-sucedido!');
      console.log('Usuário:', data.user.email);
      console.log('Sessão criada:', !!data.session);
    }
  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
  }
};

/**
 * Verificar status atual da autenticação
 */
export const checkAuthStatus = async () => {
  console.log('👤 Status atual da autenticação:');
  
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Erro ao obter usuário:', error.message);
    } else if (data.user) {
      console.log('✅ Usuário logado:', data.user.email);
      console.log('ID:', data.user.id);
      console.log('Email confirmado:', data.user.email_confirmed_at ? 'Sim' : 'Não');
      console.log('Último login:', data.user.last_sign_in_at);
    } else {
      console.log('ℹ️ Nenhum usuário logado');
    }
  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
  }
};

/**
 * Forçar logout e limpar dados
 */
export const forceLogout = async () => {
  console.log('🚪 Forçando logout...');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.log('❌ Erro no logout:', error.message);
    } else {
      console.log('✅ Logout realizado com sucesso');
      
      // Limpar localStorage
      localStorage.clear();
      console.log('🧹 LocalStorage limpo');
      
      // Recarregar página
      window.location.reload();
    }
  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
  }
};

// Expor funções globalmente para uso no console
if (typeof window !== 'undefined') {
  window.debugSupabase = debugSupabase;
  window.testLogin = testLogin;
  window.checkAuthStatus = checkAuthStatus;
  window.forceLogout = forceLogout;
  
  console.log('🔧 Funções de debug disponíveis:');
  console.log('- debugSupabase() - Diagnóstico completo');
  console.log('- testLogin(email, password) - Testar login');
  console.log('- checkAuthStatus() - Verificar status atual');
  console.log('- forceLogout() - Forçar logout');
}

export default {
  debugSupabase,
  testLogin,
  checkAuthStatus,
  forceLogout
};