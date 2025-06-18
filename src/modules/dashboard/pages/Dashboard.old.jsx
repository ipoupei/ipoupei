import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  BarChart3,
  Eye,
  ChevronRight as ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hooks personalizados existentes
import useAuth from "@modules/auth/hooks/useAuth";
import useDashboardData from '@modules/dashboard/hooks/useDashboardData';
import usePeriodo from '@modules/transacoes/hooks/usePeriodo';

// Utilitários
import { formatCurrency } from '@utils/formatCurrency';
import { getCurrentMonthName } from '@utils/getCurrentMonthName';

// Componentes existentes
import DonutChartCategoria from '@modules/relatorios/components/DonutChartCategoria';
import CalendarioFinanceiro from '@modules/dashboard/components/CalendarioFinanceiro';
import ProjecaoSaldoGraph from '@modules/dashboard/components/ProjecaoSaldoGraph';
import DetalhesDoDiaModal from '@modules/dashboard/components/DetalhesDoDiaModal';

// ✅ NOVO SISTEMA CSS - Imports corretos
import '@shared/styles/foundation.css';
import '@shared/styles/components.css';
import '@shared/styles/layouts.css';

/**
 * Dashboard - Migrado para o Novo Sistema CSS
 * ✅ Remove Tailwind completamente
 * ✅ Usa apenas classes do novo sistema CSS
 * ✅ Mantém funcionalidade com controle de período via usePeriodo
 * ✅ Cards flip premium com estrutura HTML correta
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
  const [refreshingCalendar, setRefreshingCalendar] = useState(false);
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
      periodo: `${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
    });
  }, [currentDate, getFormattedPeriod]);
  
  // Handler para virar um card
  const handleCardFlip = (cardType) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardType]: !prev[cardType]
    }));
  };

  // Handler para quando um dia é clicado no calendário
  const handleDiaClick = (dia) => {
    if (dia && dia.movimentos && dia.movimentos.length > 0) {
      setDiaDetalhes(dia);
      setShowModal(true);
    }
  };

  // Handler para fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setDiaDetalhes(null);
  };

  // Handler para atualizar calendário
  const handleRefreshCalendario = async () => {
    if (refreshingCalendar) return;
    
    try {
      setRefreshingCalendar(true);
      refreshData();
    } catch (err) {
      console.error('Erro ao atualizar calendário:', err);
    } finally {
      setTimeout(() => setRefreshingCalendar(false), 1000);
    }
  };

  // Handlers de navegação de período
  const handleNavigateMonth = (direction) => {
    console.log('📅 Navegando mês:', direction > 0 ? 'próximo' : 'anterior');
    navigateMonth(direction);
  };

  const handleGoToToday = () => {
    console.log('📅 Voltando para o mês atual');
    goToToday();
  };

  // Se não estiver autenticado, redireciona
  if (!isAuthenticated && !authLoading) {
    navigate('/login');
    return null;
  }

  // Dados seguros para evitar erros
  const dadosSegurosSaldo = data?.saldo || { atual: 0, previsto: 0 };
  const dadosSegurosDespesas = data?.despesas || { atual: 0, previsto: 0, categorias: [] };
  const dadosSeguroReceitas = data?.receitas || { atual: 0, previsto: 0, categorias: [] };
  const dadosSeguroCartao = data?.cartaoCredito || { atual: 0, limite: 0 };
  const contasDetalhadas = data?.contasDetalhadas || [];
  const cartoesDetalhados = data?.cartoesDetalhados || [];
  const receitasPorCategoria = data?.receitasPorCategoria || [];
  const despesasPorCategoria = data?.despesasPorCategoria || [];

  if (loading || authLoading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="empty-state">
          <h3 className="section-title">❌ Erro ao carregar dados</h3>
          <p className="calendar-subtitle">{error}</p>
          <button className="btn-primary" onClick={() => refreshData()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* ✅ Seletor de Período - Nova estrutura CSS */}
      <section className="dashboard-period-selector">
        <div className="period-selector-container">
          <div className="period-selector-inline">
            <button 
              className="period-nav"
              onClick={() => handleNavigateMonth(-1)}
              title="Mês anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="current-period-inline">
              <Calendar size={18} />
              <span className="period-text">
                {getFormattedPeriod()}
              </span>
              {!isCurrentMonth() && (
                <button 
                  className="today-button" 
                  onClick={handleGoToToday}
                >
                  Hoje
                </button>
              )}
            </div>

            <button 
              className="period-nav"
              onClick={() => handleNavigateMonth(1)}
              title="Próximo mês"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ✅ Cards Grid Premium com Flip - Nova estrutura */}
      <div className="cards-grid">
        
        {/* Card de Saldo - Verde */}
        <div 
          className={`summary-card card-green ${flippedCards.saldo ? 'flipped' : ''}`}
          onClick={() => handleCardFlip('saldo')}
        >
          <div className="card-inner">
            <div className="card-front">
              <div className="card-header">
                <div className="card-title">
                  💰 Saldo
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Atual</div>
                <div className="card-value">
                  {formatCurrency(dadosSegurosSaldo.atual)}
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Previsto</div>
                <div className="card-value-sm">
                  {formatCurrency(dadosSegurosSaldo.previsto)}
                </div>
              </div>
            </div>
            
            <div className="card-back">
              <div className="card-detail-total">
                <span>💳 Saldo Total:</span>
                <span>{formatCurrency(dadosSegurosSaldo.atual)}</span>
              </div>
              
              <div className="card-details">
                {contasDetalhadas.length > 0 ? (
                  contasDetalhadas.map((conta, index) => (
                    <div 
                      key={index} 
                      className="detail-item" 
                      style={{animationDelay: `${(index + 1) * 0.1}s`}}
                    >
                      <span className="detail-name">{conta.nome}</span>
                      <span className="detail-value">{formatCurrency(conta.saldo)}</span>
                    </div>
                  ))
                ) : (
                  <div className="detail-item" style={{animationDelay: '0.1s'}}>
                    <span className="detail-name">Nenhuma conta cadastrada</span>
                    <span className="detail-value">R$ 0,00</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Card de Receitas - Azul */}
        <div 
          className={`summary-card card-blue ${flippedCards.receitas ? 'flipped' : ''}`}
          onClick={() => handleCardFlip('receitas')}
        >
          <div className="card-inner">
            <div className="card-front">
              <div className="card-header">
                <div className="card-title">
                  📈 Receitas
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Atual</div>
                <div className="card-value font-tabular">
                  {formatCurrency(dadosSeguroReceitas.atual)}
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Previsto</div>
                <div className="card-value-sm font-tabular">
                  {formatCurrency(dadosSeguroReceitas.previsto)}
                </div>
              </div>
            </div>
            
            <div className="card-back">
              <div className="card-detail-total">
                <span>💵 Total Receitas:</span>
                <span className="font-tabular">{formatCurrency(dadosSeguroReceitas.atual)}</span>
              </div>
              
              <div className="card-details">
                {dadosSeguroReceitas.categorias.length > 0 ? (
                  dadosSeguroReceitas.categorias.slice(0, 5).map((receita, index) => (
                    <div 
                      key={index} 
                      className="detail-item" 
                      style={{animationDelay: `${(index + 1) * 0.1}s`}}
                    >
                      <span className="detail-name">{receita.nome}</span>
                      <span className="detail-value font-tabular">{formatCurrency(receita.valor)}</span>
                    </div>
                  ))
                ) : (
                  <div className="detail-item" style={{animationDelay: '0.1s'}}>
                    <span className="detail-name">Nenhuma receita registrada</span>
                    <span className="detail-value font-tabular">R$ 0,00</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Card de Despesas - Laranja */}
        <div 
          className={`summary-card card-amber ${flippedCards.despesas ? 'flipped' : ''}`}
          onClick={() => handleCardFlip('despesas')}
        >
          <div className="card-inner">
            <div className="card-front">
              <div className="card-header">
                <div className="card-title">
                  📉 Despesas
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Atual</div>
                <div className="card-value font-tabular">
                  {formatCurrency(dadosSegurosDespesas.atual)}
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Previsto</div>
                <div className="card-value-sm font-tabular">
                  {formatCurrency(dadosSegurosDespesas.previsto)}
                </div>
              </div>
            </div>
            
            <div className="card-back">
              <div className="card-detail-total">
                <span>💸 Total Despesas:</span>
                <span className="font-tabular">{formatCurrency(dadosSegurosDespesas.atual)}</span>
              </div>
              
              <div className="card-details">
                {dadosSegurosDespesas.categorias.length > 0 ? (
                  dadosSegurosDespesas.categorias.slice(0, 5).map((despesa, index) => (
                    <div 
                      key={index} 
                      className="detail-item" 
                      style={{animationDelay: `${(index + 1) * 0.1}s`}}
                    >
                      <span className="detail-name">{despesa.nome}</span>
                      <span className="detail-value font-tabular">{formatCurrency(despesa.valor)}</span>
                    </div>
                  ))
                ) : (
                  <div className="detail-item" style={{animationDelay: '0.1s'}}>
                    <span className="detail-name">Nenhuma despesa registrada</span>
                    <span className="detail-value font-tabular">R$ 0,00</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Card de Cartão de Crédito - Roxo */}
        <div 
          className={`summary-card card-purple ${flippedCards.cartaoCredito ? 'flipped' : ''}`}
          onClick={() => handleCardFlip('cartaoCredito')}
        >
          <div className="card-inner">
            <div className="card-front">
              <div className="card-header">
                <div className="card-title">
                  💳 Cartão
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Usado</div>
                <div className="card-value font-tabular">
                  {formatCurrency(dadosSeguroCartao.atual)}
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Limite Total</div>
                <div className="card-value-sm font-tabular">
                  {formatCurrency(dadosSeguroCartao.limite)}
                </div>
              </div>
            </div>
            
            <div className="card-back">
              <div className="card-detail-total">
                <span>🔢 Limite Usado:</span>
                <span className="font-tabular">{formatCurrency(dadosSeguroCartao.atual)}</span>
              </div>
              
              <div className="card-details">
                {cartoesDetalhados.length > 0 ? (
                  cartoesDetalhados.map((cartao, index) => (
                    <div 
                      key={index} 
                      className="detail-item" 
                      style={{animationDelay: `${(index + 1) * 0.1}s`}}
                    >
                      <span className="detail-name">{cartao.nome}</span>
                      <span className="detail-value font-tabular">{formatCurrency(cartao.usado)}</span>
                    </div>
                  ))
                ) : (
                  <div className="detail-item" style={{animationDelay: '0.1s'}}>
                    <span className="detail-name">Nenhum cartão cadastrado</span>
                    <span className="detail-value font-tabular">R$ 0,00</span>
                  </div>
                )}
                <div className="detail-item" style={{animationDelay: '0.2s'}}>
                  <span className="detail-name">💰 Disponível</span>
                  <span className="detail-value font-tabular">
                    {formatCurrency(dadosSeguroCartao.limite - dadosSeguroCartao.atual)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Link rápido para transações - Estrutura correta */}
      <div className="quick-access-section">
        <div className="quick-access-card" onClick={() => navigate('/transacoes')}>
          <div className="quick-access-icon">
            <Eye size={24} />
          </div>
          <div className="quick-access-content">
            <h3 className="quick-access-title">👀 Ver Todas as Transações</h3>
            <p className="quick-access-description">
              Visualize, filtre e gerencie todas as suas movimentações financeiras
            </p>
          </div>
          <div className="quick-access-arrow">
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
      
      {/* ✅ Seção de gráficos - Nova estrutura */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-section">
              <TrendingUp size={20} className="chart-icon" />
              <h3 className="chart-title">Receitas por categoria</h3>
            </div>
          </div>
          
          <div className="chart-container">
            <DonutChartCategoria 
              data={receitasPorCategoria.length > 0 ? receitasPorCategoria : [
                { nome: "Sem receitas", valor: 0, color: "#E5E7EB" }
              ]} 
            />
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-section">
              <BarChart3 size={20} className="chart-icon" />
              <h3 className="chart-title">Despesas por categoria</h3>
            </div>
          </div>
          
          <div className="chart-container">
            <DonutChartCategoria 
              data={despesasPorCategoria.length > 0 ? despesasPorCategoria : [
                { nome: "Sem despesas", valor: 0, color: "#E5E7EB" }
              ]} 
            />
          </div>
        </div>
      </div>

      {/* ✅ Calendário Financeiro - Estrutura correta com header próprio */}
      <div className="calendar-section">
        <div className="calendar-header">
          <div className="calendar-title-section">
            <Calendar size={24} className="section-icon" />
            <div>
              <h3 className="section-title">📅 Calendário Financeiro</h3>
              <p className="calendar-subtitle">
                Acompanhe suas movimentações diárias em {getCurrentMonth()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="calendar-container">
          <CalendarioFinanceiro 
            mes={currentDate.getMonth()} 
            ano={currentDate.getFullYear()} 
            onDiaClick={handleDiaClick}
          />
        </div>
      </div>

      {/* ✅ Projeção de Saldo - Estrutura correta com header próprio */}
      <div className="projection-section">
        <div className="projection-header">
          <div className="projection-title-section">
            <TrendingUp size={24} className="section-icon" />
            <div>
              <h3 className="section-title">🚀 Projeção de Saldo</h3>
              <p className="projection-subtitle">Visualize como seu dinheiro pode evoluir</p>
            </div>
          </div>
        </div>
        <div className="projection-container">
          <ProjecaoSaldoGraph 
            data={data?.historico || []} 
            mesAtual={currentDate.getMonth()}
            anoAtual={currentDate.getFullYear()}
          />
        </div>
      </div>
      
      {/* Modal de Detalhes do Dia */}
      <DetalhesDoDiaModal
        isOpen={showModal}
        onClose={handleCloseModal}
        dia={diaDetalhes}
      />
    </div>
  );
};

export default Dashboard;