import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// REMOVIDO: import { useAuth } from '../context/AuthContext';
// ADICIONADO: Usar Zustand
import { useAuthStore } from '../store/authStore';
import { useNotification } from '../store/uiStore';

// Utilitários mantidos
import { validateEmail, validateRequired } from '../utils/validateForm';

/**
 * Página de Login - Atualizada para usar Zustand
 * Muito mais simples e limpa
 */
const Login = () => {
  const navigate = useNavigate();
  
  // ANTES: const { signIn, signInWithGoogle, loading, error, isAuthenticated } = useAuth();
  // DEPOIS: Usar stores do Zustand
  const { 
    signIn, 
    signInWithGoogle, 
    signUp,
    loading, 
    error, 
    isAuthenticated,
    clearError 
  } = useAuthStore();
  
  const notify = useNotification();

  // Estados locais do formulário
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '', // Para registro
    confirmPassword: '' // Para registro
  });
  const [formErrors, setFormErrors] = useState({});

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ Usuário já autenticado, redirecionando...');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Limpar erro quando componente monta
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Manipular mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro específico do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar formulário
  const validateForm = () => {
    const errors = {};

    // Email
    const emailError = validateRequired(formData.email) || validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    // Senha
    const passwordError = validateRequired(formData.password);
    if (passwordError) errors.password = passwordError;

    // Campos específicos do registro
    if (isRegistering) {
      // Nome
      const nomeError = validateRequired(formData.nome);
      if (nomeError) errors.nome = nomeError;

      // Confirmar senha
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'As senhas não conferem';
      }

      // Validar força da senha
      if (formData.password.length < 6) {
        errors.password = 'A senha deve ter pelo menos 6 caracteres';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manipular login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        notify.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        notify.error(result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      notify.error('Erro inesperado ao fazer login');
    }
  };

  // Manipular registro
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        nome: formData.nome
      });

      if (result.success) {
        if (result.needsConfirmation) {
          notify.info('Verifique seu email para confirmar a conta');
          setIsRegistering(false); // Volta para tela de login
        } else {
          notify.success('Conta criada com sucesso!');
          navigate('/dashboard');
        }
      } else {
        notify.error(result.error || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      notify.error('Erro inesperado ao criar conta');
    }
  };

  // Manipular login com Google
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        notify.success('Redirecionando para autenticação...');
        // O redirecionamento será automático
      } else {
        notify.error(result.error || 'Erro ao fazer login com Google');
      }
    } catch (error) {
      console.error('Erro no login com Google:', error);
      notify.error('Erro inesperado ao fazer login com Google');
    }
  };

  // Toggle entre login e registro
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setFormData({
      email: '',
      password: '',
      nome: '',
      confirmPassword: ''
    });
    setFormErrors({});
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Criar conta' : 'Fazer login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegistering ? 'Ou' : 'Ou'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              {isRegistering ? 'faça login se já tem conta' : 'crie uma conta nova'}
            </button>
          </p>
        </div>

        {/* Formulário */}
        <form 
          className="mt-8 space-y-6" 
          onSubmit={isRegistering ? handleRegister : handleLogin}
        >
          <div className="space-y-4">
            {/* Nome (apenas no registro) */}
            {isRegistering && (
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`mt-1 relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    formErrors.nome ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Seu nome completo"
                />
                {formErrors.nome && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nome}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="seu@email.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Sua senha"
              />
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Confirmar senha (apenas no registro) */}
            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`mt-1 relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    formErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Confirme sua senha"
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            )}
          </div>

          {/* Exibir erro geral */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botão de submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isRegistering ? 'Criando conta...' : 'Entrando...'}
                </div>
              ) : (
                isRegistering ? 'Criar conta' : 'Entrar'
              )}
            </button>
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continue com</span>
            </div>
          </div>

          {/* Login com Google */}
          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          {/* Link para recuperar senha (apenas no login) */}
          {!isRegistering && (
            <div className="text-center">
              <Link 
                to="/reset-password" 
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;