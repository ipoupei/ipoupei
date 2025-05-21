import React, { useState, useEffect, useRef } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, CreditCard, BarChart2, PieChart } from 'lucide-react';
import './Dashboard.css';


// Componentes
import DonutChartCategoria from '../Components/DonutChartCategoria';
import CalendarioFinanceiro from '../Components/CalendarioFinanceiro';
import ProjecaoSaldoGraph from '../Components/ProjecaoSaldoGraph';
import DetalhesDoDiaModal from '../Components/DetalhesDoDiaModal';

// Hooks e utilitários
import useDashboardData from '../hooks/useDashboardData';
import { formatCurrency } from '../utils/formatCurrency';

// Modais
import ContasModal from '../Components/ContasModal';
import DespesasModal from '../Components/DespesasModal';
import ReceitasModal from '../Components/ReceitasModal';
import DespesasCartaoModal from '../Components/DespesasCartaoModal';
import CategoriasModal from '../Components/CategoriasModal';
import CartoesModal from '../Components/CartoesModal';

/**
 * Dashboard principal da aplicação de finanças pessoais
 * Exibe resumo financeiro, gráficos, calendário e projeção de saldo
 * Layout atualizado: calendário ocupa largura total
 */
const Dashboard = () => {
  // Obtém os dados do dashboard usando o hook personalizado
  const { data, loading, error } = useDashboardData();
  
  // Estado local para a data atual e selecionada
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
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

  // Referência para o container do DatePicker para fechar ao clicar fora
  const datePickerRef = useRef(null);
  
  // Dados mockados para o detalhamento dos cards
  const detalhamentoCards = {
    saldo: [
      { nome: 'Conta Corrente', valor: 5432.75 },
      { nome: 'Poupança', valor: 15750.20 },
      { nome: 'Investimentos', valor: 96441.05 }
    ],
    receitas: [
      { nome: 'Salário', valor: 300.00 },
      { nome: 'Freelance', valor: 100.00 },
      { nome: 'Investimentos', valor: 56.32 }
    ],
    despesas: [
      { nome: 'Alimentação', valor: 150.00 },
      { nome: 'Transporte', valor: 95.00 },
      { nome: 'Moradia', valor: 150.00 },
      { nome: 'Lazer', valor: 61.32 }
    ],
    cartaoCredito: [
      { nome: 'Visa', valor: 256.32 },
      { nome: 'Mastercard', valor: 200.00 }
    ]
  };

  // Efeito para fechar o DatePicker ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);
  
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

  // Função para calcular o total a partir de um array de itens
  const calcularTotal = (itens) => {
    return itens.reduce((total, item) => total + item.valor, 0);
  };
  
  // Formatação do mês e ano selecionado
  const mesAnoSelecionado = format(selectedDate, 'MMMM yyyy', { locale: ptBR });
  const mesAnoSelecionadoCapitalizado = mesAnoSelecionado.charAt(0).toUpperCase() + mesAnoSelecionado.slice(1);
  
  // Handlers para os botões de ação
  const handleActionButton = (action) => {
    console.log(`Ação executada: ${action}`);
    
    // Abre o modal correspondente à ação
    switch (action) {
      case 'minhas-contas':
        setShowContasModal(true);
        break;
      case 'lancar-despesas':
        setShowDespesasModal(true);
        break;
      case 'lancar-receitas':
        setShowReceitasModal(true);
        break;
      case 'lancar-cartao':
        setShowDespesasCartaoModal(true);
        break;
      case 'meus-cartoes':
        setShowCartaoModal(true);
        break;
      case 'categorias':
        setShowCategoriasModal(true);
        break;
      // Outros casos serão implementados conforme necessário
      default:
        // Por padrão, apenas loga a ação
        console.log(`Ação ${action} ainda não implementada`);
    }
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
    setShowDetalhesDiaModal(true);
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">iPoupei - Acompanhamento mensal</h1>
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
        
        {/* Barra de ações rápidas - redesenhada em uma linha com textos atualizados */}
        <div className="actions-bar-container">
          <div className="actions-bar">
            <div className="actions-gradient-left"></div>
            
            <div className="actions-scroll">
              <button 
                className="action-button primary"
                onClick={() => handleActionButton('minhas-contas')}
                title="Gerenciar contas bancárias"
              >
                <span>🏦</span>
                <span>Contas</span>
              </button>
              
              <button 
                className="action-button blue"
                onClick={() => handleActionButton('meus-cartoes')}
                title="Gerenciar cartões de crédito"
              >
                <span>💳</span>
                <span>Cartões</span>
              </button>
              
              <button 
                className="action-button green"
                onClick={() => handleActionButton('lancar-receitas')}
                title="Registrar nova receita"
              >
                <span>➕</span>
                <span>Receita</span>
              </button>
              
              <button 
                className="action-button red"
                onClick={() => handleActionButton('lancar-despesas')}
                title="Registrar nova despesa"
              >
                <span>➖</span>
                <span>Despesa</span>
              </button>
              
              <button 
                className="action-button purple"
                onClick={() => handleActionButton('lancar-cartao')}
                title="Registrar compra com cartão de crédito"
              >
                <span>💳</span>
                <span>Despesa Cartão</span>
              </button>
              
              <button 
                className="action-button amber"
                onClick={() => handleActionButton('categorias')}
                title="Gerenciar categorias e subcategorias"
              >
                <span>📊</span>
                <span>Categorias</span>
              </button>
            </div>
            
            <div className="actions-gradient-right"></div>
          </div>
        </div>
        
        {/* Cards de resumo em grid - com capacidade de rolagem no verso */}
        <div className="cards-grid">
          {/* Card de Saldo */}
          <div 
            className={`summary-card card-green ${flippedCards.saldo ? 'flipped' : ''}`}
            onClick={() => handleCardFlip('saldo')}
            title={flippedCards.saldo ? "Clique para voltar" : "Clique para ver detalhamento"}
          >
            <div className="card-inner">
              {/* Frente do card */}
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Saldo</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {formatCurrency(data?.saldo?.atual || 117624.00)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {formatCurrency(data?.saldo?.previsto || 456.65)}
                  </div>
                </div>
              </div>
              
              {/* Verso do card - detalhamento por conta (com rolagem) */}
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Total:</span>
                  <span>{formatCurrency(calcularTotal(detalhamentoCards.saldo))}</span>
                </div>
                
                <div className="card-details">
                  {detalhamentoCards.saldo.map((conta, index) => (
                    <div key={index} className="detail-item">
                      <span className="detail-name">{conta.nome}</span>
                      <span className="detail-value">{formatCurrency(conta.valor)}</span>
                    </div>
                  ))}
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
              {/* Frente do card */}
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Receitas</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {formatCurrency(data?.receitas?.atual || 456.32)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {formatCurrency(data?.receitas?.previsto || 456.65)}
                  </div>
                </div>
              </div>
              
              {/* Verso do card - detalhamento por tipo de receita (com rolagem) */}
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Total:</span>
                  <span>{formatCurrency(calcularTotal(detalhamentoCards.receitas))}</span>
                </div>
                
                <div className="card-details">
                  {detalhamentoCards.receitas.map((receita, index) => (
                    <div key={index} className="detail-item">
                      <span className="detail-name">{receita.nome}</span>
                      <span className="detail-value">{formatCurrency(receita.valor)}</span>
                    </div>
                  ))}
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
              {/* Frente do card */}
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Despesas</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {formatCurrency(data?.despesas?.atual || 456.32)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {formatCurrency(data?.despesas?.previsto || 456.65)}
                  </div>
                </div>
              </div>
              
              {/* Verso do card - detalhamento por categoria de despesa (com rolagem) */}
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Total:</span>
                  <span>{formatCurrency(calcularTotal(detalhamentoCards.despesas))}</span>
                </div>
                
                <div className="card-details">
                  {detalhamentoCards.despesas.map((despesa, index) => (
                    <div key={index} className="detail-item">
                      <span className="detail-name">{despesa.nome}</span>
                      <span className="detail-value">{formatCurrency(despesa.valor)}</span>
                    </div>
                  ))}
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
              {/* Frente do card */}
              <div className="card-front">
                <div className="card-header">
                  <h3 className="card-title">Cartão de crédito</h3>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Atual</div>
                  <div className="card-value">
                    {formatCurrency(data?.cartaoCredito?.atual || 456.32)}
                  </div>
                </div>
                
                <div className="card-value-section">
                  <div className="card-label">Previsto</div>
                  <div className="card-value-sm">
                    {formatCurrency(data?.cartaoCredito?.previsto || 456.65)}
                  </div>
                </div>
              </div>
              
              {/* Verso do card - detalhamento por cartão (com rolagem) */}
              <div className="card-back">
                <div className="card-detail-total">
                  <span>Total:</span>
                  <span>{formatCurrency(calcularTotal(detalhamentoCards.cartaoCredito))}</span>
                </div>
                
                <div className="card-details">
                  {detalhamentoCards.cartaoCredito.map((cartao, index) => (
                    <div key={index} className="detail-item">
                      <span className="detail-name">{cartao.nome}</span>
                      <span className="detail-value">{formatCurrency(cartao.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção de gráficos de categorias com Donut Charts */}
        <div className="charts-grid">
          {/* Receitas por categoria - Usando DonutChart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Receitas por categoria</h3>
              <button 
                className="chart-action" 
                onClick={() => handleActionButton('ver-todas-receitas')}
                title="Ver todas as receitas"
              >
                Ver todas
              </button>
            </div>
            
            {/* Gráfico de Rosca Interativo */}
            <div className="chart-container">
              <DonutChartCategoria 
                data={data?.receitasPorCategoria || [
                  { nome: "Salário", valor: 300, color: "#3B82F6" },
                  { nome: "Freelance", valor: 100, color: "#10B981" },
                  { nome: "Investimentos", valor: 56.32, color: "#F59E0B" }
                ]} 
              />
            </div>
          </div>
          
          {/* Despesas por categoria - Usando DonutChart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Despesas por categoria</h3>
              <button 
                className="chart-action red" 
                onClick={() => handleActionButton('ver-todas-despesas')}
                title="Ver todas as despesas"
              >
                Ver todas
              </button>
            </div>
            
            {/* Gráfico de Rosca Interativo */}
            <div className="chart-container">
              <DonutChartCategoria 
                data={data?.despesasPorCategoria || [
                  { nome: "Alimentação", valor: 150, color: "#3B82F6" },
                  { nome: "Transporte", valor: 95, color: "#10B981" },
                  { nome: "Lazer", valor: 80, color: "#F59E0B" },
                  { nome: "Contas", valor: 131.32, color: "#EF4444" }
                ]} 
              />
            </div>
          </div>
        </div>

        {/* Calendário Financeiro - Agora em largura total */}
        <div className="calendar-full-width-section">
          <h3 className="section-title">Calendário Financeiro</h3>
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
        />
        
        <ReceitasModal
          isOpen={showReceitasModal}
          onClose={() => setShowReceitasModal(false)}
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