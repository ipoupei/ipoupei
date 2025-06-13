import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, RefreshCw, 
  ArrowUp, ArrowDown, ArrowLeftRight, 
  Activity, CreditCard, Wallet,
  Edit, Trash2, CheckCircle, Clock,
  Plus, X, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUpIcon, ArrowDownIcon,
  Layers, Layers3, Filter, MoreHorizontal,
  TrendingUp, TrendingDown, Calendar, Info,
  FileText, Users, Target, Zap
} from 'lucide-react';

// Hooks
import useAuth from '@modules/auth/hooks/useAuth';
import { useUIStore } from '@store/uiStore';

// Utilitários
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';

// Componentes
import ToolTip from '@shared/components/ui/ToolTip';

// Modais
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';
import TransferenciasModal from '@modules/transacoes/components/TransferenciasModal';

// Estilos
import '@modules/transacoes/styles/Transacoes.css';

const TransacoesPage = () => {
  const { user } = useAuth();
  const { showNotification } = useUIStore();
  
  // Estado para mostrar filtros
  const [showFilters, setShowFilters] = useState(false);

  // Estado para agrupamento de cartão
  const [agruparCartao, setAgruparCartao] = useState(false);

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

  // Estados para período
  const [periodoAtual, setPeriodoAtual] = useState(new Date());
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState({
    ativo: false,
    dataInicio: '',
    dataFim: ''
  });

  // Filtros
  const [filters, setFilters] = useState({
    tipo: 'todas',
    categoriaId: '',
    contaId: '',
    cartaoId: '',
    status: 'todas',
    ordenacao: 'data',
    direcaoOrdenacao: 'desc'
  });

  // Paginação
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    itensPorPagina: 50,
    totalPaginas: 0
  });

  // Calcular período atual
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

  // Navegação de período
  const navegarPeriodo = useCallback((direcao) => {
    setPeriodoPersonalizado({ ativo: false, dataInicio: '', dataFim: '' });
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

  // Buscar dados básicos
  const fetchBasicData = useCallback(async () => {
    if (!user?.id) return;

    try {
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
          .select('id, nome, bandeira, limite')
          .eq('usuario_id', user.id)
          .eq('ativo', true)
          .order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setContas(contasRes.data || []);
      setCartoes(cartoesRes.data || []);

    } catch (error) {
      console.error('❌ Erro ao buscar dados básicos:', error);
      showNotification('Erro ao carregar dados básicos', 'error');
    }
  }, [user?.id, showNotification]);

  // Função para agrupar faturas de cartão
  const agruparFaturasCartao = useCallback((transacoesList) => {
    if (!agruparCartao) return transacoesList;

    const faturasMap = new Map();
    const transacoesNaoCartao = [];

    transacoesList.forEach(transacao => {
      if (transacao.cartao_id && transacao.fatura_vencimento) {
        const chave = `${transacao.cartao_id}_${transacao.fatura_vencimento}`;
        
        if (!faturasMap.has(chave)) {
          faturasMap.set(chave, {
            id: `fatura_${transacao.cartao_id}_${transacao.fatura_vencimento}`,
            tipo: 'despesa',
            descricao: `Fatura ${transacao.cartao?.nome || 'Cartão'}`,
            valor: 0,
            dataExibicao: transacao.fatura_vencimento,
            data: transacao.fatura_vencimento,
            fatura_vencimento: transacao.fatura_vencimento,
            cartao_id: transacao.cartao_id,
            cartao: transacao.cartao,
            categoria: { nome: 'Fatura Cartão', cor: '#8B5CF6' },
            conta: transacao.conta,
            efetivado: true,
            isFaturaAgrupada: true,
            transacoesAgrupadas: [],
            created_at: transacao.created_at
          });
        }

        const fatura = faturasMap.get(chave);
        fatura.valor += transacao.valor;
        fatura.transacoesAgrupadas.push(transacao);
      } else {
        transacoesNaoCartao.push(transacao);
      }
    });

    const faturasAgrupadas = Array.from(faturasMap.values());
    return [...faturasAgrupadas, ...transacoesNaoCartao];
  }, [agruparCartao]);

  // Buscar transações
  const fetchTransacoes = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('transacoes')
        .select(`
          id, descricao, valor, data, tipo, observacoes,
          categoria_id, conta_id, cartao_id, efetivado,
          parcela_atual, total_parcelas, fatura_vencimento,
          created_at, updated_at
        `, { count: 'exact' })
        .eq('usuario_id', user.id)
        .neq('transferencia', true);

      // Filtrar por período
      query = query.or(
        `and(cartao_id.not.is.null,fatura_vencimento.gte.${periodoCalculado.inicio},fatura_vencimento.lte.${periodoCalculado.fim}),` +
        `and(cartao_id.is.null,data.gte.${periodoCalculado.inicio},data.lte.${periodoCalculado.fim})`
      );

      // Aplicar filtros
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
      if (filters.status === 'efetivadas') {
        query = query.eq('efetivado', true);
      } else if (filters.status === 'pendentes') {
        query = query.eq('efetivado', false);
      }
      if (searchTerm.trim()) {
        query = query.or(`descricao.ilike.%${searchTerm}%,observacoes.ilike.%${searchTerm}%`);
      }

      // Ordenação
      const campoOrdenacao = getOrderField(filters.ordenacao);
      query = query.order(campoOrdenacao, { ascending: filters.direcaoOrdenacao === 'asc' });

      const { data, error, count } = await query;
      if (error) throw error;
      
      // Enriquecer dados
      const enrichedData = (data || []).map(transacao => ({
        ...transacao,
        categoria: categorias.find(c => c.id === transacao.categoria_id),
        conta: contas.find(c => c.id === transacao.conta_id),
        cartao: cartoes.find(c => c.id === transacao.cartao_id),
        dataExibicao: transacao.cartao_id ? transacao.fatura_vencimento : transacao.data
      }));

      // Aplicar agrupamento se necessário
      const transacoesFinais = agruparFaturasCartao(enrichedData);

      // Aplicar paginação no frontend se agrupado
      if (agruparCartao) {
        const startIndex = (paginacao.pagina - 1) * paginacao.itensPorPagina;
        const endIndex = startIndex + paginacao.itensPorPagina;
        const paginatedData = transacoesFinais.slice(startIndex, endIndex);
        
        setTransacoes(paginatedData);
        setTotalTransacoes(transacoesFinais.length);
        
        const totalPaginas = Math.ceil(transacoesFinais.length / paginacao.itensPorPagina);
        setPaginacao(prev => ({ ...prev, totalPaginas }));
      } else {
        // Aplicar paginação no backend se não agrupado
        const offset = (paginacao.pagina - 1) * paginacao.itensPorPagina;
        const paginatedData = enrichedData.slice(offset, offset + paginacao.itensPorPagina);
        
        setTransacoes(paginatedData);
        setTotalTransacoes(count || 0);
        
        const totalPaginas = Math.ceil((count || 0) / paginacao.itensPorPagina);
        setPaginacao(prev => ({ ...prev, totalPaginas }));
      }

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
    agruparFaturasCartao,
    agruparCartao,
    showNotification
  ]);

  // Effects
  useEffect(() => {
    if (user?.id) {
      fetchBasicData();
    }
  }, [fetchBasicData]);

  useEffect(() => {
    if (user?.id && categorias.length >= 0) {
      fetchTransacoes();
    }
  }, [fetchTransacoes, user?.id, categorias.length]);

  // Handlers
  const handleToggleAgrupamento = useCallback(() => {
    setAgruparCartao(prev => !prev);
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  const handleSort = useCallback((campo) => {
    setFilters(prev => ({
      ...prev,
      ordenacao: campo,
      direcaoOrdenacao: prev.ordenacao === campo && prev.direcaoOrdenacao === 'desc' ? 'asc' : 'desc'
    }));
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  // Função para mapear campos de ordenação
  const getOrderField = useCallback((campo) => {
    const fieldMap = {
      'data': 'created_at',
      'descricao': 'descricao',
      'categoria': 'categoria_id',
      'conta': 'conta_id',
      'valor': 'valor'
    };
    return fieldMap[campo] || campo;
  }, []);

  const getSortIcon = useCallback((campo) => {
    if (filters.ordenacao !== campo) {
      return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    }
    return filters.direcaoOrdenacao === 'asc' 
      ? <ArrowUpIcon className="w-3 h-3 text-blue-600" />
      : <ArrowDownIcon className="w-3 h-3 text-blue-600" />;
  }, [filters.ordenacao, filters.direcaoOrdenacao]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
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

  const handlePageChange = useCallback((novaPagina) => {
    setPaginacao(prev => ({ ...prev, pagina: novaPagina }));
  }, []);

  const handleSearchChange = useCallback((termo) => {
    setSearchTerm(termo);
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  }, []);

  const handleOpenModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const handleCloseModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    setTransacaoEditando(null);
  }, []);

  const handleSaveModal = useCallback(() => {
    fetchTransacoes();
  }, [fetchTransacoes]);

  const handleEditTransacao = useCallback((transacao) => {
    if (transacao.isFaturaAgrupada) {
      showNotification('Não é possível editar uma fatura agrupada. Desative o agrupamento para editar transações individuais.', 'warning');
      return;
    }

    setTransacaoEditando(transacao);
    
    if (transacao.tipo === 'receita') {
      handleOpenModal('receitas');
    } else if (transacao.tipo === 'despesa') {
      if (transacao.cartao_id) {
        handleOpenModal('despesasCartao');
      } else {
        handleOpenModal('despesas');
      }
    }
  }, [handleOpenModal, showNotification]);

  const handleDeleteTransacao = useCallback(async (transacao) => {
    if (transacao.isFaturaAgrupada) {
      showNotification('Não é possível excluir uma fatura agrupada. Desative o agrupamento para excluir transações individuais.', 'warning');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transacao.id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      showNotification('Transação excluída com sucesso!', 'success');
      fetchTransacoes();
    } catch (error) {
      console.error('❌ Erro ao excluir transação:', error);
      showNotification('Erro ao excluir transação', 'error');
    }
  }, [user.id, showNotification, fetchTransacoes]);

  const handleMarkAsCompleted = useCallback(async (transacao) => {
    if (transacao.isFaturaAgrupada) {
      showNotification('Esta é uma fatura agrupada que já está efetivada.', 'info');
      return;
    }

    try {
      const { error } = await supabase
        .from('transacoes')
        .update({ efetivado: true })
        .eq('id', transacao.id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      showNotification('Transação marcada como efetivada!', 'success');
      fetchTransacoes();
      
    } catch (error) {
      console.error('❌ Erro ao efetivar transação:', error);
      showNotification('Erro ao efetivar transação', 'error');
    }
  }, [user.id, showNotification, fetchTransacoes]);

  const getTipoIcon = useCallback((tipo) => {
    switch (tipo) {
      case 'receita': return <TrendingUp className="w-4 h-4" />;
      case 'despesa': return <TrendingDown className="w-4 h-4" />;
      case 'transferencia': return <ArrowLeftRight className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  }, []);

  const getStatusIcon = useCallback((efetivada) => {
    return efetivada ? 
      <CheckCircle className="w-3 h-3" /> : 
      <Clock className="w-3 h-3" />;
  }, []);

  // Função para formatar a exibição de recorrência
  const formatRecorrencia = useCallback((transacao) => {
    if (transacao.total_parcelas > 1) {
      return `${transacao.parcela_atual}/${transacao.total_parcelas}`;
    }
    return null;
  }, []);

  // Componente de estado vazio melhorado
  const EmptyState = () => (
    <div className="transacoes-empty-improved">
      <div className="empty-illustration">
        <div className="empty-icon-container">
          <FileText className="empty-main-icon" size={64} />
          <div className="empty-floating-icons">
            <TrendingUp className="floating-icon up" size={24} />
            <TrendingDown className="floating-icon down" size={20} />
            <CreditCard className="floating-icon card" size={18} />
          </div>
        </div>
      </div>
      
      <div className="empty-content">
        <h3>Nenhuma transação por aqui ainda!</h3>
        <p>
          {hasActiveFilters() 
            ? 'Não encontramos transações com os filtros aplicados. Que tal ajustar a busca?'
            : 'Comece registrando sua primeira transação e mantenha suas finanças organizadas.'
          }
        </p>
      </div>

      <div className="empty-actions">
        <button
          onClick={() => handleOpenModal('receitas')}
          className="empty-action-button primary"
        >
          <TrendingUp className="w-4 h-4" />
          Adicionar Receita
        </button>
        <button
          onClick={() => handleOpenModal('despesas')}
          className="empty-action-button secondary"
        >
          <TrendingDown className="w-4 h-4" />
          Adicionar Despesa
        </button>
      </div>

      {hasActiveFilters() && (
        <div className="empty-filter-actions">
          <button
            onClick={handleClearFilters}
            className="clear-filters-button"
          >
            <X className="w-4 h-4" />
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="transacoes-page">
      
      {/* HEADER MELHORADO */}
      <div className="transacoes-header">
        <div className="header-title-section">
          <h1 className="transacoes-title">Transações</h1>
          <div className="transacoes-subtitle">
            {totalTransacoes > 0 ? (
              <span className="count-info">
                {totalTransacoes} {agruparCartao ? 'itens' : 'transações'} em {periodoCalculado.label}
              </span>
            ) : (
              <span className="count-info">
                {periodoCalculado.label}
              </span>
            )}
          </div>
        </div>

        <div className="transacoes-actions">
          {/* Busca */}
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Controles de período */}
          <div className="period-controls">
            <ToolTip content="Mês anterior">
              <button
                onClick={() => navegarPeriodo('anterior')}
                className="period-nav-button"
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </ToolTip>
            
            <div className="period-display">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{periodoCalculado.label}</span>
            </div>
            
            <ToolTip content="Próximo mês">
              <button
                onClick={() => navegarPeriodo('proximo')}
                className="period-nav-button"
                disabled={loading}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>

          <div className="action-separator"></div>
          
          {/* Botão "Hoje" */}
          <ToolTip content="Voltar para o mês atual">
            <button
              onClick={voltarParaHoje}
              className="today-button"
              disabled={loading}
            >
              Hoje
            </button>
          </ToolTip>

          {/* Agrupamento */}
          <ToolTip content={agruparCartao ? 'Desagrupar despesas de cartão' : 'Agrupar despesas de cartão por fatura'}>
            <button
              onClick={handleToggleAgrupamento}
              className={`action-button agrupamento-button ${agruparCartao ? 'active' : ''}`}
              disabled={loading}
            >
              {agruparCartao ? <Layers3 className="button-icon" /> : <Layers className="button-icon" />}
              <span>Agrupar</span>
            </button>
          </ToolTip>

          {/* Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`action-button filter-button ${hasActiveFilters() ? 'active' : ''}`}
          >
            <Filter className="button-icon" />
            <span>Filtros</span>
            {hasActiveFilters() && (
              <span className="filter-badge">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>

          {/* Refresh */}
          <ToolTip content="Atualizar">
            <button
              onClick={fetchTransacoes}
              className="action-button refresh-button"
              disabled={loading}
            >
              <RefreshCw className={`button-icon ${loading ? 'spin' : ''}`} />
            </button>
          </ToolTip>
        </div>
      </div>

      {/* PAINEL DE FILTROS */}
      {showFilters && (
        <div className="transacoes-filter">
          <div className="filter-header">
            <h2>Filtros</h2>
            <div className="filter-header-actions">
              <button onClick={handleClearFilters} className="secondary-button">
                Limpar todos
              </button>
              <button onClick={() => setShowFilters(false)} className="close-button">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="filter-content">
            {/* Tipo */}
            <div className="filter-section">
              <h3 className="section-title">
                <Activity className="section-icon" />
                Tipo de Transação
              </h3>
              <div className="filter-buttons">
                <button
                  onClick={() => handleFilterChange('tipo', 'todas')}
                  className={`filter-toggle ${filters.tipo === 'todas' ? 'active' : ''}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => handleFilterChange('tipo', 'receita')}
                  className={`filter-toggle ${filters.tipo === 'receita' ? 'active receita' : ''}`}
                >
                  <TrendingUp className="toggle-icon" />
                  Receitas
                </button>
                <button
                  onClick={() => handleFilterChange('tipo', 'despesa')}
                  className={`filter-toggle ${filters.tipo === 'despesa' ? 'active despesa' : ''}`}
                >
                  <TrendingDown className="toggle-icon" />
                  Despesas
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="filter-section">
              <h3 className="section-title">
                <CheckCircle className="section-icon" />
                Status
              </h3>
              <div className="filter-buttons">
                <button
                  onClick={() => handleFilterChange('status', 'todas')}
                  className={`filter-toggle ${filters.status === 'todas' ? 'active' : ''}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => handleFilterChange('status', 'efetivadas')}
                  className={`filter-toggle ${filters.status === 'efetivadas' ? 'active efetivada' : ''}`}
                >
                  <CheckCircle className="toggle-icon" />
                  Efetivadas
                </button>
                <button
                  onClick={() => handleFilterChange('status', 'pendentes')}
                  className={`filter-toggle ${filters.status === 'pendentes' ? 'active pendente' : ''}`}
                >
                  <Clock className="toggle-icon" />
                  Pendentes
                </button>
              </div>
            </div>

            {/* Filtros específicos */}
            <div className="filter-section">
              <h3 className="section-title">Filtros Específicos</h3>
              <div className="filter-row">
                <div className="filter-field">
                  <label>Categoria</label>
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

                <div className="filter-field">
                  <label>Conta</label>
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
              </div>

              <div className="filter-row">
                <div className="filter-field">
                  <label>Cartão</label>
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

                <div className="filter-field">
                  <label>Ordenar por</label>
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
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button 
              onClick={() => setShowFilters(false)}
              className="primary-button"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      {loading ? (
        <div className="transacoes-loading">
          <div className="loading-spinner"></div>
          <p>Carregando transações...</p>
        </div>
      ) : transacoes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* HEADER DA TABELA - Todas as colunas ordenáveis */}
          <div className="transacoes-table-header">
            <div 
              className={`header-cell sortable ${filters.ordenacao === 'data' ? 'active-sort' : ''}`}
              onClick={() => handleSort('data')}
            >
              <span>Data</span>
              {getSortIcon('data')}
            </div>
            <div 
              className={`header-cell sortable ${filters.ordenacao === 'descricao' ? 'active-sort' : ''}`}
              onClick={() => handleSort('descricao')}
            >
              <span>Descrição</span>
              {getSortIcon('descricao')}
            </div>
            <div 
              className={`header-cell sortable ${filters.ordenacao === 'categoria' ? 'active-sort' : ''}`}
              onClick={() => handleSort('categoria')}
            >
              <span>Categoria</span>
              {getSortIcon('categoria')}
            </div>
            <div 
              className={`header-cell sortable ${filters.ordenacao === 'conta' ? 'active-sort' : ''}`}
              onClick={() => handleSort('conta')}
            >
              <span>Conta</span>
              {getSortIcon('conta')}
            </div>
            <div 
              className={`header-cell sortable ${filters.ordenacao === 'valor' ? 'active-sort' : ''}`}
              onClick={() => handleSort('valor')}
            >
              <span>Valor</span>
              {getSortIcon('valor')}
            </div>
            <div className="header-cell cell-acoes">
              <span>Ações</span>
            </div>
          </div>

          {/* LISTA DE TRANSAÇÕES */}
          <div className="transacoes-list">
            {transacoes.map((transacao, index) => (
              <div 
                key={transacao.id} 
                className={`transacao-item ${!transacao.efetivado ? 'pendente' : ''} ${transacao.isFaturaAgrupada ? 'fatura-agrupada' : ''} ${index % 2 === 0 ? 'even' : 'odd'}`}
              >
                
                {/* Data */}
                <div className="cell-data">
                  <div className="data-display">
                    <div className="data-principal">
                      {transacao.dataExibicao ? format(new Date(transacao.dataExibicao), 'dd/MM') : '--/--'}
                    </div>
                    <div className="data-ano">
                      {transacao.dataExibicao ? format(new Date(transacao.dataExibicao), 'yyyy') : '----'}
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="status-indicator">
                    <ToolTip content={transacao.efetivado ? 'Transação efetivada' : 'Transação pendente'}>
                      <div className={`status-icon ${transacao.efetivado ? 'efetivada' : 'pendente'}`}>
                        {getStatusIcon(transacao.efetivado)}
                      </div>
                    </ToolTip>
                  </div>
                </div>

                {/* Descrição */}
                <div className="cell-descricao">
                  <div className="tipo-container">
                    <ToolTip content={transacao.tipo === 'receita' ? 'Receita' : transacao.tipo === 'despesa' ? 'Despesa' : 'Transferência'}>
                      <div className={`tipo-icon ${transacao.tipo}`}>
                        {getTipoIcon(transacao.tipo)}
                      </div>
                    </ToolTip>
                  </div>
                  <div className="descricao-container">
                    <div className="descricao-principal">
                      {transacao.descricao}
                      {/* Badges */}
                      {formatRecorrencia(transacao) && (
                        <ToolTip content={`Parcela ${formatRecorrencia(transacao)}`}>
                          <span className="recorrencia-badge">
                            {formatRecorrencia(transacao)}
                          </span>
                        </ToolTip>
                      )}
                      {transacao.isFaturaAgrupada && (
                        <ToolTip content={`Fatura agrupada com ${transacao.transacoesAgrupadas?.length || 0} transações`}>
                          <span className="fatura-agrupada-badge">
                            <Layers3 className="w-3 h-3" />
                            {transacao.transacoesAgrupadas?.length || 0}
                          </span>
                        </ToolTip>
                      )}
                    </div>
                    {transacao.observacoes && (
                      <div className="descricao-observacao">
                        {transacao.observacoes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Categoria */}
                <div className="cell-categoria">
                  {transacao.categoria ? (
                    <ToolTip content={transacao.categoria.nome}>
                      <span 
                        className="categoria-tag-subtle" 
                        style={{ 
                          color: transacao.categoria?.cor || '#6B7280'
                        }}
                      >
                        <span 
                          className="categoria-dot"
                          style={{ backgroundColor: transacao.categoria?.cor || '#6B7280' }}
                        ></span>
                        {transacao.categoria?.nome}
                      </span>
                    </ToolTip>
                  ) : (
                    <span className="categoria-tag-subtle sem-categoria">
                      <span className="categoria-dot sem-categoria"></span>
                      Sem categoria
                    </span>
                  )}
                </div>

                {/* Conta */}
                <div className="cell-conta">
                  <div className="conta-container">
                    {transacao.cartao?.nome ? (
                      <ToolTip content={`Cartão: ${transacao.cartao.nome}${transacao.cartao.bandeira ? ` (${transacao.cartao.bandeira})` : ''}`}>
                        <div className="conta-display">
                          <CreditCard className="conta-icon cartao" />
                          <span className="conta-texto">{transacao.cartao?.nome}</span>
                        </div>
                      </ToolTip>
                    ) : (
                      <ToolTip content={`Conta: ${transacao.conta?.nome || 'Conta'}`}>
                        <div className="conta-display">
                          <Wallet className="conta-icon conta" />
                          <span className="conta-texto">{transacao.conta?.nome || 'Conta'}</span>
                        </div>
                      </ToolTip>
                    )}
                  </div>
                </div>

                {/* Valor */}
                <div className="cell-valor">
                  <div className="valor-container">
                    <span className={`valor-display ${transacao.tipo}`}>
                      {transacao.tipo === 'receita' ? '+' : '-'}
                      {formatCurrency(transacao.valor)}
                    </span>
                  </div>
                </div>

                {/* Ações - Ícones diretos sem dropdown */}
                <div className="cell-acoes">
                  <div className="acoes-container">
                    {/* Ação para efetivar (apenas para pendentes) */}
                    {!transacao.efetivado && !transacao.isFaturaAgrupada && (
                      <ToolTip content="Efetivar transação">
                        <button
                          onClick={() => handleMarkAsCompleted(transacao)}
                          className="acao-btn efetivar"
                        >
                          <CheckCircle className="acao-icon" />
                        </button>
                      </ToolTip>
                    )}
                    
                    {/* Ação para editar */}
                    <ToolTip content={transacao.isFaturaAgrupada ? 'Não é possível editar fatura agrupada' : 'Editar transação'}>
                      <button
                        onClick={() => handleEditTransacao(transacao)}
                        className={`acao-btn editar ${transacao.isFaturaAgrupada ? 'disabled' : ''}`}
                        disabled={transacao.isFaturaAgrupada}
                      >
                        <Edit className="acao-icon" />
                      </button>
                    </ToolTip>

                    {/* Ação para ver detalhes (apenas para faturas agrupadas) */}
                    {transacao.isFaturaAgrupada && (
                      <ToolTip content={`Ver ${transacao.transacoesAgrupadas?.length || 0} transações da fatura`}>
                        <button
                          onClick={() => {
                            showNotification(`Fatura contém ${transacao.transacoesAgrupadas?.length || 0} transações`, 'info');
                            console.log('Transações da fatura:', transacao.transacoesAgrupadas);
                          }}
                          className="acao-btn detalhes"
                        >
                          <Info className="acao-icon" />
                        </button>
                      </ToolTip>
                    )}

                    {/* Ação para duplicar */}
                    {!transacao.isFaturaAgrupada && (
                      <ToolTip content="Duplicar transação">
                        <button
                          onClick={() => {
                            const transacaoCopia = { ...transacao };
                            delete transacaoCopia.id;
                            delete transacaoCopia.created_at;
                            delete transacaoCopia.updated_at;
                            transacaoCopia.descricao = `${transacaoCopia.descricao} (Cópia)`;
                            setTransacaoEditando(transacaoCopia);
                            
                            if (transacao.tipo === 'receita') {
                              handleOpenModal('receitas');
                            } else if (transacao.tipo === 'despesa') {
                              if (transacao.cartao_id) {
                                handleOpenModal('despesasCartao');
                              } else {
                                handleOpenModal('despesas');
                              }
                            }
                          }}
                          className="acao-btn duplicar"
                        >
                          <Plus className="acao-icon" />
                        </button>
                      </ToolTip>
                    )}
                    
                    {/* Ação para excluir */}
                    <ToolTip content={transacao.isFaturaAgrupada ? 'Não é possível excluir fatura agrupada' : 'Excluir transação'}>
                      <button
                        onClick={() => handleDeleteTransacao(transacao)}
                        className={`acao-btn excluir ${transacao.isFaturaAgrupada ? 'disabled' : ''}`}
                        disabled={transacao.isFaturaAgrupada}
                      >
                        <Trash2 className="acao-icon" />
                      </button>
                    </ToolTip>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalTransacoes > paginacao.itensPorPagina && (
            <div className="pagination">
              <div className="pagination-info">
                <span className="pagination-text">
                  Mostrando {((paginacao.pagina - 1) * paginacao.itensPorPagina) + 1} a {Math.min(paginacao.pagina * paginacao.itensPorPagina, totalTransacoes)} de {totalTransacoes} {agruparCartao ? 'itens' : 'transações'}
                </span>
              </div>
              
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(paginacao.pagina - 1)}
                  disabled={paginacao.pagina <= 1 || loading}
                  className="pagination-button"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                
                <div className="page-numbers">
                  <span className="page-current">{paginacao.pagina}</span>
                  <span className="page-separator">de</span>
                  <span className="page-total">{paginacao.totalPaginas}</span>
                </div>
                
                <button
                  onClick={() => handlePageChange(paginacao.pagina + 1)}
                  disabled={paginacao.pagina >= paginacao.totalPaginas || loading}
                  className="pagination-button"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modais */}
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