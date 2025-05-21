import React, { useState, useEffect } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Componente para exibir projeção de saldo em gráfico
 * Mostra o histórico e projeção de saldo mensal
 */
const ProjecaoSaldoGraph = ({ data, mesAtual, anoAtual }) => {
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [periodoExibicao, setPeriodoExibicao] = useState({ inicio: 5, fim: 12 }); // 5 meses antes, 12 meses depois
  
  // Dados mockados para histórico e projeção
  const dadosMockados = [
    { mes: 'Dez/24', saldo: 10500 },
    { mes: 'Jan/25', saldo: 13600 },
    { mes: 'Fev/25', saldo: 12900 },
    { mes: 'Mar/25', saldo: 14900 },
    { mes: 'Abr/25', saldo: 18100 },
    { mes: 'Mai/25', saldo: 21400 }, // Mês atual
    { mes: 'Jun/25', saldo: 24000 }, // Projeção
    { mes: 'Jul/25', saldo: 26300 },
    { mes: 'Ago/25', saldo: 28800 },
    { mes: 'Set/25', saldo: 30700 },
    { mes: 'Out/25', saldo: 33100 },
    { mes: 'Nov/25', saldo: 35600 },
    { mes: 'Dez/25', saldo: 37900 },
    { mes: 'Jan/26', saldo: 40500 },
    { mes: 'Fev/26', saldo: 43200 },
    { mes: 'Mar/26', saldo: 46000 },
    { mes: 'Abr/26', saldo: 49800 },
    { mes: 'Mai/26', saldo: 53000 }
  ];

  // Prepara os dados para o gráfico
  useEffect(() => {
    // Vamos separar os dados em duas partes: histórico (até mês atual) e projeção (meses futuros)
    const mesAtualFormatado = format(new Date(anoAtual, mesAtual), 'MMM/yy', { locale: ptBR });
    
    // Indicamos o índice do mês atual (Maio 2025 nos dados mockados)
    const indiceMesAtual = dadosMockados.findIndex(item => 
      item.mes.toLowerCase() === mesAtualFormatado.toLowerCase()
    );
    
    // Seleciona dados baseado no período configurado
    const inicioIndice = Math.max(0, indiceMesAtual - periodoExibicao.inicio);
    const fimIndice = Math.min(dadosMockados.length - 1, indiceMesAtual + periodoExibicao.fim);
    
    // Filtra e mapeia os dados para incluir a propriedade 'tipo' (histórico ou projeção)
    const dadosFiltrados = dadosMockados
      .slice(inicioIndice, fimIndice + 1)
      .map((item, index) => {
        const ehHistorico = index <= (indiceMesAtual - inicioIndice);
        return {
          ...item,
          tipo: ehHistorico ? 'historico' : 'projecao',
          mes: item.mes.charAt(0).toUpperCase() + item.mes.slice(1) // Capitaliza o nome do mês
        };
      });
    
    setDadosGrafico(dadosFiltrados);
  }, [mesAtual, anoAtual, periodoExibicao]);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const ehProjecao = data.tipo === 'projecao';
      
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p className="tooltip-label" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {data.mes}
          </p>
          <p className="tooltip-value" style={{ color: data.saldo >= 0 ? '#10B981' : '#EF4444' }}>
            {formatCurrency(data.saldo)}
          </p>
          {ehProjecao && (
            <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '5px' }}>
              (Projeção)
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

  // Define gradiente para o gráfico
  const renderGradient = () => {
    return (
      <defs>
        <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
        </linearGradient>
      </defs>
    );
  };

  // Estilo separado para o container e legendas
  const containerStyle = {
    width: '100%',
    height: 350
  };

  // Verifica se existem dados para renderizar
  if (!dadosGrafico || dadosGrafico.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>Carregando dados do gráfico...</p>
      </div>
    );
  }

  return (
    <div className="projecao-saldo-container">
      {/* Legenda personalizada */}
      <div className="projecao-legenda">
        <div className="legenda-item">
          <span className="legenda-cor historico"></span>
          <span className="legenda-texto">Histórico</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor projecao"></span>
          <span className="legenda-texto">Projeção</span>
        </div>
      </div>
      
      {/* Componente gráfico */}
      <div style={containerStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dadosGrafico}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            {renderGradient()}
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="mes"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value, { minimumFractionDigits: 0 })}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#718096" strokeWidth={1} />
            
            {/* Linha para Histórico */}
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="Saldo"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Controles de período (opcional) */}
      <div className="periodo-controles">
        <div className="periodo-label">Período de visualização:</div>
        <div className="periodo-botoes">
          <button 
            onClick={() => setPeriodoExibicao({ inicio: 3, fim: 6 })}
            className={`periodo-botao ${periodoExibicao.inicio === 3 ? 'ativo' : ''}`}
          >
            Curto prazo
          </button>
          <button 
            onClick={() => setPeriodoExibicao({ inicio: 5, fim: 12 })}
            className={`periodo-botao ${periodoExibicao.inicio === 5 ? 'ativo' : ''}`}
          >
            Médio prazo
          </button>
          <button 
            onClick={() => setPeriodoExibicao({ inicio: 5, fim: 24 })}
            className={`periodo-botao ${periodoExibicao.fim === 24 ? 'ativo' : ''}`}
          >
            Longo prazo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjecaoSaldoGraph;