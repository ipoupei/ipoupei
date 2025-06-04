// src/pages/RelatorioCategoria.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Pie } from 'recharts';
import PageContainer from '@shared/components/layouts/PageContainer';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import { useReports } from '@old_context/old_ReportsContext';
import { formatCurrency } from '@utils/formatCurrency';



/**
 * Relatório detalhado por categorias e subcategorias
 * Exibe gráficos, tabelas e análises de gastos por categoria
 */
const RelatorioCategoria = () => {
  const navigate = useNavigate();
  const { filters, formatPeriodo } = useReports();
  
  // Estados para controle da visualização
  const [viewMode, setViewMode] = useState('chart'); // 'chart' ou 'table'
  const [selectedType, setSelectedType] = useState('despesas'); // 'despesas', 'receitas', 'ambos'
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showSubcategorias, setShowSubcategorias] = useState(true);
  
  // Estados para dados
  const [loading, setLoading] = useState(false);
  const [dadosGraficos, setDadosGraficos] = useState([]);
  const [dadosTabela, setDadosTabela] = useState([]);
  const [resumo, setResumo] = useState({
    totalDespesas: 0,
    totalReceitas: 0,
    categoriaTopDespesa: null,
    categoriaTopReceita: null,
    numeroTransacoes: 0
  });

  // Cores para os gráficos
  const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  // Dados mockados para demonstração
  const mockDadosDespesas = [
    { nome: 'Alimentação', valor: 1250, percentual: 35.5, cor: '#3B82F6', subcategorias: [
      { nome: 'Supermercado', valor: 800, percentual: 64 },
      { nome: 'Restaurantes', valor: 350, percentual: 28 },
      { nome: 'Delivery', valor: 100, percentual: 8 }
    ]},
    { nome: 'Transporte', valor: 680, percentual: 19.3, cor: '#10B981', subcategorias: [
      { nome: 'Combustível', valor: 400, percentual: 58.8 },
      { nome: 'Transporte Público', valor: 180, percentual: 26.5 },
      { nome: 'Aplicativos', valor: 100, percentual: 14.7 }
    ]},
    { nome: 'Moradia', valor: 850, percentual: 24.1, cor: '#F59E0B', subcategorias: [
      { nome: 'Aluguel', valor: 500, percentual: 58.8 },
      { nome: 'Contas', valor: 250, percentual: 29.4 },
      { nome: 'Manutenção', valor: 100, percentual: 11.8 }
    ]},
    { nome: 'Lazer', valor: 390, percentual: 11.1, cor: '#EF4444', subcategorias: [
      { nome: 'Cinema/Teatro', valor: 150, percentual: 38.5 },
      { nome: 'Streaming', valor: 90, percentual: 23.1 },
      { nome: 'Viagens', valor: 150, percentual: 38.5 }
    ]},
    { nome: 'Saúde', valor: 350, percentual: 9.9, cor: '#8B5CF6', subcategorias: [
      { nome: 'Plano de Saúde', valor: 200, percentual: 57.1 },
      { nome: 'Medicamentos', valor: 100, percentual: 28.6 },
      { nome: 'Consultas', valor: 50, percentual: 14.3 }
    ]}
  ];

  const mockDadosReceitas = [
    { nome: 'Salário', valor: 4500, percentual: 75, cor: '#10B981', subcategorias: [
      { nome: 'Salário Principal', valor: 4000, percentual: 88.9 },
      { nome: 'Horas Extras', valor: 500, percentual: 11.1 }
    ]},
    { nome: 'Freelance', valor: 1200, percentual: 20, cor: '#3B82F6', subcategorias: [
      { nome: 'Projetos', valor: 800, percentual: 66.7 },
      { nome: 'Consultoria', valor: 400, percentual: 33.3 }
    ]},
    { nome: 'Investimentos', valor: 300, percentual: 5, cor: '#F59E0B', subcategorias: [
      { nome: 'Dividendos', valor: 200, percentual: 66.7 },
      { nome: 'Juros', valor: 100, percentual: 33.3 }
    ]}
  ];

  // Carrega dados baseado no tipo selecionado
  useEffect(() => {
    setLoading(true);
    
    // Simula carregamento de dados
    setTimeout(() => {
      let dados, total;
      
      if (selectedType === 'despesas') {
        dados = mockDadosDespesas;
        total = dados.reduce((acc, item) => acc + item.valor, 0);
      } else if (selectedType === 'receitas') {
        dados = mockDadosReceitas;
        total = dados.reduce((acc, item) => acc + item.valor, 0);
      } else {
        dados = [...mockDadosDespesas, ...mockDadosReceitas];
        total = dados.reduce((acc, item) => acc + item.valor, 0);
      }
      
      setDadosGraficos(dados);
      setDadosTabela(dados);
      
      setResumo({
        totalDespesas: mockDadosDespesas.reduce((acc, item) => acc + item.valor, 0),
        totalReceitas: mockDadosReceitas.reduce((acc, item) => acc + item.valor, 0),
        categoriaTopDespesa: mockDadosDespesas[0],
        categoriaTopReceita: mockDadosReceitas[0],
        numeroTransacoes: 247
      });
      
      setLoading(false);
    }, 800);
  }, [selectedType]);

  // Toggle expansão de categoria
  const toggleExpandCategory = (categoryName) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  // Componente de Tooltip customizado para gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">
            <span className="font-bold" style={{ color: data.cor }}>
              {formatCurrency(data.valor)}
            </span>
            {' '}({data.percentual}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Renderiza o gráfico de pizza
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsPieChart>
        <Pie
          data={dadosGraficos}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ nome, percentual }) => `${nome} (${percentual}%)`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="valor"
        >
          {dadosGraficos.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );

  // Renderiza o gráfico de barras
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={dadosGraficos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="nome" 
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
        />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value)}
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="valor" fill="#3B82F6" radius={[4, 4, 0, 0]}>
          {dadosGraficos.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // Renderiza a tabela detalhada
  const renderTable = () => (
    <div className="space-y-2">
      {dadosTabela.map((categoria, index) => (
        <div key={categoria.nome} className="border border-gray-200 rounded-lg overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => toggleExpandCategory(categoria.nome)}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: categoria.cor || COLORS[index % COLORS.length] }}
              ></div>
              <div>
                <h3 className="font-medium text-gray-800">{categoria.nome}</h3>
                <p className="text-sm text-gray-500">{categoria.subcategorias?.length || 0} subcategorias</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-bold text-gray-800">{formatCurrency(categoria.valor)}</p>
                <p className="text-sm text-gray-500">{categoria.percentual}%</p>
              </div>
              {expandedCategories.has(categoria.nome) ? 
                <ChevronUp size={20} className="text-gray-400" /> : 
                <ChevronDown size={20} className="text-gray-400" />
              }
            </div>
          </div>
          
          {/* Subcategorias */}
          {expandedCategories.has(categoria.nome) && categoria.subcategorias && (
            <div className="bg-white">
              {categoria.subcategorias.map((sub, subIndex) => (
                <div key={sub.nome} className="flex items-center justify-between px-8 py-3 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-700">{sub.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{formatCurrency(sub.valor)}</p>
                    <p className="text-xs text-gray-500">{sub.percentual}% da categoria</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <PageContainer title="Análise por Categorias">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando análise...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Análise por Categorias"
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
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Despesas</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(resumo.totalDespesas)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Receitas</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(resumo.totalReceitas)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Saldo Período</p>
              <p className={`text-xl font-bold ${(resumo.totalReceitas - resumo.totalDespesas) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(resumo.totalReceitas - resumo.totalDespesas)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChart size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Transações</p>
              <p className="text-xl font-bold text-gray-800">{resumo.numeroTransacoes}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controles de Visualização */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Tipo:</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="despesas">Apenas Despesas</option>
                <option value="receitas">Apenas Receitas</option>
                <option value="ambos">Receitas e Despesas</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'chart' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
            >
              <PieChart size={16} />
              Gráficos
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <BarChart3 size={16} />
              Tabela
            </Button>
          </div>
        </div>
      </Card>

      {/* Conteúdo Principal */}
      {viewMode === 'chart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Categoria</h3>
            {renderPieChart()}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparação de Valores</h3>
            {renderBarChart()}
          </Card>
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Detalhamento por Categoria</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubcategorias(!showSubcategorias)}
            >
              {showSubcategorias ? <EyeOff size={16} /> : <Eye size={16} />}
              {showSubcategorias ? 'Ocultar' : 'Mostrar'} Subcategorias
            </Button>
          </div>
          {renderTable()}
        </Card>
      )}

      {/* Insights */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Info size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Insights Inteligentes</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h4 className="font-medium text-gray-800 mb-2">Categoria que mais cresce</h4>
            <p className="text-sm text-gray-600">
              <span className="font-bold text-blue-600">Alimentação</span> teve um aumento de{' '}
              <span className="font-bold text-green-600">+23%</span> comparado ao mês anterior.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h4 className="font-medium text-gray-800 mb-2">Oportunidade de economia</h4>
            <p className="text-sm text-gray-600">
              Você pode economizar até{' '}
              <span className="font-bold text-green-600">{formatCurrency(320)}</span>{' '}
              revisando gastos com <span className="font-bold text-blue-600">Lazer</span>.
            </p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default RelatorioCategoria;