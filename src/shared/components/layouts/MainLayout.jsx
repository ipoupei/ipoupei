import React, { useState, useEffect } from 'react';
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

// ===== IMPORTS DOS MODAIS =====
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';
import TransferenciasModal from '@modules/transacoes/components/TransferenciasModal';
import ContasModal from '@modules/contas/components/ContasModal';
import CartoesModal from '@modules/cartoes/components/CartoesModal';
import CategoriasModal from '@modules/categorias/components/CategoriasModal';

import '@shared/styles/MainLayout.css';



const modalStyles = `
.main-layout__content {
  margin-left: 230px !important;
  width: calc(100% - 230px) !important;
  transition: margin-left 0.3s ease-in-out !important;
}

.ipoupei-sidebar--collapsed ~ .main-layout .main-layout__content {
  margin-left: 56px !important;
  width: calc(100% - 56px) !important;
}

@media (max-width: 767px) {
  .main-layout__content {
    margin-left: 0 !important;
    width: 100% !important;
  }
}

.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: rgba(0, 0, 0, 0.5) !important;
  z-index: 1000 !important;
  display: flex !important;
  align-items: flex-start !important;
  justify-content: center !important;
  padding-top: 2rem !important;
  overflow-y: auto !important;
}

.forms-modal-container {
  position: relative !important;
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
  max-width: 90vw !important;
  max-height: calc(100vh - 4rem) !important;
  margin: 0 auto !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  max-width: 600px !important;
}

.forms-modal-container.modal-large {
  max-width: 800px !important;
}

.modal-overlay.active .forms-modal-container {
  animation: modalSlideIn 0.3s ease-out forwards;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding-top: 1rem !important;
  }
  .forms-modal-container {
    max-width: 95vw !important;
    max-height: calc(100vh - 2rem) !important;
  }
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = modalStyles;
  document.head.appendChild(style);
}

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { showNotification } = useUIStore();
  
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [modalStates, setModalStates] = useState({
    ReceitasModal: false,
    DespesasModal: false,
    DespesasCartaoModal: false,
    TransferenciasModal: false,
    ContasModal: false,
    CartoesModal: false,
    CategoriasModal: false
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

  const handleOpenModal = (modalType) => {
    if (modalStates.hasOwnProperty(modalType)) {
      setModalStates(prev => ({
        ...prev,
        [modalType]: true
      }));
    } else {
      showNotification(`Modal "${modalType}" não encontrado`, 'error');
    }
  };

  const handleCloseModal = (modalType) => {
    setModalStates(prev => ({
      ...prev,
      [modalType]: false
    }));
  };

  const handleModalSave = () => {
    console.log('Dados salvos com sucesso');
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
    <>
      <Sidebar
        onOpenModal={handleOpenModal}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      <ReceitasModal
        isOpen={modalStates.ReceitasModal}
        onClose={() => handleCloseModal('ReceitasModal')}
        onSave={handleModalSave}
      />

      <DespesasModal
        isOpen={modalStates.DespesasModal}
        onClose={() => handleCloseModal('DespesasModal')}
        onSave={handleModalSave}
      />

      <DespesasCartaoModal
        isOpen={modalStates.DespesasCartaoModal}
        onClose={() => handleCloseModal('DespesasCartaoModal')}
        onSave={handleModalSave}
      />

      <TransferenciasModal
        isOpen={modalStates.TransferenciasModal}
        onClose={() => handleCloseModal('TransferenciasModal')}
        onSave={handleModalSave}
      />

      <ContasModal
        isOpen={modalStates.ContasModal}
        onClose={() => handleCloseModal('ContasModal')}
        onSave={handleModalSave}
      />

      <CartoesModal
        isOpen={modalStates.CartoesModal}
        onClose={() => handleCloseModal('CartoesModal')}
        onSave={handleModalSave}
      />

      <CategoriasModal
        isOpen={modalStates.CategoriasModal}
        onClose={() => handleCloseModal('CategoriasModal')}
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
      
    </>
    
  );
  
};


export default MainLayout;