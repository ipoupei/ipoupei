// src/hooks/useDashboardData.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useCategorias from './useCategorias';
import useContas from './useContas';
import useCartoes from './useCartoes';
import useTransacoes from './useTransacoes';
import useAuth from './useAuth';

/**
 * Hook completo para dashboard com dados reais do usuário
 * Busca dados do perfil, transações e calcula métricas
 */





const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  // Hooks de dados
  const { categorias } = useCategorias();
  const { contas, saldoTotal, loading: contasLoading } = useContas();
  const { cartoes, limiteTotal, loading: cartoesLoading } = useCartoes();
  const { 
    transacoes, 
    getTotalReceitas, 
    getTotalDespesas,
    getReceitasPorCategoria,
    getDespesasPorCategoria,
    loading: transacoesLoading 
  } = useTransacoes();
  const { user, isAuthenticated } = useAuth();

  // Busca dados do perfil do usuário
  const fetchPerfilUsuario = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPerfilUsuario(null);
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const { data: perfil, error } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Se não encontrou perfil, criar um básico
      if (!perfil) {
        const novoPerfilData = {
          id: user.id,
          nome: user.user_metadata?.full_name || 
                user.user_metadata?.nome || 
                user.email?.split('@')[0] || 
                'Usuário',
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: novoPerfil, error: createError } = await supabase
          .from('perfil_usuario')
          .insert([novoPerfilData])
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar perfil:', createError);
          // Usa dados básicos mesmo com erro
          setPerfilUsuario(novoPerfilData);
        } else {
          setPerfilUsuario(novoPerfil);
        }
      } else {
        setPerfilUsuario(perfil);
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Erro ao buscar perfil:', err);
      // Fallback com dados básicos do auth
      setPerfilUsuario({
        id: user.id,
        nome: user.user_metadata?.full_name || 
              user.user_metadata?.nome || 
              user.email?.split('@')[0] || 
              'Usuário',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null
      });
      return { success: false, error: err.message };
    }
  }, [isAuthenticated, user]);

  // Busca perfil quando usuário muda
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPerfilUsuario();
    } else {
      setPerfilUsuario(null);
    }
  }, [isAuthenticated, user, fetchPerfilUsuario]);

  // Calcula dados do dashboard quando dependências mudam
  useEffect(() => {
    if (!isAuthenticated || !perfilUsuario) {
      setData(null);
      setLoading(false);
      return;
    }

    // Se ainda está carregando dados essenciais, aguarda
    if (contasLoading || cartoesLoading || transacoesLoading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calcula totais de receitas e despesas reais
      const totalReceitas = getTotalReceitas();
      const totalDespesas = getTotalDespesas();
      const receitasPorCategoria = getReceitasPorCategoria();
      const despesasPorCategoria = getDespesasPorCategoria();

      // Calcula projeções baseadas nos dados históricos
      const projecaoReceitas = totalReceitas * 1.05; // 5% de crescimento
      const projecaoDespesas = totalDespesas * 0.95; // 5% de redução
      const projecaoSaldo = saldoTotal + (projecaoReceitas - projecaoDespesas);
      const projecaoCartao = (limiteTotal || 0) * 0.25; // 25% do limite

      // Monta dados finais do dashboard
      const dashboardData = {
        // Dados do usuário
        usuario: {
          id: perfilUsuario.id,
          nome: perfilUsuario.nome,
          email: perfilUsuario.email,
          avatar_url: perfilUsuario.avatar_url
        },
        
        // Saldo atual e projetado
        saldo: {
          atual: saldoTotal || 0,
          previsto: projecaoSaldo,
          ultimaAtualizacao: new Date().toLocaleString('pt-BR')
        },
        
        // Dados detalhados das contas para o card flip
        contasDetalhadas: contas.map(conta => ({
          nome: conta.nome,
          tipo: conta.tipo === 'corrente' ? 'Conta Corrente' : 
                conta.tipo === 'poupanca' ? 'Poupança' : 
                conta.tipo === 'investimento' ? 'Investimento' : 
                conta.tipo === 'carteira' ? 'Carteira' : 'Outros',
          saldo: conta.saldo || 0,
          cor: conta.cor || '#3B82F6'
        })),
        
        // Receitas atuais e projetadas
        receitas: {
          atual: totalReceitas,
          previsto: projecaoReceitas,
          ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
          categorias: receitasPorCategoria.slice(0, 5) // Top 5 categorias
        },
        
        // Despesas atuais e projetadas
        despesas: {
          atual: totalDespesas,
          previsto: projecaoDespesas,
          ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
          categorias: despesasPorCategoria.slice(0, 5) // Top 5 categorias
        },
        
        // Cartão de crédito
        cartaoCredito: {
          atual: (limiteTotal || 0) * 0.3, // Simula 30% usado
          previsto: projecaoCartao,
          limite: limiteTotal || 0,
          ultimaAtualizacao: new Date().toLocaleString('pt-BR')
        },
        
        // Dados detalhados dos cartões para o card flip
        cartoesDetalhados: cartoes.map(cartao => ({
          nome: cartao.nome,
          bandeira: cartao.bandeira === 'visa' ? 'Visa' : 
                   cartao.bandeira === 'mastercard' ? 'Mastercard' : 
                   cartao.bandeira === 'elo' ? 'Elo' : 
                   cartao.bandeira || 'Outro',
          limite: cartao.limite || 0,
          usado: (cartao.limite || 0) * 0.3, // Simula 30% usado
          cor: cartao.cor || '#8B5CF6'
        })),
        
        // Dados para gráficos
        receitasPorCategoria: receitasPorCategoria.length > 0 ? receitasPorCategoria : [
          { nome: "Sem receitas", valor: 0, color: "#E5E7EB" }
        ],
        
        despesasPorCategoria: despesasPorCategoria.length > 0 ? despesasPorCategoria : [
          { nome: "Sem despesas", valor: 0, color: "#E5E7EB" }
        ],
        
        // Resumo geral
        resumo: {
          totalContas: contas.length,
          totalCartoes: cartoes.length,
          totalCategorias: categorias.length,
          totalTransacoes: transacoes.length,
          saldoLiquido: saldoTotal || 0,
          balanco: totalReceitas - totalDespesas,
          percentualGasto: totalReceitas > 0 ? ((totalDespesas / totalReceitas) * 100).toFixed(1) : 0
        },
        
        // Histórico para gráficos (dados básicos)
        historico: [],
        
        // Timestamp da última atualização
        ultimaAtualizacao: new Date().toLocaleString('pt-BR')
      };

      setData(dashboardData);
      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('❌ Erro ao calcular dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
      setLoading(false);
    }
  }, [
    isAuthenticated,
    perfilUsuario,
    categorias,
    contas,
    cartoes,
    transacoes,
    saldoTotal,
    limiteTotal,
    contasLoading,
    cartoesLoading,
    transacoesLoading,
    getTotalReceitas,
    getTotalDespesas,
    getReceitasPorCategoria,
    getDespesasPorCategoria
  ]);

  return { 
    data, 
    loading, 
    error,
    perfilUsuario,
    refreshData: fetchPerfilUsuario
  };
const fetchDadosCartao = useCallback(async () => {
  if (!isAuthenticated || !user) return null;

  try {
    // Buscar próximas faturas (próximos 2 meses)
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() + 2);
    
    const { data: proximasFaturas, error } = await supabase
      .from('vw_faturas_cartao')
      .select('*')
      .eq('usuario_id', user.id)
      .gte('fatura_vencimento', new Date().toISOString().split('T')[0])
      .lte('fatura_vencimento', dataLimite.toISOString().split('T')[0])
      .order('fatura_vencimento', { ascending: true });

    if (error) throw error;

    return {
      proximasFaturas: proximasFaturas || [],
      totalProximasFaturas: proximasFaturas?.reduce((sum, f) => sum + f.valor_total_fatura, 0) || 0
    };
  } catch (err) {
    console.error('Erro ao buscar dados de cartão:', err);
    return null;
  }
}, [isAuthenticated, user]);

};


export default useDashboardData;