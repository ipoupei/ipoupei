// src/components/layout/TopBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  LogOut,
  ChevronDown
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

/**
 * Componente de barra de topo com ações rápidas e navegação
 * Atualizado com menu de perfil de usuário
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
  showQuickActions = true,
  className = '',
  ...props
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
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
  
  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

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
            <div className="relative" ref={userMenuRef}>
              <div className="flex items-center">
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">
                    {user.user_metadata?.nome || user.email}
                  </p>
                </div>
                
                <div className="ml-3 relative">
                  <button 
                    className="flex items-center justify-center space-x-2 rounded-full bg-gray-100 p-1 pr-3 text-gray-600 hover:bg-gray-200"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label="Menu de usuário"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {user.user_metadata?.nome 
                        ? user.user_metadata.nome.charAt(0).toUpperCase() 
                        : user.email.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={16} className={`transform transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Menu de usuário */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={16} className="mr-2" />
                        Meu Perfil
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings size={16} className="mr-2" />
                        Configurações
                      </Link>
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} className="mr-2" />
                        Sair
                      </button>
                    </div>
                  )}
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
  showQuickActions: PropTypes.bool,
  className: PropTypes.string
};

export default TopBar;