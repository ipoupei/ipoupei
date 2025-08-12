import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import useAuth from '@modules/auth/hooks/useAuth';
import logoImage from '@assets/logo.png';
// Styles
import '@shared/styles/PrincipalArquivoDeClasses.css';

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
  Chrome
} from 'lucide-react';

/**
 * Página de Login com SSO (Google) e autenticação tradicional
 * Design moderno integrado com a identidade visual do iPoupei
 * Migrado para usar classes ip_ do sistema principal
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
  const location = useLocation();
  const { 
    signIn, 
    signUp, 
    resetPassword,
    signInWithGoogle,
    isAuthenticated, 
    loading: authLoading,
    error: authError,
    setError: setAuthError,
    initialized
  } = useAuth();

  // Redireciona se já estiver autenticado - APENAS após inicializar
  useEffect(() => {
    if (initialized && isAuthenticated) {
      console.log('✅ Usuário já autenticado, redirecionando...');
      const redirectTo = searchParams.get('redirectTo') || 
                       location.state?.redirectTo || 
                       '/app/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [initialized, isAuthenticated, navigate, searchParams, location.state]);

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

  // Verifica se há parâmetros de erro OAuth na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const oauthError = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    
    if (oauthError) {
      console.error('❌ Erro OAuth detectado:', oauthError, errorDescription);
      setError(getOAuthErrorMessage(oauthError, errorDescription));
      
      // Limpar a URL dos parâmetros de erro
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Função para tratar erros OAuth
  const getOAuthErrorMessage = (error, description) => {
    switch (error) {
      case 'access_denied':
        return 'Acesso negado. Você cancelou a autenticação com Google.';
      case 'invalid_request':
        return 'Solicitação inválida. Tente fazer login novamente.';
      case 'server_error':
        return 'Erro no servidor. Tente novamente em alguns minutos.';
      default:
        return description || 'Erro na autenticação com Google. Tente novamente.';
    }
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
        console.log('🔄 Tentando login tradicional:', { email });
        
        const result = await signIn({ email, password });
        console.log('📋 Resultado do login:', result);
        
        if (!result.success) {
          throw new Error(result.error || 'Falha ao fazer login.');
        }
        
        // O redirecionamento será feito pelo useEffect quando isAuthenticated mudar
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
          // O redirecionamento será feito pelo useEffect
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
      console.error('❌ Erro de autenticação:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler para login com Google
  const handleGoogleLogin = async () => {
    if (loading || authLoading) {
      console.log('⏳ Login já em andamento, ignorando...');
      return;
    }

    setLoading(true);
    setError('');
    console.log('🔄 Iniciando login com Google...');
    
    try {
      const result = await signInWithGoogle();
      console.log('📋 Resultado do Google login:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Falha no login com Google');
      }
      
      // O signInWithGoogle já faz o redirecionamento automático
      // Não precisamos fazer nada aqui, o OAuth vai redirecionar para /auth/callback
      console.log('✅ Redirecionamento para Google iniciado');
      
    } catch (err) {
      console.error('❌ Erro no login com Google:', err);
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

  // Se ainda não inicializou, mostrar loading
  if (!initialized) {
    return (
      <div className="login-page">
        <div className="login-background">
          <div className="bg-pattern"></div>
          <div className="bg-gradient"></div>
        </div>
        <div className="ip_flex ip_flex_centro" style={{ minHeight: '100vh', padding: '1rem' }}>
          <div className="ip_card_grande" style={{ 
            width: '100%', 
            maxWidth: '420px', 
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 64px rgba(0, 128, 128, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(0, 128, 128, 0.1)'
          }}>
            <div className="ip_loading_container">
              <img src={logoImage} alt="iPoupei" style={{ width: '140px', marginBottom: '1rem' }} />
              <div className="ip_loading_spinner"></div>
              <p className="ip_loading_texto">Inicializando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Background com gradiente iPoupei */}
      <div className="login-background">
        <div className="bg-pattern"></div>
        <div className="bg-gradient"></div>
      </div>

      {/* Container principal */}
      <div className="ip_flex ip_flex_centro" style={{ minHeight: '100vh', padding: '1rem' }}>
        {/* Cartão de login */}
        <div className="ip_card_grande ip_animacao_slide_up" style={{ 
          width: '100%', 
          maxWidth: '420px', 
          margin: 0,
          background: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1.5rem',
          boxShadow: '0 32px 64px rgba(0, 128, 128, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(0, 128, 128, 0.1)',
          position: 'relative'
        }}>
          {/* Header com logo iPoupei */}
          <div className="ip_texto_centro ip_mb_4">
            <div className="ip_flex ip_flex_centro ip_mb_3">
              <img 
                src={logoImage} 
                alt="iPoupei" 
                style={{ 
                  width: '140px', 
                  height: 'auto', 
                  objectFit: 'contain',
                  transition: 'transform 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              />
            </div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.875rem', 
              lineHeight: '1.4', 
              margin: 0, 
              fontWeight: 500 
            }}>
              {mode === 'login' && 'Bem-vindo de volta ao seu controle financeiro'}
              {mode === 'register' && 'Junte-se a milhares de usuários que já controlam suas finanças'}
              {mode === 'recovery' && 'Vamos recuperar o acesso à sua conta'}
            </p>
          </div>

          {/* Título do modo atual */}
          <div className="ip_texto_centro ip_mb_4">
            <h2 style={{ 
              fontSize: '1.375rem', 
              fontWeight: 700, 
              color: '#1f2937', 
              margin: 0 
            }}>
              {mode === 'login' && 'Entre na sua conta'}
              {mode === 'register' && 'Crie sua conta gratuita'}
              {mode === 'recovery' && 'Recuperar senha'}
            </h2>
          </div>

          {/* Mensagens de feedback */}
          {error && (
            <div className="ip_mensagem_feedback erro ip_animacao_slide_up">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="ip_mensagem_feedback sucesso ip_animacao_slide_up">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Botão de SSO - apenas Google e apenas para login */}
          {mode === 'login' && (
            <div className="ip_mb_4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="ip_w_100 ip_mb_3"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.target.style.borderColor = '#008080';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 24px rgba(0, 128, 128, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                <Chrome size={20} />
                <span>
                  {isLoading ? 'Redirecionando...' : 'Continuar com Google'}
                </span>
              </button>
              
              <div className="ip_divisor">
                <div style={{
                  position: 'relative',
                  textAlign: 'center',
                  margin: '1rem 0'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)'
                  }}></div>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.97)',
                    backdropFilter: 'blur(10px)',
                    padding: '0 1rem',
                    color: '#6b7280',
                    fontSize: '0.8125rem',
                    fontWeight: 500
                  }}>
                    ou continue com email
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Formulário principal */}
          <form onSubmit={handleSubmit} className="ip_flex ip_flex_coluna ip_gap_4" noValidate>
            {/* Campo Nome - primeiro no registro para melhor UX */}
            {mode === 'register' && (
              <div className="ip_grupo_formulario">
                <label htmlFor="nome" className="ip_label">
                  Nome completo
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    color: '#6b7280', 
                    zIndex: 1 
                  }} />
                  <input
                    type="text"
                    id="nome"
                    className="ip_input_base"
                    style={{ 
                      paddingLeft: '2.75rem',
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 2.75rem',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      background: 'rgba(248, 250, 252, 0.5)',
                      transition: 'all 0.3s ease',
                      color: '#1f2937',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Como devemos te chamar?"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="name"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#008080';
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 128, 128, 0.1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = 'rgba(248, 250, 252, 0.5)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Campo Email */}
            <div className="ip_grupo_formulario">
              <label htmlFor="email" className="ip_label">
                Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  color: '#6b7280', 
                  zIndex: 1 
                }} />
                <input
                  type="email"
                  id="email"
                  className="ip_input_base"
                  style={{ 
                    paddingLeft: '2.75rem',
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 2.75rem',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    background: 'rgba(248, 250, 252, 0.5)',
                    transition: 'all 0.3s ease',
                    color: '#1f2937',
                    fontFamily: 'inherit'
                  }}
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#008080';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 128, 128, 0.1)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = 'rgba(248, 250, 252, 0.5)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                />
              </div>
            </div>

            {/* Campo Senha */}
            {mode !== 'recovery' && (
              <div className="ip_grupo_formulario">
                <label htmlFor="password" className="ip_label">
                  Senha
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    color: '#6b7280', 
                    zIndex: 1 
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="ip_input_base"
                    style={{ 
                      paddingLeft: '2.75rem', 
                      paddingRight: '2.75rem',
                      width: '100%',
                      padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      background: 'rgba(248, 250, 252, 0.5)',
                      transition: 'all 0.3s ease',
                      color: '#1f2937',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#008080';
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 128, 128, 0.1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = 'rgba(248, 250, 252, 0.5)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '0.375rem',
                      transition: 'all 0.2s ease',
                      zIndex: 2
                    }}
                    onClick={toggleShowPassword}
                    disabled={isLoading}
                    tabIndex={-1}
                    onMouseOver={(e) => {
                      e.target.style.color = '#008080';
                      e.target.style.background = 'rgba(0, 128, 128, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = '#6b7280';
                      e.target.style.background = 'none';
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Campo Confirmar Senha - apenas para registro */}
            {mode === 'register' && (
              <div className="ip_grupo_formulario">
                <label htmlFor="confirmPassword" className="ip_label">
                  Confirmar senha
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    color: '#6b7280', 
                    zIndex: 1 
                  }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="ip_input_base"
                    style={{ 
                      paddingLeft: '2.75rem', 
                      paddingRight: '2.75rem',
                      width: '100%',
                      padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      background: 'rgba(248, 250, 252, 0.5)',
                      transition: 'all 0.3s ease',
                      color: '#1f2937',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#008080';
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 128, 128, 0.1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = 'rgba(248, 250, 252, 0.5)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '0.375rem',
                      transition: 'all 0.2s ease',
                      zIndex: 2
                    }}
                    onClick={toggleShowConfirmPassword}
                    disabled={isLoading}
                    tabIndex={-1}
                    onMouseOver={(e) => {
                      e.target.style.color = '#008080';
                      e.target.style.background = 'rgba(0, 128, 128, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = '#6b7280';
                      e.target.style.background = 'none';
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Opções do formulário para login */}
            {mode === 'login' && (
              <div className="ip_flex" style={{ 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '-0.5rem'
              }}>
                <label className="ip_flex" style={{ 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      accentColor: '#008080'
                    }}
                  />
                  <span style={{ 
                    fontSize: '0.8125rem', 
                    color: '#4b5563', 
                    cursor: 'pointer' 
                  }}>
                    Lembrar de mim
                  </span>
                </label>
                
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#008080',
                    fontSize: 'inherit',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onClick={() => setMode('recovery')}
                  disabled={isLoading}
                  onMouseOver={(e) => {
                    e.target.style.color = '#006666';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#008080';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Botão de submit */}
            <button
              type="submit"
              className={`ip_w_100 ${isLoading ? 'ip_loading' : ''}`}
              disabled={isLoading}
              style={{ 
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.625rem',
                background: 'linear-gradient(135deg, #008080, #00a0a0)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.875rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 128, 128, 0.25)'
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.target.style.background = 'linear-gradient(135deg, #006666, #008080)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 32px rgba(0, 128, 128, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.target.style.background = 'linear-gradient(135deg, #008080, #00a0a0)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 24px rgba(0, 128, 128, 0.25)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <div className="ip_loading_spinner_pequeno"></div>
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
          <div className="ip_texto_centro ip_mt_4 ip_pt_4" style={{ 
            borderTop: '1px solid #f3f4f6' 
          }}>
            {mode === 'login' && (
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.8125rem', 
                margin: 0 
              }}>
                Ainda não tem uma conta?{' '}
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#008080',
                    fontSize: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onClick={() => setMode('register')}
                  disabled={isLoading}
                  onMouseOver={(e) => {
                    e.target.style.color = '#006666';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#008080';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  Registre-se gratuitamente
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.8125rem', 
                margin: 0 
              }}>
                Já possui uma conta?{' '}
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#008080',
                    fontSize: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onClick={() => setMode('login')}
                  disabled={isLoading}
                  onMouseOver={(e) => {
                    e.target.style.color = '#006666';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#008080';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  Fazer login
                </button>
              </p>
            )}

            {mode === 'recovery' && (
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.8125rem', 
                margin: 0 
              }}>
                Lembrou da senha?{' '}
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#008080',
                    fontSize: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onClick={() => setMode('login')}
                  disabled={isLoading}
                  onMouseOver={(e) => {
                    e.target.style.color = '#006666';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#008080';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  Voltar ao login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer compacto */}
        <footer style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '0.8125rem'
        }}>
          <p style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} iPoupei. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;