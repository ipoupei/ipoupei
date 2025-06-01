import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatCurrency';
import './CalendarioFinanceiro.css';

/**
 * Calendário Financeiro - Versão Simples e Funcional
 * Mantém a lógica original mas com visual moderno
 */
const CalendarioFinanceiro = ({ data, mes, ano, onDiaClick }) => {
  const [diasDoMes, setDiasDoMes] = useState([]);
  const [movimentosPorDia, setMovimentosPorDia] = useState({});
  const [hoveredDay, setHoveredDay] = useState(null);
  
  // Dados mockados - ajustados para o mês atual
  const dadosMockados = {
    movimentos: [
      {
        id: '1',
        descricao: 'Salário',
        valor: 6500,
        data: '2025-06-05',
        tipo: 'receita',
        categoria: 'Salário',
        status: 'realizado'
      },
      {
        id: '2',
        descricao: 'Aluguel',
        valor: 1800,
        data: '2025-06-10',
        tipo: 'despesa',
        categoria: 'Moradia',
        status: 'programado'
      },
      {
        id: '3',
        descricao: 'Academia',
        valor: 120,
        data: '2025-06-10',
        tipo: 'despesa',
        categoria: 'Saúde',
        status: 'realizado'
      },
      {
        id: '4',
        descricao: 'Conta de luz',
        valor: 250,
        data: '2025-06-15',
        tipo: 'despesa',
        categoria: 'Moradia',
        status: 'programado'
      },
      {
        id: '5',
        descricao: 'Freelance',
        valor: 1500,
        data: '2025-06-22',
        tipo: 'receita',
        categoria: 'Freelance',
        status: 'programado'
      },
      {
        id: '6',
        descricao: 'Supermercado',
        valor: 350,
        data: '2025-06-25',
        tipo: 'despesa',
        categoria: 'Alimentação',
        status: 'realizado'
      }
    ]
  };

  // Prepara os dados quando mudam os parâmetros
  useEffect(() => {
    const primeiroDia = startOfMonth(new Date(ano, mes));
    const ultimoDia = endOfMonth(primeiroDia);
    const diasIntervalo = eachDayOfInterval({ start: primeiroDia, end: ultimoDia });
    
    setDiasDoMes(diasIntervalo);
    
    // Organiza movimentos por dia
    const movimentos = dadosMockados.movimentos;
    const porDia = {};
    
    movimentos.forEach(movimento => {
      const dataMovimento = new Date(movimento.data);
      if (dataMovimento.getMonth() === mes && dataMovimento.getFullYear() === ano) {
        const diaFormatado = format(dataMovimento, 'yyyy-MM-dd');
        if (!porDia[diaFormatado]) {
          porDia[diaFormatado] = [];
        }
        porDia[diaFormatado].push(movimento);
      }
    });
    
    setMovimentosPorDia(porDia);
  }, [mes, ano]);

  // Calcula totais do dia
  const calcularTotaisDoDia = (dia) => {
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
    
    const totais = { receitas: 0, despesas: 0, saldo: 0, numLancamentos: movimentosDoDia.length };
    
    movimentosDoDia.forEach(mov => {
      if (mov.tipo === 'receita') {
        totais.receitas += mov.valor;
      } else if (mov.tipo === 'despesa') {
        totais.despesas += mov.valor;
      }
    });
    
    totais.saldo = totais.receitas - totais.despesas;
    return totais;
  };

  // Classes CSS do dia
  const getDiaClasses = (dia) => {
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
      const temProgramado = movimentosDoDia.some(m => m.status === 'programado');
      
      if (temReceita) classes.push('tem-receita');
      if (temDespesa) classes.push('tem-despesa');
      if (temProgramado) classes.push('tem-programado');
    }
    
    return classes.join(' ');
  };

  // Handler de clique no dia
  const handleDiaClick = (dia) => {
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
    
    if (onDiaClick && movimentosDoDia.length > 0) {
      onDiaClick({
        data: dia,
        movimentos: movimentosDoDia,
        totais: calcularTotaisDoDia(dia)
      });
    }
  };

  // Renderiza indicadores do dia
  const renderizarIndicadoresDia = (dia) => {
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
    
    if (movimentosDoDia.length === 0) return null;
    
    const totais = calcularTotaisDoDia(dia);
    const temProgramado = movimentosDoDia.some(m => m.status === 'programado');
    
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
        {temProgramado && <div className="indicador-programado"></div>}
      </div>
    );
  };

  // Tooltip do dia
  const DiaTooltip = ({ dia }) => {
    if (!dia) return null;
    
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
  };

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
    if (diasDoMes.length === 0) {
      return (
        <div className="calendario-loading">
          Carregando calendário...
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
      {/* Legenda simples */}
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
          <span>Programado</span>
        </div>
      </div>
      
      {renderizarDiasDaSemana()}
      {renderizarGridCalendario()}
    </div>
  );
};

export default CalendarioFinanceiro;