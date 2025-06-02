// src/hooks/useFaturasCartao.js - Versão simplificada inicial
import { useState, useCallback } from 'react';

const useFaturasCartao = () => {
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Placeholder - buscar faturas
  const fetchFaturas = useCallback(async (cartaoId = null, anoMes = null) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mock para desenvolvimento
      const faturasMock = [
        {
          cartao_id: '1',
          cartao_nome: 'Cartão Principal',
          cartao_bandeira: 'Visa',
          fatura_vencimento: '2024-12-15',
          valor_total_fatura: 1500.00,
          total_compras: 8,
          total_parcelas: 12,
          transacoes: []
        },
        {
          cartao_id: '2',
          cartao_nome: 'Cartão Empresarial',
          cartao_bandeira: 'Mastercard',
          fatura_vencimento: '2024-12-20',
          valor_total_fatura: 850.00,
          total_compras: 5,
          total_parcelas: 7,
          transacoes: []
        }
      ];
      
      setFaturas(faturasMock);
      return { success: true, data: faturasMock };
      
    } catch (err) {
      console.error('Erro ao buscar faturas:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Placeholder - buscar detalhes de uma fatura
  const fetchDetalhesFatura = useCallback(async (cartaoId, dataVencimento) => {
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock de transações
      const transacoesMock = [
        {
          id: '1',
          data: '2024-11-15',
          descricao: 'Supermercado ABC',
          valor: 150.00,
          categoria: { nome: 'Alimentação', cor: '#10b981' },
          tipo: 'despesa',
          numero_parcelas: 1,
          parcela_atual: 1
        },
        {
          id: '2',
          data: '2024-11-18',
          descricao: 'Posto de Gasolina',
          valor: 200.00,
          categoria: { nome: 'Transporte', cor: '#f59e0b' },
          tipo: 'despesa',
          numero_parcelas: 1,
          parcela_atual: 1
        },
        {
          id: '3',
          data: '2024-11-20',
          descricao: 'Farmácia XYZ',
          valor: 80.00,
          categoria: { nome: 'Saúde', cor: '#ef4444' },
          tipo: 'despesa',
          numero_parcelas: 1,
          parcela_atual: 1
        }
      ];
      
      return { success: true, data: transacoesMock };
      
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Placeholder - calcular estatísticas
  const calcularEstatisticasFatura = useCallback((fatura) => {
    if (!fatura) return null;

    return {
      totalTransacoes: fatura.total_compras || 0,
      valorTotal: fatura.valor_total_fatura || 0,
      valorMedio: fatura.total_compras > 0 ? (fatura.valor_total_fatura / fatura.total_compras) : 0,
      maiorCategoria: {
        nome: 'Alimentação',
        valor: 500,
        quantidade: 3
      },
      categorias: [
        { nome: 'Alimentação', valor: 500, quantidade: 3 },
        { nome: 'Transporte', valor: 300, quantidade: 2 },
        { nome: 'Saúde', valor: 200, quantidade: 1 }
      ],
      porDia: [
        { dia: '2024-11-20', valor: 80, quantidade: 1 },
        { dia: '2024-11-18', valor: 200, quantidade: 1 },
        { dia: '2024-11-15', valor: 150, quantidade: 1 }
      ]
    };
  }, []);

  // Placeholder - exportar fatura
  const exportarFatura = useCallback(async (fatura, formato = 'json') => {
    try {
      const dados = {
        fatura: {
          cartao: fatura.cartao_nome,
          vencimento: fatura.fatura_vencimento,
          valor: fatura.valor_total_fatura
        },
        exportadoEm: new Date().toISOString()
      };

      const dataStr = formato === 'json' 
        ? JSON.stringify(dados, null, 2)
        : `Cartão,Vencimento,Valor\n${dados.fatura.cartao},${dados.fatura.vencimento},${dados.fatura.valor}`;

      const blob = new Blob([dataStr], { 
        type: formato === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fatura-${fatura.cartao_nome}-${fatura.fatura_vencimento}.${formato}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, arquivo: link.download };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Placeholder - comparar faturas
  const compararFaturas = useCallback(async (cartaoId, anoMes1, anoMes2) => {
    try {
      // Mock de comparação
      const comparacao = {
        periodo1: { anoMes: anoMes1 },
        periodo2: { anoMes: anoMes2 },
        diferencas: {
          valor: 200,
          percentual: 15.5,
          transacoes: 2
        }
      };

      return { success: true, data: comparacao };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Placeholder - resumo geral
  const getResumoGeral = useCallback(() => {
    if (!faturas.length) return null;

    return {
      totalFaturas: faturas.length,
      valorTotal: faturas.reduce((acc, f) => acc + f.valor_total_fatura, 0),
      valorMedio: faturas.reduce((acc, f) => acc + f.valor_total_fatura, 0) / faturas.length,
      proximasVencer: 1,
      vencidas: 0,
      emDia: faturas.length - 1
    };
  }, [faturas]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    faturas,
    loading,
    error,
    fetchFaturas,
    fetchDetalhesFatura,
    calcularEstatisticasFatura,
    exportarFatura,
    compararFaturas,
    getResumoGeral,
    clearError
  };
};

export default useFaturasCartao;