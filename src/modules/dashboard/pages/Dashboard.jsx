import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  BarChart3,
  Eye,
  ChevronRight as ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Lightbulb,
  PiggyBank,
  Target,
  Zap,
  Plus,
  Activity
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

// Hooks personalizados existentes
import useAuth from "@modules/auth/hooks/useAuth";
import useDashboardData from '@modules/dashboard/hooks/useDashboardData';
import usePeriodo from '@modules/transacoes/hooks/usePeriodo';

// Utilitários
import { formatCurrency } from '@shared/utils/formatCurrency';
import { getCurrentMonthName } from '@shared/utils/getCurrentMonthName';

// Componentes existentes
import DonutChartCategoria from '@modules/relatorios/components/DonutChartCategoria';
import CalendarioFinanceiro from '@modules/dashboard/components/CalendarioFinanceiro';
import ProjecaoSaldoGraph from '@modules/dashboard/components/ProjecaoSaldoGraph';
import DetalhesDoDiaModal from '@modules/dashboard/components/DetalhesDoDiaModal';

// CSS modularizado
import '../styles/Dashboard.css';

/**
 * Dashboard - Versão REFINADA E MODERNIZADA
 * ✅ Visual aprimorado com melhor hierarquia
 * ✅ Insights inteligentes baseados nos dados
 * ✅ Loading state customizado (skeleton)
 * ✅ Microinterações e animações suaves
 * ✅ Cards com sparklines e tendências
 * ✅ Seção de insights rápidos
 * ✅ Melhor responsividade e acessibilidade
 */
