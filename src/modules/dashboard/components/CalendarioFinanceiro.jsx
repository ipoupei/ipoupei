// src/modules/dashboard/components/CalendarioFinanceiro.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, isSameDay, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@shared/utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';
import { useDashboardData } from '@modules/dashboard/store/dashboardStore';
import '@modules/dashboard/styles/CalendarioFinanceiro.css';

/**
 * 📅 CALENDÁRIO FINANCEIRO MODERNIZADO - iPoupei
 * ✅ Conectado ao dashboardStore para sincronização de período
 * ✅ Queries diretas robustas (sem dependência de RPCs)
 * ✅ Performance otimizada com cache inteligente
 * ✅ UI responsiva e interativa
 * ✅ Compatibilidade total com seletor de período
 */
const CalendarioFinanceiro = ({ onDiaClick }) => {
  const { user, isAuthenticated } = useAuth();
  const { selectedDate, getCurrentPeriod } = useDashboardData();
  
  // ✅ Estados locais otimizados
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

  // ✅ Cache local para performance
  const [cache, setCache] = useState({
    periodo: null,
    dados: null,
    timestamp: null
  });

  // ✅ Período conectado ao store
  const periodoAtual = getCurrentPeriod();
  const dataReferencia = selectedDate || new Date();

  // ✅ Calcula período do mês de forma segura e reativa
  const periodoMes = useMemo(() => {
    try {
      const mes = dataReferencia.getMonth();
      const ano = dataReferencia.getFullYear();
      const primeiroDia = startOfMonth(new Date(ano, mes));
      const ultimoDia = endOfMonth(primeiroDia);
      
      console.log('📅 Período calculado para calendário:', {
        mes: mes + 1,
        ano,
        periodo: periodoAtual.formatado,
        inicio: format(primeiroDia, 'yyyy-MM-dd'),
        fim: format(ultimoDia, 'yyyy-MM-dd')
      });
      
      return { primeiroDia, ultimoDia };
    } catch (err) {
      console.error('❌ Erro ao calcular período:', err);
      const hoje = new Date();
      const primeiroDia = startOfMonth(hoje);
      const ultimoDia = endOfMonth(hoje);
      return { primeiroDia, ultimoDia };
    }
  }, [dataReferencia, periodoAtual]);

  // ✅ Verificar se cache é válido
  const isCacheValido = () => {
    if (!cache.dados || !cache.periodo || !cache.timestamp) return false;
    
    const periodoFormatado = `${format(periodoMes.primeiroDia, 'yyyy-MM')}`;
    const tempoDecorrido = Date.now() - cache.timestamp;
    const cacheExpired = tempoDecorrido > 2 * 60 * 1000; // 2 minutos
    
    return cache.periodo === periodoFormatado && !cacheExpired;
  };

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
      }
      
      return null;
    } catch (err) {
      console.warn('⚠️ Erro ao converter data:', dataString, err);
      return null;
    }
  };

  // ✅ Buscar transações via query direta (sempre funciona)
  const fetchTransacoesMes = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      // Verificar cache primeiro
      if (isCacheValido()) {
        console.log('📦 Usando dados do cache do calendário');
        const dadosCache = cache.dados;
        setMovimentosPorDia(dadosCache.movimentosPorDia);
        setResumoMes(dadosCache.resumoMes);
        organizarDiasDoMes();
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      const dataInicio = format(periodoMes.primeiroDia, 'yyyy-MM-dd');
      const dataFim = format(periodoMes.ultimoDia, 'yyyy-MM-dd');

      console.log('💰 Calendário: Buscando transações via queries diretas:', { 
        dataInicio, 
        dataFim, 
        usuario: user.id.substring(0, 8) + '...',
        periodo: periodoAtual.formatado
      });

      // ✅ Query direta para transações (sempre confiável)
      const { data: transacoesData, error: transacoesError } = await supabase
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
          efetivado,
          transferencia,
          created_at
        `)
        .eq('usuario_id', user.id)
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .or('transferencia.is.null,transferencia.eq.false')
        .order('data', { ascending: true });

      if (transacoesError) throw transacoesError;

      // ✅ Buscar categorias e contas em paralelo
      const [categoriasResult, contasResult] = await Promise.all([
        supabase
          .from('categorias')
          .select('id, nome, cor, icone')
          .eq('usuario_id', user.id)
          .eq('ativo', true),
        supabase
          .from('contas')
          .select('id, nome, tipo, cor')
          .eq('usuario_id', user.id)
          .eq('ativo', true)
      ]);

      const categoriasData = categoriasResult.data || [];
      const contasData = contasResult.data || [];

      // ✅ Enriquecer transações com categorias e contas
      const transacoesEnriquecidas = (transacoesData || []).map(transacao => {
        const categoria = categoriasData.find(c => c.id === transacao.categoria_id);
        const conta = contasData.find(c => c.id === transacao.conta_id);
        
        return {
          ...transacao,
          categoria: {
            nome: categoria?.nome || 'Sem categoria',
            cor: categoria?.cor || '#6B7280',
            icone: categoria?.icone
          },
          conta: {
            nome: conta?.nome || 'Conta não informada',
            tipo: conta?.tipo || 'outros',
            cor: conta?.cor
          }
        };
      });

      console.log('📊 Calendário: Transações processadas:', {
        quantidade: transacoesEnriquecidas.length,
        receitas: transacoesEnriquecidas.filter(t => t.tipo === 'receita').length,
        despesas: transacoesEnriquecidas.filter(t => t.tipo === 'despesa').length,
        periodo: periodoAtual.formatado
      });

      // ✅ Calcular totais do mês
      const totais = calcularTotaisMes(transacoesEnriquecidas);
      setResumoMes(totais);

      // ✅ Organizar transações por dia
      const movimentosPorDiaCalculados = organizarTransacoesPorDia(transacoesEnriquecidas);
      setMovimentosPorDia(movimentosPorDiaCalculados);

      // ✅ Salvar no cache
      const dadosParaCache = {
        movimentosPorDia: movimentosPorDiaCalculados,
        resumoMes: totais
      };
      
      setCache({
        periodo: format(periodoMes.primeiroDia, 'yyyy-MM'),
        dados: dadosParaCache,
        timestamp: Date.now()
      });

      // ✅ Organizar dias do mês
      organizarDiasDoMes();

      console.log('✅ Calendário carregado com sucesso:', {
        diasComMovimento: Object.keys(movimentosPorDiaCalculados).length,
        receitas: totais.totalReceitas,
        despesas: totais.totalDespesas,
        saldo: totais.saldoMes
      });

    } catch (err) {
      console.error('❌ Erro ao carregar dados do calendário:', err);
      setError(`Erro ao carregar transações: ${err.message}`);
      setMovimentosPorDia({});
      setResumoMes({ totalReceitas: 0, totalDespesas: 0, saldoMes: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calcular totais do mês
  const calcularTotaisMes = (transacoes) => {
    const totais = {
      totalReceitas: 0,
      totalDespesas: 0,
      saldoMes: 0
    };

    transacoes.forEach(transacao => {
      const valor = parseFloat(transacao.valor) || 0;
      if (transacao.tipo === 'receita') {
        totais.totalReceitas += valor;
      } else if (transacao.tipo === 'despesa') {
        totais.totalDespesas += valor;
      }
    });

    totais.saldoMes = totais.totalReceitas - totais.totalDespesas;
    return totais;
  };

  // ✅ Organizar transações por dia
  const organizarTransacoesPorDia = (transacoes) => {
    const porDia = {};
    
    transacoes.forEach((transacao) => {
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
        console.warn('⚠️ Data inválida encontrada:', transacao.data);
        return;
      }
      
      const diaFormatado = format(dataTransacao, 'yyyy-MM-dd');
      const dentroDoMes = dataTransacao >= periodoMes.primeiroDia && dataTransacao <= periodoMes.ultimoDia;
      
      if (dentroDoMes) {
        if (!porDia[diaFormatado]) {
          porDia[diaFormatado] = [];
        }
        
        porDia[diaFormatado].push(transacao);
      }
    });
    
    return porDia;
  };

  // ✅ Organizar dias do mês
  const organizarDiasDoMes = () => {
    try {
      const primeiroDia = periodoMes.primeiroDia;
      const ultimoDia = periodoMes.ultimoDia;
      const diasIntervalo = eachDayOfInterval({ start: primeiroDia, end: ultimoDia });
      setDiasDoMes(diasIntervalo);
    } catch (err) {
      console.error('❌ Erro ao organizar dias do mês:', err);
      setDiasDoMes([]);
    }
  };

  // ✅ Recarregar quando período mudar
  useEffect(() => {
    console.log('🔄 Calendário: Período alterado, recarregando dados');
    fetchTransacoesMes();
  }, [dataReferencia, isAuthenticated, user]);

  // ✅ Handler de clique no dia (otimizado)
  const handleDiaClick = async (dia) => {
    try {
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
      
      console.log('🔍 Clique no dia:', { 
        data: diaFormatado, 
        movimentos: movimentosDoDia.length,
        temCallback: !!onDiaClick
      });
      
      if (onDiaClick && movimentosDoDia.length > 0) {
        // ✅ Processar movimentos para o modal
        const movimentosProcessados = movimentosDoDia.map(mov => ({
          id: mov.id,
          descricao: mov.descricao || 'Sem descrição',
          valor: parseFloat(mov.valor) || 0,
          tipo: mov.tipo,
          categoria: mov.categoria?.nome || 'Sem categoria',
          categoria_cor: mov.categoria?.cor || '#6B7280',
          conta: mov.conta?.nome || 'Conta não informada',
          status: mov.efetivado !== false ? 'realizado' : 'agendado',
          hora: format(parseDataSegura(mov.created_at) || new Date(), 'HH:mm'),
          observacoes: mov.observacoes || '',
          data: mov.data
        }));

        // ✅ Calcular totais
        const totais = {
          total_receitas: 0,
          total_despesas: 0,
          saldo: 0,
          total_transacoes: movimentosProcessados.length
        };
        
        movimentosProcessados.forEach(mov => {
          const valor = parseFloat(mov.valor) || 0;
          if (mov.tipo === 'receita') {
            totais.total_receitas += valor;
          } else if (mov.tipo === 'despesa') {
            totais.total_despesas += valor;
          }
        });
        
        totais.saldo = totais.total_receitas - totais.total_despesas;

        // ✅ Estrutura para o modal
        const dadosDia = {
          data: dia,
          movimentos: movimentosProcessados,
          totais: totais
        };
        
        console.log('🚀 Enviando dados para modal:', {
          data: diaFormatado,
          movimentos: dadosDia.movimentos.length,
          totais: dadosDia.totais
        });
        
        onDiaClick(dadosDia);
      }
      
    } catch (err) {
      console.error('❌ Erro ao processar clique no dia:', err);
    }
  };

  // ✅ Calcular totais do dia (local - performance)
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

  // ✅ Classes CSS do dia
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

  // ✅ Renderizar indicadores do dia
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

  // ✅ Tooltip otimizado
  const DiaTooltip = ({ dia }) => {
    if (!dia) return null;
    
    try {
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
      console.error('❌ Erro no tooltip:', err);
      return null;
    }
  };

  // ✅ Renderizar resumo do mês
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

  // ✅ Renderizar dias da semana
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

  // ✅ Renderizar grid do calendário
  const renderizarGridCalendario = () => {
    if (loading) {
      return (
        <div className="calendario-loading">
          <div className="loading-spinner"></div>
          <span>Carregando {periodoAtual.formatado}...</span>
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
          <span>Preparando calendário para {periodoAtual.formatado}...</span>
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
      {/* Resumo do mês - conectado ao período */}
      {!loading && !error && renderizarResumoMes()}            
      {renderizarDiasDaSemana()}
      {renderizarGridCalendario()}
    </div>
  );
};

export default CalendarioFinanceiro;