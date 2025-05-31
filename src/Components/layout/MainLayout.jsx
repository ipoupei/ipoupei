// src/Components/layout/MainLayout.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  BarChart3, 
  Menu, 
  X,
  User,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import './MainLayout.css';

/**
 * Layout principal da aplicação com navegação lateral
 */
const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Itens de navegação
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Transações',
      href: '/transacoes',
      icon: CreditCard,
      current: location.pathname === '/transacoes'
    },
    {
      name: 'Relatórios',
      href: '/relatorios',
      icon: BarChart3,
      current: location.pathname.startsWith('/relatorios')
    }
  ];

  // Função de logout
  const handleLogout = async () => {
    try {
      await signOut();
      showNotification('Logout realizado com sucesso!', 'success');
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      showNotification('Erro ao fazer logout', 'error');
    }
  };

  // Obter dados do usuário
  const getUserDisplayName = () => {
    if (user?.user_metadata?.nome) return user.user_metadata.nome;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const getUserEmail = () => {
    return user?.email || 'usuario@exemplo.com';
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || null;
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <h1 className="logo-text">iPoupei</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`nav-item ${item.current ? 'nav-item-active' : ''}`}
                >
                  <item.icon className="nav-icon" />
                  <span className="nav-text">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Menu na Sidebar */}
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">
              {getUserAvatar() ? (
                <img 
                  src={getUserAvatar()} 
                  alt="Avatar do usuário" 
                  className="avatar-image"
                />
              ) : (
                <span className="avatar-initial">{getUserInitial()}</span>
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{getUserDisplayName()}</div>
              <div className="user-email">{getUserEmail()}</div>
            </div>
          </div>
          
          <div className="user-actions">
            <button
              onClick={() => navigate('/perfil')}
              className="user-action"
              title="Perfil"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/configuracoes')}
              className="user-action"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="user-action logout"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="header-spacer" />

          {/* User Menu para Desktop */}
          <div className="desktop-user-menu hidden md:block">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="user-menu-trigger"
              >
                <div className="user-avatar-small">
                  {getUserAvatar() ? (
                    <img 
                      src={getUserAvatar()} 
                      alt="Avatar do usuário" 
                      className="avatar-image"
                    />
                  ) : (
                    <span className="avatar-initial">{getUserInitial()}</span>
                  )}
                </div>
                <div className="user-info-desktop">
                  <div className="user-name-desktop">{getUserDisplayName()}</div>
                  <div className="user-email-desktop">{getUserEmail()}</div>
                </div>
                <ChevronDown className={`chevron ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <button
                    onClick={() => {
                      navigate('/perfil');
                      setUserMenuOpen(false);
                    }}
                    className="dropdown-item"
                  >
                    <User className="w-4 h-4" />
                    <span>Meu Perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/configuracoes');
                      setUserMenuOpen(false);
                    }}
                    className="dropdown-item"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configurações</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    onClick={() => {
                      handleLogout();
                      setUserMenuOpen(false);
                    }}
                    className="dropdown-item logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;