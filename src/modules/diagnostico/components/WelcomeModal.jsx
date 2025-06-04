import React from 'react';
import PropTypes from 'prop-types';
import BasicModal from '../BasicModal';
import { Sparkles, Target, Shield, TrendingUp } from 'lucide-react';

/**
 * Modal de boas-vindas para novos usuários
 * Explica os benefícios do iPoupei e motiva a fazer o diagnóstico
 */
const WelcomeModal = ({ isOpen, onClose, onStartDiagnostico, onSkipToDashboard }) => {
  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Bem-vindo ao iPoupei!"
    >
      <div className="space-y-6">
        {/* Mensagem de boas-vindas */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Sua jornada financeira começa agora!
          </h2>
          
          <p className="text-gray-600">
            O iPoupei foi criado para transformar sua relação com o dinheiro. 
            Vamos descobrir juntos como melhorar sua vida financeira.
          </p>
        </div>

        {/* Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800 mb-1">Diagnóstico Personalizado</h3>
            <p className="text-sm text-gray-600">
              Entenda sua situação atual e receba um plano sob medida
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800 mb-1">Melhores Resultados</h3>
            <p className="text-sm text-gray-600">
              Controle inteligente que se adapta ao seu perfil
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800 mb-1">Dados Seguros</h3>
            <p className="text-sm text-gray-600">
              Suas informações são privadas e protegidas
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-gray-800 mb-2">
            🎯 Recomendamos: Comece com o diagnóstico completo
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Em apenas 10 minutos, você terá uma visão completa da sua situação financeira 
            e um plano personalizado para alcançar seus objetivos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onStartDiagnostico}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all"
            >
              Fazer Diagnóstico Completo (10 min)
            </button>
            <button
              onClick={onSkipToDashboard}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Começar Simples
            </button>
          </div>
        </div>

        {/* Informação adicional */}
        <div className="text-center text-xs text-gray-500">
          💡 Você poderá fazer o diagnóstico a qualquer momento depois
        </div>
      </div>
    </BasicModal>
  );
};

WelcomeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onStartDiagnostico: PropTypes.func.isRequired,
  onSkipToDashboard: PropTypes.func.isRequired
};

export default WelcomeModal;