// src/components/layout/TopBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import useAuth from '@modules/auth/hooks/useAuth';







/**
 * TopBar simples e limpa - apenas menu do usuário
 */
const TopBar = ({ className = '', ...props }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
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

  // Navegar para o perfil
  const handleProfileClick = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  // Navegar para configurações
  const handleSettingsClick = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  // Obtém o nome do usuário ou primeira letra do email
  const getUserName = () => {
    if (user?.user_metadata?.nome) {
      return user.user_metadata.nome;
    }
    return user?.email || 'Usuário';
  };

  const getUserInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  const getFirstName = () => {
    const fullName = getUserName();
    return fullName.split(' ')[0];
  };

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 ${className}`} {...props}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Título */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">iP</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">iPoupei</h1>
            </div>
          </div>
          
          {/* Menu do usuário - compacto */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button 
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Menu de usuário"
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {getUserInitial()}
                  </span>
                </div>
                
                {/* Nome do usuário (oculto em telas pequenas) */}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {getFirstName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Bem-vindo de volta!
                  </p>
                </div>
                
                {/* Ícone de dropdown */}
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transform transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {/* Menu dropdown - compacto */}
              {userMenuOpen && (  
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[60]">
                  {/* Header do menu */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {getUserInitial()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getUserName()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Opções do menu */}
                  <div className="py-1">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={handleProfileClick}
                    >
                      <User size={16} className="mr-3 text-gray-400" />
                      Meu Perfil
                    </button>
                    
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={handleSettingsClick}
                    >
                      <Settings size={16} className="mr-3 text-gray-400" />
                      Configurações
                    </button>
                  </div>
                  
                  {/* Separador */}
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  {/* Logout */}
                  <div className="py-1">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className="mr-3" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

TopBar.propTypes = {
  className: PropTypes.string
};

export default TopBar;