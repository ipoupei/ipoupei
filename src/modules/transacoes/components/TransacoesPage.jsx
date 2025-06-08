// src/pages/TransacoesPage.jsx - Versão Otimizada com Consultas no Banco
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, RefreshCw, 
  ArrowUp, ArrowDown, ArrowLeftRight, 
  Activity, CreditCard, Wallet,
  Edit, Trash2, CheckCircle, Clock,
  Plus, X, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUpIcon, ArrowDownIcon
} from 'lucide-react';

// Hooks
import useAuth from '@modules/auth/hooks/useAuth';
import { useUIStore } from '@store/uiStore';

// Utilitários
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';

// Modais
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';
import TransferenciasModal from '@modules/transacoes/components/TransferenciasModal';

// Estilos
import '@modules/transacoes/styles/TransacoesPage.css';

const TransacoesPage = () => {
  const { user } = useAuth();
  const { showNotification } = useUIStore();
  
  // Estado para mostrar filtros
  const [showFilters, setShowFilters] = useState(false);

  // Estados para dados de referência
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);

  // Estados principais
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalTransacoes, setTotalTransacoes] = useState(0);

  // Estados dos modais
  const [modals, setModals] = useState({
    receitas: false,
    despesas: false,
    despesasCartao: false,
    transferencias: false
  });

  // Estado para edição
  const [transacaoEditando, setTransacaoEditando] = useState(null);

  // Estados para período (navegação flexível)
  const [periodoAtual, setPeriodoAtual] = useState(new Date());
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState({
    ativo: false,
    dataInicio: '',
    dataFim: ''
  });

  // Filtros com suporte a status e ordenação expandida
  const [filters, setFilters] = useState({
    tipo: 'todas',
    categoriaId: '',
    contaId: '',
    cartaoId: '',
    status: 'todas', // 'todas', 'efetivadas', 'pendentes'
    ordenacao: 'data',
    direcaoOrdenacao: 'desc'
  });

  // Paginação
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    itensPorPagina: 50,
    totalPaginas: 0
  });

  // Calcular período atual (mês ou personalizado)
  const periodoCalculado = useMemo(() => {
    if (periodoPersonalizado.ativo && periodoPersonalizado.dataInicio && periodoPersonalizado.dataFim) {
      return {
        inicio: periodoPersonalizado.dataInicio,
        fim: periodoPersonalizado.dataFim,
        label: `${format(new Date(periodoPersonalizado.dataInicio), 'dd/MM/yyyy')} - ${format(new Date(periodoPersonalizado.dataFim), 'dd/MM/yyyy')}`,
        isPersonalizado: true
      };
    }
    
    const inicio = startOfMonth(periodoAtual);
    const fim = endOfMonth(periodoAtual);
    
    return {
      inicio: format(inicio, 'yyyy-MM-dd'),
      fim: format(fim, 'yyyy-MM-dd'),
      label: format(periodoAtual, 'MMMM yyyy', { locale: ptBR }),
      isPersonalizado: false
    };
  }, [periodoAtual, periodoPersonalizado]);

  // Navegação de período (sempre reseta para mês inteiro)
  const navegarPeriodo = useCallback((direcao) => {
    setPeriodoPersonalizado({ ativo: false, dataInicio: '', dataFim: '' }); // Desativa período personalizado
    setPeriodoAtual(prev => {
      if (direcao === 'anterior') {
        return subMonths(prev, 1);
      } else {
        return addMonths(prev, 1);
      }
    });
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  const voltarParaHoje = useCallback(() => {
    setPeriodoPersonalizado({ ativo: false, dataInicio: '', dataFim: '' });
    setPeriodoAtual(new Date());
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  // ✅ NOVO: Ativar período personalizado
  const ativarPeriodoPersonalizado = useCallback((dataInicio, dataFim) => {
    setPeriodoPersonalizado({
      ativo: true,
      dataInicio,
      dataFim
    });
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  // ✅ NOVO: Resetar para período mensal
  const resetarParaPeriodoMensal = useCallback(() => {
    setPeriodoPersonalizado({ ativo: false, dataInicio: '', dataFim: '' });
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  // Buscar dados básicos usando as tabelas otimizadas
  const fetchBasicData = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('📊 Buscando dados básicos...');

      const [categoriasRes, contasRes, cartoesRes] = await Promise.all([
        supabase
          .from('categorias')
          .select('id, nome, cor, tipo')
          .eq('usuario_id', user.id)
          .eq('ativo', true)
          .order('nome'),
        
        supabase
          .from('contas')
          .select('id, nome, tipo, saldo')
          .eq('usuario_id', user.id)
          .eq('ativo', true)
          .order('nome'),
        
        supabase
          .from('cartoes')
          .select('id, nome, bandeira')
          .eq('usuario_id', user.id)
          .eq('ativo', true)
          .order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setContas(contasRes.data || []);
      setCartoes(cartoesRes.data || []);

      console.log('✅ Dados básicos carregados:', {
        categorias: categoriasRes.data?.length || 0,
        contas: contasRes.data?.length || 0,
        cartoes: cartoesRes.data?.length || 0
      });

    } catch (error) {
      console.error('❌ Erro ao buscar dados básicos:', error);
      showNotification('Erro ao carregar dados básicos', 'error');
    }
  }, [user?.id, showNotification]);

  // Função otimizada para buscar transações com filtros no banco
  const fetchTransacoes = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔍 Buscando transações do período:', periodoCalculado);
      
      // Construir query base - EXCLUINDO transferências internas
      let query = supabase
        .from('transacoes')
        .select(`
          id, descricao, valor, data, tipo, observacoes,
          categoria_id, conta_id, cartao_id, efetivado,
          parcela_atual, total_parcelas, fatura_vencimento,
          created_at, updated_at
        `, { count: 'exact' })
        .eq('usuario_id', user.id)
        .gte('data', periodoCalculado.inicio)
        .lte('data', periodoCalculado.fim)
        .neq('transferencia', true); // ✅ EXCLUIR transferências internas

      // Aplicar filtros no banco
      if (filters.tipo !== 'todas') {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters.categoriaId) {
        query = query.eq('categoria_id', filters.categoriaId);
      }

      if (filters.contaId) {
        query = query.eq('conta_id', filters.contaId);
      }

      if (filters.cartaoId) {
        query = query.eq('cartao_id', filters.cartaoId);
      }

      // ✅ NOVO: Filtro de status (efetivadas/pendentes)
      if (filters.status === 'efetivadas') {
        query = query.eq('efetivado', true);
      } else if (filters.status === 'pendentes') {
        query = query.eq('efetivado', false);
      }

      // Busca textual no banco
      if (searchTerm.trim()) {
        query = query.or(`descricao.ilike.%${searchTerm}%,observacoes.ilike.%${searchTerm}%`);
      }

      // ✅ NOVO: Ordenação expandida no banco (incluindo conta e categoria)
      const isAscending = filters.direcaoOrdenacao === 'asc';
      
      switch (filters.ordenacao) {
        case 'data':
          query = query.order('data', { ascending: isAscending })
                      .order('created_at', { ascending: !isAscending });
          break;
        case 'descricao':
          query = query.order('descricao', { ascending: isAscending });
          break;
        case 'valor':
          query = query.order('valor', { ascending: isAscending });
          break;
        case 'categoria':
          // Ordenar por categoria_id e depois enriquecer com dados
          query = query.order('categoria_id', { ascending: isAscending, nullsFirst: !isAscending });
          break;
        case 'conta':
          // Ordenar por conta_id primeiro, depois cartao_id
          query = query.order('conta_id', { ascending: isAscending, nullsFirst: !isAscending })
                      .order('cartao_id', { ascending: isAscending, nullsFirst: !isAscending });
          break;
        case 'efetivado':
          query = query.order('efetivado', { ascending: isAscending })
                      .order('data', { ascending: !isAscending });
          break;
        default:
          query = query.order('data', { ascending: false })
                      .order('created_at', { ascending: false });
      }

      // Paginação
      const offset = (paginacao.pagina - 1) * paginacao.itensPorPagina;
      query = query.range(offset, offset + paginacao.itensPorPagina - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      
      // Enriquecer dados com informações de categoria, conta e cartão
      const enrichedData = (data || []).map(transacao => ({
        ...transacao,
        categoria: categorias.find(c => c.id === transacao.categoria_id),
        conta: contas.find(c => c.id === transacao.conta_id),
        cartao: cartoes.find(c => c.id === transacao.cartao_id)
      }));

      // ✅ NOVO: Ordenação pós-processamento para categoria e conta (quando necessário)
      let finalData = enrichedData;
      
      if (filters.ordenacao === 'categoria') {
        finalData = enrichedData.sort((a, b) => {
          const nomeA = a.categoria?.nome || '';
          const nomeB = b.categoria?.nome || '';
          const resultado = nomeA.localeCompare(nomeB);
          return filters.direcaoOrdenacao === 'asc' ? resultado : -resultado;
        });
      } else if (filters.ordenacao === 'conta') {
        finalData = enrichedData.sort((a, b) => {
          const nomeA = a.cartao?.nome || a.conta?.nome || '';
          const nomeB = b.cartao?.nome || b.conta?.nome || '';
          const resultado = nomeA.localeCompare(nomeB);
          return filters.direcaoOrdenacao === 'asc' ? resultado : -resultado;
        });
      }

      setTransacoes(finalData);
      setTotalTransacoes(count || 0);
      
      // Atualizar paginação
      const totalPaginas = Math.ceil((count || 0) / paginacao.itensPorPagina);
      setPaginacao(prev => ({ ...prev, totalPaginas }));

      console.log('✅ Transações carregadas:', {
        encontradas: enrichedData.length,
        total: count,
        pagina: paginacao.pagina,
        totalPaginas
      });

    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      showNotification('Erro ao carregar transações: ' + error.message, 'error');
      setTransacoes([]);
      setTotalTransacoes(0);
    } finally {
      setLoading(false);
    }
  }, [
    user?.id, 
    periodoCalculado, 
    filters, 
    searchTerm, 
    paginacao.pagina, 
    paginacao.itensPorPagina,
    categorias, 
    contas, 
    cartoes, 
    showNotification
  ]);

  // Carregar dados inicial
  useEffect(() => {
    if (user?.id) {
      fetchBasicData();
    }
  }, [fetchBasicData]);

  // Carregar transações quando necessário
  useEffect(() => {
    if (user?.id && categorias.length > 0) {
      fetchTransacoes();
    }
  }, [fetchTransacoes, user?.id, categorias.length]);

  // ✅ NOVO: Handler para ordenação por clique no cabeçalho
  const handleSort = useCallback((campo) => {
    setFilters(prev => {
      const novaOrdenacao = campo;
      const novaDirecao = prev.ordenacao === campo && prev.direcaoOrdenacao === 'desc' 
        ? 'asc' 
        : 'desc';
      
      return {
        ...prev,
        ordenacao: novaOrdenacao,
        direcaoOrdenacao: novaDirecao
      };
    });
    
    // Reset para primeira página ao ordenar
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  // Função para obter ícone de ordenação
  const getSortIcon = useCallback((campo) => {
    if (filters.ordenacao !== campo) {
      return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    }
    
    return filters.direcaoOrdenacao === 'asc' 
      ? <ArrowUpIcon className="w-3 h-3 text-blue-600" />
      : <ArrowDownIcon className="w-3 h-3 text-blue-600" />;
  }, [filters.ordenacao, filters.direcaoOrdenacao]);

  // Handlers para filtros
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPaginacao(prev => ({ ...prev, pagina: 1 })); // Reset página ao filtrar
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      tipo: 'todas',
      categoriaId: '',
      contaId: '',
      cartaoId: '',
      status: 'todas',
      ordenacao: 'data',
      direcaoOrdenacao: 'desc'
    });
    setSearchTerm('');
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  // Função para verificar se há filtros ativos
  const hasActiveFilters = useCallback(() => {
    return (
      filters.tipo !== 'todas' ||
      filters.categoriaId !== '' ||
      filters.contaId !== '' ||
      filters.cartaoId !== '' ||
      filters.status !== 'todas' ||
      searchTerm.trim() !== ''
    );
  }, [filters, searchTerm]);

  // Função para contar filtros ativos
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.tipo !== 'todas') count++;
    if (filters.categoriaId !== '') count++;
    if (filters.contaId !== '') count++;
    if (filters.cartaoId !== '') count++;
    if (filters.status !== 'todas') count++;
    if (searchTerm.trim() !== '') count++;
    return count;
  }, [filters, searchTerm]);

  // Handlers para paginação
  const handlePageChange = useCallback((novaPagina) => {
    setPaginacao(prev => ({ ...prev, pagina: novaPagina }));
  }, []);

  // Handler para busca com debounce
  const handleSearchChange = useCallback((termo) => {
    setSearchTerm(termo);
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  // Handlers para modais
  const handleOpenModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const handleCloseModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    setTransacaoEditando(null);
  }, []);

  const handleSaveModal = useCallback(() => {
    fetchTransacoes(); // Recarrega transações
  }, [fetchTransacoes]);

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
      } else {
        handleOpenModal('despesas');
      }
    }
  }, [handleOpenModal]);

  const handleDeleteTransacao = useCallback(async (transacaoId) => {
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
  }, [user.id, showNotification, fetchTransacoes]);

  const handleMarkAsCompleted = useCallback(async (transacaoId) => {
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
  }, [user.id, showNotification, fetchTransacoes]);

  // Ícones helper
  const getTipoIcon = useCallback((tipo) => {
    switch (tipo) {
      case 'receita': return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'despesa': return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'transferencia': return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  }, []);

  const getStatusIcon = useCallback((efetivada) => {
    return efetivada ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <Clock className="w-4 h-4 text-orange-600" />;
  }, []);

  return (
    <div className="transacoes-page">
      
      {/* Header Compacto */}
      <div className="page-header">
        <div className="header-title">
          <h1>Transações</h1>
          <p>Gerencie suas receitas, despesas e transferências</p>
        </div>

        {/* Linha única de controles */}
        <div className="controls-bar">
          {/* Busca */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
            <Search className="search-icon" />
          </div>

          {/* ✅ NOVO: Navegação de período flexível */}
          <div className="period-container">
            <button
              onClick={() => navegarPeriodo('anterior')}
              className="period-nav-btn"
              disabled={loading || periodoPersonalizado.ativo}
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="period-label-container">
              <div className="period-label">
                {periodoCalculado.label}
              </div>
              {periodoPersonalizado.ativo && (
                <button
                  onClick={resetarParaPeriodoMensal}
                  className="period-reset-btn"
                  title="Voltar para navegação mensal"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <button
              onClick={() => navegarPeriodo('proximo')}
              className="period-nav-btn"
              disabled={loading || periodoPersonalizado.ativo}
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={voltarParaHoje}
              className="period-today-btn"
              disabled={loading}
              title="Voltar para o mês atual"
            >
              Hoje
            </button>
          </div>

          {/* ✅ NOVO: Seletor de período personalizado */}
          <div className="custom-period-container">
            <div className="date-input-group">
              <label>De:</label>
              <input
                type="date"
                value={periodoPersonalizado.ativo ? periodoPersonalizado.dataInicio : format(startOfMonth(periodoAtual), 'yyyy-MM-dd')}
                onChange={(e) => {
                  const novaDataInicio = e.target.value;
                  const dataFim = periodoPersonalizado.ativo && periodoPersonalizado.dataFim 
                    ? periodoPersonalizado.dataFim 
                    : format(endOfMonth(periodoAtual), 'yyyy-MM-dd');
                  
                  if (novaDataInicio && dataFim) {
                    ativarPeriodoPersonalizado(novaDataInicio, dataFim);
                  }
                }}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>Até:</label>
              <input
                type="date"
                value={periodoPersonalizado.ativo ? periodoPersonalizado.dataFim : format(endOfMonth(periodoAtual), 'yyyy-MM-dd')}
                onChange={(e) => {
                  const novaDataFim = e.target.value;
                  const dataInicio = periodoPersonalizado.ativo && periodoPersonalizado.dataInicio 
                    ? periodoPersonalizado.dataInicio 
                    : format(startOfMonth(periodoAtual), 'yyyy-MM-dd');
                  
                  if (dataInicio && novaDataFim) {
                    ativarPeriodoPersonalizado(dataInicio, novaDataFim);
                  }
                }}
                className="date-input"
              />
            </div>
          </div>

          {/* Filtros dropdown */}
          <div className="filters-dropdown">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`filters-btn ${hasActiveFilters() ? 'active' : ''}`}
            >
              <Activity className="w-4 h-4" />
              Filtros
              {hasActiveFilters() && <span className="filters-badge">{getActiveFiltersCount()}</span>}
            </button>
          </div>

          {/* Atualizar */}
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
        {/* Lista de Transações - Formato Tabela Compacta */}
        <div className="transactions-list">
          <div className="list-header">
            <span className="results-count">
              {loading ? 'Carregando...' : `${totalTransacoes} transações em ${periodoCalculado.label}`}
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p>Carregando transações...</p>
            </div>
          ) : transacoes.length === 0 ? (
            <div className="empty-state">
              <Activity className="w-12 h-12 text-gray-400" />
              <h3>Nenhuma transação encontrada</h3>
              <p>Não há transações no período de {periodoCalculado.label}</p>
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
            <div className="transactions-table">
              {/* ✅ NOVO: Header da tabela com ordenação expandida */}
              <div className="table-header">
                <div 
                  className="th-date sortable"
                  onClick={() => handleSort('data')}
                  title="Ordenar por data"
                >
                  <span>Data</span>
                  
                </div>
                <div 
                  className="th-description sortable"
                  onClick={() => handleSort('descricao')}
                  title="Ordenar por descrição"
                >
                  <span>Descrição</span>
                  
                </div>
                <div 
                  className="th-category sortable"
                  onClick={() => handleSort('categoria')}
                  title="Ordenar por categoria"
                >
                  <span>Categoria</span>
                  
                </div>
                <div 
                  className="th-account sortable"
                  onClick={() => handleSort('conta')}
                  title="Ordenar por conta/cartão"
                >
                  <span>Conta</span>
                  
                </div>
                <div 
                  className="th-value sortable"
                  onClick={() => handleSort('valor')}
                  title="Ordenar por valor"
                >
                  <span>Valor</span>
                  
                </div>
                <div 
                  className="th-status sortable"
                  onClick={() => handleSort('efetivado')}
                  title="Ordenar por status"
                >
                  <span>Status</span>
                  
                </div>
                <div className="th-actions">Ações</div>
              </div>

              {/* Linhas da tabela */}
              <div className="table-body">
                {transacoes.map((transacao) => (
                  <div key={transacao.id} className="table-row">
                    <div className="td-date">
                      <div className="date-info">
                        <span className="date-day">
                          {transacao.data ? format(new Date(transacao.data), 'dd/MM') : '--/--'}
                        </span>
                        <span className="date-year">
                          {transacao.data ? format(new Date(transacao.data), 'yyyy') : '----'}
                        </span>
                      </div>
                    </div>

                    <div className="td-description">
                      <div className="description-content">
                        <div className="tipo-icon">
                          {getTipoIcon(transacao.tipo)}
                        </div>
                        <div className="description-text">
                          <div className="description-main">
                            {transacao.descricao}
                          </div>
                          {transacao.observacoes && (
                            <div className="description-notes">
                              {transacao.observacoes}
                            </div>
                          )}
                          {transacao.total_parcelas > 1 && (
                            <div className="parcela-info">
                              {transacao.parcela_atual}/{transacao.total_parcelas}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="td-category">
                      {transacao.categoria && (
                        <span 
                          className="category-tag" 
                          style={{ 
                            backgroundColor: `${transacao.categoria?.cor || '#6B7280'}20`, 
                            color: transacao.categoria?.cor || '#6B7280',
                            borderColor: `${transacao.categoria?.cor || '#6B7280'}40`
                          }}
                        >
                          {transacao.categoria?.nome}
                        </span>
                      )}
                    </div>

                    <div className="td-account">
                      <div className="account-info">
                        {transacao.cartao?.nome ? (
                          <>
                            <CreditCard className="w-3 h-3" />
                            <span>{transacao.cartao?.nome}</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="w-3 h-3" />
                            <span>{transacao.conta?.nome || 'Conta'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="td-value">
                      <span className={`value ${transacao.tipo === 'receita' ? 'positive' : 'negative'}`}>
                        {transacao.tipo === 'receita' ? '+' : '-'}
                        {formatCurrency(transacao.valor)}
                      </span>
                    </div>

                    {/* ✅ NOVA: Coluna de Status */}
                    <div className="td-status">
                      <div className="status-info">
                        {getStatusIcon(transacao.efetivado)}
                        <span className="status-text">
                          {transacao.efetivado ? 'Efetivada' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="td-actions">
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
                ))}
              </div>
            </div>
          )}

          {/* ✅ NOVA: Paginação */}
          {totalTransacoes > paginacao.itensPorPagina && (
            <div className="pagination">
              <div className="pagination-info">
                Página {paginacao.pagina} de {paginacao.totalPaginas} 
                ({totalTransacoes} transações)
              </div>
              
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(paginacao.pagina - 1)}
                  disabled={paginacao.pagina <= 1 || loading}
                  className="pagination-button"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                
                <span className="page-info">
                  {paginacao.pagina} / {paginacao.totalPaginas}
                </span>
                
                <button
                  onClick={() => handlePageChange(paginacao.pagina + 1)}
                  disabled={paginacao.pagina >= paginacao.totalPaginas || loading}
                  className="pagination-button"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Filtros com novo filtro de Status */}
      {showFilters && (
        <div className="filters-overlay" onClick={() => setShowFilters(false)}>
          <div className="filters-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filters-header">
              <h3 className="filters-title">Filtros</h3>
              <div className="filters-header-actions">
                <button onClick={handleClearFilters} className="btn-clear-filters">
                  Limpar
                </button>
                <button onClick={() => setShowFilters(false)} className="btn-close-filters">
                  <X className="w-4 h-4" />
                </button>
              </div>
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
                </select>
              </div>

              {/* ✅ NOVO: Status */}
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
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
                  value={`${filters.ordenacao}_${filters.direcaoOrdenacao}`}
                  onChange={(e) => {
                    const [campo, direcao] = e.target.value.split('_');
                    handleFilterChange('ordenacao', campo);
                    handleFilterChange('direcaoOrdenacao', direcao);
                  }}
                  className="filter-select"
                >
                  <option value="data_desc">Data (mais recente)</option>
                  <option value="data_asc">Data (mais antiga)</option>
                  <option value="valor_desc">Valor (maior)</option>
                  <option value="valor_asc">Valor (menor)</option>
                  <option value="descricao_asc">Descrição (A-Z)</option>
                  <option value="descricao_desc">Descrição (Z-A)</option>
                  <option value="categoria_asc">Categoria (A-Z)</option>
                  <option value="categoria_desc">Categoria (Z-A)</option>
                  <option value="conta_asc">Conta/Cartão (A-Z)</option>
                  <option value="conta_desc">Conta/Cartão (Z-A)</option>
                  <option value="efetivado_desc">Status (efetivadas primeiro)</option>
                  <option value="efetivado_asc">Status (pendentes primeiro)</option>
                </select>
              </div>
            </div>

            <div className="filters-footer">
              <button 
                onClick={() => setShowFilters(false)}
                className="btn-apply-filters"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

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