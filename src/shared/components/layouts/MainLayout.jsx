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

/* CSS para posicionamento correto dos modais */
const modalStyles = `
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

// Injetar estilos CSS para os modais
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = modalStyles;
  document.head.appendChild(style);
}

/**
 * MainLayout - Layout principal da aplicação iPoupei
 * Atualizado para gerenciar corretamente os modais
 */
const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    openModal, 
    closeModal,
    modals,
    showNotification 
  } = useUIStore();
  
  // Estados do layout
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Estados dos modais (removido UserProfile)
  const [modalStates, setModalStates] = useState({
    ReceitasModal: false,
    DespesasModal: false,
    DespesasCartaoModal: false,
    TransferenciasModal: false,
    ContasModal: false,
    CartoesModal: false,
    CategoriasModal: false
  });

  // Sistema de níveis/XP do usuário
  const userLevel = user?.user_metadata?.level || 7;
  const userXP = user?.user_metadata?.xp || 2847;

  // Detectar mobile e scroll
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

  // Função para abrir modais
  const handleOpenModal = (modalType) => {
    console.log('🚀 MainLayout recebeu pedido para abrir modal:', modalType);
    
    // Verificar se é um modal válido
    if (modalStates.hasOwnProperty(modalType)) {
      setModalStates(prev => ({
        ...prev,
        [modalType]: true
      }));
      console.log('✅ Modal aberto:', modalType);
    } else {
      console.error('❌ Tipo de modal não reconhecido:', modalType);
      console.error('❌ Modais disponíveis:', Object.keys(modalStates));
      showNotification(`Modal "${modalType}" não encontrado`, 'error');
    }
  };

  // Função para fechar modais
  const handleCloseModal = (modalType) => {
    console.log('❌ Fechando modal:', modalType);
    setModalStates(prev => ({
      ...prev,
      [modalType]: false
    }));
  };

  // Função para salvar dados (callback comum)
  const handleModalSave = () => {
    // Aqui você pode adicionar lógica comum para todos os modais
    // como recarregar dados, etc.
    console.log('💾 Dados salvos com sucesso');
  };

  // Handlers
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
      '/configuracoes': 'Configurações'
    };

    return pageMap[currentPath] || 'iPoupei';
  };

  return (
    <div className={`main-layout ${scrolled ? 'main-layout--scrolled' : ''}`}>
      
      {/* Nova Sidebar */}
      <Sidebar
        onOpenModal={handleOpenModal}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-layout__content">
        {/* Header Mobile */}
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

        {/* Trilha de Aprendizagem - Fixa no Topo */}
        <section className="main-layout__evolution-track" aria-label="Trilha de aprendizagem">
          <div className="evolution-track__container">
            <TrilhaDashboard
              className="evolution-track__component"
              onPassoClick={(passo) => {
                console.log('Passo da trilha clicado:', passo);
                showNotification(`Passo: ${passo.titulo}`, 'info');
              }}
            />
          </div>
        </section>

        {/* Área de Conteúdo Dinâmico */}
        <main className="main-layout__page-content" role="main">
          <Outlet />
        </main>
      </div>

      {/* ===== MODAIS ===== */}
      
      {/* Modal de Receitas */}
      <ReceitasModal
        isOpen={modalStates.ReceitasModal}
        onClose={() => handleCloseModal('ReceitasModal')}
        onSave={handleModalSave}
      />

      {/* Modal de Despesas */}
      <DespesasModal
        isOpen={modalStates.DespesasModal}
        onClose={() => handleCloseModal('DespesasModal')}
        onSave={handleModalSave}
      />

      {/* Modal de Despesas Cartão */}
      <DespesasCartaoModal
        isOpen={modalStates.DespesasCartaoModal}
        onClose={() => handleCloseModal('DespesasCartaoModal')}
        onSave={handleModalSave}
      />

      {/* Modal de Transferências */}
      <TransferenciasModal
        isOpen={modalStates.TransferenciasModal}
        onClose={() => handleCloseModal('TransferenciasModal')}
        onSave={handleModalSave}
      />

      {/* Modal de Contas */}
      <ContasModal
        isOpen={modalStates.ContasModal}
        onClose={() => handleCloseModal('ContasModal')}
        onSave={handleModalSave}
      />

      {/* Modal de Cartões */}
      <CartoesModal
        isOpen={modalStates.CartoesModal}
        onClose={() => handleCloseModal('CartoesModal')}
        onSave={handleModalSave}
      />

      {/* Modal de Categorias */}
      <CategoriasModal
        isOpen={modalStates.CategoriasModal}
        onClose={() => handleCloseModal('CategoriasModal')}
        onSave={handleModalSave}
      />

      {/* Modal de Perfil do Usuário */}
      {modalStates.UserProfile && (
        <div className="modal-overlay active">
          <div className="forms-modal-container modal-large">
            <UserProfile
              isOpen={modalStates.UserProfile}
              onClose={() => handleCloseModal('UserProfile')}
              onSave={handleModalSave}
            />
          </div>
        </div>
      )}


    </div>
  );
};

export default MainLayout;