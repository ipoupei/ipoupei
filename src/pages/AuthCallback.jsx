// src/pages/AuthCallback.jsx - Página para callback do Google Auth
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

/**
 * Página de Callback para autenticação OAuth (Google)
 * Processa o retorno do Google e redireciona apropriadamente
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processando autenticação...');
  
  const { setSession, user, isAuthenticated } = useAuthStore();
  const { showNotification } = useUIStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processando callback do Google Auth...');
        
        // Verificar se já está autenticado
        if (isAuthenticated && user) {
          console.log('✅ Usuário já autenticado:', user.email);
          setStatus('success');
          setMessage('Login realizado com sucesso!');
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          return;
        }

        // Verificar se há hash de acesso ou código na URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
        const error = hashParams.get('error') || urlParams.get('error');
        const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');

        console.log('📋 Parâmetros da URL:', {
          accessToken: accessToken ? 'Presente' : 'Ausente',
          refreshToken: refreshToken ? 'Presente' : 'Ausente',
          error,
          errorDescription
        });

        if (error) {
          console.error('❌ Erro na autenticação OAuth:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Erro na autenticação com Google');
          
          showNotification('Erro na autenticação com Google', 'error');
          
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        if (accessToken) {
          console.log('✅ Token de acesso encontrado, processando...');
          
          // Construir objeto de sessão
          const session = {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: null // Será preenchido pelo Supabase
          };

          // Tentar obter dados do usuário
          try {
            const { data: { user: userData }, error: userError } = await supabase.auth.getUser(accessToken);
            
            if (userError) throw userError;
            
            session.user = userData;
            setSession(session);
            
            console.log('✅ Usuário autenticado via Google:', userData.email);
            
            setStatus('success');
            setMessage(`Bem-vindo, ${userData.email}!`);
            
            showNotification('Login com Google realizado com sucesso!', 'success');
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            
          } catch (userError) {
            console.error('❌ Erro ao obter dados do usuário:', userError);
            throw userError;
          }
        } else {
          // Sem token - tentar método alternativo
          console.log('⚠️ Sem token na URL, tentando método alternativo...');
          
          // Aguardar um pouco para o Supabase processar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar se a sessão foi estabelecida automaticamente
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (session && session.user) {
            console.log('✅ Sessão encontrada automaticamente:', session.user.email);
            
            setSession(session);
            setStatus('success');
            setMessage(`Bem-vindo, ${session.user.email}!`);
            
            showNotification('Login com Google realizado com sucesso!', 'success');
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            throw new Error('Nenhuma sessão ou token encontrado');
          }
        }

      } catch (error) {
        console.error('❌ Erro no callback de autenticação:', error);
        
        setStatus('error');
        setMessage('Erro ao processar autenticação. Tente novamente.');
        
        showNotification('Erro na autenticação com Google', 'error');
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, setSession, user, isAuthenticated, showNotification]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="animate-spin h-8 w-8 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-600" />;
      default:
        return <Loader2 className="animate-spin h-8 w-8 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600 mb-4">
            <span className="text-white font-bold text-xl">iP</span>
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            iPoupei
          </h2>
          
          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          {/* Status Message */}
          <h3 className={`text-xl font-semibold ${getStatusColor()} mb-4`}>
            {status === 'processing' && 'Autenticando...'}
            {status === 'success' && 'Sucesso!'}
            {status === 'error' && 'Erro na Autenticação'}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {/* Progress Bar */}
          {status === 'processing' && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'error' && (
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar ao Login
              </button>
            )}
            
            {status === 'success' && (
              <div className="text-sm text-gray-500">
                Redirecionando para o dashboard...
              </div>
            )}
          </div>
          
          {/* Debug Info (apenas em desenvolvimento) */}
          {status === 'error' && window.location.hostname === 'localhost' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>URL: {window.location.href}</div>
                <div>Hash: {window.location.hash}</div>
                <div>Search: {window.location.search}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;