const Dashboard = () => {
  const navigate = useNavigate();
  
  // ✅ TODOS OS HOOKS NO TOPO - SEMPRE NA MESMA ORDEM
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading, error, refreshData } = useDashboardData();
  const { 
    currentDate,
    navigateMonth, 
    goToToday, 
    isCurrentMonth,
    getFormattedPeriod,
    getCurrentMonth
  } = usePeriodo();
  
  // Estados locais
  const [diaDetalhes, setDiaDetalhes] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [flippedCards, setFlippedCards] = useState({
    saldo: false,
    receitas: false,
    despesas: false,
    cartaoCredito: false
  });

  // ✅ EFFECTS SEMPRE NO MESMO LOCAL
  useEffect(() => {
    console.log('📅 Dashboard período:', getFormattedPeriod());
  }, [currentDate]);

  // ✅ HANDLERS SEMPRE NO MESMO LOCAL
  const handleNavigateMonth = (direction) => {
    navigateMonth(direction);
  };

  const handleGoToToday = () => {
    goToToday();
  };

  const handleCardFlip = (cardName) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  const handleCardKeyDown = (event, cardName) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardFlip(cardName);
    }
  };

  const handleDiaClick = (dia) => {
    if (dia && dia.movimentos && dia.movimentos.length > 0) {
      setDiaDetalhes(dia);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDiaDetalhes(null);
  };

  // ✅ NOVA FUNCIONALIDADE: Calcular insights inteligentes
  const calcularInsights = () => {
    if (!data) return [];

    const insights = [];
    const dadosSaldo = data?.saldo || { atual: 0, previsto: 0 };
    const dadosDespesas = data?.despesas || { atual: 0, previsto: 0, categorias: [] };
    const dadosReceitas = data?.receitas || { atual: 0, previsto: 0, categorias: [] };
    const dadosCartao = data?.cartaoCredito || { atual: 0, limite: 0 };

    // Insight sobre saldo
    const diferecaSaldo = dadosSaldo.previsto - dadosSaldo.atual;
    if (diferecaSaldo > 0) {
      insights.push({
        tipo: 'positivo',
        icone: TrendingUp,
        titulo: 'Saldo em crescimento',
        texto: `Você tem ${formatCurrency(diferecaSaldo)} ainda por receber este mês`,
        cor: 'text-success'
      });
    } else if (diferecaSaldo < 0) {
      insights.push({
        tipo: 'alerta',
        icone: Target,
        titulo: 'Atenção aos gastos',
        texto: `Você já gastou ${formatCurrency(Math.abs(diferecaSaldo))} além do previsto`,
        cor: 'text-warning'
      });
    }

    // Insight sobre categoria com maior gasto
    if (dadosDespesas.categorias && dadosDespesas.categorias.length > 0) {
      const maiorCategoria = dadosDespesas.categorias[0];
      insights.push({
        tipo: 'informativo',
        icone: BarChart3,
        titulo: 'Maior categoria de gastos',
        texto: `${maiorCategoria.nome}: ${formatCurrency(maiorCategoria.valor)}`,
        cor: 'text-info'
      });
    }

    // Insight sobre uso do cartão
    if (dadosCartao.limite > 0) {
      const percentualUso = (dadosCartao.atual / dadosCartao.limite) * 100;
      if (percentualUso > 80) {
        insights.push({
          tipo: 'alerta',
          icone: CreditCard,
          titulo: 'Limite do cartão alto',
          texto: `${percentualUso.toFixed(0)}% do limite já foi utilizado`,
          cor: 'text-error'
        });
      } else if (percentualUso < 30) {
        insights.push({
          tipo: 'positivo',
          icone: PiggyBank,
          titulo: 'Uso consciente do cartão',
          texto: `Apenas ${percentualUso.toFixed(0)}% do limite utilizado`,
          cor: 'text-success'
        });
      }
    }

    // Se não há insights específicos, adicionar motivacional
    if (insights.length === 0) {
      insights.push({
        tipo: 'motivacional',
        icone: Zap,
        titulo: 'Continue organizando!',
        texto: `Você está no caminho certo para organizar suas finanças`,
        cor: 'text-primary'
      });
    }

    return insights.slice(0, 3); // Máximo 3 insights
  };

  // ✅ NOVA FUNCIONALIDADE: Gerar dados para sparklines (mini gráficos)
  const gerarDadosSparkline = (tipo) => {
    // Simular dados históricos dos últimos 7 dias para demo
    // Em produção, isso viria dos dados reais
    const baseValue = tipo === 'saldo' ? data?.saldo?.atual || 0 : 
                     tipo === 'receitas' ? data?.receitas?.atual || 0 :
                     data?.despesas?.atual || 0;
    
    return Array.from({ length: 7 }, (_, i) => ({
      x: i,
      y: baseValue * (0.8 + Math.random() * 0.4) // Variação de ±20%
    }));
  };

  // ✅ EXTRAIR DADOS SEGUROS - SEMPRE NO MESMO LOCAL
  const dadosSegurosSaldo = data?.saldo || { atual: 0, previsto: 0 };
  const dadosSegurosDespesas = data?.despesas || { atual: 0, previsto: 0, categorias: [] };
  const dadosSeguroReceitas = data?.receitas || { atual: 0, previsto: 0, categorias: [] };
  const dadosSeguroCartao = data?.cartaoCredito || { atual: 0, limite: 0 };
  const contasDetalhadas = data?.contasDetalhadas || [];
  const cartoesDetalhados = data?.cartoesDetalhados || [];
  const receitasPorCategoria = data?.receitasPorCategoria || [];
  const despesasPorCategoria = data?.despesasPorCategoria || [];
  const insights = calcularInsights();

  // ✅ PERÍODO FORMATADO
  const periodoFormatado = getFormattedPeriod();

  // ✅ COMPONENTE: Skeleton Loading (Novo)
  const SkeletonLoading = () => (
    <div className="dashboard">
      {/* Skeleton para seletor de período */}
      <div className="dashboard__period-section">
        <div className="dashboard__period-wrapper">
          <div className="dashboard__period-controls">
            <div className="skeleton skeleton--button"></div>
            <div className="skeleton skeleton--period"></div>
            <div className="skeleton skeleton--button"></div>
          </div>
        </div>
      </div>

      {/* Skeleton para cards */}
      <section className="dashboard__cards-section">
        <div className="dashboard__cards-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--card"></div>
          ))}
        </div>
      </section>

      {/* Skeleton para insights */}
      <section className="dashboard__insights-section">
        <div className="skeleton skeleton--insights"></div>
      </section>

      {/* Skeleton para acesso rápido */}
      <section className="dashboard__quick-access-section">
        <div className="skeleton skeleton--quick-access"></div>
      </section>

      {/* Skeleton para gráficos */}
      <section className="dashboard__charts-section">
        <div className="dashboard__charts-grid">
          <div className="skeleton skeleton--chart"></div>
          <div className="skeleton skeleton--chart"></div>
        </div>
      </section>
    </div>
  );

  // ✅ COMPONENTE: Mini Sparkline (Novo)
  const MiniSparkline = ({ data, color = '#10b981', width = 60, height = 20 }) => {
    if (!data || data.length === 0) return null;

    const maxY = Math.max(...data.map(d => d.y));
    const minY = Math.min(...data.map(d => d.y));
    const range = maxY - minY || 1;

    const points = data.map((point, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((point.y - minY) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="mini-sparkline">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  // ✅ COMPONENTE: Seção de Insights (Nova)
  const InsightsSection = () => {
    if (insights.length === 0) return null;

    return (
      <section className="dashboard__insights-section">
        <div className="dashboard__insights-header">
          <div className="dashboard__insights-title-group">
            <Lightbulb size={20} className="dashboard__insights-icon" />
            <h3 className="dashboard__insights-title"> Insights Rápidos</h3>
          </div>
        </div>
        
        <div className="dashboard__insights-grid">
          {insights.map((insight, index) => (
            <div key={index} className={`dashboard__insight-card dashboard__insight-card--${insight.tipo}`}>
              <div className="dashboard__insight-icon">
                <insight.icone size={18} />
              </div>
              <div className="dashboard__insight-content">
                <h4 className="dashboard__insight-title">{insight.titulo}</h4>
                <p className="dashboard__insight-text">{insight.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // ✅ RENDERIZAÇÃO SEMPRE LINEAR - SEM IFS CONDICIONAIS PARA HOOKS
  
  // Loading state com skeleton
  if (authLoading || loading) {
    return <SkeletonLoading />;
  }

  // Error state
  if (!isAuthenticated) {
    return (
      <div className="dashboard">
        <div className="dashboard__error-state">
          <h3 className="dashboard__error-title">Acesso negado</h3>
          <p className="dashboard__error-message">Você precisa estar logado.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error-state">
          <h3 className="dashboard__error-title">❌ Erro ao carregar dados</h3>
          <p className="dashboard__error-message">{error}</p>
          <button className="dashboard__retry-button" onClick={refreshData}>
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ✅ RENDERIZAÇÃO PRINCIPAL
  return (
    <div className="dashboard">
      
      {/* Seletor de Período - Aprimorado */}
      <section className="dashboard__period-section">
        <div className="dashboard__period-wrapper">
          <div className="dashboard__period-controls">
            <button 
              className="dashboard__period-nav dashboard__period-nav--prev"
              onClick={() => handleNavigateMonth(-1)}
              type="button"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="dashboard__current-period">
              <Calendar size={18} className="dashboard__period-icon" />
              <span className="dashboard__period-text">
                {periodoFormatado}
              </span>
              {!isCurrentMonth() && (
                <button 
                  className="dashboard__today-btn" 
                  onClick={handleGoToToday}
                  type="button"
                  aria-label="Ir para o mês atual"
                >
                  Hoje
                </button>
              )}
            </div>

            <button 
              className="dashboard__period-nav dashboard__period-nav--next"
              onClick={() => handleNavigateMonth(1)}
              type="button"
              aria-label="Próximo mês"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Cards Section - Com sparklines */}
      <section className="dashboard__cards-section">
        <div className="dashboard__cards-grid">
          
          {/* Card de Saldo - Aprimorado */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--saldo ${flippedCards.saldo ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('saldo')}
            onKeyDown={(e) => handleCardKeyDown(e, 'saldo')}
            role="button"
            tabIndex={0}
            aria-label="Detalhes do saldo atual"
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-header">
                  <div className="dashboard__card-icon">
                    <Wallet size={24} />
                  </div>
                  <MiniSparkline 
                    data={gerarDadosSparkline('saldo')} 
                    color="rgba(255,255,255,0.7)" 
                  />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Saldo Atual</h3>
                  <p className="dashboard__card-value">{formatCurrency(dadosSegurosSaldo.atual)}</p>
                  <span className="dashboard__card-subtitle">
                    Previsto: {formatCurrency(dadosSegurosSaldo.previsto)}
                  </span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">💰 Detalhamento por Conta</h4>
                  <div className="dashboard__details-list">
                    {contasDetalhadas.length > 0 ? (
                      contasDetalhadas.map((conta, index) => (
                        <div key={index} className="dashboard__detail-item">
                          <span className="dashboard__detail-label">{conta.nome}</span>
                          <span className="dashboard__detail-value">{formatCurrency(conta.saldo)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="dashboard__detail-item">
                        <span className="dashboard__detail-label">Nenhuma conta</span>
                        <span className="dashboard__detail-value">R$ 0,00</span>
                      </div>
                    )}
                    <div className="dashboard__detail-item dashboard__detail-item--total">
                      <span className="dashboard__detail-label">🎯 Previsto</span>
                      <span className="dashboard__detail-value">{formatCurrency(dadosSegurosSaldo.previsto)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Receitas - Aprimorado */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--receitas ${flippedCards.receitas ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('receitas')}
            onKeyDown={(e) => handleCardKeyDown(e, 'receitas')}
            role="button"
            tabIndex={0}
            aria-label="Detalhes das receitas"
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-header">
                  <div className="dashboard__card-icon">
                    <TrendingUp size={24} />
                  </div>
                  <MiniSparkline 
                    data={gerarDadosSparkline('receitas')} 
                    color="rgba(255,255,255,0.7)" 
                  />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Receitas</h3>
                  <p className="dashboard__card-value">{formatCurrency(dadosSeguroReceitas.atual)}</p>
                  <span className="dashboard__card-subtitle">
                    Previsto: {formatCurrency(dadosSeguroReceitas.previsto)}
                  </span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">💚 Receitas Detalhadas</h4>
                  <div className="dashboard__details-list">
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">✅ Recebido</span>
                      <span className="dashboard__detail-value">{formatCurrency(dadosSeguroReceitas.atual)}</span>
                    </div>
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">📅 A receber</span>
                      <span className="dashboard__detail-value">
                        {formatCurrency(dadosSeguroReceitas.previsto - dadosSeguroReceitas.atual)}
                      </span>
                    </div>
                    {dadosSeguroReceitas.categorias && dadosSeguroReceitas.categorias.length > 0 && (
                      dadosSeguroReceitas.categorias.slice(0, 2).map((receita, index) => (
                        <div key={index} className="dashboard__detail-item">
                          <span className="dashboard__detail-label">{receita.nome}</span>
                          <span className="dashboard__detail-value">{formatCurrency(receita.valor)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Despesas - Aprimorado */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--despesas ${flippedCards.despesas ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('despesas')}
            onKeyDown={(e) => handleCardKeyDown(e, 'despesas')}
            role="button"
            tabIndex={0}
            aria-label="Detalhes das despesas"
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-header">
                  <div className="dashboard__card-icon">
                    <TrendingDown size={24} />
                  </div>
                  <MiniSparkline 
                    data={gerarDadosSparkline('despesas')} 
                    color="rgba(255,255,255,0.7)" 
                  />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Despesas</h3>
                  <p className="dashboard__card-value">{formatCurrency(dadosSegurosDespesas.atual)}</p>
                  <span className="dashboard__card-subtitle">
                    Previsto: {formatCurrency(dadosSegurosDespesas.previsto)}
                  </span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">💸 Despesas Detalhadas</h4>
                  <div className="dashboard__details-list">
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">💳 Já gastas</span>
                      <span className="dashboard__detail-value">{formatCurrency(dadosSegurosDespesas.atual)}</span>
                    </div>
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">📊 Restante</span>
                      <span className="dashboard__detail-value">
                        {formatCurrency(Math.max(0, dadosSegurosDespesas.previsto - dadosSegurosDespesas.atual))}
                      </span>
                    </div>
                    {dadosSegurosDespesas.categorias && dadosSegurosDespesas.categorias.length > 0 && (
                      dadosSegurosDespesas.categorias.slice(0, 2).map((despesa, index) => (
                        <div key={index} className="dashboard__detail-item">
                          <span className="dashboard__detail-label">{despesa.nome}</span>
                          <span className="dashboard__detail-value">{formatCurrency(despesa.valor)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Cartão - Aprimorado */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--cartao ${flippedCards.cartaoCredito ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('cartaoCredito')}
            onKeyDown={(e) => handleCardKeyDown(e, 'cartaoCredito')}
            role="button"
            tabIndex={0}
            aria-label="Detalhes dos cartões de crédito"
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-header">
                  <div className="dashboard__card-icon">
                    <CreditCard size={24} />
                  </div>
                  <div className="dashboard__card-usage">
                    <div className="usage-bar">
                      <div 
                        className="usage-fill" 
                        style={{ 
                          width: `${dadosSeguroCartao.limite > 0 ? (dadosSeguroCartao.atual / dadosSeguroCartao.limite) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Cartões</h3>
                  <p className="dashboard__card-value">{formatCurrency(dadosSeguroCartao.atual)}</p>
                  <span className="dashboard__card-subtitle">
                    Limite: {formatCurrency(dadosSeguroCartao.limite)}
                  </span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">💳 Cartões Detalhados</h4>
                  <div className="dashboard__details-list">
                    {cartoesDetalhados.length > 0 ? (
                      cartoesDetalhados.map((cartao, index) => (
                        <div key={index} className="dashboard__detail-item">
                          <span className="dashboard__detail-label">{cartao.nome}</span>
                          <span className="dashboard__detail-value">{formatCurrency(cartao.usado)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="dashboard__detail-item">
                        <span className="dashboard__detail-label">Nenhum cartão</span>
                        <span className="dashboard__detail-value">R$ 0,00</span>
                      </div>
                    )}
                    <div className="dashboard__detail-item dashboard__detail-item--total">
                      <span className="dashboard__detail-label">💰 Disponível</span>
                      <span className="dashboard__detail-value">
                        {formatCurrency(Math.max(0, dadosSeguroCartao.limite - dadosSeguroCartao.atual))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Insights - Nova */}
      <InsightsSection />


      {/* Gráficos - Aprimorados */}
      <section className="dashboard__charts-section">
        <div className="dashboard__charts-grid">
          
          <div className="dashboard__chart-card">
            <div className="dashboard__chart-header">
              <div className="dashboard__chart-title-section">
                <TrendingUp size={20} className="dashboard__chart-icon" />
                <h3 className="dashboard__chart-title">Receitas por categoria</h3>
              </div>
              <Link to="/relatorios/categorias?tipo=receitas" className="dashboard__chart-action dashboard__chart-action--receitas">
                Ver todas
                <ExternalLink size={14} />
              </Link>
            </div>
            
            <div className="dashboard__chart-container">
              {receitasPorCategoria.length > 0 ? (
                <DonutChartCategoria data={receitasPorCategoria} />
              ) : (
                <div className="dashboard__chart-empty">
                  <div className="chart-empty-icon">
                    <TrendingUp size={48} />
                  </div>
                  <h4 className="chart-empty-title">Ainda não há receitas</h4>
                  <p className="chart-empty-description">
                    Que tal começar registrando sua primeira receita?
                  </p>
                  <Link to="/transacoes/nova-receita" className="chart-empty-button">
                    <Plus size={16} />
                    Adicionar receita
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="dashboard__chart-card">
            <div className="dashboard__chart-header">
              <div className="dashboard__chart-title-section">
                <BarChart3 size={20} className="dashboard__chart-icon" />
                <h3 className="dashboard__chart-title">Despesas por categoria</h3>
              </div>
              <Link to="/relatorios/categorias?tipo=despesas" className="dashboard__chart-action dashboard__chart-action--despesas">
                Ver todas
                <ExternalLink size={14} />
              </Link>
            </div>
            
            <div className="dashboard__chart-container">
              {despesasPorCategoria.length > 0 ? (
                <DonutChartCategoria data={despesasPorCategoria} />
              ) : (
                <div className="dashboard__chart-empty">
                  <div className="chart-empty-icon">
                    <BarChart3 size={48} />
                  </div>
                  <h4 className="chart-empty-title">Nenhuma despesa registrada</h4>
                  <p className="chart-empty-description">
                    Registre suas despesas para acompanhar onde seu dinheiro vai
                  </p>
                  <Link to="/transacoes/nova-despesa" className="chart-empty-button">
                    <Plus size={16} />
                    Adicionar despesa
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Calendário - Aprimorado */}
      <section className="dashboard__calendar-section">
        <div className="dashboard__section-header">
          <div className="dashboard__section-title-group">
            <Calendar size={24} className="dashboard__section-icon" />
            <div className="dashboard__section-text">
              <h3 className="dashboard__section-title">📅 Calendário Financeiro</h3>
              <p className="dashboard__section-subtitle">
                Acompanhe suas movimentações diárias em {getCurrentMonth()}
              </p>
            </div>
          </div>
          
          {/* Legenda do calendário */}
          <div className="dashboard__calendar-legend">
            <div className="legend-item legend-item--receita">
              <div className="legend-color"></div>
              <span>Receitas</span>
            </div>
            <div className="legend-item legend-item--despesa">
              <div className="legend-color"></div>
              <span>Despesas</span>
            </div>
            <div className="legend-item legend-item--misto">
              <div className="legend-color"></div>
              <span>Ambos</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard__section-content">
          <CalendarioFinanceiro 
            mes={currentDate.getMonth()} 
            ano={currentDate.getFullYear()} 
            onDiaClick={handleDiaClick}
          />
        </div>
      </section>

      {/* Projeção - Aprimorada */}
      <section className="dashboard__projection-section">
        <div className="dashboard__section-header">
          <div className="dashboard__section-title-group">
            <TrendingUp size={24} className="dashboard__section-icon" />
            <div className="dashboard__section-text">
              <h3 className="dashboard__section-title">🚀 Projeção de Saldo</h3>
              <p className="dashboard__section-subtitle">
                Visualize como seu dinheiro pode evoluir nos próximos meses
              </p>
            </div>
          </div>
          
          {/* Controles da projeção */}
          <div className="dashboard__projection-controls">
            <div className="projection-info">
              <span className="projection-current">
                Saldo atual: <strong>{formatCurrency(dadosSegurosSaldo.atual)}</strong>
              </span>
            </div>
          </div>
        </div>
        
        <div className="dashboard__section-content">
          <ProjecaoSaldoGraph 
            data={data?.historico || []} 
            mesAtual={currentDate.getMonth()}
            anoAtual={currentDate.getFullYear()}
            saldoAtual={dadosSegurosSaldo.atual}
          />
        </div>
      </section>
      
      {/* Modal */}
      <DetalhesDoDiaModal
        isOpen={showModal}
        onClose={handleCloseModal}
        dia={diaDetalhes}
      />
    </div>
  );
};

export default Dashboard;