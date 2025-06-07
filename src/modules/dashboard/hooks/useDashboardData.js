import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import useContas from '@modules/contas/hooks/useContas';
import useCartoes from '@modules/cartoes/hooks/useCartoes';
import useTransacoes from '@modules/transacoes/hooks/useTransacoes';
import useAuth from '@/modules/auth/hooks/useAuth'; 

const useDashboardData = (dataReferencia = new Date()) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  const { categorias } = useCategorias();
  const { contas, saldoTotal, loading: contasLoading } = useContas();
  const { cartoes, limiteTotal, loading: cartoesLoading } = useCartoes();
  const { transacoes, getTotalReceitas, getTotalDespesas, getReceitasPorCategoria, getDespesasPorCategoria, loading: transacoesLoading } = useTransacoes();
  const { user, isAuthenticated } = useAuth();

  const calcularSaldoConta = (conta, transacoes, incluirPrevistos = false) => {
    let transacoesFiltradas;

    if (incluirPrevistos) {
    const ultimoDiaMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0);
      transacoesFiltradas = transacoes.filter(trans =>
        trans.conta_id === conta.id &&
        ((trans.status === 'realizado' && new Date(trans.data) <= new Date()) ||
         (trans.status === 'pendente' && new Date(trans.data_prevista) <= ultimoDiaMes))
    );
          } else {
      transacoesFiltradas = transacoes.filter(trans =>
        trans.conta_id === conta.id &&
        trans.status === 'realizado' &&
        new Date(trans.data) <= new Date()
      );
          }

    return transacoesFiltradas.reduce((saldo, trans) =>
      saldo + (trans.tipo === 'receita' ? trans.valor : -trans.valor),
      conta.saldo_inicial || 0
    );
      };

  const calcularSaldos = (contas, transacoes) => {
    const saldoAtual = contas.reduce((total, conta) => {
      const saldoConta = calcularSaldoConta(conta, transacoes, false);
      return total + saldoConta;
    }, 0);

    const saldoPrevisto = contas.reduce((total, conta) => {
      const saldoConta = calcularSaldoConta(conta, transacoes, true);
      return total + saldoConta;
    }, 0);

    const ultimoDiaMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0);
    const transacoesFuturas = transacoes.filter(trans =>
      trans.status === 'pendente' &&
      new Date(trans.data_prevista) <= ultimoDiaMes
    );

    console.log('Transações futuras encontradas:', {
      total: transacoesFuturas.length,
      receitas: transacoesFuturas.filter(t => t.tipo === 'receita').length,
      despesas: transacoesFuturas.filter(t => t.tipo === 'despesa').length,
      mes: dataReferencia.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    });
  return {
      atual: saldoAtual,
      previsto: saldoPrevisto,
      temTransacoesFuturas: transacoesFuturas.length > 0
  };
};

  const calcularMovimentos = (transacoes, tipo) => {
    const ultimoDiaMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0);

    const transacoesFiltradas = transacoes.filter(trans =>
      trans.tipo.toLowerCase() === tipo.toLowerCase()
    );

    const atual = transacoesFiltradas
      .filter(trans =>
        trans.status === 'realizado' &&
        new Date(trans.data) <= new Date()
      )
      .reduce((total, trans) => total + (trans.valor || 0), 0);

    const previsto = transacoesFiltradas
      .filter(trans =>
        (trans.status === 'realizado' && new Date(trans.data) <= new Date()) ||
        (trans.status === 'pendente' && new Date(trans.data_prevista) <= ultimoDiaMes)
      )
      .reduce((total, trans) => total + (trans.valor || 0), 0);

    return { atual, previsto };
  };

  const calcularCartoes = (transacoes) => {
    const transacoesCartao = transacoes.filter(trans =>
      trans.tipo === 'despesa' &&
      trans.meio_pagamento === 'cartao_credito' &&
      trans.status !== 'pago'
    );

    const atual = transacoesCartao.reduce((total, trans) => total + trans.valor, 0);
    const limite = limiteTotal || 0;

    return { atual, limite };
  };

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
        console.warn('⚠️ Erro ao buscar perfil (usando fallback):', error.message);
      }

      if (!perfil || error) {
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

        try {
          const { data: novoPerfil, error: createError } = await supabase
            .from('perfil_usuario')
            .insert([novoPerfilData])
            .select()
            .single();

          if (!createError && novoPerfil) {
            setPerfilUsuario(novoPerfil);
          } else {
            setPerfilUsuario(novoPerfilData);
          }
        } catch (createErr) {
          console.warn('⚠️ Erro ao criar perfil (usando dados básicos):', createErr.message);
          setPerfilUsuario(novoPerfilData);
        }
      } else {
        setPerfilUsuario(perfil);
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Erro ao buscar perfil (usando fallback):', err);
      setPerfilUsuario({
        id: user.id,
        nome: user.user_metadata?.full_name ||
              user.user_metadata?.nome ||
              user.email?.split('@')[0] ||
              'Usuário',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null
      });
      return { success: true };
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPerfilUsuario();
    } else {
      setPerfilUsuario(null);
    }
  }, [isAuthenticated, user, fetchPerfilUsuario]);

  useEffect(() => {
    if (!isAuthenticated || !perfilUsuario) {
      setData(null);
      setLoading(false);
      return;
    }

    if (contasLoading || cartoesLoading || transacoesLoading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const saldos = calcularSaldos(contas, transacoes);
      const receitas = calcularMovimentos(transacoes, 'receita');
      const despesas = calcularMovimentos(transacoes, 'despesa');
      const dadosCartao = calcularCartoes(transacoes);

      console.log('Debug valores atualizados:', {
        saldoAtual: saldos.atual,
        saldoPrevisto: saldos.previsto,
        temTransacoesFuturas: saldos.temTransacoesFuturas,
        receitaAtual: receitas.atual,
        receitaPrevista: receitas.previsto,
        despesaAtual: despesas.atual,
        despesaPrevista: despesas.previsto,
        dataReferencia: dataReferencia.toLocaleDateString('pt-BR')
      });

      const dashboardData = {
        usuario: {
          id: perfilUsuario.id,
          nome: perfilUsuario.nome,
          email: perfilUsuario.email,
          avatar_url: perfilUsuario.avatar_url
        },

        saldo: {
          atual: saldos.atual,
          previsto: saldos.previsto,
          temTransacoesFuturas: saldos.temTransacoesFuturas,
          ultimaAtualizacao: new Date().toLocaleString('pt-BR')
        },

        contasDetalhadas: contas.map(conta => ({
          nome: conta.nome,
          tipo: conta.tipo,
          saldo: calcularSaldoConta(conta, transacoes),
          cor: conta.cor || '#3B82F6'
        })),

        receitas: {
          atual: receitas.atual,
          previsto: receitas.previsto,
          ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
          categorias: getReceitasPorCategoria().slice(0, 5)
        },

        despesas: {
          atual: despesas.atual,
          previsto: despesas.previsto,
          ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
          categorias: getDespesasPorCategoria().slice(0, 5)
        },

        cartaoCredito: {
          atual: dadosCartao.atual,
          limite: dadosCartao.limite,
          ultimaAtualizacao: new Date().toLocaleString('pt-BR')
        },

        cartoesDetalhados: cartoes.map(cartao => ({
          nome: cartao.nome,
          bandeira: cartao.bandeira,
          limite: cartao.limite || 0,
          usado: dadosCartao.atual,
          cor: cartao.cor || '#8B5CF6'
        })),

        receitasPorCategoria: getReceitasPorCategoria(),
        despesasPorCategoria: getDespesasPorCategoria(),

        resumo: {
          totalContas: contas.length,
          totalCartoes: cartoes.length,
          totalCategorias: categorias.length,
          totalTransacoes: transacoes.length,
          saldoLiquido: saldos.atual,
          balanco: receitas.atual - despesas.atual,
          percentualGasto: receitas.atual > 0 ?
            ((despesas.atual / receitas.atual) * 100).toFixed(1) : 0
        },

        historico: [],
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
    dataReferencia,
    limiteTotal,
    contasLoading,
    cartoesLoading,
    transacoesLoading,
    getReceitasPorCategoria,
    getDespesasPorCategoria
  ]);

  const refreshCalendario = useCallback(async () => {
    console.log('🔄 Refresh do calendário solicitado');
    return Promise.resolve();
  }, []);

  return {
    data,
    loading,
    error,
    perfilUsuario,
    refreshData: fetchPerfilUsuario,
    refreshCalendario
  };
};

export default useDashboardData;