// src/hooks/useDashboardData.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import useContas from '@modules/contas/hooks/useContas';
import useCartoes from '@modules/cartoes/hooks/useCartoes';
import useTransacoes from '@modules/transacoes/hooks/useTransacoes';
import useAuth from '@/modules/auth/hooks/useAuth';
import usePeriodo from '@modules/transacoes/hooks/usePeriodo'; // ✅ ADICIONADO: Hook de período

/**
 * Hook para dashboard com período e usuário dinâmicos
 * ✅ Usa o mês selecionado dinamicamente
 * ✅ Usa o usuário autenticado atual
 * ✅ Atualiza quando período ou usuário muda
 */
const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  // Hooks de dados existentes
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
  
  // ✅ NOVO: Hook de período para datas dinâmicas
  const { getDateRange, getFormattedPeriod, currentDate } = usePeriodo();

  // ✅ FUNÇÃO ATUALIZADA: Buscar dados via funções SQL com período e usuário dinâmicos
  const fetchDadosSQL = useCallback(async () => {
    try {
      console.log('📊 Buscando dados via funções SQL...');
      
      // ✅ USUÁRIO DINÂMICO: Usar usuário autenticado atual
      const usuarioId = user?.id;
      if (!usuarioId) {
        console.warn('⚠️ Usuário não encontrado, usando fallback local');
        throw new Error('Usuário não autenticado');
      }
      
      // ✅ PERÍODO DINÂMICO: Obter período atual selecionado
      const { inicio, fim } = getDateRange();
      const dataInicio = inicio.toISOString().split('T')[0]; // YYYY-MM-DD
      const dataFim = fim.toISOString().split('T')[0]; // YYYY-MM-DD
      const periodoFormatado = getFormattedPeriod();

      console.log(`👤 Usuário dinâmico: ${usuarioId}`);
      console.log(`📅 Período dinâmico: ${dataInicio} até ${dataFim} (${periodoFormatado})`);

      // ✅ Executar funções SQL com dados dinâmicos
      const [
        saldoAtualResult,
        saldoPrevistoResult,
        receitasEfetivadasResult,
        receitasTotaisResult,
        despesasEfetivadasResult,
        despesasTotaisResult
      ] = await Promise.all([
        supabase.rpc('gpt_saldo_atual', { usuario: usuarioId }), // ✅ Usuário dinâmico
        supabase.rpc('gpt_saldo_previsto', { usuario: usuarioId, data_fim: dataFim }), // ✅ Data fim dinâmica
        supabase.rpc('gpt_receitas_efetivadas_mes', { 
          usuario: usuarioId, // ✅ Usuário dinâmico
          data_inicio: dataInicio, // ✅ Período dinâmico
          data_fim: dataFim 
        }),
        supabase.rpc('gpt_receitas_totais_mes', { 
          usuario: usuarioId, // ✅ Usuário dinâmico
          data_inicio: dataInicio, // ✅ Período dinâmico
          data_fim: dataFim 
        }),
        supabase.rpc('gpt_despesas_efetivadas_mes', { 
          usuario: usuarioId, // ✅ Usuário dinâmico
          data_inicio: dataInicio, // ✅ Período dinâmico
          data_fim: dataFim 
        }),
        supabase.rpc('gpt_despesas_totais_mes', { 
          usuario: usuarioId, // ✅ Usuário dinâmico
          data_inicio: dataInicio, // ✅ Período dinâmico
          data_fim: dataFim 
        })
      ]);

      // ✅ Verificar erros primeiro
      const erros = [
        saldoAtualResult.error && `saldo_atual: ${saldoAtualResult.error.message}`,
        saldoPrevistoResult.error && `saldo_previsto: ${saldoPrevistoResult.error.message}`,
        receitasEfetivadasResult.error && `receitas_efetivadas: ${receitasEfetivadasResult.error.message}`,
        receitasTotaisResult.error && `receitas_totais: ${receitasTotaisResult.error.message}`,
        despesasEfetivadasResult.error && `despesas_efetivadas: ${despesasEfetivadasResult.error.message}`,
        despesasTotaisResult.error && `despesas_totais: ${despesasTotaisResult.error.message}`
      ].filter(Boolean);

      if (erros.length > 0) {
        console.error('❌ Erros nas funções SQL:', erros);
        throw new Error(`Erros SQL: ${erros.join(', ')}`);
      }

      // ✅ Processar resultados
      const saldoAtual = Number(saldoAtualResult.data) || 0;
      const saldoPrevisto = Number(saldoPrevistoResult.data) || 0;
      const receitasEfetivadas = Number(receitasEfetivadasResult.data) || 0;
      const receitasTotais = Number(receitasTotaisResult.data) || 0;
      const despesasEfetivadas = Number(despesasEfetivadasResult.data) || 0;
      const despesasTotais = Number(despesasTotaisResult.data) || 0;

      console.log('✅ Resultados SQL para período atual:', {
        periodo: periodoFormatado,
        saldoAtual,
        saldoPrevisto,
        receitasEfetivadas,
        receitasTotais,
        despesasEfetivadas,
        despesasTotais
      });

      return {
        saldoAtual,
        saldoPrevisto,
        receitasEfetivadas,
        receitasTotais,
        despesasEfetivadas,
        despesasTotais,
        periodo: periodoFormatado,
        usouSQL: true
      };

    } catch (err) {
      console.warn('⚠️ Erro ao buscar dados SQL, usando fallback local:', err.message);
      
      // ✅ Fallback para dados locais
      const totalReceitas = getTotalReceitas();
      const totalDespesas = getTotalDespesas();
      
      return {
        saldoAtual: saldoTotal || 0,
        saldoPrevisto: (saldoTotal || 0) + (totalReceitas * 0.1), // +10% projeção
        receitasEfetivadas: totalReceitas,
        receitasTotais: totalReceitas * 1.05, // +5% projeção
        despesasEfetivadas: totalDespesas,
        despesasTotais: totalDespesas * 0.95, // -5% economia estimada
        periodo: getFormattedPeriod(),
        usouSQL: false
      };
    }
  }, [user, getDateRange, getFormattedPeriod, saldoTotal, getTotalReceitas, getTotalDespesas]);

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
        console.warn('⚠️ Erro ao buscar perfil (usando fallback):', error.message);
      }

      // Se não encontrou perfil ou houve erro, criar um básico
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

        // Tenta criar novo perfil, mas não falha se der erro
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
      return { success: true }; // Não falha, usa dados básicos
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

  // ✅ PRINCIPAL: Calcula dados do dashboard - AGORA REAGINDO A MUDANÇAS DE PERÍODO
  useEffect(() => {
    const calcularDashboard = async () => {
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

        console.log('🚀 Calculando dados do dashboard...', {
          usuario: user?.email,
          periodo: getFormattedPeriod(),
          contas: contas.length,
          cartoes: cartoes.length,
          transacoes: transacoes.length,
          categorias: categorias.length
        });

        // ✅ Buscar dados via funções SQL com período dinâmico
        const dadosSQL = await fetchDadosSQL();

        // ✅ Obter dados de categorias (mantido como estava)
        const receitasPorCategoria = getReceitasPorCategoria();
        const despesasPorCategoria = getDespesasPorCategoria();

        // ✅ Calcular projeções para cartão
        const projecaoCartao = (limiteTotal || 0) * 0.25; // 25% do limite

        // ✅ Monta dados finais do dashboard usando resultados SQL
        const dashboardData = {
          // Dados do usuário
          usuario: {
            id: perfilUsuario.id,
            nome: perfilUsuario.nome,
            email: perfilUsuario.email,
            avatar_url: perfilUsuario.avatar_url
          },
          
          // ✅ SALDO - Agora vem das funções SQL
          saldo: {
            atual: dadosSQL.saldoAtual,
            previsto: dadosSQL.saldoPrevisto,
            ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
            fonte: dadosSQL.usouSQL ? 'SQL' : 'LOCAL',
            periodo: dadosSQL.periodo // ✅ Incluir período atual
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
          
          // ✅ RECEITAS - Agora vem das funções SQL
          receitas: {
            atual: dadosSQL.receitasEfetivadas,
            previsto: dadosSQL.receitasTotais,
            ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
            categorias: receitasPorCategoria.slice(0, 5), // Top 5 categorias
            fonte: dadosSQL.usouSQL ? 'SQL' : 'LOCAL',
            periodo: dadosSQL.periodo // ✅ Incluir período atual
          },
          
          // ✅ DESPESAS - Agora vem das funções SQL
          despesas: {
            atual: dadosSQL.despesasEfetivadas,
            previsto: dadosSQL.despesasTotais,
            ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
            categorias: despesasPorCategoria.slice(0, 5), // Top 5 categorias
            fonte: dadosSQL.usouSQL ? 'SQL' : 'LOCAL',
            periodo: dadosSQL.periodo // ✅ Incluir período atual
          },
          
          // Cartão de crédito (mantido como estava)
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
          
          // ✅ Resumo atualizado com dados SQL
          resumo: {
            totalContas: contas.length,
            totalCartoes: cartoes.length,
            totalCategorias: categorias.length,
            totalTransacoes: transacoes.length,
            saldoLiquido: dadosSQL.saldoAtual,
            balanco: dadosSQL.receitasEfetivadas - dadosSQL.despesasEfetivadas,
            percentualGasto: dadosSQL.receitasEfetivadas > 0 ? 
              ((dadosSQL.despesasEfetivadas / dadosSQL.receitasEfetivadas) * 100).toFixed(1) : 0
          },
          
          // Histórico para gráficos (dados básicos)
          historico: [],
          
          // ✅ Debug info
          debug: {
            usouSQL: dadosSQL.usouSQL,
            usuario: user?.email,
            periodo: dadosSQL.periodo,
            timestamp: new Date().toISOString()
          },
          
          // Timestamp da última atualização
          ultimaAtualizacao: new Date().toLocaleString('pt-BR')
        };

        setData(dashboardData);
        setLoading(false);
        setError(null);

        console.log('✅ Dashboard calculado com sucesso:', {
          periodo: dadosSQL.periodo,
          saldoTotal: dadosSQL.saldoAtual,
          totalReceitas: dadosSQL.receitasEfetivadas,
          totalDespesas: dadosSQL.despesasEfetivadas,
          balanco: dadosSQL.receitasEfetivadas - dadosSQL.despesasEfetivadas,
          usouSQL: dadosSQL.usouSQL
        });

      } catch (err) {
        console.error('❌ Erro ao calcular dados do dashboard:', err);
        setError('Erro ao carregar dados do dashboard');
        setLoading(false);
      }
    };

    calcularDashboard();
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
    getReceitasPorCategoria,
    getDespesasPorCategoria,
    fetchDadosSQL,
    currentDate, // ✅ NOVO: Reagir a mudanças de período
    user // ✅ NOVO: Reagir a mudanças de usuário
  ]);

  // Função de refresh simplificada
  const refreshCalendario = useCallback(async () => {
    // Para o calendário, vamos deixar ele fazer sua própria busca
    // Isso evita problemas de sincronização
    console.log('🔄 Refresh do calendário solicitado');
    return Promise.resolve();
  }, []);

  // ✅ Função para forçar reload dos dados
  const refreshData = useCallback(async () => {
    console.log('🔄 Forçando reload dos dados do dashboard...');
    setLoading(true);
    setData(null);
    await fetchPerfilUsuario();
  }, [fetchPerfilUsuario]);

  return { 
    data, 
    loading, 
    error,
    perfilUsuario,
    refreshData,
    refreshCalendario
  };
};

export default useDashboardData;