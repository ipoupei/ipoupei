// src/pages/Dashboard.jsx - Versão atualizada com link para transações
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, 
  ChevronDown, ArrowLeftRight, CreditCard, Wallet,
  List, Eye
} from 'lucide-react';
import './Dashboard.css';

// CORRIGIDO: Zustand stores
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useUIStore } from '../store/uiStore';

// Utilitários
import { formatCurrency } from '../utils/formatCurrency';

// Componentes
import DonutChartCategoria from '../Components/DonutChartCategoria';
import CalendarioFinanceiro from '../Components/CalendarioFinanceiro';
import ProjecaoSaldoGraph from '../Components/ProjecaoSaldoGraph';
import DetalhesDoDiaModal from '../Components/DetalhesDoDiaModal';
import NotificationContainer from '../Components/NotificationContainer';

// Modais
import ContasModal from '../Components/ContasModal';
import DespesasModal from '../Components/DespesasModal';
import ReceitasModal from '../Components/ReceitasModal';
import DespesasCartaoModal from '../Components/DespesasCartaoModal';
import CategoriasModal from '../Components/CategoriasModal';
import CartoesModal from '../Components/CartoesModal';
import TransferenciasModal from '../Components/TransferenciasModal';

/**
 * Dashboard principal da aplicação de finanças pessoais
 * CORRIGIDO: Refatorado para usar Zustand stores
 */
