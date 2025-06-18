import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';

// Styles
import '@modules/transacoes/styles/TransacoesPage.css';

// Layouts
import PageContainer from '@shared/components/layouts/PageContainer';

// UI Components
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';

// Modals
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';

// Utils
import formatCurrency from '@shared/utils/formatCurrency';

// Hooks
import useAuth from '@modules/auth/hooks/useAuth';
import { useTransactionsStore } from '@modules/transacoes/store/transactionsStore';

const TransacoesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Store
  const {
    transacoes,
    loading,
    error,
    updateTransacao,
    deleteTransacao
  } = useTransactionsStore();

  // Estados básicos
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDespesasModal, setShowDespesasModal] = useState(false);
  const [showReceitasModal, setShowReceitasModal] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transacaoParaConfirm, setTransacaoParaConfirm] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [groupByCard, setGroupByCard] = useState(false);

  // Estados para funcionalidades novas
  const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'desc' });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    categoria: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // Período
  const dataInicio = startOfMonth(currentDate);
  const dataFim = endOfMonth(currentDate);

  // Função para buscar transações
  const fetchTransacoes = async () => {
    if (!user?.id) return;

    try {
      useTransactionsStore.setState({ loading: true, error: null });
      
      const { default: supabase } = await import('@lib/supabaseClient');
      
      const { data, error } = await supabase.rpc('gpt_transacoes_do_mes', {
        p_usuario_id: user.id,
        p_data_inicio: format(dataInicio, 'yyyy-MM-dd'),
        p_data_fim: format(dataFim, 'yyyy-MM-dd')
      });

      if (error) throw error;
      
      useTransactionsStore.setState({ 
        transacoes: data || [], 
        loading: false 
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      useTransactionsStore.setState({ 
        error: error.message, 
        loading: false 
      });
    }
  };

  // Carregar dados
  useEffect(() => {
    if (user?.id) {
      fetchTransacoes();
    }
  }, [user?.id, currentDate]);

  // Filtrar e ordenar transações
  const transacoesProcessadas = useMemo(() => {
    let filtered = [...transacoes];

    // Aplicar filtros básicos
    if (filters.tipo) {
      filtered = filtered.filter(t => t.tipo === filters.tipo);
    }
    if (filters.status) {
      const isEfetivado = filters.status === 'efetivadas';
      filtered = filtered.filter(t => t.efetivado === isEfetivado);
    }

    // Agrupar por cartão se solicitado
    if (groupByCard && filtered.length > 0) {
      const cartaoGroups = {};
      const nonCardTransactions = [];

      filtered.forEach(transacao => {
        if (transacao.cartao_id && transacao.tipo === 'despesa') {
          const key = transacao.cartao_id;
          
          if (!cartaoGroups[key]) {
            cartaoGroups[key] = {
              id: `fatura-${key}`,
              tipo: 'fatura',
              descricao: `Fatura ${transacao.cartao_nome || 'Cartão'}`,
              cartao_nome: transacao.cartao_nome || 'Cartão',
              cartao_id: transacao.cartao_id,
              data: transacao.data,
              valor: 0,
              efetivado: true,
              categoria_nome: 'Fatura Cartão',
              categoria_cor: '#DC3545',
              conta_nome: '-',
              transacoes: []
            };
          }
          
          cartaoGroups[key].valor += transacao.valor;
          cartaoGroups[key].transacoes.push(transacao);
        } else {
          nonCardTransactions.push(transacao);
        }
      });
      
      const faturas = Object.values(cartaoGroups);
      if (faturas.length > 0) {
        filtered = [...faturas, ...nonCardTransactions];
      }
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'data') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortConfig.key === 'valor') {
        aValue = Math.abs(aValue);
        bValue = Math.abs(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [transacoes, filters, sortConfig, groupByCard]);

  // Paginação
  const totalPages = Math.ceil(transacoesProcessadas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const transacoesPaginadas = transacoesProcessadas.slice(startIndex, endIndex);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const receitas = transacoesProcessadas.filter(t => t.tipo === 'receita');
    const despesas = transacoesProcessadas.filter(t => t.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((acc, t) => acc + Math.abs(t.valor), 0);
    const totalDespesas = despesas.reduce((acc, t) => acc + Math.abs(t.valor), 0);
    
    return {
      receitas: { total: totalReceitas, quantidade: receitas.length },
      despesas: { total: totalDespesas, quantidade: despesas.length },
      saldo: totalReceitas - totalDespesas,
      totalTransacoes: transacoesProcessadas.length
    };
  }, [transacoesProcessadas]);

  // Handlers - Navegação
  const handleNavigateMonth = (direction) => {
    if (loading) return;
    
    let newDate;
    if (direction === 'prev') {
      newDate = subMonths(currentDate, 1);
    } else if (direction === 'next') {
      newDate = addMonths(currentDate, 1);
    } else {
      newDate = new Date();
    }
    
    setCurrentDate(newDate);
    setCurrentPage(1);
  };

  // Handlers - Ordenação
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Handlers - Filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ tipo: '', status: '', categoria: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Handlers - Ações das transações
  const handleToggleEfetivado = (transacao) => {
    setTransacaoParaConfirm(transacao);
    setConfirmAction('toggle_efetivado');
    setShowConfirmModal(true);
  };

  const handleDeleteTransacao = (transacao) => {
    setTransacaoParaConfirm(transacao);
    setConfirmAction('delete');
    setShowConfirmModal(true);
  };

  const handleEditTransacao = (transacao) => {
    setTransacaoEditando(transacao);
    if (transacao.tipo === 'receita') {
      setShowReceitasModal(true);
    } else {
      setShowDespesasModal(true);
    }
  };

  const executeConfirmAction = async () => {
    if (!transacaoParaConfirm || !confirmAction) return;

    try {
      if (confirmAction === 'toggle_efetivado') {
        await updateTransacao(transacaoParaConfirm.id, {
          efetivado: !transacaoParaConfirm.efetivado
        });
      } else if (confirmAction === 'delete') {
        await deleteTransacao(transacaoParaConfirm.id);
      }
      
      setShowConfirmModal(false);
      setTransacaoParaConfirm(null);
      setConfirmAction(null);
      fetchTransacoes();
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    }
  };

  // Componente - Cabeçalho da tabela
  const TableHeader = ({ label, sortKey, className = '' }) => {
    const isSorted = sortConfig.key === sortKey;
    const direction = isSorted ? sortConfig.direction : null;
    
    return (
      <th 
        className={`sortable-header ${className} ${isSorted ? 'sorted' : ''}`}
        onClick={() => handleSort(sortKey)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {label}
          <span style={{ marginLeft: '4px', opacity: isSorted ? 1 : 0.5 }}>
            {!isSorted && '⇅'}
            {isSorted && direction === 'asc' && '↑'}
            {isSorted && direction === 'desc' && '↓'}
          </span>
        </div>
      </th>
    );
  };

  // Componente - Linha da transação
  const TransactionRow = ({ transacao }) => {
    const isReceita = transacao.tipo === 'receita';
    const isFatura = transacao.tipo === 'fatura';
    
    return (
      <tr className={`transaction-row ${!transacao.efetivado ? 'pending' : ''}`}>
        <td>{format(new Date(transacao.data), 'dd/MM/yyyy')}</td>
        <td>
          <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {transacao.descricao}
          </div>
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: transacao.categoria_cor || '#6B7280',
                flexShrink: 0
              }}
            />
            <span style={{ fontSize: '0.875rem' }}>{transacao.categoria_nome}</span>
          </div>
        </td>
        <td>{isFatura ? '-' : transacao.conta_nome}</td>
        <td style={{ textAlign: 'right' }}>
          <span 
            className={`valor ${isReceita ? 'receita' : 'despesa'}`}
            style={{ 
              fontWeight: 'bold',
              color: isReceita ? '#10b981' : '#ef4444'
            }}
          >
            {isReceita ? '+' : '-'} {formatCurrency(Math.abs(transacao.valor))}
          </span>
        </td>
        <td style={{ textAlign: 'center' }}>
          <button
            className={`status-badge ${transacao.efetivado ? 'efetivado' : 'pendente'}`}
            onClick={() => !isFatura && handleToggleEfetivado(transacao)}
            disabled={isFatura}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              cursor: isFatura ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: transacao.efetivado ? '#ecfdf5' : '#fffbeb',
              color: transacao.efetivado ? '#10b981' : '#f59e0b',
              opacity: isFatura ? 0.6 : 1
            }}
          >
            {transacao.efetivado ? '✓' : '⚠'}
          </button>
        </td>
        <td style={{ textAlign: 'center' }}>
          {!isFatura && (
            <div className="action-buttons" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              <button 
                onClick={() => handleEditTransacao(transacao)}
                style={{
                  width: '28px',
                  height: '28px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
                title="Editar"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDeleteTransacao(transacao)}
                style={{
                  width: '28px',
                  height: '28px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
                title="Excluir"
              >
                🗑️
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  // Componente - Modal de Filtros Simples
  const FilterModal = () => {
    if (!showFilterModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', fontWeight: '600' }}>
            Filtros
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                Tipo
              </label>
              <select
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Todos os tipos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Todos os status</option>
                <option value="efetivadas">Efetivadas</option>
                <option value="pendentes">Pendentes</option>
              </select>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '8px', 
            marginTop: '24px' 
          }}>
            <Button 
              onClick={clearFilters}
              style={{ 
                backgroundColor: '#f3f4f6', 
                color: '#374151', 
                border: 'none' 
              }}
            >
              Limpar
            </Button>
            <Button onClick={() => setShowFilterModal(false)}>
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Componente - Modal de Confirmação
  const ConfirmModal = () => {
    if (!showConfirmModal || !transacaoParaConfirm) return null;

    const isDelete = confirmAction === 'delete';
    const isToggle = confirmAction === 'toggle_efetivado';
    const novoStatus = isToggle ? !transacaoParaConfirm.efetivado : null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', fontWeight: '600' }}>
            {isDelete ? 'Confirmar Exclusão' : 'Confirmar Alteração'}
          </h3>
          
          <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
            {isDelete && 'Tem certeza que deseja excluir esta transação?'}
            {isToggle && `Deseja ${novoStatus ? 'efetivar' : 'marcar como pendente'} esta transação?`}
          </p>
          
          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '12px',
            borderRadius: '8px',
            margin: '16px 0'
          }}>
            <strong>{transacaoParaConfirm.descricao}</strong>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#7c3aed', marginTop: '4px' }}>
              {formatCurrency(Math.abs(transacaoParaConfirm.valor))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button 
              onClick={() => setShowConfirmModal(false)}
              style={{ backgroundColor: '#f3f4f6', color: '#374151', border: 'none' }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={executeConfirmAction}
              style={{
                backgroundColor: isDelete ? '#ef4444' : '#7c3aed',
                color: 'white'
              }}
            >
              {isDelete ? 'Excluir' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Componente - Paginação
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #f3f4f6',
        marginTop: '16px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Mostrando {startIndex + 1}-{Math.min(endIndex, transacoesProcessadas.length)} de {transacoesProcessadas.length} transações
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            ← Anterior
          </button>
          
          <span style={{ padding: '0 8px', fontSize: '0.875rem' }}>
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              borderRadius: '6px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Próxima →
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Itens por página:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '4px 8px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    );
  };

  // Estados de erro/loading
  if (error) {
    return (
      <PageContainer title="Transações">
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3>Erro ao carregar transações</h3>
          <p>{error}</p>
          <Button onClick={fetchTransacoes}>Tentar Novamente</Button>
        </div>
      </PageContainer>
    );
  }

  if (!loading && transacoesProcessadas.length === 0) {
    return (
      <PageContainer title="Transações">
        <div className="transacoes-header">
          <div className="period-navigation">
            <button onClick={() => handleNavigateMonth('prev')} className="nav-btn">
              ←
            </button>
            <h2 className="current-period">
              {format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}
            </h2>
            <button onClick={() => handleNavigateMonth('next')} className="nav-btn">
              →
            </button>
            <button onClick={() => handleNavigateMonth('today')} className="today-btn">
              Hoje
            </button>
          </div>
        </div>
        
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <h3>Nenhuma transação encontrada</h3>
          <p>
            {hasActiveFilters
              ? 'Nenhuma transação corresponde aos filtros aplicados.'
              : 'Comece adicionando sua primeira transação financeira.'
            }
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters}>Limpar Filtros</Button>
          )}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Transações">
      {/* Header */}
      <div className="transacoes-header">
        <div className="period-navigation">
          <button 
            onClick={() => handleNavigateMonth('prev')} 
            disabled={loading}
            className="nav-btn"
          >
            ←
          </button>
          <h2 className="current-period">
            {format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}
          </h2>
          <button 
            onClick={() => handleNavigateMonth('next')} 
            disabled={loading}
            className="nav-btn"
          >
            →
          </button>
          <button 
            onClick={() => handleNavigateMonth('today')} 
            disabled={loading}
            className="today-btn"
          >
            Hoje
          </button>
        </div>

        <div className="header-controls">
          <Button
            onClick={() => setShowFilterModal(true)}
            style={{
              backgroundColor: hasActiveFilters ? '#eff6ff' : '#f3f4f6',
              color: hasActiveFilters ? '#3b82f6' : '#374151',
              border: hasActiveFilters ? '1px solid #93c5fd' : '1px solid #e5e7eb'
            }}
          >
            🔍 Filtros {hasActiveFilters && `(${Object.values(filters).filter(v => v).length})`}
          </Button>
          
          <button
            className={`group-toggle ${groupByCard ? 'active' : ''}`}
            onClick={() => setGroupByCard(!groupByCard)}
          >
            💳 {groupByCard ? 'Desagrupar' : 'Agrupar'}
          </button>
        </div>
      </div>

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#2563eb' }}>Filtros ativos:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            return (
              <span
                key={key}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {value}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '4px'
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
          <Button 
            onClick={clearFilters}
            style={{ 
              fontSize: '0.75rem', 
              padding: '4px 8px', 
              backgroundColor: 'transparent',
              color: '#2563eb',
              border: '1px solid #93c5fd'
            }}
          >
            Limpar todos
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Carregando transações...</p>
        </div>
      )}

      {/* Conteúdo principal */}
      {!loading && transacoesProcessadas.length > 0 && (
        <div className="transacoes-content">
          {/* Tabela */}
          <div className="table-container">
            <Card className="transactions-table-card">
              <div style={{ overflowX: 'auto' }}>
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <TableHeader label="Data" sortKey="data" />
                      <TableHeader label="Descrição" sortKey="descricao" />
                      <TableHeader label="Categoria" sortKey="categoria_nome" />
                      <TableHeader label="Conta" sortKey="conta_nome" />
                      <TableHeader label="Valor" sortKey="valor" />
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoesPaginadas.map((transacao, index) => (
                      <TransactionRow key={transacao.id || index} transacao={transacao} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Paginação */}
            <Pagination />
          </div>

          {/* Sidebar com estatísticas */}
          <aside className="resumo-sidebar">
            <Card>
              <h3>Resumo Financeiro</h3>
              <div className="stats-grid">
                <div className="stat-card receitas">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <span className="stat-label">Receitas</span>
                    <span className="stat-value">{formatCurrency(estatisticas.receitas.total)}</span>
                    <span className="stat-count">{estatisticas.receitas.quantidade} transações</span>
                  </div>
                </div>

                <div className="stat-card despesas">
                  <div className="stat-icon">💸</div>
                  <div className="stat-content">
                    <span className="stat-label">Despesas</span>
                    <span className="stat-value">{formatCurrency(estatisticas.despesas.total)}</span>
                    <span className="stat-count">{estatisticas.despesas.quantidade} transações</span>
                  </div>
                </div>

                <div className="stat-card saldo">
                  <div className="stat-icon">{estatisticas.saldo >= 0 ? '📈' : '📉'}</div>
                  <div className="stat-content">
                    <span className="stat-label">Saldo do Período</span>
                    <span className={`stat-value ${estatisticas.saldo >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(estatisticas.saldo)}
                    </span>
                    <span className="stat-count">
                      {estatisticas.saldo >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3>Estatísticas do Período</h3>
              <div className="extra-stats">
                <div className="extra-stat">
                  <span className="extra-stat-label">Total de Transações</span>
                  <span className="extra-stat-value">{estatisticas.totalTransacoes}</span>
                </div>
                
                {estatisticas.totalTransacoes > 0 && (
                  <div className="extra-stat">
                    <span className="extra-stat-label">Valor Médio</span>
                    <span className="extra-stat-value">
                      {formatCurrency((estatisticas.receitas.total + estatisticas.despesas.total) / estatisticas.totalTransacoes)}
                    </span>
                  </div>
                )}
                
                <div className="extra-stat">
                  <span className="extra-stat-label">Período</span>
                  <span className="extra-stat-value">
                    {format(dataInicio, 'dd/MM')} - {format(dataFim, 'dd/MM')}
                  </span>
                </div>

                {hasActiveFilters && (
                  <div className="extra-stat">
                    <span className="extra-stat-label">Filtros Aplicados</span>
                    <span className="extra-stat-value">
                      {Object.values(filters).filter(v => v).length} ativo(s)
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </aside>
        </div>
      )}

      {/* Modais */}
      <FilterModal />
      <ConfirmModal />

      {showDespesasModal && (
        <DespesasModal
          isOpen={showDespesasModal}
          onClose={() => {
            setShowDespesasModal(false);
            setTransacaoEditando(null);
          }}
          onSave={fetchTransacoes}
          transacaoEditando={transacaoEditando}
        />
      )}

      {showReceitasModal && (
        <ReceitasModal
          isOpen={showReceitasModal}
          onClose={() => {
            setShowReceitasModal(false);
            setTransacaoEditando(null);
          }}
          onSave={fetchTransacoes}
          transacaoEditando={transacaoEditando}
        />
      )}
    </PageContainer>
  );
};

export default TransacoesPage;