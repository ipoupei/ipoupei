
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import useContas from '@modules/contas/hooks/useContas';
import useCartoes from '@modules/cartoes/hooks/useCartoes';
import useTransacoes from '@modules/transacoes/hooks/useTransacoes';
import useAuth from '@/modules/auth/hooks/useAuth';

/**
 * Hook atualizado com funções SQL otimizadas no Supabase
 */
const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  const { categorias } = useCategorias();
  const { contas, loading: contasLoading } = useContas();
  const { cartoes, limiteTotal, loading: cartoesLoading } = useCartoes();
  const { 
    transacoes,
    getReceitasPorCategoria,
    getDespesasPorCategoria,
    loading: transacoesLoading 
  } = useTransacoes();
  const { user, isAuthenticated } = useAuth();

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

      if (!perfil || error) {
        const novoPerfilData = {
          id: user.id,
          nome: user.user_metadata?.full_name || user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
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

          setPerfilUsuario(novoPerfil || novoPerfilData);
        } catch {
          setPerfilUsuario(novoPerfilData);
        }
      } else {
        setPerfilUsuario(perfil);
      }

      return { success: true };
    } catch {
      setPerfilUsuario({
        id: user.id,
        nome: user.user_metadata?.full_name || user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null
      });
      return { success: true };
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) fetchPerfilUsuario();
    else setPerfilUsuario(null);
  }, [isAuthenticated, user, fetchPerfilUsuario]);

  useEffect(() => {
    const fetchDadosDashboard = async () => {
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

        const usuarioId = perfilUsuario.id;
        const dataInicio = '2025-06-01';
        const dataFim = '2025-06-30';

        const [
          { data: saldoAtual },
          { data: saldoPrevisto },
          { data: receitasEfetivas },
          { data: receitasTotais },
          { data: despesasEfetivas },
          { data: despesasTotais }
        ] = await Promise.all([
          supabase.rpc('GPT_saldo_atual', { usuario: usuarioId }),
          supabase.rpc('GPT_saldo_previsto', { usuario: usuarioId, data_fim: dataFim }),
          supabase.rpc('GPT_receitas_efetivadas_mes', { usuario: usuarioId, data_inicio: dataInicio, data_fim: dataFim }),
          supabase.rpc('GPT_receitas_totais_mes', { usuario: usuarioId, data_inicio: dataInicio, data_fim: dataFim }),
          supabase.rpc('GPT_despesas_efetivadas_mes', { usuario: usuarioId, data_inicio: dataInicio, data_fim: dataFim }),
          supabase.rpc('GPT_despesas_totais_mes', { usuario: usuarioId, data_inicio: dataInicio, data_fim: dataFim })
        ]);

        const receitasPorCategoria = getReceitasPorCategoria();
        const despesasPorCategoria = getDespesasPorCategoria();

        const dashboardData = {
          usuario: {
            id: perfilUsuario.id,
            nome: perfilUsuario.nome,
            email: perfilUsuario.email,
            avatar_url: perfilUsuario.avatar_url
          },
          saldo: {
            atual: saldoAtual || 0,
            previsto: saldoPrevisto || 0,
            ultimaAtualizacao: new Date().toLocaleString('pt-BR')
          },
          contasDetalhadas: contas.map(conta => ({
            nome: conta.nome,
            tipo: conta.tipo || 'Outro',
            saldo: conta.saldo || 0,
            cor: conta.cor || '#3B82F6'
          })),
          receitas: {
            atual: receitasEfetivas || 0,
            previsto: receitasTotais || 0,
            ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
            categorias: receitasPorCategoria.slice(0, 5)
          },
          despesas: {
            atual: despesasEfetivas || 0,
            previsto: despesasTotais || 0,
            ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
            categorias: despesasPorCategoria.slice(0, 5)
          },
          cartaoCredito: {
            atual: (limiteTotal || 0) * 0.3,
            previsto: (limiteTotal || 0) * 0.25,
            limite: limiteTotal || 0,
            ultimaAtualizacao: new Date().toLocaleString('pt-BR')
          },
          cartoesDetalhados: cartoes.map(cartao => ({
            nome: cartao.nome,
            bandeira: cartao.bandeira || 'Outro',
            limite: cartao.limite || 0,
            usado: (cartao.limite || 0) * 0.3,
            cor: cartao.cor || '#8B5CF6'
          })),
          receitasPorCategoria: receitasPorCategoria.length > 0 ? receitasPorCategoria : [
            { nome: "Sem receitas", valor: 0, color: "#E5E7EB" }
          ],
          despesasPorCategoria: despesasPorCategoria.length > 0 ? despesasPorCategoria : [
            { nome: "Sem despesas", valor: 0, color: "#E5E7EB" }
          ],
          resumo: {
            totalContas: contas.length,
            totalCartoes: cartoes.length,
            totalCategorias: categorias.length,
            totalTransacoes: transacoes.length,
            saldoLiquido: saldoAtual || 0,
            balanco: (receitasEfetivas || 0) - (despesasEfetivas || 0),
            percentualGasto: receitasEfetivas > 0 ? ((despesasEfetivas / receitasEfetivas) * 100).toFixed(1) : 0
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
    };

    fetchDadosDashboard();
  }, [
    isAuthenticated,
    perfilUsuario,
    categorias,
    contas,
    cartoes,
    transacoes,
    contasLoading,
    cartoesLoading,
    transacoesLoading,
    getReceitasPorCategoria,
    getDespesasPorCategoria,
    limiteTotal
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
