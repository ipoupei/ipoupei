// src/modules/dashboard/components/CalendarioFinanceiro.jsx - RPC CORRIGIDO
import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, isSameDay, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';
import '@modules/dashboard/styles/CalendarioFinanceiro.css';

/**
 * Calendário Financeiro - VERSÃO COM RPC CORRIGIDO
 * ✅ Corrigiu nomes dos parâmetros das funções RPC
 * ✅ Melhor tratamento de erros
 * ✅ Logs detalhados para debug
 * ✅ Fallback robusto para consultas diretas
 */
const CalendarioFinanceiro = ({ mes = new Date().getMonth(), ano = new Date().getFullYear(), onDiaClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [diasDoMes, setDiasDoMes] = useState([]);
  const [movimentosPorDia, setMovimentosPorDia] = useState({});
  const [hoveredDay, setHoveredDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumoMes, setResumoMes] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoMes: 0
  });

  // Calcula período do mês de forma segura
  const periodoMes = useMemo(() => {
    try {
      const primeiroDia = startOfMonth(new Date(ano, mes));
      const ultimoDia = endOfMonth(primeiroDia);
      return { primeiroDia, ultimoDia };
    } catch (err) {
      console.error('Erro ao calcular período:', err);
      const hoje = new Date();
      const primeiroDia = startOfMonth(hoje);
      const ultimoDia = endOfMonth(hoje);
      return { primeiroDia, ultimoDia };
    }
  }, [mes, ano]);

  // ✅ Função para converter data de forma segura
  const parseDataSegura = (dataString) => {
    if (!dataString) return null;
    
    try {
      if (dataString instanceof Date && isValid(dataString)) {
        return dataString;
      }
      
      if (typeof dataString === 'string') {
        if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [ano, mes, dia] = dataString.split('-');
          const dataLocal = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);
          if (isValid(dataLocal)) return dataLocal;
        }
        
        if (dataString.includes('T')) {
          const [datePart] = dataString.split('T');
          const [ano, mes, dia] = datePart.split('-');
          const dataLocal = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);
          if (isValid(dataLocal)) return dataLocal;
        }
        
        if (dataString.includes('/')) {
          const [dia, mes, ano] = dataString.split('/');
          const converted = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);
          if (isValid(converted)) return converted;
        }
      }
      
      return null;
    } catch (err) {
      console.warn('Erro ao converter data:', dataString, err);
      return null;
    }
  };

  // ✅ Busca totais com parâmetros corrigidos
  const fetchTotaisMes = async () => {
    if (!isAuthenticated || !user) {
      return { totalReceitas: 0, totalDespesas: 0, saldoMes: 0 };
    }

    try {
      const dataInicio = format(periodoMes.primeiroDia, 'yyyy-MM-dd');
      const dataFim = format(periodoMes.ultimoDia, 'yyyy-MM-dd');

      console.log('📊 Buscando totais do mês:', { dataInicio, dataFim, userId: user.id });

      let totalReceitas = 0;
      let totalDespesas = 0;

      // ✅ Query direta sempre como fallback confiável
      try {
        const [receitasResult, despesasResult] = await Promise.all([
          supabase
            .from('transacoes')
            .select('valor')
            .eq('usuario_id', user.id)
            .eq('tipo', 'receita')
            .gte('data', dataInicio)
            .lte('data', dataFim)
            .or('transferencia.is.null,transferencia.eq.false'),
          supabase
            .from('transacoes')
            .select('valor')
            .eq('usuario_id', user.id)
            .eq('tipo', 'despesa')
            .gte('data', dataInicio)
            .lte('data', dataFim)
            .or('transferencia.is.null,transferencia.eq.false')
        ]);

        if (receitasResult.error) throw receitasResult.error;
        if (despesasResult.error) throw despesasResult.error;

        totalReceitas = (receitasResult.data || []).reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
        totalDespesas = (despesasResult.data || []).reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);

        console.log('✅ Totais calculados via query direta:', { 
          receitas: totalReceitas, 
          despesas: totalDespesas
        });
      } catch (queryError) {
        console.error('❌ Erro na query direta:', queryError);
        totalReceitas = 0;
        totalDespesas = 0;
      }

      const saldo = totalReceitas - totalDespesas;

      return {
        totalReceitas,
        totalDespesas,
        saldoMes: saldo
      };

    } catch (err) {
      console.error('❌ Erro ao buscar totais:', err);
      return { totalReceitas: 0, totalDespesas: 0, saldoMes: 0 };
    }
  };

  // ✅ Busca transações com parâmetros RPC CORRIGIDOS
  const fetchTransacoesMes = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const dataInicio = format(periodoMes.primeiroDia, 'yyyy-MM-dd');
      const dataFim = format(periodoMes.ultimoDia, 'yyyy-MM-dd');

      console.log('💰 Buscando transações:', { 
        dataInicio, 
        dataFim, 
        userId: user.id
      });

      let transacoesEnriquecidas;
      let usouRPC = false;

      // ✅ Tentar RPC primeiro com PARÂMETROS CORRETOS
      try {
        console.log('🔧 Tentando RPC com parâmetros corretos...');
        
        const { data: transacoesData, error: transacoesError } = await supabase.rpc('gpt_transacoes_do_mes', {
          p_usuario_id: user.id,        // ✅ CORRIGIDO: p_usuario_id
          p_data_inicio: dataInicio,    // ✅ CORRIGIDO: p_data_inicio
          p_data_fim: dataFim          // ✅ CORRIGIDO: p_data_fim
        });

        if (!transacoesError && transacoesData) {
          // ✅ RPC funcionou - mapear estrutura
          transacoesEnriquecidas = transacoesData.map(transacao => ({
            ...transacao,
            categoria: {
              nome: transacao.categoria_nome || 'Sem categoria',
              cor: transacao.categoria_cor || '#6B7280'
            },
            conta: {
              nome: transacao.conta_nome || 'Conta não informada',
              tipo: 'outros'
            }
          }));
          usouRPC = true;
          console.log('✅ RPC gpt_transacoes_do_mes funcionou com parâmetros corretos!');
        } else {
          throw new Error(`RPC falhou: ${transacoesError?.message || 'Erro desconhecido'}`);
        }
      } catch (rpcError) {
        console.warn('⚠️ RPC falhou, usando query direta:', rpcError.message);

        // ✅ Fallback: Query direta SEMPRE
        const { data: transacoesData, error: queryError } = await supabase
          .from('transacoes')
          .select(`
            id,
            data,
            tipo,
            valor,
            descricao,
            observacoes,
            categoria_id,
            conta_id,
            created_at,
            transferencia
          `)
          .eq('usuario_id', user.id)
          .gte('data', dataInicio)
          .lte('data', dataFim)
          .or('transferencia.is.null,transferencia.eq.false')
          .order('data', { ascending: true });

        if (queryError) throw queryError;

        // Buscar categorias e contas
        const [categoriasResult, contasResult] = await Promise.all([
          supabase
            .from('categorias')
            .select('id, nome, cor, icone')
            .eq('usuario_id', user.id)
            .eq('ativo', true),
          supabase
            .from('contas')
            .select('id, nome, tipo')
            .eq('usuario_id', user.id)
            .eq('ativo', true)
        ]);

        const categoriasData = categoriasResult.data || [];
        const contasData = contasResult.data || [];

        // Enriquecer dados
        transacoesEnriquecidas = (transacoesData || []).map(transacao => ({
          ...transacao,
          categoria: {
            nome: categoriasData.find(c => c.id === transacao.categoria_id)?.nome || 'Sem categoria',
            cor: categoriasData.find(c => c.id === transacao.categoria_id)?.cor || '#6B7280'
          },
          conta: {
            nome: contasData.find(c => c.id === transacao.conta_id)?.nome || 'Conta não informada',
            tipo: 'outros'
          }
        }));
        console.log('✅ Query direta funcionou como fallback!');
      }

      console.log('📊 Transações processadas:', {
        quantidade: transacoesEnriquecidas.length,
        receitas: transacoesEnriquecidas.filter(t => t.tipo === 'receita').length,
        despesas: transacoesEnriquecidas.filter(t => t.tipo === 'despesa').length,
        usouRPC
      });

      // ✅ Busca totais
      const totais = await fetchTotaisMes();
      setResumoMes(totais);

      // ✅ Organiza transações por dia
      organizarTransacoesPorDia(transacoesEnriquecidas);

    } catch (err) {
      console.error('❌ Erro ao carregar dados do calendário:', err);
      setError(`Erro ao carregar transações: ${err.message}`);
      setMovimentosPorDia({});
      setResumoMes({ totalReceitas: 0, totalDespesas: 0, saldoMes: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Organiza transações por dia
  const organizarTransacoesPorDia = (transacoes) => {
    try {
      const primeiroDia = periodoMes.primeiroDia;
      const ultimoDia = periodoMes.ultimoDia;
      const diasIntervalo = eachDayOfInterval({ start: primeiroDia, end: ultimoDia });
      
      setDiasDoMes(diasIntervalo);
      
      const porDia = {};
      
      console.log('📅 Organizando transações por dia:', {
        periodoInicio: format(primeiroDia, 'yyyy-MM-dd'),
        periodoFim: format(ultimoDia, 'yyyy-MM-dd'),
        totalTransacoes: transacoes.length
      });
      
      transacoes.forEach((transacao, index) => {
        let dataTransacao = null;
        
        if (typeof transacao.data === 'string') {
          if (transacao.data.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [ano, mes, dia] = transacao.data.split('-');
            dataTransacao = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);
          } else {
            dataTransacao = parseDataSegura(transacao.data);
          }
        } else {
          dataTransacao = parseDataSegura(transacao.data);
        }
        
        if (!dataTransacao || !isValid(dataTransacao)) {
          console.warn('Data inválida encontrada:', {
            transacao: transacao.data,
            index,
            descricao: transacao.descricao
          });
          return;
        }
        
        const diaFormatado = format(dataTransacao, 'yyyy-MM-dd');
        const dentroDoMes = dataTransacao >= primeiroDia && dataTransacao <= ultimoDia;
        
        if (dentroDoMes) {
          if (!porDia[diaFormatado]) {
            porDia[diaFormatado] = [];
          }
          
          porDia[diaFormatado].push(transacao);
        }
      });
      
      setMovimentosPorDia(porDia);
      
      console.log('✅ Movimentos organizados:', {
        diasComMovimentos: Object.keys(porDia).length,
        totalTransacoesProcessadas: transacoes.length,
        diasEncontrados: Object.keys(porDia).sort()
      });
      
    } catch (err) {
      console.error('❌ Erro ao organizar transações:', err);
      setMovimentosPorDia({});
    }
  };

  // Carrega dados quando período muda
  useEffect(() => {
    fetchTransacoesMes();
  }, [mes, ano, isAuthenticated, user]);

  // ✅ Função para buscar totais do dia com parâmetros CORRETOS
  const fetchTotaisDoDia = async (dia) => {
    if (!isAuthenticated || !user) {
      return { receitas: 0, despesas: 0, saldo: 0, numLancamentos: 0 };
    }

    try {
      const dataFormatada = format(dia, 'yyyy-MM-dd');

      console.log('🔢 Buscando totais do dia via RPC:', { data: dataFormatada, userId: user.id });

      // ✅ Tentar usar função RPC com PARÂMETROS CORRETOS
      const { data: resumoDia, error: resumoError } = await supabase.rpc('gpt_resumo_do_dia', {
        p_usuario_id: user.id,          // ✅ CORRIGIDO: p_usuario_id
        p_data_especifica: dataFormatada // ✅ CORRIGIDO: p_data_especifica
      });

      if (resumoError) {
        console.warn('⚠️ Erro na RPC resumo do dia, usando dados locais:', resumoError);
        
        // ✅ Fallback: usar dados já carregados se RPC falhar
        const movimentosDoDia = movimentosPorDia[dataFormatada] || [];
        const totais = { 
          receitas: 0, 
          despesas: 0, 
          saldo: 0, 
          numLancamentos: movimentosDoDia.length
        };
        
        movimentosDoDia.forEach(mov => {
          const valor = parseFloat(mov.valor) || 0;
          if (mov.tipo === 'receita') {
            totais.receitas += valor;
          } else if (mov.tipo === 'despesa') {
            totais.despesas += valor;
          }
        });
        
        totais.saldo = totais.receitas - totais.despesas;
        return totais;
      }

      // ✅ Processar resultado da RPC
      const totais = {
        receitas: parseFloat(resumoDia?.total_receitas || 0),
        despesas: parseFloat(resumoDia?.total_despesas || 0),
        saldo: parseFloat(resumoDia?.total_receitas || 0) - parseFloat(resumoDia?.total_despesas || 0),
        numLancamentos: parseInt(resumoDia?.total_transacoes || 0)
      };

      console.log('✅ Totais do dia obtidos via RPC:', { data: dataFormatada, totais });

      return totais;

    } catch (err) {
      console.error('❌ Erro ao buscar totais do dia:', err);
      
      // ✅ Fallback final: usar dados locais
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
      const totais = { 
        receitas: 0, 
        despesas: 0, 
        saldo: 0, 
        numLancamentos: movimentosDoDia.length
      };
      
      movimentosDoDia.forEach(mov => {
        const valor = parseFloat(mov.valor) || 0;
        if (mov.tipo === 'receita') {
          totais.receitas += valor;
        } else if (mov.tipo === 'despesa') {
          totais.despesas += valor;
        }
      });
      
      totais.saldo = totais.receitas - totais.despesas;
      return totais;
    }
  };

  // ✅ Função fallback para indicadores (usa dados locais já filtrados)
  const calcularTotaisDoDiaLocal = (dia) => {
    try {
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
      
      const totais = { 
        receitas: 0, 
        despesas: 0, 
        saldo: 0, 
        numLancamentos: movimentosDoDia.length
      };
      
      movimentosDoDia.forEach(mov => {
        const valor = parseFloat(mov.valor) || 0;
        if (mov.tipo === 'receita') {
          totais.receitas += valor;
        } else if (mov.tipo === 'despesa') {
          totais.despesas += valor;
        }
      });
      
      totais.saldo = totais.receitas - totais.despesas;
      return totais;
    } catch (err) {
      return { receitas: 0, despesas: 0, saldo: 0, numLancamentos: 0 };
    }
  };

  // Classes CSS do dia
  const getDiaClasses = (dia) => {
    try {
      const hoje = new Date();
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
      
      const classes = ['calendario-dia'];
      
      if (isSameDay(dia, hoje)) {
        classes.push('dia-atual');
      }
      
      if (movimentosDoDia.length > 0) {
        classes.push('tem-movimentos');
        
        const temReceita = movimentosDoDia.some(m => m.tipo === 'receita');
        const temDespesa = movimentosDoDia.some(m => m.tipo === 'despesa');
        
        if (temReceita) classes.push('tem-receita');
        if (temDespesa) classes.push('tem-despesa');
      }
      
      return classes.join(' ');
    } catch (err) {
      return 'calendario-dia';
    }
  };

// ✅ CORREÇÃO DO HANDLER DE CLIQUE NO DIA
// ✅ VERSÃO COM DEBUG DETALHADO E FALLBACK ROBUSTO
// Substitua a função handleDiaClick por esta versão:

const handleDiaClick = async (dia) => {
  try {
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
    
    console.log('🔍 Clique no dia - ANÁLISE DETALHADA:', { 
      data: diaFormatado, 
      movimentosLocais: movimentosDoDia.length,
      temCallback: !!onDiaClick,
      movimentosDetalhes: movimentosDoDia.map(m => ({
        id: m.id,
        tipo: m.tipo,
        valor: m.valor,
        descricao: m.descricao,
        transferencia: m.transferencia,
        efetivado: m.efetivado
      }))
    });
    
    if (onDiaClick) {
      console.log('🔍 Preparando dados para o modal...');

      let movimentosProcessados = [];
      let totais = { 
        total_receitas: 0, 
        total_despesas: 0, 
        saldo: 0, 
        total_transacoes: 0 
      };

      // ✅ Se há movimentos, processar dados detalhadamente
      if (movimentosDoDia.length > 0) {
        try {
          console.log('📊 Buscando detalhes via RPC para dia com movimentos...');
          console.log('🔍 Dados locais para comparação:', {
            totalLocal: movimentosDoDia.length,
            tiposLocal: movimentosDoDia.map(m => `${m.tipo}:${m.valor}`),
            transferenciasLocal: movimentosDoDia.filter(m => m.transferencia).length,
            naoEfetivadosLocal: movimentosDoDia.filter(m => m.efetivado === false).length
          });
          
          // ✅ Chamadas RPC paralelas
          const [detalhesResult, resumoResult] = await Promise.all([
            supabase.rpc('gpt_detalhes_do_dia', {
              p_usuario_id: user.id,
              p_data_especifica: diaFormatado
            }),
            supabase.rpc('gpt_resumo_do_dia', {
              p_usuario_id: user.id,
              p_data_especifica: diaFormatado
            })
          ]);

          console.log('🔍 Resultados das RPCs:', {
            detalhesError: detalhesResult.error,
            detalhesCount: detalhesResult.data?.length || 0,
            resumoError: resumoResult.error,
            resumoData: resumoResult.data?.[0] || null
          });

          // ✅ Processar detalhes (movimentações)
          if (!detalhesResult.error && detalhesResult.data && detalhesResult.data.length > 0) {
            movimentosProcessados = detalhesResult.data.map(mov => ({
              id: mov.id,
              descricao: mov.descricao || 'Sem descrição',
              valor: parseFloat(mov.valor) || 0,
              tipo: mov.tipo,
              categoria: mov.categoria_nome || 'Sem categoria',
              categoria_cor: mov.categoria_cor || '#6B7280',
              conta: mov.conta_nome || 'Conta não informada',
              status: 'realizado',
              hora: mov.hora || '12:00',
              observacoes: mov.observacoes || '',
              data: mov.data
            }));
            console.log('✅ Detalhes obtidos via RPC:', movimentosProcessados.length);
          } else {
            console.warn('⚠️ RPC detalhes retornou vazio, mas há dados locais. Investigando...');
            
            // ✅ FALLBACK MELHORADO: Usar dados locais sempre que RPC falhar
            console.log('🔄 Usando dados locais como fallback...');
            movimentosProcessados = movimentosDoDia.map(mov => ({
              id: mov.id,
              descricao: mov.descricao || 'Sem descrição',
              valor: parseFloat(mov.valor) || 0,
              tipo: mov.tipo,
              categoria: mov.categoria?.nome || 'Sem categoria',
              categoria_cor: mov.categoria?.cor || '#6B7280',
              conta: mov.conta?.nome || 'Conta não informada',
              status: mov.efetivado !== false ? 'realizado' : 'agendado',
              hora: '12:00',
              observacoes: mov.observacoes || '',
              data: mov.data
            }));
            console.log('✅ Usando dados locais:', movimentosProcessados.length);
          }

          // ✅ Processar resumo (totais)
          if (!resumoResult.error && resumoResult.data?.[0]) {
            const resumoData = resumoResult.data[0];
            totais = {
              total_receitas: parseFloat(resumoData.total_receitas) || 0,
              total_despesas: parseFloat(resumoData.total_despesas) || 0,
              saldo: parseFloat(resumoData.saldo) || 0,
              total_transacoes: parseInt(resumoData.total_transacoes) || 0
            };
            console.log('✅ Resumo obtido via RPC:', totais);
          } else {
            console.warn('⚠️ RPC resumo falhou, calculando localmente');
            
            // ✅ FALLBACK: Calcular usando movimentosProcessados (que pode ser RPC ou local)
            const totaisCalculados = {
              total_receitas: 0,
              total_despesas: 0,
              saldo: 0,
              total_transacoes: movimentosProcessados.length
            };
            
            movimentosProcessados.forEach(mov => {
              const valor = parseFloat(mov.valor) || 0;
              if (mov.tipo === 'receita') {
                totaisCalculados.total_receitas += valor;
              } else if (mov.tipo === 'despesa') {
                totaisCalculados.total_despesas += valor;
              }
            });
            
            totaisCalculados.saldo = totaisCalculados.total_receitas - totaisCalculados.total_despesas;
            totais = totaisCalculados;
            
            console.log('✅ Totais calculados localmente:', totais);
          }

          // ✅ VALIDAÇÃO FINAL: Se ainda estiver vazio, forçar dados locais
          if (movimentosProcessados.length === 0 && movimentosDoDia.length > 0) {
            console.warn('🚨 INCONSISTÊNCIA DETECTADA: RPC vazia mas dados locais existem!');
            console.log('🔧 Forçando uso de dados locais...');
            
            movimentosProcessados = movimentosDoDia.map(mov => ({
              id: mov.id,
              descricao: mov.descricao || 'Sem descrição',
              valor: parseFloat(mov.valor) || 0,
              tipo: mov.tipo,
              categoria: mov.categoria?.nome || 'Sem categoria',
              categoria_cor: mov.categoria?.cor || '#6B7280',
              conta: mov.conta?.nome || 'Conta não informada',
              status: mov.efetivado !== false ? 'realizado' : 'agendado',
              hora: '12:00',
              observacoes: mov.observacoes || '',
              data: mov.data
            }));
            
            // Recalcular totais
            const totaisForced = {
              total_receitas: 0,
              total_despesas: 0,
              saldo: 0,
              total_transacoes: movimentosProcessados.length
            };
            
            movimentosProcessados.forEach(mov => {
              const valor = parseFloat(mov.valor) || 0;
              if (mov.tipo === 'receita') {
                totaisForced.total_receitas += valor;
              } else if (mov.tipo === 'despesa') {
                totaisForced.total_despesas += valor;
              }
            });
            
            totaisForced.saldo = totaisForced.total_receitas - totaisForced.total_despesas;
            totais = totaisForced;
            
            console.log('🔧 Dados forçados aplicados:', {
              movimentos: movimentosProcessados.length,
              totais
            });
          }

        } catch (rpcError) {
          console.error('❌ Erro nas RPCs, usando dados locais:', rpcError);
          
          // ✅ Fallback total para dados locais
          movimentosProcessados = movimentosDoDia.map(mov => ({
            id: mov.id,
            descricao: mov.descricao || 'Sem descrição',
            valor: parseFloat(mov.valor) || 0,
            tipo: mov.tipo,
            categoria: mov.categoria?.nome || 'Sem categoria',
            categoria_cor: mov.categoria?.cor || '#6B7280',
            conta: mov.conta?.nome || 'Conta não informada',
            status: mov.efetivado !== false ? 'realizado' : 'agendado',
            hora: '12:00',
            observacoes: mov.observacoes || '',
            data: mov.data
          }));

          const totaisLocal = {
            total_receitas: 0,
            total_despesas: 0,
            saldo: 0,
            total_transacoes: movimentosProcessados.length
          };
          
          movimentosProcessados.forEach(mov => {
            const valor = parseFloat(mov.valor) || 0;
            if (mov.tipo === 'receita') {
              totaisLocal.total_receitas += valor;
            } else if (mov.tipo === 'despesa') {
              totaisLocal.total_despesas += valor;
            }
          });
          
          totaisLocal.saldo = totaisLocal.total_receitas - totaisLocal.total_despesas;
          totais = totaisLocal;
        }
      } else {
        console.log('📭 Dia sem movimentos, criando estrutura vazia...');
        movimentosProcessados = [];
        totais = { 
          total_receitas: 0, 
          total_despesas: 0, 
          saldo: 0, 
          total_transacoes: 0 
        };
      }

      // ✅ ESTRUTURA FINAL SEMPRE VÁLIDA
      const dadosDia = {
        data: dia,
        movimentos: movimentosProcessados,
        totais: totais
      };
      
      console.log('🚀 Enviando dados FINAIS para o modal:', {
        data: format(dia, 'yyyy-MM-dd'),
        movimentosEnviados: dadosDia.movimentos.length,
        totaisEnviados: dadosDia.totais,
        estruturaCompleta: !!dadosDia.data && Array.isArray(dadosDia.movimentos) && !!dadosDia.totais,
        comparacao: {
          dadosLocais: movimentosDoDia.length,
          dadosEnviados: dadosDia.movimentos.length,
          consistente: movimentosDoDia.length === dadosDia.movimentos.length
        }
      });
      
      // ✅ Chamar o modal SEMPRE
      onDiaClick(dadosDia);
      
    } else {
      console.warn('⚠️ Callback onDiaClick não definido');
    }
    
  } catch (err) {
    console.error('❌ Erro CRÍTICO ao processar clique no dia:', err);
    
    // ✅ Em caso de erro, ainda tentar abrir o modal com dados mínimos
    if (onDiaClick) {
      const dadosMinimos = {
        data: dia,
        movimentos: [],
        totais: { 
          total_receitas: 0, 
          total_despesas: 0, 
          saldo: 0, 
          total_transacoes: 0 
        }
      };
      
      console.log('🔧 Abrindo modal com dados mínimos devido a erro CRÍTICO');
      onDiaClick(dadosMinimos);
    }
  }
};

  // ✅ Renderiza indicadores do dia (usa dados locais para performance)
  const renderizarIndicadoresDia = (dia) => {
    try {
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
      
      if (movimentosDoDia.length === 0) return null;
      
      const totais = calcularTotaisDoDiaLocal(dia);
      
      return (
        <div className="dia-indicadores">
          {Math.abs(totais.saldo) > 0 && (
            <div className={`saldo-dia ${totais.saldo >= 0 ? 'positivo' : 'negativo'}`}>
              {formatCurrency(Math.abs(totais.saldo))}
            </div>
          )}
        </div>
      );
    } catch (err) {
      return null;
    }
  };

  // ✅ Tooltip simplificado que SEMPRE funciona
  const DiaTooltip = ({ dia }) => {
    if (!dia) return null;
    
    try {
      // ✅ Usar SEMPRE dados locais para garantir funcionamento
      const totais = calcularTotaisDoDiaLocal(dia);
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentos = movimentosPorDia[diaFormatado] || [];
      
      if (movimentos.length === 0 || totais.numLancamentos === 0) return null;
      
      const textoTransacoes = totais.numLancamentos === 1 ? 'transação' : 'transações';
      
      return (
        <div className="dia-tooltip">
          <div className="tooltip-cabecalho">
            {format(dia, 'dd/MM', { locale: ptBR })} • {totais.numLancamentos} {textoTransacoes}
          </div>
          
          <div className="tooltip-conteudo">
            {totais.receitas > 0 && (
              <div className="tooltip-linha receita">
                <span>Receitas:</span>
                <span>{formatCurrency(totais.receitas)}</span>
              </div>
            )}
            
            {totais.despesas > 0 && (
              <div className="tooltip-linha despesa">
                <span>Despesas:</span>
                <span>{formatCurrency(totais.despesas)}</span>
              </div>
            )}
            
            <div className={`tooltip-linha saldo ${totais.saldo >= 0 ? 'positivo' : 'negativo'}`}>
              <span>Saldo:</span>
              <span>{formatCurrency(totais.saldo)}</span>
            </div>
          </div>
          
          <div className="tooltip-rodape">
            Clique para detalhes
          </div>
        </div>
      );
    } catch (err) {
      console.error('Erro no tooltip:', err);
      return null;
    }
  };

  // ✅ Renderiza resumo do mês (APENAS 3 CARDS)
  const renderizarResumoMes = () => (
    <div className="calendario-resumo-mes">
      <div className="resumo-item receitas">
        <span className="resumo-label">Receitas</span>
        <span className="resumo-valor positivo">{formatCurrency(resumoMes.totalReceitas)}</span>
      </div>
      <div className="resumo-item despesas">
        <span className="resumo-label">Despesas</span>
        <span className="resumo-valor negativo">{formatCurrency(resumoMes.totalDespesas)}</span>
      </div>
      <div className="resumo-item saldo">
        <span className="resumo-label">Saldo</span>
        <span className={`resumo-valor ${resumoMes.saldoMes >= 0 ? 'positivo' : 'negativo'}`}>
          {formatCurrency(resumoMes.saldoMes)}
        </span>
      </div>
    </div>
  );

  // Renderiza os dias da semana
  const renderizarDiasDaSemana = () => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    return (
      <div className="calendario-cabecalho">
        {diasSemana.map((dia, index) => (
          <div key={index} className="cabecalho-dia">
            {dia}
          </div>
        ))}
      </div>
    );
  };

  // Renderiza o grid do calendário
  const renderizarGridCalendario = () => {
    if (loading) {
      return (
        <div className="calendario-loading">
          <div className="loading-spinner"></div>
          <span>Carregando...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="calendario-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="error-retry" onClick={fetchTransacoesMes}>
            Tentar novamente
          </button>
        </div>
      );
    }
    
    if (diasDoMes.length === 0) {
      return (
        <div className="calendario-loading">
          <span>Preparando calendário...</span>
        </div>
      );
    }
    
    const primeiroDia = diasDoMes[0];
    const diaDaSemanaPrimeiroDia = primeiroDia.getDay();
    const celulasVaziasInicio = Array(diaDaSemanaPrimeiroDia).fill(null);
    const todasCelulas = [...celulasVaziasInicio, ...diasDoMes];
    
    return (
      <div className="calendario-grid">
        {todasCelulas.map((dia, index) => {
          if (dia === null) {
            return <div key={`vazio-${index}`} className="celula-vazia"></div>;
          }
          
          const isHovered = hoveredDay && isSameDay(dia, hoveredDay);
          const diaFormatado = format(dia, 'yyyy-MM-dd');
          const temMovimentos = movimentosPorDia[diaFormatado]?.length > 0;
          
          return (
            <div 
              key={format(dia, 'yyyy-MM-dd')} 
              className={`${getDiaClasses(dia)} ${isHovered ? 'hovered' : ''}`}
              onClick={() => handleDiaClick(dia)}
              onMouseEnter={() => setHoveredDay(dia)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{ cursor: temMovimentos ? 'pointer' : 'default' }}
            >
              <div className="dia-numero">{getDate(dia)}</div>
              {renderizarIndicadoresDia(dia)}
              
              {isHovered && <DiaTooltip dia={dia} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="calendario-financeiro-moderno">
      {/* Resumo do mês - APENAS 3 CARDS */}
      {!loading && !error && renderizarResumoMes()}            
      {renderizarDiasDaSemana()}
      {renderizarGridCalendario()}
    </div>
  );
};

export default CalendarioFinanceiro;