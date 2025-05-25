// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import useCategorias from './useCategorias';
import useContas from './useContas';
import useCartoes from './useCartoes';
import useAuth from './useAuth';

/**
 * Hook ULTRA SIMPLES para dashboard
 * Foco em funcionar, não em perfeição
 */
const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false); // Começar com false
  const [error, setError] = useState(null);

  // Hooks de dados
  const { categorias } = useCategorias();
  const { contas, saldoTotal } = useContas();
  const { cartoes, limiteTotal } = useCartoes();
  const { isAuthenticated } = useAuth();

  // Efeito que monta os dados de forma bem simples
  useEffect(() => {
    console.log('🏠 useDashboardData - Executando...', {
      isAuthenticated,
      categorias: categorias.length,
      contas: contas.length,
      cartoes: cartoes.length,
      saldoTotal,
      limiteTotal
    });

    if (!isAuthenticated) {
      setData(null);
      return;
    }

    // Dados bem simples
    const dashboardData = {
      saldo: {
        atual: saldoTotal || 0,
        previsto: (saldoTotal || 0) * 1.1,
        ultimaAtualizacao: new Date().toLocaleString('pt-BR')
      },
      receitas: {
        atual: 4000, // Valor fixo por enquanto
        previsto: 4200,
        ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
        categorias: [
          { nome: 'Salário', valor: 3000 },
          { nome: 'Freelance', valor: 800 },
          { nome: 'Outros', valor: 200 }
        ]
      },
      despesas: {
        atual: 1900, // Valor fixo por enquanto
        previsto: 1800,
        ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
        categorias: [
          { nome: 'Alimentação', valor: 800 },
          { nome: 'Transporte', valor: 300 },
          { nome: 'Moradia', valor: 600 },
          { nome: 'Outros', valor: 200 }
        ]
      },
      cartaoCredito: {
        atual: (limiteTotal || 0) * 0.3,
        previsto: (limiteTotal || 0) * 0.25,
        ultimaAtualizacao: new Date().toLocaleString('pt-BR')
      },
      receitasPorCategoria: [
        { nome: "Salário", valor: 3000, color: "#3B82F6" },
        { nome: "Freelance", valor: 800, color: "#10B981" },
        { nome: "Outros", valor: 200, color: "#F59E0B" }
      ],
      despesasPorCategoria: [
        { nome: "Alimentação", valor: 800, color: "#EF4444" },
        { nome: "Transporte", valor: 300, color: "#F59E0B" },
        { nome: "Moradia", valor: 600, color: "#3B82F6" },
        { nome: "Outros", valor: 200, color: "#8B5CF6" }
      ],
      ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
      resumo: {
        totalContas: contas.length,
        totalCartoes: cartoes.length,
        totalCategorias: categorias.length,
        saldoLiquido: saldoTotal || 0
      }
    };

    console.log('✅ Dashboard data montado:', dashboardData);
    setData(dashboardData);
    setLoading(false);
    setError(null);
  }, [categorias, contas, cartoes, saldoTotal, limiteTotal, isAuthenticated]);

  // Debug
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.dashboardDebug = {
        data,
        loading,
        error,
        hooks: {
          categorias: categorias.length,
          contas: contas.length,
          cartoes: cartoes.length,
          saldoTotal,
          limiteTotal
        }
      };
      console.log('🔧 dashboardDebug atualizado:', {
        hasData: !!data,
        loading,
        error
      });
    }
  }, [data, loading, error, categorias, contas, cartoes, saldoTotal, limiteTotal]);

  return { 
    data, 
    loading, 
    error
  };
};

export default useDashboardData;