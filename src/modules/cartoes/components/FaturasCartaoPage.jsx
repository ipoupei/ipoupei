// src/pages/FaturasCartaoPage.jsx - Versão completa seguindo padrões do projeto
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Calendar, DollarSign, Eye, EyeOff,
  ChevronLeft, ChevronRight, Filter, Download,
  AlertCircle, TrendingUp, Clock, CheckCircle,
  ArrowUpCircle, ArrowDownCircle, Receipt, BarChart3,
  Target, PieChart, Users, Zap, Plus, Edit
} from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '@modules/cartoes/styles/FaturasCartaoPage.css';


const FaturasCartaoPage = () => {
  const [cartaoSelecionado, setCartaoSelecionado] = useState('');
  const [mesAnoSelecionado, setMesAnoSelecionado] = useState(format(new Date(), 'yyyy-MM'));
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [detalhesVisivel, setDetalhesVisivel] = useState(false);

  // Mock de dados para demonstração
  const [cartoes] = useState([
    { id: '1', nome: 'Nubank Roxinho', bandeira: 'Mastercard', cor: '#8A05BE' },
    { id: '2', nome: 'Inter Gold', bandeira: 'Visa', cor: '#FF7A00' },
    { id: '3', nome: 'C6 Bank', bandeira: 'Mastercard', cor: '#FFD700' }
  ]);

  const [faturaAtual] = useState({
    cartao_id: '1',
    cartao_nome: 'Nubank Roxinho',
    cartao_bandeira: 'Mastercard',
    fatura_vencimento: '2025-06-15',
    valor_total_fatura: 2847.50,
    total_compras: 23,
    total_parcelas: 8,
    limite_disponivel: 7152.50,
    limite_total: 10000.00
  });

  const [transacoesMock] = useState([
    {
      id: '1',
      data: '2025-06-02',
      descricao: 'Supermercado Pão de Açúcar',
      valor: 287.90,
      categoria: { nome: 'Alimentação', cor: '#10b981' },
      tipo: 'despesa',
      numero_parcelas: 1
    },
    {
      id: '2',
      data: '2025-06-01',
      descricao: 'Netflix Subscription',
      valor: 32.90,
      categoria: { nome: 'Entretenimento', cor: '#8b5cf6' },
      tipo: 'despesa',
      numero_parcelas: 1
    },
    {
      id: '3',
      data: '2025-05-30',
      descricao: 'Posto Ipiranga',
      valor: 150.00,
      categoria: { nome: 'Transporte', cor: '#f59e0b' },
      tipo: 'despesa',
      numero_parcelas: 1
    },
    {
      id: '4',
      data: '2025-05-28',
      descricao: 'Farmácia São Paulo',
      valor: 89.70,
      categoria: { nome: 'Saúde', cor: '#ef4444' },
      tipo: 'despesa',
      numero_parcelas: 1
    },
    {
      id: '5',
      data: '2025-05-25',
      descricao: 'Smartphone Samsung Galaxy',
      valor: 1200.00,
      categoria: { nome: 'Tecnologia', cor: '#3b82f6' },
      tipo: 'despesa',
      numero_parcelas: 12,
      parcela_atual: 3
    }
  ]);

  // Gerar lista de meses
  const gerarListaMeses = () => {
    const meses = [];
    const hoje = new Date();
    
    for (let i = -3; i <= 3; i++) {
      const data = addMonths(hoje, i);
      const anoMes = format(data, 'yyyy-MM');
      meses.push({
        value: anoMes,
        label: format(data, 'MMMM yyyy', { locale: ptBR }),
        isCurrent: i === 0,
        isPast: i < 0,
        isFuture: i > 0
      });
    }
    return meses;
  };

  const mesesDisponiveis = gerarListaMeses();

  // Navegar entre meses
  const navegarMes = (direcao) => {
    const mesAtualIndex = mesesDisponiveis.findIndex(m => m.value === mesAnoSelecionado);
    const novoIndex = mesAtualIndex + direcao;
    
    if (novoIndex >= 0 && novoIndex < mesesDisponiveis.length) {
      setMesAnoSelecionado(mesesDisponiveis[novoIndex].value);
    }
  };

  // Função para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Renderizar status da fatura
  const renderStatusFatura = () => {
    const hoje = new Date();
    const vencimento = new Date(faturaAtual.fatura_vencimento);
    const diasParaVencimento = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
    
    let status, cor, icone;
    
    if (diasParaVencimento < 0) {
      status = 'Vencida';
      cor = 'status-vencida';
      icone = <AlertCircle size={16} />;
    } else if (diasParaVencimento <= 3) {
      status = 'Vence em breve';
      cor = 'status-urgente';
      icone = <Clock size={16} />;
    } else if (diasParaVencimento <= 7) {
      status = 'Próximo vencimento';
      cor = 'status-atencao';
      icone = <Clock size={16} />;
    } else {
      status = 'Em dia';
      cor = 'status-em-dia';
      icone = <CheckCircle size={16} />;
    }
    
    return (
      <div className={`fatura-status ${cor}`}>
        {icone}
        {status}
      </div>
    );
  };

  // Renderizar resumo da fatura
  const renderResumoFatura = () => {
    return (
      <div className="fatura-content">
        {/* Card principal da fatura */}
        <div className="fatura-card-principal">
          <div className="fatura-card-header">
            <div className="fatura-card-info">
              <div className="fatura-card-icon">
                <CreditCard size={24} />
              </div>
              <div className="fatura-card-details">
                <h2 className="fatura-card-nome">{faturaAtual.cartao_nome}</h2>
                <p className="fatura-card-bandeira">{faturaAtual.cartao_bandeira}</p>
              </div>
            </div>
            {renderStatusFatura()}
          </div>
          
          <div className="fatura-card-valores">
            <div className="fatura-valor-item">
              <p className="fatura-valor-label">Valor da Fatura</p>
              <p className="fatura-valor-principal">{formatCurrency(faturaAtual.valor_total_fatura)}</p>
            </div>
            <div className="fatura-valor-item">
              <p className="fatura-valor-label">Vencimento</p>
              <p className="fatura-valor-secundario">
                {format(new Date(faturaAtual.fatura_vencimento), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="fatura-valor-item">
              <p className="fatura-valor-label">Limite Disponível</p>
              <p className="fatura-valor-secundario">
                {formatCurrency(faturaAtual.limite_disponivel)}
              </p>
            </div>
          </div>

          {/* Barra de progresso do limite */}
          <div className="fatura-limite-progress">
            <div className="fatura-limite-header">
              <span className="fatura-limite-text">Limite utilizado</span>
              <span className="fatura-limite-porcentagem">
                {((faturaAtual.valor_total_fatura / faturaAtual.limite_total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="fatura-progress-bar">
              <div 
                className="fatura-progress-fill"
                style={{ width: `${(faturaAtual.valor_total_fatura / faturaAtual.limite_total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Cards de estatísticas rápidas */}
        <div className="fatura-stats-grid">
          <div className="fatura-stat-card">
            <div className="fatura-stat-content">
              <div className="fatura-stat-icon green">
                <Receipt size={20} />
              </div>
              <div className="fatura-stat-info">
                <p className="fatura-stat-label">Transações</p>
                <p className="fatura-stat-value">{faturaAtual.total_compras}</p>
              </div>
            </div>
          </div>

          <div className="fatura-stat-card">
            <div className="fatura-stat-content">
              <div className="fatura-stat-icon blue">
                <Target size={20} />
              </div>
              <div className="fatura-stat-info">
                <p className="fatura-stat-label">Ticket Médio</p>
                <p className="fatura-stat-value">
                  {formatCurrency(faturaAtual.valor_total_fatura / faturaAtual.total_compras)}
                </p>
              </div>
            </div>
          </div>

          <div className="fatura-stat-card">
            <div className="fatura-stat-content">
              <div className="fatura-stat-icon purple">
                <PieChart size={20} />
              </div>
              <div className="fatura-stat-info">
                <p className="fatura-stat-label">Parcelamentos</p>
                <p className="fatura-stat-value">{faturaAtual.total_parcelas}</p>
              </div>
            </div>
          </div>

          <div className="fatura-stat-card">
            <div className="fatura-stat-content">
              <div className="fatura-stat-icon yellow">
                <Zap size={20} />
              </div>
              <div className="fatura-stat-info">
                <p className="fatura-stat-label">Maior Compra</p>
                <p className="fatura-stat-value">
                  {formatCurrency(Math.max(...transacoesMock.map(t => t.valor)))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar lista de transações
  const renderTransacoes = () => {
    return (
      <div className="fatura-transacoes-container">
        <div className="fatura-transacoes-header">
          <div className="fatura-transacoes-title-section">
            <h3 className="fatura-transacoes-title">
              <Receipt size={20} />
              Transações da Fatura
            </h3>
            <div className="fatura-transacoes-actions">
              <button className="fatura-action-btn secondary">
                <Filter size={16} />
                Filtrar
              </button>
              <button className="fatura-action-btn primary">
                <Download size={16} />
                Exportar
              </button>
            </div>
          </div>
        </div>
        
        <div className="fatura-transacoes-list">
          {transacoesMock.map(transacao => (
            <div key={transacao.id} className="fatura-transacao-item">
              <div className="fatura-transacao-content">
                <div className="fatura-transacao-left">
                  <div 
                    className="fatura-transacao-categoria-icon"
                    style={{ backgroundColor: transacao.categoria.cor }}
                  >
                    {transacao.categoria.nome.charAt(0)}
                  </div>
                  <div className="fatura-transacao-info">
                    <p className="fatura-transacao-descricao">{transacao.descricao}</p>
                    <div className="fatura-transacao-meta">
                      <span className="fatura-transacao-data">
                        {format(new Date(transacao.data), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span 
                        className="fatura-transacao-categoria"
                        style={{
                          backgroundColor: `${transacao.categoria.cor}20`,
                          color: transacao.categoria.cor
                        }}
                      >
                        {transacao.categoria.nome}
                      </span>
                      {transacao.numero_parcelas > 1 && (
                        <span className="fatura-transacao-parcela">
                          {transacao.parcela_atual || 1}/{transacao.numero_parcelas}x
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="fatura-transacao-right">
                  <p className="fatura-transacao-valor">
                    {formatCurrency(transacao.valor)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar estatísticas
  const renderEstatisticas = () => {
    const categorias = transacoesMock.reduce((acc, t) => {
      const categoria = t.categoria.nome;
      if (!acc[categoria]) {
        acc[categoria] = { valor: 0, cor: t.categoria.cor, quantidade: 0 };
      }
      acc[categoria].valor += t.valor;
      acc[categoria].quantidade += 1;
      return acc;
    }, {});

    const categoriasArray = Object.entries(categorias)
      .map(([nome, dados]) => ({ nome, ...dados }))
      .sort((a, b) => b.valor - a.valor);

    return (
      <div className="fatura-estatisticas-container">
        <div className="fatura-categorias-card">
          <h3 className="fatura-categorias-title">
            <PieChart size={20} />
            Gastos por Categoria
          </h3>
          
          <div className="fatura-categorias-list">
            {categoriasArray.map((categoria, index) => {
              const porcentagem = (categoria.valor / faturaAtual.valor_total_fatura) * 100;
              
              return (
                <div key={categoria.nome} className="fatura-categoria-item">
                  <div 
                    className="fatura-categoria-cor"
                    style={{ backgroundColor: categoria.cor }}
                  ></div>
                  <div className="fatura-categoria-content">
                    <div className="fatura-categoria-header">
                      <span className="fatura-categoria-nome">
                        {categoria.nome}
                      </span>
                      <span className="fatura-categoria-valor">
                        {formatCurrency(categoria.valor)} ({porcentagem.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="fatura-categoria-progress">
                      <div 
                        className="fatura-categoria-progress-fill"
                        style={{ 
                          width: `${porcentagem}%`,
                          backgroundColor: categoria.cor 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparação com mês anterior */}
        <div className="fatura-comparacao-card">
          <h3 className="fatura-comparacao-title">
            <TrendingUp size={20} />
            Comparação Mensal
          </h3>
          
          <div className="fatura-comparacao-grid">
            <div className="fatura-comparacao-item green">
              <div className="fatura-comparacao-valor">-12.5%</div>
              <div className="fatura-comparacao-label">vs mês anterior</div>
            </div>
            
            <div className="fatura-comparacao-item blue">
              <div className="fatura-comparacao-valor">+3</div>
              <div className="fatura-comparacao-label">transações a mais</div>
            </div>
            
            <div className="fatura-comparacao-item purple">
              <div className="fatura-comparacao-valor">{formatCurrency(356.20)}</div>
              <div className="fatura-comparacao-label">economia</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="faturas-page">
      {/* Header */}
      <div className="faturas-header">
        <div className="faturas-header-content">
          <div className="faturas-header-inner">
            <div className="faturas-title-section">
              <div className="faturas-title-content">
                <h1 className="faturas-title">
                  <CreditCard className="faturas-title-icon" size={32} />
                  Faturas do Cartão
                </h1>
                <p className="faturas-subtitle">
                  Gerencie e acompanhe suas faturas de cartão de crédito
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="faturas-filters">
        <div className="faturas-filters-card">
          <div className="faturas-filters-content">
            <div className="faturas-filters-row">
              {/* Seletor de Cartão */}
              <div className="faturas-filter-group">
                <label className="faturas-filter-label">
                  Cartão
                </label>
                <select
                  value={cartaoSelecionado}
                  onChange={(e) => setCartaoSelecionado(e.target.value)}
                  className="faturas-filter-select"
                >
                  <option value="">Todos os cartões</option>
                  {cartoes.map(cartao => (
                    <option key={cartao.id} value={cartao.id}>
                      {cartao.nome} ({cartao.bandeira})
                    </option>
                  ))}
                </select>
              </div>

              {/* Navegação de Mês */}
              <div className="faturas-filter-group">
                <label className="faturas-filter-label">
                  Período
                </label>
                <div className="faturas-period-nav">
                  <button
                    onClick={() => navegarMes(-1)}
                    className="faturas-period-btn"
                    disabled={mesesDisponiveis.findIndex(m => m.value === mesAnoSelecionado) === 0}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <select
                    value={mesAnoSelecionado}
                    onChange={(e) => setMesAnoSelecionado(e.target.value)}
                    className="faturas-filter-select period-select"
                  >
                    {mesesDisponiveis.map(mes => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label} {mes.isCurrent && '(Atual)'}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => navegarMes(1)}
                    className="faturas-period-btn"
                    disabled={mesesDisponiveis.findIndex(m => m.value === mesAnoSelecionado) === mesesDisponiveis.length - 1}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="faturas-tabs">
          <div className="faturas-tabs-nav">
            <button
              onClick={() => setAbaAtiva('resumo')}
              className={`faturas-tab ${abaAtiva === 'resumo' ? 'active' : ''}`}
            >
              <CreditCard className="faturas-tab-icon" size={16} />
              Resumo
            </button>
            <button
              onClick={() => setAbaAtiva('transacoes')}
              className={`faturas-tab ${abaAtiva === 'transacoes' ? 'active' : ''}`}
            >
              <Receipt className="faturas-tab-icon" size={16} />
              Transações
            </button>
            <button
              onClick={() => setAbaAtiva('estatisticas')}
              className={`faturas-tab ${abaAtiva === 'estatisticas' ? 'active' : ''}`}
            >
              <BarChart3 className="faturas-tab-icon" size={16} />
              Estatísticas
            </button>
          </div>
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {abaAtiva === 'resumo' && renderResumoFatura()}
        {abaAtiva === 'transacoes' && renderTransacoes()}
        {abaAtiva === 'estatisticas' && renderEstatisticas()}
      </div>
    </div>
  );
};

export default FaturasCartaoPage;