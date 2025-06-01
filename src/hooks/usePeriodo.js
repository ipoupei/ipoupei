// src/hooks/usePeriodo.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { getCurrentMonthName } from '../utils/getCurrentMonthName';

/**
 * Hook/Store para gerenciar o período selecionado globalmente
 * Usado pelo MainLayout e por todas as páginas que precisam filtrar por período
 */
export const usePeriodoStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      currentDate: new Date(),
      
      // Ações
      setCurrentDate: (date) => {
        const validDate = date instanceof Date ? date : new Date(date);
        set({ currentDate: validDate });
      },
      
      navigateMonth: (direction) => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        const newDate = new Date(validDate);
        newDate.setMonth(newDate.getMonth() + direction);
        set({ currentDate: newDate });
      },
      
      goToToday: () => {
        set({ currentDate: new Date() });
      },
      
      setSpecificMonth: (year, month) => {
        const newDate = new Date(year, month, 1);
        set({ currentDate: newDate });
      },
      
      // Getters/Selectors
      getCurrentMonth: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return getCurrentMonthName(validDate);
      },
      
      getCurrentYear: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return validDate.getFullYear();
      },
      
      getFormattedPeriod: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return `${getCurrentMonthName(validDate)} ${validDate.getFullYear()}`;
      },
      
      getStartOfMonth: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return startOfMonth(validDate);
      },
      
      getEndOfMonth: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return endOfMonth(validDate);
      },
      
      getDateRange: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return {
          inicio: startOfMonth(validDate),
          fim: endOfMonth(validDate)
        };
      },
      
      getISODateRange: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return {
          inicio: startOfMonth(validDate).toISOString(),
          fim: endOfMonth(validDate).toISOString()
        };
      },
      
      getMonthYear: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return format(validDate, 'yyyy-MM');
      },
      
      isCurrentMonth: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        const hoje = new Date();
        return validDate.getMonth() === hoje.getMonth() && 
               validDate.getFullYear() === hoje.getFullYear();
      },
      
      isPastMonth: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        const hoje = new Date();
        return validDate < startOfMonth(hoje);
      },
      
      isFutureMonth: () => {
        const { currentDate } = get();
        const validDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
        const hoje = new Date();
        return validDate > endOfMonth(hoje);
      }
    }),
    {
      name: 'periodo-storage',
      partialize: (state) => ({
        currentDate: state.currentDate
      }),
      // Deserializar a data corretamente quando carregada do localStorage
      onRehydrateStorage: () => (state) => {
        if (state && state.currentDate) {
          state.currentDate = new Date(state.currentDate);
        }
      }
    }
  )
);

/**
 * Hook React para usar o período com funcionalidades adicionais
 */
export const usePeriodo = () => {
  const store = usePeriodoStore();
  
  // Garantir que currentDate é sempre um objeto Date válido
  const currentDate = store.currentDate instanceof Date ? store.currentDate : new Date(store.currentDate || new Date());
  
  // Função para obter filtros comuns para queries
  const getFiltersForQueries = () => {
    const range = store.getDateRange();
    return {
      dataInicio: range.inicio,
      dataFim: range.fim,
      anoMes: store.getMonthYear(),
      periodo: store.getFormattedPeriod()
    };
  };
  
  // Função para verificar se uma data está no período atual
  const isDateInCurrentPeriod = (date) => {
    const targetDate = new Date(date);
    const range = store.getDateRange();
    return targetDate >= range.inicio && targetDate <= range.fim;
  };
  
  // Função para navegar para um período específico baseado em uma data
  const goToDatePeriod = (date) => {
    const targetDate = new Date(date);
    const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    store.setCurrentDate(firstDayOfMonth);
  };
  
  // Função para obter os últimos N meses
  const getLastNMonths = (n = 6) => {
    const months = [];
    const current = new Date(currentDate);
    
    for (let i = 0; i < n; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      months.push({
        date,
        label: getCurrentMonthName(date),
        year: date.getFullYear(),
        monthYear: format(date, 'yyyy-MM'),
        isCurrent: i === 0
      });
    }
    
    return months;
  };
  
  // Função para obter os próximos N meses
  const getNextNMonths = (n = 3) => {
    const months = [];
    const current = new Date(currentDate);
    
    for (let i = 1; i <= n; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
      months.push({
        date,
        label: getCurrentMonthName(date),
        year: date.getFullYear(),
        monthYear: format(date, 'yyyy-MM'),
        isFuture: true
      });
    }
    
    return months;
  };
  
  return {
    // Estado (sempre garantindo que é um Date válido)
    currentDate,
    
    // Ações básicas
    setCurrentDate: store.setCurrentDate,
    navigateMonth: store.navigateMonth,
    goToToday: store.goToToday,
    setSpecificMonth: store.setSpecificMonth,
    
    // Getters
    getCurrentMonth: store.getCurrentMonth,
    getCurrentYear: store.getCurrentYear,
    getFormattedPeriod: store.getFormattedPeriod,
    getStartOfMonth: store.getStartOfMonth,
    getEndOfMonth: store.getEndOfMonth,
    getDateRange: store.getDateRange,
    getISODateRange: store.getISODateRange,
    getMonthYear: store.getMonthYear,
    
    // Status checks
    isCurrentMonth: store.isCurrentMonth,
    isPastMonth: store.isPastMonth,
    isFutureMonth: store.isFutureMonth,
    
    // Funções utilitárias
    getFiltersForQueries,
    isDateInCurrentPeriod,
    goToDatePeriod,
    getLastNMonths,
    getNextNMonths
  };
};

export default usePeriodo;