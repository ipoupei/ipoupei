// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para obter dados do dashboard
 * Futuramente será conectado a uma API real
 * 
 * @returns {Object} Dados do dashboard, estado de loading e erro
 */
const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulando um tempo de carregamento de API
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Simulando um delay de carregamento
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Dados mockados
        const mockData = {
          saldo: {
            atual: 117624.00,
            previsto: 456.65,
            ultimaAtualizacao: '13/05/2025, 12:03'
          },
          receitas: {
            atual: 456.32,
            previsto: 456.65,
            ultimaAtualizacao: '13/05/2025, 12:03',
            categorias: [
              { nome: "Salário", valor: 300 },
              { nome: "Freelance", valor: 100 },
              { nome: "Investimentos", valor: 56.32 }
            ],
          },
          despesas: {
            atual: 456.32,
            previsto: 456.65,
            ultimaAtualizacao: '13/05/2025, 12:03',
            categorias: [
              { nome: "Alimentação", valor: 150 },
              { nome: "Transporte", valor: 95 },
              { nome: "Lazer", valor: 80 },
              { nome: "Contas", valor: 131.32 }
            ],
          },
          cartaoCredito: {
            atual: 456.32,
            previsto: 456.65,
            ultimaAtualizacao: '13/05/2025, 12:03'
          },
          receitasPorCategoria: [
            { nome: "Salário", valor: 300, color: "#3B82F6" },
            { nome: "Freelance", valor: 100, color: "#10B981" },
            { nome: "Investimentos", valor: 56.32, color: "#F59E0B" }
          ],
          despesasPorCategoria: [
            { nome: "Alimentação", valor: 150, color: "#3B82F6" },
            { nome: "Transporte", valor: 95, color: "#10B981" },
            { nome: "Lazer", valor: 80, color: "#F59E0B" },
            { nome: "Contas", valor: 131.32, color: "#EF4444" }
          ],
          ultimaAtualizacao: '13/05/2025, 12:03'
        };
        
        setData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
        setError('Erro ao buscar dados. Tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return { data, loading, error };
};

export default useDashboardData;