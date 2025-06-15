import React, { useState, useEffect, useMemo } from 'react';
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

// Modals
import DespesasModal from '@modules/transacoes/components/DespesasModal';
import ReceitasModal from '@modules/transacoes/components/ReceitasModal';

// Utils
import formatCurrency from '@shared/utils/formatCurrency';
import supabase from '@lib/supabaseClient';

// Hooks
import useAuth from '@modules/auth/hooks/useAuth';

const TransacoesPage = () => {
  // =============================================
  // ESTADOS
  // =============================================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortField, setSortField] = useState('data');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [groupByCard, setGroupByCard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPagamentoFaturaModal, setShowPagamentoFaturaModal] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  
  // Estados para dados
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Estados dos modais de edição
  const [showDespesasModal, setShowDespesasModal] = useState(false);
  const [showReceitasModal, setShowReceitasModal] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);

  // Estados dos filtros avançados
  const [filtros, setFiltros] = useState({
    tipo: [],
    categoria: [],
    subcategoria: [],
    conta: [],
    cartao: [],
    status: [],
    dataInicio: '',
    dataFim: '',
    valorMinimo: '',
    valorMaximo: '',
    tipoReceita: [],
    tipoDespesa: []
  });

  // Estados para dados dos filtros
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
  // CARREGAR DADOS PARA FILTROS
  // =============================================
  const carregarDadosFiltros = async () => {
    if (!user?.id) return;

    try {
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
  // BUSCAR TRANSAÇÕES
  // =============================================
  const buscarTransacoes = async () => {
    if (!user?.id || loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando transações:', {
        usuario: user.id,
        periodo: `${format(dataInicio, 'yyyy-MM-dd')} até ${format(dataFim, 'yyyy-MM-dd')}`
      });

      const { data, error } = await supabase
        .rpc('gpt_transacoes_do_mes', {
          p_usuario_id: user.id,
          p_data_inicio: format(dataInicio, 'yyyy-MM-dd'),
          p_data_fim: format(dataFim, 'yyyy-MM-dd')
        });

      if (error) {
        throw error;
      }

      console.log('✅ Transações encontradas:', data?.length || 0);

      // Mapear dados para formato do componente
      const transacoesMapeadas = (data || []).map(t => ({
        id: t.id,
        data: t.data,
        tipo: t.tipo,
        valor: parseFloat(t.valor) || 0,
        descricao: t.descricao || 'Sem descrição',
        categoria_id: t.categoria_id,
        categoria_nome: t.categoria_nome || 'Sem categoria',
        categoria_cor: t.categoria_cor || '#6B7280',
        conta_id: t.conta_id,
        conta_nome: t.conta_nome || 'Conta não informada',
        cartao_id: t.cartao_id || null, // Garantir que cartao_id seja mapeado
        cartao_nome: t.cartao_nome || null,
        efetivado: t.efetivado !== false,
        observacoes: t.observacoes || '',
        subcategoria_id: t.subcategoria_id,
        tipo_receita: t.tipo_receita,
        tipo_despesa: t.tipo_despesa
      }));

      console.log('🗂️ Mapeamento de transações:', {
        total: transacoesMapeadas.length,
        comCartao: transacoesMapeadas.filter(t => t.cartao_id).length,
        despesasComCartao: transacoesMapeadas.filter(t => t.tipo === 'despesa' && t.cartao_id).length,
        exemplos: transacoesMapeadas.slice(0, 3).map(t => ({
          id: t.id,
          tipo: t.tipo,
          cartao_id: t.cartao_id,
          cartao_nome: t.cartao_nome
        }))
      });

      setTransacoes(transacoesMapeadas);

    } catch (err) {
      console.error('❌ Erro ao buscar transações:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsNavigating(false);
    }
  };

  // Executar busca quando usuário carregar
  useEffect(() => {
    if (user?.id) {
      buscarTransacoes();
      carregarDadosFiltros();
    }
  }, [user?.id]);

  // =============================================
  // APLICAR FILTROS
  // =============================================
  const aplicarFiltros = (transacoesOriginais) => {
    let filtered = [...transacoesOriginais];

    // Filtro por tipo
    if (filtros.tipo.length > 0) {
      filtered = filtered.filter(t => filtros.tipo.includes(t.tipo));
    }

    // Filtro por categoria
    if (filtros.categoria.length > 0) {
      filtered = filtered.filter(t => filtros.categoria.includes(t.categoria_id));
    }

    // Filtro por subcategoria
    if (filtros.subcategoria.length > 0) {
      filtered = filtered.filter(t => filtros.subcategoria.includes(t.subcategoria_id));
    }

    // Filtro por conta
    if (filtros.conta.length > 0) {
      filtered = filtered.filter(t => filtros.conta.includes(t.conta_id));
    }

    // Filtro por cartão
    if (filtros.cartao.length > 0) {
      filtered = filtered.filter(t => filtros.cartao.includes(t.cartao_id));
    }

    // Filtro por status
    if (filtros.status.length > 0) {
      filtered = filtered.filter(t => {
        const status = t.efetivado ? 'efetivado' : 'pendente';
        return filtros.status.includes(status);
      });
    }

    // Filtro por valor mínimo
    if (filtros.valorMinimo) {
      const valorMin = parseFloat(filtros.valorMinimo) || 0;
      filtered = filtered.filter(t => t.valor >= valorMin);
    }

    // Filtro por valor máximo
    if (filtros.valorMaximo) {
      const valorMax = parseFloat(filtros.valorMaximo) || 0;
      filtered = filtered.filter(t => t.valor <= valorMax);
    }

    // Filtro por tipo de receita
    if (filtros.tipoReceita.length > 0) {
      filtered = filtered.filter(t => t.tipo === 'receita' && filtros.tipoReceita.includes(t.tipo_receita));
    }

    // Filtro por tipo de despesa
    if (filtros.tipoDespesa.length > 0) {
      filtered = filtered.filter(t => t.tipo === 'despesa' && filtros.tipoDespesa.includes(t.tipo_despesa));
    }

    return filtered;
  };

  // =============================================
  // PROCESSAR E FILTRAR TRANSAÇÕES
  // =============================================
  const transacoesFiltradas = useMemo(() => {
    let filtered = aplicarFiltros(transacoes);

    // Agrupar por cartão se necessário
    if (groupByCard) {
      const cartaoGroups = {};
      const nonCardTransactions = [];

      console.log('🔄 Agrupando faturas...', { 
        totalTransacoes: filtered.length,
        groupByCard: groupByCard
      });

      filtered.forEach(transacao => {
        // Verificar se é uma transação de cartão (despesa)
        if (transacao.cartao_id && transacao.tipo === 'despesa') {
          const mesReferencia = format(new Date(transacao.data), 'yyyy-MM');
          const key = `${transacao.cartao_id}-${mesReferencia}`;
          
          if (!cartaoGroups[key]) {
            cartaoGroups[key] = {
              id: `fatura-${key}`,
              tipo: 'fatura',
              descricao: `Fatura ${transacao.cartao_nome || 'Cartão'} - ${format(new Date(transacao.data), 'MMM/yyyy', { locale: ptBR })}`,
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
          
          console.log('💳 Transação agrupada:', {
            cartao: transacao.cartao_nome,
            valor: transacao.valor,
            totalFatura: cartaoGroups[key].valor
          });
        } else {
          // Transações que não são de cartão
          nonCardTransactions.push(transacao);
        }
      });
      
      const faturas = Object.values(cartaoGroups);
      console.log('📊 Resultado do agrupamento:', {
        totalFaturas: faturas.length,
        totalTransacoesNaoCartao: nonCardTransactions.length,
        faturas: faturas.map(f => ({ nome: f.descricao, valor: f.valor, transacoes: f.transacoes.length }))
      });
      
      // Se temos faturas, mostrar elas primeiro
      if (faturas.length > 0) {
        filtered = [...faturas, ...nonCardTransactions];
        console.log('✅ Faturas criadas:', faturas.length);
      } else {
        console.log('⚠️ Nenhuma fatura encontrada para agrupar');
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
  }, [transacoes, filtros, groupByCard, sortField, sortDirection]);

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
    
    setCurrentDate(newDate);
    
    setTimeout(() => {
      if (user?.id) {
        buscarTransacoes();
      }
    }, 50);
  };

  const handleToggleEfetivado = async (transacao) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .update({ efetivado: !transacao.efetivado })
        .eq('id', transacao.id);

      if (error) throw error;

      setTransacoes(prev => 
        prev.map(t => 
          t.id === transacao.id 
            ? { ...t, efetivado: !t.efetivado }
            : t
        )
      );

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleExcluir = async (transacaoId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transacaoId);

      if (error) throw error;

      setTransacoes(prev => prev.filter(t => t.id !== transacaoId));

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
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      tipo: [],
      categoria: [],
      subcategoria: [],
      conta: [],
      cartao: [],
      status: [],
      dataInicio: '',
      dataFim: '',
      valorMinimo: '',
      valorMaximo: '',
      tipoReceita: [],
      tipoDespesa: []
    });
  };

  const temFiltrosAtivos = () => {
    return Object.values(filtros).some(valor => 
      Array.isArray(valor) ? valor.length > 0 : valor !== ''
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
        buscarTransacoes();
        
        // Feedback para o usuário (se houver sistema de notificações)
        if (window.showNotification) {
          window.showNotification(
            `Pagamento de ${formatCurrency(valorPagamento)} realizado com sucesso!`,
            'success'
          );
        }

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

  // =============================================
  // COMPONENTES
  // =============================================
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

  const FiltroAvancado = () => (
    <div className="filtro-avancado-popup">
      <div className="filtro-header">
        <h3>Filtros Avançados</h3>
        <div className="filtro-actions">
          <button onClick={limparFiltros} className="filtro-limpar">
            Limpar Todos
          </button>
          <button onClick={() => setShowFilters(false)} className="filtro-fechar">
            ✕
          </button>
        </div>
      </div>

      <div className="filtro-content">
        {/* Tipo e Status - Lado a lado */}
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Tipo:</label>
            <div className="filtro-options-horizontal">
              {['receita', 'despesa'].map(tipo => (
                <label key={tipo} className="filtro-checkbox-horizontal">
                  <input
                    type="checkbox"
                    checked={filtros.tipo.includes(tipo)}
                    onChange={(e) => {
                      const newTipos = e.target.checked 
                        ? [...filtros.tipo, tipo]
                        : filtros.tipo.filter(t => t !== tipo);
                      handleFiltroChange('tipo', newTipos);
                    }}
                  />
                  <span className="checkbox-label">
                    {tipo === 'receita' ? '📈 Receitas' : '📉 Despesas'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Status:</label>
            <div className="filtro-options-horizontal">
              {['efetivado', 'pendente'].map(status => (
                <label key={status} className="filtro-checkbox-horizontal">
                  <input
                    type="checkbox"
                    checked={filtros.status.includes(status)}
                    onChange={(e) => {
                      const newStatus = e.target.checked 
                        ? [...filtros.status, status]
                        : filtros.status.filter(s => s !== status);
                      handleFiltroChange('status', newStatus);
                    }}
                  />
                  <span className="checkbox-label">
                    {status === 'efetivado' ? '✅ Efetivadas' : '⏳ Pendentes'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Valores - Lado a lado */}
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Valor mínimo:</label>
            <input
              type="number"
              step="0.01"
              value={filtros.valorMinimo}
              onChange={(e) => handleFiltroChange('valorMinimo', e.target.value)}
              placeholder="R$ 0,00"
              className="filtro-input"
            />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Valor máximo:</label>
            <input
              type="number"
              step="0.01"
              value={filtros.valorMaximo}
              onChange={(e) => handleFiltroChange('valorMaximo', e.target.value)}
              placeholder="R$ 0,00"
              className="filtro-input"
            />
          </div>
        </div>

        {/* Categorias */}
        {categorias.length > 0 && (
          <div className="filtro-group">
            <label className="filtro-label">
              📁 Categorias ({filtros.categoria.length}/{categorias.length}):
            </label>
            <div className="filtro-grid">
              {categorias.slice(0, 8).map(categoria => (
                <label key={categoria.id} className="filtro-checkbox-grid">
                  <input
                    type="checkbox"
                    checked={filtros.categoria.includes(categoria.id)}
                    onChange={(e) => {
                      const newCategorias = e.target.checked 
                        ? [...filtros.categoria, categoria.id]
                        : filtros.categoria.filter(c => c !== categoria.id);
                      handleFiltroChange('categoria', newCategorias);
                    }}
                  />
                  <span className="categoria-color" style={{ backgroundColor: categoria.cor }}></span>
                  <span className="categoria-nome">{categoria.nome}</span>
                </label>
              ))}
              {categorias.length > 8 && (
                <div className="filtro-mais">
                  +{categorias.length - 8} mais...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contas */}
        {contas.length > 0 && (
          <div className="filtro-group">
            <label className="filtro-label">
              🏦 Contas ({filtros.conta.length}/{contas.length}):
            </label>
            <div className="filtro-grid">
              {contas.map(conta => (
                <label key={conta.id} className="filtro-checkbox-grid">
                  <input
                    type="checkbox"
                    checked={filtros.conta.includes(conta.id)}
                    onChange={(e) => {
                      const newContas = e.target.checked 
                        ? [...filtros.conta, conta.id]
                        : filtros.conta.filter(c => c !== conta.id);
                      handleFiltroChange('conta', newContas);
                    }}
                  />
                  <span className="conta-nome">{conta.nome}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Cartões */}
        {cartoes.length > 0 && (
          <div className="filtro-group">
            <label className="filtro-label">
              💳 Cartões ({filtros.cartao.length}/{cartoes.length}):
            </label>
            <div className="filtro-grid">
              {cartoes.map(cartao => (
                <label key={cartao.id} className="filtro-checkbox-grid">
                  <input
                    type="checkbox"
                    checked={filtros.cartao.includes(cartao.id)}
                    onChange={(e) => {
                      const newCartoes = e.target.checked 
                        ? [...filtros.cartao, cartao.id]
                        : filtros.cartao.filter(c => c !== cartao.id);
                      handleFiltroChange('cartao', newCartoes);
                    }}
                  />
                  <span className="cartao-nome">{cartao.nome}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tipos específicos - Colapsáveis */}
        <div className="filtro-collapsible">
          <div className="filtro-collapsible-header">
            <label className="filtro-label">🎯 Filtros Específicos</label>
          </div>
          
          <div className="filtro-row">
            <div className="filtro-group">
              <label className="filtro-label-small">Tipo de Receita:</label>
              <div className="filtro-options-compact">
                {['extra', 'previsivel', 'parcelada'].map(tipo => (
                  <label key={tipo} className="filtro-checkbox-compact">
                    <input
                      type="checkbox"
                      checked={filtros.tipoReceita.includes(tipo)}
                      onChange={(e) => {
                        const newTipos = e.target.checked 
                          ? [...filtros.tipoReceita, tipo]
                          : filtros.tipoReceita.filter(t => t !== tipo);
                        handleFiltroChange('tipoReceita', newTipos);
                      }}
                    />
                    <span className="checkbox-label-small">
                      {tipo === 'extra' ? 'Extra' : tipo === 'previsivel' ? 'Previsível' : 'Parcelada'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filtro-group">
              <label className="filtro-label-small">Tipo de Despesa:</label>
              <div className="filtro-options-compact">
                {['extra', 'previsivel', 'parcelada'].map(tipo => (
                  <label key={tipo} className="filtro-checkbox-compact">
                    <input
                      type="checkbox"
                      checked={filtros.tipoDespesa.includes(tipo)}
                      onChange={(e) => {
                        const newTipos = e.target.checked 
                          ? [...filtros.tipoDespesa, tipo]
                          : filtros.tipoDespesa.filter(t => t !== tipo);
                        handleFiltroChange('tipoDespesa', newTipos);
                      }}
                    />
                    <span className="checkbox-label-small">
                      {tipo === 'extra' ? 'Extra' : tipo === 'previsivel' ? 'Previsível' : 'Parcelada'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TransactionRow = ({ transacao }) => {
    const isReceita = transacao.tipo === 'receita';
    const isFatura = transacao.tipo === 'fatura';
    
    return (
      <tr className={`transaction-row ${!transacao.efetivado ? 'pending' : ''}`}>
        <td className="data-cell">
          {format(new Date(transacao.data), 'dd/MM', { locale: ptBR })}
        </td>
        <td className="descricao-cell">
          <div className="transaction-info">
            <ToolTip text={isReceita ? 'Receita' : isFatura ? 'Fatura' : 'Despesa'}>
              <span className={`transaction-icon ${isReceita ? 'receita' : 'despesa'}`}>
                {isReceita ? '↗️' : isFatura ? '💳' : '↙️'}
              </span>
            </ToolTip>
            <span className="descricao-text">
              {transacao.descricao}
            </span>
          </div>
        </td>
        <td className="categoria-cell">
          <ToolTip text={transacao.categoria_nome}>
            <span 
              className="categoria-badge"
              style={{ backgroundColor: `${transacao.categoria_cor}20` }}
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
          >
            {transacao.efetivado ? 'Efetivado' : 'Pendente'}
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
    const dataFormatada = format(new Date(transacao.data), 'dd \'de\' MMMM', { locale: ptBR });
    
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
                <span className={`transaction-icon ${isReceita ? 'receita' : 'despesa'}`}>
                  {isReceita ? '↗️' : isFatura ? '💳' : '↙️'}
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
                {transacao.efetivado ? 'Efetivado' : 'Pendente'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Agrupar por data para mobile
  const transacoesAgrupadasPorData = useMemo(() => {
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
              onClick={buscarTransacoes}
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
              {temFiltrosAtivos() 
                ? 'Nenhuma transação corresponde aos filtros aplicados.'
                : 'Comece adicionando sua primeira transação financeira.'
              }
            </p>
            {temFiltrosAtivos() && (
              <Button 
                className="primary-button"
                onClick={limparFiltros}
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
              className={`filter-btn ${showFilters ? 'active' : ''} ${temFiltrosAtivos() ? 'has-filters' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filtros {temFiltrosAtivos() && <span className="filter-count">•</span>}
            </button>
            {showFilters && <FiltroAvancado />}
          </div>

          <button
            className={`group-toggle ${groupByCard ? 'active' : ''}`}
            onClick={() => {
              console.log('🔄 Clicou no botão agrupar:', !groupByCard);
              console.log('📊 Transações atuais:', transacoes.length);
              console.log('💳 Transações com cartão:', transacoes.filter(t => t.cartao_id).length);
              setGroupByCard(!groupByCard);
            }}
          >
            🔁 {groupByCard ? 'Desagrupar' : 'Agrupar fatura'}
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
            buscarTransacoes();
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
            buscarTransacoes();
          }}
          transacaoEditando={transacaoEditando}
        />
      )}

      {/* Modal de Pagamento de Fatura */}
      <PagamentoFaturaModal />
    </PageContainer>
  );
};

export default TransacoesPage;