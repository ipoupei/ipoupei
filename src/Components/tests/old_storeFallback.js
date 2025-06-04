// src/store/storeFallback.js
// Fallbacks para stores que podem não existir ainda

import { useState } from 'react';

/**
 * Fallback para useDashboardStore
 * Retorna funções básicas caso o store real não esteja disponível
 */
export const useDashboardStoreFallback = () => {
  try {
    const { useDashboardStore } = require('./dashboardStore');
    return useDashboardStore();
  } catch (error) {
    console.warn('DashboardStore não encontrado, usando fallback');
    return {
      data: null,
      loading: false,
      error: null,
      selectedDate: new Date(),
      setSelectedDate: (date) => {
        console.log('📅 Data selecionada (fallback):', date);
      },
      fetchDashboardData: () => {
        console.log('🔄 Buscando dados do dashboard (fallback)...');
        return Promise.resolve();
      },
      refreshData: () => {
        console.log('🔄 Atualizando dados (fallback)...');
        return Promise.resolve();
      }
    };
  }
};

/**
 * Fallback para useUIStore
 * Controle básico de modais e notificações
 */
export const useUIStoreFallback = () => {
  try {
    const { useUIStore } = require('../../store/uiStore');
    return useUIStore();
  } catch (error) {
    console.warn('UIStore não encontrado, usando fallback');
    
    // Estado local para controle de modais
    const [modals, setModals] = useState({
      receitas: false,
      despesas: false,
      despesasCartao: false,
      transferencias: false,
      contas: false,
      cartoes: false,
      categorias: false,
      detalhesDia: false
    });

    return {
      modals,
      openModal: (name) => {
        console.log('🔓 Modal aberto (fallback):', name);
        setModals(prev => ({ ...prev, [name]: true }));
      },
      closeModal: (name) => {
        console.log('🔒 Modal fechado (fallback):', name);
        setModals(prev => ({ ...prev, [name]: false }));
      },
      showNotification: (message, type = 'info') => {
        console.log('🔔 Notificação (fallback):', message, type);
        // Em um ambiente real, aqui poderia usar toast ou alert
        if (type === 'error') {
          console.error(message);
        } else if (type === 'success') {
          console.log('✅', message);
        } else {
          console.info('ℹ️', message);
        }
      }
    };
  }
};

/**
 * Fallback para useAuthStore
 * Funcionalidades básicas de autenticação
 */
export const useAuthStoreFallback = () => {
  try {
    const { useAuthStore } = require('./authStore');
    return useAuthStore();
  } catch (error) {
    console.warn('AuthStore não encontrado, usando fallback');
    
    // Verificar se há contexto de autenticação disponível
    try {
      const { useAuth } = require('../context/AuthContext');
      return useAuth();
    } catch (contextError) {
      console.warn('AuthContext também não encontrado, usando fallback básico');
      
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
        signIn: (credentials) => {
          console.log('🔐 Sign in (fallback):', credentials);
          return Promise.resolve();
        },
        signOut: () => {
          console.log('🚪 Sign out (fallback)');
          return Promise.resolve();
        },
        signUp: (userData) => {
          console.log('📝 Sign up (fallback):', userData);
          return Promise.resolve();
        }
      };
    }
  }
};

/**
 * Fallback para useTransacaoStore
 * Operações básicas com transações
 */
export const useTransacaoStoreFallback = () => {
  try {
    const { useTransacaoStore } = require('./transacaoStore');
    return useTransacaoStore();
  } catch (error) {
    console.warn('TransacaoStore não encontrado, usando fallback');
    
    return {
      transacoes: [],
      loading: false,
      error: null,
      fetchTransacoes: () => {
        console.log('📋 Buscando transações (fallback)...');
        return Promise.resolve([]);
      },
      addTransacao: (transacao) => {
        console.log('➕ Adicionando transação (fallback):', transacao);
        return Promise.resolve(transacao);
      },
      updateTransacao: (id, transacao) => {
        console.log('✏️ Atualizando transação (fallback):', id, transacao);
        return Promise.resolve(transacao);
      },
      deleteTransacao: (id) => {
        console.log('🗑️ Deletando transação (fallback):', id);
        return Promise.resolve();
      },
      filtrarTransacoes: (filtros) => {
        console.log('🔍 Filtrando transações (fallback):', filtros);
        return [];
      }
    };
  }
};

/**
 * Fallback para useContaStore
 * Operações básicas com contas
 */
export const useContaStoreFallback = () => {
  try {
    const { useContaStore } = require('./contaStore');
    return useContaStore();
  } catch (error) {
    console.warn('ContaStore não encontrado, usando fallback');
    
    return {
      contas: [],
      loading: false,
      error: null,
      fetchContas: () => {
        console.log('🏦 Buscando contas (fallback)...');
        return Promise.resolve([]);
      },
      addConta: (conta) => {
        console.log('➕ Adicionando conta (fallback):', conta);
        return Promise.resolve(conta);
      },
      updateConta: (id, conta) => {
        console.log('✏️ Atualizando conta (fallback):', id, conta);
        return Promise.resolve(conta);
      },
      deleteConta: (id) => {
        console.log('🗑️ Deletando conta (fallback):', id);
        return Promise.resolve();
      }
    };
  }
};

/**
 * Fallback para useCategoriaStore
 * Operações básicas com categorias
 */
export const useCategoriaStoreFallback = () => {
  try {
    const { useCategoriaStore } = require('./categoriaStore');
    return useCategoriaStore();
  } catch (error) {
    console.warn('CategoriaStore não encontrado, usando fallback');
    
    return {
      categorias: [],
      loading: false,
      error: null,
      fetchCategorias: () => {
        console.log('📊 Buscando categorias (fallback)...');
        return Promise.resolve([]);
      },
      addCategoria: (categoria) => {
        console.log('➕ Adicionando categoria (fallback):', categoria);
        return Promise.resolve(categoria);
      },
      updateCategoria: (id, categoria) => {
        console.log('✏️ Atualizando categoria (fallback):', id, categoria);
        return Promise.resolve(categoria);
      },
      deleteCategoria: (id) => {
        console.log('🗑️ Deletando categoria (fallback):', id);
        return Promise.resolve();
      }
    };
  }
};

/**
 * Hook universal que tenta usar qualquer store com fallback
 * @param {string} storeName - Nome do store (ex: 'dashboard', 'ui', 'auth')
 * @returns {Object} Store ou fallback
 */
export const useStoreFallback = (storeName) => {
  const fallbackMap = {
    dashboard: useDashboardStoreFallback,
    ui: useUIStoreFallback,
    auth: useAuthStoreFallback,
    transacao: useTransacaoStoreFallback,
    conta: useContaStoreFallback,
    categoria: useCategoriaStoreFallback
  };

  const fallbackFunction = fallbackMap[storeName];
  
  if (!fallbackFunction) {
    console.warn(`Store '${storeName}' não encontrado no mapa de fallbacks`);
    return {};
  }

  return fallbackFunction();
};

/**
 * Função utilitária para detectar quais stores estão disponíveis
 * @returns {Object} Mapa de stores disponíveis
 */
export const detectAvailableStores = () => {
  const stores = {};
  
  const storeList = [
    'dashboardStore',
    'uiStore', 
    'authStore',
    'transacaoStore',
    'contaStore',
    'categoriaStore'
  ];

  storeList.forEach(storeName => {
    try {
      require(`./${storeName}`);
      stores[storeName] = true;
    } catch (error) {
      stores[storeName] = false;
    }
  });

  console.log('📦 Stores disponíveis:', stores);
  return stores;
};

export default {
  useDashboardStoreFallback,
  useUIStoreFallback,
  useAuthStoreFallback,
  useTransacaoStoreFallback,
  useContaStoreFallback,
  useCategoriaStoreFallback,
  useStoreFallback,
  detectAvailableStores
};