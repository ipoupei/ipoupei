// src/pages/TransacoesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, Filter, Download, RefreshCw, Plus, 
  ArrowUp, ArrowDown, ArrowLeftRight, Calendar,
  TrendingUp, TrendingDown, Activity, CreditCard,
  Eye, EyeOff, MoreVertical, Edit, Trash2, CheckCircle,
  X, ChevronDown, ChevronUp, Wallet, DollarSign, Clock,
  Home
} from 'lucide-react';

// Hooks
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import useTransacoes from '../hooks/useTransacoes';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';
import useCartoes from '../hooks/useCartoes';

// Componentes
import EditTransacaoModal from '../Components/EditTransacaoModal';
import DespesasModal from '../Components/DespesasModal';
import ReceitasModal from '../Components/ReceitasModal';
import TransferenciasModal from '../Components/TransferenciasModal';
import ContasModal from '../Components/ContasModal';
import DespesasCartaoModal from '../Components/DespesasCartaoModal';
import NotificationContainer from '../Components/NotificationContainer';

// Utilitários
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabaseClient';

// Estilos
import './TransacoesPage.css';

/**
 * Página principal de transações com filtros avançados e visualização completa
 */
const TransacoesPage = () => {
  const { user } = useAuthStore();
  const { showNotification, modals, openModal, closeModal } = useUIStore();
  
  // Hooks para dados
  const { transacoes, loading: transacoesLoading, fetchTransacoes } = useTransacoes();
  const { categorias } = useCategorias();
  const { contas } = useContas();
  const { cartoes } = useCartoes();

  // Estados principais
  const [filteredTransacoes, setFilteredTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [agruparFaturas, setAgruparFaturas] = useState(false);
  const [currentTransacao, setCurrentTransacao] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState({
    periodoInicio: startOfMonth(new Date()),
    periodoFim: endOfMonth(new Date()),
    tipo: 'todas', // 'todas', 'receita', 'despesa', 'transferencia'
    efetivada: null, // null = todas, true = efetivadas, false = pendentes
    categoriaId: '',
    subcategoriaId: '',
    contaId: '',
    cartaoId: '',
    valorMin: '',
    valorMax: '',
    ordenacao: 'data_desc' // 'data_asc', 'data_desc', 'valor_asc', 'valor_desc'
  });

  // Função para agrupar transações por fatura
  const agruparTransacoesPorFatura = (transacoes) => {
    const faturasMap = new Map();
    const transacoesIndividuais = [];

    transacoes.forEach(transacao => {
      if (transacao.cartao_id && transacao.fatura_vencimento) {
        const chave = `${transacao.cartao_id}_${transacao.fatura_vencimento}`;
        
        if (!faturasMap.has(chave)) {
          faturasMap.set(chave, {
            id: `fatura_${chave}`,
            tipo: 'despesa',
            descricao: `Fatura ${transacao.cartao?.nome || 'Cartão'} - ${format(parseISO(transacao.fatura_vencimento), 'dd/MM/yyyy')}`,
            valor: 0,
            data: transacao.fatura_vencimento,
            efetivada: false,
            cartao_id: transacao.cartao_id,
            cartao: transacao.cartao,
            categoria: { nome: 'Cartão de Crédito', cor: '#8B5CF6' },
            isFaturaAgrupada: true,
            transacoesAgrupadas: []
          });
        }

        const fatura = faturasMap.get(chave);
        fatura.valor += transacao.valor;
        fatura.transacoesAgrupadas.push(transacao);
      } else {
        transacoesIndividuais.push(transacao);
      }
    });

    return [...transacoesIndividuais, ...Array.from(faturasMap.values())];
  };

  // Buscar transações filtradas - CORRIGIDO
  const fetchFilteredTransacoes = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Buscando transações com filtros:', filters);
      
      let query = supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias(id, nome, cor, tipo),
          subcategoria:subcategorias(id, nome),
          conta:contas(id, nome, tipo),
          cartao:cartoes(id, nome, bandeira)
        `)
        .eq('usuario_id', user.id); // IMPORTANTE: Filtrar por usuário

      // Aplicar filtros de data
      if (filters.periodoInicio) {
        const dataInicio = format(filters.periodoInicio, 'yyyy-MM-dd');
        query = query.gte('data', dataInicio);
      }
      
      if (filters.periodoFim) {
        const dataFim = format(filters.periodoFim, 'yyyy-MM-dd');
        query = query.lte('data', dataFim);
      }

      // Filtros opcionais
      if (filters.tipo !== 'todas') {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters.efetivada !== null) {
        query = query.eq('efetivada', filters.efetivada);
      }

      if (filters.categoriaId) {
        query = query.eq('categoria_id', filters.categoriaId);
      }

      if (filters.subcategoriaId) {
        query = query.eq('subcategoria_id', filters.subcategoriaId);
      }

      if (filters.contaId) {
        query = query.eq('conta_id', filters.contaId);
      }

      if (filters.cartaoId) {
        query = query.eq('cartao_id', filters.cartaoId);
      }

      // Aplicar busca textual
      if (searchTerm.trim()) {
        query = query.or(`descricao.ilike.%${searchTerm}%,observacoes.ilike.%${searchTerm}%`);
      }

      // Aplicar ordenação
      const [campo, direcao] = filters.ordenacao.split('_');
      query = query.order(campo, { ascending: direcao === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }

      console.log(`✅ Encontradas ${data?.length || 0} transações`);

      let result = data || [];

      // Filtrar por valor se especificado
      if (filters.valorMin || filters.valorMax) {
        result = result.filter(t => {
          const valor = t.valor || 0;
          const min = filters.valorMin ? parseFloat(filters.valorMin) : 0;
          const max = filters.valorMax ? parseFloat(filters.valorMax) : Infinity;
          return valor >= min && valor <= max;
        });
      }

      // Agrupar faturas se necessário
      if (agruparFaturas) {
        result = agruparTransacoesPorFatura(result);
      }

      setFilteredTransacoes(result);

    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      showNotification('Erro ao carregar transações: ' + error.message, 'error');
      setFilteredTransacoes([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, agruparFaturas, user?.id, showNotification]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const receitas = filteredTransacoes.filter(t => t.tipo === 'receita');
    const despesas = filteredTransacoes.filter(t => t.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((acc, t) => acc + (t.valor || 0), 0);
    const totalDespesas = despesas.reduce((acc, t) => acc + (t.valor || 0), 0);
    const saldo = totalReceitas - totalDespesas;
    const totalTransacoes = filteredTransacoes.length;

    return {
      totalReceitas,
      totalDespesas,
      saldo,
      totalTransacoes
    };
  }, [filteredTransacoes]);

  // Subcategorias filtradas
  const subcategoriasFiltradas = useMemo(() => {
    if (!filters.categoriaId) return [];
    const categoria = categorias.find(c => c.id === filters.categoriaId);
    return categoria?.subcategorias || [];
  }, [categorias, filters.categoriaId]);

  // Carregar dados inicial
  useEffect(() => {
    if (user?.id) {
      fetchFilteredTransacoes();
    }
  }, [fetchFilteredTransacoes, user?.id]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'categoriaId' ? { subcategoriaId: '' } : {})
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      periodoInicio: startOfMonth(new Date()),
      periodoFim: endOfMonth(new Date()),
      tipo: 'todas',
      efetivada: null,
      categoriaId: '',
      subcategoriaId: '',
      contaId: '',
      cartaoId: '',
      valorMin: '',
      valorMax: '',
      ordenacao: 'data_desc'
    });
    setSearchTerm('');
  };

  const handleEditTransacao = (transacao) => {
    setCurrentTransacao(transacao);
    if (transacao.tipo === 'receita') {
      openModal('receitas');
    } else if (transacao.tipo === 'transferencia') {
      openModal('transferencias');
    } else {
      openModal('despesas');
    }
  };

  const handleDeleteTransacao = async (transacaoId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transacaoId);

      if (error) throw error;

      showNotification('Transação excluída com sucesso!', 'success');
      fetchFilteredTransacoes();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      showNotification('Erro ao excluir transação', 'error');
    }
  };

  const handleMarkAsCompleted = async (transacaoId) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .update({ efetivada: true })
        .eq('id', transacaoId);

      if (error) throw error;

      showNotification('Transação marcada como efetivada!', 'success');
      fetchFilteredTransacoes();
    } catch (error) {
      console.error('Erro ao efetivar transação:', error);
      showNotification('Erro ao efetivar transação', 'error');
    }
  };

  const handleExportData = () => {
    // TODO: Implementar exportação
    showNotification('Funcionalidade em desenvolvimento', 'info');
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'receita':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'despesa':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'transferencia':
        return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (efetivada) => {
    return efetivada ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <Clock className="w-4 h-4 text-orange-600" />;
  };

  // Handler para salvar transação e atualizar lista
  const handleTransacaoSalva = () => {
    fetchFilteredTransacoes();
    showNotification('Transação salva com sucesso!', 'success');
  };

  return (
    <div className="transacoes-page">
      {/* Header */}
      <div className="transacoes-header">
        <div className="header-content">
          <div className="header-left">
            <div className="page-navigation">
              <button
                onClick={handleGoToDashboard}
                className="btn-back"
                title="Voltar ao Dashboard"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>
            <h1 className="page-title">Transações</h1>
            <p className="page-subtitle">
              {format(filters.periodoInicio, 'dd MMM', { locale: ptBR })} - {' '}
              {format(filters.periodoFim, 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>

          <div className="header-actions">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-filter ${showFilters ? 'active' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            <button
              onClick={fetchFilteredTransacoes}
              className="btn-refresh"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportData}
              className="btn-export"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>

            <button
              onClick={() => setShowMobileFilters(true)}
              className="btn-mobile-filter md:hidden"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Ações Rápidas */}
      <div className="quick-actions-bar">
        <div className="quick-actions-content">
          <div className="quick-actions-title">
            <Plus className="w-4 h-4" />
            <span>Adicionar Transação</span>
          </div>
          <div className="quick-actions-buttons">
            <button
              onClick={() => openModal('receitas')}
              className="quick-action-btn receita"
              title="Nova Receita"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Receita</span>
            </button>

            <button
              onClick={() => openModal('despesas')}
              className="quick-action-btn despesa"
              title="Nova Despesa"
            >
              <ArrowDown className="w-4 h-4" />
              <span>Despesa</span>
            </button>

            <button
              onClick={() => openModal('despesasCartao')}
              className="quick-action-btn cartao"
              title="Compra no Cartão"
            >
              <CreditCard className="w-4 h-4" />
              <span>Cartão</span>
            </button>

            <button
              onClick={() => openModal('transferencias')}
              className="quick-action-btn transferencia"
              title="Transferência"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transferir</span>
            </button>

            <button
              onClick={() => openModal('contas')}
              className="quick-action-btn conta"
              title="Gerenciar Contas"
            >
              <Wallet className="w-4 h-4" />
              <span>Contas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="summary-cards">
        <div className="summary-card receitas">
          <div className="card-icon">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="card-content">
            <div className="card-label">Receitas</div>
            <div className="card-value">{formatCurrency(estatisticas.totalReceitas)}</div>
          </div>
        </div>

        <div className="summary-card despesas">
          <div className="card-icon">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="card-content">
            <div className="card-label">Despesas</div>
            <div className="card-value">{formatCurrency(estatisticas.totalDespesas)}</div>
          </div>
        </div>

        <div className={`summary-card saldo ${estatisticas.saldo >= 0 ? 'positive' : 'negative'}`}>
          <div className="card-icon">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="card-content">
            <div className="card-label">Saldo</div>
            <div className="card-value">{formatCurrency(estatisticas.saldo)}</div>
          </div>
        </div>

        <div className="summary-card transacoes">
          <div className="card-icon">
            <Activity className="w-6 h-6" />
          </div>
          <div className="card-content">
            <div className="card-label">Transações</div>
            <div className="card-value">{estatisticas.totalTransacoes}</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Filtros Laterais */}
        {showFilters && (
          <div className="filters-sidebar">
            <div className="filters-header">
              <h3 className="filters-title">Filtros</h3>
              <button
                onClick={handleClearFilters}
                className="btn-clear-filters"
              >
                Limpar
              </button>
            </div>

            <div className="filters-content">
              {/* Período */}
              <div className="filter-group">
                <label className="filter-label">Período</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={format(filters.periodoInicio, 'yyyy-MM-dd')}
                    onChange={(e) => handleFilterChange('periodoInicio', new Date(e.target.value))}
                    className="date-input"
                  />
                  <input
                    type="date"
                    value={format(filters.periodoFim, 'yyyy-MM-dd')}
                    onChange={(e) => handleFilterChange('periodoFim', new Date(e.target.value))}
                    className="date-input"
                  />
                </div>
              </div>

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

              {/* Status */}
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  value={filters.efetivada === null ? 'todas' : filters.efetivada ? 'efetivadas' : 'pendentes'}
                  onChange={(e) => {
                    const value = e.target.value === 'todas' ? null : e.target.value === 'efetivadas';
                    handleFilterChange('efetivada', value);
                  }}
                  className="filter-select"
                >
                  <option value="todas">Todas</option>
                  <option value="efetivadas">Efetivadas</option>
                  <option value="pendentes">Pendentes</option>
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

              {/* Subcategoria */}
              {subcategoriasFiltradas.length > 0 && (
                <div className="filter-group">
                  <label className="filter-label">Subcategoria</label>
                  <select
                    value={filters.subcategoriaId}
                    onChange={(e) => handleFilterChange('subcategoriaId', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Todas as subcategorias</option>
                    {subcategoriasFiltradas.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {/* Valor */}
              <div className="filter-group">
                <label className="filter-label">Valor</label>
                <div className="value-inputs">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.valorMin}
                    onChange={(e) => handleFilterChange('valorMin', e.target.value)}
                    className="value-input"
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.valorMax}
                    onChange={(e) => handleFilterChange('valorMax', e.target.value)}
                    className="value-input"
                  />
                </div>
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

              {/* Agrupar Faturas */}
              <div className="filter-group">
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={agruparFaturas}
                    onChange={(e) => setAgruparFaturas(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Agrupar faturas de cartão
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Transações */}
        <div className="transactions-list">
          <div className="list-header">
            <div className="list-options">
              <span className="results-count">
                {loading ? 'Carregando...' : `${filteredTransacoes.length} transação${filteredTransacoes.length !== 1 ? 'ões' : ''}`}
              </span>
              
              {cartoes.length > 0 && (
                <button
                  onClick={() => setAgruparFaturas(!agruparFaturas)}
                  className={`btn-toggle ${agruparFaturas ? 'active' : ''}`}
                >
                  {agruparFaturas ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {agruparFaturas ? 'Ver individuais' : 'Agrupar faturas'}
                </button>
              )}
            </div>
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
              <p>Tente ajustar os filtros ou adicionar novas transações</p>
              <div className="empty-state-actions">
                <button
                  onClick={() => openModal('receitas')}
                  className="empty-action-btn receita"
                >
                  <ArrowUp className="w-4 h-4" />
                  Adicionar Receita
                </button>
                <button
                  onClick={() => openModal('despesas')}
                  className="empty-action-btn despesa"
                >
                  <ArrowDown className="w-4 h-4" />
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
                          {transacao.isFaturaAgrupada && (
                            <span className="fatura-badge">
                              <CreditCard className="w-3 h-3" />
                              {transacao.transacoesAgrupadas?.length || 0} itens
                            </span>
                          )}
                        </div>
                        <div className="transaction-details">
                          {transacao.categoria && (
                            <span className="category-tag" style={{ backgroundColor: `${transacao.categoria.cor}20`, color: transacao.categoria.cor }}>
                              {transacao.categoria.nome}
                            </span>
                          )}
                          <span className="account-info">
                            {transacao.cartao ? (
                              <>
                                <CreditCard className="w-3 h-3" />
                                {transacao.cartao.nome}
                              </>
                            ) : (
                              <>
                                <Wallet className="w-3 h-3" />
                                {transacao.conta?.nome || 'Conta'}
                              </>
                            )}
                          </span>
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
                            {getStatusIcon(transacao.efetivada)}
                          </span>
                        </div>
                      </div>

                      {!transacao.isFaturaAgrupada && (
                        <div className="transaction-actions">
                          <button
                            onClick={() => handleEditTransacao(transacao)}
                            className="action-btn edit"
                            title="Editar transação"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {!transacao.efetivada && (
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
                      )}
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

      {/* Modais */}
      <DespesasModal
        isOpen={modals.despesas}
        onClose={() => {
          closeModal('despesas');
          setCurrentTransacao(null);
        }}
        transacaoInicial={currentTransacao}
        modo="edicao"
        onSave={handleTransacaoSalva}
      />

      <ReceitasModal
        isOpen={modals.receitas}
        onClose={() => {
          closeModal('receitas');
          setCurrentTransacao(null);
        }}
        transacaoInicial={currentTransacao}
        modo="edicao"
        onSave={handleTransacaoSalva}
      />

      <TransferenciasModal
        isOpen={modals.transferencias}
        onClose={() => {
          closeModal('transferencias');
          setCurrentTransacao(null);
        }}
        transacaoInicial={currentTransacao}
        modo="edicao"
        onSave={handleTransacaoSalva}
      />

      <ContasModal
        isOpen={modals.contas}
        onClose={() => closeModal('contas')}
      />

      <DespesasCartaoModal
        isOpen={modals.despesasCartao}
        onClose={() => closeModal('despesasCartao')}
        onSave={handleTransacaoSalva}
      />

      {/* Filtros Mobile */}
      {showMobileFilters && (
        <div className="mobile-filters-overlay">
          <div className="mobile-filters-content">
            <div className="mobile-filters-header">
              <h3>Filtros</h3>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="close-mobile-filters"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mobile-filters-body">
              {/* Período */}
              <div className="filter-group">
                <label className="filter-label">Período</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={format(filters.periodoInicio, 'yyyy-MM-dd')}
                    onChange={(e) => handleFilterChange('periodoInicio', new Date(e.target.value))}
                    className="date-input"
                  />
                  <input
                    type="date"
                    value={format(filters.periodoFim, 'yyyy-MM-dd')}
                    onChange={(e) => handleFilterChange('periodoFim', new Date(e.target.value))}
                    className="date-input"
                  />
                </div>
              </div>

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

              {/* Status */}
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  value={filters.efetivada === null ? 'todas' : filters.efetivada ? 'efetivadas' : 'pendentes'}
                  onChange={(e) => {
                    const value = e.target.value === 'todas' ? null : e.target.value === 'efetivadas';
                    handleFilterChange('efetivada', value);
                  }}
                  className="filter-select"
                >
                  <option value="todas">Todas</option>
                  <option value="efetivadas">Efetivadas</option>
                  <option value="pendentes">Pendentes</option>
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
            </div>

            <div className="mobile-filters-footer">
              <button
                onClick={handleClearFilters}
                className="btn-clear-mobile"
              >
                Limpar
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="btn-apply-mobile"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationContainer />
    </div>
  );
};

export default TransacoesPage;