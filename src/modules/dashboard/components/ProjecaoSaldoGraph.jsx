import React, { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '@shared/utils/formatCurrency';
import useProjecaoCombinada from '../hooks/useProjecaoCombinada';

/**
 * 📈 PROJEÇÃO DE SALDO SIMPLES - iPoupei
 * ✅ Abordagem direta e funcional
 * ✅ 3 linhas simultâneas no modo comparar
 * ✅ Debug otimizado para identificar problemas
 */
const ProjecaoSaldoSimples = () => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('medio');
  const [tipoAtivo, setTipoAtivo] = useState('planejada');
  
  // 📊 Configurações de período
  const periodosConfig = {
    curto: { meses: 6, label: '6M' },
    medio: { meses: 12, label: '12M' },
    longo: { meses: 18, label: '18M' }
  };

  const mesesProjecao = periodosConfig[periodoSelecionado].meses;
  
  // 🔄 Hook dos dados
  const {
    dadosRecorrentes,
    dadosHistoricos,
    loading,
    error
  } = useProjecaoCombinada(mesesProjecao);

  // 📊 GERAR DADOS SIMPLES
  const gerarDadosSimples = () => {
    const saldoAtual = 108799; // Pegando do exemplo
    const dataBase = new Date();
    
    const dados = []; // Array único para o gráfico
    
    let saldoAcumPlanejado = saldoAtual;
    let saldoAcumEstatistico = saldoAtual;
    let saldoAcumCombinado = saldoAtual;
    
    for (let i = 1; i <= mesesProjecao; i++) {
      const dataProjecao = addMonths(dataBase, i);
      const mes = format(dataProjecao, 'MMM/yy', { locale: ptBR });
      const mesAno = format(dataProjecao, 'yyyy-MM');
      
      // 📋 DADOS PLANEJADOS
      const dadosMes = dadosRecorrentes.resumoPorMes?.find(r => r.mes === mesAno);
      const saldoMensalPlanejado = dadosMes?.saldo || 0;
      saldoAcumPlanejado += saldoMensalPlanejado;
      
      // 📊 DADOS ESTATÍSTICOS
      const mediana = dadosHistoricos.medianaSaldo || 0;
      saldoAcumEstatistico += mediana;
      
      // 🔄 DADOS COMBINADOS
      const saldoMensalCombinado = dadosMes ? (saldoMensalPlanejado + mediana) / 2 : mediana;
      saldoAcumCombinado += saldoMensalCombinado;
      
      // Objeto único com todas as linhas
      dados.push({
        mes,
        planejado: saldoAcumPlanejado,
        estatistico: saldoAcumEstatistico,
        combinado: saldoAcumCombinado,
        saldoMensalPlanejado,
        saldoMensalEstatistico: mediana,
        saldoMensalCombinado
      });
    }
    
    return dados;
  };

  const dados = gerarDadosSimples();

  // 🔍 DEBUG: Log apenas quando necessário
  React.useEffect(() => {
    if (tipoAtivo === 'comparar') {
      console.log('🔍 Debug - Modo Comparar:', {
        tipoAtivo,
        dadosLength: dados.length,
        primeirosDados: dados.slice(0, 2),
        propriedades: Object.keys(dados[0] || {}),
        temTodasPropriedades: dados[0] && dados[0].planejado && dados[0].estatistico && dados[0].combinado
      });
    }
  }, [tipoAtivo, dados]);

  // 📊 OBTER DATAKEY ATIVO
  const obterDataKey = () => {
    switch(tipoAtivo) {
      case 'planejada': return 'planejado';
      case 'estatistica': return 'estatistico';
      case 'comparar': return 'combinado'; // Linha principal no comparar
      default: return 'planejado';
    }
  };

  const dataKeyAtivo = obterDataKey();

  // 🎨 CORES
  const cores = {
    planejada: '#3B82F6',
    estatistica: '#10B981',
    comparar: '#8B5CF6'
  };

  // 📊 TOOLTIP SIMPLES
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    
    // Obter valor baseado no tipo ativo
    let valor, saldoMensal;
    if (tipoAtivo === 'planejada') {
      valor = data.planejado;
      saldoMensal = data.saldoMensalPlanejado;
    } else if (tipoAtivo === 'estatistica') {
      valor = data.estatistico;
      saldoMensal = data.saldoMensalEstatistico;
    } else {
      valor = data.combinado;
      saldoMensal = data.saldoMensalCombinado;
    }
    
    const corBorda = valor >= 0 ? '#10B981' : '#EF4444';

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '12px 16px',
        border: `2px solid ${corBorda}`,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        minWidth: '200px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#1F2937' }}>
          📅 {label}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: corBorda, marginBottom: '6px' }}>
          {formatCurrency(valor)}
        </div>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>
          💰 Saldo mensal: {formatCurrency(saldoMensal)}
        </div>
        {tipoAtivo === 'comparar' && (
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
            📋 Planejado: {formatCurrency(data.planejado)}<br/>
            📊 Estatístico: {formatCurrency(data.estatistico)}
          </div>
        )}
      </div>
    );
  };

  // 🔄 LOADING E ERROR
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h3>Carregando projeção...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3>Erro ao carregar</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="projecao-simples">
      
      {/* 🎮 CONTROLES */}
      <div className="controles">
        <div className="controles-linha">
          <div className="grupo">
            <label>📊 Tipo:</label>
            <div className="botoes">
              <button 
                onClick={() => {
                  console.log('🔘 Clicando em Planejada');
                  setTipoAtivo('planejada');
                }}
                className={tipoAtivo === 'planejada' ? 'ativo' : ''}
              >
                📋 Planejada
              </button>
              <button 
                onClick={() => {
                  console.log('🔘 Clicando em Estatística');
                  setTipoAtivo('estatistica');
                }}
                className={tipoAtivo === 'estatistica' ? 'ativo' : ''}
              >
                📊 Estatística
              </button>
              <button 
                onClick={() => {
                  console.log('🔘 Clicando em Comparar');
                  setTipoAtivo('comparar');
                }}
                className={tipoAtivo === 'comparar' ? 'ativo' : ''}
              >
                🔄 Comparar
              </button>
            </div>
          </div>

          <div className="grupo">
            <label>⏱️ Período:</label>
            <div className="botoes">
              {Object.entries(periodosConfig).map(([periodo, config]) => (
                <button
                  key={periodo}
                  onClick={() => setPeriodoSelecionado(periodo)}
                  className={periodoSelecionado === periodo ? 'ativo' : ''}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 📊 GRÁFICO */}
      <div className="grafico">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value, { minimumFractionDigits: 0 })}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" />
            
            {/* MODO SIMPLES: UMA LINHA */}
            {tipoAtivo !== 'comparar' && (
              <Line
                type="monotone"
                dataKey={dataKeyAtivo}
                stroke={cores[tipoAtivo]}
                strokeWidth={3}
                dot={{ fill: cores[tipoAtivo], r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray={tipoAtivo === 'estatistica' ? "5 5" : "0"}
              />
            )}
            
            {/* MODO COMPARAR: TRÊS LINHAS */}
            {tipoAtivo === 'comparar' && (
              <>
                {console.log('🎯 Renderizando 3 linhas no modo comparar!')}
                <Line
                  type="monotone"
                  dataKey="planejado"
                  stroke="#FF0000"  // ← TESTE: Vermelho forte
                  strokeWidth={5}   // ← TESTE: Bem grosso
                  strokeDasharray="8 4"
                  dot={false}
                  name="Planejada"
                />
                <Line
                  type="monotone"
                  dataKey="estatistico"
                  stroke="#00FF00"  // ← TESTE: Verde forte
                  strokeWidth={5}   // ← TESTE: Bem grosso
                  strokeDasharray="4 4"
                  dot={false}
                  name="Estatística"
                />
                <Line
                  type="monotone"
                  dataKey="combinado"
                  stroke="#0000FF"  // ← TESTE: Azul forte
                  strokeWidth={5}   // ← TESTE: Bem grosso
                  dot={{ fill: '#0000FF', r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Combinada"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 📋 LEGENDA */}
      <div className="legenda">
        {tipoAtivo !== 'comparar' && (
          <div className="item">
            <div className="cor" style={{ backgroundColor: cores[tipoAtivo] }}></div>
            <span>📊 Projeção {tipoAtivo}</span>
          </div>
        )}
        
        {tipoAtivo === 'comparar' && (
          <>
            <div className="item">
              <div className="cor roxa" style={{ backgroundColor: '#0000FF' }}></div>
              <span>🔄 Combinada</span>
            </div>
            <div className="item">
              <div className="cor azul-tracejada" style={{ backgroundColor: '#FF0000' }}></div>
              <span>📋 Planejada</span>
            </div>
            <div className="item">
              <div className="cor verde-pontilhada" style={{ backgroundColor: '#00FF00' }}></div>
              <span>📊 Estatística</span>
            </div>
          </>
        )}
      </div>

      {/* ⚠️ DISCLAIMER */}
      <div className="disclaimer">
        <small>
          <strong>⚠️ Aviso:</strong> Projeções são estimativas baseadas em dados históricos. 
          Use como guia para planejamento.
        </small>
      </div>
    </div>
  );
};

// 🎨 ESTILOS SIMPLES
const styles = `
.projecao-simples {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
}

.controles {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.controles-linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.grupo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grupo label {
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  white-space: nowrap;
}

.botoes {
  display: flex;
  gap: 8px;
}

.botoes button {
  padding: 8px 16px;
  border: 2px solid #E5E7EB;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.botoes button:hover {
  border-color: #3B82F6;
  transform: translateY(-1px);
}

.botoes button.ativo {
  background: #3B82F6;
  border-color: #3B82F6;
  color: white;
}

.grafico {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.legenda {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.legenda .item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}

.legenda .cor {
  width: 16px;
  height: 3px;
  border-radius: 2px;
}

.azul-tracejada {
  background: repeating-linear-gradient(
    to right,
    #3B82F6 0px,
    #3B82F6 8px,
    transparent 8px,
    transparent 12px
  );
}

.verde-pontilhada {
  background: repeating-linear-gradient(
    to right,
    #10B981 0px,
    #10B981 4px,
    transparent 4px,
    transparent 8px
  );
}

.disclaimer {
  padding: 12px;
  background: rgba(107, 114, 128, 0.1);
  border-radius: 8px;
  border-left: 4px solid #6B7280;
}

.disclaimer small {
  color: #4B5563;
  font-size: 12px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .controles-linha {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .grupo {
    justify-content: center;
  }
  
  .legenda {
    flex-direction: column;
    gap: 12px;
  }
}
`;

// Injetar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default ProjecaoSaldoSimples;