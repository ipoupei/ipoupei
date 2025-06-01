// src/pages/TransacoesPage.jsx - Versão com Filtro de Período Próprio
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Search, Filter, RefreshCw, 
  ArrowUp, ArrowDown, ArrowLeftRight, 
  Activity, CreditCard, Wallet,
  Edit, Trash2, CheckCircle, Clock,
  Plus, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';

// Hooks (usando os existentes)
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/uiStore';
import usePeriodo from '../hooks/usePeriodo';

// Utilitários
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabaseClient';

// Modais
import ReceitasModal from '../components/ReceitasModal';
import DespesasModal from '../components/DespesasModal';
import DespesasCartaoModal from '../components/DespesasCartaoModal';
import TransferenciasModal from '../components/TransferenciasModal';

// Estilos
import './TransacoesPage.css';

/**
 * Página de Transações COMPLETA 
 * ✅ Adiciona seletor de período próprio (independente do MainLayout)
 * ✅ Remove botões de ação duplicados
 * ✅ Remove cards de resumo duplicados
 * ✅ Mantém funcionalidade de edição
 */
const TransacoesPage = () => {
  const { user } = useAuth();
  const { showNotification } = useUIStore();
  
  // Hook de período próprio para esta página
  const {
    currentDate,
    navigateMonth,
    getFormattedPeriod,
    isCurrentMonth,
    goToToday,
    getDateRange
  } = usePeriodo();
  
  // Estados para dados (usando dados das views do banco)
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);

  // Estados essenciais
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados dos modais
  const [modals, setModals] = useState({
    receitas: false,
    despesas: false,
    despesasCartao: false,
    transferencias: false
  });

  // Estado para edição
  const [transacaoEditando, setTransacaoEditando] = useState(null);

  // Estados para período personalizado
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Filtros
  const [filters, setFilters] = useState({
    tipo: 'todas',
    categoriaId: '',
    contaId: '',
    cartaoId: '',
    ordenacao: 'data_desc'
  });

  // Buscar dados básicos usando as tabelas otimizadas
  const fetchBasicData = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('📊 Buscando dados básicos...');

      // Buscar categorias ativas
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('id, nome, cor, tipo')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      // Buscar contas ativas  
      const { data: contasData } = await supabase
        .from('contas')
        .select('id, nome, tipo, saldo')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      // Buscar cartões ativos
      const { data: cartoesData } = await supabase
        .from('cartoes')
        .select('id, nome, bandeira')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      setCategorias(categoriasData || []);
      setContas(contasData || []);
      setCartoes(cartoesData || []);

      console.log('✅ Dados básicos carregados:', {
        categorias: categoriasData?.length || 0,
        contas: contasData?.length || 0,
        cartoes: cartoesData?.length || 0
      });

    } catch (error) {
      console.error('❌ Erro ao buscar dados básicos:', error);
    }
  }, [user?.id]);

  // Função para buscar transações do período selecionado
  const fetchTransacoes = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔍 Buscando transações do período...');
      
      let dataInicioBusca, dataFimBusca;
      
      if (periodoPersonalizado && dataInicio && dataFim) {
        // Usar período personalizado
        dataInicioBusca = dataInicio;
        dataFimBusca = dataFim;
      } else {
        // Usar período do hook usePeriodo
        const dateRange = getDateRange();
        dataInicioBusca = format(dateRange.inicio, 'yyyy-MM-dd');
        dataFimBusca = format(dateRange.fim, 'yyyy-MM-dd');
      }
      
      console.log('📅 Período:', { dataInicioBusca, dataFimBusca });
      
      // Buscar transações do período
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          id, descricao, valor, data, tipo, observacoes,
          categoria_id, conta_id, cartao_id, efetivado,
          transferencia, parcela_atual, total_parcelas,
          grupo_parcelamento, fatura_vencimento,
          created_at, updated_at
        `)
        .eq('usuario_id', user.id)
        .gte('data', dataInicioBusca)
        .lte('data', dataFimBusca)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enriquecer dados com informações de categoria, conta e cartão
      const enrichedData = (data || []).map(transacao => ({
        ...transacao,
        categoria: categorias.find(c => c.id === transacao.categoria_id),
        conta: contas.find(c => c.id === transacao.conta_id),
        cartao: cartoes.find(c => c.id === transacao.cartao_id)
      }));

      setTransacoes(enrichedData);
      console.log('✅ Transações carregadas:', enrichedData.length);

    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      showNotification('Erro ao carregar transações: ' + error.message, 'error');
      setTransacoes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, categorias, contas, cartoes, showNotification, getDateRange, periodoPersonalizado, dataInicio, dataFim]);

  // Filtrar transações localmente
  const filteredTransacoes = useMemo(() => {
    let result = [...transacoes];

    // Filtro de tipo
    if (filters.tipo !== 'todas') {
      result = result.filter(t => t.tipo === filters.tipo);
    }

    // Filtro de categoria
    if (filters.categoriaId) {
      result = result.filter(t => t.categoria_id === filters.categoriaId);
    }

    // Filtro de conta
    if (filters.contaId) {
      result = result.filter(t => t.conta_id === filters.contaId);
    }

    // Filtro de cartão
    if (filters.cartaoId) {
      result = result.filter(t => t.cartao_id === filters.cartaoId);
    }

    // Busca textual
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.descricao?.toLowerCase().includes(termo) ||
        t.observacoes?.toLowerCase().includes(termo) ||
        t.categoria?.nome?.toLowerCase().includes(termo) ||
        t.conta?.nome?.toLowerCase().includes(termo) ||
        t.cartao?.nome?.toLowerCase().includes(termo)
      );
    }

    // Ordenação
    const [campo, direcao] = filters.ordenacao.split('_');
    result.sort((a, b) => {
      let aVal = a[campo];
      let bVal = b[campo];
      
      if (campo === 'data') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (direcao === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [transacoes, filters, searchTerm]);

  // Carregar dados inicial
  useEffect(() => {
    if (user?.id) {
      fetchBasicData();
    }
  }, [fetchBasicData]);

  // Carregar transações quando o período mudar ou dados básicos estiverem prontos
  useEffect(() => {
    if (user?.id && categorias.length > 0) {
      fetchTransacoes();
    }
  }, [fetchTransacoes, user?.id, categorias.length, currentDate, periodoPersonalizado, dataInicio, dataFim]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      tipo: 'todas',
      categoriaId: '',
      contaId: '',
      cartaoId: '',
      ordenacao: 'data_desc'
    });
    setSearchTerm('');
    setPeriodoPersonalizado(false);
    setDataInicio('');
    setDataFim('');
  };

  // Handlers para período personalizado
  const handleTogglePeriodoPersonalizado = () => {
    setPeriodoPersonalizado(!periodoPersonalizado);
    if (!periodoPersonalizado) {
      // Ao ativar, definir período padrão
      const dateRange = getDateRange();
      setDataInicio(format(dateRange.inicio, 'yyyy-MM-dd'));
      setDataFim(format(dateRange.fim, 'yyyy-MM-dd'));
    }
  };

  const handleAplicarPeriodoPersonalizado = () => {
    if (dataInicio && dataFim) {
      if (new Date(dataInicio) > new Date(dataFim)) {
        showNotification('Data de início deve ser anterior à data final', 'error');
        return;
      }
      fetchTransacoes();
    }
  };

  // Função para obter o texto do período atual
  const getPeriodoTexto = () => {
    if (periodoPersonalizado && dataInicio && dataFim) {
      const inicio = format(new Date(dataInicio), 'dd/MM/yyyy');
      const fim = format(new Date(dataFim), 'dd/MM/yyyy');
      return `${inicio} - ${fim}`;
    }
    return getFormattedPeriod();
  };

  // Handler para abrir modais
  const handleOpenModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const handleCloseModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    setTransacaoEditando(null);
  };

  const handleSaveModal = () => {
    fetchTransacoes(); // Recarrega transações
  };

  // Editar transação
  const handleEditTransacao = useCallback((transacao) => {
    console.log('🖊️ Editando transação:', transacao);
    
    setTransacaoEditando(transacao);
    
    // Determina qual modal abrir baseado no tipo/características da transação
    if (transacao.tipo === 'receita') {
      handleOpenModal('receitas');
    } else if (transacao.tipo === 'despesa') {
      if (transacao.cartao_id) {
        handleOpenModal('despesasCartao');
      } else if (transacao.transferencia) {
        showNotification('Edição de transferências será implementada em breve', 'info');
        return;
      } else {
        handleOpenModal('despesas');
      }
    } else if (transacao.tipo === 'transferencia' || transacao.transferencia) {
      handleOpenModal('transferencias');
    }
  }, [showNotification]);

  const handleDeleteTransacao = async (transacaoId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transacaoId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      showNotification('Transação excluída com sucesso!', 'success');
      fetchTransacoes();
    } catch (error) {
      console.error('❌ Erro ao excluir transação:', error);
      showNotification('Erro ao excluir transação', 'error');
    }
  };

  const handleMarkAsCompleted = async (transacaoId) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .update({ efetivado: true })
        .eq('id', transacaoId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      showNotification('Transação marcada como efetivada!', 'success');
      fetchTransacoes();
      
    } catch (error) {
      console.error('❌ Erro ao efetivar transação:', error);
      showNotification('Erro ao efetivar transação', 'error');
    }
  };

  // Ícones helper
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'receita': return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'despesa': return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'transferencia': return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (efetivada) => {
    return efetivada ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <Clock className="w-4 h-4 text-orange-600" />;
  };

  return (
    <div className="transacoes-page">
      
      {/* Header com Seletor de Período Próprio */}
      <div className="page-header">
        <div className="header-title">
          <h1>Transações</h1>
          <p>Gerencie suas receitas, despesas e transferências</p>
        </div>

        {/* ✅ NOVO: Seletor de Período com Opção Personalizada */}
        <div className="period-selector-container">
          <div className="period-type-toggle">
            <button
              className={`period-toggle-btn ${!periodoPersonalizado ? 'active' : ''}`}
              onClick={() => setPeriodoPersonalizado(false)}
            >
              Por Mês
            </button>
            <button
              className={`period-toggle-btn ${periodoPersonalizado ? 'active' : ''}`}
              onClick={handleTogglePeriodoPersonalizado}
            >
              Personalizado
            </button>
          </div>

          {!periodoPersonalizado ? (
            <div className="period-selector-inline">
              <button 
                className="period-nav"
                onClick={() => navigateMonth(-1)}
                title="Mês anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="current-period-inline">
                <Calendar size={16} />
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
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="custom-period-selector">
              <div className="date-inputs">
                <div className="date-input-group">
                  <label>De:</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>Até:</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="date-input"
                  />
                </div>
                <button
                  onClick={handleAplicarPeriodoPersonalizado}
                  className="apply-period-btn"
                  disabled={!dataInicio || !dataFim}
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <Search className="search-icon" />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>

          <button
            onClick={fetchTransacoes}
            className="refresh-btn"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="main-content">
        {/* Filtros Laterais */}
        {showFilters && (
          <div className="filters-sidebar">
            <div className="filters-header">
              <h3 className="filters-title">Filtros</h3>
              <button onClick={handleClearFilters} className="btn-clear-filters">
                Limpar
              </button>
            </div>

            <div className="filters-content">
              {/* Tipo */}
              <div className="filter-group">
                <label className="filter-label">Tipo</label>
                <select
                  value={filters.tipo}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                  className="filter-select"
                >
                  <option value="todas">Todas</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                  <option value="transferencia">Transferências</option>
                </select>
              </div>

              {/* Categoria */}
              <div className="filter-group">
                <label className="filter-label">Categoria</label>
                <select
                  value={filters.categoriaId}
                  onChange={(e) => handleFilterChange('categoriaId', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conta */}
              <div className="filter-group">
                <label className="filter-label">Conta</label>
                <select
                  value={filters.contaId}
                  onChange={(e) => handleFilterChange('contaId', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todas as contas</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cartão */}
              <div className="filter-group">
                <label className="filter-label">Cartão</label>
                <select
                  value={filters.cartaoId}
                  onChange={(e) => handleFilterChange('cartaoId', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos os cartões</option>
                  {cartoes.map(cartao => (
                    <option key={cartao.id} value={cartao.id}>
                      {cartao.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordenação */}
              <div className="filter-group">
                <label className="filter-label">Ordenar por</label>
                <select
                  value={filters.ordenacao}
                  onChange={(e) => handleFilterChange('ordenacao', e.target.value)}
                  className="filter-select"
                >
                  <option value="data_desc">Data (mais recente)</option>
                  <option value="data_asc">Data (mais antiga)</option>
                  <option value="valor_desc">Valor (maior)</option>
                  <option value="valor_asc">Valor (menor)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Transações */}
        <div className="transactions-list">
          <div className="list-header">
            <span className="results-count">
              {loading ? 'Carregando...' : `${filteredTransacoes.length} transações em ${getPeriodoTexto()}`}
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p>Carregando transações...</p>
            </div>
          ) : filteredTransacoes.length === 0 ? (
            <div className="empty-state">
              <Activity className="w-12 h-12 text-gray-400" />
              <h3>Nenhuma transação encontrada</h3>
              <p>Não há transações no período selecionado ({getPeriodoTexto()})</p>
              <div className="empty-actions">
                <button 
                  onClick={() => handleOpenModal('receitas')}
                  className="empty-action-btn receitas"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Receita
                </button>
                <button 
                  onClick={() => handleOpenModal('despesas')}
                  className="empty-action-btn despesas"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Despesa
                </button>
              </div>
            </div>
          ) : (
            <div className="transactions-grid">
              {filteredTransacoes.map((transacao) => (
                <div key={transacao.id} className="transaction-item">
                  <div className="transaction-main">
                    <div className="transaction-left">
                      <div className="transaction-icon">
                        {getTipoIcon(transacao.tipo)}
                      </div>
                      <div className="transaction-info">
                        <div className="transaction-description">
                          {transacao.descricao}
                        </div>
                        <div className="transaction-details">
                          {(transacao.categoria?.nome) && (
                            <span 
                              className="category-tag" 
                              style={{ 
                                backgroundColor: `${transacao.categoria?.cor || '#6B7280'}20`, 
                                color: transacao.categoria?.cor || '#6B7280'
                              }}
                            >
                              {transacao.categoria?.nome}
                            </span>
                          )}
                          <span className="account-info">
                            {transacao.cartao?.nome ? (
                              <>
                                <CreditCard className="w-3 h-3" />
                                {transacao.cartao?.nome}
                              </>
                            ) : (
                              <>
                                <Wallet className="w-3 h-3" />
                                {transacao.conta?.nome || 'Conta'}
                              </>
                            )}
                          </span>
                          {transacao.total_parcelas > 1 && (
                            <span className="parcela-info">
                              {transacao.parcela_atual}/{transacao.total_parcelas}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="transaction-right">
                      <div className="transaction-value">
                        <span className={`value ${transacao.tipo === 'receita' ? 'positive' : 'negative'}`}>
                          {transacao.tipo === 'receita' ? '+' : '-'}
                          {formatCurrency(transacao.valor)}
                        </span>
                        <div className="transaction-meta">
                          <span className="transaction-date">
                            {transacao.data ? format(new Date(transacao.data), 'dd/MM/yyyy') : 'Sem data'}
                          </span>
                          <span className="transaction-status">
                            {getStatusIcon(transacao.efetivado)}
                          </span>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="transaction-actions">
                        <button
                          onClick={() => handleEditTransacao(transacao)}
                          className="action-btn edit"
                          title="Editar transação"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {!transacao.efetivado && (
                          <button
                            onClick={() => handleMarkAsCompleted(transacao.id)}
                            className="action-btn complete"
                            title="Marcar como efetivada"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteTransacao(transacao.id)}
                          className="action-btn delete"
                          title="Excluir transação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {transacao.observacoes && (
                    <div className="transaction-notes">
                      {transacao.observacoes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais com suporte à edição */}
      <ReceitasModal 
        isOpen={modals.receitas} 
        onClose={() => handleCloseModal('receitas')} 
        onSave={handleSaveModal}
        transacaoEditando={transacaoEditando}
      />
      
      <DespesasModal 
        isOpen={modals.despesas} 
        onClose={() => handleCloseModal('despesas')} 
        onSave={handleSaveModal}
        transacaoEditando={transacaoEditando}
      />
      
      <DespesasCartaoModal 
        isOpen={modals.despesasCartao} 
        onClose={() => handleCloseModal('despesasCartao')} 
        onSave={handleSaveModal}
        transacaoEditando={transacaoEditando}
      />
      
      <TransferenciasModal 
        isOpen={modals.transferencias} 
        onClose={() => handleCloseModal('transferencias')} 
        onSave={handleSaveModal}
        transacaoEditando={transacaoEditando}
      />
    </div>
  );
};

export default TransacoesPage;