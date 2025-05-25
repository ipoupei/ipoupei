// src/pages/RelatorioProjecao.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Target, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Calculator,
  Eye,
  EyeOff
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
  Legend,
  ReferenceLine
} from 'recharts';
import PageContainer from '../Components/layout/PageContainer';
import Card from '../Components/ui/Card';
import Button from '../Components/ui/Button';
import { useReports } from '../context/ReportsContext';
import { formatCurrency } from '../utils/formatCurrency';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Relatório de projeções financeiras futuras
 * Baseado em receitas, despesas fixas, parcelamentos e tendências históricas
 */
const RelatorioProjecao = () => {
  const navigate = useNavigate();
  const { filters, formatPeriodo } = useReports();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [tipoProjecao, setTipoProjecao] = useState('conservador'); // 'otimista', 'conservador', 'pessimista'
  const [periodoProjecao, setPeriodoProjecao] = useState(6); // meses
  const [incluirInflacao, setIncluirInflacao] = useState(true);
  const [mostrarCenarios, setMostrarCenarios] = useState(false);
  
  // Estados para dados
  const [dadosProjecao, setDadosProjecao] = useState([]);
  const [cenarios, setCenarios] = useState({
    otimista: [],
    conservador: [],
    pessimista: []
  });
  const [resumoProjecao, setResumoProjecao] = useState({
    saldoAtual: 0,
    saldoProjetado: 0,
    crescimentoEsperado: 0,
    metaAlcancavel: null,
    riscos: [],
    oportunidades: []
  });

  // Configurações de cenários
  const configCenarios = {
    otimista: {
      crescimentoReceita: 0.05, // 5% ao mês
      reducaoDespesa: 0.02, // 2% ao mês
      inflacao: 0.005, // 0.5% ao mês
      nome: 'Otimista',
      cor: '#10B981'
    },
    conservador: {
      crescimentoReceita: 0.02, // 2% ao mês
      reducaoDespesa: 0, // sem redução
      inflacao: 0.008, // 0.8% ao mês
      nome: 'Conservador',
      cor: '#3B82F6'
    },
    pessimista: {
      crescimentoReceita: -0.01, // -1% ao mês
      reducaoDespesa: -0.01, // aumento de 1% ao mês
      inflacao: 0.012, // 1.2% ao mês
      nome: 'Pessimista',
      cor: '#EF4444'
    }
  };

  // Dados base mockados
  const dadosBase = {
    saldoAtual: 21400,
    receitaFixaMensal: 6500,
    despesaFixaMensal: 4300,
    parcelamentosAtivos: [
      { descricao: 'Carro', valorMensal: 580, mesesRestantes: 24 },
      { descricao: 'Celular', valorMensal: 120, mesesRestantes: 8 },
      { descricao: 'Cartão', valorMensal: 340, mesesRestantes: 12 }
    ],
    despesasVariaveis: 800 // média mensal
  };

  // Gera projeções
  const gerarProjecoes = () => {
    const hoje = new Date();
    const projOtimista = [];
    const projConservador = [];
    const projPessimista = [];

    for (let i = 0; i <= periodoProjecao; i++) {
      const data = addMonths(hoje, i);
      const periodo = format(data, 'MMM yyyy', { locale: ptBR });
      
      // Para cada cenário
      Object.entries(configCenarios).forEach(([cenario, config]) => {
        // Receita com crescimento
        const receita = dadosBase.receitaFixaMensal * Math.pow(1 + config.crescimentoReceita, i);
        
        // Despesas com inflação e possível redução
        const despesaFixa = dadosBase.despesaFixaMensal * 
          Math.pow(1 + config.inflacao, i) * 
          Math.pow(1 + config.reducaoDespesa, i);
        
        // Parcelamentos (diminuem com o tempo)
        const parcelamentos = dadosBase.parcelamentosAtivos.reduce((total, parcela) => {
          return total + (i < parcela.mesesRestantes ? parcela.valorMensal : 0);
        }, 0);
        
        // Despesas variáveis com inflação
        const despesaVariavel = dadosBase.despesasVariaveis * Math.pow(1 + config.inflacao, i);
        
        const totalDespesa = despesaFixa + parcelamentos + despesaVariavel;
        const saldoMensal = receita - totalDespesa;
        
        // Patrimônio acumulado
        const saldoAcumulado = i === 0 ? dadosBase.saldoAtual : 
          (cenario === 'otimista' ? projOtimista[i - 1]?.patrimonio : 
           cenario === 'conservador' ? projConservador[i - 1]?.patrimonio :
           projPessimista[i - 1]?.patrimonio) + saldoMensal;
        
        const dadosPeriodo = {
          periodo,
          receita: Math.round(receita),
          despesa: Math.round(totalDespesa),
          saldoMensal: Math.round(saldoMensal),
          patrimonio: Math.round(saldoAcumulado),
          mes: i
        };
        
        if (cenario === 'otimista') projOtimista.push(dadosPeriodo);
        else if (cenario === 'conservador') projConservador.push(dadosPeriodo);
        else projPessimista.push(dadosPeriodo);
      });
    }

    return {
      otimista: projOtimista,
      conservador: projConservador,
      pessimista: projPessimista
    };
  };

  // Carrega dados
  useEffect(() => {
    setLoading(true);
    
    setTimeout(() => {
      const novosCenarios = gerarProjecoes();
      setCenarios(novosCenarios);
      setDadosProjecao(novosCenarios[tipoProjecao]);
      
      const cenarioSelecionado = novosCenarios[tipoProjecao];
      const ultimoPonto = cenarioSelecionado[cenarioSelecionado.length - 1];
      const crescimento = ((ultimoPonto.patrimonio - dadosBase.saldoAtual) / dadosBase.saldoAtual) * 100;
      
      setResumoProjecao({
        saldoAtual: dadosBase.saldoAtual,
        saldoProjetado: ultimoPonto.patrimonio,
        crescimentoEsperado: crescimento,
        metaAlcancavel: ultimoPonto.patrimonio > 50000 ? 'Meta de R$ 50.000' : null,
        riscos: [
          'Inflação acima do esperado pode reduzir poder de compra',
          'Emergências não previstas podem impactar o planejamento',
          'Mudanças na renda podem alterar significativamente as projeções'
        ],
        oportunidades: [
          'Renda extra pode acelerar crescimento patrimonial',
          'Redução de gastos supérfluos libera mais recursos',
          'Investimentos bem aplicados podem superar projeções'
        ]
      });
      
      setLoading(false);
    }, 800);
  }, [tipoProjecao, periodoProjecao, incluirInflacao]);

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

  // Renderiza gráfico de projeção
  const renderProjecaoChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={dadosProjecao} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" fontSize={12} />
        <YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine 
          y={dadosBase.saldoAtual} 
          stroke="#9CA3AF" 
          strokeDasharray="5 5" 
          label="Saldo Atual"
        />
        <Area 
          type="monotone" 
          dataKey="patrimonio" 
          stroke={configCenarios[tipoProjecao].cor}
          fill={configCenarios[tipoProjecao].cor}
          fillOpacity={0.3}
          name="Patrimônio Projetado"
        />
        <Line 
          type="monotone" 
          dataKey="saldoMensal" 
          stroke="#8B5CF6" 
          strokeWidth={2}
          name="Saldo Mensal"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  // Renderiza comparação de cenários
  const renderComparacaoChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" fontSize={12} />
        <YAxis tickFormatter={(value) => formatCurrency(value)} fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          data={cenarios.otimista}
          type="monotone" 
          dataKey="patrimonio" 
          stroke="#10B981" 
          strokeWidth={2}
          name="Cenário Otimista"
          dot={false}
        />
        <Line 
          data={cenarios.conservador}
          type="monotone" 
          dataKey="patrimonio" 
          stroke="#3B82F6" 
          strokeWidth={3}
          name="Cenário Conservador"
          dot={false}
        />
        <Line 
          data={cenarios.pessimista}
          type="monotone" 
          dataKey="patrimonio" 
          stroke="#EF4444" 
          strokeWidth={2}
          name="Cenário Pessimista"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <PageContainer title="Projeções Financeiras">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Calculando projeções...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Projeções Financeiras"
      subtitle={`Projeção para os próximos ${periodoProjecao} meses`}
      actions={
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => {}}>
            <Filter size={16} />
            Configurar
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
      {/* Cards de Resumo da Projeção */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Saldo Atual</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(resumoProjecao.saldoAtual)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Projeção {periodoProjecao}m</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(resumoProjecao.saldoProjetado)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calculator size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Crescimento</p>
              <p className={`text-xl font-bold ${resumoProjecao.crescimentoEsperado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {resumoProjecao.crescimentoEsperado > 0 ? '+' : ''}{resumoProjecao.crescimentoEsperado.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Meta 50k</p>
              <p className="text-lg font-bold text-gray-800">
                {resumoProjecao.saldoProjetado >= 50000 ? `${periodoProjecao} meses` : '> 1 ano'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controles de Configuração */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Cenário:</label>
              <select 
                value={tipoProjecao} 
                onChange={(e) => setTipoProjecao(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pessimista">Pessimista</option>
                <option value="conservador">Conservador</option>
                <option value="otimista">Otimista</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <select 
                value={periodoProjecao} 
                onChange={(e) => setPeriodoProjecao(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>1 ano</option>
                <option value={24}>2 anos</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="inflacao"
                checked={incluirInflacao}
                onChange={(e) => setIncluirInflacao(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="inflacao" className="text-sm font-medium text-gray-700">
                Incluir inflação
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={!mostrarCenarios ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMostrarCenarios(false)}
            >
              <Eye size={16} />
              Cenário Único
            </Button>
            <Button
              variant={mostrarCenarios ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMostrarCenarios(true)}
            >
              <Target size={16} />
              Comparar Cenários
            </Button>
          </div>
        </div>
      </Card>

      {/* Gráfico Principal */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {mostrarCenarios ? 'Comparação de Cenários' : `Projeção ${configCenarios[tipoProjecao].nome}`}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {mostrarCenarios 
                ? 'Compare diferentes cenários para entender possíveis variações'
                : 'Baseado em receitas fixas, despesas atuais e tendências históricas'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: configCenarios[tipoProjecao].cor }}></div>
            <span className="text-sm font-medium text-gray-700">
              {configCenarios[tipoProjecao].nome}
            </span>
          </div>
        </div>
        {mostrarCenarios ? renderComparacaoChart() : renderProjecaoChart()}
      </Card>

      {/* Detalhamento dos Dados Base */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados Base da Projeção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Receita Fixa Mensal</span>
            </div>
            <p className="text-xl font-bold text-green-800">{formatCurrency(dadosBase.receitaFixaMensal)}</p>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-700">Despesa Fixa Mensal</span>
            </div>
            <p className="text-xl font-bold text-red-800">{formatCurrency(dadosBase.despesaFixaMensal)}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar size={16} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Parcelamentos</span>
            </div>
            <p className="text-xl font-bold text-orange-800">
              {formatCurrency(dadosBase.parcelamentosAtivos.reduce((acc, p) => acc + p.valorMensal, 0))}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Calculator size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Despesas Variáveis</span>
            </div>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(dadosBase.despesasVariaveis)}</p>
          </div>
        </div>

        {/* Lista de Parcelamentos */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Parcelamentos Ativos</h4>
          <div className="space-y-2">
            {dadosBase.parcelamentosAtivos.map((parcela, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-800">{parcela.descricao}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({parcela.mesesRestantes} meses restantes)
                  </span>
                </div>
                <span className="font-bold text-gray-800">{formatCurrency(parcela.valorMensal)}/mês</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Análises e Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riscos */}
        <Card className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Riscos e Atenções</h3>
          </div>
          
          <div className="space-y-3">
            {resumoProjecao.riscos.map((risco, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{risco}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Oportunidades */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Oportunidades</h3>
          </div>
          
          <div className="space-y-3">
            {resumoProjecao.oportunidades.map((oportunidade, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{oportunidade}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Metas e Objetivos */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 mt-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Zap size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Simulação de Metas</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h4 className="font-medium text-gray-800 mb-2">🎯 Meta: R$ 30.000</h4>
            <p className="text-sm text-gray-600 mb-1">
              Tempo estimado: <span className="font-bold text-purple-600">4 meses</span>
            </p>
            <p className="text-xs text-gray-500">
              Mantendo o ritmo atual de economia
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h4 className="font-medium text-gray-800 mb-2">🏠 Meta: R$ 50.000</h4>
            <p className="text-sm text-gray-600 mb-1">
              Tempo estimado: <span className="font-bold text-purple-600">8 meses</span>
            </p>
            <p className="text-xs text-gray-500">
              Para entrada de um imóvel
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h4 className="font-medium text-gray-800 mb-2">🚗 Meta: R$ 80.000</h4>
            <p className="text-sm text-gray-600 mb-1">
              Tempo estimado: <span className="font-bold text-purple-600">14 meses</span>
            </p>
            <p className="text-xs text-gray-500">
              Para troca de veículo
            </p>
          </div>
        </div>
      </Card>

      {/* Informações sobre Metodologia */}
      <Card className="p-6 bg-gray-50 mt-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gray-500 rounded-lg">
            <Info size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Como Calculamos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Cenário Conservador</h4>
            <ul className="space-y-1">
              <li>• Crescimento de receita: 2% ao mês</li>
              <li>• Inflação aplicada: 0.8% ao mês</li>
              <li>• Sem redução de despesas</li>
              <li>• Parcelamentos mantidos</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Fatores Considerados</h4>
            <ul className="space-y-1">
              <li>• Receitas fixas mensais atuais</li>
              <li>• Despesas fixas e variáveis</li>
              <li>• Parcelamentos com prazo definido</li>
              <li>• Tendências históricas de gastos</li>
            </ul>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default RelatorioProjecao;