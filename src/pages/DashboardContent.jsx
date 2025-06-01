import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  BarChart3,
  Eye,
  ChevronRight as ArrowRight,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hooks personalizados existentes
import useAuth from '../hooks/useAuth';
import useDashboardData from '../hooks/useDashboardData';

// Utilitários
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonthName } from '../utils/getCurrentMonthName';

// Componentes existentes
import DonutChartCategoria from '../Components/DonutChartCategoria';
import CalendarioFinanceiro from '../Components/CalendarioFinanceiro';
import ProjecaoSaldoGraph from '../Components/ProjecaoSaldoGraph';
import DetalhesDoDiaModal from '../Components/DetalhesDoDiaModal';

// CSS
import './DashboardContent.css';

/**
 * Dashboard Content - Versão corrigida com cards flip funcionais
 * Foco apenas nos cards e gráficos - sem header, botões ou seletor de período
 */
const DashboardContent = () => {
  const navigate = useNavigate();
  
  // Hooks de autenticação e dados
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading, error, refreshData } = useDashboardData();
  
  // Estados locais para UI
  const [diaDetalhes, setDiaDetalhes] = useState(null);
  const [modalDetalhesDiaOpen, setModalDetalhesDiaOpen] = useState(false);
  
  // Estado para controle dos cards flip - corrigido
  const [flippedCards, setFlippedCards] = useState({
    saldo: false,
    receitas: false,
    despesas: false,
    cartaoCredito: false
  });

  // Carregar dados quando componente monta
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Dashboard carregando dados...');
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  // Handler para virar um card - corrigido
  const handleCardFlip = (cardType) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardType]: !prev[cardType]
    }));
  };

  // Handler para quando um dia é clicado no calendário
  const handleDiaClick = (dia) => {
    setDiaDetalhes(dia);
    setModalDetalhesDiaOpen(true);
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
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="error-message">
          <h3 className="error-title">❌ Erro ao carregar dados</h3>
          <p className="error-details">{error}</p>
          <button onClick={() => refreshData()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* Cards Grid Premium com Flip - VERSÃO OPACITY */}
      <div className="cards-grid">
        {/* Card de Saldo - Verde */}
        <div 
          className={`summary-card card-green ${flippedCards.saldo ? 'flipped' : ''}`}
          onClick={() => handleCardFlip('saldo')}
        >
          <div className="card-inner">
            {/* FRENTE DO CARD */}
            <div className="card-front">
              <div className="card-header">
                <h3 className="card-title">💰 Saldo</h3>
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
            
            {/* VERSO DO CARD */}
            <div className="card-back">
              <div className="card-detail-total">
                <span>💳 Saldo Total:</span>
                <span>{formatCurrency(dadosSegurosSaldo.atual)}</span>
              </div>
              
              <div className="card-details">
                {contasDetalhadas.length > 0 ? (
                  contasDetalhadas.map((conta, index) => (
                    <div 
                      key={`conta-${conta.id || index}`} 
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
            {/* FRENTE DO CARD */}
            <div className="card-front">
              <div className="card-header">
                <h3 className="card-title">📈 Receitas</h3>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Atual</div>
                <div className="card-value">
                  {formatCurrency(dadosSeguroReceitas.atual)}
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Previsto</div>
                <div className="card-value-sm">
                  {formatCurrency(dadosSeguroReceitas.previsto)}
                </div>
              </div>
            </div>
            
            {/* VERSO DO CARD */}
            <div className="card-back">
              <div className="card-detail-total">
                <span>💵 Total Receitas:</span>
                <span>{formatCurrency(dadosSeguroReceitas.atual)}</span>
              </div>
              
              <div className="card-details">
                {dadosSeguroReceitas.categorias.length > 0 ? (
                  dadosSeguroReceitas.categorias.slice(0, 5).map((receita, index) => (
                    <div 
                      key={`receita-${receita.id || index}`} 
                      className="detail-item" 
                      style={{animationDelay: `${(index + 1) * 0.1}s`}}
                    >
                      <span className="detail-name">{receita.nome}</span>
                      <span className="detail-value">{formatCurrency(receita.valor)}</span>
                    </div>
                  ))
                ) : (
                  <div className="detail-item" style={{animationDelay: '0.1s'}}>
                    <span className="detail-name">Nenhuma receita registrada</span>
                    <span className="detail-value">R$ 0,00</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Card de Despesas - Coral */}
        <div 
          className={`summary-card card-amber ${flippedCards.despesas ? 'flipped' : ''}`}
          onClick={() => handleCardFlip('despesas')}
        >
          <div className="card-inner">
            {/* FRENTE DO CARD */}
            <div className="card-front">
              <div className="card-header">
                <h3 className="card-title">📉 Despesas</h3>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Atual</div>
                <div className="card-value">
                  {formatCurrency(dadosSegurosDespesas.atual)}
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Previsto</div>
                <div className="card-value-sm">
                  {formatCurrency(dadosSegurosDespesas.previsto)}
                </div>
              </div>
            </div>
            
            {/* VERSO DO CARD */}
            <div className="card-back">
              <div className="card-detail-total">
                <span>💸 Total Despesas:</span>
                <span>{formatCurrency(dadosSegurosDespesas.atual)}</span>
              </div>
              
              <div className="card-details">
                {dadosSegurosDespesas.categorias.length > 0 ? (
                  dadosSegurosDespesas.categorias.slice(0, 5).map((despesa, index) => (
                    <div 
                      key={`despesa-${despesa.id || index}`} 
                      className="detail-item" 
                      style={{animationDelay: `${(index + 1) * 0.1}s`}}
                    >
                      <span className="detail-name">{despesa.nome}</span>
                      <span className="detail-value">{formatCurrency(despesa.valor)}</span>
                    </div>
                  ))
                ) : (
                  <div className="detail-item" style={{animationDelay: '0.1s'}}>
                    <span className="detail-name">Nenhuma despesa registrada</span>
                    <span className="detail-value">R$ 0,00</span>
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
            {/* FRENTE DO CARD */}
            <div className="card-front">
              <div className="card-header">
                <h3 className="card-title">💳 Cartão</h3>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Usado</div>
                <div className="card-value">
                  {formatCurrency(dadosSeguroCartao.atual)}
                </div>
              </div>
              
              <div className="card-value-section">
                <div className="card-label">Limite Total</div>
                <div className="card-value-sm">
                  {formatCurrency(dadosSeguroCartao.limite)}
                </div>
              </div>
            </div>
            
            {/* VERSO DO CARD */}
            <div className="card-back">
              <div className="card-detail-total">
                <span>🔢 Limite Usado:</span>
                <span>{formatCurrency(dadosSeguroCartao.atual)}</span>
              </div>
              
              <div className="card-details">
                {cartoesDetalhados.length > 0 ? (
                  cartoesDetalhados.map((cartao, index) => (
                    <div 
                      key={`cartao-${cartao.id || index}`} 
                      className="detail-item" 
                      style={{animationDelay: `${(index + 1) * 0.1}s`}}
                    >
                      <span className="detail-name">{cartao.nome}</span>
                      <span className="detail-value">{formatCurrency(cartao.usado)}</span>
                    </div>
                  ))
                ) : (
                  <div className="detail-item" style={{animationDelay: '0.1s'}}>
                    <span className="detail-name">Nenhum cartão cadastrado</span>
                    <span className="detail-value">R$ 0,00</span>
                  </div>
                )}
                <div className="detail-item" style={{animationDelay: '0.2s'}}>
                  <span className="detail-name">💰 Disponível</span>
                  <span className="detail-value">
                    {formatCurrency(dadosSeguroCartao.limite - dadosSeguroCartao.atual)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Link rápido para transações */}
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
      
      {/* Seção de gráficos */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-section">
              <TrendingUp size={20} className="chart-icon" />
              <h3 className="chart-title">Receitas por categoria</h3>
            </div>
            <button 
              className="chart-action"
              onClick={() => navigate('/relatorios/categorias')}
            >
              Ver todas
            </button>
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
            <button 
              className="chart-action red"
              onClick={() => navigate('/relatorios/categorias')}
            >
              Ver todas
            </button>
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

      {/* Calendário Financeiro */}
      <div className="calendar-section">
        <div className="calendar-header">
          <div className="calendar-title-section">
            <Calendar size={24} className="section-icon" />
            <div>
              <h3 className="section-title">📅 Calendário Financeiro</h3>
              <p className="calendar-subtitle">Acompanhe suas movimentações diárias em {getCurrentMonthName()}</p>
            </div>
          </div>
        </div>
        
        <div className="calendar-container">
          <CalendarioFinanceiro 
            data={data} 
            mes={new Date().getMonth()} 
            ano={new Date().getFullYear()} 
            onDiaClick={handleDiaClick}
          />
        </div>
      </div>

      {/* Projeção de Saldo */}
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
            mesAtual={new Date().getMonth()}
            anoAtual={new Date().getFullYear()}
          />
        </div>
      </div>
      
      {/* Modal de Detalhes do Dia */}
      <DetalhesDoDiaModal
        isOpen={modalDetalhesDiaOpen}
        onClose={() => setModalDetalhesDiaOpen(false)}
        dia={diaDetalhes}
      />
    </div>
  );
};

export default DashboardContent;