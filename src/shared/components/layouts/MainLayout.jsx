// src/shared/components/layout/MainLayout.jsx - VERSÃO COMPLETAMENTE LIMPA
import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  ArrowLeftRight,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MoreHorizontal,
  LogOut,
  BarChart3,
  Tags,
  Home,
  List
} from 'lucide-react';

// IMPORTS LIMPOS USANDO ALIASES DO VITE.CONFIG.JS
import useAuth from '@modules/auth/hooks/useAuth';
import usePeriodo from '@modules/transacoes/hooks/usePeriodo';
import NotificationContainer from '@shared/components/ui/NotificationContainer';

// MODAIS - IMPORTS LIMPOS
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';
import ContasModal from '@modules/contas/components/ContasModal';
import TransferenciasModal from '@modules/transacoes/components/TransferenciasModal';
import CartoesModal from '@modules/cartoes/components/CartoesModal';
import CategoriasModal from '@modules/categorias/components/CategoriasModal';

// CSS NO CAMINHO INFORMADO
import '@shared/styles/MainLayout.css';

const MainLayout = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado para controle do scroll compacto
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Estados para modais
  const [modals, setModals] = useState({
    receitas: false,
    despesas: false,
    despesasCartao: false,
    transferencias: false,
    contas: false,
    cartoes: false,
    categorias: false
  });
  
  // Hook de período
  const {
    currentDate,
    navigateMonth,
    getFormattedPeriod,
    isCurrentMonth,
    goToToday
  } = usePeriodo();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMaisMenu, setShowMaisMenu] = useState(false);

  // Controle do scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      
      if (!isScrolled && scrollTop > 180) {
        setIsScrolled(true);
      } else if (isScrolled && scrollTop < 120) {
        setIsScrolled(false);
      }
    };

    let timeoutId;
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 10);
    };

    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [isScrolled]);

  // Funções para modais
  const openModal = (modalName) => {
    console.log('🔓 Abrindo modal:', modalName);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    console.log('🔒 Fechando modal:', modalName);
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  // Handler de sucesso
  const handleTransacaoSalva = () => {
    console.log('✅ Transação salva!');
  };

  // Função para obter título da página
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
      case '/dashboard':
        return 'Acompanhamento Mensal';
      case '/transacoes':
        return 'Transações';
      case '/relatorios':
        return 'Relatórios';
      default:
        return 'iPoupei';
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-avatar-container')) {
        setShowUserMenu(false);
      }
      if (!event.target.closest('.action-button.mais') && !event.target.closest('.mais-menu')) {
        setShowMaisMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user?.user_metadata?.nome || 
                   user?.user_metadata?.full_name || 
                   user?.email?.split('@')[0] || 
                   'Usuário';

  return (
    <div className={`main-layout ${isScrolled ? 'scrolled' : ''}`}>
      <NotificationContainer />
      
      {/* Header Principal */}
      <header className="main-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <h1 className="app-title">💰 iPoupei</h1>
              {!isScrolled && <span className="page-title">{getPageTitle()}</span>}
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
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" />
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
                      onClick={handleLogout}
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

      {/* Ações Rápidas */}
      <section className="quick-actions">
        <div className="actions-container">
          {/* 1. Dashboard */}
          <button 
            className="action-button dashboard"
            onClick={() => navigate('/dashboard')}
            data-tooltip="Dashboard"
          >
            <Home size={isScrolled ? 16 : 20} />
            <span>Dashboard</span>
          </button>

          {/* 2. Transações */}
          <button 
            className="action-button transacoes"
            onClick={() => navigate('/transacoes')}
            data-tooltip="Transações"
          >
            <List size={isScrolled ? 16 : 20} />
            <span>Transações</span>
          </button>

          {/* 3. Receitas */}
          <button 
            className="action-button receita"
            onClick={() => openModal('receitas')}
            data-tooltip="Receitas"
          >
            <ArrowUpCircle size={isScrolled ? 16 : 20} />
            <span>Receitas</span>
          </button>

          {/* 4. Despesas */}
          <button 
            className="action-button despesa"
            onClick={() => openModal('despesas')}
            data-tooltip="Despesas"
          >
            <ArrowDownCircle size={isScrolled ? 16 : 20} />
            <span>Despesas</span>
          </button>

          {/* 5. Cartão */}
          <button 
            className="action-button cartao"
            onClick={() => openModal('despesasCartao')}
            data-tooltip="Cartão"
          >
            <CreditCard size={isScrolled ? 16 : 20} />
            <span>Cartão</span>
          </button>

          {/* 6. Transferir */}
          <button 
            className="action-button transferencia"
            onClick={() => openModal('transferencias')}
            data-tooltip="Transferir"
          >
            <ArrowLeftRight size={isScrolled ? 16 : 20} />
            <span>Transferir</span>
          </button>

          {/* 7. Contas */}
          <button 
            className="action-button contas"
            onClick={() => openModal('contas')}
            data-tooltip="Contas"
          >
            <Wallet size={isScrolled ? 16 : 20} />
            <span>Contas</span>
          </button>

          {/* 8. Mais */}
          <button 
            className="action-button mais"
            onClick={() => setShowMaisMenu(!showMaisMenu)}
            data-tooltip="Mais"
          >
            <MoreHorizontal size={isScrolled ? 16 : 20} />
            <span>Mais</span>
          </button>
        </div>

        {/* Menu Mais */}
        {showMaisMenu && (
          <div className="mais-menu">
            <button 
              className="mais-menu-item"
              onClick={() => {
                openModal('cartoes');
                setShowMaisMenu(false);
              }}
            >
              <CreditCard size={16} />
              Meus Cartões
            </button>
            <button 
              className="mais-menu-item"
              onClick={() => {
                openModal('categorias');
                setShowMaisMenu(false);
              }}
            >
              <Tags size={16} />
              Categorias
            </button>
            <button 
              className="mais-menu-item"
              onClick={() => {
                navigate('/relatorios');
                setShowMaisMenu(false);
              }}
            >
              <BarChart3 size={16} />
              Relatórios
            </button>
          </div>
        )}
      </section>

      {/* Trilha de Evolução */}
      {!isScrolled && (
        <section className="evolution-track">
          <div className="evolution-placeholder">
            <span className="placeholder-text">🚀 Trilha de Evolução - Em desenvolvimento</span>
          </div>
        </section>
      )}

      {/* Seletor de Período */}
      {!isScrolled && (
        <section className="filters-section">
          <div className="filters-container">
            <div className="period-selector-inline">
              <button 
                className="period-nav"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="current-period-inline">
                <Calendar size={18} />
                <span className="period-text">
                  {getFormattedPeriod()}
                </span>
                {!isCurrentMonth() && (
                  <button 
                    className="today-button" 
                    onClick={goToToday}
                  >
                    Hoje
                  </button>
                )}
              </div>

              <button 
                className="period-nav"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="additional-filters">
              {/* Espaço para filtros */}
            </div>
          </div>
        </section>
      )}

      {/* Conteúdo */}
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

      {/* Modais */}
      <ReceitasModal
        isOpen={modals.receitas}
        onClose={() => closeModal('receitas')}
        onSave={handleTransacaoSalva}
      />
      
      <DespesasModal
        isOpen={modals.despesas}
        onClose={() => closeModal('despesas')}
        onSave={handleTransacaoSalva}
      />
      
      <DespesasCartaoModal
        isOpen={modals.despesasCartao}
        onClose={() => closeModal('despesasCartao')}
        onSave={handleTransacaoSalva}
      />
      
      <TransferenciasModal
        isOpen={modals.transferencias}
        onClose={() => closeModal('transferencias')}
        onSave={handleTransacaoSalva}
      />
      
      <ContasModal
        isOpen={modals.contas}
        onClose={() => closeModal('contas')}
        onSave={handleTransacaoSalva}
      />
      
      <CartoesModal
        isOpen={modals.cartoes}
        onClose={() => closeModal('cartoes')}
        onSave={handleTransacaoSalva}
      />

      <CategoriasModal
        isOpen={modals.categorias}
        onClose={() => closeModal('categorias')}
        onSave={handleTransacaoSalva}
      />
    </div>
  );
};

export default MainLayout;