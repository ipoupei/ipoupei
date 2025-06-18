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
  ExternalLink
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

// ✅ CSS modularizado com Design Tokens
import '../styles/Dashboard.css';

/**
 * Dashboard - Versão Polida com Design Tokens e Acessibilidade
 * ✅ Design Tokens aplicados
 * ✅ Nomenclatura modular (dashboard__)
 * ✅ Acessibilidade completa
 * ✅ Microinterações CSS
 * ✅ Responsividade via media queries
 * ✅ Estados visuais (hover, focus, active)
 */
const Dashboard = () => {
  const navigate = useNavigate();
  
  // Hooks de autenticação e dados
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading, error, refreshData } = useDashboardData();
  
  // Hook de período para controle global
  const { 
    currentDate,
    navigateMonth, 
    goToToday, 
    isCurrentMonth,
    getFormattedPeriod,
    getCurrentMonth
  } = usePeriodo();
  
  // Estados locais para UI
  const [diaDetalhes, setDiaDetalhes] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [flippedCards, setFlippedCards] = useState({
    saldo: false,
    receitas: false,
    despesas: false,
    cartaoCredito: false
  });

  // Log para debug - mostrar quando período muda
  useEffect(() => {
    console.log('📅 Dashboard - período atualizado:', {
      data: currentDate,
      mesFormatado: getFormattedPeriod(),
      isCurrentMonth: isCurrentMonth()
    });
  }, [currentDate, getFormattedPeriod, isCurrentMonth]);

  // Handlers para controle de período
  const handleNavigateMonth = (direction) => {
    console.log(`📅 Navegando ${direction > 0 ? 'próximo' : 'anterior'} mês`);
    navigateMonth(direction);
  };

  const handleGoToToday = () => {
    console.log('📅 Voltando para hoje');
    goToToday();
  };

  // Handler para flip dos cards com acessibilidade
  const handleCardFlip = (cardName) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  // Handler para eventos de teclado nos cards
  const handleCardKeyDown = (event, cardName) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardFlip(cardName);
    }
  };

  // Handler para clique no dia do calendário
  const handleDiaClick = (dia) => {
    console.log('📅 Clicou no dia:', dia);
    setDiaDetalhes(dia);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDiaDetalhes(null);
  };

  // Estados de carregamento e erro
  if (authLoading) {
    return (
      <div className="dashboard" role="main" aria-label="Dashboard do iPoupei">
        <div className="dashboard__loading-state" role="status" aria-live="polite">
          <div className="dashboard__loading-spinner" aria-hidden="true"></div>
          <p className="dashboard__loading-text">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="dashboard" role="main" aria-label="Dashboard do iPoupei">
        <div className="dashboard__error-state" role="alert">
          <h3 className="dashboard__error-title">Acesso negado</h3>
          <p className="dashboard__error-message">Você precisa estar logado para ver o dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard" role="main" aria-label="Dashboard do iPoupei">
        <div className="dashboard__loading-state" role="status" aria-live="polite">
          <div className="dashboard__loading-spinner" aria-hidden="true"></div>
          <p className="dashboard__loading-text">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard" role="main" aria-label="Dashboard do iPoupei">
        <div className="dashboard__error-state" role="alert">
          <h3 className="dashboard__error-title">❌ Erro ao carregar dados</h3>
          <p className="dashboard__error-message">{error}</p>
          <button 
            className="dashboard__retry-button" 
            onClick={() => refreshData()}
            aria-label="Tentar carregar dados novamente"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Extrair dados seguros
  const saldoAtual = data?.saldo?.atual || 0;
  const saldoPrevisto = data?.saldo?.previsto || 0;
  const receitasEfetivadas = data?.receitas?.efetivadas || 0;
  const receitasTotais = data?.receitas?.totais || 0;
  const despesasEfetivadas = data?.despesas?.efetivadas || 0;
  const despesasTotais = data?.despesas?.totais || 0;
  const cartaoUsado = data?.cartoes?.usado || 0;
  const cartaoLimite = data?.cartoes?.limite || 0;
  const contasDetalhadas = data?.contasDetalhadas || [];
  const cartoesDetalhados = data?.cartoesDetalhados || [];
  const receitasPorCategoria = data?.receitasPorCategoria || [];
  const despesasPorCategoria = data?.despesasPorCategoria || [];

  return (
    <div className="dashboard" role="main" aria-label="Dashboard do iPoupei">
      
      {/* ✅ Seletor de Período com Acessibilidade */}
      <section className="dashboard__period-section" aria-label="Controle de período">
        <div className="dashboard__period-wrapper">
          <div className="dashboard__period-controls">
            <button 
              className="dashboard__period-nav dashboard__period-nav--prev"
              onClick={() => handleNavigateMonth(-1)}
              aria-label="Ir para o mês anterior"
              type="button"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>

            <div className="dashboard__current-period" role="status" aria-live="polite">
              <Calendar size={18} className="dashboard__period-icon" aria-hidden="true" />
              <span className="dashboard__period-text">
                {getFormattedPeriod()}
              </span>
              {!isCurrentMonth() && (
                <button 
                  className="dashboard__today-btn" 
                  onClick={handleGoToToday}
                  aria-label="Voltar para o mês atual"
                  type="button"
                >
                  Hoje
                </button>
              )}
            </div>

            <button 
              className="dashboard__period-nav dashboard__period-nav--next"
              onClick={() => handleNavigateMonth(1)}
              aria-label="Ir para o próximo mês"
              type="button"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* ✅ Cards Section com Grid Responsivo */}
      <section className="dashboard__cards-section" aria-label="Resumo financeiro">
        <div className="dashboard__cards-grid">
          
          {/* Card de Saldo - Verde */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--saldo ${flippedCards.saldo ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('saldo')}
            onKeyDown={(e) => handleCardKeyDown(e, 'saldo')}
            role="button"
            tabIndex={0}
            aria-label={`Saldo atual: ${formatCurrency(saldoAtual)}. Clique para ver detalhes.`}
            aria-pressed={flippedCards.saldo}
          >
            <div className="dashboard__card-inner">
              {/* Face da frente - colorida */}
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-icon" aria-hidden="true">
                  <Wallet size={24} />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Saldo Atual</h3>
                  <p className="dashboard__card-value">{formatCurrency(saldoAtual)}</p>
                  <span className="dashboard__card-subtitle">Todas as contas</span>
                </div>
              </div>
              
              {/* Face de trás - branca com detalhes */}
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">Detalhamento</h4>
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
                      <span className="dashboard__detail-label">💰 Previsto</span>
                      <span className="dashboard__detail-value">{formatCurrency(saldoPrevisto)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Receitas - Azul */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--receitas ${flippedCards.receitas ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('receitas')}
            onKeyDown={(e) => handleCardKeyDown(e, 'receitas')}
            role="button"
            tabIndex={0}
            aria-label={`Receitas: ${formatCurrency(receitasEfetivadas)}. Clique para ver detalhes.`}
            aria-pressed={flippedCards.receitas}
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-icon" aria-hidden="true">
                  <TrendingUp size={24} />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Receitas</h3>
                  <p className="dashboard__card-value">{formatCurrency(receitasEfetivadas)}</p>
                  <span className="dashboard__card-subtitle">{getFormattedPeriod()}</span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">Receitas</h4>
                  <div className="dashboard__details-list">
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">✅ Efetivadas</span>
                      <span className="dashboard__detail-value">{formatCurrency(receitasEfetivadas)}</span>
                    </div>
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">📅 Previstas</span>
                      <span className="dashboard__detail-value">{formatCurrency(receitasTotais - receitasEfetivadas)}</span>
                    </div>
                    <div className="dashboard__detail-item dashboard__detail-item--total">
                      <span className="dashboard__detail-label">💰 Total</span>
                      <span className="dashboard__detail-value">{formatCurrency(receitasTotais)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Despesas - Vermelho */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--despesas ${flippedCards.despesas ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('despesas')}
            onKeyDown={(e) => handleCardKeyDown(e, 'despesas')}
            role="button"
            tabIndex={0}
            aria-label={`Despesas: ${formatCurrency(despesasEfetivadas)}. Clique para ver detalhes.`}
            aria-pressed={flippedCards.despesas}
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-icon" aria-hidden="true">
                  <TrendingDown size={24} />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Despesas</h3>
                  <p className="dashboard__card-value">{formatCurrency(despesasEfetivadas)}</p>
                  <span className="dashboard__card-subtitle">{getFormattedPeriod()}</span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">Despesas</h4>
                  <div className="dashboard__details-list">
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">💸 Efetivadas</span>
                      <span className="dashboard__detail-value">{formatCurrency(despesasEfetivadas)}</span>
                    </div>
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">📅 Previstas</span>
                      <span className="dashboard__detail-value">{formatCurrency(despesasTotais - despesasEfetivadas)}</span>
                    </div>
                    <div className="dashboard__detail-item dashboard__detail-item--total">
                      <span className="dashboard__detail-label">💰 Total</span>
                      <span className="dashboard__detail-value">{formatCurrency(despesasTotais)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Cartão de Crédito - Roxo */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--cartao ${flippedCards.cartaoCredito ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('cartaoCredito')}
            onKeyDown={(e) => handleCardKeyDown(e, 'cartaoCredito')}
            role="button"
            tabIndex={0}
            aria-label={`Cartões: ${formatCurrency(cartaoUsado)} usado de ${formatCurrency(cartaoLimite)}. Clique para ver detalhes.`}
            aria-pressed={flippedCards.cartaoCredito}
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-icon" aria-hidden="true">
                  <CreditCard size={24} />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Cartões</h3>
                  <p className="dashboard__card-value">{formatCurrency(cartaoUsado)}</p>
                  <span className="dashboard__card-subtitle">Usado de {formatCurrency(cartaoLimite)}</span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">Cartões</h4>
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
                      <span className="dashboard__detail-value">{formatCurrency(cartaoLimite - cartaoUsado)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Acesso Rápido às Transações */}
      <section className="dashboard__quick-access-section" aria-label="Acesso rápido">
        <Link 
          to="/transacoes" 
          className="dashboard__quick-access-card"
          aria-label="Ver todas as transações financeiras"
        >
          <div className="dashboard__quick-access-icon" aria-hidden="true">
            <Eye size={24} />
          </div>
          <div className="dashboard__quick-access-content">
            <h3 className="dashboard__quick-access-title">👀 Ver Todas as Transações</h3>
            <p className="dashboard__quick-access-description">
              Visualize, filtre e gerencie todas as suas movimentações financeiras
            </p>
          </div>
          <div className="dashboard__quick-access-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </div>
        </Link>
      </section>
      
      {/* ✅ Seção de Gráficos */}
      <section className="dashboard__charts-section" aria-label="Gráficos financeiros">
        <div className="dashboard__charts-grid">
          
          {/* Gráfico de Receitas */}
          <div className="dashboard__chart-card">
            <div className="dashboard__chart-header">
              <div className="dashboard__chart-title-section">
                <TrendingUp size={20} className="dashboard__chart-icon" aria-hidden="true" />
                <h3 className="dashboard__chart-title">Receitas por categoria</h3>
              </div>
              <Link 
                to="/relatorios/categorias?tipo=receitas" 
                className="dashboard__chart-action dashboard__chart-action--receitas"
                aria-label="Ver relatório completo de receitas por categoria"
              >
                Ver todas
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            </div>
            
            <div className="dashboard__chart-container" role="img" aria-label="Gráfico de receitas por categoria">
              <DonutChartCategoria 
                data={receitasPorCategoria.length > 0 ? receitasPorCategoria : [
                  { nome: "Sem receitas", valor: 0, color: "#E5E7EB" }
                ]} 
              />
            </div>
          </div>
          
          {/* Gráfico de Despesas */}
          <div className="dashboard__chart-card">
            <div className="dashboard__chart-header">
              <div className="dashboard__chart-title-section">
                <BarChart3 size={20} className="dashboard__chart-icon" aria-hidden="true" />
                <h3 className="dashboard__chart-title">Despesas por categoria</h3>
              </div>
              <Link 
                to="/relatorios/categorias?tipo=despesas" 
                className="dashboard__chart-action dashboard__chart-action--despesas"
                aria-label="Ver relatório completo de despesas por categoria"
              >
                Ver todas
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            </div>
            
            <div className="dashboard__chart-container" role="img" aria-label="Gráfico de despesas por categoria">
              <DonutChartCategoria 
                data={despesasPorCategoria.length > 0 ? despesasPorCategoria : [
                  { nome: "Sem despesas", valor: 0, color: "#E5E7EB" }
                ]} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Calendário Financeiro */}
      <section className="dashboard__calendar-section" aria-label="Calendário financeiro">
        <div className="dashboard__section-header">
          <div className="dashboard__section-title-group">
            <Calendar size={24} className="dashboard__section-icon" aria-hidden="true" />
            <div className="dashboard__section-text">
              <h3 className="dashboard__section-title">📅 Calendário Financeiro</h3>
              <p className="dashboard__section-subtitle">
                Acompanhe suas movimentações diárias em {getCurrentMonth()}
              </p>
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

      {/* ✅ Projeção de Saldo */}
      <section className="dashboard__projection-section" aria-label="Projeção de saldo">
        <div className="dashboard__section-header">
          <div className="dashboard__section-title-group">
            <TrendingUp size={24} className="dashboard__section-icon" aria-hidden="true" />
            <div className="dashboard__section-text">
              <h3 className="dashboard__section-title">🚀 Projeção de Saldo</h3>
              <p className="dashboard__section-subtitle">Visualize como seu dinheiro pode evoluir</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard__section-content">
          <ProjecaoSaldoGraph 
            data={data?.historico || []} 
            mesAtual={currentDate.getMonth()}
            anoAtual={currentDate.getFullYear()}
          />
        </div>
      </section>
      
      {/* Modal de Detalhes do Dia */}
      <DetalhesDoDiaModal
        isOpen={showModal}
        onClose={handleCloseModal}
        dia={diaDetalhes}
        aria-label="Detalhes das transações do dia selecionado"
      />
    </div>
  );
};

export default Dashboard;