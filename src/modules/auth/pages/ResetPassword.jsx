import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from "@modules/auth/hooks/useAuth";
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import logo from '../../../assets/logo.png';

// Styles
import '@shared/styles/PrincipalArquivoDeClasses.css';


/**
 * Página para redefinição de senha
 * Acessada após clicar no link enviado por email
 * Migrado para usar classes ip_ do sistema principal
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
      <div className="login-page">
        <div className="login-background">
          <div className="bg-pattern"></div>
          <div className="bg-gradient"></div>
        </div>
        
        <div className="ip_flex ip_flex_centro" style={{ minHeight: '100vh', padding: '1rem' }}>
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
                  src={logo} 
                  alt="iPoupei" 
                  style={{ 
                    width: '140px', 
                    height: 'auto', 
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </div>
              <h1 style={{ 
                fontSize: '1.375rem', 
                fontWeight: 700, 
                color: '#1f2937', 
                margin: '0 0 0.5rem 0' 
              }}>
                iPoupei
              </h1>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.875rem', 
                lineHeight: '1.4', 
                margin: 0, 
                fontWeight: 500 
              }}>
                Redefinição de senha
              </p>
            </div>
            
            <div className="ip_mensagem_feedback erro ip_mb_4">
              <AlertCircle size={18} />
              <span>
                Link de redefinição de senha inválido ou expirado. 
                Por favor, solicite um novo link de redefinição.
              </span>
            </div>
            
            <button 
              className="ip_w_100"
              style={{
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
                boxShadow: '0 8px 24px rgba(0, 128, 128, 0.25)'
              }}
              onClick={() => navigate('/login')}
              onMouseOver={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #006666, #008080)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(0, 128, 128, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #008080, #00a0a0)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(0, 128, 128, 0.25)';
              }}
            >
              <ArrowLeft size={18} />
              Voltar para login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-pattern"></div>
        <div className="bg-gradient"></div>
      </div>
      
      <div className="ip_flex ip_flex_centro" style={{ minHeight: '100vh', padding: '1rem' }}>
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
                src={logo} 
                alt="iPoupei" 
                style={{ 
                  width: '140px', 
                  height: 'auto', 
                  objectFit: 'contain',
                  transition: 'transform 0.3s ease'
                }}
              />
            </div>
            <h1 style={{ 
              fontSize: '1.375rem', 
              fontWeight: 700, 
              color: '#1f2937', 
              margin: '0 0 0.5rem 0' 
            }}>
              iPoupei
            </h1>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.875rem', 
              lineHeight: '1.4', 
              margin: 0, 
              fontWeight: 500 
            }}>
              Redefinição de senha
            </p>
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
          
          {!success && (
            <form onSubmit={handleSubmit} className="ip_flex ip_flex_coluna ip_gap_4">
              <div className="ip_grupo_formulario">
                <label htmlFor="password" className="ip_label">
                  Nova senha
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    color: '#6b7280', 
                    zIndex: 1 
                  }} />
                  <input
                    type="password"
                    id="password"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    required
                    disabled={loading}
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
              
              <div className="ip_grupo_formulario">
                <label htmlFor="confirmPassword" className="ip_label">
                  Confirme a nova senha
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    color: '#6b7280', 
                    zIndex: 1 
                  }} />
                  <input
                    type="password"
                    id="confirmPassword"
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    required
                    disabled={loading}
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
              
              <button 
                type="submit" 
                className={`ip_w_100 ${loading ? 'ip_loading' : ''}`}
                disabled={loading}
                style={{ 
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  background: loading ? 'linear-gradient(135deg, #d1d5db, #9ca3af)' : 'linear-gradient(135deg, #008080, #00a0a0)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.875rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(0, 128, 128, 0.25)'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.background = 'linear-gradient(135deg, #006666, #008080)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 32px rgba(0, 128, 128, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.background = 'linear-gradient(135deg, #008080, #00a0a0)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 24px rgba(0, 128, 128, 0.25)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div className="ip_loading_spinner_pequeno"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Redefinir senha
                  </>
                )}
              </button>
            </form>
          )}
          
          <div className="ip_texto_centro ip_mt_4 ip_pt_4" style={{ 
            borderTop: '1px solid #f3f4f6' 
          }}>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.8125rem', 
              margin: 0 
            }}>
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
                onClick={() => navigate('/login')}
                disabled={loading}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.color = '#006666';
                    e.target.style.textDecoration = 'underline';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.color = '#008080';
                    e.target.style.textDecoration = 'none';
                  }
                }}
              >
                Voltar para login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;