import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSearchParams, useNavigate } from 'react-router-dom';


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
import ImportacaoModal from '@modules/transacoes/components/ImportacaoModal';

// Utils
import formatCurrency from '@shared/utils/formatCurrency';

// Hooks
import useAuth from '@modules/auth/hooks/useAuth';
import { useTransactionsStore } from '@modules/transacoes/store/transactionsStore';

const TransacoesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate(); // ← ADICIONAR ESTA LINHA

  
  // Store
  const {
    transacoes,
    loading,
    error,
    toggleEfetivadoRPC,
    deleteTransacao
  } = useTransactionsStore();

  // Estados básicos
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDespesasModal, setShowDespesasModal] = useState(false);
  const [showReceitasModal, setShowReceitasModal] = useState(false);
  const [showImportacaoModal, setShowImportacaoModal] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transacaoParaConfirm, setTransacaoParaConfirm] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [groupByCard, setGroupByCard] = useState(false);

  // Estados para funcionalidades
  const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'desc' });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // FILTROS - separamos os filtros ativos dos filtros do modal
  const [filters, setFilters] = useState({
    tipo: '',
    dataInicio: '',
    dataFim: '',
    efetivado: '',
    recorrente: '',
    categoria: '',
    cartao: '',
    conta: '',
    subcategoria: '',
    valorMin: '',
    valorMax: '',
    descricao: ''
  });

  // Filtros temporários do modal - só aplicam quando clicar "Aplicar"
  const [modalFilters, setModalFilters] = useState({
    tipo: '',
    dataInicio: '',
    dataFim: '',
    efetivado: '',
    recorrente: '',
    categoria: '',
    cartao: '',
    conta: '',
    subcategoria: '',
    valorMin: '',
    valorMax: '',
    descricao: ''
  });

  // Estados para dados auxiliares dos filtros
  const [filterData, setFilterData] = useState({
    categorias: [],
    cartoes: [],
    contas: [],
    subcategorias: []
  });

  // Período
  const dataInicio = startOfMonth(currentDate);
  const dataFim = endOfMonth(currentDate);

  // ========== FUNÇÃO PARA BUSCAR DADOS AUXILIARES ==========
  const fetchFilterData = async () => {
    if (!user?.id) return;

    try {
      const { default: supabase } = await import('@lib/supabaseClient');
      
      // Buscar categorias
      const { data: categorias } = await supabase
        .from('categorias')
        .select('id, nome, tipo, cor')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      // Buscar cartões
      const { data: cartoes } = await supabase
        .from('cartoes')
        .select('id, nome, bandeira')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      // Buscar contas
      const { data: contas } = await supabase
        .from('contas')
        .select('id, nome, tipo')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      // Buscar subcategorias
      const { data: subcategorias } = await supabase
        .from('subcategorias')
        .select('id, nome, categoria_id, categorias(nome)')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      setFilterData({
        categorias: categorias || [],
        cartoes: cartoes || [],
        contas: contas || [],
        subcategorias: subcategorias || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error);
    }
  };

  // Função para buscar transações
const fetchTransacoes = async () => {
  if (!user?.id) return;

  // ✅ DEBUG: Verificar estado dos filtros
  console.log('🔍 [DEBUG] Estado dos filtros:', {
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
    currentDate: currentDate,
    dataInicioCalculado: format(dataInicio, 'yyyy-MM-dd'),
    dataFimCalculado: format(dataFim, 'yyyy-MM-dd')
  });

  try {
    useTransactionsStore.setState({ loading: true, error: null });
    
    const { default: supabase } = await import('@lib/supabaseClient');
    
    // ✅ CORREÇÃO: Usar período efetivo que prioriza filtros avançados
    const periodoEfetivo = {
      inicio: filters.dataInicio || format(dataInicio, 'yyyy-MM-dd'),
      fim: filters.dataFim || format(dataFim, 'yyyy-MM-dd')
    };

    console.log('🔍 Período efetivo sendo usado:', periodoEfetivo);
    console.log('🔍 [DEBUG] Filtros aplicados:', {
      filtroDataInicio: filters.dataInicio,
      filtroDataFim: filters.dataFim,
      usandoFiltros: !!(filters.dataInicio || filters.dataFim)
    });

    const { data, error } = await supabase.rpc('ip_buscar_transacoes_periodo', {
      p_usuario_id: user.id,
      p_data_inicio: periodoEfetivo.inicio,
      p_data_fim: periodoEfetivo.fim
    });

    if (error) throw error;
    
    console.log('📊 Transações recebidas da RPC:', data?.length || 0);
    
    // ===== BUG FIX 22: Aplicar filtro de parcelas de cartão AQUI TAMBÉM =====
    const transacoesFiltradas = aplicarFiltroParcelasCartao(data || []);
    
    useTransactionsStore.setState({ 
      transacoes: transacoesFiltradas, 
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

  // ===== BUG FIX 22: Função para filtrar parcelas de cartão na página =====
  const aplicarFiltroParcelasCartao = (transacoes) => {
    console.log('🔍 [DEBUG] Aplicando filtro de parcelas de cartão na página');
    console.log('🔍 [DEBUG] Período atual:', {
      inicio: dataInicio.toISOString(),
      fim: dataFim.toISOString(),
      mes: dataInicio.getMonth() + 1,
      ano: dataInicio.getFullYear()
    });
    
    // ✅ DEBUG: Ver quantas transações chegaram
    console.log('📊 [DEBUG] Total de transações recebidas:', transacoes.length);
    
    // ✅ DEBUG: Ver quantas são de cartão
    const transacoesCartao = transacoes.filter(t => t.cartao_id && t.tipo === 'despesa');
    console.log('💳 [DEBUG] Transações de cartão encontradas:', transacoesCartao.length);
    
    // ✅ DEBUG: Mostrar detalhes das transações de cartão
    transacoesCartao.forEach((t, index) => {
      console.log(`💳 [DEBUG] Transação cartão ${index + 1}:`, {
        descricao: t.descricao,
        dataCompra: t.data,
        faturaVencimento: t.fatura_vencimento,
        cartaoId: t.cartao_id,
        cartaoNome: t.cartao_nome
      });
    });
    
    return transacoes.filter(transacao => {
      // Se não é transação de cartão, manter sempre
      if (!transacao.cartao_id || transacao.tipo !== 'despesa') {
        return true;
      }

      // ✅ REGRA CORRIGIDA: Para parcelas de cartão, verificar fatura_vencimento
      if (transacao.fatura_vencimento) {
        // Converter data de vencimento para Date
        const dataVencimento = new Date(transacao.fatura_vencimento + 'T00:00:00');
        
        // Verificar se a data de vencimento está no período atual
        const vencimentoNoPeriodo = dataVencimento >= dataInicio && dataVencimento <= dataFim;
        
        console.log('💳 [DEBUG] Verificando parcela de cartão na página:', {
          descricao: transacao.descricao,
          dataCompra: transacao.data,
          faturaVencimento: transacao.fatura_vencimento,
          dataVencimentoParsed: dataVencimento.toISOString(),
          periodoInicio: dataInicio.toISOString(),
          periodoFim: dataFim.toISOString(),
          vencimentoNoPeriodo,
          mesVencimento: dataVencimento.getMonth() + 1,
          anoVencimento: dataVencimento.getFullYear(),
          mesPeriodo: dataInicio.getMonth() + 1,
          anoPeriodo: dataInicio.getFullYear()
        });
        
        return vencimentoNoPeriodo;
      }

      // Se é transação de cartão mas não tem fatura_vencimento, 
      // tratar como transação avulsa (usar data da compra)
      const dataTransacao = new Date(transacao.data);
      const transacaoNoPeriodo = dataTransacao >= dataInicio && dataTransacao <= dataFim;
      
      console.log('💳 [DEBUG] Transação de cartão sem fatura_vencimento na página:', {
        descricao: transacao.descricao,
        dataCompra: transacao.data,
        transacaoNoPeriodo
      });
      
      return transacaoNoPeriodo;
    });
  };

  // Aplicar filtros da URL na inicialização
  useEffect(() => {
    const filter = searchParams.get('filter');
    
    if (filter) {
      switch (filter) {
        case 'receitas':
          const receitaFilters = { ...filters, tipo: 'receita' };
          setFilters(receitaFilters);
          setModalFilters(receitaFilters);
          break;
        case 'despesas':
          const despesaFilters = { ...filters, tipo: 'despesa' };
          setFilters(despesaFilters);
          setModalFilters(despesaFilters);
          break;
        case 'cartoes':
          setGroupByCard(true);
          const cartaoFilters = { ...filters, tipo: 'despesa' };
          setFilters(cartaoFilters);
          setModalFilters(cartaoFilters);
          break;
        default:
          const emptyFilters = {
            tipo: '', dataInicio: '', dataFim: '', efetivado: '', recorrente: '',
            categoria: '', cartao: '', conta: '', subcategoria: '', valorMin: '', valorMax: '', descricao: ''
          };
          setFilters(emptyFilters);
          setModalFilters(emptyFilters);
          setGroupByCard(false);
      }
    } else {
      const emptyFilters = {
        tipo: '', dataInicio: '', dataFim: '', efetivado: '', recorrente: '',
        categoria: '', cartao: '', conta: '', subcategoria: '', valorMin: '', valorMax: '', descricao: ''
      };
      setFilters(emptyFilters);
      setModalFilters(emptyFilters);
      setGroupByCard(false);
    }
  }, [searchParams]);

// ✅ useEffect para carregamento inicial (só roda uma vez por mês)
useEffect(() => {
  if (user?.id) {
    fetchFilterData(); // Dados auxiliares só precisam ser carregados uma vez
  }
}, [user?.id, currentDate]); // Mantém currentDate para recarregar dados auxiliares se mudar mês

// ✅ useEffect para filtros (roda sempre que filtros mudam)
useEffect(() => {
  if (user?.id) {
    console.log('🔍 [DEBUG] Filtros mudaram, disparando nova busca:', filters);
    fetchTransacoes();
  }
}, [user?.id, filters]); // NOVA dependência: filters

  // ========== FILTRAR E ORDENAR TRANSAÇÕES ==========
  const transacoesProcessadas = useMemo(() => {
    let filtered = [...transacoes];

    // Filtro por tipo
    if (filters.tipo) {
      filtered = filtered.filter(t => t.tipo === filters.tipo);
    }

    // Filtro por status (efetivado)
    if (filters.efetivado) {
      const isEfetivado = filters.efetivado === 'true';
      filtered = filtered.filter(t => t.efetivado === isEfetivado);
    }

    // Filtro por recorrente
    if (filters.recorrente) {
      const isRecorrente = filters.recorrente === 'true';
      filtered = filtered.filter(t => t.recorrente === isRecorrente);
    }

    // Filtro por categoria
    if (filters.categoria) {
      filtered = filtered.filter(t => t.categoria_id === filters.categoria);
    }

    // Filtro por cartão
    if (filters.cartao) {
      filtered = filtered.filter(t => t.cartao_id === filters.cartao);
    }

    // Filtro por conta
    if (filters.conta) {
      filtered = filtered.filter(t => t.conta_id === filters.conta);
    }

    // Filtro por subcategoria
    if (filters.subcategoria) {
      filtered = filtered.filter(t => t.subcategoria_id === filters.subcategoria);
    }

    // Filtro por valor mínimo
    if (filters.valorMin) {
      const valorMin = parseFloat(filters.valorMin);
      if (!isNaN(valorMin)) {
        filtered = filtered.filter(t => Math.abs(t.valor) >= valorMin);
      }
    }

    // Filtro por valor máximo
    if (filters.valorMax) {
      const valorMax = parseFloat(filters.valorMax);
      if (!isNaN(valorMax)) {
        filtered = filtered.filter(t => Math.abs(t.valor) <= valorMax);
      }
    }

    // Filtro por descrição
    if (filters.descricao) {
      filtered = filtered.filter(t => 
        t.descricao?.toLowerCase().includes(filters.descricao.toLowerCase())
      );
    }


// ✅ CORREÇÃO: Substituir a lógica de agrupamento por cartão (linhas 461-485)

            // Agrupar por cartão se solicitado
            if (groupByCard && filtered.length > 0) {
              const cartaoGroups = {};
              const nonCardTransactions = [];

              filtered.forEach(transacao => {
            if (transacao.cartao_id && (transacao.tipo === 'despesa' || transacao.tipo === 'receita')) {
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
      // ✅ CORREÇÃO: Verificar se é estorno e ajustar cálculo
      const isEstorno = transacao.valor > 0; // Para despesas de cartão, valor positivo = estorno
      
      if (isEstorno) {
        // ✅ Estorno: SUBTRAIR do total da fatura
        cartaoGroups[key].valor -= Math.abs(transacao.valor);
        console.log(`🔄 [ESTORNO] ${transacao.descricao}: -R$ ${Math.abs(transacao.valor).toFixed(2)} (Cartão: ${transacao.cartao_nome})`);
      } else {
        // ✅ Despesa normal: SOMAR ao total da fatura
        cartaoGroups[key].valor += Math.abs(transacao.valor);
        console.log(`💳 [DESPESA] ${transacao.descricao}: +R$ ${Math.abs(transacao.valor).toFixed(2)} (Cartão: ${transacao.cartao_nome})`);
      }
      
      cartaoGroups[key].transacoes.push(transacao);
    } else {
      nonCardTransactions.push(transacao);
    }
  });
  
  const faturas = Object.values(cartaoGroups);
  
  // ✅ DEBUG: Mostrar totais finais de cada cartão
  faturas.forEach(fatura => {
    console.log(`📊 [TOTAL CARTÃO] ${fatura.cartao_nome}: R$ ${fatura.valor.toFixed(2)} (${fatura.transacoes.length} transações)`);
  });
  
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

  // ===== BUG FIX 27: Ajustar cálculo do resumo financeiro considerando agrupamento =====
  const estatisticas = useMemo(() => {
    // Se está agrupado por cartão, usar apenas transações não agrupadas + faturas efetivadas
    const transacoesParaCalculo = groupByCard ? 
      transacoesProcessadas.filter(t => 
        (t.tipo === 'fatura' && t.efetivado) || // Faturas efetivadas
        (t.tipo !== 'fatura' && !t.cartao_id) // Transações não de cartão
      ) : 
      transacoesProcessadas;

    const receitas = transacoesParaCalculo.filter(t => t.tipo === 'receita');
    const despesas = transacoesParaCalculo.filter(t => t.tipo === 'despesa' || t.tipo === 'fatura');
    
    const totalReceitas = receitas.reduce((acc, t) => acc + Math.abs(t.valor), 0);
    const totalDespesas = despesas.reduce((acc, t) => acc + Math.abs(t.valor), 0);
    
    return {
      receitas: { total: totalReceitas, quantidade: receitas.length },
      despesas: { total: totalDespesas, quantidade: despesas.length },
      saldo: totalReceitas - totalDespesas,
      totalTransacoes: transacoesParaCalculo.length
    };
  }, [transacoesProcessadas, groupByCard]);

  // ========== HANDLERS ==========

  // Navegação
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

  // Ordenação
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Filtros
const handleFilterChange = (key, value) => {
  console.log('🔍 [DEBUG] handleFilterChange:', { key, value });
  
  // No modal, só atualiza modalFilters
  setModalFilters(prev => {
    const newModalFilters = { ...prev, [key]: value };
    console.log('🔍 [DEBUG] Novos modalFilters:', newModalFilters);
    return newModalFilters;
  });
};
const applyFilters = () => {
  console.log('🔍 [DEBUG] applyFilters chamado:');
  console.log('🔍 [DEBUG] modalFilters ANTES:', modalFilters);
  console.log('🔍 [DEBUG] filters ANTES:', filters);
  
  // Só aqui que aplica os filtros de verdade
  setFilters({ ...modalFilters });
  setCurrentPage(1);
  setShowFilterModal(false);

};

  const openFilterModal = () => {
    // Copia os filtros atuais para o modal APENAS quando abrir
    setModalFilters({ ...filters });
    setShowFilterModal(true);
  };

  const clearFilters = () => {
    const emptyFilters = {
      tipo: '', dataInicio: '', dataFim: '', efetivado: '', recorrente: '',
      categoria: '', cartao: '', conta: '', subcategoria: '', valorMin: '', valorMax: '', descricao: ''
    };
    setFilters(emptyFilters);
    setModalFilters(emptyFilters);
    setGroupByCard(false);
    setCurrentPage(1);
  };

  // ===== BUG FIX 28: Corrigir contador de filtros (não incluir agrupamento) =====
  const filtrosAtivos = Object.values(filters).filter(value => value !== '').length;
  const hasActiveFilters = filtrosAtivos > 0;

  // Ações das transações
  const handleToggleEfetivado = (transacao) => {
    // Bloquear alteração de efetivado para transações de cartão
    if (transacao.cartao_id) {
      alert('Transações de cartão de crédito devem ser gerenciadas pela tela de Fatura do Cartão.');
      return;
    }
    
    setTransacaoParaConfirm(transacao);
    setConfirmAction('toggle_efetivado');
    setShowConfirmModal(true);
  };

  const handleDeleteTransacao = (transacao) => {
    // Bloquear exclusão de transações de cartão
    if (transacao.cartao_id) {
      alert('Transações de cartão de crédito só podem ser excluídas pela tela de Fatura do Cartão.');
      return;
    }
    
    setTransacaoParaConfirm(transacao);
    setConfirmAction('delete');
    setShowConfirmModal(true);
  };

  const handleEditTransacao = (transacao) => {
    // Bloquear edição de transações de cartão
    if (transacao.cartao_id) {
      alert('Transações de cartão de crédito só podem ser editadas pela tela de Fatura do Cartão.');
      return;
    }
    
    setTransacaoEditando(transacao);
    if (transacao.tipo === 'receita') {
      setShowReceitasModal(true);
    } else {
      setShowDespesasModal(true);
    }
  };

// ✅ SUBSTITUIR COMPLETAMENTE a função executeConfirmAction no TransacoesPage.jsx

const executeConfirmAction = async () => {
  if (!transacaoParaConfirm || !confirmAction) return;

  try {
    if (confirmAction === 'toggle_efetivado') {
      // ✅ NOVA IMPLEMENTAÇÃO: Usar RPC via Store
      const resultado = await toggleEfetivadoRPC(
        transacaoParaConfirm.id, 
        !transacaoParaConfirm.efetivado
      );

      if (!resultado.success) {
        // Erro já foi tratado no store, apenas mostrar mensagem
        if (resultado.error.includes('Cartão:')) {
          // Erro de cartão - mostrar alert detalhado
          alert(resultado.error);
        } else {
          // Outros erros - mostrar no console
          console.error('❌ Erro ao atualizar efetivação:', resultado.error);
        }
        return;
      }

      // ✅ Sucesso - o estado já foi atualizado no store automaticamente!
      console.log('✅ Efetivação atualizada:', resultado.message);
      
    } else if (confirmAction === 'delete') {
      // Manter implementação existente para delete
      await deleteTransacao(transacaoParaConfirm.id);
    }
    
    setShowConfirmModal(false);
    setTransacaoParaConfirm(null);
    setConfirmAction(null);
    
    // ✅ NÃO PRECISA MAIS: fetchTransacoes() 
    // O estado já foi atualizado automaticamente pelo store!
    
  } catch (error) {
    console.error('❌ Erro ao executar ação:', error);
  }
};
  // ========== COMPONENTES ==========

  // Cabeçalho da tabela
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

  // Linha da transação
  const TransactionRow = ({ transacao }) => {
    const isReceita = transacao.tipo === 'receita';
    const isFatura = transacao.tipo === 'fatura';
    const isCartaoTransacao = transacao.cartao_id && !isFatura;
    
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
        <td>
          {/* ===== BUG FIX 23: Exibir nome do cartão quando for despesa de cartão ===== */}
          {isFatura ? '-' : (
            isCartaoTransacao ? (transacao.cartao_nome || 'Cartão não informado') : transacao.conta_nome
          )}
        </td>
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
            onClick={() => !isFatura && !isCartaoTransacao && handleToggleEfetivado(transacao)}
            disabled={isFatura || isCartaoTransacao}
            title={
              isFatura ? 'Faturas não podem ser alteradas' : 
              isCartaoTransacao ? 'Esta transação só pode ser editada pela fatura do cartão de crédito.' :
              transacao.efetivado ? 'Clique para marcar como pendente' : 'Clique para efetivar'
            }
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              cursor: (isFatura || isCartaoTransacao) ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: transacao.efetivado ? '#ecfdf5' : '#fffbeb',
              color: transacao.efetivado ? '#10b981' : '#f59e0b',
              opacity: (isFatura || isCartaoTransacao) ? 0.6 : 1
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
                disabled={isCartaoTransacao}
                title={isCartaoTransacao ? 'Esta transação só pode ser editada pela fatura do cartão de crédito.' : 'Editar'}
                style={{
                  width: '28px',
                  height: '28px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  background: isCartaoTransacao ? '#f9fafb' : 'white',
                  cursor: isCartaoTransacao ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  opacity: isCartaoTransacao ? 0.6 : 1
                }}
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDeleteTransacao(transacao)}
                disabled={isCartaoTransacao}
                title={isCartaoTransacao ? 'Exclusão só permitida pela tela de Fatura do Cartão.' : 'Excluir'}
                style={{
                  width: '28px',
                  height: '28px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  background: isCartaoTransacao ? '#f9fafb' : 'white',
                  cursor: isCartaoTransacao ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  opacity: isCartaoTransacao ? 0.6 : 1
                }}
              >
                🗑️
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  // Modal de Filtros Avançados - VERSÃO ISOLADA (REMOVIDO AGRUPAMENTO POR CARTÃO)
  const FilterModal = () => {
    // Estado LOCAL do modal - completamente isolado
    const [localFilters, setLocalFilters] = useState(filters);

    if (!showFilterModal) return null;

    const handleLocalChange = (key, value) => {
      setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
      setFilters({ ...localFilters });
      setCurrentPage(1);
      setShowFilterModal(false);
    };

    const handleCancel = () => {
      setLocalFilters({ ...filters }); // Reset para valores originais
      setShowFilterModal(false);
    };

    return (
      <div className="modal-overlay active" style={{ alignItems: 'flex-start', paddingTop: '120px' }}>
        <div className="forms-modal-container">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-content">
              <div className="modal-icon-container modal-icon-primary">
                🔍
              </div>
              <div>
                <h2 className="modal-title">Filtros Avançados</h2>
                <p className="modal-subtitle">
                  Configure os filtros para refinar sua busca de transações
                </p>
              </div>
            </div>
            <button onClick={handleCancel} className="modal-close">×</button>
          </div>

          {/* Body */}
          <div className="modal-body">
            <div className="flex gap-3 row">
              <div>
                <label className="form-label">Tipo de Transação</label>
                <select
                  value={localFilters.tipo}
                  onChange={(e) => handleLocalChange('tipo', e.target.value)}
                  className="input-base"
                >
                  <option value="">Todos os tipos</option>
                  <option value="receita">💰 Receitas</option>
                  <option value="despesa">💸 Despesas</option>
                </select>
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  value={localFilters.efetivado}
                  onChange={(e) => handleLocalChange('efetivado', e.target.value)}
                  className="input-base"
                >
                  <option value="">Todos os status</option>
                  <option value="true">✅ Efetivadas</option>
                  <option value="false">⏳ Pendentes</option>
                </select>
              </div>

              
            </div>

            <div className="flex gap-3 row">
              <div>
                <label className="form-label">Categoria</label>
                <select
                  value={localFilters.categoria}
                  onChange={(e) => handleLocalChange('categoria', e.target.value)}
                  className="input-base"
                >
                  <option value="">Todas as categorias</option>
                  {filterData.categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome} ({categoria.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Subcategoria</label>
                <select
                  value={localFilters.subcategoria}
                  onChange={(e) => handleLocalChange('subcategoria', e.target.value)}
                  className="input-base"
                  disabled={!localFilters.categoria}
                >
                  <option value="">Todas as subcategorias</option>
                  {filterData.subcategorias
                    .filter(sub => !localFilters.categoria || sub.categoria_id === localFilters.categoria)
                    .map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nome}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 row">
              <div>
                <label className="form-label">Conta</label>
                <select
                  value={localFilters.conta}
                  onChange={(e) => handleLocalChange('conta', e.target.value)}
                  className="input-base"
                >
                  <option value="">Todas as contas</option>
                  {filterData.contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} ({conta.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Cartão</label>
                <select
                  value={localFilters.cartao}
                  onChange={(e) => handleLocalChange('cartao', e.target.value)}
                  className="input-base"
                >
                  <option value="">Todos os cartões</option>
                  {filterData.cartoes.map(cartao => (
                    <option key={cartao.id} value={cartao.id}>
                      {cartao.nome} ({cartao.bandeira})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 row">
              <div>
                <label className="form-label">Valor Mínimo</label>
                <input
                  type="number"
                  value={localFilters.valorMin}
                  onChange={(e) => handleLocalChange('valorMin', e.target.value)}
                  placeholder="0,00"
                  className="input-money"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="form-label">Valor Máximo</label>
                <input
                  type="number"
                  value={localFilters.valorMax}
                  onChange={(e) => handleLocalChange('valorMax', e.target.value)}
                  placeholder="999999,00"
                  className="input-money"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 row">
              <div>
                <label className="form-label">Data Início</label>
                <input
                  type="date"
                  value={localFilters.dataInicio}
                  onChange={(e) => handleLocalChange('dataInicio', e.target.value)}
                  className="input-date"
                />
              </div>

              <div>
                <label className="form-label">Data Fim</label>
                <input
                  type="date"
                  value={localFilters.dataFim}
                  onChange={(e) => handleLocalChange('dataFim', e.target.value)}
                  className="input-date"
                />
              </div>

              <div>
                <label className="form-label">Buscar Descrição</label>
                <input
                  type="text"
                  value={localFilters.descricao}
                  onChange={(e) => handleLocalChange('descricao', e.target.value)}
                  placeholder="Digite para buscar..."
                  className="input-text"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-left">
              <button 
                onClick={clearFilters}
                className="btn-secondary"
                disabled={!hasActiveFilters}
              >
                🗑️ Limpar Todos
              </button>
            </div>
            
            <div className="footer-right">
              <button onClick={handleCancel} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={handleApply} className="btn-primary">
                ✅ Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal de Confirmação
  const ConfirmModal = () => {
    if (!showConfirmModal || !transacaoParaConfirm) return null;

    const isDelete = confirmAction === 'delete';
    const isToggle = confirmAction === 'toggle_efetivado';
    const novoStatus = isToggle ? !transacaoParaConfirm.efetivado : null;

    return (
      <div className="modal-overlay active">
        <div className="forms-modal-container">
          <div className="modal-header">
            <div className="modal-header-content">
              <div className={`modal-icon-container ${isDelete ? 'modal-icon-danger' : 'modal-icon-warning'}`}>
                {isDelete ? '🗑️' : '⚠️'}
              </div>
              <div>
                <h2 className="modal-title">
                  {isDelete ? 'Confirmar Exclusão' : 'Confirmar Alteração'}
                </h2>
                <p className="modal-subtitle">
                  {isDelete && 'Esta ação não pode ser desfeita'}
                  {isToggle && 'Alterar status da transação'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="modal-close"
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="confirmation-question">
              <p className="confirmation-text">
                {isDelete && 'Tem certeza que deseja excluir esta transação?'}
                {isToggle && `Deseja ${novoStatus ? 'efetivar' : 'marcar como pendente'} esta transação?`}
              </p>
            </div>
            
            <div className="confirmation-info">
              <div className="confirmation-item">
                <strong>Descrição:</strong> {transacaoParaConfirm.descricao}
              </div>
              <div className="confirmation-item">
                <strong>Valor:</strong> {formatCurrency(Math.abs(transacaoParaConfirm.valor))}
              </div>
              <div className="confirmation-item">
                <strong>Data:</strong> {format(new Date(transacaoParaConfirm.data), 'dd/MM/yyyy')}
              </div>
              <div className="confirmation-item">
                <strong>Categoria:</strong> {transacaoParaConfirm.categoria_nome}
              </div>
            </div>

            {isDelete && (
              <div className="confirmation-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                <p>
                  Esta transação será excluída permanentemente. Esta ação não pode ser desfeita.
                </p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="footer-right">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button 
                onClick={executeConfirmAction}
                className={isDelete ? 'btn-secondary btn-secondary--danger' : 'btn-primary'}
              >
                {isDelete ? '🗑️ Excluir' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Paginação
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

  // Modal de Edição com Alerta para Transações de Cartão
  const EditModalWrapper = ({ children, isOpen, onClose }) => {
    // Verificar se a transação sendo editada é de cartão
    if (isOpen && transacaoEditando && transacaoEditando.cartao_id) {
      return (
        <div className="modal-overlay active">
          <div className="forms-modal-container">
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon-container modal-icon-warning">
                  ⚠️
                </div>
                <div>
                  <h2 className="modal-title">Transação de Cartão de Crédito</h2>
                  <p className="modal-subtitle">
                    Esta transação não pode ser editada aqui
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              <div className="confirmation-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                <p>
                  <strong>Transações de cartão de crédito devem ser editadas diretamente na tela de Fatura do Cartão.</strong>
                </p>
                <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#6b7280' }}>
                  Para editar esta transação, navegue até a seção de Cartões → Faturas e localize a fatura correspondente.
                </p>
              </div>

              <div className="confirmation-info">
                <div className="confirmation-item">
                  <strong>Descrição:</strong> {transacaoEditando.descricao}
                </div>
                <div className="confirmation-item">
                  <strong>Valor:</strong> {formatCurrency(Math.abs(transacaoEditando.valor))}
                </div>
                <div className="confirmation-item">
                  <strong>Cartão:</strong> {transacaoEditando.cartao_nome || 'N/A'}
                </div>
                <div className="confirmation-item">
                  <strong>Data:</strong> {format(new Date(transacaoEditando.data), 'dd/MM/yyyy')}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="footer-right">
                <button onClick={onClose} className="btn-primary">
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Se não for transação de cartão, renderiza o modal normal
    return children;
  };

  // ========== RENDER PRINCIPAL ==========

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
            <button onClick={() => handleNavigateMonth('prev')} className="nav-btn">←</button>
            <h2 className="current-period">
              {format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}
            </h2>
            <button onClick={() => handleNavigateMonth('next')} className="nav-btn">→</button>
            <button onClick={() => handleNavigateMonth('today')} className="today-btn">Hoje</button>
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
          <button
            onClick={() => setShowFilterModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              padding: '0 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: hasActiveFilters ? '#eff6ff' : '#f3f4f6',
              color: hasActiveFilters ? '#3b82f6' : '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              lineHeight: '1rem',
              fontWeight: hasActiveFilters ? '600' : '400'
            }}
          >
            🔍 Filtros Avançados {hasActiveFilters && `(${filtrosAtivos})`}
          </button>          
          {/* ===== BUG FIX 26: Melhorar texto do botão de agrupamento ===== */}
          <button
            className={`group-toggle ${groupByCard ? 'active' : ''}`}
            onClick={() => setGroupByCard(!groupByCard)}
            title={groupByCard ? 'Desagrupar despesas de cartão' : 'Agrupar despesas de cartão por fatura'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              padding: '0 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: groupByCard ? '#eff6ff' : '#f3f4f6',
              color: groupByCard ? '#3b82f6' : '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              lineHeight: '1rem',
              fontWeight: groupByCard ? '600' : '400'
            }}
          >
            💳 {groupByCard ? 'Desagrupar despesas de cartão' : 'Agrupar despesas de cartão'}
          </button>
          
          <button
            onClick={() => navigate('/transacoes/importar')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              padding: '0 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              lineHeight: '1rem',
              fontWeight: '400'
            }}
            >
            📥 Importar Transações
          </button>
        </div>
      </div>

      {/* Indicador de filtros ativos */}
      {(hasActiveFilters || groupByCard) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: '500' }}>
            🔍 Filtros ativos:
          </span>
          
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            
            let displayValue = value;
            let displayKey = key;
            
            switch (key) {
              case 'efetivado':
                displayKey = 'Status';
                displayValue = value === 'true' ? 'Efetivadas' : 'Pendentes';
                break;
              case 'recorrente':
                displayKey = 'Recorrente';
                displayValue = value === 'true' ? 'Sim' : 'Não';
                break;
              case 'categoria':
                displayKey = 'Categoria';
                const categoria = filterData.categorias.find(c => c.id === value);
                displayValue = categoria ? categoria.nome : value;
                break;
              case 'cartao':
                displayKey = 'Cartão';
                const cartao = filterData.cartoes.find(c => c.id === value);
                displayValue = cartao ? cartao.nome : value;
                break;
              case 'conta':
                displayKey = 'Conta';
                const conta = filterData.contas.find(c => c.id === value);
                displayValue = conta ? conta.nome : value;
                break;
              case 'subcategoria':
                displayKey = 'Subcategoria';
                const sub = filterData.subcategorias.find(s => s.id === value);
                displayValue = sub ? sub.nome : value;
                break;
              case 'valorMin':
                displayKey = 'Valor Min';
                displayValue = formatCurrency(parseFloat(value));
                break;
              case 'valorMax':
                displayKey = 'Valor Max';
                displayValue = formatCurrency(parseFloat(value));
                break;
              case 'dataInicio':
                displayKey = 'Data Início';
                displayValue = format(new Date(value), 'dd/MM/yyyy');
                break;
              case 'dataFim':
                displayKey = 'Data Fim';
                displayValue = format(new Date(value), 'dd/MM/yyyy');
                break;
              default:
                displayKey = key.charAt(0).toUpperCase() + key.slice(1);
            }
            
            return (
              <span
                key={key}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  maxWidth: '200px'
                }}
              >
                <span style={{ fontWeight: '600' }}>{displayKey}:</span>
                <span style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0
                }}>
                  {displayValue}
                </span>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, [key]: '' }));
                    setModalFilters(prev => ({ ...prev, [key]: '' }));
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                  }}
                  title={`Remover filtro ${displayKey}`}
                >
                  ×
                </button>
              </span>
            );
          })}
          
          {groupByCard && (
            <span
              style={{
                padding: '6px 10px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ fontWeight: '600' }}>Agrupado:</span>
              <span>Por Cartão</span>
              <button
                onClick={() => setGroupByCard(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '4px',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}
                title="Remover agrupamento"
              >
                ×
              </button>
            </span>
          )}
          
          <Button 
            onClick={clearFilters}
            style={{ 
              fontSize: '0.75rem', 
              padding: '6px 12px', 
              backgroundColor: 'transparent',
              color: '#2563eb',
              border: '1px solid #93c5fd',
              fontWeight: '500'
            }}
          >
            🗑️ Limpar todos
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
            <Pagination />
          </div>

          <aside className="resumo-sidebar">
            <Card>
              <h3>Resumo Financeiro</h3>
              <div className="stats-grid">
                <div className="stat-card receitas">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <span className="stat-label">Receitas</span>
                    <span className="stat-value">{formatCurrency(estatisticas.receitas.total)}</span>
                    {/* ===== BUG FIX 20: Corrigir plural do contador ===== */}
                    <span className="stat-count">
                      {estatisticas.receitas.quantidade} {estatisticas.receitas.quantidade === 1 ? 'transação' : 'transações'}
                    </span>
                  </div>
                </div>

                <div className="stat-card despesas">
                  <div className="stat-icon">💸</div>
                  <div className="stat-content">
                    <span className="stat-label">Despesas</span>
                    <span className="stat-value">{formatCurrency(estatisticas.despesas.total)}</span>
                    {/* ===== BUG FIX 20: Corrigir plural do contador ===== */}
                    <span className="stat-count">
                      {estatisticas.despesas.quantidade} {estatisticas.despesas.quantidade === 1 ? 'transação' : 'transações'}
                    </span>
                  </div>
                </div>

                <div className="stat-card saldo">
                  <div className="stat-icon">{estatisticas.saldo >= 0 ? '📈' : '📉'}</div>
                  <div className="stat-content">
                    <span className="stat-label">Saldo do Período</span>
                    <span className={`stat-value ${estatisticas.saldo >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(estatisticas.saldo)}
                    </span>
                    {/* ===== BUG FIX 25: Corrigir texto quando saldo é zero ===== */}
                    <span className="stat-count">
                      {estatisticas.saldo > 0 ? 'Resultado positivo' : 
                       estatisticas.saldo < 0 ? 'Resultado negativo' : 'Resultado neutro'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* ===== BUG FIX 24: Substituir "Estatísticas do Período" por informações mais educativas ===== */}
            <Card>
              <h3>Resumo do Período</h3>
              <div className="extra-stats">
                <div className="extra-stat">
                  <span className="extra-stat-label">Total de Transações</span>
                  <span className="extra-stat-value">{estatisticas.totalTransacoes}</span>
                </div>
                
                {estatisticas.receitas.quantidade > 0 && (
                  <div className="extra-stat">
                    <span className="extra-stat-label">Receita Média</span>
                    <span className="extra-stat-value">
                      {formatCurrency(estatisticas.receitas.total / estatisticas.receitas.quantidade)}
                    </span>
                  </div>
                )}
                
                {estatisticas.despesas.quantidade > 0 && (
                  <div className="extra-stat">
                    <span className="extra-stat-label">Despesa Média</span>
                    <span className="extra-stat-value">
                      {formatCurrency(estatisticas.despesas.total / estatisticas.despesas.quantidade)}
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
                      {filtrosAtivos} ativo{filtrosAtivos === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </aside>
        </div>
      )}

      <FilterModal />
      <ConfirmModal />

      <EditModalWrapper
        isOpen={showDespesasModal}
        onClose={() => {
          setShowDespesasModal(false);
          setTransacaoEditando(null);
        }}
      >
        {showDespesasModal && !transacaoEditando?.cartao_id && (
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
      </EditModalWrapper>

      <EditModalWrapper
        isOpen={showReceitasModal}
        onClose={() => {
          setShowReceitasModal(false);
          setTransacaoEditando(null);
        }}
      >
        {showReceitasModal && !transacaoEditando?.cartao_id && (
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
      </EditModalWrapper>

      {/* Modal de Importação */}
      {showImportacaoModal && (
        <ImportacaoModal
          isOpen={showImportacaoModal}
          onClose={() => setShowImportacaoModal(false)}
          onSave={fetchTransacoes}
        />
      )}
    </PageContainer>
  );
};

export default TransacoesPage;
