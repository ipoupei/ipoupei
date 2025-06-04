import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from "@modules/auth/hooks/useAuth";
import './Login.css';
import logo from '../../../assets/logo.png';

/**
 * Página para redefinição de senha
 * Acessada após clicar no link enviado por email
 */
const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const { updatePassword, isAuthenticated } = useAuth();

  // Verifica se o usuário já está autenticado
  useEffect(() => {
    if (success) {
      // Redireciona após 3 segundos depois de redefinir a senha
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  // Validação de senhas
  const validatePasswords = () => {
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }
    
    return true;
  };

  // Handler para o formulário de redefinição de senha
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    
    if (!validatePasswords()) return;
    
    setLoading(true);
    
    try {
      const { success, error } = await updatePassword(password);
      
      if (!success) {
        throw new Error(error || 'Falha ao redefinir a senha.');
      }
      
      setSuccess('Senha redefinida com sucesso! Você será redirecionado em instantes...');
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Se não estiver autenticado (sem token de reset válido)
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            {logo && <img src={logo} alt="iPoupei Logo" className="login-logo" />}
            <h1>iPoupei</h1>
            <p className="login-subtitle">Redefinição de senha</p>
          </div>
          
          <div className="login-error-message">
            Link de redefinição de senha inválido ou expirado. 
            Por favor, solicite um novo link de redefinição.
          </div>
          
          <button 
            className="login-button" 
            onClick={() => navigate('/login')}
          >
            Voltar para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {logo && <img src={logo} alt="iPoupei Logo" className="login-logo" />}
          <h1>iPoupei</h1>
          <p className="login-subtitle">Redefinição de senha</p>
        </div>
        
        {error && <div className="login-error-message">{error}</div>}
        {success && <div className="login-success-message">{success}</div>}
        
        {!success && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="password">Nova senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirme a nova senha</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                required
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Redefinir senha'}
            </button>
          </form>
        )}
        
        <div className="login-mode-links">
          <p>
            <button 
              type="button" 
              className="text-button"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Voltar para login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;