import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { formatCurrency } from '@utils/formatCurrency';



/**
 * Componente de gráfico de rosca interativo para mostrar categorias
 * Melhorado com tooltips mais intuitivos e acessibilidade aprimorada
 */
const DonutChartCategoria = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // Calcula o valor total para exibir no centro
  const total = data.reduce((sum, entry) => sum + entry.valor, 0);

  // Formata valor para exibição no centro do gráfico
  const getCenterText = () => {
    if (activeIndex === null) {
      return [
        formatCurrency(total),
        'Total'
      ];
    }
    
    const item = data[activeIndex];
    const percentage = Math.round((item.valor / total) * 100);
    
    return [
      formatCurrency(item.valor),
      item.nome,
      `${percentage}%`
    ];
  };
  
  // Tooltip personalizado - melhorado para evitar sobreposição e dar mais clareza
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = Math.round((data.valor / total) * 100);
      
      return (
        <div className="custom-tooltip">
          <div className="tooltip-header" style={{
            padding: '4px 8px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              backgroundColor: data.color,
              borderRadius: '50%',
              marginRight: '8px'
            }}></div>
            <span style={{ 
              fontWeight: 'bold',
              color: '#1f2937'
            }}>{data.nome}</span>
          </div>
          <div style={{ padding: '4px 8px' }}>
            <div className="tooltip-value" style={{ fontWeight: '600', color: '#1f2937' }}>
              {formatCurrency(data.valor)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
              {percentage}% do total
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Configuração para setor ativo (quando o usuário passa o mouse)
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.9}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
          opacity={0.4}
        />
      </g>
    );
  };

  // Handler para quando o mouse passa por cima de um setor
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  // Handler para quando o mouse sai de um setor
  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Verifica se há dados para exibir
  if (!data || data.length === 0) {
    return (
      <div className="no-data-message">
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  // Texto central do gráfico
  const centerText = getCenterText();

  return (
    <div className="donut-chart-container" style={{ width: '100%', height: 250, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="valor"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            // Aumentada a acessibilidade com atributos ARIA
            nameKey="nome"
            role="presentation"
            aria-label="Gráfico de categorias"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                aria-label={`${entry.nome}: ${formatCurrency(entry.valor)}`}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />} 
            isAnimationActive={true}
            position={{ y: -10 }} // Posiciona o tooltip um pouco acima para evitar sobreposição
            allowEscapeViewBox={{ x: true, y: true }} // Permite que o tooltip saia dos limites do gráfico
            wrapperStyle={{ zIndex: 1000 }} // Garante que o tooltip fique acima de outros elementos
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Texto central */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none' // Evita interferência com a interatividade do gráfico
        }}
      >
        <div style={{ fontSize: '1rem', fontWeight: 'bold', lineHeight: '1.2' }}>
          {centerText[0]}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#718096', lineHeight: '1.2' }}>
          {centerText[1]}
        </div>
        {centerText[2] && (
          <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '500', lineHeight: '1.2' }}>
            {centerText[2]}
          </div>
        )}
      </div>
      
      {/* Legenda simplificada na parte inferior */}
      <div 
        style={{
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {data.map((entry, index) => (
          <div 
            key={`legend-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#4b5563',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: activeIndex === index ? '#f3f4f6' : 'transparent'
            }}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div 
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: entry.color,
                borderRadius: '50%',
                marginRight: '4px'
              }}
            />
            <span>{entry.nome}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

DonutChartCategoria.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      nome: PropTypes.string.isRequired,
      valor: PropTypes.number.isRequired,
      color: PropTypes.string
    })
  ).isRequired
};

export default DonutChartCategoria;