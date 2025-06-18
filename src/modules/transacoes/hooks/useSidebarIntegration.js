import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

/**
 * Hook para integração com o sistema de navegação da sidebar
 * 
 * Gerencia:
 * ✅ Filtros dinâmicos vindos da sidebar via URL
 * ✅ Estado ativo de filtros da sidebar  
 * ✅ Sincronização entre diferentes visões
 * ✅ Histórico de navegação
 */
const useSidebarIntegration = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Estado para controlar filtro ativo vindo da sidebar
  const [sidebarFilter, setSidebarFilter] = useState('todas');
  
  // Mapeamento de filtros da sidebar para parâmetros da URL
  const sidebarFilterMap = {
    'todas': {},
    'receitas': { tipo: 'receita' },
    'despesas': { tipo: 'despesa' }, 
    'cartoes': { tem_cartao: 'true' },
    'contas': { agrupar_conta: 'true' }
  };

  // Mapeamento reverso: URL params para filtro da sidebar
  const urlToSidebarFilter = useCallback((params) => {
    const tipo = params.get('tipo');
    const temCartao = params.get('tem_cartao'); 
    const agruparConta = params.get('agrupar_conta');
    
    if (tipo === 'receita') return 'receitas';
    if (tipo === 'despesa') return 'despesas';
    if (temCartao === 'true') return 'cartoes';
    if (agruparConta === 'true') return 'contas';
    
    return 'todas';
  }, []);

  // Detectar mudanças na URL e atualizar filtro ativo
  useEffect(() => {
    const currentFilter = urlToSidebarFilter(searchParams);
    setSidebarFilter(currentFilter);
  }, [searchParams, urlToSidebarFilter]);

  // Função para aplicar filtro da sidebar
  const applySidebarFilter = useCallback((filterKey) => {
    const filterParams = sidebarFilterMap[filterKey] || {};
    
    // Limpar parâmetros anteriores e aplicar novos
    const newParams = new URLSearchParams();
    
    Object.entries(filterParams).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    
    setSearchParams(newParams);
    setSidebarFilter(filterKey);
  }, [setSearchParams]);

  // Função para limpar filtros da sidebar
  const clearSidebarFilters = useCallback(() => {
    setSearchParams({});
    setSidebarFilter('todas');
  }, [setSearchParams]);

  // Obter filtros atuais da URL
  const getCurrentFilters = useCallback(() => {
    const filters = {};
    
    // Converter parâmetros da URL para objeto de filtros
    for (const [key, value] of searchParams.entries()) {
      switch (key) {
        case 'tipo':
          filters.tipos = [value];
          break;
        case 'conta':
          filters.contas = [value];
          break;
        case 'cartao':
          filters.cartoes = [value];
          break;
        case 'categoria':
          filters.categorias = [value]; 
          break;
        case 'status':
          filters.status = [value];
          break;
        case 'tem_cartao':
          if (value === 'true') {
            filters.apenasComCartao = true;
          }
          break;
        case 'agrupar_conta':
          if (value === 'true') {
            filters.agruparPorConta = true;
          }
          break;
        default:
          // Outros filtros personalizados
          filters[key] = value;
          break;
      }
    }
    
    return filters;
  }, [searchParams]);

  // Verificar se tem filtros ativos da sidebar
  const hasSidebarFilters = useCallback(() => {
    return sidebarFilter !== 'todas' || searchParams.toString() !== '';
  }, [sidebarFilter, searchParams]);

  // Obter descrição do filtro ativo
  const getActiveFilterDescription = useCallback(() => {
    const descriptions = {
      'todas': 'Todas as Transações',
      'receitas': 'Receitas', 
      'despesas': 'Despesas',
      'cartoes': 'Transações de Cartão',
      'contas': 'Transações por Conta'
    };
    
    return descriptions[sidebarFilter] || 'Filtro Personalizado';
  }, [sidebarFilter]);

  // Obter contagem de filtros ativos
  const getActiveFiltersCount = useCallback(() => {
    const filters = getCurrentFilters();
    
    let count = 0;
    if (filters.tipos?.length) count++;
    if (filters.contas?.length) count++;
    if (filters.cartoes?.length) count++;
    if (filters.categorias?.length) count++;
    if (filters.status?.length) count++;
    if (filters.apenasComCartao) count++;
    if (filters.agruparPorConta) count++;
    
    return count;
  }, [getCurrentFilters]);

  return {
    // Estado atual
    sidebarFilter,
    currentFilters: getCurrentFilters(),
    
    // Ações
    applySidebarFilter,
    clearSidebarFilters,
    
    // Utilitários
    hasSidebarFilters: hasSidebarFilters(),
    activeFilterDescription: getActiveFilterDescription(),
    activeFiltersCount: getActiveFiltersCount(),
    
    // Para debug
    searchParams: Object.fromEntries(searchParams.entries()),
    pathname: location.pathname
  };
};

export default useSidebarIntegration;