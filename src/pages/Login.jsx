import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';
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
  Github
} from 'lucide-react';

/**
 * Página de Login com SSO (Google, GitHub) e autenticação tradicional
 * Integrada com Supabase
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
    signInWithGitHub,
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

  // Função para preencher credenciais de teste rapidamente
  const fillTestCredentials = () => {
    setEmail('teste@exemplo.com');
    setPassword('senha123');
  };

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

  // Handler para login com GitHub
  const handleGitHubLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithGitHub();
      if (!result.success) {
        throw new Error(result.error || 'Falha no login com GitHub');
      }
      // O redirecionamento é feito automaticamente pelo Supabase
    } catch (err) {
      console.error('Erro no login com GitHub:', err);
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>iPoupei</h1>
          <p className="login-subtitle">Controle financeiro simplificado</p>
        </div>
        
        {/* Botão de teste para desenvolvimento */}
        {import.meta.env.DEV && (
          <div className="development-notice">
            <p>🚀 Modo Desenvolvimento</p>
            <button
              type="button"
              onClick={fillTestCredentials}
              className="test-credentials-btn"
            >
              Preencher Credenciais de Teste
            </button>
          </div>
        )}
        
        {/* Título dinâmico baseado no modo */}
        <h2 className="login-mode-title">
          {mode === 'login' ? 'Entre na sua conta' : 
           mode === 'register' ? 'Crie sua conta' : 
           'Recupere sua senha'}
        </h2>
        
        {/* Mensagens de erro e sucesso */}
        {error && (
          <div className="login-error-message">
            <AlertCircle size={16} className="alert-icon" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="login-success-message">
            <CheckCircle size={16} className="success-icon" />
            <span>{success}</span>
          </div>
        )}

        {/* Botões de SSO - apenas para login */}
        {mode === 'login' && (
          <div className="sso-section">
            <div className="sso-buttons">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="sso-button google-button"
              >
                <Chrome size={18} />
                <span>Continuar com Google</span>
              </button>
              
              <button
                type="button"
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="sso-button github-button"
              >
                <Github size={18} />
                <span>Continuar com GitHub</span>
              </button>
            </div>
            
            <div className="divider">
              <span>ou</span>
            </div>
          </div>
        )}
        
        {/* Formulário de login/registro/recuperação */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Campo de Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-container">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                disabled={isLoading}
                className="input-with-icon"
              />
            </div>
          </div>
          
          {/* Senha (apenas para login e registro) */}
          {mode !== 'recovery' && (
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="input-container">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  disabled={isLoading}
                  className="input-with-icon"
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={toggleShowPassword}
                  tabIndex="-1"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
          
          {/* Campos adicionais para registro */}
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirme a senha</label>
                <div className="input-container">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua senha"
                    required
                    disabled={isLoading}
                    className="input-with-icon"
                  />
                  <button 
                    type="button"
                    className="password-toggle"
                    onClick={toggleShowConfirmPassword}
                    tabIndex="-1"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="nome">Nome completo</label>
                <div className="input-container">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    disabled={isLoading}
                    className="input-with-icon"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Opção "Lembrar de mim" para login */}
          {mode === 'login' && (
            <div className="form-footer">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="checkbox-label">
                  Lembrar de mim
                </label>
              </div>
              
              <button 
                type="button" 
                className="text-button"
                onClick={() => setMode('recovery')}
                disabled={isLoading}
              >
                Esqueceu a senha?
              </button>
            </div>
          )}
          
          {/* Botão de submissão (adaptado ao modo) */}
          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Processando...' : (
              <>
                {mode === 'login' && <><LogIn size={18} /> Entrar</>}
                {mode === 'register' && <><User size={18} /> Criar conta</>}
                {mode === 'recovery' && <><ArrowRight size={18} /> Recuperar senha</>}
              </>
            )}
          </button>
        </form>
        
        {/* Links para alternar entre modos */}
        <div className="login-mode-links">
          {mode === 'login' && (
            <p>
              Não tem uma conta?{' '}
              <button 
                type="button" 
                className="text-button text-button-highlight"
                onClick={() => setMode('register')}
                disabled={isLoading}
              >
                Registre-se
              </button>
            </p>
          )}
          
          {mode === 'register' && (
            <p>
              Já tem uma conta?{' '}
              <button 
                type="button" 
                className="text-button text-button-highlight"
                onClick={() => setMode('login')}
                disabled={isLoading}
              >
                Fazer login
              </button>
            </p>
          )}
          
          {mode === 'recovery' && (
            <p>
              <button 
                type="button" 
                className="text-button text-button-highlight"
                onClick={() => setMode('login')}
                disabled={isLoading}
              >
                Voltar para login
              </button>
            </p>
          )}
        </div>
        
        {/* Informações de desenvolvimento */}
        {import.meta.env.DEV && (
          <div className="development-info">
            <strong>Credenciais de Teste:</strong><br/>
            📧 teste@exemplo.com | 🔑 senha123<br/>
            📧 admin@ipoupei.com | 🔑 123456<br/>
            📧 usuario@teste.com | 🔑 teste123
          </div>
        )}
      </div>
      
      <footer className="login-footer">
        <p>&copy; {new Date().getFullYear()} iPoupei - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default Login;