// src/shared/components/layout/MainLayout.jsx - COM DIAGNÓSTICO SIMPLES
import React, { useState, useEffect, Suspense, useCallback, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  ArrowLeftRight,
  Wallet,
  MoreHorizontal,
  LogOut,
  BarChart3,
  Tags,
  Home,
  List,
  Brain
} from 'lucide-react';

// IMPORTS LIMPOS
import useAuth from '@modules/auth/hooks/useAuth';
import NotificationContainer from '@shared/components/ui/NotificationContainer';

// MODAIS - IMPORTS LIMPOS
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';
import ContasModal from '@modules/contas/components/ContasModal';
import TransferenciasModal from '@modules/transacoes/components/TransferenciasModal';
import CartoesModal from '@modules/cartoes/components/CartoesModal';
import CategoriasModal from '@modules/categorias/components/CategoriasModal';
import TrilhaDashboard from '@modules/dashboard/components/TrilhaDashboard';

// CSS
import '@shared/styles/MainLayout.css';

// ✅ Componente de Header isolado para evitar re-renders
const Header = React.memo(({ user, isScrolled, pageTitle, showUserMenu, onToggleUserMenu, onLogout }) => {
  const userName = useMemo(() => {
    return user?.user_metadata?.nome || 
           user?.user_metadata?.full_name || 
           user?.email?.split('@')[0] || 
           'Usuário';
  }, [user]);

  const avatarUrl = useMemo(() => {
    return user?.user_metadata?.avatar_url;
  }, [user]);

  return (
    <header className="main-header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="app-title">💰 iPoupei</h1>
            {!isScrolled && <span className="page-title">{pageTitle}</span>}
          </div>
        </div>
        
        <div className="header-right">
          <div className="user-section">
            {!isScrolled && (
              <div className="user-greeting">
                <span className="greeting-text">Olá, {userName}!</span>
                <span className="greeting-subtitle">Seja bem-vindo</span>
              </div>
            )}
            
            <div className="user-avatar-container">
              <button 
                className="user-avatar"
                onClick={onToggleUserMenu}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" />
                ) : (
                  <User size={isScrolled ? 20 : 24} />
                )}
              </button>
              
              {showUserMenu && (
                <div className="user-menu">
                  <a href="/profile" className="user-menu-item">
                    <User size={16} />
                    Perfil
                  </a>
                  <button 
                    className="user-menu-item logout"
                    onClick={onLogout}
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

// ✅ Componente de Ações isolado - COM DIAGNÓSTICO SIMPLES
const QuickActions = React.memo(({ 
  isScrolled, 
  showMaisMenu, 
  onToggleMaisMenu,
  onNavigateDashboard,
  onNavigateTransacoes,
  onNavigateDiagnostico,
  onOpenReceitas,
  onOpenDespesas,
  onOpenDespesasCartao,
  onOpenTransferencias,
  onOpenContas,
  onOpenCartoes,
  onOpenCategorias,
  onNavigateRelatorios
}) => {
  return (
    <section className="quick-actions">
      <div className="actions-container">
        <button 
          className="action-button dashboard"
          onClick={onNavigateDashboard}
          data-tooltip="Dashboard"
        >
          <Home size={isScrolled ? 16 : 20} />
          <span>Dashboard</span>
        </button>

        <button 
          className="action-button diagnostico"
          onClick={onNavigateDiagnostico}
          data-tooltip="Diagnóstico Financeiro"
        >
          <Brain size={isScrolled ? 16 : 20} />
          <span>Diagnóstico</span>
        </button>

        <button 
          className="action-button transacoes"
          onClick={onNavigateTransacoes}
          data-tooltip="Transações"
        >
          <List size={isScrolled ? 16 : 20} />
          <span>Transações</span>
        </button>

        <button 
          className="action-button receita"
          onClick={onOpenReceitas}
          data-tooltip="Receitas"
        >
          <ArrowUpCircle size={isScrolled ? 16 : 20} />
          <span>Receitas</span>
        </button>

        <button 
          className="action-button despesa"
          onClick={onOpenDespesas}
          data-tooltip="Despesas"
        >
          <ArrowDownCircle size={isScrolled ? 16 : 20} />
          <span>Despesas</span>
        </button>

        <button 
          className="action-button cartao"
          onClick={onOpenDespesasCartao}
          data-tooltip="Cartão"
        >
          <CreditCard size={isScrolled ? 16 : 20} />
          <span>Cartão</span>
        </button>

        <button 
          className="action-button transferencia"
          onClick={onOpenTransferencias}
          data-tooltip="Transferir"
        >
          <ArrowLeftRight size={isScrolled ? 16 : 20} />
          <span>Transferir</span>
        </button>

        <button 
          className="action-button mais"
          onClick={onToggleMaisMenu}
          data-tooltip="Mais"
        >
          <MoreHorizontal size={isScrolled ? 16 : 20} />
          <span>Mais</span>
        </button>
      </div>

      {showMaisMenu && (
        <div className="mais-menu">
          <button 
            className="mais-menu-item"
            onClick={onOpenContas}
          >
            <Wallet size={16} />
            Minhas Contas
          </button>
          <button 
            className="mais-menu-item"
            onClick={onOpenCartoes}
          >
            <CreditCard size={16} />
            Meus Cartões
          </button>
          <button 
            className="mais-menu-item"
            onClick={onOpenCategorias}
          >
            <Tags size={16} />
            Categorias
          </button>
          <button 
            className="mais-menu-item"
            onClick={onNavigateRelatorios}
          >
            <BarChart3 size={16} />
            Relatórios
          </button>
        </div>
      )}
    </section>
  );
});

const MainLayout = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // ✅ Estados básicos - mínimos necessários
  const [isScrolled, setIsScrolled] = useState(false);
  const [modals, setModals] = useState({
    receitas: false,
    despesas: false,
    despesasCartao: false,
    transferencias: false,
    contas: false,
    cartoes: false,
    categorias: false
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMaisMenu, setShowMaisMenu] = useState(false);

  // ✅ Refs para performance
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // ✅ Scroll handler ULTRA otimizado - LIMITADO
  useEffect(() => {
    let rafId = null;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      isScrollingRef.current = true;
      
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        setIsScrolled(prev => {
          const shouldBeScrolled = scrollY > 120;
          if (shouldBeScrolled !== prev) {
            return shouldBeScrolled;
          }
          return prev;
        });
        
        isScrollingRef.current = false;
      });
    };

    const throttledScroll = () => {
      if (scrollTimeoutRef.current) return;
      
      scrollTimeoutRef.current = setTimeout(() => {
        handleScroll();
        scrollTimeoutRef.current = null;
      }, 200);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Handlers ESTÁTICOS (não causam re-renders)
  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  }, []);

  const handleTransacaoSalva = useCallback(() => {
    // Vazio para evitar side effects desnecessários
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }, [signOut, navigate]);

  // ✅ Handlers de toggle - ESTÁTICOS
  const toggleUserMenu = useCallback(() => setShowUserMenu(prev => !prev), []);
  const toggleMaisMenu = useCallback(() => setShowMaisMenu(prev => !prev), []);

  // ✅ Handlers de navegação - ESTÁTICOS
  const navigateToDashboard = useCallback(() => navigate('/dashboard'), [navigate]);
  const navigateToTransacoes = useCallback(() => navigate('/transacoes'), [navigate]);
  const navigateToDiagnostico = useCallback(() => navigate('/diagnostico'), [navigate]);

  // ✅ Handlers de modal - ESTÁTICOS
  const openReceitas = useCallback(() => openModal('receitas'), [openModal]);
  const openDespesas = useCallback(() => openModal('despesas'), [openModal]);
  const openDespesasCartao = useCallback(() => openModal('despesasCartao'), [openModal]);
  const openTransferencias = useCallback(() => openModal('transferencias'), [openModal]);
  const openContas = useCallback(() => {
    openModal('contas');
    setShowMaisMenu(false);
  }, [openModal]);
  
  const openCartoes = useCallback(() => {
    openModal('cartoes');
    setShowMaisMenu(false);
  }, [openModal]);
  
  const openCategorias = useCallback(() => {
    openModal('categorias');
    setShowMaisMenu(false);
  }, [openModal]);
  
  const navigateRelatorios = useCallback(() => {
    navigate('/relatorios');
    setShowMaisMenu(false);
  }, [navigate]);

  // ✅ Click outside handler - ULTRA otimizado COM CONDIÇÕES
  useEffect(() => {
    if (!showUserMenu && !showMaisMenu) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      
      if (showUserMenu && !target.closest('.user-avatar-container')) {
        setShowUserMenu(false);
      }
      
      if (showMaisMenu && !target.closest('.action-button.mais') && !target.closest('.mais-menu')) {
        setShowMaisMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showMaisMenu]);

  // ✅ Valores memoizados - OTIMIZADOS
  const pageTitle = useMemo(() => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Acompanhamento Mensal';
      case '/transacoes':
        return 'Transações';
      case '/diagnostico':
        return 'Diagnóstico Financeiro';
      case '/relatorios':
        return 'Relatórios';
      default:
        return 'iPoupei';
    }
  }, [location.pathname]);

  const layoutClass = useMemo(() => {
    return `main-layout ${isScrolled ? 'scrolled' : ''}`;
  }, [isScrolled]);

  const isDashboard = useMemo(() => {
    return location.pathname === '/dashboard';
  }, [location.pathname]);

  return (
    <div className={layoutClass}>
      <NotificationContainer />
      
      <Header 
        user={user}
        isScrolled={isScrolled}
        pageTitle={pageTitle}
        showUserMenu={showUserMenu}
        onToggleUserMenu={toggleUserMenu}
        onLogout={handleLogout}
      />

      <QuickActions 
        isScrolled={isScrolled}
        showMaisMenu={showMaisMenu}
        onToggleMaisMenu={toggleMaisMenu}
        onNavigateDashboard={navigateToDashboard}
        onNavigateTransacoes={navigateToTransacoes}
        onNavigateDiagnostico={navigateToDiagnostico}
        onOpenReceitas={openReceitas}
        onOpenDespesas={openDespesas}
        onOpenDespesasCartao={openDespesasCartao}
        onOpenTransferencias={openTransferencias}
        onOpenContas={openContas}
        onOpenCartoes={openCartoes}
        onOpenCategorias={openCategorias}
        onNavigateRelatorios={navigateRelatorios}
      />

      {/* ✅ Trilha de Evolução - Condicionalmente renderizada */}
      {!isScrolled && isDashboard && (
        <section className="evolution-track">
          <TrilhaDashboard 
            passos={[]} 
            passoAtual="3"
            onPassoClick={(passo) => console.log('Passo clicado:', passo)}
          />
        </section>
      )}

      {/* ✅ Conteúdo */}
      <main className="main-content">
        <Suspense fallback={
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando...</p>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>

      {/* ✅ Modais - Renderização EXTREMAMENTE condicional */}
      {modals.receitas && (
        <ReceitasModal
          isOpen={true}
          onClose={() => closeModal('receitas')}
          onSave={handleTransacaoSalva}
        />
      )}
      
      {modals.despesas && (
        <DespesasModal
          isOpen={true}
          onClose={() => closeModal('despesas')}
          onSave={handleTransacaoSalva}
        />
      )}
      
      {modals.despesasCartao && (
        <DespesasCartaoModal
          isOpen={true}
          onClose={() => closeModal('despesasCartao')}
          onSave={handleTransacaoSalva}
        />
      )}
      
      {modals.transferencias && (
        <TransferenciasModal
          isOpen={true}
          onClose={() => closeModal('transferencias')}
          onSave={handleTransacaoSalva}
        />
      )}
      
      {modals.contas && (
        <ContasModal
          isOpen={true}
          onClose={() => closeModal('contas')}
          onSave={handleTransacaoSalva}
        />
      )}
      
      {modals.cartoes && (
        <CartoesModal
          isOpen={true}
          onClose={() => closeModal('cartoes')}
          onSave={handleTransacaoSalva}
        />
      )}

      {modals.categorias && (
        <CategoriasModal
          isOpen={true}
          onClose={() => closeModal('categorias')}
          onSave={handleTransacaoSalva}
        />
      )}
    </div>
  );
};

export default React.memo(MainLayout);