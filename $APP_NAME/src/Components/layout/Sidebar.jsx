// src/components/layout/Sidebar.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { 
  Home, 
  BarChart2, 
  DollarSign, 
  CreditCard, 
  PieChart, 
  Settings, 
  HelpCircle,
  X
} from 'lucide-react';

/**
 * Componente de Sidebar para navegação principal
 * 
 * @example
 * <Sidebar 
 *   isOpen={sidebarOpen} 
 *   onClose={closeSidebar}
 *   activePath="/dashboard" 
 * />
 */
const Sidebar = ({
  isOpen = false,
  onClose = () => {},
  activePath = '/',
  className = '',
  ...props
}) => {
  // Itens de navegação - podem ser personalizados/estendidos
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      path: '/dashboard'
    },
    {
      id: 'transacoes',
      label: 'Transações',
      icon: <BarChart2 size={20} />,
      path: '/transacoes'
    },
    {
      id: 'receitas',
      label: 'Receitas',
      icon: <DollarSign size={20} />,
      path: '/receitas'
    },
    {
      id: 'despesas',
      label: 'Despesas',
      icon: <DollarSign size={20} />,
      path: '/despesas'
    },
    {
      id: 'cartoes',
      label: 'Cartões de Crédito',
      icon: <CreditCard size={20} />,
      path: '/cartoes'
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: <PieChart size={20} />,
      path: '/relatorios'
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: <Settings size={20} />,
      path: '/configuracoes'
    }
  ];

  const baseSidebarClasses = 'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out transform';
  const mobileClasses = isOpen ? 'translate-x-0' : '-translate-x-full';
  const desktopClasses = 'hidden lg:block lg:translate-x-0';
  
  const sidebarClasses = [
    baseSidebarClasses,
    mobileClasses,
    desktopClasses,
    className
  ].join(' ');

  // Overlay para fechar ao clicar fora
  const overlayClasses = `fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${
    isOpen ? 'opacity-100 lg:hidden' : 'opacity-0 pointer-events-none hidden'
  }`;

  return (
    <>
      {/* Overlay para mobile */}
      <div className={overlayClasses} onClick={onClose} />
      
      {/* Sidebar */}
      <aside className={sidebarClasses} {...props}>
        <div className="h-full flex flex-col">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Finanças</h2>
            <button 
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={onClose}
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Navegação */}
          <nav className="flex-1 overflow-y-auto pt-5 pb-4">
            <ul className="px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = activePath === item.path;
                
                return (
                  <li key={item.id}>
                    <a 
                      href={item.path}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Rodapé */}
          <div className="p-4 border-t border-gray-200">
            <a 
              href="/ajuda" 
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <HelpCircle size={20} className="mr-3 text-gray-500" />
              Ajuda e Suporte
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  activePath: PropTypes.string,
  className: PropTypes.string
};

export default Sidebar;