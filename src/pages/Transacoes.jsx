import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowDown, ArrowUp, Filter, 
  Download, RefreshCw, Search, 
  Calendar, Clock, CreditCard 
} from 'lucide-react';
import useTransacoes from '../hooks/useTransacoes';
import useContas from '../hooks/useContas';
import useCategorias from '../hooks/useCategorias';
import useCartoes from '../hooks/useCartoes';
import useFaturasCartao from '../hooks/useFaturasCartao';
import { supabase } from '../lib/supabaseClient';
//import TransacoesFilter from '../components/TransacoesFilter';
import TransacaoList from '../components/TransacaoList';
import EditTransacaoModal from '../components/EditTransacaoModal';
import '../styles/Transacoes.css';

const Transacoes = () => {
  // Estados para gerenciar os dados
  const [filteredTransacoes, setFilteredTransacoes] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentTransacao, setCurrentTransacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    periodoInicio: startOfMonth(new Date()),
    periodoFim: endOfMonth(new Date()),
    efetivada: null, // null = todas, true = sim, false = não
    contaId: null,
    categoriaId: null,
    subcategoriaId: null,
    tipo: 'todas', // 'todas', 'receita', 'despesa', 'transferencia'
    cartaoId: null,
    agruparFaturas: false,
    busca: '',
    orderBy: 'data', // 'data', 'valor', 'descricao'
    orderDirection: 'desc' // 'asc', 'desc'
  });

  // Hooks para buscar dados
  const { transacoes, loading: transacoesLoading, fetchTransacoes } = useTransacoes();
  const { contas, loading: contasLoading } = useContas();
  const { categorias, categoriasDespesa, categoriasReceita } = useCategorias();
  const { cartoes, loading: cartoesLoading } = useCartoes();
  const { faturas, fetchFaturas } = useFaturasCartao();
  
  // Função para buscar transações com filtros
  const fetchFilteredTransacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar a query base
      let query = supabase
        .from('transacoes')
        .select(`
          *,
          categoria:categorias(id, nome, tipo, cor),
          subcategoria:subcategorias(id, nome),
          conta:contas(id, nome, tipo),
          cartao:cartoes(id, nome, bandeira)
        `)
        .order(filters.orderBy, { ascending: filters.orderDirection === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      // Adicionar filtros
      if (filters.periodoInicio) {
        query = query.gte('data', filters.periodoInicio.toISOString());
      }
      
      if (filters.periodoFim) {
        query = query.lte('data', filters.periodoFim.toISOString());
      }
      
      if (filters.efetivada !== null) {
        query = query.eq('efetivada', filters.efetivada);
      }
      
      if (filters.contaId) {
        query = query.eq('conta_id', filters.contaId);
      }
      
      if (filters.categoriaId) {
        query = query.eq('categoria_id', filters.categoriaId);
      }
      
      if (filters.subcategoriaId) {
        query = query.eq('subcategoria_id', filters.subcategoriaId);
      }
      
      if (filters.tipo !== 'todas') {
        query = query.eq('tipo', filters.tipo);
      }
      
      if (filters.cartaoId) {
        query = query.eq('cartao_id', filters.cartaoId);
      }
      
      if (filters.busca) {
        query = query.ilike('descricao', `%${filters.busca}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Tratamento especial para agrupar faturas de cartão
      let result = data || [];
      
      if (filters.agruparFaturas && !filters.cartaoId) {
        // Lógica para agrupar faturas por vencimento
        // (implementação detalhada dependeria da estrutura exata do banco)
        // Esta é uma implementação simplificada
        const faturasAgrupadas = [];
        const transacoesFiltradas = [];
        
        // Identificar transações de cartão e agrupá-las
        const transacoesCartao = {};
        
        result.forEach(transacao => {
          if (transacao.cartao_id && transacao.fatura_vencimento) {
            const key = `${transacao.cartao_id}_${transacao.fatura_vencimento}`;
            
            if (!transacoesCartao[key]) {
              transacoesCartao[key] = {
                id: `fatura_${key}`,
                descricao: `Fatura ${transacao.cartao?.nome || 'Cartão'} - ${format(parseISO(transacao.fatura_vencimento), 'dd/MM/yyyy')}`,
                valor: 0,
                data: transacao.fatura_vencimento,
                tipo: 'despesa',
                efetivada: false,
                cartao_id: transacao.cartao_id,
                cartao: transacao.cartao,
                categoria: { nome: 'Cartão de Crédito', cor: '#8B5CF6' },
                e_fatura_agrupada: true,
                transacoes_agrupadas: []
              };
              faturasAgrupadas.push(transacoesCartao[key]);
            }
            
            transacoesCartao[key].valor += transacao.valor;
            transacoesCartao[key].transacoes_agrupadas.push(transacao);
          } else {
            transacoesFiltradas.push(transacao);
          }
        });
        
        result = [...transacoesFiltradas, ...faturasAgrupadas];
      }
      
      // Obter contagem total para paginação
      const { count: totalCount } = await supabase
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .gte('data', filters.periodoInicio.toISOString())
        .lte('data', filters.periodoFim.toISOString());
      
      setTotalItems(totalCount || 0);
      setTotalPages(Math.ceil((totalCount || 0) / pageSize));
      setFilteredTransacoes(result);
      
    } catch (err) {
      console.error('Erro ao buscar transações filtradas:', err);
      setError('Não foi possível carregar as transações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);
  
  // Buscar transações ao carregar ou alterar filtros
  useEffect(() => {
    fetchFilteredTransacoes();
  }, [filters, currentPage, pageSize, fetchFilteredTransacoes]);
  
  // Função para aplicar filtros
  const applyFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
  };
  
  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      periodoInicio: startOfMonth(new Date()),
      periodoFim: endOfMonth(new Date()),
      efetivada: null,
      contaId: null,
      categoriaId: null,
      subcategoriaId: null,
      tipo: 'todas',
      cartaoId: null,
      agruparFaturas: false,
      busca: '',
      orderBy: 'data',
      orderDirection: 'desc'
    });
    setCurrentPage(1);
  };
  
  // Função para editar uma transação
  const handleEdit = (transacao) => {
    setCurrentTransacao(transacao);
    setEditModalOpen(true);
  };
  
  // Função após salvar a edição
  const handleSaveEdit = async () => {
    setEditModalOpen(false);
    await fetchFilteredTransacoes();
  };
  
  // Função para mudar a ordenação
  const handleChangeOrder = (field) => {
    setFilters(prev => ({
      ...prev,
      orderBy: field,
      orderDirection: 
        prev.orderBy === field 
          ? prev.orderDirection === 'asc' ? 'desc' : 'asc'
          : 'desc'
    }));
  };
  
  // Renderizar indicador de ordenação
  const renderSortIndicator = (field) => {
    if (filters.orderBy !== field) return null;
    
    return filters.orderDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />;
  };
  
  return (
    <div className="transacoes-page">
      <header className="transacoes-header">
        <h1 className="transacoes-title">Transações</h1>
        
        <div className="transacoes-actions">
          <div className="search-container">
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar transações..." 
              value={filters.busca}
              onChange={(e) => applyFilters({ busca: e.target.value })}
            />
          </div>
          
          <button 
            className="action-button filter-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="button-icon" />
            <span>Filtros</span>
          </button>
          
          <button 
            className="action-button refresh-button"
            onClick={fetchFilteredTransacoes}
            disabled={loading}
          >
            <RefreshCw className={`button-icon ${loading ? 'spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          
          <button className="action-button export-button">
            <Download className="button-icon" />
            <span>Exportar</span>
          </button>
        </div>
      </header>
      
      {isFilterOpen && (
        <TransacoesFilter 
          filters={filters}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          onClose={() => setIsFilterOpen(false)}
          contas={contas}
          categorias={categorias}
          cartoes={cartoes}
        />
      )}
      
      <div className="filter-summary">
        <div className="filter-chip">
          <Calendar className="chip-icon" />
          <span>
            {format(filters.periodoInicio, "dd MMM", { locale: ptBR })} - 
            {format(filters.periodoFim, " dd MMM yyyy", { locale: ptBR })}
          </span>
        </div>
        
        {filters.tipo !== 'todas' && (
          <div className="filter-chip">
            {filters.tipo === 'receita' ? (
              <ArrowUp className="chip-icon text-green-500" />
            ) : filters.tipo === 'despesa' ? (
              <ArrowDown className="chip-icon text-red-500" />
            ) : (
              <RefreshCw className="chip-icon text-blue-500" />
            )}
            <span>
              {filters.tipo === 'receita' 
                ? 'Receitas' 
                : filters.tipo === 'despesa' 
                  ? 'Despesas' 
                  : 'Transferências'}
            </span>
          </div>
        )}
        
        {filters.efetivada !== null && (
          <div className="filter-chip">
            <Clock className="chip-icon" />
            <span>{filters.efetivada ? 'Efetivadas' : 'Pendentes'}</span>
          </div>
        )}
        
        {filters.agruparFaturas && (
          <div className="filter-chip">
            <CreditCard className="chip-icon" />
            <span>Faturas agrupadas</span>
          </div>
        )}
        
        {(filters.tipo !== 'todas' || 
          filters.efetivada !== null || 
          filters.contaId || 
          filters.categoriaId || 
          filters.cartaoId || 
          filters.agruparFaturas) && (
          <button 
            className="clear-filters"
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchFilteredTransacoes}>Tentar novamente</button>
        </div>
      )}
      
      <div className="transacoes-table-header">
        <div 
          className={`header-cell cell-data ${filters.orderBy === 'data' ? 'active-sort' : ''}`}
          onClick={() => handleChangeOrder('data')}
        >
          <span>Data</span>
          {renderSortIndicator('data')}
        </div>
        <div 
          className={`header-cell cell-descricao ${filters.orderBy === 'descricao' ? 'active-sort' : ''}`}
          onClick={() => handleChangeOrder('descricao')}
        >
          <span>Descrição</span>
          {renderSortIndicator('descricao')}
        </div>
        <div className="header-cell cell-categoria">
          <span>Categoria</span>
        </div>
        <div className="header-cell cell-conta">
          <span>Conta/Cartão</span>
        </div>
        <div 
          className={`header-cell cell-valor ${filters.orderBy === 'valor' ? 'active-sort' : ''}`}
          onClick={() => handleChangeOrder('valor')}
        >
          <span>Valor</span>
          {renderSortIndicator('valor')}
        </div>
        <div className="header-cell cell-acoes">
          <span>Ações</span>
        </div>
      </div>
      
      <TransacaoList 
        transacoes={filteredTransacoes}
        loading={loading}
        onEdit={handleEdit}
        onDelete={() => {}}
        onMarkAsCompleted={() => {}}
      />
      
      <div className="pagination">
        <div className="pagination-info">
          Mostrando {filteredTransacoes.length} de {totalItems} transações
        </div>
        
        <div className="pagination-controls">
          <select 
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="page-size-select"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
          
          <button 
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Anterior
          </button>
          
          <div className="page-info">
            Página {currentPage} de {totalPages}
          </div>
          
          <button 
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Próxima
          </button>
        </div>
      </div>
      
      {editModalOpen && (
        <EditTransacaoModal
          transacao={currentTransacao}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveEdit}
          contas={contas}
          categorias={categorias}
          cartoes={cartoes}
        />
      )}
    </div>
  );
};

export default Transacoes;