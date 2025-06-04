import React from 'react';
import PropTypes from 'prop-types';
import Card from '../../Components/ui/Card';
import { LineChart, TrendingUp, BarChart2, Clock, CheckCircle } from 'lucide-react';

/**
 * Componente para seleção do tipo de jornada que o usuário deseja seguir
 * Oferece dois caminhos: controle simples ou transformação financeira completa
 */
const JornadaSelection = ({ onSelect, isFirstTime = false }) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {isFirstTime ? 'Como você gostaria de começar?' : 'Como podemos te ajudar?'}
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          {isFirstTime 
            ? 'Escolha a abordagem que mais combina com você. Não se preocupe, você poderá mudar isso depois!'
            : 'Escolha como você deseja utilizar o iPoupei. Esta escolha vai personalizar sua experiência.'
          }
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Opção de Controle Simples */}
        <Card 
          className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-lg"
          onClick={() => onSelect('simples')}
          hoverable
        >
          <div className="flex flex-col items-center p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <BarChart2 size={32} className="text-white" />
            </div>
            
            <h3 className="text-xl font-bold mb-3">
              {isFirstTime ? 'Começar simples' : 'Quero apenas controlar meus gastos'}
            </h3>
            
            <p className="text-gray-600 mb-4 flex-grow">
              {isFirstTime 
                ? 'Perfeito para quem quer começar devagar. Vá direto para o controle básico de receitas e despesas.'
                : 'Ideal para quem já é organizado financeiramente e busca apenas uma ferramenta para controlar suas movimentações.'
              }
            </p>
            
            <div className="w-full p-3 bg-blue-50 rounded-lg mb-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                <Clock size={16} />
                <span>Acesso rápido ao dashboard</span>
              </div>
            </div>
            
            <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md">
              {isFirstTime ? 'Começar assim' : 'Selecionar'}
            </button>
          </div>
        </Card>
        
        {/* Opção de Transformação Financeira */}
        <Card 
          className="border-2 border-green-300 hover:border-green-400 transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 transform hover:-translate-y-1 hover:shadow-lg"
          onClick={() => onSelect('completo')}
          hoverable
        >
          <div className="flex flex-col items-center p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <TrendingUp size={32} className="text-white" />
            </div>
            
            <h3 className="text-xl font-bold mb-3">
              {isFirstTime ? 'Transformação completa' : 'Quero transformar minha vida financeira'}
            </h3>
            
            <p className="text-gray-600 mb-4 flex-grow">
              {isFirstTime 
                ? 'A experiência completa! Faremos um diagnóstico profissional e criaremos um plano personalizado para você.'
                : 'Para quem deseja não apenas controlar, mas transformar sua situação financeira com diagnóstico completo e plano personalizado.'
              }
            </p>
            
            {/* Badge de recomendado para primeira vez */}
            {isFirstTime && (
              <div className="mb-4 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 rounded-full text-sm font-medium border border-yellow-200">
                ⭐ Recomendado
              </div>
            )}
            
            <div className="w-full p-3 bg-green-100 rounded-lg mb-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-green-700">
                <CheckCircle size={16} />
                <span>Diagnóstico financeiro profissional</span>
              </div>
            </div>
            
            <button className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-md">
              {isFirstTime ? 'Vamos lá!' : 'Selecionar'}
            </button>
          </div>
        </Card>
      </div>
      
      {/* Informações adicionais baseado no contexto */}
      <div className="text-center pt-4">
        {isFirstTime ? (
          <div className="space-y-4">
            <div className="max-w-2xl mx-auto p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-blue-500">
                  💡
                </div>
                <div className="text-left">
                  <p className="text-sm text-blue-800">
                    <strong>Dica:</strong> Se você está começando agora, recomendamos a transformação completa 
                    para entender melhor sua situação financeira.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Você poderá alterar sua escolha a qualquer momento nas configurações.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Você poderá alterar sua escolha a qualquer momento nas configurações.
          </p>
        )}
      </div>
    </div>
  );
};

JornadaSelection.propTypes = {
  onSelect: PropTypes.func.isRequired,
  isFirstTime: PropTypes.bool
};

export default JornadaSelection;