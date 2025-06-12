// src/routes/DiagnosticoRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@modules/auth/hooks/useAuth';
import DiagnosticoRouter from './DiagnosticoRouter';

const DiagnosticoRoute = () => {
  const { user, loading } = useAuth();

  // Aguardar autenticação
  if (loading) {
    return (
      <div className="loading-diagnostico">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando diagnóstico...</p>
        </div>
        
        <style jsx>{`
          .loading-diagnostico {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .loading-container {
            background: white;
            padding: 3rem;
            border-radius: 24px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-container p {
            margin: 0;
            color: #374151;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  // Redirecionar se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se já completou o diagnóstico
  const diagnosticoCompleto = localStorage.getItem('diagnostico-completo');
  const dataUltimaCompletacao = localStorage.getItem('diagnostico-data-conclusao');
  
  // Se completou recentemente (menos de 30 dias), perguntar se quer refazer
  if (diagnosticoCompleto && dataUltimaCompletacao) {
    const dataCompletacao = new Date(dataUltimaCompletacao);
    const diasDesdeCompletacao = (new Date() - dataCompletacao) / (1000 * 60 * 60 * 24);
    
    if (diasDesdeCompletacao < 30) {
      return <DiagnosticoCompleto onRefazer={() => {
        localStorage.removeItem('diagnostico-completo');
        localStorage.removeItem('diagnostico-data-conclusao');
        window.location.reload();
      }} />;
    }
  }

  return <DiagnosticoRouter />;
};

// Componente para quando já completou o diagnóstico
const DiagnosticoCompleto = ({ onRefazer }) => {
  const handleVoltarDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="diagnostico-completo">
      <div className="completo-container">
        <div className="completo-icone">✅</div>
        <h1>Diagnóstico já realizado!</h1>
        <p>
          Você já completou seu diagnóstico financeiro recentemente. 
          Que tal aproveitar as ferramentas do iPoupei para colocar 
          seu plano em prática?
        </p>
        
        <div className="completo-acoes">
          <button 
            onClick={handleVoltarDashboard}
            className="btn-dashboard"
          >
            Ir para o Dashboard
          </button>
          <button 
            onClick={onRefazer}
            className="btn-refazer"
          >
            Refazer Diagnóstico
          </button>
        </div>

        <div className="completo-info">
          <p>
            💡 <strong>Dica:</strong> Recomendamos refazer o diagnóstico a cada 3-6 meses 
            ou quando sua situação financeira mudar significativamente.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .diagnostico-completo {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .completo-container {
          background: white;
          padding: 3rem;
          border-radius: 24px;
          text-align: center;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .completo-icone {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }

        .completo-container h1 {
          margin: 0 0 1rem 0;
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b;
        }

        .completo-container p {
          margin: 0 0 2rem 0;
          font-size: 1.125rem;
          color: #64748b;
          line-height: 1.6;
        }

        .completo-acoes {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn-dashboard {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          color: white;
          padding: 1rem 2rem;
          font-size: 1.125rem;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-dashboard:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .btn-refazer {
          background: white;
          border: 2px solid #e5e7eb;
          color: #6b7280;
          padding: 0.875rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-refazer:hover {
          border-color: #d1d5db;
          color: #374151;
          background: #f9fafb;
        }

        .completo-info {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 1rem;
        }

        .completo-info p {
          margin: 0;
          font-size: 0.875rem;
          color: #0369a1;
        }

        @media (max-width: 640px) {
          .diagnostico-completo {
            padding: 1rem;
          }

          .completo-container {
            padding: 2rem 1.5rem;
          }

          .completo-container h1 {
            font-size: 1.5rem;
          }

          .completo-container p {
            font-size: 1rem;
          }

          .completo-acoes {
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DiagnosticoRoute;