// src/hooks/useHybridAuth.js
import { useState, useEffect } from 'react';

/**
 * Hook híbrido que funciona com Zustand E Context
 * Permite migração gradual sem quebrar a aplicação
 */
export const useHybridAuth = () => {
  const [authData, setAuthData] = useState({
    user: null,
    isAuthenticated: false,
    loading: true,
    initialized: false,
    signIn: null,
    signOut: null,
    signUp: null,
    error: null
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Tentar usar Zustand primeiro
        const { useAuthStore } = await import('../../../store/authStore');
        const store = useAuthStore.getState();
        
        // Função para atualizar estado quando store mudar
        const updateFromStore = () => {
          const currentState = useAuthStore.getState();
          setAuthData({
            user: currentState.user,
            isAuthenticated: currentState.isAuthenticated,
            loading: currentState.loading,
            initialized: currentState.initialized,
            signIn: currentState.signIn,
            signOut: currentState.signOut,
            signUp: currentState.signUp,
            error: currentState.error,
            source: 'zustand'
          });
        };
        
        // Configurar subscriber do Zustand
        const unsubscribe = useAuthStore.subscribe(updateFromStore);
        
        // Atualizar estado inicial
        updateFromStore();
        
        console.log('🔧 useHybridAuth usando Zustand');
        
        // Cleanup
        return () => {
          unsubscribe();
        };
        
      } catch (error) {
        console.log('🔧 useHybridAuth fallback para Context');
        
        try {
          // Fallback para Context
          const { useAuth } = await import('../../../context/AuthContext');
          const contextAuth = useAuth();
          
          setAuthData({
            ...contextAuth,
            source: 'context'
          });
        } catch (contextError) {
          console.warn('Nem Zustand nem Context disponível');
          setAuthData(prev => ({
            ...prev,
            loading: false,
            initialized: true,
            source: 'none'
          }));
        }
      }
    };

    initializeAuth();
  }, []);

  return authData;
};

/**
 * Hook para usar dados do dashboard de forma híbrida
 */
export const useHybridDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    data: null,
    loading: false,
    error: null,
    fetchData: () => {},
    refresh: () => {},
    setSelectedDate: () => {},
    source: 'none'
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Tentar usar Zustand
        const { useDashboardStore } = await import('../../../store/dashboardStore');
        const store = useDashboardStore.getState();
        
        const updateFromStore = () => {
          const currentState = useDashboardStore.getState();
          setDashboardData({
            data: currentState.data,
            loading: currentState.loading,
            error: currentState.error,
            fetchData: currentState.fetchDashboardData,
            refresh: currentState.refresh,
            setSelectedDate: currentState.setSelectedDate,
            // Computed values
            saldoTotal: currentState.getSaldoTotal(),
            totalReceitas: currentState.getTotalReceitas(),
            totalDespesas: currentState.getTotalDespesas(),
            source: 'zustand'
          });
        };
        
        const unsubscribe = useDashboardStore.subscribe(updateFromStore);
        updateFromStore();
        
        console.log('🔧 useHybridDashboard usando Zustand');
        
        return () => unsubscribe();
        
      } catch (error) {
        console.log('🔧 useHybridDashboard fallback para dados mockados');
        
        // Fallback para dados básicos
        setDashboardData({
          data: {
            resumo: {
              saldoTotal: 0,
              totalReceitas: 0,
              totalDespesas: 0
            }
          },
          loading: false,
          error: null,
          fetchData: () => console.log('Fetch data não implementado'),
          refresh: () => console.log('Refresh não implementado'),
          setSelectedDate: () => console.log('SetSelectedDate não implementado'),
          saldoTotal: 0,
          totalReceitas: 0,
          totalDespesas: 0,
          source: 'mock'
        });
      }
    };

    initializeDashboard();
  }, []);

  return dashboardData;
};

/**
 * Hook para notificações híbrido
 */
export const useHybridNotification = () => {
  const [notification, setNotification] = useState({
    success: (msg) => console.log('Success:', msg),
    error: (msg) => console.error('Error:', msg),
    info: (msg) => console.log('Info:', msg),
    warning: (msg) => console.warn('Warning:', msg),
    source: 'console'
  });

  useEffect(() => {
    const initializeNotification = async () => {
      try {
        const { useNotification } = await import('../../store/uiStore');
        const notificationFuncs = useNotification();
        
        setNotification({
          ...notificationFuncs,
          source: 'zustand'
        });
        
        console.log('🔧 useHybridNotification usando Zustand');
      } catch (error) {
        console.log('🔧 useHybridNotification usando console fallback');
        // Já está configurado com console fallback
      }
    };

    initializeNotification();
  }, []);

  return notification;
};

export default useHybridAuth;