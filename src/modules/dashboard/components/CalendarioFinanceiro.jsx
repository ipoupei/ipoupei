import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, isSameDay, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';
import '@modules/dashboard/styles/CalendarioFinanceiro.css';

/**
 * Calendário Financeiro - Versão Limpa e Otimizada
 * Foca na funcionalidade essencial sem logs excessivos
 */
const CalendarioFinanceiro = ({ mes, ano, onDiaClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [diasDoMes, setDiasDoMes] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [movimentosPorDia, setMovimentosPorDia] = useState({});
  const [hoveredDay, setHoveredDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumoMes, setResumoMes] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoMes: 0,
    totalTransacoes: 0
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

  // Função para converter data de forma segura
  const parseDataSegura = (dataString) => {
    if (!dataString) return null;
    
    try {
      // Se já é um objeto Date válido
      if (dataString instanceof Date && isValid(dataString)) {
        return dataString;
      }
      
      // Se é string, tenta converter
      if (typeof dataString === 'string') {
        // Formato YYYY-MM-DD
        const parsed = parseISO(dataString);
        if (isValid(parsed)) return parsed;
        
        // Formato DD/MM/YYYY
        if (dataString.includes('/')) {
          const [dia, mes, ano] = dataString.split('/');
          const converted = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
          if (isValid(converted)) return converted;
        }
      }
      
      return null;
    } catch (err) {
      return null;
    }
  };

  // Busca transações do mês
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

      // Busca transações básicas
      const { data: transacoesData, error: transacoesError } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .order('data', { ascending: true });

      if (transacoesError) {
        throw new Error(`Erro ao buscar transações: ${transacoesError.message}`);
      }

      // Busca categorias
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('id, nome, cor, icone')
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      // Busca contas
      const { data: contasData } = await supabase
        .from('contas')
        .select('id, nome, tipo')
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      // Enriquece transações com dados relacionados
      const transacoesEnriquecidas = (transacoesData || []).map(transacao => {
        const categoria = (categoriasData || []).find(c => c.id === transacao.categoria_id) || {
          nome: 'Sem categoria',
          cor: '#6B7280'
        };

        const conta = (contasData || []).find(c => c.id === transacao.conta_id) || {
          nome: 'Conta não informada',
          tipo: 'outros'
        };

        return {
          ...transacao,
          categoria,
          conta
        };
      });

      setTransacoes(transacoesEnriquecidas);

    } catch (err) {
      console.error('Erro ao carregar dados do calendário:', err);
      setError('Erro ao carregar transações');
      setTransacoes([]);
    } finally {
      setLoading(false);
    }
  };

  // Organiza transações por dia
  useEffect(() => {
    try {
      const primeiroDia = periodoMes.primeiroDia;
      const ultimoDia = periodoMes.ultimoDia;
      const diasIntervalo = eachDayOfInterval({ start: primeiroDia, end: ultimoDia });
      
      setDiasDoMes(diasIntervalo);
      
      // Organiza movimentos por dia
      const porDia = {};
      let totalReceitas = 0;
      let totalDespesas = 0;
      
      transacoes.forEach(transacao => {
        const dataTransacao = parseDataSegura(transacao.data);
        if (!dataTransacao) return;
        
        const diaFormatado = format(dataTransacao, 'yyyy-MM-dd');
        
        if (!porDia[diaFormatado]) {
          porDia[diaFormatado] = [];
        }
        
        porDia[diaFormatado].push(transacao);
        
        // Calcula totais
        const valor = parseFloat(transacao.valor) || 0;
        if (transacao.tipo === 'receita') {
          totalReceitas += valor;
        } else if (transacao.tipo === 'despesa') {
          totalDespesas += valor;
        }
      });
      
      setMovimentosPorDia(porDia);
      setResumoMes({
        totalReceitas,
        totalDespesas,
        saldoMes: totalReceitas - totalDespesas,
        totalTransacoes: transacoes.length
      });
    } catch (err) {
      console.error('Erro ao organizar transações:', err);
      setMovimentosPorDia({});
      setResumoMes({
        totalReceitas: 0,
        totalDespesas: 0,
        saldoMes: 0,
        totalTransacoes: 0
      });
    }
  }, [transacoes, periodoMes]);

  // Carrega dados quando período muda
  useEffect(() => {
    fetchTransacoesMes();
  }, [mes, ano, isAuthenticated, user]);

  // Calcula totais do dia
  const calcularTotaisDoDia = (dia) => {
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

  // Handler de clique no dia
  const handleDiaClick = (dia) => {
    try {
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
      
      if (onDiaClick && movimentosDoDia.length > 0) {
        const dadosDia = {
          data: dia,
          movimentos: movimentosDoDia.map(mov => ({
            id: mov.id,
            descricao: mov.descricao || 'Sem descrição',
            valor: parseFloat(mov.valor) || 0,
            tipo: mov.tipo,
            categoria: mov.categoria?.nome || 'Sem categoria',
            conta: mov.conta?.nome || 'Conta não informada',
            status: 'realizado',
            hora: '12:00',
            observacoes: mov.observacoes || ''
          })),
          totais: calcularTotaisDoDia(dia)
        };
        
        onDiaClick(dadosDia);
      }
    } catch (err) {
      console.error('Erro ao processar clique no dia:', err);
    }
  };

  // Renderiza indicadores do dia
  const renderizarIndicadoresDia = (dia) => {
    try {
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
      
      if (movimentosDoDia.length === 0) return null;
      
      const totais = calcularTotaisDoDia(dia);
      
      return (
        <div className="dia-indicadores">
          <div className="quantidade-transacoes">
            {movimentosDoDia.length}
          </div>
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

  // Tooltip do dia
  const DiaTooltip = ({ dia }) => {
    if (!dia) return null;
    
    try {
      const totais = calcularTotaisDoDia(dia);
      const diaFormatado = format(dia, 'yyyy-MM-dd');
      const movimentos = movimentosPorDia[diaFormatado] || [];
      
      if (movimentos.length === 0) return null;
      
      return (
        <div className="dia-tooltip">
          <div className="tooltip-cabecalho">
            {format(dia, 'dd/MM', { locale: ptBR })} • {totais.numLancamentos} transação{totais.numLancamentos > 1 ? 'ões' : ''}
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
      return null;
    }
  };

  // Renderiza resumo do mês
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
      {/* Resumo do mês */}
      {!loading && !error && renderizarResumoMes()}
      
      {/* Legenda */}
      <div className="calendario-legenda-simples">
        <div className="legenda-item">
          <div className="legenda-cor receita"></div>
          <span>Receita</span>
        </div>
        <div className="legenda-item">
          <div className="legenda-cor despesa"></div>
          <span>Despesa</span>
        </div>
        <div className="legenda-item">
          <div className="legenda-cor programado"></div>
          <span>Misto</span>
        </div>
      </div>
      
      {renderizarDiasDaSemana()}
      {renderizarGridCalendario()}
    </div>
  );
};

export default CalendarioFinanceiro;