import React from 'react';
import PropTypes from 'prop-types';
import Card from '../../Components/ui/Card';
import { LineChart, TrendingUp, BarChart2, Clock, CheckCircle } from 'lucide-react';

/**
 * Componente para seleção do tipo de jornada que o usuário deseja seguir
 * Oferece dois caminhos: controle simples ou transformação financeira completa
 */
const JornadaSelection = ({ onSelect }) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Como podemos te ajudar?</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Escolha como você deseja utilizar o iPoupei. Esta escolha vai personalizar sua experiência.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Opção de Controle Simples */}
        <Card 
          className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 cursor-pointer"
          onClick={() => onSelect('simples')}
          hoverable
        >
          <div className="flex flex-col items-center p-4 text-center">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-4">
              <BarChart2 size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Quero apenas controlar meus gastos</h3>
            <p className="text-gray-600 mb-4">
              Ideal para quem já é organizado financeiramente e busca apenas uma ferramenta para 
              controlar suas movimentações.
            </p>
            <div className="border-t border-gray-100 w-full pt-4 mt-auto">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Clock size={16} />
                <span>Acesso rápido ao dashboard</span>
              </div>
            </div>
            <button className="mt-4 w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
              Selecionar
            </button>
          </div>
        </Card>
        
        {/* Opção de Transformação Financeira */}
        <Card 
          className="border-2 border-gray-200 hover:border-green-300 transition-all duration-300 cursor-pointer"
          onClick={() => onSelect('completo')}
          hoverable
        >
          <div className="flex flex-col items-center p-4 text-center">
            <div className="p-3 bg-green-100 text-green-600 rounded-full mb-4">
              <TrendingUp size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Quero transformar minha vida financeira</h3>
            <p className="text-gray-600 mb-4">
              Para quem deseja não apenas controlar, mas transformar sua situação financeira com 
              diagnóstico completo e plano personalizado.
            </p>
            <div className="border-t border-gray-100 w-full pt-4 mt-auto">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <CheckCircle size={16} />
                <span>Diagnóstico financeiro profissional</span>
              </div>
            </div>
            <button className="mt-4 w-full py-2 px-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors">
              Selecionar
            </button>
          </div>
        </Card>
      </div>
      
      <div className="text-center pt-4 text-sm text-gray-500">
        <p>Você poderá alterar sua escolha a qualquer momento nas configurações.</p>
      </div>
    </div>
  );
};

JornadaSelection.propTypes = {
  onSelect: PropTypes.func.isRequired
};

export default JornadaSelection;
