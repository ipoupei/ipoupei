// src/pages/RelatoriosHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Calendar,
  Filter,
  Download,
  Eye,
  ChevronRight,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import PageContainer from '@shared/components/layouts/PageContainer';
import { useReports } from '@old_context/old_ReportsContext';
import { formatCurrency } from '@utils/formatCurrency';


import { useDashboardData } from '@modules/dashboard/store/dashboardStore';



/**
 * Tela inicial do módulo de relatórios
 * Hub principal para navegação entre diferentes tipos de relatórios
 */
const RelatoriosHome = () => {
  const navigate = useNavigate();
  const { filters, formatPeriodo, getPeriodoStats } = useReports();
  const { data: dashboardData, loading: dashboardLoading } = useDashboardData();
  
  // Estado para estatísticas rápidas
  const [quickStats, setQuickStats] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoPeriodo: 0,
    transacoes: 0
  });

  // Carrega estatísticas rápidas
  useEffect(() => {
    if (dashboardData) {
      setQuickStats({
        totalReceitas: dashboardData.receitas?.atual || 0,
        totalDespesas: dashboardData.despesas?.atual || 0,
        saldoPeriodo: (dashboardData.receitas?.atual || 0) - (dashboardData.despesas?.atual || 0),
        transacoes: 127 // Mock - futuramente virá da API
      });
    }
  }, [dashboardData]);

  // Tipos de relatórios disponíveis
  const reportTypes = [
    {
      id: 'categorias',
      title: 'Análise por Categorias',
      description: 'Veja detalhadamente seus gastos e receitas organizados por categoria e subcategoria',
      icon: <PieChart size={32} />,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      route: '/relatorios/categorias',
      features: ['Gráficos detalhados', 'Comparações mensais', 'Top categorias'],
      popular: true
    },
    {
      id: 'evolucao',
      title: 'Evolução Financeira',
      description: 'Acompanhe sua evolução patrimonial e financeira mês a mês',
      icon: <TrendingUp size={32} />,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-emerald-600',
      route: '/relatorios/evolucao',
      features: ['Linha do tempo', 'Crescimento patrimonial', 'Tendências'],
      popular: false
    },
    {
      id: 'projecoes',
      title: 'Projeções Futuras',
      description: 'Veja projeções baseadas em suas receitas, despesas e parcelamentos ativos',
      icon: <Target size={32} />,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
      route: '/relatorios/projecoes',
      features: ['Projeções inteligentes', 'Cenários futuros', 'Planejamento'],
      popular: false
    }
  ];

  // Ações rápidas
  const quickActions = [
    {
      id: 'filtros',
      title: 'Configurar Filtros',
      description: 'Personalizar período e categorias',
      icon: <Filter size={20} />,
      onClick: () => setShowFiltersModal(true)
    },
    {
      id: 'exportar',
      title: 'Exportar Dados',
      description: 'Baixar relatórios em PDF/Excel',
      icon: <Download size={20} />,
      onClick: () => handleExport()
    }
  ];

  // Estados para modais
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Navegar para relatório específico
  const navigateToReport = (route) => {
    navigate(route);
  };

  // Handler para exportação (futura implementação)
  const handleExport = () => {
    // TODO: Implementar exportação
    console.log('Exportar dados...');
  };

  // Obter estatísticas do período
  const periodoStats = getPeriodoStats();

  return (
    <PageContainer
      title="Relatórios e Análises"
      subtitle="Analise seus dados financeiros e tome decisões inteligentes"
      className="space-y-6"
    >
      {/* Resumo do Período Atual */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Resumo do Período</h2>
            <p className="text-blue-100">{formatPeriodo()}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={20} className="text-blue-200" />
            <span className="text-sm text-blue-100">
              {periodoStats.dias} dias • {periodoStats.meses} meses
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-green-300" />
              <span className="text-sm text-blue-100">Receitas</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(quickStats.totalReceitas)}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 size={16} className="text-red-300" />
              <span className="text-sm text-blue-100">Despesas</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(quickStats.totalDespesas)}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity size={16} className="text-yellow-300" />
              <span className="text-sm text-blue-100">Saldo</span>
            </div>
            <p className={`text-2xl font-bold ${quickStats.saldoPeriodo >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatCurrency(quickStats.saldoPeriodo)}
            </p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap size={16} className="text-blue-300" />
              <span className="text-sm text-blue-100">Transações</span>
            </div>
            <p className="text-2xl font-bold">{quickStats.transacoes}</p>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            onClick={action.onClick}
            className="flex items-center space-x-2 hover:bg-gray-50"
          >
            {action.icon}
            <span>{action.title}</span>
          </Button>
        ))}
      </div>

      {/* Grid de Tipos de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className="relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => navigateToReport(report.route)}
          >
            {/* Badge Popular */}
            {report.popular && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Popular
              </div>
            )}

            {/* Ícone e Header */}
            <div className={`w-16 h-16 ${report.gradient} bg-gradient-to-br rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
              {report.icon}
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">{report.description}</p>

            {/* Features */}
            <div className="space-y-2 mb-6">
              {report.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">Ver relatório</span>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </Card>
        ))}
      </div>

      {/* Seção de Insights Rápidos */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Insights Inteligentes</h3>
            <p className="text-sm text-gray-600">Baseado nos seus dados financeiros</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Economia Potencial</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mb-1">
              {formatCurrency(450)}
            </p>
            <p className="text-xs text-gray-500">
              Revisando suas despesas variáveis
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Categoria Destaque</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mb-1">Alimentação</p>
            <p className="text-xs text-gray-500">
              35% dos seus gastos este mês
            </p>
          </div>
        </div>
      </div>

      {/* Footer com Dicas */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">💡 Dicas para Análise</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Compare períodos diferentes para identificar tendências e padrões em seus gastos.</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Use filtros por categoria para encontrar oportunidades de economia específicas.</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Exporte seus dados para fazer análises mais detalhadas em ferramentas externas.</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Acompanhe projeções para planejar melhor seus objetivos financeiros futuros.</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default RelatoriosHome;