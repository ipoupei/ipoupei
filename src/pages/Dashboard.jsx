import React, { useState, useEffect, useRef } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus, User, LogOut, ChevronDown } from 'lucide-react';
import './Dashboard.css';

// Componentes
import DonutChartCategoria from '../Components/DonutChartCategoria';
import CalendarioFinanceiro from '../Components/CalendarioFinanceiro';
import ProjecaoSaldoGraph from '../Components/ProjecaoSaldoGraph';
import DetalhesDoDiaModal from '../Components/DetalhesDoDiaModal';

// Hooks e utilitários
import useDashboardData from '../hooks/useDashboardData';
import useAuth from '../hooks/useAuth';

// Modais
import ContasModal from '../Components/ContasModal';
import DespesasModal from '../Components/DespesasModal';
import ReceitasModal from '../Components/ReceitasModal';
import DespesasCartaoModal from '../Components/DespesasCartaoModal';
import CategoriasModal from '../Components/CategoriasModal';
import CartoesModal from '../Components/CartoesModal';

/**
 * Função para formatar valores em moeda brasileira
 * Versão corrigida e consistente
 */
const formatCurrency = (value) => {
  // Garantir que o valor é um número
  const numericValue = Number(value) || 0;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};

/**
 * Dashboard principal da aplicação de finanças pessoais
 * Versão corrigida com formatação adequada
 */
