import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSearchParams, useNavigate } from 'react-router-dom';


// Styles
import '@shared/styles/PrincipalArquivoDeClasses.css';

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

function parseDateAsLocal(dateString) {
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(+year, month - 1, +day);
}

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
    // ✅ REGRA: Bloquear QUALQUER transação de cartão (efetivada ou não)
    if (transacao.cartao_id) {
      alert('Transações de cartão de crédito só podem ter seu status alterado pela tela de Fatura do Cartão.');
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

// Cabeçalho da tabela refatorado com classes iPOUPEI
const TableHeader = ({ label, sortKey, className = '' }) => {
  const isSorted = sortConfig.key === sortKey;
  const direction = isSorted ? sortConfig.direction : null;
  
  return (
    <th 
      className={`ip_tabela_ordenavel ${className} ${isSorted ? 'ip_tabela_ordenavel_ativo' : ''}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="ip_flex" style={{ justifyContent: 'space-between' }}>
        {label}
        <span style={{ 
          marginLeft: '4px', 
          opacity: isSorted ? 1 : 0.5,
          fontSize: '0.75rem'
        }}>
          {!isSorted && '⇅'}
          {isSorted && direction === 'asc' && '↑'}
          {isSorted && direction === 'desc' && '↓'}
        </span>
      </div>
    </th>
  );
};
// Linha da transação refatorada com classes iPOUPEI
const TransactionRow = ({ transacao }) => {
  const isReceita = transacao.tipo === 'receita';
  const isFatura = transacao.tipo === 'fatura';
  const isCartaoTransacao = transacao.cartao_id; // ✅ MUDANÇA: Qualquer transação de cartão
  
  return (
    <tr className={`ip_tabela_linha ${!transacao.efetivado ? 'ip_estado_inativo' : ''}`}>
      <td className="ip_tabela_celula">
        {format(parseDateAsLocal(transacao.data), 'dd/MM/yyyy')}
      </td>
      
      <td className="ip_tabela_celula">
        <div style={{ 
          maxWidth: '200px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {transacao.descricao}
        </div>
      </td>
      
      <td className="ip_tabela_celula">
        <div className="ip_flex ip_gap_2">
          <span 
            className="ip_indicador_cor_pequeno"
            style={{ backgroundColor: transacao.categoria_cor || '#6B7280' }}
          />
          <span style={{ fontSize: '0.875rem' }}>
            {transacao.categoria_nome}
          </span>
        </div>
      </td>
      
      <td className="ip_tabela_celula">
        {isFatura ? '-' : (
          isCartaoTransacao 
            ? (transacao.cartao_nome || 'Cartão não informado') 
            : transacao.conta_nome
        )}
      </td>
      
      <td className="ip_tabela_celula" style={{ textAlign: 'right' }}>
        <span className={`${isReceita ? 'ip_valor_verde' : 'ip_valor_vermelho'}`}>
          {isReceita ? '+' : '-'} {formatCurrency(Math.abs(transacao.valor))}
        </span>
      </td>
      
      {/* ✅ CORREÇÃO: Coluna de Status */}
      <td className="ip_tabela_celula" style={{ textAlign: 'center' }}>
        {isFatura ? (
          // ✅ Para faturas: apenas indicador visual
          <span 
            className="ip_botao_icone_pequeno efetivado"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#10b981',
              opacity: 0.8,
              cursor: 'default'
            }}
            title="Faturas são sempre consideradas efetivadas"
          >
            ✓
          </span>
        ) : isCartaoTransacao ? (
          // ✅ Para transações de cartão: indicador bloqueado
          <span 
            className="ip_botao_icone_pequeno"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: transacao.efetivado ? '#ecfdf5' : '#fffbeb',
              color: transacao.efetivado ? '#10b981' : '#f59e0b',
              opacity: 0.6,
              cursor: 'not-allowed',
              border: '1px solid #e5e7eb'
            }}
            title="Status de transações de cartão só pode ser alterado pela tela de Fatura do Cartão"
          >
            {transacao.efetivado ? '✓' : '⚠'}
          </span>
        ) : (
          // ✅ Para transações normais: botão funcional
          <button
            className={`ip_botao_icone_pequeno ${transacao.efetivado ? 'efetivado' : 'pendente'}`}
            onClick={() => handleToggleEfetivado(transacao)}
            title={transacao.efetivado ? 'Clique para marcar como pendente' : 'Clique para efetivar'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: transacao.efetivado ? '#ecfdf5' : '#fffbeb',
              color: transacao.efetivado ? '#10b981' : '#f59e0b',
              cursor: 'pointer'
            }}
          >
            {transacao.efetivado ? '✓' : '⚠'}
          </button>
        )}
      </td>
      
      {/* ✅ MANTER: Coluna de Ações (já estava correta) */}
      <td className="ip_tabela_celula" style={{ textAlign: 'center' }}>
        {!isFatura && (
          <div className="ip_acoes_item ip_flex ip_gap_1" style={{ justifyContent: 'center' }}>
            <button 
              className="ip_botao_icone_pequeno_card"
              onClick={() => handleEditTransacao(transacao)}
              disabled={isCartaoTransacao && transacao.efetivado}
              title={
                isCartaoTransacao && transacao.efetivado 
                  ? 'Esta transação só pode ser editada pela fatura do cartão de crédito.' 
                  : 'Editar'
              }
              style={{
                opacity: (isCartaoTransacao && transacao.efetivado) ? 0.6 : 1,
                cursor: (isCartaoTransacao && transacao.efetivado) ? 'not-allowed' : 'pointer'
              }}
            >
              ✏️
            </button>
            <button 
              className="ip_botao_icone_pequeno_card vermelho"
              onClick={() => handleDeleteTransacao(transacao)}
              disabled={isCartaoTransacao && transacao.efetivado}
              title={
                isCartaoTransacao && transacao.efetivado 
                  ? 'Exclusão só permitida pela tela de Fatura do Cartão.' 
                  : 'Excluir'
              }
              style={{
                opacity: (isCartaoTransacao && transacao.efetivado) ? 0.6 : 1,
                cursor: (isCartaoTransacao && transacao.efetivado) ? 'not-allowed' : 'pointer'
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
// Modal de Filtros refatorado com classes iPOUPEI
const gridStyle2Cols = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginBottom: '1rem',
  width: '100%'
};

const gridStyle3Cols = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '1rem',
  marginBottom: '1rem',
  width: '100%'
};

// Media query para mobile
const isMobile = window.innerWidth <= 768;
const mobileGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '1rem',
  marginBottom: '1rem',
  width: '100%'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%'
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box'
};

    return (
      <div className="ip_modal_fundo" style={{ alignItems: 'flex-start', paddingTop: '120px' }}>
        <div className="ip_modal_medio">
          
          {/* Header */}
          <div className="ip_header_azul">
            
            <div className="ip_flex">
              
              <div className="ip_modal_titulo">Filtros Avançados</div>
              <div className="ip_modal_subtitulo">
                Configure os filtros para refinar sua busca de transações
              </div>
            </div>
            <button onClick={handleCancel} className="ip_modal_close">×</button>
          </div>

          {/* Body */}
          <div className="ip_modal_content">
            {/* Linha 1: Tipo e Status */}
            <div style={isMobile ? mobileGridStyle : gridStyle2Cols}>
              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Tipo de Transação</label>
                <select
                  value={localFilters.tipo}
                  onChange={(e) => handleLocalChange('tipo', e.target.value)}
                  className="ip_input_base ip_input_select"
                  style={inputStyle}
                >
                  <option value="">Todos os tipos</option>
                  <option value="receita">💰 Receitas</option>
                  <option value="despesa">💸 Despesas</option>
                </select>
              </div>

              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Status</label>
                <select
                  value={localFilters.efetivado}
                  onChange={(e) => handleLocalChange('efetivado', e.target.value)}
                  className="ip_input_base ip_input_select"
                  style={inputStyle}
                >
                  <option value="">Todos os status</option>
                  <option value="true">✅ Efetivadas</option>
                  <option value="false">⏳ Pendentes</option>
                </select>
              </div>
            </div>

            {/* Linha 2: Categoria e Subcategoria */}
            <div style={isMobile ? mobileGridStyle : gridStyle2Cols}>
              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Categoria</label>
                <select
                  value={localFilters.categoria}
                  onChange={(e) => handleLocalChange('categoria', e.target.value)}
                  className="ip_input_base ip_input_select"
                  style={inputStyle}
                >
                  <option value="">Todas as categorias</option>
                  {filterData.categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome} ({categoria.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Subcategoria</label>
                <select
                  value={localFilters.subcategoria}
                  onChange={(e) => handleLocalChange('subcategoria', e.target.value)}
                  className={`ip_input_base ip_input_select ${!localFilters.categoria ? 'ip_input_desabilitado' : ''}`}
                  disabled={!localFilters.categoria}
                  style={inputStyle}
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

            {/* Linha 3: Conta e Cartão */}
            <div style={isMobile ? mobileGridStyle : gridStyle2Cols}>
              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Conta</label>
                <select
                  value={localFilters.conta}
                  onChange={(e) => handleLocalChange('conta', e.target.value)}
                  className="ip_input_base ip_input_select"
                  style={inputStyle}
                >
                  <option value="">Todas as contas</option>
                  {filterData.contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} ({conta.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Cartão</label>
                <select
                  value={localFilters.cartao}
                  onChange={(e) => handleLocalChange('cartao', e.target.value)}
                  className="ip_input_base ip_input_select"
                  style={inputStyle}
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

            {/* Linha 4: Valores */}
            <div style={isMobile ? mobileGridStyle : gridStyle2Cols}>
              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Valor Mínimo</label>
                <input
                  type="number"
                  value={localFilters.valorMin}
                  onChange={(e) => handleLocalChange('valorMin', e.target.value)}
                  placeholder="0,00"
                  className="ip_input_base ip_input_dinheiro"
                  style={inputStyle}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Valor Máximo</label>
                <input
                  type="number"
                  value={localFilters.valorMax}
                  onChange={(e) => handleLocalChange('valorMax', e.target.value)}
                  placeholder="999999,00"
                  className="ip_input_base ip_input_dinheiro"
                  style={inputStyle}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Linha 5: Datas e Busca */}
            <div style={isMobile ? mobileGridStyle : gridStyle3Cols}>
              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Data Início</label>
                <input
                  type="date"
                  value={localFilters.dataInicio}
                  onChange={(e) => handleLocalChange('dataInicio', e.target.value)}
                  className="ip_input_base ip_input_data"
                  style={inputStyle}
                />
              </div>

              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Data Fim</label>
                <input
                  type="date"
                  value={localFilters.dataFim}
                  onChange={(e) => handleLocalChange('dataFim', e.target.value)}
                  className="ip_input_base ip_input_data"
                  style={inputStyle}
                />
              </div>

              <div className="ip_grupo_formulario" style={inputGroupStyle}>
                <label className="ip_label">Buscar Descrição</label>
                <input
                  type="text"
                  value={localFilters.descricao}
                  onChange={(e) => handleLocalChange('descricao', e.target.value)}
                  placeholder="Digite para buscar..."
                  className="ip_input_base ip_input_texto"
                  style={inputStyle}
                />
              </div>
            </div>
            
          </div>

          {/* Footer */}
          <div className="ip_modal_footer">
            <button 
              onClick={clearFilters}
              className="ip_botao_cinza ip_botao_medio"
              disabled={!hasActiveFilters}
            >
              🗑️ Limpar Todos
            </button>
            
            <div className="ip_flex ip_gap_2">
              <button 
                onClick={handleCancel} 
                className="ip_botao_cinza ip_botao_medio"
              >
                Cancelar
              </button>
              <button 
                onClick={handleApply} 
                className="ip_botao_azul ip_botao_medio"
              >
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
    <div className="ip_modal_fundo">
      <div className="ip_modal_pequeno ip_modal_w_520">
        <div className={`${isDelete ? 'ip_header_vermelho' : 'ip_header_azul'}`}>
          <div className="ip_flex">
            <div>
              <div className="ip_modal_titulo">
                {getTitulo()}
              </div>
              <div className="ip_modal_subtitulo">
                {isToggle ? 'Alterar status da transação' : 'Esta ação não pode ser desfeita'}
              </div>
            </div>
          </div>
          <button onClick={() => setShowConfirmModal(false)} className="ip_modal_close">×</button>
        </div>

        <div className="ip_modal_content ip_p_20">
          <div className="ip_mensagem_personalizada ip_mb_3">
            <div className={`ip_mensagem_card ${isDelete ? 'aviso' : 'info'}`} style={{ padding: '16px' }}>
              <div className="ip_mensagem_icone">
                {isToggle ? '⚠️' : '🗑️'}
              </div>
              <div className="ip_mensagem_conteudo">
                <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0' }}>
                  {isToggle 
                    ? `Deseja ${novoStatus ? 'efetivar' : 'marcar como pendente'} esta transação?`
                    : 'Tem certeza que deseja excluir esta transação?'
                  }
                </h2>
              </div>
            </div>
          </div>
          
          <div className="ip_card_pequeno ip_p_16" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="ip_flex ip_gap_2 ip_mb_3">
              <span style={{ fontSize: '14px' }}>🧾</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                Detalhes da Transação
              </span>
            </div>
            
            <div className="ip_flex_wrap ip_texto_inline_pequeno">
              <span>
                <strong>Descrição:</strong> {transacaoParaConfirm.descricao}
              </span>
              <span>
                <strong>Valor:</strong> {formatCurrency(Math.abs(transacaoParaConfirm.valor))}
              </span>
              <span>
                <strong>Data:</strong> {format(new Date(transacaoParaConfirm.data), 'dd/MM/yyyy')}
              </span>
              <span>
                <strong>Categoria:</strong> {transacaoParaConfirm.categoria_nome}
              </span>
            </div>
          </div>
        </div>

        <div className="ip_modal_footer ip_py_16_px_20">
          <div className="ip_flex ip_gap_2" style={{ justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setShowConfirmModal(false)} 
              className="ip_botao_cinza ip_botao_pequeno"
            >
              Cancelar
            </button>
            <button 
              onClick={executeConfirmAction}
              className={`${isDelete ? 'ip_botao_vermelho' : 'ip_botao_azul'} ip_botao_pequeno`}
            >
              {isDelete ? '🗑️ Excluir' : '✅ Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
  // ===== MODAL COMPLEXO REPENSADO COMPLETAMENTE =====
const getTipoTransacao = () => {
  if (transacaoParaConfirm.tipo === 'receita') return 'Receita';
  if (transacaoParaConfirm.tipo === 'despesa') return 'Despesa';
  return 'Transação';
};

const getTituloContextual = () => {
  const tipo = getTipoTransacao();
  if (isCartaoMisto) return `💳 Confirmar Exclusão de Parcelas de Cartão`;
  if (transacaoInfo?.isParcelada) return `📦 Confirmar Exclusão de ${tipo} Parcelada`;
  if (transacaoInfo?.isRecorrente) return `🔄 Confirmar Exclusão de ${tipo} Recorrente`;
  return `🗑️ Confirmar Exclusão de ${tipo}`;
};

const getDescricaoEscopo = (escopo) => {
  if (escopo === 'atual') {
    return `Remove somente esta: ${formatCurrency(Math.abs(transacaoParaConfirm.valor))} em ${format(new Date(transacaoParaConfirm.data), 'dd/MM/yyyy')}`;
  }
  
  if (isCartaoMisto) {
    const total = grupoCartaoInfo?.parcelasPendentes || 0;
    return `Remove esta e mais ${total - 1} parcelas ainda não pagas (${total} parcelas no total)`;
  }
  
  if (transacaoInfo?.isParcelada) {
    const atual = transacaoInfo.parcelaAtual;
    const total = transacaoInfo.totalParcelas;
    const restantes = total - atual + 1;
    return `Remove da ${atual}ª à ${total}ª parcela (${restantes} parcelas ainda não lançadas)`;
  }
  
  if (transacaoInfo?.isRecorrente) {
    const atual = transacaoInfo.numeroRecorrencia;
    const total = transacaoInfo.totalRecorrencias;
    if (total) {
      const restantes = total - atual + 1;
      return `Remove da ${atual}ª à ${total}ª ocorrência (${restantes} ocorrências ainda não lançadas)`;
    }
    return `Remove esta e todas as próximas ocorrências ainda não lançadas`;
  }
  
  return 'Remove esta e todas as próximas ainda não efetivadas';
};

return (
  <div className="ip_modal_fundo">
    <div className="ip_modal_pequeno ip_modal_w_520 ip_modal_h_90">
      {/* Header compacto */}
      <div className="ip_header_vermelho">
        <div className="ip_flex">
          <div>
            <div className="ip_modal_titulo">{getTituloContextual()}</div>
            <div className="ip_modal_subtitulo">Esta ação não pode ser desfeita</div>
          </div>
        </div>
        <button onClick={() => setShowConfirmModal(false)} className="ip_modal_close">×</button>
      </div>

      <div className="ip_modal_content ip_p_20">
        {/* Resumo compacto */}
        <div className="ip_mensagem_personalizada ip_mb_3">
          <div className="ip_mensagem_card aviso ip_p_12">
            <div className="ip_mensagem_icone" style={{ fontSize: '1.25rem' }}>⚠️</div>
            <div className="ip_mensagem_conteudo">
              <div className="ip_valor_destaque" style={{ fontSize: '15px' }}>
                {transacaoParaConfirm.descricao} • {formatCurrency(Math.abs(transacaoParaConfirm.valor))}
              </div>
            </div>
          </div>
        </div>

        {/* Opções de escopo */}
        <div className="ip_mb_3">
          <div className="ip_flex_coluna ip_gap_2">
            
            {/* Opção 1 */}
            <label className={`ip_opcao_card ${escopoExclusao === 'atual' ? 'ip_opcao_card_selecionado' : 'ip_opcao_card_normal'}`}>
              <div className={`ip_circulo_16 ${escopoExclusao === 'atual' ? 'ip_radio_selecionado' : 'ip_radio_normal'}`}>
                {escopoExclusao === 'atual' && <div className="ip_circulo_ponto" />}
              </div>
              <input
                type="radio"
                name="escopoExclusao"
                value="atual"
                checked={escopoExclusao === 'atual'}
                onChange={(e) => setEscopoExclusao(e.target.value)}
                className="ip_oculto"
              />
              <div>
                <div className="ip_titulo_opcao">
                  Somente esta {transacaoInfo?.isParcelada ? 'parcela' : 'ocorrência'}
                </div>
                <div className="ip_descricao_opcao">
                  {getDescricaoEscopo('atual')}
                </div>
              </div>
            </label>

            {/* Opção 2 */}
            <label className={`ip_opcao_card ${escopoExclusao === 'futuras' ? 'ip_opcao_card_selecionado' : 'ip_opcao_card_normal'}`}>
              <div className={`ip_circulo_16 ${escopoExclusao === 'futuras' ? 'ip_radio_selecionado' : 'ip_radio_normal'}`}>
                {escopoExclusao === 'futuras' && <div className="ip_circulo_ponto" />}
              </div>
              <input
                type="radio"
                name="escopoExclusao"
                value="futuras"
                checked={escopoExclusao === 'futuras'}
                onChange={(e) => setEscopoExclusao(e.target.value)}
                className="ip_oculto"
              />
              <div>
                <div className="ip_titulo_opcao">
                  Esta e as {transacaoInfo?.isParcelada ? 'parcelas' : 'ocorrências'} seguintes
                </div>
                <div className="ip_descricao_opcao">
                  {getDescricaoEscopo('futuras')}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Detalhes em uma linha */}
        <div className="ip_card_pequeno ip_p_10" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="ip_flex ip_gap_2 ip_mb_2">
            <span style={{ fontSize: '12px' }}>📋</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
              Detalhes
            </span>
          </div>
          
          <div className="ip_flex_wrap ip_texto_inline_pequeno">
            <span>
              <strong>Tipo:</strong> {getTipoTransacao()}
            </span>
            <span>
              <strong>Categoria:</strong> {transacaoParaConfirm.categoria_nome}
            </span>
            <span>
              <strong>Data:</strong> {format(new Date(transacaoParaConfirm.data), 'dd/MM/yyyy')}
            </span>
            {(transacaoInfo?.isParcelada || transacaoInfo?.isRecorrente) && (
              <span>
                <strong>
                  {transacaoInfo?.isParcelada ? 'Parcela:' : 'Ocorrência:'}
                </strong> 
                {transacaoInfo?.isParcelada 
                  ? `${transacaoInfo.parcelaAtual}/${transacaoInfo.totalParcelas}`
                  : `${transacaoInfo.numeroRecorrencia}${transacaoInfo.totalRecorrencias ? `/${transacaoInfo.totalRecorrencias}` : ''}`
                }
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer compacto */}
      <div className="ip_modal_footer ip_py_16_px_20">
        <div className="ip_flex ip_gap_2" style={{ justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setShowConfirmModal(false)} 
            className="ip_botao_cinza ip_botao_pequeno"
          >
            Manter
          </button>
          <button 
            onClick={executeConfirmAction}
            disabled={!escopoExclusao}
            className="ip_botao_vermelho ip_botao_pequeno"
            style={{ opacity: !escopoExclusao ? 0.5 : 1 }}
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
      <div className="ip_modal_fundo">
        <div className="ip_modal_pequeno ip_modal_w_520">
          <div className="ip_header_azul">
            <div className="ip_flex">
              <div>
                <div className="ip_modal_titulo">Transação de Cartão de Crédito</div>
                <div className="ip_modal_subtitulo">Esta transação não pode ser editada aqui</div>
              </div>
            </div>
            <button onClick={onClose} className="ip_modal_close">×</button>
          </div>

          <div className="ip_modal_content ip_p_20">
            <div className="ip_mensagem_personalizada ip_mb_3">
              <div className="ip_mensagem_card aviso ip_p_16">
                <div className="ip_mensagem_icone">⚠️</div>
                <div className="ip_mensagem_conteudo">
                  <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                    Transações de cartão de crédito devem ser editadas diretamente na tela de Fatura do Cartão.
                  </h2>
                  <p className="ip_texto_secundario" style={{ margin: '0' }}>
                    Para editar esta transação, navegue até a seção de Cartões → Faturas e localize a fatura correspondente.
                  </p>
                </div>
              </div>
            </div>

            <div className="ip_card_pequeno ip_p_16" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="ip_flex ip_gap_2 ip_mb_3">
                <span style={{ fontSize: '14px' }}>🧾</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                  Detalhes da Transação
                </span>
              </div>
              
              <div className="ip_flex_wrap ip_texto_inline_pequeno">
                <span>
                  <strong>Descrição:</strong> {transacaoEditando.descricao}
                </span>
                <span>
                  <strong>Valor:</strong> {formatCurrency(Math.abs(transacaoEditando.valor))}
                </span>
                <span>
                  <strong>Cartão:</strong> {transacaoEditando.cartao_nome || 'N/A'}
                </span>
                <span>
                  <strong>Data:</strong> {format(new Date(transacaoEditando.data), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          </div>

          <div className="ip_modal_footer ip_py_16_px_20">
            <div className="ip_flex" style={{ justifyContent: 'flex-end' }}>
              <button onClick={onClose} className="ip_botao_azul ip_botao_medio">
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
// ========== RENDER PRINCIPAL REFATORADO ==========

if (error) {
  return (
    <PageContainer title="Transações">
      <div className="ip_estado_vazio">
        <div className="ip_estado_vazio_icone">⚠️</div>
        <h3 className="ip_estado_vazio_titulo">Erro ao carregar transações</h3>
        <p className="ip_estado_vazio_descricao">{error}</p>
        <Button onClick={fetchTransacoes}>Tentar Novamente</Button>
      </div>
    </PageContainer>
  );
}


 return (
  <PageContainer title="Transações">
    {/* Header */}
    <div className="ip_header_secundario">
      <div className="ip_navegacao_periodo">
        <button 
          onClick={() => handleNavigateMonth('prev')} 
          disabled={loading}
          className="ip_botao_navegacao"
        >
          ←
        </button>
        <h2 className="ip_periodo_atual">
          {format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })}
        </h2>
        <button 
          onClick={() => handleNavigateMonth('next')} 
          disabled={loading}
          className="ip_botao_navegacao"
        >
          →
        </button>
        <button 
          onClick={() => handleNavigateMonth('today')} 
          disabled={loading}
          className="ip_botao_hoje"
        >
          Hoje
        </button>
      </div>
<div className="ip_flex ip_gap_3">
          <button
            onClick={() => setShowFilterModal(true)}
            className={`ip_botao_base ip_botao_medio ${hasActiveFilters ? 'ip_botao_azul_outline' : 'ip_botao_cinza'}`}
            style={{ fontWeight: hasActiveFilters ? '600' : '400' }}
          >
            🔍 Filtros Avançados {hasActiveFilters && `(${filtrosAtivos})`}
          </button>          
          
          <button
            onClick={() => setGroupByCard(!groupByCard)}
            title={groupByCard ? 'Desagrupar despesas de cartão' : 'Agrupar despesas de cartão por fatura'}
            className={`ip_botao_base ip_botao_medio ${groupByCard ? 'ip_botao_azul_outline' : 'ip_botao_cinza'}`}
            style={{ fontWeight: groupByCard ? '600' : '400' }}
          >
            💳 {groupByCard ? 'Desagrupar despesas de cartão' : 'Agrupar despesas de cartão'}
          </button>
          
          <button
            onClick={() => navigate('/transacoes/importar')}
            className="ip_botao_base ip_botao_medio ip_botao_cinza"
          >
            📥 Importar Transações
          </button>
        </div>
      </div>
      {/* Barra de Filtros Rápidos */}
<div className="ip_card_pequeno ip_mb_4">
  <div className="ip_flex" style={{ 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: '16px' 
  }}>
    <h3 className="ip_texto_principal" style={{ 
      fontSize: '0.875rem', 
      fontWeight: '600',
      color: 'var(--ip-cinza-700)',
      margin: 0 
    }}>
      🔍 Filtros Rápidos
    </h3>
    

  </div>

  {/* Grid de Filtros - UMA LINHA ÚNICA */}
  <div style={{ 
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px'
  }}>
    
    {/* Tipo de Transação */}
    <div className="ip_grupo_formulario" style={{ marginBottom: 0 }}>
      <label className="ip_label" style={{ fontSize: '11px', marginBottom: '4px' }}>
        Tipo
      </label>
      <select
        value={filters.tipo}
        onChange={(e) => {
          const newFilters = { ...filters, tipo: e.target.value };
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        className="ip_input_base ip_input_select"
        style={{ fontSize: '12px', padding: '5px 6px' }}
      >
        <option value="">Todos</option>
        <option value="receita">💰 Receitas</option>
        <option value="despesa">💸 Despesas</option>
      </select>
    </div>

    {/* Status */}
    <div className="ip_grupo_formulario" style={{ marginBottom: 0 }}>
      <label className="ip_label" style={{ fontSize: '11px', marginBottom: '4px' }}>
        Status
      </label>
      <select
        value={filters.efetivado}
        onChange={(e) => {
          const newFilters = { ...filters, efetivado: e.target.value };
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        className="ip_input_base ip_input_select"
        style={{ fontSize: '12px', padding: '5px 6px' }}
      >
        <option value="">Todos</option>
        <option value="true">✅ Efetivadas</option>
        <option value="false">⏳ Pendentes</option>
      </select>
    </div>

    {/* Categoria */}
    <div className="ip_grupo_formulario" style={{ marginBottom: 0 }}>
      <label className="ip_label" style={{ fontSize: '11px', marginBottom: '4px' }}>
        Categoria
      </label>
      <select
        value={filters.categoria}
        onChange={(e) => {
          const newFilters = { 
            ...filters, 
            categoria: e.target.value,
            subcategoria: '' // Reset subcategoria quando categoria muda
          };
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        className="ip_input_base ip_input_select"
        style={{ fontSize: '12px', padding: '5px 6px' }}
      >
        <option value="">Todas</option>
        {filterData.categorias
          .filter(categoria => !filters.tipo || categoria.tipo === filters.tipo) // ✅ FILTRO SENSIBILIZADO
          .map(categoria => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
      </select>
    </div>

    {/* Subcategoria */}
    <div className="ip_grupo_formulario" style={{ marginBottom: 0 }}>
      <label className="ip_label" style={{ fontSize: '11px', marginBottom: '4px' }}>
        Subcategoria
      </label>
      <select
        value={filters.subcategoria}
        onChange={(e) => {
          const newFilters = { ...filters, subcategoria: e.target.value };
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        className={`ip_input_base ip_input_select ${!filters.categoria ? 'ip_input_desabilitado' : ''}`}
        disabled={!filters.categoria}
        style={{ fontSize: '12px', padding: '5px 6px' }}
      >
        <option value="">Todas</option>
        {filterData.subcategorias
          .filter(sub => filters.categoria && sub.categoria_id === filters.categoria) // ✅ FILTRO SENSIBILIZADO
          .map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub.nome}
            </option>
          ))}
      </select>
    </div>

    {/* Conta */}
    <div className="ip_grupo_formulario" style={{ marginBottom: 0 }}>
      <label className="ip_label" style={{ fontSize: '11px', marginBottom: '4px' }}>
        Conta
      </label>
      <select
        value={filters.conta}
        onChange={(e) => {
          const newFilters = { ...filters, conta: e.target.value };
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        className="ip_input_base ip_input_select"
        style={{ fontSize: '12px', padding: '5px 6px' }}
      >
        <option value="">Todas</option>
        {filterData.contas.map(conta => (
          <option key={conta.id} value={conta.id}>
            {conta.nome}
          </option>
        ))}
      </select>
    </div>

    {/* Cartão */}
    <div className="ip_grupo_formulario" style={{ marginBottom: 0 }}>
      <label className="ip_label" style={{ fontSize: '11px', marginBottom: '4px' }}>
        Cartão
      </label>
      <select
        value={filters.cartao}
        onChange={(e) => {
          const newFilters = { ...filters, cartao: e.target.value };
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        className="ip_input_base ip_input_select"
        style={{ fontSize: '12px', padding: '5px 6px' }}
      >
        <option value="">Todos</option>
        {filterData.cartoes.map(cartao => (
          <option key={cartao.id} value={cartao.id}>
            {cartao.nome}
          </option>
        ))}
      </select>
    </div>

    {/* Busca por Descrição - NA MESMA LINHA */}
    <div className="ip_grupo_formulario" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
      <label className="ip_label" style={{ fontSize: '11px', marginBottom: '4px' }}>
        🔍 Buscar descrição
      </label>
      <input
        type="text"
        value={filters.descricao}
        onChange={(e) => {
          const newFilters = { ...filters, descricao: e.target.value };
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        placeholder="Digite para buscar..."
        className="ip_input_base ip_input_texto"
        style={{ fontSize: '12px', padding: '5px 6px' }}
      />
    </div>
  </div>
</div>
      {/* Indicador de filtros ativos */}
      {(hasActiveFilters || groupByCard) && (
        <div className="ip_card_pequeno ip_mb_4" style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #93c5fd'
        }}>
          <div className="ip_flex ip_gap_3" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ip_texto_principal" style={{ 
              fontSize: '0.875rem', 
              color: '#2563eb', 
              fontWeight: '500' 
            }}>
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
                  className="ip_badge_azul ip_flex ip_gap_1"
                  style={{
                    maxWidth: '200px',
                    fontSize: '0.75rem'
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
              <span className="ip_badge_roxo ip_flex ip_gap_1">
                <span style={{ fontWeight: '600' }}>Agrupado:</span>
                <span>Por Cartão</span>
                <button
                  onClick={() => setGroupByCard(false)}
                  className="ip_botao_icone_pequeno_card"
                  title="Remover agrupamento"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    marginLeft: '4px',
                    width: 'auto',
                    height: 'auto',
                    padding: '0',
                    fontSize: '0.875rem'
                  }}
                >
                  ×
                </button>
              </span>
            )}
            
            <button 
              onClick={clearFilters}
              className="ip_botao_azul_outline ip_botao_minusculo"
            >
              🗑️ Limpar todos
            </button>
          </div>
        </div>
      )}
      {/* Loading */}
        {loading && (
          <div className="ip_loading_container">
            <div className="ip_loading_spinner" />
            <p className="ip_loading_texto">Carregando transações...</p>
          </div>
        )}
{/* Conteúdo principal */}
{!loading && transacoesProcessadas.length > 0 && (
  <div className="ip_grid_2_colunas ip_gap_2">
    <div className="ip_flex_coluna ip_gap_4">
      <div className="ip_card_grande" style={{ overflowX: 'auto' }}>
        <table className="ip_tabela">
          <thead className="ip_tabela_header">
            <tr>
              <TableHeader label="Data" sortKey="data" />
              <TableHeader label="Descrição" sortKey="descricao" />
              <TableHeader label="Categoria" sortKey="categoria_nome" />
              <TableHeader label="Conta" sortKey="conta_nome" />
              <TableHeader label="Valor" sortKey="valor" />
              <TableHeader label="Status" sortKey="efetivado" />
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
      <Pagination />
    </div>
  

  

<aside className="ip_sidebar_resumo">
            {/* Card 1: Resumo Financeiro */}
            <div>
              <div className="ip_sidebar_header">Resumo Financeiro</div>
              
              <div className="ip_flex_coluna ip_gap_3 ip_p_3">
                <div className="ip_card_estatistica receitas">
                  <div className="ip_icone_estatistica">💰</div>
                  <div className="ip_conteudo_estatistica">
                    <div className="ip_label_estatistica">Receitas</div>
                    <div className="ip_valor_estatistica">{formatCurrency(estatisticas.receitas.total)}</div>
                    <div className="ip_contador_estatistica">
                      {estatisticas.receitas.quantidade} {estatisticas.receitas.quantidade === 1 ? 'transação' : 'transações'}
                    </div>
                  </div>
                </div>

                <div className="ip_card_estatistica despesas">
                  <div className="ip_icone_estatistica">💸</div>
                  <div className="ip_conteudo_estatistica">
                    <div className="ip_label_estatistica">Despesas</div>
                    <div className="ip_valor_estatistica">{formatCurrency(estatisticas.despesas.total)}</div>
                    <div className="ip_contador_estatistica">
                      {estatisticas.despesas.quantidade} {estatisticas.despesas.quantidade === 1 ? 'transação' : 'transações'}
                    </div>
                  </div>
                </div>

                <div className="ip_card_estatistica saldo">
                  <div className="ip_icone_estatistica">{estatisticas.saldo >= 0 ? '📈' : '📉'}</div>
                  <div className="ip_conteudo_estatistica">
                    <div className="ip_label_estatistica">Saldo do Período</div>
                    <div className={`ip_valor_estatistica ${estatisticas.saldo >= 0 ? 'positivo' : 'negativo'}`}>
                      {formatCurrency(estatisticas.saldo)}
                    </div>
                    <div className="ip_contador_estatistica">
                      {estatisticas.saldo > 0 ? 'Resultado positivo' : 
                       estatisticas.saldo < 0 ? 'Resultado negativo' : 'Resultado neutro'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Resumo do Período */}
            <div>
  <div className="ip_sidebar_header">Resumo do Período</div>
  
  <div className="ip_flex_coluna ip_gap_2 ip_p_3">
    {/* Total de Transações */}
    <div className="ip_card_estatistica saldo">
      <div className="ip_icone_estatistica">📊</div>
      <div className="ip_conteudo_estatistica">
        <div className="ip_label_estatistica">Total de Transações</div>
        <div className="ip_valor_estatistica" style={{ color: 'var(--ip-cinza-900)' }}>
          {estatisticas.totalTransacoes}
        </div>
        <div className="ip_contador_estatistica">
          no período selecionado
        </div>
      </div>
    </div>

    {/* Receita Média - só mostra se houver receitas */}
    {estatisticas.receitas.quantidade > 0 && (
      <div className="ip_card_estatistica receitas">
        <div className="ip_icone_estatistica">📈</div>
        <div className="ip_conteudo_estatistica">
          <div className="ip_label_estatistica">Receita Média</div>
          <div className="ip_valor_estatistica">
            {formatCurrency(estatisticas.receitas.total / estatisticas.receitas.quantidade)}
          </div>
          <div className="ip_contador_estatistica">
            por transação
          </div>
        </div>
      </div>
    )}
    
    {/* Despesa Média - só mostra se houver despesas */}
    {estatisticas.despesas.quantidade > 0 && (
      <div className="ip_card_estatistica despesas">
        <div className="ip_icone_estatistica">📉</div>
        <div className="ip_conteudo_estatistica">
          <div className="ip_label_estatistica">Despesa Média</div>
          <div className="ip_valor_estatistica">
            {formatCurrency(estatisticas.despesas.total / estatisticas.despesas.quantidade)}
          </div>
          <div className="ip_contador_estatistica">
            por transação
          </div>
        </div>
      </div>
    )}

    {/* Período */}
    <div className="ip_card_pequeno ip_p_3" style={{ 
      backgroundColor: 'var(--ip-cinza-50)', 
      border: '1px solid var(--ip-cinza-200)',
      marginTop: '8px'
    }}>
      <div className="ip_flex ip_gap_2 ip_mb_2" style={{ alignItems: 'center' }}>
        <span style={{ fontSize: '14px' }}>📅</span>
        <span style={{ 
          fontSize: '13px', 
          fontWeight: '600', 
          color: 'var(--ip-cinza-700)' 
        }}>
          Período Analisado
        </span>
      </div>
      
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '500',
        color: 'var(--ip-cinza-900)',
        textAlign: 'center'
      }}>
        {format(dataInicio, 'dd/MM')} - {format(dataFim, 'dd/MM/yyyy')}
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: 'var(--ip-cinza-500)',
        textAlign: 'center',
        marginTop: '4px'
      }}>
        {format(dataInicio, 'MMMM \'de\' yyyy', { locale: ptBR })}
      </div>
    </div>

    {/* Status dos Filtros - só mostra se houver filtros ativos */}
    {hasActiveFilters && (
      <div className="ip_card_pequeno ip_p_3" style={{ 
        backgroundColor: '#eff6ff', 
        border: '1px solid #93c5fd',
        marginTop: '4px'
      }}>
        <div className="ip_flex ip_gap_2 ip_mb_2" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>🔍</span>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#2563eb' 
          }}>
            Filtros Ativos
          </span>
        </div>
        
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '500',
          color: '#2563eb',
          textAlign: 'center'
        }}>
          {filtrosAtivos} filtro{filtrosAtivos === 1 ? '' : 's'}
        </div>
        
        <div style={{ 
          fontSize: '11px', 
          color: '#1e40af',
          textAlign: 'center',
          marginTop: '4px'
        }}>
          {groupByCard && 'Agrupado por cartão'}
        </div>
      </div>
    )}

    {/* Informação sobre agrupamento por cartão */}
    {groupByCard && (
      <div className="ip_card_pequeno ip_p_3" style={{ 
        backgroundColor: '#f3e8ff', 
        border: '1px solid #c084fc',
        marginTop: '4px'
      }}>
        <div className="ip_flex ip_gap_2 ip_mb_2" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>💳</span>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#7c3aed' 
          }}>
            Modo Agrupado
          </span>
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          color: '#6b21a8',
          textAlign: 'center',
          lineHeight: '1.3'
        }}>
          Despesas de cartão agrupadas por fatura
        </div>
      </div>
    )}
  </div>
</div>  </aside>
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
