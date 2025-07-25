import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import DespesasModal from '@modules/transacoes/components/DespesasModalEdit';
import ReceitasModal from '@modules/transacoes/components/ReceitasModalEdit';
import ImportacaoModal from '@modules/transacoes/components/ImportacaoModal';
import DespesasCartaoModalEdit from '@modules/transacoes/components/DespesasCartaoModalEdit';
import { useTransactionsStore } from '@modules/transacoes/store/transactionsStore';


// Utils
import formatCurrency from '@shared/utils/formatCurrency';

// Hooks
import useAuth from '@modules/auth/hooks/useAuth';


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
    deleteTransacao,
    deleteGrupoTransacao, // ✅ ADICIONAR esta linha
    isParceladaOuRecorrente // ✅ ADICIONAR esta linha se não existir
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
  const [showDespesasCartaoModal, setShowDespesasCartaoModal] = useState(false);
  const [escopoExclusao, setEscopoExclusao] = useState('atual');
  const [grupoCartaoInfo, setGrupoCartaoInfo] = useState(null);


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

const resetForm = useCallback(() => {
  setFormData({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    conta: '',
    efetivado: true
  });
  setErrors({});
  setEscopoEdicao('atual');
  setMostrarEscopoEdicao(false);
  setTransacaoInfo(null);
  setValorOriginal(0);
  setDadosOriginais({ categoria: '', subcategoria: '' });
  
  // ✅ ADICIONAR estas linhas:
  setEscopoExclusao('atual');
  setGrupoCartaoInfo(null);
  
  setCategoriaDropdownOpen(false);
  setSubcategoriaDropdownOpen(false);
  setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  setDadosCarregados(false);
}, []);


const fetchTransacoes = async () => {
  if (!user?.id) return;

  // ✅ CORREÇÃO: Verificar se filtros estão REALMENTE preenchidos (não apenas strings vazias)
  const temFiltroDataInicio = filters.dataInicio && filters.dataInicio.trim() !== '';
  const temFiltroDataFim = filters.dataFim && filters.dataFim.trim() !== '';
  
const periodoEfetivo = {
  inicio: (filters.dataInicio && filters.dataInicio !== '') 
          ? filters.dataInicio 
          : format(dataInicio, 'yyyy-MM-dd'),
  fim: (filters.dataFim && filters.dataFim !== '') 
       ? filters.dataFim 
       : format(dataFim, 'yyyy-MM-dd')
};
console.log('🔍 [TESTE]:', {
  filters_dataInicio: `"${filters.dataInicio}"`,
  filters_dataFim: `"${filters.dataFim}"`,
  currentDate: currentDate,
  periodoEfetivo: periodoEfetivo
});

  console.log('🔍 Período efetivo sendo usado:', periodoEfetivo);
  console.log('🔍 [DEBUG] Filtros aplicados:', {
    filtroDataInicio: filters.dataInicio,
    filtroDataFim: filters.dataFim,
    temFiltroDataInicio,
    temFiltroDataFim,
    usandoFiltros: temFiltroDataInicio || temFiltroDataFim
  });

  try {
    useTransactionsStore.setState({ loading: true, error: null });
    
    const { default: supabase } = await import('@lib/supabaseClient');
    
    const { data, error } = await supabase.rpc('ip_prod_buscar_transacoes_periodo', {
      p_usuario_id: user.id,
      p_data_inicio: periodoEfetivo.inicio,
      p_data_fim: periodoEfetivo.fim
    });

    if (error) throw error;
    
    console.log('📊 Transações recebidas da RPC:', data?.length || 0);
    
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
 // ========== SUBSTITUIR TODOS OS useEffects POR ESTES 3 ==========

// 🔗 useEffect #1: Filtros da URL (MANTER COMO ESTÁ)
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
}, [searchParams]); // ← SÓ searchParams

// 📊 useEffect #2: Dados auxiliares (só carrega uma vez)
useEffect(() => {
  console.log('🎯 useEffect[dados auxiliares] DISPARADO');
  
  if (user?.id) {
    fetchFilterData(); // Categorias, cartões, contas, etc.
  }
}, [user?.id]); // ← SÓ user?.id

