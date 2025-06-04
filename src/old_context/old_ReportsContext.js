// src/context/ReportsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Contexto de relatórios
const ReportsContext = createContext();

/**
 * Provider de relatórios para gerenciar filtros e estado entre as telas
 * Mantém filtros de período, contas, categorias e configurações globais
 */
export const ReportsProvider = ({ children }) => {
  // Estado para filtros globais
  const [filters, setFilters] = useState({
    periodo: {
      inicio: startOfMonth(subMonths(new Date(), 5)), // Últimos 6 meses
      fim: endOfMonth(new Date()),
      tipo: 'ultimos_6_meses' // 'personalizado', 'ultimo_mes', 'ultimos_3_meses', 'ultimos_6_meses', 'ultimo_ano'
    },
    contas: [], // Array de IDs de contas selecionadas (vazio = todas)
    categorias: [], // Array de IDs de categorias selecionadas (vazio = todas)
    tipoTransacao: 'todas', // 'todas', 'receitas', 'despesas'
    incluirParcelamentos: true,
    incluirTransferencias: false
  });
  
  // Estado para configurações de exibição
  const [displayConfig, setDisplayConfig] = useState({
    moeda: 'BRL',
    casasDecimais: 2,
    agrupamento: 'mensal', // 'diario', 'semanal', 'mensal', 'trimestral'
    ordenacao: 'valor_desc', // 'valor_desc', 'valor_asc', 'alfabetica', 'cronologica'
    mostrarPercentuais: true,
    mostrarComparacoes: true
  });
  
  // Estado para cache de dados
  const [cache, setCache] = useState({
    categorias: null,
    evolucao: null,
    projecao: null,
    ultimaAtualizacao: null
  });
  
  // Estado para loading e erro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para atualizar filtros
  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    
    // Limpa cache quando filtros mudam
    setCache(prev => ({
      ...prev,
      categorias: null,
      evolucao: null,
      projecao: null
    }));
  };

  // Função para atualizar período
  const updatePeriodo = (tipo, inicio = null, fim = null) => {
    let newPeriodo = { tipo };
    
    const hoje = new Date();
    
    switch (tipo) {
      case 'ultimo_mes':
        newPeriodo.inicio = startOfMonth(subMonths(hoje, 1));
        newPeriodo.fim = endOfMonth(subMonths(hoje, 1));
        break;
      case 'ultimos_3_meses':
        newPeriodo.inicio = startOfMonth(subMonths(hoje, 2));
        newPeriodo.fim = endOfMonth(hoje);
        break;
      case 'ultimos_6_meses':
        newPeriodo.inicio = startOfMonth(subMonths(hoje, 5));
        newPeriodo.fim = endOfMonth(hoje);
        break;
      case 'ultimo_ano':
        newPeriodo.inicio = startOfMonth(subMonths(hoje, 11));
        newPeriodo.fim = endOfMonth(hoje);
        break;
      case 'personalizado':
        newPeriodo.inicio = inicio || filters.periodo.inicio;
        newPeriodo.fim = fim || filters.periodo.fim;
        break;
      default:
        return;
    }
    
    updateFilters({ periodo: newPeriodo });
  };

  // Função para atualizar configurações de display
  const updateDisplayConfig = (newConfig) => {
    setDisplayConfig(prev => ({
      ...prev,
      ...newConfig
    }));
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      periodo: {
        inicio: startOfMonth(subMonths(new Date(), 5)),
        fim: endOfMonth(new Date()),
        tipo: 'ultimos_6_meses'
      },
      contas: [],
      categorias: [],
      tipoTransacao: 'todas',
      incluirParcelamentos: true,
      incluirTransferencias: false
    });
  };

  // Função para formatar período para exibição
  const formatPeriodo = () => {
    const { inicio, fim, tipo } = filters.periodo;
    
    switch (tipo) {
      case 'ultimo_mes':
        return `Último mês (${format(inicio, 'MMM yyyy', { locale: ptBR })})`;
      case 'ultimos_3_meses':
        return 'Últimos 3 meses';
      case 'ultimos_6_meses':
        return 'Últimos 6 meses';
      case 'ultimo_ano':
        return 'Último ano';
      case 'personalizado':
        return `${format(inicio, 'dd/MM/yyyy')} - ${format(fim, 'dd/MM/yyyy')}`;
      default:
        return 'Período personalizado';
    }
  };

  // Função para verificar se tem filtros ativos
  const hasActiveFilters = () => {
    return (
      filters.contas.length > 0 ||
      filters.categorias.length > 0 ||
      filters.tipoTransacao !== 'todas' ||
      !filters.incluirParcelamentos ||
      filters.incluirTransferencias
    );
  };

  // Função para obter estatísticas do período
  const getPeriodoStats = () => {
    const { inicio, fim } = filters.periodo;
    const diffTime = Math.abs(fim - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30);
    
    return {
      dias: diffDays,
      meses: diffMonths,
      inicio: format(inicio, 'dd/MM/yyyy'),
      fim: format(fim, 'dd/MM/yyyy'),
      periodoFormatado: formatPeriodo()
    };
  };

  // Função para invalidar cache
  const invalidateCache = (keys = null) => {
    if (keys) {
      setCache(prev => {
        const newCache = { ...prev };
        keys.forEach(key => {
          newCache[key] = null;
        });
        return newCache;
      });
    } else {
      setCache({
        categorias: null,
        evolucao: null,
        projecao: null,
        ultimaAtualizacao: null
      });
    }
  };

  // Effect para limpar cache quando filtros mudam
  useEffect(() => {
    invalidateCache();
  }, [filters]);

  // Valores expostos pelo contexto
  const value = {
    // Estados
    filters,
    displayConfig,
    cache,
    loading,
    error,
    
    // Funções de atualização
    updateFilters,
    updatePeriodo,
    updateDisplayConfig,
    clearFilters,
    
    // Funções de utilidade
    formatPeriodo,
    hasActiveFilters,
    getPeriodoStats,
    invalidateCache,
    
    // Funções de estado
    setLoading,
    setError,
    setCache
  };

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
};

/**
 * Hook personalizado para usar o contexto de relatórios
 * 
 * @example
 * const { filters, updateFilters, loading } = useReports();
 */
export const useReports = () => {
  const context = useContext(ReportsContext);

  if (!context) {
    throw new Error('useReports deve ser usado dentro de um ReportsProvider');
  }

  return context;
};

export default ReportsContext;