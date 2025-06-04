import React from 'react';
import PropTypes from 'prop-types';
import { Compass, BarChart, ShieldCheck, TrendingUp } from 'lucide-react';

/**
 * Componente de introdução ao diagnóstico financeiro
 * Apresenta o propósito e estrutura do diagnóstico ao usuário
 */
const IntroEtapa = ({ onUpdateData, onNext }) => {
  // Avança imediatamente para a próxima etapa quando o usuário clicar em começar
  const handleStart = () => {
    // Não há dados para atualizar nesta etapa
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Diagnóstico Financeiro Completo</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Antes de começarmos a te ajudar, precisamos entender sua realidade financeira. 
          Isso não é só sobre números, é sobre como você se sente e vive sua relação 
          com o dinheiro.
        </p>
      </div>
      
      {/* Benefícios do diagnóstico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-5 flex items-start">
          <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3 mt-0.5">
            <Compass size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Clareza Financeira</h3>
            <p className="text-gray-600 text-sm">
              Entenda exatamente onde você está financeiramente e descubra seus pontos fortes e fracos.
            </p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-5 flex items-start">
          <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3 mt-0.5">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Plano Personalizado</h3>
            <p className="text-gray-600 text-sm">
              Receba um plano de ação desenhado especificamente para sua situação e objetivos.
            </p>
          </div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-5 flex items-start">
          <div className="p-2 rounded-full bg-amber-100 text-amber-600 mr-3 mt-0.5">
            <BarChart size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Acompanhamento Inteligente</h3>
            <p className="text-gray-600 text-sm">
              Monitore seu progresso com gráficos e insights que facilitam a tomada de decisão.
            </p>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-5 flex items-start">
          <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3 mt-0.5">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Segurança e Privacidade</h3>
            <p className="text-gray-600 text-sm">
              Seus dados financeiros são criptografados e mantidos com a máxima segurança.
            </p>
          </div>
        </div>
      </div>
      
      {/* Como funciona */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Como funciona o diagnóstico?</h3>
        
        <div className="space-y-4">
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Percepção e comportamento</h4>
              <p className="text-gray-600 text-sm">
                Entender como você percebe e lida com suas finanças.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Dados financeiros</h4>
              <p className="text-gray-600 text-sm">
                Levantar sua renda, contas, cartões, dívidas e despesas.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Análise e insights</h4>
              <p className="text-gray-600 text-sm">
                Processamos seus dados e geramos insights valiosos.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
              4
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Plano de ação</h4>
              <p className="text-gray-600 text-sm">
                Você recebe um plano personalizado para melhorar sua vida financeira.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tempo estimado */}
      <div className="text-center">
        <p className="text-gray-600 mb-6">
          <span className="font-medium">Tempo estimado:</span> cerca de 10 minutos para concluir o diagnóstico completo.
          Você pode pular etapas se preferir e voltar a elas depois.
        </p>
        
        <button
          onClick={handleStart}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Começar meu diagnóstico
        </button>
      </div>
    </div>
  );
};

IntroEtapa.propTypes = {
  onUpdateData: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default IntroEtapa;