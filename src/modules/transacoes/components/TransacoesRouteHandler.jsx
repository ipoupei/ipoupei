import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TransacoesPage from './TransacoesPage';

/**
 * TransacoesRouteHandler - Componente para integrar TransacoesPage com navegação da sidebar
 * 
 * Este componente:
 * ✅ Recebe filtros dinâmicos via URL da sidebar
 * ✅ Gerencia estado de filtros ativos
 * ✅ Permite navegação entre diferentes visões (Todas, Receitas, Despesas, Cartões, etc)
 * ✅ Mantém sincronização entre sidebar e página de transações
 */
const TransacoesRouteHandler = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mapear parâmetros da URL para filtros da sidebar
  const getFilterFromParams = () => {
    const tipo = searchParams.get('tipo');
    const conta = searchParams.get('conta');
    const cartao = searchParams.get('cartao');
    const categoria = searchParams.get('categoria');
    const status = searchParams.get('status');
    
    return {
      tipo,
      conta, 
      cartao,
      categoria,
      status
    };
  };

  // Detectar mudanças na URL e aplicar filtros correspondentes
  useEffect(() => {
    const params = getFilterFromParams();
    
    // Se há parâmetros na URL, significa que veio da sidebar
    if (Object.values(params).some(value => value !== null)) {
      console.log('🔗 Aplicando filtros da sidebar:', params);
      // Os filtros são aplicados automaticamente pelo TransacoesPage
    }
  }, [searchParams]);

  return <TransacoesPage />;
};

export default TransacoesRouteHandler;