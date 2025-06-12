// src/modules/diagnostico/components/DiagnosticoIntegration.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '@shared/components/ui/Button';

const DiagnosticoIntegration = ({ 
  trigger = 'button',
  variant = 'primary',
  size = 'medium',
  children,
  className = '',
  showModal = false,
  autoStart = false
}) => {
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(showModal);

  // Verificar se já completou o diagnóstico
  const diagnosticoCompleto = localStorage.getItem('diagnostico-completo');
  const dataUltimaCompletacao = localStorage.getItem('diagnostico-data-conclusao');
  
  const jaFezDiagnostico = diagnosticoCompleto && dataUltimaCompletacao;
  const diasDesdeCompletacao = jaFezDiagnostico 
    ? (new Date() - new Date(dataUltimaCompletacao)) / (1000 * 60 * 60 * 24)
    : 0;

  const handleAbrirModal = () => {
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleIniciarDiagnostico = () => {
    setModalAberto(false);
    navigate('/diagnostico');
  };

  const handleRefazerDiagnostico = () => {
    // Limpar dados do diagnóstico anterior
    localStorage.removeItem('diagnostico-completo');
    localStorage.removeItem('diagnostico-data-conclusao');
    localStorage.removeItem('diagnostico-dados');
    localStorage.removeItem('diagnostico-etapa');
    
    setModalAberto(false);
    navigate('/diagnostico');
  };

  const handleIrParaDashboard = () => {
    setModalAberto(false);
    navigate('/dashboard');
  };

  // Auto iniciar se especificado
  React.useEffect(() => {
    if (autoStart && !jaFezDiagnostico) {
      handleIniciarDiagnostico();
    }
  }, [autoStart, jaFezDiagnostico]);

  // Determinar o texto e ação do botão
  const getButtonConfig = () => {
    if (!jaFezDiagnostico) {
      return {
        text: 'Fazer Diagnóstico Financeiro',
        action: handleAbrirModal,
        className: 'btn-diagnostico-novo'
      };
    } else if (diasDesdeCompletacao > 90) {
      return {
        text: 'Atualizar Diagnóstico',
        action: handleAbrirModal,
        className: 'btn-diagnostico-atualizar'
      };
    } else {
      return {
        text: 'Ver Último Diagnóstico',
        action: handleAbrirModal,
        className: 'btn-diagnostico-completo'
      };
    }
  };

  const buttonConfig = getButtonConfig();

  // Renderizar trigger personalizado
  if (trigger === 'custom' && children) {
    return (
      <>
        <div onClick={handleAbrirModal} className={`diagnostico-trigger ${className}`}>
          {children}
        </div>
        
        {modalAberto && (
          <DiagnosticoModal
            isOpen={modalAberto}
            onClose={handleFecharModal}
            onIniciar={handleIniciarDiagnostico}
            onRefazer={handleRefazerDiagnostico}
            onDashboard={handleIrParaDashboard}
            jaFezDiagnostico={jaFezDiagnostico}
            diasDesdeCompletacao={diasDesdeCompletacao}
          />
        )}

        <style jsx>{`
          .diagnostico-trigger {
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .diagnostico-trigger:hover {
            transform: translateY(-2px);
          }
        `}</style>
      </>
    );
  }

  // Renderizar botão padrão
  return (
    <>
      <Button
        onClick={buttonConfig.action}
        variant={variant}
        size={size}
        className={`${buttonConfig.className} ${className}`}
      >
        {children || buttonConfig.text}
      </Button>

      {modalAberto && (
        <DiagnosticoModal
          isOpen={modalAberto}
          onClose={handleFecharModal}
          onIniciar={handleIniciarDiagnostico}
          onRefazer={handleRefazerDiagnostico}
          onDashboard={handleIrParaDashboard}
          jaFezDiagnostico={jaFezDiagnostico}
          diasDesdeCompletacao={diasDesdeCompletacao}
        />
      )}

      <style jsx>{`
        .btn-diagnostico-novo {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3) !important;
          animation: pulse-green 2s infinite;
        }

        .btn-diagnostico-atualizar {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3) !important;
        }

        .btn-diagnostico-completo {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3) !important;
        }

        @keyframes pulse-green {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
          }
        }
      `}</style>
    </>
  );
};

// Modal do diagnóstico
const DiagnosticoModal = ({
  isOpen,
  onClose,
  onIniciar,
  onRefazer,
  onDashboard,
  jaFezDiagnostico,
  diasDesdeCompletacao
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="diagnostico-modal-overlay" onClick={onClose}>
        <div className="diagnostico-modal-container" onClick={(e) => e.stopPropagation()}>
          {!jaFezDiagnostico ? (
            // Modal para novos usuários
            <>
              <div className="modal-header novo">
                <h2>🎯 Diagnóstico Financeiro Inteligente</h2>
                <p>Descubra sua situação financeira real e receba um plano personalizado</p>
                <button className="modal-close" onClick={onClose}>✕</button>
              </div>
              
              <div className="modal-content">
                <div className="beneficios-grid">
                  <div className="beneficio">
                    <div className="beneficio-icon">📊</div>
                    <div className="beneficio-text">
                      <h4>Análise Completa</h4>
                      <p>Avaliamos sua renda, gastos, dívidas e hábitos financeiros</p>
                    </div>
                  </div>
                  
                  <div className="beneficio">
                    <div className="beneficio-icon">🎯</div>
                    <div className="beneficio-text">
                      <h4>Plano Personalizado</h4>
                      <p>Receba estratégias específicas para sua situação</p>
                    </div>
                  </div>
                  
                  <div className="beneficio">
                    <div className="beneficio-icon">🚀</div>
                    <div className="beneficio-text">
                      <h4>Resultados Reais</h4>
                      <p>Ferramentas práticas para transformar sua vida financeira</p>
                    </div>
                  </div>
                </div>

                <div className="info-tempo">
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <span><strong>Tempo:</strong> 10-15 minutos</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">🔒</span>
                    <span><strong>Privacidade:</strong> Seus dados ficam seguros</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button onClick={onClose} className="btn-secondary">
                  Talvez depois
                </button>
                <button onClick={onIniciar} className="btn-primary">
                  Começar Diagnóstico
                </button>
              </div>
            </>
          ) : (
            // Modal para usuários que já fizeram
            <>
              <div className="modal-header completo">
                <h2>✅ Diagnóstico já realizado!</h2>
                <p>
                  {diasDesdeCompletacao < 30 
                    ? 'Você completou o diagnóstico recentemente'
                    : diasDesdeCompletacao < 90
                    ? 'Que tal atualizar seu diagnóstico?'
                    : 'Hora de refazer seu diagnóstico!'
                  }
                </p>
                <button className="modal-close" onClick={onClose}>✕</button>
              </div>
              
              <div className="modal-content">
                <div className="status-info">
                  <div className="status-row">
                    <span className="status-label">Última atualização:</span>
                    <span className="status-value">
                      {Math.floor(diasDesdeCompletacao)} dia{Math.floor(diasDesdeCompletacao) !== 1 ? 's' : ''} atrás
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Recomendação:</span>
                    <span className="status-value">
                      {diasDesdeCompletacao > 90 ? 'Refazer diagnóstico' :
                       diasDesdeCompletacao > 30 ? 'Considere atualizar' :
                       'Em dia'}
                    </span>
                  </div>
                </div>

                <div className="opcoes-grid">
                  <div className="opcao-card">
                    <h4>📊 Ver no Dashboard</h4>
                    <p>Acesse suas informações financeiras atuais</p>
                  </div>
                  <div className="opcao-card">
                    <h4>🔄 Refazer Diagnóstico</h4>
                    <p>Atualize seus dados e receba novas recomendações</p>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button onClick={onDashboard} className="btn-secondary">
                  Ver Dashboard
                </button>
                <button onClick={onRefazer} className="btn-primary">
                  {diasDesdeCompletacao > 90 ? 'Refazer' : 'Atualizar'} Diagnóstico
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .diagnostico-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.3s ease-out;
        }

        .diagnostico-modal-container {
          background: white;
          border-radius: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          padding: 2rem;
          text-align: center;
          position: relative;
          color: white;
        }

        .modal-header.novo {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .modal-header.completo {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .modal-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .modal-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 1rem;
          line-height: 1.5;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          transition: all 0.3s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .modal-content {
          padding: 2rem;
        }

        .beneficios-grid {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .beneficio {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .beneficio-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .beneficio-text h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .beneficio-text p {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
          font-size: 0.875rem;
        }

        .info-tempo {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 1rem;
          display: grid;
          gap: 0.5rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #0369a1;
          font-size: 0.875rem;
        }

        .info-icon {
          font-size: 1rem;
        }

        .status-info {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .status-row:last-child {
          margin-bottom: 0;
        }

        .status-label {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .status-value {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .opcoes-grid {
          display: grid;
          gap: 1rem;
        }

        .opcao-card {
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .opcao-card:hover {
          border-color: #d1d5db;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          transform: translateY(-1px);
        }

        .opcao-card h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }

        .opcao-card p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-secondary {
          background: white;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
          transform: translateY(-1px);
        }

        .btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          font-size: 0.875rem;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .diagnostico-modal-container {
            margin: 0.5rem;
            border-radius: 16px;
          }

          .modal-header {
            padding: 1.5rem;
          }

          .modal-header h2 {
            font-size: 1.25rem;
          }

          .modal-content {
            padding: 1.5rem;
          }

          .modal-footer {
            padding: 1rem 1.5rem;
            flex-direction: column;
          }

          .btn-secondary,
          .btn-primary {
            width: 100%;
            justify-content: center;
          }

          .beneficio {
            gap: 0.75rem;
          }

          .beneficio-icon {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .diagnostico-modal-overlay {
            padding: 0.5rem;
          }

          .modal-header {
            padding: 1.25rem;
          }

          .modal-content {
            padding: 1.25rem;
          }

          .status-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </>
  );
};

DiagnosticoIntegration.propTypes = {
  trigger: PropTypes.oneOf(['button', 'custom']),
  variant: PropTypes.string,
  size: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  showModal: PropTypes.bool,
  autoStart: PropTypes.bool
};

DiagnosticoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onIniciar: PropTypes.func.isRequired,
  onRefazer: PropTypes.func.isRequired,
  onDashboard: PropTypes.func.isRequired,
  jaFezDiagnostico: PropTypes.bool.isRequired,
  diasDesdeCompletacao: PropTypes.number.isRequired
};

export default DiagnosticoIntegration;