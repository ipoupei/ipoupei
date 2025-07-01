import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu,
  User,
  Star
} from 'lucide-react';
import useAuth from '@modules/auth/hooks/useAuth';
import { useUIStore } from '@store/uiStore';
import TrilhaDashboard from '@modules/dashboard/components/TrilhaDashboard';
import Sidebar from './Sidebar';

// ===== APENAS CONTAS MODAL PARA TESTE =====
import ContasModal from '@modules/contas/components/ContasModal';

import '@shared/styles/MainLayout.css';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { showNotification } = useUIStore();
  
  const layoutRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 🚨 APENAS ContasModal para teste
  const [modalStates, setModalStates] = useState({
    ContasModal: false
  });

  const userLevel = user?.user_metadata?.level || 7;

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 🚨 APENAS handle para ContasModal
  const handleOpenModal = (modalType) => {
    console.log(`🚀 Modal ${modalType} solicitado`);
    
    if (modalType === 'ContasModal') {
      setModalStates(prev => ({ ...prev, ContasModal: true }));
    } else {
      showNotification(`Modal ${modalType} desabilitado para teste`, 'info');
    }
  };

  const handleCloseModal = (modalType) => {
    setModalStates(prev => ({ ...prev, [modalType]: false }));
  };

  const handleModalSave = () => {
    console.log('💾 Dados salvos com sucesso');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showNotification('Logout realizado com sucesso', 'success');
    } catch (error) {
      showNotification('Erro ao fazer logout', 'error');
    }
  };

  const getPageTitle = () => {
    const currentPath = location.pathname;
    
    const pageMap = {
      '/': 'Dashboard',
      '/transacoes': 'Transações',
      '/relatorios': 'Relatórios',
      '/diagnostico': 'Diagnóstico',
      '/planejamento': 'Planejamento',
      '/investimentos': 'Investimentos',
      '/cartoes': 'Cartões',
      '/configuracoes': 'Configurações'
    };

    return pageMap[currentPath] || 'iPoupei';
  };

  return (
    <div ref={layoutRef} id="main-layout-container">
      <Sidebar
        onOpenModal={handleOpenModal}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* 🚨 APENAS ContasModal */}
      <ContasModal
        isOpen={modalStates.ContasModal}
        onClose={() => handleCloseModal('ContasModal')}
        onSave={handleModalSave}
      />

      <div className={`main-layout ${scrolled ? 'main-layout--scrolled' : ''}`}>
        <div 
          className="main-layout__content"
          style={{
            marginLeft: isMobile ? '0px' : (sidebarCollapsed ? '56px' : '230px'),
            width: isMobile ? '100%' : (sidebarCollapsed ? 'calc(100% - 56px)' : 'calc(100% - 230px)'),
            transition: 'margin-left 0.3s ease-in-out'
          }}
        >
          {isMobile && (
            <header className="main-layout__mobile-header">
              <button
                onClick={() => setSidebarOpen(true)}
                className="mobile-header__menu-button"
                aria-label="Abrir menu de navegação"
              >
                <Menu size={20} />
              </button>
              
              <div className="mobile-header__title">
                <div className="mobile-header__logo">
                  <span>iP</span>
                </div>
                <span>{getPageTitle()}</span>
              </div>
              
              <div className="mobile-header__actions">
                <button 
                  className="mobile-header__level-badge"
                  aria-label={`Nível ${userLevel}`}
                >
                  <span>Nível {userLevel}</span>
                </button>
                <div className="mobile-header__user-avatar">
                  <User size={16} />
                </div>
              </div>
            </header>
          )}

          <section className="main-layout__evolution-track" aria-label="Trilha de aprendizagem">
            <div className="evolution-track__container">
              <TrilhaDashboard
                className="evolution-track__component"
                onPassoClick={(passo) => {
                  showNotification(`Passo: ${passo.titulo}`, 'info');
                }}
              />
            </div>
          </section>

          <main className="main-layout__page-content" role="main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;