// 🔄 useEffect #3: Buscar transações (PRINCIPAL - roda quando mês OU filtros mudam)
useEffect(() => {
  console.log('🎯 useEffect[buscar transações] DISPARADO:', {
    hasUserId: !!user?.id,
    currentDate: currentDate,
    filters: filters
  });
  
  if (user?.id) {
    console.log('🔍 [DEBUG] Buscando transações...');
    fetchTransacoes();
  }
}, [user?.id, currentDate, filters]); // ← TODOS OS TRÊS: user, mês E filtros



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
  console.log('🎯 handleNavigateMonth CHAMADO:', direction); // ← ADICIONAR ESTE LOG
  
  if (loading) {
    console.log('⏳ BLOQUEADO por loading:', loading); // ← ADICIONAR ESTE LOG
    return;
  }
  
  let newDate;
  if (direction === 'prev') {
    newDate = subMonths(currentDate, 1);
    console.log('⬅️ Mudando para mês anterior:', newDate); // ← ADICIONAR ESTE LOG
  } else if (direction === 'next') {
    newDate = addMonths(currentDate, 1);
    console.log('➡️ Mudando para próximo mês:', newDate); // ← ADICIONAR ESTE LOG
  } else {
    newDate = new Date();
    console.log('📅 Mudando para hoje:', newDate); // ← ADICIONAR ESTE LOG
  }
  
  console.log('🔄 Atualizando currentDate de:', currentDate, 'para:', newDate); // ← ADICIONAR ESTE LOG
  
  setCurrentDate(newDate);
  setCurrentPage(1);
  
  console.log('✅ handleNavigateMonth FINALIZADO'); // ← ADICIONAR ESTE LOG
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
  console.log('🎯 applyFilters INICIADO'); // ← ADICIONAR ESTE LOG
  console.log('🔍 [DEBUG] modalFilters:', modalFilters);
  
  try {
    setFilters({ ...modalFilters });
    console.log('✅ setFilters executado'); // ← ADICIONAR ESTE LOG
    
    setCurrentPage(1);
    console.log('✅ setCurrentPage executado'); // ← ADICIONAR ESTE LOG
    
    setShowFilterModal(false);
    console.log('✅ setShowFilterModal executado'); // ← ADICIONAR ESTE LOG
    
    console.log('✅ applyFilters FINALIZADO'); // ← ADICIONAR ESTE LOG
  } catch (error) {
    console.error('❌ ERRO em applyFilters:', error); // ← ADICIONAR ESTE LOG
  }
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
    // Bloquear alteração apenas para transações de cartão já efetivadas
    if (transacao.cartao_id && transacao.efetivado) {
      alert('Transações de cartão já efetivadas só podem ser gerenciadas pela tela de Fatura do Cartão.');
      return;
    }
    
    setTransacaoParaConfirm(transacao);
    setConfirmAction('toggle_efetivado');
    setShowConfirmModal(true);
  };


  const verificarGrupoCartaoParaExclusao = async (transacao) => {
  try {
    // Buscar todas as parcelas do grupo
    const { default: supabase } = await import('@lib/supabaseClient');
    
    const { data: parcelasGrupo, error } = await supabase
      .from('transacoes')
      .select('id, efetivado, parcela_atual, total_parcelas')
      .eq('grupo_parcelamento', transacao.grupo_parcelamento)
      .eq('usuario_id', user.id)
      .order('parcela_atual');

    if (error) throw error;

    const parcelasEfetivadas = parcelasGrupo.filter(p => p.efetivado);
    const parcelasPendentes = parcelasGrupo.filter(p => !p.efetivado);

    // ❌ Se TODAS as parcelas estão efetivadas
    if (parcelasEfetivadas.length === parcelasGrupo.length) {
      alert('Todas as parcelas deste cartão já foram efetivadas. Gerencie pela tela de Fatura do Cartão.');
      return;
    }

    // ⚠️ Se ALGUMAS parcelas estão efetivadas
    if (parcelasEfetivadas.length > 0) {
      setTransacaoParaConfirm(transacao);
      setConfirmAction('delete_cartao_misto');
      setGrupoCartaoInfo({
        parcelasEfetivadas: parcelasEfetivadas.length,
        parcelasPendentes: parcelasPendentes.length,
        totalParcelas: parcelasGrupo.length
      });
      setShowConfirmModal(true);
      return;
    }

    // ✅ Se NENHUMA parcela está efetivada - exclusão normal
    setTransacaoParaConfirm(transacao);
    setConfirmAction('delete');
    setShowConfirmModal(true);

  } catch (error) {
    console.error('❌ Erro ao verificar grupo de cartão:', error);
    // Usar showNotification se existir, senão alert
    if (typeof showNotification === 'function') {
      showNotification('Erro ao verificar parcelas do cartão', 'error');
    } else {
      alert('Erro ao verificar parcelas do cartão');
    }
  }
};


