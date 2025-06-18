import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// Store Zustand
import { useTransactionsStore } from '@modules/transacoes/store/transactionsStore';

const TransacoesPage = () => {
  // =============================================
  // ZUSTAND STORE - ESTADO CENTRALIZADO
  // =============================================
  const {
    // Dados
    transacoes,
    loading,
    error,
    filtros,
    paginacao,
    
    // Ações principais
    fetchTransacoes,
    updateTransacao,
    deleteTransacao,
    
    // Filtros
    setFiltros,
    limparFiltros,
    hasActiveFilters,
    
    // Getters
    estatisticas,
    getById: getTransacaoById
  } = useTransactionsStore();

  // =============================================
  // ESTADOS LOCAIS (APENAS UI)
  // =============================================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortField, setSortField] = useState('data');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [groupByCard, setGroupByCard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Estados dos modais
  const [showDespesasModal, setShowDespesasModal] = useState(false);
  const [showReceitasModal, setShowReceitasModal] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [showConfirmEfetivarModal, setShowConfirmEfetivarModal] = useState(false);
  const [transacaoParaEfetivar, setTransacaoParaEfetivar] = useState(null);
  const [showPagamentoFaturaModal, setShowPagamentoFaturaModal] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);

  // Estados dos filtros temporários (antes de aplicar)
  const [filtrosTemp, setFiltrosTemp] = useState({
    tipo: [],
    categoria: [],
    subcategoria: [],
    conta: [],
    cartao: [],
    status: [],
    dataInicio: '',
    dataFim: '',
    valorMinimo: 0,
    valorMaximo: 10000,
    tipoReceita: [],
    tipoDespesa: []
  });

  // Estados para dados auxiliares dos filtros
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);

  // =============================================
  // HOOKS
  // =============================================
  const { user } = useAuth();

  // Detectar mudanças de tela
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // PERÍODO ATUAL
  // =============================================
  const dataInicio = startOfMonth(currentDate);
  const dataFim = endOfMonth(currentDate);

  // =============================================
  // CARREGAR DADOS INICIAIS
  // =============================================
  useEffect(() => {
    if (user?.id) {
      // Configurar período na store
      setFiltros({
        periodo: {
          inicio: dataInicio,
          fim: dataFim
        }
      });
      
      // Buscar transações
      fetchTransacoes();
      
      // Carregar dados auxiliares
      carregarDadosFiltros();
    }
  }, [user?.id, currentDate, fetchTransacoes, setFiltros]);

  // =============================================
  // CARREGAR DADOS PARA FILTROS
  // =============================================
  const carregarDadosFiltros = async () => {
    if (!user?.id) return;

    try {
      const { default: supabase } = await import('@lib/supabaseClient');
      
      const [categoriasRes, subcategoriasRes, contasRes, cartoesRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome'),
        supabase.from('subcategorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome'),
        supabase.from('contas').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome'),
        supabase.from('cartoes').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
      setContas(contasRes.data || []);
      setCartoes(cartoesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error);
    }
  };

  // =============================================
  // PROCESSAMENTO DE TRANSAÇÕES (usando store)
  // =============================================
  const transacoesFiltradas = React.useMemo(() => {
    let filtered = [...transacoes];

    // Agrupar por cartão se necessário
    if (groupByCard) {
      const cartaoGroups = {};
      const nonCardTransactions = [];

      filtered.forEach(transacao => {
        if (transacao.cartao_id && transacao.tipo === 'despesa') {
          const mesReferencia = format(new Date(transacao.data), 'yyyy-MM');
          const key = `${transacao.cartao_id}-${mesReferencia}`;
          
          if (!cartaoGroups[key]) {
            const cartaoNome = cartoes.find(c => c.id === transacao.cartao_id)?.nome || transacao.cartao_nome || 'Cartão';
            
            cartaoGroups[key] = {
              id: `fatura-${key}`,
              tipo: 'fatura',
              descricao: `Fatura ${cartaoNome} - ${format(new Date(transacao.data), 'MMM/yyyy', { locale: ptBR })}`,
              cartao_nome: cartaoNome,
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

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'data') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortField === 'valor') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transacoes, groupByCard, cartoes, sortField, sortDirection]);

  // =============================================
  // HANDLERS
  // =============================================
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
    
    console.log('📅 Navegando para:', format(newDate, 'MMMM/yyyy', { locale: ptBR }));
    setCurrentDate(newDate);
    setIsNavigating(false);
  };

  const handleToggleEfetivado = async (transacao) => {
    setTransacaoParaEfetivar(transacao);
    setShowConfirmEfetivarModal(true);
  };

  const confirmarEfetivacao = async () => {
    if (!transacaoParaEfetivar) return;

    try {
      const novoStatus = !transacaoParaEfetivar.efetivado;
      
      const result = await updateTransacao(transacaoParaEfetivar.id, {
        efetivado: novoStatus
      });

      if (result.success) {
        setShowConfirmEfetivarModal(false);
        setTransacaoParaEfetivar(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleExcluir = async (transacaoId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }

    try {
      await deleteTransacao(transacaoId);
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
    }
  };

  const handleEditar = (transacao) => {
    setTransacaoEditando(transacao);
    
    if (transacao.tipo === 'receita') {
      setShowReceitasModal(true);
    } else if (transacao.tipo === 'despesa') {
      setShowDespesasModal(true);
    }
  };

  const handlePagarFatura = (fatura) => {
    setSelectedFatura(fatura);
    setShowPagamentoFaturaModal(true);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltrosTemp(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const aplicarFiltrosManual = () => {
    // Converter filtros temporários para formato da store
    const novosFiltros = {
      tipos: filtrosTemp.tipo,
      categorias: filtrosTemp.categoria,
      contas: filtrosTemp.conta,
      cartoes: filtrosTemp.cartao,
      status: filtrosTemp.status,
      valorMinimo: filtrosTemp.valorMinimo,
      valorMaximo: filtrosTemp.valorMaximo,
      dataInicio: filtrosTemp.dataInicio ? new Date(filtrosTemp.dataInicio) : null,
      dataFim: filtrosTemp.dataFim ? new Date(filtrosTemp.dataFim) : null
    };
    
    setFiltros(novosFiltros);
    setShowFilters(false);
  };

  const limparFiltrosCompleto = () => {
    const filtrosLimpos = {
      tipo: [],
      categoria: [],
      subcategoria: [],
      conta: [],
      cartao: [],
      status: [],
      dataInicio: '',
      dataFim: '',
      valorMinimo: 0,
      valorMaximo: 10000,
      tipoReceita: [],
      tipoDespesa: []
    };
    
    setFiltrosTemp(filtrosLimpos);
    limparFiltros();
    setShowFilters(false);
  };

  // =============================================
  // MODAL DE CONFIRMAÇÃO DE EFETIVAÇÃO
  // =============================================
  const ConfirmEfetivarModal = () => {
    if (!showConfirmEfetivarModal || !transacaoParaEfetivar) return null;

    const isReceita = transacaoParaEfetivar.tipo === 'receita';
    const novoStatus = !transacaoParaEfetivar.efetivado;
    const acao = novoStatus ? 'efetivar' : 'marcar como pendente';

    return (
      <div className="modal-overlay">
        <div className="modal-container confirm-modal">
          <div className="modal-header">
            <h2 className="modal-title">
              Confirmar {novoStatus ? 'Efetivação' : 'Alteração de Status'}
            </h2>
            <button 
              className="modal-close" 
              onClick={() => {
                setShowConfirmEfetivarModal(false);
                setTransacaoParaEfetivar(null);
              }}
            >
              ✕
            </button>
          </div>

          <div className="modal-content">
            <div className="confirm-info">
              <div className="confirm-icon">
                {novoStatus ? '✅' : '⏳'}
              </div>
              <div className="confirm-text">
                <p>
                  Você deseja <strong>{acao}</strong> esta transação de{' '}
                  <strong>{isReceita ? 'receita' : 'despesa'}</strong>?
                </p>
                <div className="transacao-details">
                  <div className="detail-item">
                    <span className="detail-label">Descrição:</span>
                    <span className="detail-value">{transacaoParaEfetivar.descricao}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Valor:</span>
                    <span className={`detail-value ${isReceita ? 'receita' : 'despesa'}`}>
                      {isReceita ? '+' : '-'} {formatCurrency(Math.abs(transacaoParaEfetivar.valor))}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Conta:</span>
                    <span className="detail-value">{transacaoParaEfetivar.conta_nome}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Data:</span>
                    <span className="detail-value">
                      {format(new Date(transacaoParaEfetivar.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <Button 
                onClick={() => {
                  setShowConfirmEfetivarModal(false);
                  setTransacaoParaEfetivar(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="primary-button"
                onClick={confirmarEfetivacao}
              >
                Confirmar {novoStatus ? 'Efetivação' : 'Alteração'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =============================================
  // COMPONENTES AUXILIARES
  // =============================================
  
  // Combobox Component
  const ComboBox = ({ label, options, value, onChange, searchable = true, multiple = false, placeholder = "Selecione..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = searchable ? 
      options.filter(option => 
        option.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.label?.toLowerCase().includes(searchTerm.toLowerCase())
      ) : options;

    const selectedItems = multiple ? 
      options.filter(option => value.includes(option.id || option.value)) : 
      options.find(option => (option.id || option.value) === value);

    const displayValue = multiple ? 
      (value.length > 0 ? `${value.length} selecionado(s)` : placeholder) :
      (selectedItems?.nome || selectedItems?.label || placeholder);

    return (
      <div className="combobox-container">
        {label && <label className="filtro-label">{label}</label>}
        <div className="combobox-wrapper">
          <div 
            className={`combobox-trigger ${isOpen ? 'open' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="combobox-value">{displayValue}</span>
            <span className="combobox-arrow">▼</span>
          </div>
          
          {isOpen && (
            <div className="combobox-dropdown">
              {searchable && (
                <div className="combobox-search">
                  <input
                    type="text"
                    className="combobox-search-input"
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              
              <div className="combobox-options">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(option => {
                    const isSelected = multiple ? 
                      value.includes(option.id || option.value) :
                      (option.id || option.value) === value;
                    
                    return (
                      <div
                        key={option.id || option.value}
                        className={`combobox-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (multiple) {
                            const newValue = isSelected ? 
                              value.filter(v => v !== (option.id || option.value)) :
                              [...value, option.id || option.value];
                            onChange(newValue);
                          } else {
                            onChange(option.id || option.value);
                            setIsOpen(false);
                          }
                        }}
                      >
                        <div className="combobox-option-content">
                          {option.cor && (
                            <div 
                              className="combobox-color" 
                              style={{ backgroundColor: option.cor }}
                            />
                          )}
                          <span className="combobox-option-text">
                            {option.nome || option.label}
                          </span>
                        </div>
                        {multiple && (
                          <div className="combobox-checkbox">
                            {isSelected ? '✓' : ''}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="combobox-empty">Nenhuma opção encontrada</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SortableHeader = ({ field, children }) => (
    <th 
      className={`transacoes-th sortable`}
      onClick={() => handleSort(field)}
    >
      <div className="sort-header">
        {children}
        <span className="sort-icons">
          <span className={`sort-icon ${sortField === field && sortDirection === 'asc' ? 'active' : ''}`}>▲</span>
          <span className={`sort-icon ${sortField === field && sortDirection === 'desc' ? 'active' : ''}`}>▼</span>
        </span>
      </div>
    </th>
  );

  const FiltroAvancado = () => {
    const [valorMinimoTemp, setValorMinimoTemp] = useState(filtrosTemp.valorMinimo);
    const [valorMaximoTemp, setValorMaximoTemp] = useState(filtrosTemp.valorMaximo);

    useEffect(() => {
      setValorMinimoTemp(filtrosTemp.valorMinimo);
      setValorMaximoTemp(filtrosTemp.valorMaximo);
    }, [filtrosTemp.valorMinimo, filtrosTemp.valorMaximo]);

    const handleValorMinimoBlur = () => {
      handleFiltroChange('valorMinimo', valorMinimoTemp);
    };

    const handleValorMaximoBlur = () => {
      handleFiltroChange('valorMaximo', valorMaximoTemp);
    };

    return (
      <div className="filtro-avancado-popup">
        <div className="filtro-header">
          <h3>Filtros Avançados</h3>
          <div className="filtro-actions">
            <button onClick={limparFiltrosCompleto} className="filtro-limpar">
              Limpar Todos
            </button>
            <button onClick={() => setShowFilters(false)} className="filtro-fechar">
              ✕
            </button>
          </div>
        </div>

        <div className="filtro-content">
          {/* Período de Datas */}
          <div className="filtro-row">
            <div className="filtro-group">
              <label className="filtro-label">📅 Data início:</label>
              <input
                type="date"
                value={filtrosTemp.dataInicio}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
                className="filtro-input"
              />
            </div>
            <div className="filtro-group">
              <label className="filtro-label">📅 Data fim:</label>
              <input
                type="date"
                value={filtrosTemp.dataFim}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
                className="filtro-input"
              />
            </div>
          </div>

          {/* Tipo e Status como Botões */}
          <div className="filtro-row">
            <div className="filtro-group">
              <label className="filtro-label">📊 Tipo</label>
              <div className="filtro-buttons-group">
                <button
                  className={`filtro-btn ${filtrosTemp.tipo.includes('receita') ? 'active' : ''}`}
                  onClick={() => {
                    const newTipos = filtrosTemp.tipo.includes('receita') 
                      ? filtrosTemp.tipo.filter(t => t !== 'receita')
                      : [...filtrosTemp.tipo, 'receita'];
                    handleFiltroChange('tipo', newTipos);
                  }}
                >
                  📈 Receitas
                </button>
                <button
                  className={`filtro-btn ${filtrosTemp.tipo.includes('despesa') ? 'active' : ''}`}
                  onClick={() => {
                    const newTipos = filtrosTemp.tipo.includes('despesa') 
                      ? filtrosTemp.tipo.filter(t => t !== 'despesa')
                      : [...filtrosTemp.tipo, 'despesa'];
                    handleFiltroChange('tipo', newTipos);
                  }}
                >
                  📉 Despesas
                </button>
              </div>
            </div>
            
            <div className="filtro-group">
              <label className="filtro-label">⚡ Status</label>
              <div className="filtro-buttons-group">
                <button
                  className={`filtro-btn ${filtrosTemp.status.includes('efetivado') ? 'active' : ''}`}
                  onClick={() => {
                    const newStatus = filtrosTemp.status.includes('efetivado') 
                      ? filtrosTemp.status.filter(s => s !== 'efetivado')
                      : [...filtrosTemp.status, 'efetivado'];
                    handleFiltroChange('status', newStatus);
                  }}
                >
                  ✅ Efetivadas
                </button>
                <button
                  className={`filtro-btn ${filtrosTemp.status.includes('pendente') ? 'active' : ''}`}
                  onClick={() => {
                    const newStatus = filtrosTemp.status.includes('pendente') 
                      ? filtrosTemp.status.filter(s => s !== 'pendente')
                      : [...filtrosTemp.status, 'pendente'];
                    handleFiltroChange('status', newStatus);
                  }}
                >
                  ⏳ Pendentes
                </button>
              </div>
            </div>
          </div>

          {/* Faixa de Valores */}
          <div className="filtro-row">
            <div className="filtro-group">
              <label className="filtro-label">💰 Valor mínimo:</label>
              <InputMoney
                value={valorMinimoTemp}
                onChange={setValorMinimoTemp}
                onBlur={handleValorMinimoBlur}
                placeholder="R$ 0,00"
                className="filtro-input"
              />
            </div>
            <div className="filtro-group">
              <label className="filtro-label">💰 Valor máximo:</label>
              <InputMoney
                value={valorMaximoTemp}
                onChange={setValorMaximoTemp}
                onBlur={handleValorMaximoBlur}
                placeholder="R$ 10.000,00"
                className="filtro-input"
              />
            </div>
          </div>

          {/* Categorias */}
          {categorias.length > 0 && (
            <ComboBox
              label={`📁 Categorias (${filtrosTemp.categoria.length}/${categorias.length})`}
              options={categorias.map(cat => ({
                id: cat.id,
                nome: cat.nome,
                cor: cat.cor
              }))}
              value={filtrosTemp.categoria}
              onChange={(value) => handleFiltroChange('categoria', value)}
              multiple
              placeholder="Todas as categorias"
            />
          )}

          {/* Contas */}
          {contas.length > 0 && (
            <ComboBox
              label={`🏦 Contas (${filtrosTemp.conta.length}/${contas.length})`}
              options={contas.map(conta => ({
                id: conta.id,
                nome: conta.nome
              }))}
              value={filtrosTemp.conta}
              onChange={(value) => handleFiltroChange('conta', value)}
              multiple
              placeholder="Todas as contas"
            />
          )}

          {/* Cartões */}
          {cartoes.length > 0 && (
            <ComboBox
              label={`💳 Cartões (${filtrosTemp.cartao.length}/${cartoes.length})`}
              options={cartoes.map(cartao => ({
                id: cartao.id,
                nome: cartao.nome
              }))}
              value={filtrosTemp.cartao}
              onChange={(value) => handleFiltroChange('cartao', value)}
              multiple
              placeholder="Todos os cartões"
            />
          )}

          {/* Botão Aplicar */}
          <div className="filtro-footer">
            <Button 
              className="primary-button aplicar-filtros-btn"
              onClick={aplicarFiltrosManual}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const TransactionRow = ({ transacao }) => {
    const isReceita = transacao.tipo === 'receita';
    const isFatura = transacao.tipo === 'fatura';
    const isEfetivado = transacao.efetivado;
    
    let iconColor = '#6B7280';
    if (isReceita) {
      iconColor = isEfetivado ? '#006400' : '#90EE90';
    } else if (!isFatura) {
      iconColor = isEfetivado ? '#DC3545' : '#FFB6C1';
    }
    
    return (
      <tr className={`transaction-row ${!transacao.efetivado ? 'pending' : ''}`}>
        <td className="data-cell">
          {format(new Date(transacao.data), 'dd/MM', { locale: ptBR })}
        </td>
        <td className="descricao-cell">
          <div className="transaction-info">
            <ToolTip text={isReceita ? 'Receita' : isFatura ? 'Fatura' : 'Despesa'}>
              <span 
                className={`transaction-icon ${isReceita ? 'receita' : 'despesa'}`}
                style={{ 
                  backgroundColor: iconColor + '20',
                  color: iconColor 
                }}
              >
                {isReceita ? '▲' : isFatura ? '💳' : '▼'}
              </span>
            </ToolTip>
            <span className="descricao-text" title={transacao.descricao}>
              {transacao.descricao}
            </span>
          </div>
        </td>
        <td className="categoria-cell">
          <ToolTip text={transacao.categoria_nome}>
            <span 
              className="categoria-badge"
              style={{ backgroundColor: `${transacao.categoria_cor}20` }}
              title={transacao.categoria_nome}
            >
              {transacao.categoria_nome}
            </span>
          </ToolTip>
        </td>
        <td className="conta-cell">
          {isFatura ? '-' : transacao.conta_nome}
        </td>
        <td className="valor-cell">
          <span className={`valor ${isReceita ? 'receita' : 'despesa'}`}>
            {isReceita ? '+' : '-'} {formatCurrency(Math.abs(transacao.valor))}
          </span>
        </td>
        <td className="status-cell">
          <button
            className={`status-badge ${transacao.efetivado ? 'efetivado' : 'pendente'}`}
            onClick={() => !isFatura && handleToggleEfetivado(transacao)}
            disabled={isFatura}
            title={isFatura ? 'Fatura' : transacao.efetivado ? 'Clique para marcar como pendente' : 'Clique para efetivar'}
          >
            {isFatura ? 'Fatura' : transacao.efetivado ? 'Efetivado' : 'Efetivar'}
          </button>
        </td>
        <td className="acoes-cell">
          <div className="action-buttons">
            {isFatura ? (
              <ToolTip text="Pagar fatura">
                <button
                  className="action-btn pay-btn"
                  onClick={() => handlePagarFatura(transacao)}
                >
                  💰
                </button>
              </ToolTip>
            ) : (
              <>
                <ToolTip text="Editar transação">
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => handleEditar(transacao)}
                  >
                    ✏️
                  </button>
                </ToolTip>
                <ToolTip text="Excluir transação">
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleExcluir(transacao.id)}
                  >
                    🗑️
                  </button>
                </ToolTip>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const TransactionCard = ({ transacao, isFirst }) => {
    const isReceita = transacao.tipo === 'receita';
    const isFatura = transacao.tipo === 'fatura';
    const isEfetivado = transacao.efetivado;
    const dataFormatada = format(new Date(transacao.data), 'dd \'de\' MMMM', { locale: ptBR });
    
    let iconColor = '#6B7280';
    if (isReceita) {
      iconColor = isEfetivado ? '#006400' : '#90EE90';
    } else if (!isFatura) {
      iconColor = isEfetivado ? '#DC3545' : '#FFB6C1';
    }
    
    return (
      <div className="transaction-card-container">
        {isFirst && (
          <div className="date-header">
            {dataFormatada}
          </div>
        )}
        <Card className="transaction-card">
          <div className="card-header">
            <div className="transaction-main">
              <ToolTip text={isReceita ? 'Receita' : isFatura ? 'Fatura' : 'Despesa'}>
                <span 
                  className={`transaction-icon ${isReceita ? 'receita' : 'despesa'}`}
                  style={{ 
                    backgroundColor: iconColor + '20',
                    color: iconColor 
                  }}
                >
                  {isReceita ? '▲' : isFatura ? '💳' : '▼'}
                </span>
              </ToolTip>
              <div className="transaction-details">
                <h4 className="transaction-title">
                  {transacao.descricao}
                </h4>
                <span className={`valor-mobile ${isReceita ? 'receita' : 'despesa'}`}>
                  {isReceita ? '+' : '-'} {formatCurrency(Math.abs(transacao.valor))}
                </span>
              </div>
            </div>
            <div className="card-actions">
              {isFatura ? (
                <button
                  className="action-btn pay-btn"
                  onClick={() => handlePagarFatura(transacao)}
                >
                  💰
                </button>
              ) : (
                <>
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => handleEditar(transacao)}
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleExcluir(transacao.id)}
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="card-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Categoria:</span>
              <span 
                className="categoria-badge"
                style={{ backgroundColor: `${transacao.categoria_cor}20` }}
              >
                {transacao.categoria_nome}
              </span>
            </div>
            {!isFatura && (
              <div className="metadata-item">
                <span className="metadata-label">Conta:</span>
                <span>{transacao.conta_nome}</span>
              </div>
            )}
            <div className="metadata-item">
              <span className="metadata-label">Status:</span>
              <button
                className={`status-badge ${transacao.efetivado ? 'efetivado' : 'pendente'}`}
                onClick={() => !isFatura && handleToggleEfetivado(transacao)}
                disabled={isFatura}
              >
                {isFatura ? 'Fatura' : transacao.efetivado ? 'Efetivado' : 'Efetivar'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // =============================================
  // MODAL DE PAGAMENTO DE FATURA
  // =============================================
  const PagamentoFaturaModal = () => {
    const [pagamentoForm, setPagamentoForm] = useState({
      contaId: '',
      tipoPagamento: 'total',
      valorParcial: 0
    });
    const [pagamentoLoading, setPagamentoLoading] = useState(false);
    const [pagamentoError, setPagamentoError] = useState('');

    const handlePagamentoSubmit = async () => {
      if (!pagamentoForm.contaId) {
        setPagamentoError('Selecione uma conta para débito');
        return;
      }

      const valorPagamento = pagamentoForm.tipoPagamento === 'total' 
        ? selectedFatura.valor 
        : parseFloat(pagamentoForm.valorParcial) || 0;

      if (valorPagamento <= 0) {
        setPagamentoError('Valor do pagamento deve ser maior que zero');
        return;
      }

      setPagamentoLoading(true);
      setPagamentoError('');

      try {
        const { default: supabase } = await import('@lib/supabaseClient');
        
        // Buscar dados da conta
        const { data: contaData, error: contaError } = await supabase
          .from('contas')
          .select('*')
          .eq('id', pagamentoForm.contaId)
          .single();

        if (contaError) throw contaError;

        if (contaData.saldo < valorPagamento) {
          throw new Error('Saldo insuficiente na conta selecionada');
        }

        // Criar transação de pagamento
        const { error: transacaoError } = await supabase
          .from('transacoes')
          .insert([{
            usuario_id: user.id,
            conta_id: pagamentoForm.contaId,
            valor: valorPagamento,
            tipo: 'despesa',
            descricao: `Pagamento Fatura ${selectedFatura.cartao_nome}`,
            data: format(new Date(), 'yyyy-MM-dd'),
            efetivado: true,
            observacoes: `Pagamento de fatura - Valor: ${formatCurrency(valorPagamento)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (transacaoError) throw transacaoError;

        // Atualizar saldo da conta
        const { error: updateError } = await supabase
          .from('contas')
          .update({ 
            saldo: contaData.saldo - valorPagamento,
            updated_at: new Date().toISOString()
          })
          .eq('id', pagamentoForm.contaId);

        if (updateError) throw updateError;

        // Fechar modal e recarregar dados
        setShowPagamentoFaturaModal(false);
        setSelectedFatura(null);
        fetchTransacoes();

      } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        setPagamentoError(error.message);
      } finally {
        setPagamentoLoading(false);
      }
    };

    if (!showPagamentoFaturaModal || !selectedFatura) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-container pagamento-modal">
          <div className="modal-header">
            <h2 className="modal-title">
              Pagar Fatura - {selectedFatura.cartao_nome}
            </h2>
            <button 
              className="modal-close" 
              onClick={() => {
                setShowPagamentoFaturaModal(false);
                setSelectedFatura(null);
                setPagamentoError('');
              }}
            >
              ✕
            </button>
          </div>

          <div className="modal-content">
            <div className="fatura-info">
              <div className="info-row">
                <span>Valor total da fatura:</span>
                <strong className="valor-destaque">
                  {formatCurrency(selectedFatura.valor)}
                </strong>
              </div>
              <div className="info-row">
                <span>Transações:</span>
                <strong>{selectedFatura.transacoes?.length || 0} compras</strong>
              </div>
            </div>

            {pagamentoError && (
              <div className="error-message">
                {pagamentoError}
              </div>
            )}

            <div className="pagamento-form">
              <div className="form-field">
                <label>Conta para débito:</label>
                <select
                  value={pagamentoForm.contaId}
                  onChange={(e) => setPagamentoForm(prev => ({ ...prev, contaId: e.target.value }))}
                  disabled={pagamentoLoading}
                  className="form-input"
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} - {formatCurrency(conta.saldo || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Tipo de pagamento:</label>
                <div className="radio-group">
                  <label className={`radio-option ${pagamentoForm.tipoPagamento === 'total' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="total"
                      checked={pagamentoForm.tipoPagamento === 'total'}
                      onChange={(e) => setPagamentoForm(prev => ({ ...prev, tipoPagamento: e.target.value }))}
                      disabled={pagamentoLoading}
                    />
                    <div className="radio-content">
                      <strong>Pagamento total</strong>
                      <small>Quitar toda a fatura</small>
                    </div>
                  </label>
                  
                  <label className={`radio-option ${pagamentoForm.tipoPagamento === 'parcial' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="parcial"
                      checked={pagamentoForm.tipoPagamento === 'parcial'}
                      onChange={(e) => setPagamentoForm(prev => ({ ...prev, tipoPagamento: e.target.value }))}
                      disabled={pagamentoLoading}
                    />
                    <div className="radio-content">
                      <strong>Pagamento parcial</strong>
                      <small>Pagar apenas parte da fatura</small>
                    </div>
                  </label>
                </div>
              </div>

              {pagamentoForm.tipoPagamento === 'parcial' && (
                <div className="form-field">
                  <label>Valor a pagar:</label>
                  <input
                    type="number"
                    value={pagamentoForm.valorParcial}
                    onChange={(e) => setPagamentoForm(prev => ({ ...prev, valorParcial: e.target.value }))}
                    disabled={pagamentoLoading}
                    min="0.01"
                    max={selectedFatura.valor}
                    step="0.01"
                    className="form-input"
                    placeholder="0,00"
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <Button 
                onClick={() => {
                  setShowPagamentoFaturaModal(false);
                  setSelectedFatura(null);
                  setPagamentoError('');
                }}
                disabled={pagamentoLoading}
              >
                Cancelar
              </Button>
              <Button 
                className="primary-button"
                onClick={handlePagamentoSubmit}
                disabled={pagamentoLoading || !pagamentoForm.contaId}
              >
                {pagamentoLoading ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Agrupar por data para mobile
  const transacoesAgrupadasPorData = React.useMemo(() => {
    const grupos = {};
    transacoesFiltradas.forEach(transacao => {
      const dataKey = format(new Date(transacao.data), 'yyyy-MM-dd');
      if (!grupos[dataKey]) {
        grupos[dataKey] = [];
      }
      grupos[dataKey].push(transacao);
    });
    return grupos;
  }, [transacoesFiltradas]);

  // =============================================
  // RENDERIZAÇÃO
  // =============================================

  // Estado de erro
  if (error) {
    return (
      <PageContainer title="Transações">
        <div className="empty-state">
          <div className="empty-illustration">
            <div className="empty-icon">⚠️</div>
            <h3>Erro ao carregar transações</h3>
            <p>{error}</p>
            <Button 
              className="primary-button"
              onClick={fetchTransacoes}
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Estado vazio
  if (!loading && transacoesFiltradas.length === 0) {
    return (
      <PageContainer title="Transações">
        <div className="transacoes-header">
          <div className="period-navigation">
            <button 
              className="nav-btn"
              onClick={() => handleNavigateMonth('prev')}
            >
              ◀️
            </button>
            <h2 className="current-period">
              {format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}
            </h2>
            <button 
              className="nav-btn"
              onClick={() => handleNavigateMonth('next')}
            >
              ▶️
            </button>
            <button 
              className={`today-btn ${isToday(currentDate) ? 'active' : ''}`}
              onClick={() => handleNavigateMonth('today')}
            >
              Hoje
            </button>
          </div>
        </div>
        
        <div className="empty-state">
          <div className="empty-illustration">
            <div className="empty-icon">📊</div>
            <h3>Nenhuma transação encontrada!</h3>
            <p>
              {hasActiveFilters 
                ? 'Nenhuma transação corresponde aos filtros aplicados.'
                : 'Comece adicionando sua primeira transação financeira.'
              }
            </p>
            {hasActiveFilters && (
              <Button 
                className="primary-button"
                onClick={limparFiltrosCompleto}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </PageContainer>
    );
  }

  // Interface principal
  return (
    <PageContainer title="Transações" className="transacoes-page">
      {/* Header */}
      <div className="transacoes-header">
        <div className="period-navigation">
          <button 
            className="nav-btn"
            onClick={() => handleNavigateMonth('prev')}
            disabled={loading || isNavigating}
          >
            ◀️
          </button>
          <h2 className="current-period">
            {format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}
          </h2>
          <button 
            className="nav-btn"
            onClick={() => handleNavigateMonth('next')}
            disabled={loading || isNavigating}
          >
            ▶️
          </button>
          <button 
            className={`today-btn ${isToday(currentDate) ? 'active' : ''}`}
            onClick={() => handleNavigateMonth('today')}
            disabled={loading || isNavigating}
          >
            Hoje
          </button>
        </div>

        <div className="header-controls">
          <div className="filter-toggle">
            <button
              className={`filter-btn ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filtros {hasActiveFilters && <span className="filter-count">•</span>}
            </button>
            {showFilters && <FiltroAvancado />}
          </div>

          <button
            className={`group-toggle ${groupByCard ? 'active' : ''}`}
            onClick={() => {
              console.log('🔄 Alternando agrupamento:', !groupByCard);
              setGroupByCard(!groupByCard);
            }}
          >
            💳 {groupByCard ? 'Desagrupar Faturas' : 'Agrupar por Fatura'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {(loading || isNavigating) && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>{isNavigating ? 'Navegando...' : 'Carregando transações...'}</p>
        </div>
      )}

      {/* Tabela Desktop */}
      {!isMobile && !loading && !isNavigating && (
        <Card className="transactions-table-card">
          <table className="transactions-table">
            <thead>
              <tr>
                <SortableHeader field="data">Data</SortableHeader>
                <SortableHeader field="descricao">Descrição</SortableHeader>
                <SortableHeader field="categoria_nome">Categoria</SortableHeader>
                <SortableHeader field="conta_nome">Conta</SortableHeader>
                <SortableHeader field="valor">Valor</SortableHeader>
                <SortableHeader field="efetivado">Status</SortableHeader>
                <th className="transacoes-th">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.map((transacao, index) => (
                <TransactionRow 
                  key={transacao.id || index} 
                  transacao={transacao}
                />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Cards Mobile */}
      {isMobile && !loading && !isNavigating && (
        <div className="mobile-transactions">
          {Object.entries(transacoesAgrupadasPorData).map(([data, transacoesGrupo]) => (
            <div key={data} className="date-grupo">
              {transacoesGrupo.map((transacao, index) => (
                <TransactionCard
                  key={transacao.id || index}
                  transacao={transacao}
                  isFirst={index === 0}
                />
              ))}
            </div>
          ))}
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
          onSave={() => {
            fetchTransacoes();
          }}
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
          onSave={() => {
            fetchTransacoes();
          }}
          transacaoEditando={transacaoEditando}
        />
      )}

      {/* Modal de Confirmação de Efetivação */}
      <ConfirmEfetivarModal />

      {/* Modal de Pagamento de Fatura */}
      <PagamentoFaturaModal />
    </PageContainer>
  );
};

export default TransacoesPage;