import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';

// Styles
import '@modules/transacoes/styles/TransacoesPage.css';

// Layouts
import PageContainer from '@shared/components/layouts/PageContainer';

// UI Components
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import ToolTip from '@shared/components/ui/ToolTip';
import InputMoney from '@shared/components/ui/InputMoney';

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

  // Estados locais
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDespesasModal, setShowDespesasModal] = useState(false);
  const [showReceitasModal, setShowReceitasModal] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [showConfirmEfetivarModal, setShowConfirmEfetivarModal] = useState(false);
  const [transacaoParaEfetivar, setTransacaoParaEfetivar] = useState(null);
  const [groupByCard, setGroupByCard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isNavigating, setIsNavigating] = useState(false);

  // Período
  const dataInicio = startOfMonth(currentDate);
  const dataFim = endOfMonth(currentDate);

  // Função para buscar transações
  const fetchTransacoesComPeriodo = async () => {
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
      fetchTransacoesComPeriodo();
    }
  }, [user?.id, currentDate]);

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar transações
  const transacoesFiltradas = useMemo(() => {
    let filtered = [...transacoes];

    // Filtros da URL
    const tipo = searchParams.get('tipo');
    const temCartao = searchParams.get('tem_cartao');
    
    if (tipo === 'receita') {
      filtered = filtered.filter(t => t.tipo === 'receita');
    } else if (tipo === 'despesa') {
      filtered = filtered.filter(t => t.tipo === 'despesa');
    } else if (temCartao === 'true') {
      filtered = filtered.filter(t => t.cartao_id !== null);
    }

    // Agrupar por cartão
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

    // Ordenar por data
    filtered.sort((a, b) => new Date(b.data) - new Date(a.data));

    return filtered;
  }, [transacoes, searchParams, groupByCard]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const receitas = transacoesFiltradas.filter(t => t.tipo === 'receita');
    const despesas = transacoesFiltradas.filter(t => t.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((acc, t) => acc + Math.abs(t.valor), 0);
    const totalDespesas = despesas.reduce((acc, t) => acc + Math.abs(t.valor), 0);
    
    return {
      receitas: { total: totalReceitas, quantidade: receitas.length },
      despesas: { total: totalDespesas, quantidade: despesas.length },
      saldo: totalReceitas - totalDespesas
    };
  }, [transacoesFiltradas]);

  // Handlers
  const handleNavigateMonth = (direction) => {
    if (loading || isNavigating) return;
    
    setIsNavigating(true);
    
    let newDate;
    if (direction === 'prev') {
      newDate = subMonths(currentDate, 1);
    } else if (direction === 'next') {
      newDate = addMonths(currentDate, 1);
    } else {
      newDate = new Date();
    }
    
    setCurrentDate(newDate);
    setIsNavigating(false);
  };

  const handleToggleEfetivado = (transacao) => {
    setTransacaoParaEfetivar(transacao);
    setShowConfirmEfetivarModal(true);
  };

  const confirmarEfetivacao = async () => {
    if (!transacaoParaEfetivar) return;

    try {
      await updateTransacao(transacaoParaEfetivar.id, {
        efetivado: !transacaoParaEfetivar.efetivado
      });
      setShowConfirmEfetivarModal(false);
      setTransacaoParaEfetivar(null);
      fetchTransacoesComPeriodo();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleExcluir = async (transacaoId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      await deleteTransacao(transacaoId);
      fetchTransacoesComPeriodo();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
    }
  };

  const handleEditar = (transacao) => {
    setTransacaoEditando(transacao);
    
    if (transacao.tipo === 'receita') {
      setShowReceitasModal(true);
    } else {
      setShowDespesasModal(true);
    }
  };

  const getActiveFilter = () => {
    const tipo = searchParams.get('tipo');
    const temCartao = searchParams.get('tem_cartao');
    
    if (tipo === 'receita') return 'receitas';
    if (tipo === 'despesa') return 'despesas';
    if (temCartao === 'true') return 'cartoes';
    
    return 'todas';
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  // Modal de confirmação
  const ConfirmEfetivarModal = () => {
    if (!showConfirmEfetivarModal || !transacaoParaEfetivar) return null;

    const isReceita = transacaoParaEfetivar.tipo === 'receita';
    const novoStatus = !transacaoParaEfetivar.efetivado;

    return (
      <div className="modal-overlay">
        <div className="modal-container confirm-modal">
          <div className="modal-header">
            <h2>Confirmar {novoStatus ? 'Efetivação' : 'Alteração'}</h2>
            <button onClick={() => setShowConfirmEfetivarModal(false)}>✕</button>
          </div>
          <div className="modal-content">
            <p>Deseja {novoStatus ? 'efetivar' : 'marcar como pendente'} esta {isReceita ? 'receita' : 'despesa'}?</p>
            <p><strong>{transacaoParaEfetivar.descricao}</strong></p>
            <p>{formatCurrency(Math.abs(transacaoParaEfetivar.valor))}</p>
          </div>
          <div className="modal-actions">
            <Button onClick={() => setShowConfirmEfetivarModal(false)}>Cancelar</Button>
            <Button onClick={confirmarEfetivacao}>Confirmar</Button>
          </div>
        </div>
      </div>
    );
  };

  // Render transação
  const TransactionRow = ({ transacao }) => {
    const isReceita = transacao.tipo === 'receita';
    const isFatura = transacao.tipo === 'fatura';
    
    return (
      <tr className={`transaction-row ${!transacao.efetivado ? 'pending' : ''}`}>
        <td>{format(new Date(transacao.data), 'dd/MM')}</td>
        <td>{transacao.descricao}</td>
        <td>{transacao.categoria_nome}</td>
        <td>{isFatura ? '-' : transacao.conta_nome}</td>
        <td>
          <span className={`valor ${isReceita ? 'receita' : 'despesa'}`}>
            {isReceita ? '+' : '-'} {formatCurrency(Math.abs(transacao.valor))}
          </span>
        </td>
        <td>
          <button
            className={`status-badge ${transacao.efetivado ? 'efetivado' : 'pendente'}`}
            onClick={() => !isFatura && handleToggleEfetivado(transacao)}
            disabled={isFatura}
            title={isFatura ? 'Fatura' : transacao.efetivado ? 'Efetivado' : 'Pendente'}
          />
        </td>
        <td>
          {!isFatura && (
            <div className="action-buttons">
              <button onClick={() => handleEditar(transacao)} title="Editar">
                ✏️
              </button>
              <button onClick={() => handleExcluir(transacao.id)} title="Excluir">
                🗑️
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  // Estados de erro/loading
  if (error) {
    return (
      <PageContainer title="Transações">
        <div className="empty-state">
          <h3>Erro ao carregar transações</h3>
          <p>{error}</p>
          <Button onClick={fetchTransacoesComPeriodo}>Tentar Novamente</Button>
        </div>
      </PageContainer>
    );
  }

  if (!loading && transacoesFiltradas.length === 0) {
    return (
      <PageContainer title="Transações">
        <div className="transacoes-header">
          <div className="period-navigation">
            <button onClick={() => handleNavigateMonth('prev')} aria-label="Mês anterior">
              ◀️
            </button>
            <h2>{format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}</h2>
            <button onClick={() => handleNavigateMonth('next')} aria-label="Próximo mês">
              ▶️
            </button>
            <button onClick={() => handleNavigateMonth('today')}>Hoje</button>
          </div>
        </div>
        
        <div className="empty-state">
          <h3>Nenhuma transação encontrada!</h3>
          <p>
            {getActiveFilter() !== 'todas'
              ? 'Nenhuma transação corresponde aos filtros aplicados.'
              : 'Comece adicionando sua primeira transação financeira.'
            }
          </p>
          {getActiveFilter() !== 'todas' && (
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
            aria-label="Mês anterior"
          >
            ◀️
          </button>
          <h2>{format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}</h2>
          <button 
            onClick={() => handleNavigateMonth('next')} 
            disabled={loading}
            aria-label="Próximo mês"
          >
            ▶️
          </button>
          <button 
            onClick={() => handleNavigateMonth('today')} 
            disabled={loading}
          >
            Hoje
          </button>
        </div>

        <div className="header-controls">
          <button
            className={`group-toggle ${groupByCard ? 'active' : ''}`}
            onClick={() => setGroupByCard(!groupByCard)}
          >
            💳 {groupByCard ? 'Desagrupar' : 'Agrupar'} Faturas
          </button>
        </div>
      </div>

      {/* Filtro ativo */}
      {getActiveFilter() !== 'todas' && (
        <div className="filter-indicator">
          <span>Filtrando: {getActiveFilter()}</span>
          <span>({transacoesFiltradas.length} transações)</span>
          <button onClick={clearFilters}>Limpar</button>
        </div>
      )}

      {/* Loading */}
      {(loading || isNavigating) && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      )}

      {/* Conteúdo */}
      {!loading && !isNavigating && (
        <div className="transacoes-content">
          {/* Tabela */}
          <Card className="transactions-table-card">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Conta</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {transacoesFiltradas.map((transacao, index) => (
                  <TransactionRow key={transacao.id || index} transacao={transacao} />
                ))}
              </tbody>
            </table>
          </Card>

          {/* Sidebar com estatísticas */}
          <aside className="resumo-sidebar">
            <Card>
              <h3>Resumo Financeiro</h3>
              <div className="stats">
                <div className="stat receitas">
                  <span>Receitas</span>
                  <span>{formatCurrency(estatisticas.receitas.total)}</span>
                </div>
                <div className="stat despesas">
                  <span>Despesas</span>
                  <span>{formatCurrency(estatisticas.despesas.total)}</span>
                </div>
                <div className="stat saldo">
                  <span>Balanço Mensal</span>
                  <span className={estatisticas.saldo >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(estatisticas.saldo)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Card adicional com estatísticas extras */}
            <Card>
              <h3>Este Mês</h3>
              <div className="stats">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '12px', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  <span>Total de transações</span>
                  <span style={{ fontWeight: '600' }}>
                    {estatisticas.receitas.quantidade + estatisticas.despesas.quantidade}
                  </span>
                </div>
                {estatisticas.despesas.quantidade > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '12px', 
                    color: '#374151' 
                  }}>
                    <span>Valor médio</span>
                    <span style={{ fontWeight: '600', color: '#DC2626' }}>
                      {formatCurrency(estatisticas.despesas.total / estatisticas.despesas.quantidade)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </aside>
        </div>
      )}

      {/* Modais */}
      {showDespesasModal && (
        <DespesasModal
          isOpen={showDespesasModal}
          onClose={() => {
            setShowDespesasModal(false);
            setTransacaoEditando(null);
          }}
          onSave={fetchTransacoesComPeriodo}
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
          onSave={fetchTransacoesComPeriodo}
          transacaoEditando={transacaoEditando}
        />
      )}

      <ConfirmEfetivarModal />
    </PageContainer>
  );
};

export default TransacoesPage;