import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  ArrowRight,
  CheckCircle,
  Chrome,
  Wallet
} from 'lucide-react';

/**
 * Página de Login com SSO (Google) e autenticação tradicional
 * Design moderno e compacto integrado com Supabase
 */
const Login = () => {
  // Estados para controlar as operações de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'register', 'recovery'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Hooks para navegação e autenticação
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    signIn, 
    signUp, 
    resetPassword,
    signInWithGoogle,
    isAuthenticated, 
    loading: authLoading,
    error: authError,
    setError: setAuthError
  } = useAuth();

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirectTo') || '/dashboard';
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Gerencia erros do contexto de autenticação
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Limpa mensagens ao mudar de modo
  useEffect(() => {
    setError('');
    setSuccess('');
    if (setAuthError) {
      setAuthError(null);
    }
  }, [mode, setAuthError]);

  // Reset dos campos ao trocar de modo
  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    setNome('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode]);

  // Validação de campos
  const validateFields = () => {
    // Validação básica de email
    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, insira um email válido.');
      return false;
    }

    // Validação de senha
    if (mode !== 'recovery' && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    // Validação de confirmação de senha (apenas para registro)
    if (mode === 'register' && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }

    // Validação de nome (apenas para registro)
    if (mode === 'register' && !nome.trim()) {
      setError('Por favor, insira seu nome.');
      return false;
    }

    return true;
  };

  // Handler para submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Limpa mensagens anteriores
    setError('');
    setSuccess('');
    
    // Valida campos
    if (!validateFields()) return;
    
    setLoading(true);
    
    try {
      // Login
      if (mode === 'login') {
        console.log('Tentando login com Supabase:', { email });
        
        const result = await signIn({ email, password });
        console.log('Resultado do login:', result);
        
        if (!result.success) {
          throw new Error(result.error || 'Falha ao fazer login.');
        }
        
        // Navegação é feita pelo useEffect ao atualizar isAuthenticated
      }
      // Registro
      else if (mode === 'register') {
        const result = await signUp({ email, password, nome });
        
        if (!result.success) {
          throw new Error(result.error || 'Falha ao criar conta.');
        }
        
        if (result.needsConfirmation) {
          setSuccess(
            'Conta criada com sucesso! Verifique seu email para confirmar sua conta antes de fazer login.'
          );
          setMode('login');
        } else {
          setSuccess('Conta criada e login realizado com sucesso!');
          // Navegação é feita pelo useEffect
        }
      }
      // Recuperação de senha
      else if (mode === 'recovery') {
        const result = await resetPassword(email);
        
        if (!result.success) {
          throw new Error(result.error || 'Falha ao enviar email de recuperação.');
        }
        
        setSuccess('Email de recuperação enviado. Verifique sua caixa de entrada.');
      }
    } catch (err) {
      console.error('Erro de autenticação:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler para login com Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        throw new Error(result.error || 'Falha no login com Google');
      }
      // O redirecionamento é feito automaticamente pelo Supabase
    } catch (err) {
      console.error('Erro no login com Google:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Toggle para mostrar/ocultar senha
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Toggle para mostrar/ocultar confirmação de senha
  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Estados de carregamento
  const isLoading = loading || authLoading;

  return (
    <div className="login-page">
      {/* Background com gradiente e padrão */}
      <div className="login-background">
        <div className="bg-pattern"></div>
        <div className="bg-gradient"></div>
      </div>

      {/* Container principal */}
      <div className="login-container">
        {/* Cartão de login */}
        <div className="login-card">
          {/* Header com logo */}
          <div className="login-header">
            <div className="logo-container">
              <div className="logo-icon">
                <Wallet size={28} className="logo-svg" />
              </div>
              <h1 className="logo-text">iPoupei</h1>
            </div>
            <p className="login-subtitle">
              {mode === 'login' && 'Bem-vindo de volta ao seu controle financeiro'}
              {mode === 'register' && 'Junte-se a milhares de usuários que já controlam suas finanças'}
              {mode === 'recovery' && 'Vamos recuperar o acesso à sua conta'}
            </p>
          </div>

          {/* Título do modo atual */}
          <div className="mode-header">
            <h2 className="mode-title">
              {mode === 'login' && 'Entre na sua conta'}
              {mode === 'register' && 'Crie sua conta gratuita'}
              {mode === 'recovery' && 'Recuperar senha'}
            </h2>
          </div>

          {/* Mensagens de feedback */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Botão de SSO - apenas Google e apenas para login */}
          {mode === 'login' && (
            <div className="sso-section">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="sso-btn sso-btn-google"
              >
                <Chrome size={20} />
                <span>Continuar com Google</span>
              </button>
              
              <div className="divider">
                <span>ou continue com email</span>
              </div>
            </div>
          )}

          {/* Formulário principal */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Campo Nome - primeiro no registro para melhor UX */}
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="nome" className="form-label">
                  Nome completo
                </label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="nome"
                    className="form-input"
                    placeholder="Como devemos te chamar?"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Campo Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo Senha */}
            {mode !== 'recovery' && (
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Senha
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-input"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={toggleShowPassword}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Campo Confirmar Senha - apenas para registro */}
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmar senha
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="form-input"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={toggleShowConfirmPassword}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Opções do formulário para login */}
            {mode === 'login' && (
              <div className="form-options">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="checkbox-label">Lembrar de mim</span>
                </label>
                
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setMode('recovery')}
                  disabled={isLoading}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Botão de submit */}
            <button
              type="submit"
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  {mode === 'login' && <><LogIn size={18} />Entrar</>}
                  {mode === 'register' && <><User size={18} />Criar conta</>}
                  {mode === 'recovery' && <><ArrowRight size={18} />Enviar link</>}
                </>
              )}
            </button>
          </form>

          {/* Links para alternar modos */}
          <div className="mode-switcher">
            {mode === 'login' && (
              <p>
                Ainda não tem uma conta?{' '}
                <button
                  type="button"
                  className="link-btn primary"
                  onClick={() => setMode('register')}
                  disabled={isLoading}
                >
                  Registre-se gratuitamente
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p>
                Já possui uma conta?{' '}
                <button
                  type="button"
                  className="link-btn primary"
                  onClick={() => setMode('login')}
                  disabled={isLoading}
                >
                  Fazer login
                </button>
              </p>
            )}

            {mode === 'recovery' && (
              <p>
                Lembrou da senha?{' '}
                <button
                  type="button"
                  className="link-btn primary"
                  onClick={() => setMode('login')}
                  disabled={isLoading}
                >
                  Voltar ao login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer compacto */}
        <footer className="login-footer">
          <p>&copy; {new Date().getFullYear()} iPoupei. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;