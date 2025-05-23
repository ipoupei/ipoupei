import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/Login.css';
import logo from '../assets/logo.png';
import { AlertCircle, Eye, EyeOff, Mail, Lock, User, LogIn, ArrowRight } from 'lucide-react';

/**
 * Página de Login, Registro e Recuperação de Senha
 * Interface unificada e aprimorada para autenticação de usuários
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
  const { signIn, signUp, isAuthenticated, resetPassword } = useAuth();

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Limpa mensagens ao mudar de modo
  useEffect(() => {
    setError('');
    setSuccess('');
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
        const { success, error } = await signIn({ email, password });
        
        if (!success) {
          throw new Error(error || 'Falha ao fazer login.');
        }
        
        // Navegação é feita pelo useEffect ao atualizar isAuthenticated
      }
      // Registro
      else if (mode === 'register') {
        const { success, error } = await signUp({ email, password, nome });
        
        if (!success) {
          throw new Error(error || 'Falha ao criar conta.');
        }
        
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
        setMode('login');
      }
      // Recuperação de senha
      else if (mode === 'recovery') {
        const { success, error } = await resetPassword(email);
        
        if (!success) {
          throw new Error(error || 'Falha ao enviar email de recuperação.');
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

  // Toggle para mostrar/ocultar senha
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Toggle para mostrar/ocultar confirmação de senha
  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {logo && <img src={logo} alt="iPoupei Logo" className="login-logo" />}
          <h1>iPoupei</h1>
          <p className="login-subtitle">Controle financeiro simplificado</p>
        </div>
        
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
            <span>{success}</span>
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
                disabled={loading}
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
                  disabled={loading}
                  className="input-with-icon"
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={toggleShowPassword}
                  tabIndex="-1"
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
                    disabled={loading}
                    className="input-with-icon"
                  />
                  <button 
                    type="button"
                    className="password-toggle"
                    onClick={toggleShowConfirmPassword}
                    tabIndex="-1"
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
                    disabled={loading}
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
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="checkbox-label">
                  Lembrar de mim
                </label>
              </div>
              
              <button 
                type="button" 
                className="text-button"
                onClick={() => setMode('recovery')}
                disabled={loading}
              >
                Esqueceu a senha?
              </button>
            </div>
          )}
          
          {/* Botão de submissão (adaptado ao modo) */}
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? 'Processando...' : (
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              >
                Voltar para login
              </button>
            </p>
          )}
        </div>
      </div>
      
      <footer className="login-footer">
        <p>&copy; {new Date().getFullYear()} iPoupei - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default Login;