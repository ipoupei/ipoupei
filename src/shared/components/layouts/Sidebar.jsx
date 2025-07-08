import React, { useState, useEffect, useCallback } from 'react';
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
  Star
} from 'lucide-react';
import '../../styles/sidebar.css';

/**
 * Componente Sidebar refatorado do iPoupei
 * Contém toda a lógica e dados de menu internamente
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Function} props.onOpenModal - Função para abrir modais
 * @param {boolean} props.isCollapsed - Estado de colapso da sidebar
 * @param {Function} props.onToggleCollapse - Função para alternar colapso
 * @param {boolean} props.isMobileOpen - Estado de abertura no mobile
 * @param {Function} props.onMobileClose - Função para fechar no mobile
 * @param {Object} props.user - Dados do usuário logado
 * @param {Function} props.onLogout - Função de logout
 */
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

  // ========== DADOS DO USUÁRIO ==========
  const userLevel = user?.user_metadata?.level || 7;
  const userName = user?.user_metadata?.full_name || 
                   user?.email?.split('@')[0] || 
                   'Usuário';

  // ========== CONFIGURAÇÃO DOS MENUS ==========
  const menuSections = {
    principal: {
      id: 'principal',
      title: null, // Sem título para ficar mais limpo
      icon: null,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/',
          modalType: null,
          comingSoon: false,
          variant: 'dashboard'
        }
      ]
    },

    acoesRapidas: {
      id: 'acoes-rapidas',
      title: 'Ações Rápidas',
      icon: Zap,
      items: [
        {
          id: 'transacao-unificada',
          label: 'Nova Transação',
          icon: Receipt, // ou outro ícone de sua escolha
          path: null,
          modalType: 'UnifiedTransactionModal',
          comingSoon: false,
          variant: 'transacao'
        },
        
/*
        {
          id: 'receita',
          label: 'Nova Receita',
          icon: TrendingUp,
          path: null,
          modalType: 'ReceitasModal',
          comingSoon: false,
          variant: 'receita'
        },
        
        {
          id: 'despesa',
          label: 'Nova Despesa',
          icon: TrendingDown,
          path: null,
          modalType: 'DespesasModal',
          comingSoon: false,
          variant: 'despesa'
        },
        {
          id: 'despesa-cartao',
          label: 'Despesa Cartão',
          icon: CreditCard,
          path: null,
          modalType: 'DespesasCartaoModal',
          comingSoon: false,
          variant: 'cartao'
        },
        {
          id: 'transferencia',
          label: 'Transferência',
          icon: ArrowUpDown,
          path: null,
          modalType: 'TransferenciasModal',
          comingSoon: false,
          variant: 'transferencia'
        }
*/
      ]
    },

    gestao: {
      id: 'gestao',
      title: 'Gestão',
      icon: Settings,
      items: [
        {
          id: 'gestao-contas',
          label: 'Minhas Contas',
          icon: Building2,
          path: null,
          modalType: 'ContasModal',
          comingSoon: false,
          variant: null
        },
        {
          id: 'cartoes-modal',
          label: 'Meus Cartões',
          icon: CreditCard,
          path: null,
          modalType: 'CartoesModal',
          comingSoon: false,
          variant: null
        },
        {
          id: 'gestao-categorias',
          label: 'Minhas Categorias',
          icon: PieChart,
          path: null,
          modalType: 'CategoriasModal',
          comingSoon: false,
          variant: null
        }
      ]
    },

    movimentacoes: {
      id: 'movimentacoes',
      title: 'Movimentações',
      icon: Receipt,
      items: [
        {
          id: 'faturas-cartoes',
          label: 'Faturas dos Cartões',
          icon: CreditCard,
          path: '/cartoes/faturas',
          modalType: null,
          comingSoon: false,
          variant: 'cartao'
        },
        {
          id: 'transacoes-todas',
          label: 'Todas as Transações',
          icon: Receipt,
          path: '/transacoes',
          modalType: null,
          comingSoon: false,
          variant: null
        },
        {
          id: 'transacoes-receitas',
          label: 'Receitas',
          icon: TrendingUp,
          path: '/transacoes?filter=receitas',
          modalType: null,
          comingSoon: false,
          variant: 'receita'
        },
        {
          id: 'transacoes-despesas',
          label: 'Despesas',
          icon: TrendingDown,
          path: '/transacoes?filter=despesas',
          modalType: null,
          comingSoon: false,
          variant: 'despesa'
        },

        {
          id: 'relatorios',
          label: 'Relatórios',
          icon: BarChart3,
          path: null,
          modalType: null,
          comingSoon: true,
          variant: null
        },
        {
          id: 'analises',
          label: 'Análises',
          icon: PieChart,
          path: null,
          modalType: null,
          comingSoon: true,
          variant: null
        }
      ]
    },

    planejamento: {
      id: 'planejamento',
      title: 'Planejamento',
      icon: Target,
      items: [
        {
          id: 'planejamento',
          label: 'Planejamento',
          icon: Target,
          path: null,
          modalType: null,
          comingSoon: true,
          variant: null
        },
        {
          id: 'diagnostico',
          label: 'Diagnóstico',
          icon: Calculator,
          path: '/diagnostico',
          modalType: null,
          comingSoon: false,
          variant: null
        },
        {
          id: 'investimentos',
          label: 'Investimentos',
          icon: Wallet,
          path: null,
          modalType: null,
          comingSoon: true,
          variant: null
        }
      ]
    },

    configuracoes: {
      id: 'configuracoes',
      title: 'Configurações',
      icon: User,
      items: [
        {
          id: 'configuracoes-perfil',
          label: 'Configurações',
          icon: Settings,
          path: '/configuracoes',
          modalType: null,
          comingSoon: false,
          variant: null
        }
      ]
    }
  };

  // Item especial para logout
  const logoutItem = {
    id: 'logout',
    label: 'Sair',
    icon: LogOut,
    path: null,
    modalType: null,
    comingSoon: false,
    variant: 'logout'
  };

  // Ordem das seções
  const sectionOrder = [
    'principal',
    'acoesRapidas', 
    'gestao',
    'movimentacoes',
    'planejamento',
    'configuracoes'
  ];

  // ========== FUNÇÕES UTILITÁRIAS ==========

  /**
   * Determina o item ativo baseado na rota atual
   */
  const getActiveItemFromRoute = useCallback((pathname, searchParams) => {
    const filter = searchParams.get('filter');
    
    if (pathname === '/' || pathname === '/dashboard') {
      return 'dashboard';
    }
    
    // Rotas específicas de cartões
    if (pathname.startsWith('/cartoes/gestao') || pathname === '/cartoes/gestao') {
      return 'gestao-cartoes';
    }
    
    if (pathname.startsWith('/cartoes/faturas') || pathname === '/cartoes/faturas') {
      return 'faturas-cartoes';
    }
    
    if (pathname.startsWith('/cartoes')) {
      return 'gestao-cartoes';
    }
    
    if (pathname.startsWith('/transacoes')) {
      if (filter === 'receitas') return 'transacoes-receitas';
      if (filter === 'despesas') return 'transacoes-despesas';
      if (filter === 'cartoes') return 'transacoes-cartoes';
      return 'transacoes-todas';
    }
    
    if (pathname.startsWith('/relatorios')) return 'relatorios';
    if (pathname.startsWith('/diagnostico')) return 'diagnostico';
    if (pathname.startsWith('/planejamento')) return 'planejamento';
    if (pathname.startsWith('/investimentos')) return 'investimentos';
    
    if (pathname.startsWith('/configuracoes') || 
        pathname.startsWith('/profile') || 
        pathname.startsWith('/settings') || 
        pathname.startsWith('/perfil')) {
      return 'configuracoes-perfil';
    }
    
    return 'dashboard';
  }, []);

  // ========== ATUALIZAÇÃO DO ITEM ATIVO ==========
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const newActiveItem = getActiveItemFromRoute(location.pathname, searchParams);
    setActiveItem(newActiveItem);
  }, [location, getActiveItemFromRoute]);

  // ========== HANDLERS ==========

  /**
   * Handler para ações rápidas (abertura de modais)
   */
  const handleAcaoRapida = useCallback((item) => {
    console.log('🚀 Tentando abrir modal:', item.modalType);
    
    if (onOpenModal && item.modalType) {
      onOpenModal(item.modalType);
    } else {
      console.error('❌ onOpenModal não disponível ou modalType indefinido');
    }
    
    if (onMobileClose) {
      onMobileClose();
    }
  }, [onOpenModal, onMobileClose]);

  /**
   * Handler para navegação e interações dos items
   */
  const handleNavigation = useCallback((item) => {
    console.log('🧭 handleNavigation chamado com item:', item);
    
    // Verificar se é "Em breve"
    if (item.comingSoon) {
      console.log(`${item.label} - Esta funcionalidade ainda está em desenvolvimento. Em breve estará disponível!`);
      // TODO: Implementar toast quando sistema estiver disponível
      return;
    }

    // Se tem modalType, abrir modal
    if (item.modalType && onOpenModal) {
      console.log('🚀 Tentando abrir modal via navegação:', item.modalType);
      onOpenModal(item.modalType);
      if (onMobileClose) {
        onMobileClose();
      }
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
  }, [onOpenModal, onMobileClose, navigate]);

  /**
   * Handler para logout
   */
  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    }
    if (onMobileClose) {
      onMobileClose();
    }
  }, [onLogout, onMobileClose]);

  // ========== COMPONENTES AUXILIARES ==========

  /**
   * Componente para título de seção
   */
  const SectionTitle = ({ section }) => {
    if (!section.title) return null;
    
    const Icon = section.icon;
    
    return (
      <div className="ipoupei-sidebar__section-title">
        {Icon && <Icon className="ipoupei-sidebar__section-icon" />}
        <span className="ipoupei-sidebar__section-label">{section.title}</span>
      </div>
    );
  };

  /**
   * Componente para item de menu
   */
  const MenuItem = ({ item, isActive, onClick, variant = null }) => {
    const Icon = item.icon;
    const effectiveVariant = variant || item.variant;
    
    const itemClasses = [
      'ipoupei-sidebar__item',
      isActive && 'ipoupei-sidebar__item--active',
      effectiveVariant && `ipoupei-sidebar__item--${effectiveVariant}`,
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
  return (
    <>
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div 
          className="ipoupei-sidebar-overlay" 
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses} role="navigation" aria-label="Menu principal">
        
        {/* ========== HEADER ========== */}
        <div className="ipoupei-sidebar__header">
          <div className="ipoupei-sidebar__brand">
            <div className="ipoupei-sidebar__logo" aria-label="Logo iPoupei">
              iP
            </div>
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
                aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
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
            <div className="ipoupei-sidebar__avatar" aria-hidden="true">
              <User size={16} />
            </div>
            <div className="ipoupei-sidebar__user-info">
              <span 
                className="ipoupei-sidebar__name" 
                title={userName}
                aria-label={`Usuário: ${userName}`}
              >
                {userName}
              </span>
              <div className="ipoupei-sidebar__greeting">
                Seja bem-vindo!
                <button 
                  className="ipoupei-sidebar__level" 
                  aria-label={`Nível atual: ${userLevel}`}
                  title={`Você está no nível ${userLevel}`}
                >
                  <Star size={12} />
                  <span>Nível {userLevel}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== CONTENT ========== */}
        <div className="ipoupei-sidebar__content">
          
          {/* Renderizar seções dinamicamente */}
          {sectionOrder.map((sectionKey) => {
            const section = menuSections[sectionKey];
            if (!section || !section.items?.length) return null;

            return (
              <div key={section.id} className="ipoupei-sidebar__section">
                <SectionTitle section={section} />
                <div className="ipoupei-sidebar__menu" role="menu">
                  {section.items.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      isActive={activeItem === item.id}
                      onClick={() => {
                        // Determinar qual handler usar baseado no tipo de seção
                        if (sectionKey === 'acoesRapidas') {
                          handleAcaoRapida(item);
                        } else {
                          handleNavigation(item);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ========== FOOTER ========== */}
        <div className="ipoupei-sidebar__footer">
          <div className="ipoupei-sidebar__menu">
            <MenuItem
              item={logoutItem}
              isActive={false}
              onClick={handleLogout}
            />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;