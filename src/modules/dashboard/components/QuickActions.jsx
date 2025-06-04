import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Plus,
  Minus,
  CreditCard,
  Landmark,
  Target,
  BarChart3,
  TrendingUp,
  ArrowUpDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  LineChart
} from 'lucide-react';

/**
 * Componente QuickActions - Ações rápidas para o Dashboard
 * Interface moderna e intuitiva para ações mais comuns do usuário
 */
const QuickActions = ({ onActionClick = () => {} }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Definição das ações rápidas organizadas por categoria
  const actions = [
    // Página 1 - Ações Essenciais
    [
      {
        id: 'add-receita',
        title: 'Adicionar Receita',
        subtitle: 'Registrar entrada de dinheiro',
        icon: Plus,
        gradient: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        hoverColor: 'hover:bg-green-100',
        emoji: '💰'
      },
      {
        id: 'add-despesa',
        title: 'Adicionar Despesa',
        subtitle: 'Registrar um gasto',
        icon: Minus,
        gradient: 'from-red-500 to-rose-600',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        hoverColor: 'hover:bg-red-100',
        emoji: '💸'
      },
      {
        id: 'add-cartao',
        title: 'Compra no Cartão',
        subtitle: 'Registrar compra no crédito',
        icon: CreditCard,
        gradient: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        hoverColor: 'hover:bg-purple-100',
        emoji: '💳'
      },
      {
        id: 'transferencia',
        title: 'Transferência',
        subtitle: 'Entre contas',
        icon: ArrowUpDown,
        gradient: 'from-blue-500 to-cyan-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        hoverColor: 'hover:bg-blue-100',
        emoji: '🔄'
      }
    ],
    // Página 2 - Gestão e Análise
    [
      {
        id: 'gerenciar-contas',
        title: 'Minhas Contas',
        subtitle: 'Gerenciar contas bancárias',
        icon: Landmark,
        gradient: 'from-indigo-500 to-blue-600',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-700',
        hoverColor: 'hover:bg-indigo-100',
        emoji: '🏦'
      },
      {
        id: 'gerenciar-cartoes',
        title: 'Meus Cartões',
        subtitle: 'Gerenciar cartões de crédito',
        icon: CreditCard,
        gradient: 'from-teal-500 to-cyan-600',
        bgColor: 'bg-teal-50',
        textColor: 'text-teal-700',
        hoverColor: 'hover:bg-teal-100',
        emoji: '💳'
      },
      {
        id: 'categorias',
        title: 'Categorias',
        subtitle: 'Organizar gastos',
        icon: BarChart3,
        gradient: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        hoverColor: 'hover:bg-amber-100',
        emoji: '📊'
      },
      {
        id: 'metas',
        title: 'Minhas Metas',
        subtitle: 'Acompanhar objetivos',
        icon: Target,
        gradient: 'from-pink-500 to-rose-600',
        bgColor: 'bg-pink-50',
        textColor: 'text-pink-700',
        hoverColor: 'hover:bg-pink-100',
        emoji: '🎯'
      }
    ],
    // Página 3 - Análise e Crescimento
    [
      {
        id: 'diagnostico',
        title: 'Diagnóstico',
        subtitle: 'Análise financeira completa',
        icon: TrendingUp,
        gradient: 'from-violet-500 to-purple-600',
        bgColor: 'bg-violet-50',
        textColor: 'text-violet-700',
        hoverColor: 'hover:bg-violet-100',
        emoji: '📈',
        featured: true
      },
      {
        id: 'relatorios',
        title: 'Relatórios',
        subtitle: 'Análises detalhadas',
        icon: FileText,
        gradient: 'from-slate-500 to-gray-600',
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-700',
        hoverColor: 'hover:bg-slate-100',
        emoji: '📋'
      },
      {
        id: 'investimentos',
        title: 'Investimentos',
        subtitle: 'Acompanhar aplicações',
        icon: LineChart,
        gradient: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        hoverColor: 'hover:bg-emerald-100',
        emoji: '📈'
      },
      {
        id: 'premium',
        title: 'iPoupei Pro',
        subtitle: 'Recursos avançados',
        icon: Sparkles,
        gradient: 'from-yellow-500 to-amber-600',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        hoverColor: 'hover:bg-yellow-100',
        emoji: '⭐',
        featured: true
      }
    ]
  ];

  const currentActions = actions[currentPage] || [];
  const totalPages = actions.length;

  const handleActionClick = (actionId) => {
    onActionClick(actionId);
  };

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Ações Rápidas</h3>
          <p className="text-sm text-gray-600">Acesse suas funções mais utilizadas</p>
        </div>
        
        {/* Navegação entre páginas */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors micro-bounce"
              disabled={totalPages <= 1}
            >
              <ChevronLeft size={18} />
            </button>
            
            {/* Indicadores de página */}
            <div className="flex space-x-1">
              {actions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`w-2 h-2 rounded-full transition-colors micro-bounce ${
                    index === currentPage 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextPage}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors micro-bounce"
              disabled={totalPages <= 1}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Grid de Ações */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {currentActions.map((action, index) => {
          const IconComponent = action.icon;
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={`
                group relative p-4 rounded-xl border-2 border-transparent
                ${action.bgColor} ${action.hoverColor}
                hover:border-gray-200 hover:shadow-md
                transition-all duration-200 ease-out
                hover:scale-105 hover:-translate-y-1
                ${action.featured ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
                quick-action-item micro-bounce
                animate-slide-in-up
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Badge "Destaque" para ações em destaque */}
              {action.featured && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse-gentle">
                  ⭐
                </div>
              )}
              
              {/* Ícone com gradiente */}
              <div className={`
                inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3
                bg-gradient-to-br ${action.gradient} text-white
                group-hover:scale-110 transition-transform duration-200
                shadow-soft
              `}>
                <IconComponent size={24} />
              </div>
              
              {/* Textos */}
              <div className="text-left">
                <h4 className={`font-semibold ${action.textColor} mb-1 group-hover:text-gray-800 transition-colors`}>
                  {action.title}
                </h4>
                <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                  {action.subtitle}
                </p>
              </div>
              
              {/* Emoji decorativo */}
              <div className="absolute top-2 right-2 text-lg opacity-60 group-hover:opacity-100 transition-opacity">
                {action.emoji}
              </div>
              
              {/* Efeito de hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          );
        })}
      </div>

      {/* Indicador de página atual */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Página {currentPage + 1} de {totalPages}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              Deslize para ver mais
            </span>
          </div>
        </div>
      )}
      
      {/* Dica contextual */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-blue-600 text-xs">💡</span>
          </div>
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">Dica do iPoupei</p>
            <p className="text-blue-600 text-xs">
              {currentPage === 0 && "Registre suas movimentações assim que elas acontecem para manter seu controle sempre atualizado!"}
              {currentPage === 1 && "Mantenha suas contas e cartões organizados para ter uma visão completa das suas finanças."}
              {currentPage === 2 && "Use o diagnóstico para identificar oportunidades de melhoria na sua vida financeira."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

QuickActions.propTypes = {
  onActionClick: PropTypes.func
};

export default QuickActions;