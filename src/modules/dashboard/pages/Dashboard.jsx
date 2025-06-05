import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  BarChart3,
  Eye,
  ChevronRight as ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hooks personalizados existentes
import useAuth from "@modules/auth/hooks/useAuth";
import useDashboardData from '@modules/dashboard/hooks/useDashboardData';

// Utilitários
import { formatCurrency } from '@utils/formatCurrency';
import { getCurrentMonthName } from '@utils/getCurrentMonthName';

// Componentes existentes
import DonutChartCategoria from '@modules/relatorios/components/DonutChartCategoria';
import CalendarioFinanceiro from '@modules/dashboard/components/CalendarioFinanceiro';
import ProjecaoSaldoGraph from '@modules/dashboard/components/ProjecaoSaldoGraph';
import DetalhesDoDiaModal from '@modules/dashboard/components/DetalhesDoDiaModal';

// Modais existentes
import ContasModal from '@modules/contas/components/ContasModal';
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';
import CategoriasModal from '@modules/categorias/components/CategoriasModal';
import CartoesModal from '@modules/cartoes/components/CartoesModal';
import TransferenciasModal from '@modules/transacoes/components/TransferenciasModal';

// IMPORTAR O CSS
import '../styles/Dashboard.css';

/**
 * Dashboard Content - Versão corrigida com CSS aplicado
 */
const Dashboard = () => {
  const navigate = useNavigate();
  
  // Hooks de autenticação e dados
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading, error, refreshData } = useDashboardData();
  
  // Estados locais para UI
  const [diaDetalhes, setDiaDetalhes] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [flippedCards, setFlippedCards] = useState({
    saldo: false,
    receitas: false,
    despesas: false,
    cartaoCredito: false
  });

  // Estados para controle de modais
  const [modalsOpen, setModalsOpen] = useState({
    contas: false,
    despesas: false,
    receitas: false,
    despesasCartao: false,
    categorias: false,
    cartoes: false,
    transferencias: false,
    detalhesDia: false
  });

  // Carregar dados quando componente monta
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Dashboard carregando dados...');
      refreshData();
    }
  }, [isAuthenticated, refreshData]);
  
  // Função para abrir modal
  const openModal = (modalName) => {
    setModalsOpen(prev => ({ ...prev, [modalName]: true }));
  };

  // Função para fechar modal
  const closeModal = (modalName) => {
    setModalsOpen(prev => ({ ...prev, [modalName]: false }));
  };

  // Função para atualizar dados após salvar transação
  const handleTransacaoSalva = () => {
    console.log('🔄 Transação salva com sucesso!');
    refreshData();
  };

  // Handler para virar um card
  const handleCardFlip = (cardType) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardType]: !prev[cardType]
    }));
  };

  // Handler para quando um dia é clicado no calendário
  const handleDiaClick = (dia) => {
    setDiaDetalhes(dia);
    openModal('detalhesDia');
  };

  // Funções de navegação de período
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const getFormattedPeriod = () => {
    return currentDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentDate.getMonth() === now.getMonth() && 
           currentDate.getFullYear() === now.getFullYear();
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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
      {/* Seletor de Período - Interno ao Dashboard */}
      <section className="dashboard-period-selector">
        <div className="period-selector-container">
          <div className="period-selector-inline">
            <button 
              className="period-nav"
              onClick={() => navigateMonth(-1)}
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
                  onClick={goToToday}
                >
                  Hoje
                </button>
              )}
            </div>

            <button 
              className="period-nav"
              onClick={() => navigateMonth(1)}
              title="Próximo mês"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Cards Grid Premium com Flip */}
      <div className="cards-grid">
        {/* Card de Saldo - Verde */}
        <div 
          className={`summary-card card-green ${flippedCards.saldo ? 'flipped' : ''}`}
          onClick={() => handleCardFlip('saldo')}
        >
          <div className="card-inner">
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
            
            <div className="card-back">
              <div className="card-detail-total">
                <span>💵 Total Receitas:</span>
                <span>{formatCurrency(dadosSeguroReceitas.atual)}</span>
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
        
        {/* Card de Despesas - Laranja */}
        <div 
          className={`summary-card card-amber ${flippedCards.despesas ? 'flipped' : ''}`}
          onClick={() => handleCardFlip('despesas')}
        >
          <div className="card-inner">
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
            
            <div className="card-back">
              <div className="card-detail-total">
                <span>💸 Total Despesas:</span>
                <span>{formatCurrency(dadosSegurosDespesas.atual)}</span>
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
            
            <div className="card-back">
              <div className="card-detail-total">
                <span>🔢 Limite Usado:</span>
                <span>{formatCurrency(dadosSeguroCartao.atual)}</span>
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
            mes={currentDate.getMonth()} 
            ano={currentDate.getFullYear()} 
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
            mesAtual={currentDate.getMonth()}
            anoAtual={currentDate.getFullYear()}
          />
        </div>
      </div>
      
      {/* Modais */}
      <ContasModal 
        isOpen={modalsOpen.contas} 
        onClose={() => closeModal('contas')} 
      />
      
      <DespesasModal
        isOpen={modalsOpen.despesas}
        onClose={() => closeModal('despesas')}
        onSave={handleTransacaoSalva}
      />
      
      <ReceitasModal
        isOpen={modalsOpen.receitas}
        onClose={() => closeModal('receitas')}
        onSave={handleTransacaoSalva}
      />
      
      <DespesasCartaoModal
        isOpen={modalsOpen.despesasCartao}
        onClose={() => closeModal('despesasCartao')}
        onSave={handleTransacaoSalva}
      />
      
      <CartoesModal
        isOpen={modalsOpen.cartoes}
        onClose={() => closeModal('cartoes')}
        onSave={handleTransacaoSalva}
      />
      
      <CategoriasModal
        isOpen={modalsOpen.categorias}
        onClose={() => closeModal('categorias')}
        onSave={handleTransacaoSalva}
      />

      <TransferenciasModal
        isOpen={modalsOpen.transferencias}
        onClose={() => closeModal('transferencias')}
        onSave={handleTransacaoSalva}
      />

      <DetalhesDoDiaModal
        isOpen={modalsOpen.detalhesDia}
        onClose={() => closeModal('detalhesDia')}
        dia={diaDetalhes}
      />
    </div>
  );
};

export default Dashboard;