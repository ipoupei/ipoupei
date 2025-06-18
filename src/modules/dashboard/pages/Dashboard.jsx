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

// CSS modularizado
import '../styles/Dashboard.css';

/**
 * Dashboard - Versão ULTRA SIMPLIFICADA para evitar violação de Rules of Hooks
 * ✅ Hooks sempre na mesma ordem
 * ✅ Sem renderização condicional de hooks
 * ✅ Estrutura linear e previsível
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

  // ✅ EXTRAIR DADOS SEGUROS - SEMPRE NO MESMO LOCAL
  const dadosSegurosSaldo = data?.saldo || { atual: 0, previsto: 0 };
  const dadosSegurosDespesas = data?.despesas || { atual: 0, previsto: 0, categorias: [] };
  const dadosSeguroReceitas = data?.receitas || { atual: 0, previsto: 0, categorias: [] };
  const dadosSeguroCartao = data?.cartaoCredito || { atual: 0, limite: 0 };
  const contasDetalhadas = data?.contasDetalhadas || [];
  const cartoesDetalhados = data?.cartoesDetalhados || [];
  const receitasPorCategoria = data?.receitasPorCategoria || [];
  const despesasPorCategoria = data?.despesasPorCategoria || [];

  // ✅ RENDERIZAÇÃO SEMPRE LINEAR - SEM IFS CONDICIONAIS PARA HOOKS
  
  // Loading state
  if (authLoading || loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading-state">
          <div className="dashboard__loading-spinner"></div>
          <p className="dashboard__loading-text">Carregando dados...</p>
        </div>
      </div>
    );
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
      
      {/* Seletor de Período */}
      <section className="dashboard__period-section">
        <div className="dashboard__period-wrapper">
          <div className="dashboard__period-controls">
            <button 
              className="dashboard__period-nav dashboard__period-nav--prev"
              onClick={() => handleNavigateMonth(-1)}
              type="button"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="dashboard__current-period">
              <Calendar size={18} className="dashboard__period-icon" />
              <span className="dashboard__period-text">
                {getFormattedPeriod()}
              </span>
              {!isCurrentMonth() && (
                <button 
                  className="dashboard__today-btn" 
                  onClick={handleGoToToday}
                  type="button"
                >
                  Hoje
                </button>
              )}
            </div>

            <button 
              className="dashboard__period-nav dashboard__period-nav--next"
              onClick={() => handleNavigateMonth(1)}
              type="button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="dashboard__cards-section">
        <div className="dashboard__cards-grid">
          
          {/* Card de Saldo */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--saldo ${flippedCards.saldo ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('saldo')}
            onKeyDown={(e) => handleCardKeyDown(e, 'saldo')}
            role="button"
            tabIndex={0}
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-icon">
                  <Wallet size={24} />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Saldo Atual</h3>
                  <p className="dashboard__card-value">{formatCurrency(dadosSegurosSaldo.atual)}</p>
                  <span className="dashboard__card-subtitle">Todas as contas</span>
                </div>
              </div>
              
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
                      <span className="dashboard__detail-value">{formatCurrency(dadosSegurosSaldo.previsto)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Receitas */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--receitas ${flippedCards.receitas ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('receitas')}
            onKeyDown={(e) => handleCardKeyDown(e, 'receitas')}
            role="button"
            tabIndex={0}
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Receitas</h3>
                  <p className="dashboard__card-value">{formatCurrency(dadosSeguroReceitas.atual)}</p>
                  <span className="dashboard__card-subtitle">{getFormattedPeriod()}</span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">Receitas</h4>
                  <div className="dashboard__details-list">
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">✅ Atual</span>
                      <span className="dashboard__detail-value">{formatCurrency(dadosSeguroReceitas.atual)}</span>
                    </div>
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">📅 Previsto</span>
                      <span className="dashboard__detail-value">{formatCurrency(dadosSeguroReceitas.previsto)}</span>
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

          {/* Card de Despesas */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--despesas ${flippedCards.despesas ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('despesas')}
            onKeyDown={(e) => handleCardKeyDown(e, 'despesas')}
            role="button"
            tabIndex={0}
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-icon">
                  <TrendingDown size={24} />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Despesas</h3>
                  <p className="dashboard__card-value">{formatCurrency(dadosSegurosDespesas.atual)}</p>
                  <span className="dashboard__card-subtitle">{getFormattedPeriod()}</span>
                </div>
              </div>
              
              <div className="dashboard__card-face dashboard__card-face--back">
                <div className="dashboard__card-details">
                  <h4 className="dashboard__details-title">Despesas</h4>
                  <div className="dashboard__details-list">
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">💸 Atual</span>
                      <span className="dashboard__detail-value">{formatCurrency(dadosSegurosDespesas.atual)}</span>
                    </div>
                    <div className="dashboard__detail-item">
                      <span className="dashboard__detail-label">📅 Previsto</span>
                      <span className="dashboard__detail-value">{formatCurrency(dadosSegurosDespesas.previsto)}</span>
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

          {/* Card de Cartão */}
          <div 
            className={`dashboard__summary-card dashboard__summary-card--cartao ${flippedCards.cartaoCredito ? 'dashboard__summary-card--flipped' : ''}`}
            onClick={() => handleCardFlip('cartaoCredito')}
            onKeyDown={(e) => handleCardKeyDown(e, 'cartaoCredito')}
            role="button"
            tabIndex={0}
          >
            <div className="dashboard__card-inner">
              <div className="dashboard__card-face dashboard__card-face--front">
                <div className="dashboard__card-icon">
                  <CreditCard size={24} />
                </div>
                <div className="dashboard__card-content">
                  <h3 className="dashboard__card-title">Cartões</h3>
                  <p className="dashboard__card-value">{formatCurrency(dadosSeguroCartao.atual)}</p>
                  <span className="dashboard__card-subtitle">Usado de {formatCurrency(dadosSeguroCartao.limite)}</span>
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
                      <span className="dashboard__detail-value">{formatCurrency(dadosSeguroCartao.limite - dadosSeguroCartao.atual)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Acesso Rápido */}
      <section className="dashboard__quick-access-section">
        <Link to="/transacoes" className="dashboard__quick-access-card">
          <div className="dashboard__quick-access-icon">
            <Eye size={24} />
          </div>
          <div className="dashboard__quick-access-content">
            <h3 className="dashboard__quick-access-title">👀 Ver Todas as Transações</h3>
            <p className="dashboard__quick-access-description">
              Visualize, filtre e gerencie todas as suas movimentações financeiras
            </p>
          </div>
          <div className="dashboard__quick-access-arrow">
            <ArrowRight size={20} />
          </div>
        </Link>
      </section>
      
      {/* Gráficos */}
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
              <DonutChartCategoria 
                data={receitasPorCategoria.length > 0 ? receitasPorCategoria : [
                  { nome: "Sem receitas", valor: 0, color: "#E5E7EB" }
                ]} 
              />
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
              <DonutChartCategoria 
                data={despesasPorCategoria.length > 0 ? despesasPorCategoria : [
                  { nome: "Sem despesas", valor: 0, color: "#E5E7EB" }
                ]} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Calendário */}
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
        </div>
        
        <div className="dashboard__section-content">
          <CalendarioFinanceiro 
            mes={currentDate.getMonth()} 
            ano={currentDate.getFullYear()} 
            onDiaClick={handleDiaClick}
          />
        </div>
      </section>

      {/* Projeção */}
      <section className="dashboard__projection-section">
        <div className="dashboard__section-header">
          <div className="dashboard__section-title-group">
            <TrendingUp size={24} className="dashboard__section-icon" />
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