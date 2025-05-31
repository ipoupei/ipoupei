// src/pages/AuthCallback.jsx - Versão Simplificada
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Página de Callback para autenticação OAuth (Google)
 * Versão simplificada que foca no essencial
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processando autenticação...');
  const [countdown, setCountdown] = useState(3);
  
  const { user, isAuthenticated, initialized } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 AuthCallback iniciado');
        console.log('📋 Estado atual:', { 
          isAuthenticated, 
          hasUser: !!user, 
          initialized,
          userEmail: user?.email 
        });

        // Verificar se há erro na URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (error) {
          console.error('❌ Erro OAuth na URL:', error, errorDescription);
          setStatus('error');
          setMessage(getErrorMessage(error, errorDescription));
          
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Se não há erro, aguardar autenticação
        console.log('⏳ Aguardando autenticação...');
        
        // Aguardar um tempo para o contexto processar
        let attempts = 0;
        const maxAttempts = 20; // 10 segundos (20 x 500ms)
        
        const checkAuth = () => {
          attempts++;
          
          console.log(`🔍 Tentativa ${attempts}/${maxAttempts}:`, { 
            isAuthenticated, 
            hasUser: !!user,
            initialized 
          });
          
          if (isAuthenticated && user) {
            console.log('✅ Usuário autenticado com sucesso:', user.email);
            setStatus('success');
            setMessage(`Bem-vindo, ${user.user_metadata?.full_name || user.email}!`);
            
            // Countdown para redirect
            let count = 3;
            setCountdown(count);
            
            const countdownInterval = setInterval(() => {
              count--;
              setCountdown(count);
              
              if (count <= 0) {
                clearInterval(countdownInterval);
                navigate('/dashboard');
              }
            }, 1000);
            
            return;
          }
          
          if (attempts >= maxAttempts) {
            console.warn('⚠️ Timeout na verificação de autenticação');
            setStatus('error');
            setMessage('Timeout na autenticação. Redirecionando para login...');
            
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          // Continuar tentando
          setTimeout(checkAuth, 500);
        };
        
        // Aguardar um pouco antes de começar as verificações
        setTimeout(checkAuth, 1000);
        
      } catch (error) {
        console.error('❌ Erro no callback:', error);
        setStatus('error');
        setMessage('Erro inesperado. Redirecionando para login...');
        
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    // Só executar quando inicializado
    if (initialized) {
      handleCallback();
    }
  }, [navigate, user, isAuthenticated, initialized]);

  const getErrorMessage = (error, description) => {
    switch (error) {
      case 'access_denied':
        return 'Acesso negado. Você cancelou a autenticação.';
      case 'invalid_request':
        return 'Solicitação inválida. Tente novamente.';
      case 'server_error':
        return 'Erro no servidor. Tente novamente mais tarde.';
      default:
        return description || 'Erro na autenticação com Google';
    }
  };

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
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-600 mb-6">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            iPoupei
          </h2>
          
          <p className="text-gray-600 mb-8">
            Todo sonho começa com um plano
          </p>
          
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
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
          
          {/* Countdown */}
          {status === 'success' && (
            <p className="text-sm text-gray-500 mb-4">
              Redirecionando em {countdown} segundos...
            </p>
          )}
          
          {/* Progress Bar */}
          {status === 'processing' && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out animate-pulse"
                style={{ width: '75%' }}
              ></div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'error' && (
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Voltar ao Login
              </button>
            )}
            
            {status === 'success' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                Ir para Dashboard
              </button>
            )}
          </div>
          
          {/* Debug Info (apenas em desenvolvimento) */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>URL:</strong> {window.location.href}</div>
                <div><strong>Status:</strong> {status}</div>
                <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
                <div><strong>User:</strong> {user ? user.email : 'None'}</div>
                <div><strong>Initialized:</strong> {initialized ? 'Yes' : 'No'}</div>
                <div><strong>Hash:</strong> {window.location.hash}</div>
                <div><strong>Search:</strong> {window.location.search}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;