const Dashboard = () => {
  const navigate = useNavigate();
  
  // CORRIGIDO: Zustand stores
  const { user, isAuthenticated } = useAuthStore();
  const { 
    data, 
    loading, 
    error, 
    selectedDate,
    setSelectedDate,
    fetchDashboardData,
    refreshData
  } = useDashboardStore();
  const { 
    modals, 
    openModal, 
    closeModal, 
    showNotification 
  } = useUIStore();
  
  // Estados locais para UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [diaDetalhes, setDiaDetalhes] = useState(null);
  const [flippedCards, setFlippedCards] = useState({
    saldo: false,
    receitas: false,
    despesas: false,
    cartaoCredito: false
  });

  // Referências para os dropdowns
  const datePickerRef = useRef(null);
  const moreActionsRef = useRef(null);

  // CORRIGIDO: Carregar dados do dashboard quando componente monta
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Dashboard montado, carregando dados...');
      fetchDashboardData();
    }
  }, [isAuthenticated, selectedDate, fetchDashboardData]);

  // Efeito para fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target)) {
        setShowMoreActions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // CORRIGIDO: Função para atualizar dados após salvar transação
  const handleTransacaoSalva = () => {
    console.log('🔄 Transação salva com sucesso!');
    refreshData();
    showNotification('Transação salva com sucesso!', 'success');
  };
  
  // Função para navegar para o mês anterior
  const handlePreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };
  
  // Função para navegar para o próximo mês
  const handleNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };
  
  // Função para selecionar um mês específico
  const handleMonthSelect = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };
  
  // Formatação do mês e ano selecionado
  const mesAnoSelecionado = format(selectedDate, 'MMMM yyyy', { locale: ptBR });
  const mesAnoSelecionadoCapitalizado = mesAnoSelecionado.charAt(0).toUpperCase() + mesAnoSelecionado.slice(1);
  
  // Ações principais
  const mainActions = [
    {
      id: 'add-receita',
      label: 'Receita',
      icon: '💰',
      color: 'green',
      action: () => openModal('receitas')
    },
    {
      id: 'add-despesa', 
      label: 'Despesa',
      icon: '💸',
      color: 'red',
      action: () => openModal('despesas')
    },
    {
      id: 'add-cartao-compra',
      label: 'Cartão',
      icon: '💳',
      color: 'purple',
      action: () => openModal('despesasCartao')
    },
    {
      id: 'transferencia',
      label: 'Transferir',
      icon: <ArrowLeftRight size={16} />,
      color: 'blue',
      action: () => openModal('transferencias')
    },
    {
      id: 'contas',
      label: 'Contas',
      icon: <Wallet size={16} />,
      color: 'green',
      action: () => openModal('contas')
    }
  ];

  // Ações secundárias
  const moreActions = [
    {
      id: 'ver-transacoes',
      label: 'Ver Transações',
      icon: <List size={16} />,
      action: () => navigate('/transacoes')
    },
    {
      id: 'cartoes-gerenciar',
      label: 'Meus Cartões',
      icon: <CreditCard size={16} />,
      action: () => openModal('cartoes')
    },
    {
      id: 'categorias',
      label: 'Categorias',
      icon: '📊',
      action: () => openModal('categorias')
    },
    {
      id: 'diagnostico',
      label: 'Diagnóstico',
      icon: '🎯',
      action: () => window.location.href = '/diagnostico'
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: '📈',
      action: () => navigate('/relatorios')
    }
  ];

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

  // Se não estiver autenticado, redireciona
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // CORRIGIDO: Dados seguros para evitar erros
  const dadosSegurosSaldo = data?.saldo || { atual: 0, previsto: 0 };
  const dadosSegurosDespesas = data?.despesas || { atual: 0, previsto: 0, categorias: [] };
  const dadosSeguroReceitas = data?.receitas || { atual: 0, previsto: 0, categorias: [] };
  const dadosSeguroCartao = data?.cartaoCredito || { atual: 0, limite: 0 };
  const contasDetalhadas = data?.contasDetalhadas || [];
  const cartoesDetalhados = data?.cartoesDetalhados || [];
  const receitasPorCategoria = data?.receitasPorCategoria || [];
  const despesasPorCategoria = data?.despesasPorCategoria || [];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        
        {/* Seletor de mês */}
        <div className="month-selector">
          <button 
            className="month-nav-button"
            onClick={handlePreviousMonth}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="month-display">
            <span>{mesAnoSelecionadoCapitalizado}</span>
            <button 
              className="calendar-button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              aria-label="Abrir calendário"
            >
              <Calendar size={16} />
            </button>
            
            {showDatePicker && (
              <div className="date-picker-popup" ref={datePickerRef}>
                <div className="simple-month-picker">
                  <div className="year-selector">
                    <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear() - 1, selectedDate.getMonth(), 1))}>
                      &lt;
                    </button>
                    <span>{selectedDate.getFullYear()}</span>
                    <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth(), 1))}>
                      &gt;
                    </button>
                  </div>
                  <div className="months-grid">
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date(selectedDate.getFullYear(), i, 1);
                      const monthName = format(date, 'MMM', { locale: ptBR });
                      const isCurrentMonth = i === selectedDate.getMonth();
                      return (
                        <button 
                          key={i}
                          className={`month-button ${isCurrentMonth ? 'selected' : ''}`}
                          onClick={() => handleMonthSelect(date)}
                        >
                          {monthName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="month-nav-button"
            onClick={handleNextMonth}
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Barra de ações rápidas */}
        <div className="quick-actions-bar">
          <div className="main-actions">
            {mainActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`action-btn action-btn-${action.color}`}
                title={action.label}
              >
                <span className="action-icon">
                  {typeof action.icon === 'string' ? action.icon : action.icon}
                </span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
          
          <div className="more-actions-container" ref={moreActionsRef}>
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="action-btn action-btn-more"
              title="Mais opções"
            >
              <Plus size={18} />
              <span className="action-label">Mais</span>
            </button>
            
            {showMoreActions && (
              <div className="more-actions-dropdown">
                {moreActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setShowMoreActions(false);
                    }}
                    className="dropdown-action"
                  >
                    <span className="dropdown-icon">
                      {typeof action.icon === 'string' ? action.icon : action.icon}
                    </span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Cards Grid */}
        <div className="cards-grid">
          {/* Card de Saldo */}
          <div 
            className={`summary-card card-green ${flippedCards.saldo ? 'flipped' : ''}`}
            onClick={() => handleCardFlip('saldo')}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Saldo</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {loading ? 'Carregando...' : formatCurrency(dadosSegurosSaldo.atual)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {loading ? 'Carregando...' : formatCurrency(dadosSegurosSaldo.previsto)}
                  </div>
                </div>
              </div>
              
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Saldo Total:</span>
                  <span>{formatCurrency(dadosSegurosSaldo.atual)}</span>
                </div>
                
                <div className="card-details">
                  {contasDetalhadas.length > 0 ? (
                    contasDetalhadas.map((conta, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-name">{conta.nome}</span>
                        <span className="detail-value">{formatCurrency(conta.saldo)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="detail-item">
                      <span className="detail-name">Nenhuma conta cadastrada</span>
                      <span className="detail-value">R$ 0,00</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Card de Receitas */}
          <div 
            className={`summary-card card-blue ${flippedCards.receitas ? 'flipped' : ''}`}
            onClick={() => handleCardFlip('receitas')}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Receitas</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {loading ? 'Carregando...' : formatCurrency(dadosSeguroReceitas.atual)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {loading ? 'Carregando...' : formatCurrency(dadosSeguroReceitas.previsto)}
                  </div>
                </div>
              </div>
              
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Total Receitas:</span>
                  <span>{formatCurrency(dadosSeguroReceitas.atual)}</span>
                </div>
                
                <div className="card-details">
                  {dadosSeguroReceitas.categorias.length > 0 ? (
                    dadosSeguroReceitas.categorias.slice(0, 5).map((receita, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-name">{receita.nome}</span>
                        <span className="detail-value">{formatCurrency(receita.valor)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="detail-item">
                      <span className="detail-name">Nenhuma receita registrada</span>
                      <span className="detail-value">R$ 0,00</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Card de Despesas */}
          <div 
            className={`summary-card card-amber ${flippedCards.despesas ? 'flipped' : ''}`}
            onClick={() => handleCardFlip('despesas')}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Despesas</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {loading ? 'Carregando...' : formatCurrency(dadosSegurosDespesas.atual)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {loading ? 'Carregando...' : formatCurrency(dadosSegurosDespesas.previsto)}
                  </div>
                </div>
              </div>
              
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Total Despesas:</span>
                  <span>{formatCurrency(dadosSegurosDespesas.atual)}</span>
                </div>
                
                <div className="card-details">
                  {dadosSegurosDespesas.categorias.length > 0 ? (
                    dadosSegurosDespesas.categorias.slice(0, 5).map((despesa, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-name">{despesa.nome}</span>
                        <span className="detail-value">{formatCurrency(despesa.valor)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="detail-item">
                      <span className="detail-name">Nenhuma despesa registrada</span>
                      <span className="detail-value">R$ 0,00</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Card de Cartão de Crédito */}
          <div 
            className={`summary-card card-purple ${flippedCards.cartaoCredito ? 'flipped' : ''}`}
            onClick={() => handleCardFlip('cartaoCredito')}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Cartão de Crédito</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Usado</div>
                  <div className="card-value">
                    {loading ? 'Carregando...' : formatCurrency(dadosSeguroCartao.atual)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Limite Total</div>
                  <div className="card-value-sm">
                    {loading ? 'Carregando...' : formatCurrency(dadosSeguroCartao.limite)}
                  </div>
                </div>
              </div>
              
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Limite Usado:</span>
                  <span>{formatCurrency(dadosSeguroCartao.atual)}</span>
                </div>
                
                <div className="card-details">
                  {cartoesDetalhados.length > 0 ? (
                    cartoesDetalhados.map((cartao, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-name">{cartao.nome}</span>
                        <span className="detail-value">{formatCurrency(cartao.usado)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="detail-item">
                      <span className="detail-name">Nenhum cartão cadastrado</span>
                      <span className="detail-value">R$ 0,00</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-name">Disponível</span>
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
              <h3 className="quick-access-title">Ver Todas as Transações</h3>
              <p className="quick-access-description">
                Visualize, filtre e gerencie todas as suas movimentações financeiras
              </p>
            </div>
            <div className="quick-access-arrow">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
        
        {/* Seção de gráficos */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Receitas por categoria</h3>
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
              <h3 className="chart-title">Despesas por categoria</h3>
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
            <h3 className="section-title">Calendário Financeiro</h3>
            <p className="calendar-subtitle">Acompanhe suas movimentações diárias</p>
          </div>
          
          <div className="calendar-container">
            <CalendarioFinanceiro 
              data={data} 
              mes={selectedDate.getMonth()} 
              ano={selectedDate.getFullYear()} 
              onDiaClick={handleDiaClick}
            />
          </div>
        </div>

        {/* Projeção de Saldo */}
        <div className="projection-section">
          <h3 className="section-title">Projeção de Saldo</h3>
          <div className="projection-container">
            <ProjecaoSaldoGraph 
              data={data?.historico || []} 
              mesAtual={selectedDate.getMonth()}
              anoAtual={selectedDate.getFullYear()}
            />
          </div>
        </div>
        
        {/* CORRIGIDO: Modais - Usando Zustand para controle */}
        <ContasModal 
          isOpen={modals.contas} 
          onClose={() => closeModal('contas')} 
        />
        
        <DespesasModal
          isOpen={modals.despesas}
          onClose={() => closeModal('despesas')}
          onSave={handleTransacaoSalva}
        />
        
        <ReceitasModal
          isOpen={modals.receitas}
          onClose={() => closeModal('receitas')}
          onSave={handleTransacaoSalva}
        />
        
        <DespesasCartaoModal
          isOpen={modals.despesasCartao}
          onClose={() => closeModal('despesasCartao')}
        />
        
        <CartoesModal
          isOpen={modals.cartoes}
          onClose={() => closeModal('cartoes')}
        />
        
        <CategoriasModal
          isOpen={modals.categorias}
          onClose={() => closeModal('categorias')}
        />

        <TransferenciasModal
          isOpen={modals.transferencias}
          onClose={() => closeModal('transferencias')}
        />

        <DetalhesDoDiaModal
          isOpen={modals.detalhesDia}
          onClose={() => closeModal('detalhesDia')}
          dia={diaDetalhes}
        />
        
        {/* Mensagem de erro (se houver) */}
        {error && (
          <div className="error-message">
            <p className="error-title">Erro ao carregar dados</p>
            <p className="error-details">{error}</p>
          </div>
        )}
      </div>
      
      {/* NOVO: Container de notificações */}
      <NotificationContainer />
    </div>
  );
};

export default Dashboard;