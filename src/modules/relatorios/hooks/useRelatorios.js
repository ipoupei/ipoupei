// src/hooks/useRelatorios.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Hook personalizado para gerenciar dados de relatórios
 * Centralizador de todas as operações relacionadas a relatórios e análises
 */
const useRelatorios = () => {
  // Estados para dados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});

  // Função para buscar dados de categorias
  const fetchCategoriaData = useCallback(async (filters) => {
    try {
      setLoading(true);
      setError(null);

      const { periodo, contas, categorias, tipoTransacao } = filters;
      
      // Construir query base
      let query = supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias(id, nome, tipo, cor),
          subcategoria:subcategorias(id, nome),
          conta:contas(id, nome, tipo)
        `)
        .gte('data', periodo.inicio.toISOString())
        .lte('data', periodo.fim.toISOString());

      // Aplicar filtros
      if (contas && contas.length > 0) {
        query = query.in('conta_id', contas);
      }

      if (categorias && categorias.length > 0) {
        query = query.in('categoria_id', categorias);
      }

      if (tipoTransacao !== 'todas') {
        query = query.eq('tipo', tipoTransacao);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Processar dados para o formato do relatório
      const dadosProcessados = processarDadosCategorias(data, tipoTransacao);
      
      return { success: true, data: dadosProcessados };
    } catch (err) {
      console.error('Erro ao buscar dados de categorias:', err);
      setError('Não foi possível carregar os dados de categorias');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para buscar dados de evolução
  const fetchEvolucaoData = useCallback(async (filters) => {
    try {
      setLoading(true);
      setError(null);

      const { periodo } = filters;
      
      // Buscar transações agrupadas por mês
      const { data: transacoes, error: transacoesError } = await supabase
        .from('transacoes')
        .select('*')
        .gte('data', periodo.inicio.toISOString())
        .lte('data', periodo.fim.toISOString())
        .order('data', { ascending: true });

      if (transacoesError) throw transacoesError;

      // Buscar saldos das contas por período
      const { data: contas, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .eq('ativo', true);

      if (contasError) throw contasError;

      // Processar dados de evolução
      const dadosProcessados = processarDadosEvolucao(transacoes, contas, periodo);
      
      return { success: true, data: dadosProcessados };
    } catch (err) {
      console.error('Erro ao buscar dados de evolução:', err);
      setError('Não foi possível carregar os dados de evolução');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para buscar dados de projeção
  const fetchProjecaoData = useCallback(async (filters, configuracao) => {
    try {
      setLoading(true);
      setError(null);

      const { periodo } = filters;
      const { tipoProjecao, periodoProjecao, incluirInflacao } = configuracao;

      // Buscar dados base para projeções
      const [transacoes, contas, cartoes, dividas] = await Promise.all([
        supabase.from('transacoes').select('*').eq('recorrente', true),
        supabase.from('contas').select('*').eq('ativo', true),
        supabase.from('cartoes').select('*').eq('ativo', true),
        supabase.from('dividas').select('*')
      ]);

      if (transacoes.error) throw transacoes.error;
      if (contas.error) throw contas.error;
      if (cartoes.error) throw cartoes.error;
      if (dividas.error) throw dividas.error;

      // Processar dados de projeção
      const dadosProcessados = processarDadosProjecao(
        transacoes.data,
        contas.data,
        cartoes.data,
        dividas.data,
        { tipoProjecao, periodoProjecao, incluirInflacao }
      );
      
      return { success: true, data: dadosProcessados };
    } catch (err) {
      console.error('Erro ao buscar dados de projeção:', err);
      setError('Não foi possível carregar os dados de projeção');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para exportar dados
  const exportData = useCallback(async (tipo, formato, dados) => {
    try {
      setLoading(true);
      
      // Implementar lógica de exportação baseada no formato
      switch (formato) {
        case 'csv':
          return exportToCSV(dados, tipo);
        case 'pdf':
          return exportToPDF(dados, tipo);
        case 'excel':
          return exportToExcel(dados, tipo);
        default:
          throw new Error('Formato de exportação não suportado');
      }
    } catch (err) {
      console.error('Erro ao exportar dados:', err);
      setError('Não foi possível exportar os dados');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    cache,
    fetchCategoriaData,
    fetchEvolucaoData,
    fetchProjecaoData,
    exportData,
    setCache,
    setError
  };
};

// Funções auxiliares para processamento de dados

/**
 * Processa dados de transações para relatório de categorias
 */
function processarDadosCategorias(transacoes, tipoTransacao) {
  const grupos = {};
  
  transacoes.forEach(transacao => {
    const categoriaNome = transacao.categoria?.nome || 'Sem categoria';
    const subcategoriaNome = transacao.subcategoria?.nome || 'Geral';
    
    if (!grupos[categoriaNome]) {
      grupos[categoriaNome] = {
        nome: categoriaNome,
        valor: 0,
        cor: transacao.categoria?.cor || '#6B7280',
        subcategorias: {}
      };
    }
    
    grupos[categoriaNome].valor += transacao.valor;
    
    if (!grupos[categoriaNome].subcategorias[subcategoriaNome]) {
      grupos[categoriaNome].subcategorias[subcategoriaNome] = {
        nome: subcategoriaNome,
        valor: 0
      };
    }
    
    grupos[categoriaNome].subcategorias[subcategoriaNome].valor += transacao.valor;
  });
  
  // Converter para array e calcular percentuais
  const resultado = Object.values(grupos).map(categoria => {
    const subcategorias = Object.values(categoria.subcategorias);
    const totalCategoria = categoria.valor;
    
    return {
      ...categoria,
      subcategorias: subcategorias.map(sub => ({
        ...sub,
        percentual: totalCategoria > 0 ? ((sub.valor / totalCategoria) * 100).toFixed(1) : 0
      }))
    };
  });
  
  // Calcular percentual total
  const total = resultado.reduce((acc, cat) => acc + cat.valor, 0);
  
  return resultado.map(categoria => ({
    ...categoria,
    percentual: total > 0 ? ((categoria.valor / total) * 100).toFixed(1) : 0
  })).sort((a, b) => b.valor - a.valor);
}

/**
 * Processa dados para relatório de evolução
 */
function processarDadosEvolucao(transacoes, contas, periodo) {
  const meses = [];
  const inicio = startOfMonth(periodo.inicio);
  const fim = endOfMonth(periodo.fim);
  
  let mesAtual = inicio;
  let patrimonioAcumulado = contas.reduce((acc, conta) => acc + (conta.saldo || 0), 0);
  
  while (mesAtual <= fim) {
    const inicioMes = startOfMonth(mesAtual);
    const fimMes = endOfMonth(mesAtual);
    
    // Filtrar transações do mês
    const transacoesMes = transacoes.filter(t => {
      const dataTransacao = new Date(t.data);
      return dataTransacao >= inicioMes && dataTransacao <= fimMes;
    });
    
    // Calcular receitas e despesas do mês
    const receitas = transacoesMes
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);
      
    const despesas = transacoesMes
      .filter(t => t.tipo === 'despesa')
      .reduce((acc, t) => acc + t.valor, 0);
    
    const saldoMes = receitas - despesas;
    patrimonioAcumulado += saldoMes;
    
    meses.push({
      periodo: format(mesAtual, 'MMM yyyy'),
      receitas,
      despesas,
      saldo: saldoMes,
      patrimonio: patrimonioAcumulado,
      data: mesAtual.toISOString()
    });
    
    mesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1);
  }
  
  return meses;
}

/**
 * Processa dados para relatório de projeção
 */
function processarDadosProjecao(transacoes, contas, cartoes, dividas, config) {
  const { tipoProjecao, periodoProjecao, incluirInflacao } = config;
  
  // Calcular dados base
  const receitaFixa = transacoes
    .filter(t => t.tipo === 'receita' && t.recorrente)
    .reduce((acc, t) => acc + t.valor, 0);
    
  const despesaFixa = transacoes
    .filter(t => t.tipo === 'despesa' && t.recorrente)
    .reduce((acc, t) => acc + t.valor, 0);
    
  const saldoAtual = contas.reduce((acc, conta) => acc + (conta.saldo || 0), 0);
  
  // Configurações por tipo de projeção
  const configs = {
    otimista: { crescimento: 0.05, reducao: 0.02, inflacao: 0.005 },
    conservador: { crescimento: 0.02, reducao: 0, inflacao: 0.008 },
    pessimista: { crescimento: -0.01, reducao: -0.01, inflacao: 0.012 }
  };
  
  const cenario = configs[tipoProjecao];
  const projecoes = [];
  
  let patrimonioAtual = saldoAtual;
  
  for (let mes = 0; mes <= periodoProjecao; mes++) {
    const fatorCrescimento = Math.pow(1 + cenario.crescimento, mes);
    const fatorInflacao = incluirInflacao ? Math.pow(1 + cenario.inflacao, mes) : 1;
    const fatorReducao = Math.pow(1 + cenario.reducao, mes);
    
    const receitaProjetada = receitaFixa * fatorCrescimento;
    const despesaProjetada = despesaFixa * fatorInflacao * fatorReducao;
    const saldoMensal = receitaProjetada - despesaProjetada;
    
    if (mes > 0) {
      patrimonioAtual += saldoMensal;
    }
    
    const data = new Date();
    data.setMonth(data.getMonth() + mes);
    
    projecoes.push({
      periodo: format(data, 'MMM yyyy'),
      receita: Math.round(receitaProjetada),
      despesa: Math.round(despesaProjetada),
      saldoMensal: Math.round(saldoMensal),
      patrimonio: Math.round(patrimonioAtual),
      mes
    });
  }
  
  return projecoes;
}

// Funções de exportação (implementação básica)
function exportToCSV(dados, tipo) {
  // Implementar exportação para CSV
  console.log('Exportando para CSV:', { dados, tipo });
  return { success: true, url: '#' };
}

function exportToPDF(dados, tipo) {
  // Implementar exportação para PDF
  console.log('Exportando para PDF:', { dados, tipo });
  return { success: true, url: '#' };
}

function exportToExcel(dados, tipo) {
  // Implementar exportação para Excel
  console.log('Exportando para Excel:', { dados, tipo });
  return { success: true, url: '#' };
}

export default useRelatorios;