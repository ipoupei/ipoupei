// src/store/uiStore.js - CORRIGIDO para compatibilidade com Dashboard
import { create } from 'zustand';

/**
 * Store para gerenciar estado da UI
 * CORRIGIDO: Nomes dos modais compatíveis com Dashboard.jsx
 */
export const useUIStore = create((set, get) => ({
  // CORRIGIDO: Estado dos modais com nomes compatíveis com Dashboard
  modals: {
    contas: false,           // Dashboard usa: modals.contas
    despesas: false,         // Dashboard usa: modals.despesas
    receitas: false,         // Dashboard usa: modals.receitas
    despesasCartao: false,   // Dashboard usa: modals.despesasCartao
    transferencias: false,   // Dashboard usa: modals.transferencias
    categorias: false,       // Dashboard usa: modals.categorias
    cartoes: false,          // Dashboard usa: modals.cartoes
    detalhesDia: false,      // Dashboard usa: modals.detalhesDia
    editarTransacao: false,
    confirmDelete: false,
    perfil: false,
    configuracoes: false,
    relatorios: false,
    diagnostico: false,
    metas: false
  },

  // Estado das notificações
  notifications: [],

  // Estado de loading global
  globalLoading: false,

  // Estado do sidebar/menu mobile
  sidebarOpen: false,

  // Estado de temas e preferências
  theme: 'light', // 'light' | 'dark' | 'auto'
  
  // Estado de filtros e configurações de exibição
  displayConfig: {
    moeda: 'BRL',
    casasDecimais: 2,
    formatoData: 'dd/MM/yyyy',
    formatoNumero: 'br', // 'br' | 'us'
    animacoes: true,
    notificacoes: true
  },

  // Estado de tour/onboarding
  tour: {
    ativo: false,
    etapa: 0,
    completado: false
  },

  // Estado de search/filtros globais
  search: {
    termo: '',
    filtros: {},
    resultados: []
  },

  // ===========================
  // AÇÕES PARA MODAIS
  // ===========================

  // Abrir modal específico
  openModal: (modalName) => {
    console.log('🔓 Abrindo modal:', modalName);
    set((state) => ({
      modals: { 
        ...state.modals, 
        [modalName]: true 
      }
    }));
  },

  // Fechar modal específico
  closeModal: (modalName) => {
    console.log('🔒 Fechando modal:', modalName);
    set((state) => ({
      modals: { 
        ...state.modals, 
        [modalName]: false 
      }
    }));
  },

  // Fechar todos os modais
  closeAllModals: () => {
    console.log('🔒 Fechando todos os modais');
    set((state) => ({
      modals: Object.keys(state.modals).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {})
    }));
  },

  // Toggle modal
  toggleModal: (modalName) => {
    const isOpen = get().modals[modalName];
    if (isOpen) {
      get().closeModal(modalName);
    } else {
      get().openModal(modalName);
    }
  },

  // Verificar se algum modal está aberto
  hasOpenModal: () => {
    const { modals } = get();
    return Object.values(modals).some(isOpen => isOpen);
  },

  // ===========================
  // AÇÕES PARA NOTIFICAÇÕES
  // ===========================

  // CORRIGIDO: Função showNotification para compatibilidade com Dashboard
  showNotification: (message, type = 'info', options = {}) => {
    return get().addNotification({ message, type, ...options });
  },

  // Adicionar notificação
  addNotification: (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      duration: 5000, // 5 segundos por padrão
      type: 'info', // Tipo padrão
      ...notification
    };

    console.log('🔔 Adicionando notificação:', newNotification);

    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remover notificação após o tempo especificado
    if (newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  // Remover notificação específica
  removeNotification: (id) => {
    console.log('🗑️ Removendo notificação:', id);
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  // Limpar todas as notificações
  clearNotifications: () => {
    console.log('🗑️ Limpando todas as notificações');
    set({ notifications: [] });
  },

  // ===========================
  // LOADING STATES
  // ===========================

  // Definir loading global
  setGlobalLoading: (loading) => {
    set({ globalLoading: loading });
  },

  // ===========================
  // SIDEBAR/MENU
  // ===========================

  // Toggle sidebar
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  // Abrir sidebar
  openSidebar: () => {
    set({ sidebarOpen: true });
  },

  // Fechar sidebar
  closeSidebar: () => {
    set({ sidebarOpen: false });
  },

  // ===========================
  // TEMA E PREFERÊNCIAS
  // ===========================

  // Mudar tema
  setTheme: (theme) => {
    console.log('🎨 Mudando tema para:', theme);
    set({ theme });
    
    // Aplicar tema no HTML
    if (typeof window !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (theme === 'auto') {
        // Detectar preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  },

  // Toggle entre light e dark
  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  // Atualizar configurações de exibição
  updateDisplayConfig: (config) => {
    set((state) => ({
      displayConfig: { ...state.displayConfig, ...config }
    }));
  },

  // ===========================
  // TOUR/ONBOARDING
  // ===========================

  // Iniciar tour
  startTour: () => {
    set({
      tour: {
        ativo: true,
        etapa: 0,
        completado: false
      }
    });
  },

  // Próxima etapa do tour
  nextTourStep: () => {
    set((state) => ({
      tour: {
        ...state.tour,
        etapa: state.tour.etapa + 1
      }
    }));
  },

  // Etapa anterior do tour
  prevTourStep: () => {
    set((state) => ({
      tour: {
        ...state.tour,
        etapa: Math.max(0, state.tour.etapa - 1)
      }
    }));
  },

  // Ir para etapa específica
  goToTourStep: (etapa) => {
    set((state) => ({
      tour: {
        ...state.tour,
        etapa
      }
    }));
  },

  // Finalizar tour
  finishTour: () => {
    set({
      tour: {
        ativo: false,
        etapa: 0,
        completado: true
      }
    });
  },

  // Pular tour
  skipTour: () => {
    set({
      tour: {
        ativo: false,
        etapa: 0,
        completado: true
      }
    });
  },

  // ===========================
  // SEARCH/FILTROS
  // ===========================

  // Definir termo de busca
  setSearchTerm: (termo) => {
    set((state) => ({
      search: {
        ...state.search,
        termo
      }
    }));
  },

  // Definir filtros de busca
  setSearchFilters: (filtros) => {
    set((state) => ({
      search: {
        ...state.search,
        filtros
      }
    }));
  },

  // Definir resultados de busca
  setSearchResults: (resultados) => {
    set((state) => ({
      search: {
        ...state.search,
        resultados
      }
    }));
  },

  // Limpar busca
  clearSearch: () => {
    set({
      search: {
        termo: '',
        filtros: {},
        resultados: []
      }
    });
  },

  // ===========================
  // SELECTORS/GETTERS
  // ===========================

  // Verificar se modal específico está aberto
  isModalOpen: (modalName) => {
    const { modals } = get();
    return modals[modalName] || false;
  },

  // Obter número de notificações
  getNotificationCount: () => {
    const { notifications } = get();
    return notifications.length;
  },

  // Obter notificações por tipo
  getNotificationsByType: (type) => {
    const { notifications } = get();
    return notifications.filter(n => n.type === type);
  },

  // Verificar se está em modo escuro
  isDarkMode: () => {
    const { theme } = get();
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    
    // Auto: verificar preferência do sistema
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  },

  // Verificar se sidebar está aberto
  isSidebarOpen: () => {
    const { sidebarOpen } = get();
    return sidebarOpen;
  },

  // Verificar se tour está ativo
  isTourActive: () => {
    const { tour } = get();
    return tour.ativo;
  },

  // Obter etapa atual do tour
  getCurrentTourStep: () => {
    const { tour } = get();
    return tour.etapa;
  },

  // Verificar se tour foi completado
  isTourCompleted: () => {
    const { tour } = get();
    return tour.completado;
  },

  // Obter termo de busca atual
  getSearchTerm: () => {
    const { search } = get();
    return search.termo;
  },

  // Verificar se tem busca ativa
  hasActiveSearch: () => {
    const { search } = get();
    return search.termo.length > 0 || Object.keys(search.filtros).length > 0;
  }
}));

// ===========================
// HOOKS PERSONALIZADOS
// ===========================

/**
 * Hook para gerenciar modais
 */
export const useModal = (modalName) => {
  const { modals, openModal, closeModal, toggleModal } = useUIStore();
  
  return {
    isOpen: modals[modalName] || false,
    open: () => openModal(modalName),
    close: () => closeModal(modalName),
    toggle: () => toggleModal(modalName)
  };
};

/**
 * Hook para notificações
 */
export const useNotification = () => {
  const { addNotification, showNotification } = useUIStore();
  
  return {
    success: (message, options = {}) => 
      showNotification(message, 'success', options),
    
    error: (message, options = {}) => 
      showNotification(message, 'error', { duration: 8000, ...options }),
    
    warning: (message, options = {}) => 
      showNotification(message, 'warning', options),
    
    info: (message, options = {}) => 
      showNotification(message, 'info', options),
    
    custom: (notification) => 
      addNotification(notification),

    // Alias para compatibilidade com Dashboard
    showNotification
  };
};

/**
 * Hook para tema
 */
export const useTheme = () => {
  const { theme, setTheme, toggleTheme, isDarkMode } = useUIStore();
  
  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: isDarkMode()
  };
};

/**
 * Hook para tour/onboarding
 */
export const useTour = () => {
  const { 
    tour, 
    startTour, 
    nextTourStep, 
    prevTourStep, 
    goToTourStep,
    finishTour, 
    skipTour,
    isTourActive,
    getCurrentTourStep,
    isTourCompleted
  } = useUIStore();
  
  return {
    ...tour,
    start: startTour,
    next: nextTourStep,
    prev: prevTourStep,
    goTo: goToTourStep,
    finish: finishTour,
    skip: skipTour,
    isActive: isTourActive(),
    currentStep: getCurrentTourStep(),
    isCompleted: isTourCompleted()
  };
};

/**
 * Hook para busca
 */
export const useSearch = () => {
  const { 
    search, 
    setSearchTerm, 
    setSearchFilters, 
    setSearchResults, 
    clearSearch,
    getSearchTerm,
    hasActiveSearch
  } = useUIStore();
  
  return {
    ...search,
    setTerm: setSearchTerm,
    setFilters: setSearchFilters,
    setResults: setSearchResults,
    clear: clearSearch,
    term: getSearchTerm(),
    hasActive: hasActiveSearch()
  };
};

export default useUIStore;