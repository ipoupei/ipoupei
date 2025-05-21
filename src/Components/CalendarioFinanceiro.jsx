import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Componente de calendário financeiro
 * Exibe receitas e despesas programadas/realizadas por dia do mês
 * Melhorado com tooltip e diferenciação visual entre programado/realizado
 */
const CalendarioFinanceiro = ({ data, mes, ano, onDiaClick }) => {
  // Estado para dados do calendário
  const [diasDoMes, setDiasDoMes] = useState([]);
  const [movimentosPorDia, setMovimentosPorDia] = useState({});
  // Estado para controlar dia com mouse over (para tooltip)
  const [hoveredDay, setHoveredDay] = useState(null);
  
  // Dados mockados para transações diárias
  const dadosMockados = {
    movimentos: [
      {
        id: '1',
        descricao: 'Salário',
        valor: 6500,
        data: '2025-05-05',
        tipo: 'receita',
        categoria: 'Salário',
        status: 'realizado'
      },
      {
        id: '2',
        descricao: 'Aluguel',
        valor: 1800,
        data: '2025-05-10',
        tipo: 'despesa',
        categoria: 'Moradia',
        status: 'programado'
      },
      {
        id: '3',
        descricao: 'Conta de luz',
        valor: 250,
        data: '2025-05-15',
        tipo: 'despesa',
        categoria: 'Moradia',
        status: 'programado'
      },
      {
        id: '4',
        descricao: 'Academia',
        valor: 120,
        data: '2025-05-10',
        tipo: 'despesa',
        categoria: 'Saúde',
        status: 'realizado'
      },
      {
        id: '5',
        descricao: 'Jantar aniversário',
        valor: 180,
        data: '2025-05-20',
        tipo: 'despesa',
        categoria: 'Lazer',
        status: 'programado'
      },
      {
        id: '6',
        descricao: 'Freelance',
        valor: 1500,
        data: '2025-05-22',
        tipo: 'receita',
        categoria: 'Freelance',
        status: 'programado'
      }
    ]
  };

  // Prepara os dias do mês e as transações quando os parâmetros mudam
  useEffect(() => {
    // Obtém o primeiro e último dia do mês
    const primeiroDia = startOfMonth(new Date(ano, mes));
    const ultimoDia = endOfMonth(primeiroDia);
    
    // Gera um array com todos os dias do mês
    const diasIntervalo = eachDayOfInterval({
      start: primeiroDia,
      end: ultimoDia
    });
    
    // Armazena os dias gerados
    setDiasDoMes(diasIntervalo);
    
    // Organiza os movimentos por dia
    const movimentos = dadosMockados.movimentos;
    const porDia = {};
    
    movimentos.forEach(movimento => {
      const dataMovimento = new Date(movimento.data);
      
      // Verifica se a movimentação pertence ao mês/ano selecionado
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

  // Determina as classes CSS para um dia com base nas movimentações
  const getDiaClasses = (dia) => {
    const hoje = new Date();
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
    
    const classes = ['calendario-dia'];
    
    // Verifica se é o dia atual
    if (isSameDay(dia, hoje)) {
      classes.push('dia-atual');
    }
    
    // Se há movimentações neste dia
    if (movimentosDoDia.length > 0) {
      classes.push('tem-movimentos');
      
      // Verifica tipos de movimentações
      const temReceita = movimentosDoDia.some(m => m.tipo === 'receita');
      const temDespesa = movimentosDoDia.some(m => m.tipo === 'despesa');
      const temProgramado = movimentosDoDia.some(m => m.status === 'programado');
      const temRealizado = movimentosDoDia.some(m => m.status === 'realizado');
      
      if (temReceita) classes.push('tem-receita');
      if (temDespesa) classes.push('tem-despesa');
      if (temProgramado) classes.push('tem-programado');
      if (temRealizado) classes.push('tem-realizado');
    }
    
    return classes.join(' ');
  };

  // Calcula o total de receitas e despesas para um dia
  const calcularTotaisDoDia = (dia) => {
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
    
    const totais = {
      receitas: 0,
      despesas: 0,
      saldo: 0,
      numLancamentos: movimentosDoDia.length
    };
    
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

  // Renderiza marcadores de movimentação
  const renderizarMarcadoresMovimento = (dia) => {
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
    
    // Se não houver movimentações, não renderiza marcadores
    if (movimentosDoDia.length === 0) return null;
    
    const temReceita = movimentosDoDia.some(m => m.tipo === 'receita');
    const temDespesa = movimentosDoDia.some(m => m.tipo === 'despesa');
    const temProgramado = movimentosDoDia.some(m => m.status === 'programado');
    const temRealizado = movimentosDoDia.some(m => m.status === 'realizado');
    
    // Calcula totais para exibição
    const totais = calcularTotaisDoDia(dia);
    
    return (
      <div className="dia-marcadores">
        <div className="dia-marcadores-row">
          {temRealizado && <span className="marcador realizado" title="Realizado"></span>}
          {temProgramado && <span className="marcador programado" title="Programado"></span>}
        </div>
        <div className="dia-marcadores-row">
          {temReceita && <span className="marcador receita" title="Receita"></span>}
          {temDespesa && <span className="marcador despesa" title="Despesa"></span>}
        </div>
        <div className="dia-total">
          {totais.saldo >= 0 
            ? <span className="valor-positivo">{formatCurrency(totais.saldo)}</span>
            : <span className="valor-negativo">{formatCurrency(totais.saldo)}</span>
          }
        </div>
      </div>
    );
  };

  // Handler para clique em um dia
  const handleDiaClick = (dia) => {
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentosDoDia = movimentosPorDia[diaFormatado] || [];
    
    // Chama o callback com os dados do dia
    onDiaClick({
      data: dia,
      movimentos: movimentosDoDia,
      totais: calcularTotaisDoDia(dia)
    });
  };
  
  // Handler para mouseOver em um dia (para mostrar tooltip)
  const handleDiaMouseEnter = (dia) => {
    setHoveredDay(dia);
  };
  
  // Handler para mouseLeave em um dia (para esconder tooltip)
  const handleDiaMouseLeave = () => {
    setHoveredDay(null);
  };
  
  // Componente de tooltip com resumo do dia
  const DiaTooltip = ({ dia }) => {
    if (!dia) return null;
    
    const totais = calcularTotaisDoDia(dia);
    const diaFormatado = format(dia, 'yyyy-MM-dd');
    const movimentos = movimentosPorDia[diaFormatado] || [];
    
    if (movimentos.length === 0) return null;
    
    return (
      <div className="dia-tooltip">
        <div className="dia-tooltip-header">
          {format(dia, 'dd/MM/yyyy')} - {totais.numLancamentos} lançamento(s)
        </div>
        <div className="dia-tooltip-content">
          {totais.receitas > 0 && (
            <div className="tooltip-item">
              <span>Receitas:</span>
              <span className="valor-positivo">{formatCurrency(totais.receitas)}</span>
            </div>
          )}
          {totais.despesas > 0 && (
            <div className="tooltip-item">
              <span>Despesas:</span>
              <span className="valor-negativo">{formatCurrency(totais.despesas)}</span>
            </div>
          )}
          <div className="tooltip-item saldo">
            <span>Saldo:</span>
            <span className={totais.saldo >= 0 ? 'valor-positivo' : 'valor-negativo'}>
              {formatCurrency(totais.saldo)}
            </span>
          </div>
        </div>
        <div className="dia-tooltip-footer">
          Clique para ver detalhes
        </div>
      </div>
    );
  };

  // Renderiza os nomes dos dias da semana
  const renderizarDiasDaSemana = () => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    return (
      <div className="calendario-cabecalho">
        {diasSemana.map((dia, index) => (
          <div key={index} className="cabecalho-item">
            {dia}
          </div>
        ))}
      </div>
    );
  };

  // Renderiza o grid do calendário com os dias do mês
  const renderizarGridCalendario = () => {
    // Se não há dias ainda, mostra indicador de carregamento
    if (diasDoMes.length === 0) {
      return <div className="calendario-loading">Carregando calendário...</div>;
    }
    
    // Obtém o primeiro dia do mês
    const primeiroDia = diasDoMes[0];
    
    // Determina em qual coluna começar (0 = domingo, 6 = sábado)
    const diaDaSemanaPrimeiroDia = primeiroDia.getDay();
    
    // Cria array para células vazias no início
    const celulasVaziasInicio = Array(diaDaSemanaPrimeiroDia).fill(null);
    
    // Combina células vazias + dias do mês
    const todasCelulas = [...celulasVaziasInicio, ...diasDoMes];
    
    return (
      <div className="calendario-grid">
        {todasCelulas.map((dia, index) => {
          // Células vazias
          if (dia === null) {
            return <div key={`vazio-${index}`} className="celula-vazia"></div>;
          }
          
          // Células com dias
          const isHovered = hoveredDay && isSameDay(dia, hoveredDay);
          
          return (
            <div 
              key={format(dia, 'yyyy-MM-dd')} 
              className={`${getDiaClasses(dia)} ${isHovered ? 'hovered' : ''}`}
              onClick={() => handleDiaClick(dia)}
              onMouseEnter={() => handleDiaMouseEnter(dia)}
              onMouseLeave={handleDiaMouseLeave}
            >
              <div className="dia-numero">{getDate(dia)}</div>
              {renderizarMarcadoresMovimento(dia)}
              
              {/* Tooltip para o dia com hover */}
              {isHovered && <DiaTooltip dia={dia} />}
            </div>
          );
        })}
      </div>
    );
  };

  // Título do calendário
  const tituloCalendario = format(new Date(ano, mes), 'MMMM yyyy', { locale: ptBR });
  const tituloCapitalizado = tituloCalendario.charAt(0).toUpperCase() + tituloCalendario.slice(1);

  return (
    <div className="calendario-financeiro">
      {/* Cabeçalho do Calendário */}
      <div className="calendario-titulo">
        {tituloCapitalizado}
      </div>
      
      {/* Legenda - Atualizada com distinção entre programado e realizado */}
      <div className="calendario-legenda">
        <div className="legenda-item">
          <span className="legenda-cor receita"></span>
          <span className="legenda-texto">Receita</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor despesa"></span>
          <span className="legenda-texto">Despesa</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor realizado"></span>
          <span className="legenda-texto">Realizado</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor programado"></span>
          <span className="legenda-texto">Programado</span>
        </div>
      </div>
      
      {/* Dias da Semana */}
      {renderizarDiasDaSemana()}
      
      {/* Grid de Dias */}
      {renderizarGridCalendario()}
    </div>
  );
};

export default CalendarioFinanceiro;