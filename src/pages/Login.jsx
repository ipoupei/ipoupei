import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/Login.css';
import logo from '../assets/logo.png'; // Importe o logo do seu app (crie ou use um placeholder)

/**
 * Página de Login, Registro e Recuperação de Senha
 * Interface unificada para autenticação de usuários
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

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {logo && <img src={logo} alt="iPoupei Logo" className="login-logo" />}
          <h1>iPoupei</h1>
          <p className="login-subtitle">Controle financeiro simplificado</p>
        </div>
        
        {/* Mensagens de erro e sucesso */}
        {error && <div className="login-error-message">{error}</div>}
        {success && <div className="login-success-message">{success}</div>}
        
        {/* Formulário de login/registro/recuperação */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Campos comuns a todos os modos */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
              disabled={loading}
            />
          </div>
          
          {/* Senha (apenas para login e registro) */}
          {mode !== 'recovery' && (
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                disabled={loading}
              />
            </div>
          )}
          
          {/* Campos adicionais para registro */}
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirme a senha</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="nome">Nome completo</label>
                <input
                  type="text"
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}
          
          {/* Botão de submissão (adaptado ao modo) */}
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? 'Processando...' : (
              mode === 'login' ? 'Entrar' : 
              mode === 'register' ? 'Criar conta' : 
              'Recuperar senha'
            )}
          </button>
        </form>
        
        {/* Links para alternar entre modos */}
        <div className="login-mode-links">
          {mode === 'login' && (
            <>
              <p>
                Não tem uma conta?{' '}
                <button 
                  type="button" 
                  className="text-button"
                  onClick={() => setMode('register')}
                  disabled={loading}
                >
                  Registre-se
                </button>
              </p>
              <p>
                <button 
                  type="button" 
                  className="text-button"
                  onClick={() => setMode('recovery')}
                  disabled={loading}
                >
                  Esqueceu a senha?
                </button>
              </p>
            </>
          )}
          
          {mode === 'register' && (
            <p>
              Já tem uma conta?{' '}
              <button 
                type="button" 
                className="text-button"
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
                className="text-button"
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