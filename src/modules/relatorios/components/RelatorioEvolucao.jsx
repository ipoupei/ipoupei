// src/pages/RelatorioEvolucao.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  Info,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Legend
} from 'recharts';
import PageContainer from '@shared/components/layouts/PageContainer';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import { useReports } from '@old_context/old_ReportsContext';
import { formatCurrency } from '@utils/formatCurrency';


import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Relatório de evolução financeira temporal
 * Mostra crescimento patrimonial, tendências e comparações mensais
 */
const RelatorioEvolucao = () => {
  const navigate = useNavigate();
  const { filters, formatPeriodo } = useReports();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('patrimonio'); // 'patrimonio', 'fluxo', 'comparativo'
  const [timeFrame, setTimeFrame] = useState('mensal'); // 'mensal', 'trimestral', 'anual'
  const [chartType, setChartType] = useState('line'); // 'line', 'area', 'composed'
  
  // Estados para dados
  const [dadosEvolucao, setDadosEvolucao] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    crescimentoPatrimonio: 0,
    melhorMes: null,
    piorMes: null,
    mediaMensal: 0,
    tendencia: 'crescimento'
  });

  // Dados mockados para demonstração
  const mockDadosEvolucao = [
    {
      periodo: 'Jan 2024',
      receitas: 5200,
      despesas: 3800,
      saldo: 1400,
      patrimonio: 12500,
      mes: 'Janeiro',
      data: '2024-01-01'
    },
    {
      periodo: 'Fev 2024',
      receitas: 5800,
      despesas: 4200,
      saldo: 1600,
      patrimonio: 14100,
      mes: 'Fevereiro',
      data: '2024-02-01'
    },
    {
      periodo: 'Mar 2024',
      receitas: 5500,
      despesas: 4500,
      saldo: 1000,
      patrimonio: 15100,
      mes: 'Março',
      data: '2024-03-01'
    },
    {
      periodo: 'Abr 2024',
      receitas: 6200,
      despesas: 3900,
      saldo: 2300,
      patrimonio: 17400,
      mes: 'Abril',
      data: '2024-04-01'
    },
    {
      periodo: 'Mai 2024',
      receitas: 5900,
      despesas: 4100,
      saldo: 1800,
      patrimonio: 19200,
      mes: 'Maio',
      data: '2024-05-01'
    },
    {
      periodo: 'Jun 2024',
      receitas: 6500,
      despesas: 4300,
      saldo: 2200,
      patrimonio: 21400,
      mes: 'Junho',
      data: '2024-06-01'
    }
  ];

  // Carrega dados
  useEffect(() => {
    setLoading(true);
    
    // Simula carregamento
    setTimeout(() => {
      setDadosEvolucao(mockDadosEvolucao);
      
      // Calcula estatísticas
      const saldos = mockDadosEvolucao.map(item => item.saldo);
      const patrimonios = mockDadosEvolucao.map(item => item.patrimonio);
      
      const crescimento = ((patrimonios[patrimonios.length - 1] - patrimonios[0]) / patrimonios[0]) * 100;
      const maxSaldo = Math.max(...saldos);
      const minSaldo = Math.min(...saldos);
      const melhorMes = mockDadosEvolucao.find(item => item.saldo === maxSaldo);
      const piorMes = mockDadosEvolucao.find(item => item.saldo === minSaldo);
      const mediaMensal = saldos.reduce((acc, val) => acc + val, 0) / saldos.length;
      
      setEstatisticas({
        crescimentoPatrimonio: crescimento,
        melhorMes,
        piorMes,
        mediaMensal,
        tendencia: crescimento > 0 ? 'crescimento' : 'queda'
      });
      
      setLoading(false);
    }, 800);
  }, [selectedMetric, timeFrame]);

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Renderiza gráfico de linha
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={dadosEvolucao} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" fontSize={12} />
        <YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {selectedMetric === 'patrimonio' && (
          <Line 
            type="monotone" 
            dataKey="patrimonio" 
            stroke="#10B981" 
            strokeWidth={3}
            name="Patrimônio"
            dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8 }}
          />
        )}
        {selectedMetric === 'fluxo' && (
          <>
            <Line 
              type="monotone" 
              dataKey="receitas" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Receitas"
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="#EF4444" 
              strokeWidth={2}
              name="Despesas"
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
            />
          </>
        )}
        {selectedMetric === 'comparativo' && (
          <Line 
            type="monotone" 
            dataKey="saldo" 
            stroke="#3B82F6" 
            strokeWidth={3}
            name="Saldo Mensal"
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  // Renderiza gráfico de área
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={dadosEvolucao} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" fontSize={12} />
        <YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {selectedMetric === 'patrimonio' && (
          <Area 
            type="monotone" 
            dataKey="patrimonio" 
            stroke="#10B981" 
            fill="#10B981"
            fillOpacity={0.3}
            name="Patrimônio"
          />
        )}
        {selectedMetric === 'fluxo' && (
          <>
            <Area 
              type="monotone" 
              dataKey="receitas" 
              stackId="1"
              stroke="#10B981" 
              fill="#10B981"
              fillOpacity={0.6}
              name="Receitas"
            />
            <Area 
              type="monotone" 
              dataKey="despesas" 
              stackId="1"
              stroke="#EF4444" 
              fill="#EF4444"
              fillOpacity={0.6}
              name="Despesas"
            />
          </>
        )}
        {selectedMetric === 'comparativo' && (
          <Area 
            type="monotone" 
            dataKey="saldo" 
            stroke="#3B82F6" 
            fill="#3B82F6"
            fillOpacity={0.3}
            name="Saldo Mensal"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );

  // Renderiza gráfico composto
  const renderComposedChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={dadosEvolucao} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" fontSize={12} />
        <YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
        <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
        <Line 
          type="monotone" 
          dataKey="patrimonio" 
          stroke="#8B5CF6" 
          strokeWidth={3}
          name="Patrimônio Acumulado"
          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Renderiza o gráfico baseado no tipo selecionado
  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return renderAreaChart();
      case 'composed':
        return renderComposedChart();
      default:
        return renderLineChart();
    }
  };

  if (loading) {
    return (
      <PageContainer title="Evolução Financeira">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando evolução...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Evolução Financeira"
      subtitle={`Período: ${formatPeriodo()}`}
      actions={
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => {}}>
            <Filter size={16} />
            Filtros
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Download size={16} />
            Exportar
          </Button>
          <Button variant="secondary" onClick={() => navigate('/relatorios')}>
            <ArrowLeft size={16} />
            Voltar
          </Button>
        </div>
      }
    >
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${estatisticas.tendencia === 'crescimento' ? 'bg-green-100' : 'bg-red-100'}`}>
              {estatisticas.tendencia === 'crescimento' ? 
                <TrendingUp size={20} className="text-green-600" /> :
                <TrendingDown size={20} className="text-red-600" />
              }
            </div>
            <div>
              <p className="text-sm text-gray-600">Crescimento Patrimonial</p>
              <p className={`text-xl font-bold ${estatisticas.tendencia === 'crescimento' ? 'text-green-600' : 'text-red-600'}`}>
                {estatisticas.crescimentoPatrimonio > 0 ? '+' : ''}{estatisticas.crescimentoPatrimonio.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Média Mensal</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(estatisticas.mediaMensal)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Melhor Mês</p>
              <p className="text-lg font-bold text-gray-800">{estatisticas.melhorMes?.mes}</p>
              <p className="text-sm text-green-600">{formatCurrency(estatisticas.melhorMes?.saldo)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Menor Saldo</p>
              <p className="text-lg font-bold text-gray-800">{estatisticas.piorMes?.mes}</p>
              <p className="text-sm text-orange-600">{formatCurrency(estatisticas.piorMes?.saldo)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controles de Visualização */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Métrica:</label>
              <select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="patrimonio">Evolução Patrimonial</option>
                <option value="fluxo">Fluxo de Caixa</option>
                <option value="comparativo">Saldo Mensal</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <select 
                value={timeFrame} 
                onChange={(e) => setTimeFrame(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'line' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <LineChartIcon size={16} />
              Linha
            </Button>
            <Button
              variant={chartType === 'area' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              <BarChart3 size={16} />
              Área
            </Button>
            <Button
              variant={chartType === 'composed' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('composed')}
            >
              <Activity size={16} />
              Composto
            </Button>
          </div>
        </div>
      </Card>

      {/* Gráfico Principal */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedMetric === 'patrimonio' && 'Evolução do Patrimônio'}
              {selectedMetric === 'fluxo' && 'Fluxo de Receitas e Despesas'}
              {selectedMetric === 'comparativo' && 'Comparativo de Saldo Mensal'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedMetric === 'patrimonio' && 'Acompanhe o crescimento do seu patrimônio ao longo do tempo'}
              {selectedMetric === 'fluxo' && 'Visualize a entrada e saída de dinheiro mês a mês'}
              {selectedMetric === 'comparativo' && 'Compare o saldo líquido entre diferentes períodos'}
            </p>
          </div>
        </div>
        {renderChart()}
      </Card>

      {/* Tabela de Dados */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados Detalhados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Período</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Receitas</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Despesas</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Saldo</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Patrimônio</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Variação</th>
              </tr>
            </thead>
            <tbody>
              {dadosEvolucao.map((item, index) => {
                const variacaoPatrimonio = index > 0 ? 
                  ((item.patrimonio - dadosEvolucao[index - 1].patrimonio) / dadosEvolucao[index - 1].patrimonio) * 100 : 0;
                
                return (
                  <tr key={item.periodo} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{item.periodo}</td>
                    <td className="text-right py-3 px-4 text-green-600 font-medium">
                      {formatCurrency(item.receitas)}
                    </td>
                    <td className="text-right py-3 px-4 text-red-600 font-medium">
                      {formatCurrency(item.despesas)}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.saldo)}
                    </td>
                    <td className="text-right py-3 px-4 font-bold text-gray-800">
                      {formatCurrency(item.patrimonio)}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${variacaoPatrimonio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {index > 0 && (
                        <>
                          {variacaoPatrimonio > 0 ? '+' : ''}{variacaoPatrimonio.toFixed(1)}%
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Pontos Positivos</h3>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-green-600">Crescimento consistente:</span> Seu patrimônio cresceu{' '}
                <span className="font-bold">{estatisticas.crescimentoPatrimonio.toFixed(1)}%</span> no período analisado.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-green-600">Saldo positivo:</span> Você manteve saldo positivo em{' '}
                <span className="font-bold">83%</span> dos meses analisados.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-green-600">Melhor performance:</span> Seu melhor mês foi{' '}
                <span className="font-bold">{estatisticas.melhorMes?.mes}</span> com saldo de{' '}
                <span className="font-bold">{formatCurrency(estatisticas.melhorMes?.saldo)}</span>.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Info size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Recomendações</h3>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-blue-600">Meta de crescimento:</span> Para manter o ritmo atual, tente economizar{' '}
                <span className="font-bold">{formatCurrency(300)}</span> adicionais por mês.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-blue-600">Diversificação:</span> Considere investir parte do patrimônio em diferentes modalidades para reduzir riscos.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-blue-600">Reserva de emergência:</span> Mantenha pelo menos{' '}
                <span className="font-bold">{formatCurrency(estatisticas.mediaMensal * 6)}</span> como reserva de segurança.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default RelatorioEvolucao;