const handleDeleteTransacao = (transacao) => {
  // ✅ REGRA 1: Bloquear transações de cartão já efetivadas
  if (transacao.cartao_id && transacao.efetivado) {
    alert('Transações de cartão já efetivadas só podem ser excluídas pela tela de Fatura do Cartão.');
    return;
  }

  // ✅ REGRA 2: Para transações de cartão parceladas não efetivadas,
  // verificar se existem parcelas já efetivadas no grupo
  if (transacao.cartao_id && transacao.grupo_parcelamento) {
    verificarGrupoCartaoParaExclusao(transacao);
    return;
  }

  // ✅ REGRA 3: Transações normais (sem cartão ou cartão não efetivado)
  setTransacaoParaConfirm(transacao);
  setConfirmAction('delete');
  setShowConfirmModal(true);
};

  const handleEditTransacao = (transacao) => {
  // Bloquear edição apenas para transações de cartão já efetivadas
  if (transacao.cartao_id && transacao.efetivado) {
    alert('Transações de cartão já efetivadas só podem ser editadas pela tela de Fatura do Cartão.');
    return;
  }
  
  setTransacaoEditando(transacao);
  if (transacao.tipo === 'receita') {
    setShowReceitasModal(true);
  } else if (transacao.cartao_id) {
    // Usar modal específico para cartão se não estiver efetivada
    setShowDespesasCartaoModal(true);
  } else {
    setShowDespesasModal(true);
  }
};

// ✅ SUBSTITUIR COMPLETAMENTE a função executeConfirmAction no TransacoesPage.jsx