const Dashboard = () => {
  // Hooks
  const { data, loading, error } = useDashboardData();
  const { user, signOut } = useAuth();
  
  // Função para atualizar dados após salvar transação
  const handleTransacaoSalva = () => {
    console.log('🔄 Transação salva com sucesso!');
  };
  
  // Estado local para a data atual e selecionada
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Estado para controlar a exibição dos modais
  const [showContasModal, setShowContasModal] = useState(false);
  const [showDespesasModal, setShowDespesasModal] = useState(false);
  const [showReceitasModal, setShowReceitasModal] = useState(false);
  const [showDespesasCartaoModal, setShowDespesasCartaoModal] = useState(false);
  const [showCartaoModal, setShowCartaoModal] = useState(false);
  const [showCategoriasModal, setShowCategoriasModal] = useState(false);
  
  // Estado para controlar o modal de detalhes do dia
  const [showDetalhesDiaModal, setShowDetalhesDiaModal] = useState(false);
  const [diaDetalhes, setDiaDetalhes] = useState(null);
  
  // Estados para controlar a animação de flip dos cards
  const [flippedCards, setFlippedCards] = useState({
    saldo: false,
    receitas: false,
    despesas: false,
    cartaoCredito: false
  });

  // Referências para os dropdowns
  const datePickerRef = useRef(null);
  const moreActionsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Efeito para fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target)) {
        setShowMoreActions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
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
      action: () => setShowReceitasModal(true)
    },
    {
      id: 'add-despesa', 
      label: 'Despesa',
      icon: '💸',
      color: 'red',
      action: () => setShowDespesasModal(true)
    },
    {
      id: 'add-cartao',
      label: 'Cartão',
      icon: '💳',
      color: 'purple',
      action: () => setShowDespesasCartaoModal(true)
    },
    {
      id: 'contas',
      label: 'Contas',
      icon: '🏦',
      color: 'blue',
      action: () => setShowContasModal(true)
    },
    {
      id: 'cartoes',
      label: 'Cartões', 
      icon: '💳',
      color: 'orange',
      action: () => setShowCartaoModal(true)
    }
  ];

  // Ações secundárias
  const moreActions = [
    {
      id: 'categorias',
      label: 'Categorias',
      icon: '📊',
      action: () => setShowCategoriasModal(true)
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
      action: () => window.location.href = '/relatorios'
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
    setShowDetalhesDiaModal(true);
  };

  // Função de logout
  const handleLogout = async () => {
    try {
      console.log('🚪 Logout iniciado...');
      localStorage.clear();
      sessionStorage.clear();
      
      if (typeof signOut === 'function') {
        try {
          await signOut();
        } catch (err) {
          console.warn('⚠️ Erro no logout Supabase:', err);
        }
      }
      
      window.location.replace('/login');
    } catch (err) {
      console.error('❌ Erro no logout:', err);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    }
  };

  // Handler para ir ao perfil
  const handleGoToProfile = () => {
    window.location.href = '/profile';
    setShowUserMenu(false);
  };

  // Obter nome do usuário
  const getUserDisplayName = () => {
    if (data?.usuario?.nome) return data.usuario.nome;
    if (user?.user_metadata?.nome) return user.user_metadata.nome;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const getUserEmail = () => {
    return data?.usuario?.email || user?.email || 'usuario@exemplo.com';
  };

  const getUserAvatar = () => {
    return data?.usuario?.avatar_url || user?.user_metadata?.avatar_url || null;
  };

  // Debug dos dados para verificar o problema
  console.log('🔍 Dashboard Data Debug:', {
    loading,
    error,
    data: data ? {
      saldo: data.saldo,
      receitas: data.receitas,
      despesas: data.despesas,
      cartaoCredito: data.cartaoCredito,
      resumo: data.resumo
    } : null
  });

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        {/* Header com navegação do usuário */}
        <header className="dashboard-header-with-user">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">iPoupei</h1>
              <p className="dashboard-subtitle">Acompanhamento mensal</p>
            </div>
            
            {/* Menu do usuário */}
            <div className="header-right" ref={userMenuRef}>
              <div className="user-menu-container">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="Menu do usuário"
                >
                  <div className="user-avatar">
                    {getUserAvatar() ? (
                      <img 
                        src={getUserAvatar()} 
                        alt="Avatar do usuário" 
                        className="avatar-image"
                      />
                    ) : (
                      <span className="avatar-initial">{getUserInitial()}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{getUserDisplayName()}</span>
                    <span className="user-greeting">Bem-vindo de volta!</span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`chevron ${showUserMenu ? 'rotated' : ''}`} 
                  />
                </button>
                
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <div className="dropdown-header">
                      <div className="user-avatar-large">
                        {getUserAvatar() ? (
                          <img 
                            src={getUserAvatar()} 
                            alt="Avatar do usuário" 
                          />
                        ) : (
                          <span className="avatar-initial-large">{getUserInitial()}</span>
                        )}
                      </div>
                      <div className="user-details">
                        <strong>{getUserDisplayName()}</strong>
                        <span className="user-email">{getUserEmail()}</span>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item"
                      onClick={handleGoToProfile}
                    >
                      <User size={16} />
                      <span>Meu Perfil</span>
                    </button>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
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
                title={`${action.label}`}
              >
                <span className="action-icon">{action.icon}</span>
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
                    <span className="dropdown-icon">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Cards Grid - VERSÃO CORRIGIDA */}
        <div className="cards-grid">
          {/* Card de Saldo */}
          <div 
            className={`summary-card card-green ${flippedCards.saldo ? 'flipped' : ''}`}
            onClick={() => handleCardFlip('saldo')}
            title={flippedCards.saldo ? "Clique para voltar" : "Clique para ver detalhamento"}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Saldo</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {loading ? 'Carregando...' : formatCurrency(data?.saldo?.atual || 0)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {loading ? 'Carregando...' : formatCurrency(data?.saldo?.previsto || 0)}
                  </div>
                </div>
                
                <div className="card-footer">
                  <span>💡 Clique para ver detalhes das contas</span>
                </div>
              </div>
              
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Saldo Total:</span>
                  <span>{formatCurrency(data?.saldo?.atual || 0)}</span>
                </div>
                
                <div className="card-details">
                  {data?.contasDetalhadas?.length > 0 ? (
                    data.contasDetalhadas.map((conta, index) => (
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
            title={flippedCards.receitas ? "Clique para voltar" : "Clique para ver detalhamento"}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Receitas</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {loading ? 'Carregando...' : formatCurrency(data?.receitas?.atual || 0)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {loading ? 'Carregando...' : formatCurrency(data?.receitas?.previsto || 0)}
                  </div>
                </div>
                
                <div className="card-footer">
                  <span>💰 Clique para ver receitas por categoria</span>
                </div>
              </div>
              
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Total Receitas:</span>
                  <span>{formatCurrency(data?.receitas?.atual || 0)}</span>
                </div>
                
                <div className="card-details">
                  {data?.receitas?.categorias?.length > 0 ? (
                    data.receitas.categorias.slice(0, 5).map((receita, index) => (
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
            title={flippedCards.despesas ? "Clique para voltar" : "Clique para ver detalhamento"}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Despesas</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {loading ? 'Carregando...' : formatCurrency(data?.despesas?.atual || 0)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {loading ? 'Carregando...' : formatCurrency(data?.despesas?.previsto || 0)}
                  </div>
                </div>
                
                <div className="card-footer">
                  <span>💸 Clique para ver despesas por categoria</span>
                </div>
              </div>
              
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Total Despesas:</span>
                  <span>{formatCurrency(data?.despesas?.atual || 0)}</span>
                </div>
                
                <div className="card-details">
                  {data?.despesas?.categorias?.length > 0 ? (
                    data.despesas.categorias.slice(0, 5).map((despesa, index) => (
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
            title={flippedCards.cartaoCredito ? "Clique para voltar" : "Clique para ver detalhamento"}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Cartão de Crédito</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Usado</div>
                  <div className="card-value">
                    {loading ? 'Carregando...' : formatCurrency(data?.cartaoCredito?.atual || 0)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Limite Total</div>
                  <div className="card-value-sm">
                    {loading ? 'Carregando...' : formatCurrency(data?.cartaoCredito?.limite || 0)}
                  </div>
                </div>
                
                <div className="card-footer">
                  <span>💳 Clique para ver detalhes dos cartões</span>
                </div>
              </div>
              
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Limite Usado:</span>
                  <span>{formatCurrency(data?.cartaoCredito?.atual || 0)}</span>
                </div>
                
                <div className="card-details">
                  {data?.cartoesDetalhados?.length > 0 ? (
                    data.cartoesDetalhados.map((cartao, index) => (
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
                      {formatCurrency((data?.cartaoCredito?.limite || 0) - (data?.cartaoCredito?.atual || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção de gráficos */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Receitas por categoria</h3>
              <button className="chart-action">Ver todas</button>
            </div>
            
            <div className="chart-container">
              <DonutChartCategoria 
                data={data?.receitasPorCategoria || [
                  { nome: "Sem receitas", valor: 0, color: "#E5E7EB" }
                ]} 
              />
            </div>
          </div>
          
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Despesas por categoria</h3>
              <button className="chart-action red">Ver todas</button>
            </div>
            
            <div className="chart-container">
              <DonutChartCategoria 
                data={data?.despesasPorCategoria || [
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
        
        {/* Modais */}
        <ContasModal 
          isOpen={showContasModal} 
          onClose={() => setShowContasModal(false)} 
        />
        
        <DespesasModal
          isOpen={showDespesasModal}
          onClose={() => setShowDespesasModal(false)}
          onSave={handleTransacaoSalva}
        />
        
        <ReceitasModal
          isOpen={showReceitasModal}
          onClose={() => setShowReceitasModal(false)}
          onSave={handleTransacaoSalva}
        />
        
        <DespesasCartaoModal
          isOpen={showDespesasCartaoModal}
          onClose={() => setShowDespesasCartaoModal(false)}
        />
        
        <CartoesModal
          isOpen={showCartaoModal}
          onClose={() => setShowCartaoModal(false)}
        />
        
        <CategoriasModal
          isOpen={showCategoriasModal}
          onClose={() => setShowCategoriasModal(false)}
        />

        <DetalhesDoDiaModal
          isOpen={showDetalhesDiaModal}
          onClose={() => setShowDetalhesDiaModal(false)}
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
    </div>
  );
};

export default Dashboard;