// src/components/layout/TopBar.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { 
  Landmark, 
  PlusCircle, 
  MinusCircle, 
  CreditCard, 
  BarChart2, 
  Menu,
  User,
  Settings,
  LogOut
} from 'lucide-react';

/**
 * Componente de barra de topo com ações rápidas e navegação
 * 
 * @example
 * <TopBar 
 *   title="Dashboard" 
 *   onToggleSidebar={handleToggleSidebar} 
 *   user={{ name: 'João Silva' }} 
 * />
 */
const TopBar = ({
  title = 'Finanças Pessoais',
  onToggleSidebar = null,
  user = null,
  showQuickActions = true,
  className = '',
  ...props
}) => {
  // Define ações rápidas padrão - podem ser personalizadas/estendidas
  const quickActions = [
    {
      id: 'gerenciar-contas',
      label: 'Gerenciar contas',
      icon: <Landmark size={18} />,
      color: 'text-gray-700',
      onClick: () => {}
    },
    {
      id: 'lancar-receitas',
      label: 'Lançar receitas',
      icon: <PlusCircle size={18} />,
      color: 'text-green-600',
      onClick: () => {}
    },
    {
      id: 'cadastrar-despesas',
      label: 'Cadastrar despesas',
      icon: <MinusCircle size={18} />,
      color: 'text-red-600',
      onClick: () => {}
    },
    {
      id: 'despesa-cartao',
      label: 'Despesa Cartão de Crédito',
      icon: <CreditCard size={18} />,
      color: 'text-purple-600',
      onClick: () => {}
    },
    {
      id: 'gerenciar-categorias',
      label: 'Gerenciar categorias',
      icon: <BarChart2 size={18} />,
      color: 'text-amber-600',
      onClick: () => {}
    },
    {
      id: 'gerenciar-cartao',
      label: 'Gerenciar Cartão de Crédito',
      icon: <CreditCard size={18} />,
      color: 'text-blue-600',
      onClick: () => {}
    }
  ];

  return (
    <header className={`bg-white shadow-sm z-10 ${className}`} {...props}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
          {/* Esquerda: Título e Toggle do Sidebar */}
          <div className="flex items-center">
            {onToggleSidebar && (
              <button 
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                onClick={onToggleSidebar}
                aria-label="Menu lateral"
              >
                <Menu size={24} />
              </button>
            )}
            
            <h1 className="text-xl font-semibold text-gray-800 ml-2">{title}</h1>
          </div>
          
          {/* Direita: Perfil de usuário */}
          {user && (
            <div className="relative">
              <div className="flex items-center">
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                </div>
                
                <div className="ml-3 relative">
                  <div>
                    <button 
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                      aria-label="Menu de usuário"
                    >
                      <User size={16} />
                    </button>
                  </div>
                  
                  {/* Menu de usuário (pode ser implementado com estado) */}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Ações rápidas */}
        {showQuickActions && (
          <div className="border-t border-gray-200 overflow-x-auto pb-2">
            <div className="flex space-x-2 px-4 sm:px-6 lg:px-8 py-2 min-w-max">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  onClick={action.onClick}
                >
                  <span className={action.color}>{action.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

TopBar.propTypes = {
  title: PropTypes.string,
  onToggleSidebar: PropTypes.func,
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    // Outros dados do usuário podem ser adicionados conforme necessário
  }),
  showQuickActions: PropTypes.bool,
  className: PropTypes.string
};

export default TopBar;