const executeConfirmAction = async () => {
  if (!transacaoParaConfirm || !confirmAction) return;

  try {
    if (confirmAction === 'toggle_efetivado') {
      // ✅ Lógica existente para toggle
      const resultado = await toggleEfetivadoRPC(
        transacaoParaConfirm.id, 
        !transacaoParaConfirm.efetivado
      );

      if (!resultado.success) {
        if (resultado.error.includes('Cartão:')) {
          alert(resultado.error);
        } else {
          console.error('❌ Erro ao atualizar efetivação:', resultado.error);
        }
        return;
      }

      console.log('✅ Efetivação atualizada:', resultado.message);
      
    } else if (confirmAction === 'delete' || confirmAction === 'delete_cartao_misto') {
      // ✅ NOVA LÓGICA: Exclusão inteligente
      console.log('🗑️ Iniciando processo de exclusão:', {
        transacao: transacaoParaConfirm.id,
        escopo: escopoExclusao,
        action: confirmAction
      });

      // Identificar se é transação de grupo
      const transacaoInfo = isParceladaOuRecorrente(transacaoParaConfirm);
      const isGrupoTransacao = transacaoInfo && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente);
      const isCartaoMisto = confirmAction === 'delete_cartao_misto';

      let resultado;
      
      if (isGrupoTransacao || isCartaoMisto) {
        // ✅ Exclusão de grupo com escopo
        const escopoFinal = isCartaoMisto && escopoExclusao === 'futuras' ? 'pendentes' : escopoExclusao;
        resultado = await deleteGrupoTransacao(transacaoParaConfirm.id, escopoFinal);
      } else {
        // ✅ Exclusão individual (lógica existente)
        resultado = await deleteTransacao(transacaoParaConfirm.id);
      }

      if (!resultado.success) {
        console.error('❌ Erro ao excluir:', resultado.error);
        // Usar showNotification se existir, senão alert
        if (typeof showNotification === 'function') {
          showNotification(`Erro ao excluir: ${resultado.error}`, 'error');
        } else {
          alert(`Erro ao excluir: ${resultado.error}`);
        }
        return;
      }

      // ✅ Feedback de sucesso diferenciado
      const mensagemSucesso = (isGrupoTransacao || isCartaoMisto) && escopoExclusao !== 'atual' 
        ? `${resultado.transacoesAfetadas} transações excluídas com sucesso!`
        : 'Transação excluída com sucesso!';
        
      if (typeof showNotification === 'function') {
        showNotification(mensagemSucesso, 'success');
      }
      console.log('✅ Exclusão realizada:', resultado);
    }
    
    // ✅ Fechar modal e limpar estados
    setShowConfirmModal(false);
    setTransacaoParaConfirm(null);
    setConfirmAction(null);
    setEscopoExclusao('atual'); // Reset do escopo
    setGrupoCartaoInfo(null); // Reset das informações do cartão
    
    // ✅ Para exclusões em grupo, recarregar dados
    if ((confirmAction === 'delete' || confirmAction === 'delete_cartao_misto') && escopoExclusao !== 'atual') {
      console.log('🔄 Recarregando dados após exclusão em grupo...');
      await fetchTransacoes();
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar ação:', error);
    if (typeof showNotification === 'function') {
      showNotification(`Erro inesperado: ${error.message}`, 'error');
    } else {
      alert(`Erro inesperado: ${error.message}`);
    }
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
    const isCartaoTransacao = transacao.cartao_id && !isFatura && transacao.efetivado;
    
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

  // ===== IDENTIFICAÇÃO DOS TIPOS =====
  const isDelete = confirmAction === 'delete' || confirmAction === 'delete_cartao_misto';
  const isCartaoMisto = confirmAction === 'delete_cartao_misto';
  const isToggle = confirmAction === 'toggle_efetivado';
  const novoStatus = isToggle ? !transacaoParaConfirm.efetivado : null;

  // Identificar se é transação de grupo
  const transacaoInfo = isDelete ? isParceladaOuRecorrente(transacaoParaConfirm) : null;
  const isGrupoTransacao = transacaoInfo && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente);

  // ===== FUNÇÃO PARA GERAR RANGE DINÂMICO =====
  const getRangeText = () => {
    if (isCartaoMisto && grupoCartaoInfo) {
      return `${grupoCartaoInfo.parcelasPendentes} parcelas pendentes`;
    }
    
    if (transacaoInfo?.isParcelada) {
      const inicio = transacaoInfo.parcelaAtual;
      const fim = transacaoInfo.totalParcelas;
      return inicio === fim ? `última parcela` : `de ${inicio} a ${fim}`;
    }
    
    if (transacaoInfo?.isRecorrente) {
      const inicio = transacaoInfo.numeroRecorrencia;
      const fim = transacaoInfo.totalRecorrencias;
      return fim ? `de ${inicio} a ${fim}` : `${inicio} em diante`;
    }
    
    return '';
  };

  // ===== CONFIGURAÇÃO DO TÍTULO =====
  const getTitulo = () => {
    if (isToggle) return '⚠️ Confirmar Alteração';
    if (isCartaoMisto) return '💳 Confirmar Exclusão de Parcela de Cartão';
    if (isGrupoTransacao && transacaoInfo.isParcelada) return '🗑️ Confirmar Exclusão de Despesa Parcelada';
    if (isGrupoTransacao && transacaoInfo.isRecorrente) return '🗑️ Confirmar Exclusão de Despesa Recorrente';
    return '🗑️ Confirmar Exclusão';
  };

  // ===== PARA MODAIS SIMPLES (sem escopo) =====
  if (isToggle || (!isGrupoTransacao && !isCartaoMisto)) {
    return (
      <div className="modal-overlay active">
        <div className="forms-modal-container" style={{ maxWidth: '480px' }}>
          <div className="modal-header">
            <div className="modal-header-content">
              <div className={`modal-icon-container ${isDelete ? 'modal-icon-danger' : 'modal-icon-warning'}`}>
                {isToggle ? '⚠️' : '🗑️'}
              </div>
              <div>
                <h2 className="modal-title">{getTitulo()}</h2>
                <p className="modal-subtitle">
                  {isToggle ? 'Alterar status da transação' : 'Esta ação não pode ser desfeita'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowConfirmModal(false)} className="modal-close">×</button>
          </div>

          <div className="modal-body">
            <div className="confirmation-question">
              <p className="confirmation-text">
                {isToggle 
                  ? `Deseja ${novoStatus ? 'efetivar' : 'marcar como pendente'} esta transação?`
                  : 'Tem certeza que deseja excluir esta transação?'
                }
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
          </div>

          <div className="modal-footer">
            <div className="footer-right">
              <button onClick={() => setShowConfirmModal(false)} className="btn-cancel">
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
  }

  // ===== MODAL COMPLEXO (com escopo) =====
  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container" style={{ maxWidth: '520px' }}>
        {/* Header simplificado */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-danger">
              {isCartaoMisto ? '💳' : (transacaoInfo?.isParcelada ? '📦' : '🔄')}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '18px', marginBottom: '4px' }}>
                {getTitulo()}
              </h2>
              <p className="modal-subtitle" style={{ fontSize: '14px', color: '#6b7280' }}>
                Escolha o que deseja excluir:
              </p>
            </div>
          </div>
          <button onClick={() => setShowConfirmModal(false)} className="modal-close">×</button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Opções de escopo - Design limpo */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Opção 1: Apenas atual */}
              <label 
                className={`confirmation-option-clean ${escopoExclusao === 'atual' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  border: escopoExclusao === 'atual' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: escopoExclusao === 'atual' ? '#eff6ff' : '#ffffff',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name="escopoExclusao"
                  value="atual"
                  checked={escopoExclusao === 'atual'}
                  onChange={(e) => setEscopoExclusao(e.target.value)}
                  style={{ marginTop: '2px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px', 
                    color: '#1f2937',
                    marginBottom: '4px'
                  }}>
                    {isCartaoMisto ? 'Esta parcela' : 
                     transacaoInfo?.isParcelada ? 'Esta parcela' : 'Esta ocorrência'}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    Remove só a de {formatCurrency(Math.abs(transacaoParaConfirm.valor))} em {format(new Date(transacaoParaConfirm.data), 'dd/MM/yyyy')}
                  </div>
                </div>
              </label>

              {/* Opção 2: Esta e futuras/pendentes */}
              <label 
                className={`confirmation-option-clean ${escopoExclusao === 'futuras' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  border: escopoExclusao === 'futuras' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: escopoExclusao === 'futuras' ? '#eff6ff' : '#ffffff',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name="escopoExclusao"
                  value="futuras"
                  checked={escopoExclusao === 'futuras'}
                  onChange={(e) => setEscopoExclusao(e.target.value)}
                  style={{ marginTop: '2px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px', 
                    color: '#1f2937',
                    marginBottom: '4px'
                  }}>
                    {isCartaoMisto ? 'Todas as parcelas pendentes' :
                     transacaoInfo?.isParcelada ? 'Esta e as parcelas futuras' : 'Esta e as futuras'}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    {isCartaoMisto 
                      ? `Remove esta e mais ${grupoCartaoInfo?.parcelasPendentes - 1} parcelas não pagas`
                      : `Remove esta e todas as próximas não efetivadas (${getRangeText()})`
                    }
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Detalhes da transação - Design limpo */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              🧾 Detalhes da {transacaoInfo?.isParcelada ? 'Parcela' : 'Ocorrência'}
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div>
                <strong>Descrição:</strong> {transacaoParaConfirm.descricao}
              </div>
              <div>
                <strong>Valor:</strong> {formatCurrency(Math.abs(transacaoParaConfirm.valor))}
              </div>
              <div>
                <strong>Data:</strong> {format(new Date(transacaoParaConfirm.data), 'dd/MM/yyyy')}
              </div>
              <div>
                <strong>Categoria:</strong> {transacaoParaConfirm.categoria_nome}
              </div>
              
              {/* Informações específicas do grupo */}
              {transacaoInfo?.isParcelada && (
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Parcela:</strong> {transacaoInfo.parcelaAtual} de {transacaoInfo.totalParcelas}
                </div>
              )}
              
              {transacaoInfo?.isRecorrente && (
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Ocorrência:</strong> {transacaoInfo.numeroRecorrencia}{transacaoInfo.totalRecorrencias ? ` de ${transacaoInfo.totalRecorrencias}` : ''}
                </div>
              )}

              {transacaoParaConfirm.cartao_id && (
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Cartão:</strong> {transacaoParaConfirm.cartao_nome}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-right">
            <button onClick={() => setShowConfirmModal(false)} className="btn-cancel">
              Cancelar
            </button>
            <button 
              onClick={executeConfirmAction}
              disabled={!escopoExclusao}
              className="btn-secondary btn-secondary--danger"
              style={{
                opacity: !escopoExclusao ? 0.5 : 1,
                cursor: !escopoExclusao ? 'not-allowed' : 'pointer'
              }}
            >
              🗑️ Excluir
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
    if (isOpen && transacaoEditando && transacaoEditando.cartao_id && transacaoEditando.efetivado) {
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
      
      {/* Modal de Despesas de Cartão */}
      {showDespesasCartaoModal && (
        <DespesasCartaoModalEdit
          isOpen={showDespesasCartaoModal}
          onClose={() => {
            setShowDespesasCartaoModal(false);
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
