import React from 'react';
import PropTypes from 'prop-types';
import { Sparkles, Target, Shield, TrendingUp } from 'lucide-react';
import ModalBase from '@shared/components/ui/ModalBase';

/**
 * Modal de boas-vindas para novos usuários
 * Explica os benefícios do iPoupei e motiva a fazer o diagnóstico
 */
const WelcomeModal = ({ isOpen, onClose, onStartDiagnostico, onSkipToDashboard }) => {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Bem-vindo ao iPoupei!"
      size="large"
    >
      <div className="diagnostico-wrapper">
        <div className="space-y-6">
          {/* Mensagem de boas-vindas */}
          <div className="text-center">
            <div className="diagnostico-icon mx-auto mb-4" style={{ 
              backgroundColor: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', 
              width: '64px', 
              height: '64px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)'
            }}>
              <Sparkles size={32} style={{ color: 'white' }} />
            </div>
            
            <h2 className="diagnostico-card-title">
              Sua jornada financeira começa agora!
            </h2>
            
            <p className="diagnostico-card-description">
              O iPoupei foi criado para transformar sua relação com o dinheiro. 
              Vamos descobrir juntos como melhorar sua vida financeira.
            </p>
          </div>

          {/* Benefícios */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-card-header">
                <div className="summary-card-icon" style={{ backgroundColor: '#dbeafe', color: '#3b82f6' }}>
                  <Target size={20} />
                </div>
                <h3 className="summary-card-title">Diagnóstico Personalizado</h3>
              </div>
              <div className="summary-card-content">
                Entenda sua situação atual e receba um plano sob medida
              </div>
            </div>
            
            <div className="summary-card success">
              <div className="summary-card-header">
                <div className="summary-card-icon" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>
                  <TrendingUp size={20} />
                </div>
                <h3 className="summary-card-title">Melhores Resultados</h3>
              </div>
              <div className="summary-card-content">
                Controle inteligente que se adapta ao seu perfil
              </div>
            </div>
            
            <div className="summary-card" style={{ borderLeftColor: '#a855f7' }}>
              <div className="summary-card-header">
                <div className="summary-card-icon" style={{ backgroundColor: '#f3e8ff', color: '#a855f7' }}>
                  <Shield size={20} />
                </div>
                <h3 className="summary-card-title">Dados Seguros</h3>
              </div>
              <div className="summary-card-content">
                Suas informações são privadas e protegidas
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="info-box info">
            <div className="info-icon">🎯</div>
            <div className="info-content">
              <h4>Recomendamos: Comece com o diagnóstico completo</h4>
              <p>
                Em apenas 10 minutos, você terá uma visão completa da sua situação financeira 
                e um plano personalizado para alcançar seus objetivos.
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="navigation-controls">
            <div className="nav-left">
              <button
                onClick={() => {
                  console.log('Botão "Começar Simples" clicado');
                  onSkipToDashboard();
                }}
                className="btn btn-secondary"
              >
                Começar Simples
              </button>
            </div>
            <div className="nav-right">
              <button
                onClick={() => {
                  console.log('Botão "Fazer Diagnóstico" clicado');
                  onStartDiagnostico();
                }}
                className="btn btn-primary"
              >
                Fazer Diagnóstico Completo (10 min)
              </button>
            </div>
          </div>

          {/* Informação adicional */}
          <div className="text-center" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            💡 Você poderá fazer o diagnóstico a qualquer momento depois
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

WelcomeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onStartDiagnostico: PropTypes.func.isRequired,
  onSkipToDashboard: PropTypes.func.isRequired
};

export default WelcomeModal;