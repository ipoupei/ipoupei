import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ArrowUpDown,
  Receipt,
  Building2,
  Home,
  Target,
  Calculator,
  Wallet,
  BarChart3,
  PieChart,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  Star,
  Clock
} from 'lucide-react';
import '../../styles/sidebar.css';

const Sidebar = ({ 
  onOpenModal, 
  isCollapsed = false, 
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
  user = null,
  onLogout = () => {}
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('dashboard');

  // Sistema de níveis/XP do usuário
  const userLevel = user?.user_metadata?.level || 7;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  // Atualizar item ativo baseado na rota atual
  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const filter = searchParams.get('filter');
    
    if (path === '/' || path === '/dashboard') {
      setActiveItem('dashboard');
    } else if (path.startsWith('/transacoes')) {
      if (filter === 'receitas') {
        setActiveItem('transacoes-receitas');
      } else if (filter === 'despesas') {
        setActiveItem('transacoes-despesas');
      } else if (filter === 'cartoes') {
        setActiveItem('transacoes-cartoes');
      } else {
        setActiveItem('transacoes-todas');
      }
    } else if (path.startsWith('/relatorios')) {
      setActiveItem('relatorios');
    } else if (path.startsWith('/diagnostico')) {
      setActiveItem('diagnostico');
    } else if (path.startsWith('/planejamento')) {
      setActiveItem('planejamento');
    } else if (path.startsWith('/investimentos')) {
      setActiveItem('investimentos');
    } else if (path.startsWith('/configuracoes') || path.startsWith('/profile') || path.startsWith('/settings') || path.startsWith('/perfil')) {
      setActiveItem('configuracoes-perfil');
    }
  }, [location]);

  // ========== CONFIGURAÇÃO DOS MENUS ==========

  const acoesRapidas = [
    {
      id: 'receita',
      label: 'Nova Receita',
      icon: TrendingUp,
      modalType: 'ReceitasModal',
      variant: 'receita'
    },
    {
      id: 'despesa',
      label: 'Nova Despesa',
      icon: TrendingDown,
      modalType: 'DespesasModal',
      variant: 'despesa'
    },
    {
      id: 'despesa-cartao',
      label: 'Despesa Cartão',
      icon: CreditCard,
      modalType: 'DespesasCartaoModal',
      variant: 'cartao'
    },
    {
      id: 'transferencia',
      label: 'Transferência',
      icon: ArrowUpDown,
      modalType: 'TransferenciasModal',
      variant: 'transferencia'
    }
  ];

  const movimentacoes = [
    {
      id: 'transacoes-todas',
      label: 'Todas as Transações',
      icon: Receipt,
      path: '/transacoes'
    },
    {
      id: 'transacoes-receitas',
      label: 'Receitas',
      icon: TrendingUp,
      path: '/transacoes?filter=receitas'
    },
    {
      id: 'transacoes-despesas',
      label: 'Despesas',
      icon: TrendingDown,
      path: '/transacoes?filter=despesas'
    },
    {
      id: 'transacoes-cartoes',
      label: 'Cartões',
      icon: CreditCard,
      path: '/transacoes?filter=cartoes'
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: BarChart3,
      comingSoon: true
    },
    {
      id: 'analises',
      label: 'Análises',
      icon: PieChart,
      comingSoon: true
    }
  ];

  const outrasSecoes = {
    principal: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        path: '/'
      }
    ],
    gestao: [
      {
        id: 'gestao-contas',
        label: 'Minhas Contas',
        icon: Building2,
        modalType: 'ContasModal'
      },
      {
        id: 'gestao-cartoes',
        label: 'Meus Cartões',
        icon: CreditCard,
        modalType: 'CartoesModal'
      },
      {
        id: 'gestao-categorias',
        label: 'Minhas Categorias',
        icon: PieChart,
        modalType: 'CategoriasModal'
      }
    ],
    planejamento: [
      {
        id: 'planejamento',
        label: 'Planejamento',
        icon: Target,
        comingSoon: true
      },
      {
        id: 'diagnostico',
        label: 'Diagnóstico',
        icon: Calculator,
        comingSoon: true
      },
      {
        id: 'investimentos',
        label: 'Investimentos',
        icon: Wallet,
        comingSoon: true
      }
    ],
    configuracoes: [
      {
        id: 'configuracoes-perfil',
        label: 'Configurações',
        icon: Settings,
        path: '/configuracoes'
      }
    ]
  };

  // ========== HANDLERS ==========

  const handleAcaoRapida = (acao) => {
    console.log('🚀 Tentando abrir modal:', acao.modalType);
    console.log('📋 Função onOpenModal disponível:', typeof onOpenModal);
    console.log('📋 Dados da ação:', acao);
    
    if (onOpenModal && acao.modalType) {
      onOpenModal(acao.modalType);
    } else {
      console.error('❌ onOpenModal não disponível ou modalType indefinido');
    }
    
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleNavigation = (item) => {
    console.log('🧭 handleNavigation chamado com item:', item);
    console.log('🔍 Item tem modalType?', !!item.modalType);
    console.log('🔍 Item tem path?', !!item.path);
    console.log('🔍 Item tem comingSoon?', !!item.comingSoon);
    
    // Se tem modalType, abrir modal
    if (item.modalType && onOpenModal) {
      console.log('🚀 Tentando abrir modal via navegação:', item.modalType);
      console.log('📋 Dados do item:', item);
      
      onOpenModal(item.modalType);
      if (onMobileClose) {
        onMobileClose();
      }
      return;
    }

    // Se tem comingSoon, não fazer nada por enquanto
    if (item.comingSoon) {
      // Pode implementar um toast ou notificação aqui no futuro
      console.log(`${item.label} - Em breve!`);
      return;
    }

    // Se tem path, navegar
    if (item.path) {
      console.log('🧭 Navegando para:', item.path);
      setActiveItem(item.id);
      navigate(item.path);
    } else {
      console.warn('⚠️ Item não tem path nem modalType:', item);
    }
    
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    if (onMobileClose) {
      onMobileClose();
    }
  };

  // ========== COMPONENTES AUXILIARES ==========

  const SectionTitle = ({ title, icon: Icon }) => (
    <div className="ipoupei-sidebar__section-title">
      {Icon && <Icon className="ipoupei-sidebar__section-icon" />}
      <span className="ipoupei-sidebar__section-label">{title}</span>
    </div>
  );

  const MenuItem = ({ item, isActive, onClick, variant = null }) => {
    const Icon = item.icon;
    
    const itemClasses = [
      'ipoupei-sidebar__item',
      isActive && 'ipoupei-sidebar__item--active',
      variant && `ipoupei-sidebar__item--${variant}`,
      item.comingSoon && 'ipoupei-sidebar__item--coming-soon'
    ].filter(Boolean).join(' ');
    
    return (
      <button
        className={itemClasses}
        onClick={onClick}
        title={isCollapsed ? item.label : ''}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        disabled={item.comingSoon}
      >
        <Icon className="ipoupei-sidebar__item-icon" />
        {!isCollapsed && (
          <div className="ipoupei-sidebar__item-content">
            <span className="ipoupei-sidebar__item-text">{item.label}</span>
            {item.comingSoon && (
              <span className="ipoupei-sidebar__item-badge">
                <Clock size={10} />
                Em breve
              </span>
            )}
          </div>
        )}
      </button>
    );
  };

  // ========== CLASSES CONDICIONAIS ==========
  const sidebarClasses = [
    'ipoupei-sidebar',
    isCollapsed && 'ipoupei-sidebar--collapsed',
    isMobileOpen && 'ipoupei-sidebar--mobile-open',
    !isMobileOpen && window.innerWidth < 768 && 'ipoupei-sidebar--mobile-hidden'
  ].filter(Boolean).join(' ');

  // ========== RENDER ==========
  console.log('🔧 Sidebar - Configurações item:', outrasSecoes.configuracoes[0]);
  console.log('🔧 Sidebar - onOpenModal disponível:', typeof onOpenModal);
  
  return (
    <>
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div className="ipoupei-sidebar-overlay" onClick={onMobileClose} />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        
        {/* ========== HEADER ========== */}
        <div className="ipoupei-sidebar__header">
          <div className="ipoupei-sidebar__brand">
            <div className="ipoupei-sidebar__logo">iP</div>
            {!isCollapsed && (
              <div className="ipoupei-sidebar__brand-text">
                <h1 className="ipoupei-sidebar__title">iPoupei</h1>
                <p className="ipoupei-sidebar__subtitle">Gestão Financeira</p>
              </div>
            )}
          </div>

          <div className="ipoupei-sidebar__controls">
            {onToggleCollapse && (
              <button 
                className="ipoupei-sidebar__control-btn ipoupei-sidebar__control-btn--collapse" 
                onClick={onToggleCollapse}
                aria-label="Recolher sidebar"
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}
            
            {onMobileClose && (
              <button 
                className="ipoupei-sidebar__control-btn ipoupei-sidebar__control-btn--close" 
                onClick={onMobileClose}
                aria-label="Fechar sidebar"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ========== PERFIL USUÁRIO ========== */}
        {!isCollapsed && (
          <div className="ipoupei-sidebar__user">
            <div className="ipoupei-sidebar__avatar">
              <User size={16} />
            </div>
            <div className="ipoupei-sidebar__user-info">
              <span className="ipoupei-sidebar__name">{userName}</span>
              <span className="ipoupei-sidebar__greeting">Seja bem-vindo!</span>
            </div>
            <button className="ipoupei-sidebar__level" aria-label={`Nível ${userLevel}`}>
              <Star size={12} />
              <span>Nível {userLevel}</span>
            </button>
          </div>
        )}

        {/* ========== CONTENT ========== */}
        <div className="ipoupei-sidebar__content">
          
          {/* SEÇÃO 1: DASHBOARD */}
          <div className="ipoupei-sidebar__section">
            <div className="ipoupei-sidebar__menu">
              {outrasSecoes.principal.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isActive={activeItem === item.id}
                  onClick={() => handleNavigation(item)}
                />
              ))}
            </div>
          </div>

          {/* SEÇÃO 2: AÇÕES RÁPIDAS */}
          <div className="ipoupei-sidebar__section">
            <SectionTitle title="Ações Rápidas" icon={Zap} />
            <div className="ipoupei-sidebar__menu">
              {acoesRapidas.map((acao) => (
                <MenuItem
                  key={acao.id}
                  item={acao}
                  isActive={false}
                  onClick={() => handleAcaoRapida(acao)}
                  variant={acao.variant}
                />
              ))}
            </div>
          </div>

          {/* SEÇÃO 3: GESTÃO */}
          <div className="ipoupei-sidebar__section">
            <SectionTitle title="Gestão" icon={Settings} />
            <div className="ipoupei-sidebar__menu">
              {outrasSecoes.gestao.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isActive={activeItem === item.id}
                  onClick={() => handleNavigation(item)}
                />
              ))}
            </div>
          </div>

          {/* SEÇÃO 4: MOVIMENTAÇÕES */}
          <div className="ipoupei-sidebar__section">
            <SectionTitle title="Movimentações" icon={Receipt} />
            <div className="ipoupei-sidebar__menu">
              {movimentacoes.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isActive={activeItem === item.id}
                  onClick={() => handleNavigation(item)}
                />
              ))}
            </div>
          </div>

          {/* SEÇÃO 5: PLANEJAMENTO */}
          <div className="ipoupei-sidebar__section">
            <SectionTitle title="Planejamento" icon={Target} />
            <div className="ipoupei-sidebar__menu">
              {outrasSecoes.planejamento.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isActive={activeItem === item.id}
                  onClick={() => handleNavigation(item)}
                />
              ))}
            </div>
          </div>

          {/* SEÇÃO 6: CONFIGURAÇÕES */}
          <div className="ipoupei-sidebar__section">
            <SectionTitle title="Configurações" icon={User} />
            <div className="ipoupei-sidebar__menu">
              {outrasSecoes.configuracoes.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isActive={activeItem === item.id}
                  onClick={() => handleNavigation(item)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ========== FOOTER ========== */}
        <div className="ipoupei-sidebar__footer">
          <div className="ipoupei-sidebar__menu">
            <MenuItem
              item={{
                id: 'logout',
                label: 'Sair',
                icon: LogOut
              }}
              isActive={false}
              onClick={handleLogout}
              variant="logout"
            />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;