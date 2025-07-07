// src/modules/transacoes/components/UnifiedTransactionModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// ===== ÍCONES =====
import { 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  ArrowRightLeft,
  Plus,
  X,
  Calendar,
  FileText,
  Tag,
  DollarSign,
  Building,
  Star,
  Repeat,
  CheckCircle,
  Clock,
  Hash,
  AlertCircle,
  Search, 
  ChevronUp, 
  ChevronDown
} from 'lucide-react';

// ===== STORES E HOOKS =====
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { useTransactions } from '../store/transactionsStore';

// ===== HOOKS DE DADOS =====
import useContas from '@modules/contas/hooks/useContas';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import { useCartoesData } from '@modules/cartoes/hooks/useCartoesData';
import { useFaturaOperations } from '@modules/cartoes/hooks/useFaturaOperations';
import useTransferencias from '@modules/transacoes/hooks/useTransferencias';

// ===== UTILITÁRIOS E COMPONENTES =====
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import InputMoney from '@shared/components/ui/InputMoney';

// ===== ESTILOS =====
import '@modules/transacoes/styles/UnifiedTransactionModal.css';



/**
 * MODAL UNIFICADO DE TRANSAÇÕES - ESTRATÉGIA HÍBRIDA INTELIGENTE
 * 
 * Este componente unifica os 4 modais existentes:
 * - ReceitasModal (receitas extras, mensais e parceladas)
 * - DespesasModal (despesas extras, fixas e parceladas)
 * - DespesasCartaoModal (compras no cartão à vista e parceladas)
 * - TransferenciasModal (transferências entre contas)
 * 
 * CARACTERÍSTICAS:
 * - Estado unificado inteligente
 * - Renderização condicional por tipo
 * - Validações específicas por contexto
 * - Auto-detecção de tipo na edição
 * - Preview dinâmico no header
 */

// ===== FUNÇÃO AUXILIAR: DEBOUNCE =====
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ===== COMPONENTE PRINCIPAL =====
const UnifiedTransactionModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  transacaoEditando = null,
  tipoInicial = 'receita' // receita|despesa|cartao|transferencia
}) => {
  
  // ===== HOOKS DE DADOS =====
  const { contas = [], loading: loadingContas } = useContas() || {};
  const { categorias = [], subcategorias = [], loading: loadingCategorias } = useCategorias() || {};
  const { fetchCartoes, calcularFaturaVencimento, loading: loadingCartoes } = useCartoesData() || {};
  const { buscarOpcoesFatura } = useFaturaOperations() || {};
  const { validarTransferencia, realizarTransferencia, loading: loadingTransferencia } = useTransferencias() || {};
  const { addTransacao, updateGrupoValor, isParceladaOuRecorrente } = useTransactions();
  
  // ===== HOOKS DE ESTADO =====
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ===== FUNÇÃO SEGURA PARA GRUPOS =====
  const isParceladaOuRecorrenteSafe = isParceladaOuRecorrente || (() => ({ 
    isParcelada: false, 
    isRecorrente: false 
  }));

  // ===== ESTADO LOCAL: CARTÕES =====
  const [cartoes, setCartoes] = useState([]);

  // ===== ESTADO PRINCIPAL: DADOS DA TRANSAÇÃO =====
  const [transactionData, setTransactionData] = useState({
    // Meta-dados do contexto
    tipo: tipoInicial,                          // receita|despesa|cartao|transferencia
    subtipo: 'extra',                          // extra|previsivel|parcelada (só para receita/despesa)
    modoEdicao: Boolean(transacaoEditando),    // true se editando transação existente
    transacaoOriginal: transacaoEditando,      // dados originais para comparação
    
    // Dados universais (presentes em todos os tipos)
    valor: '',                                 // valor formatado ou expressão matemática
    data: new Date().toISOString().split('T')[0], // data no formato YYYY-MM-DD
    descricao: '',                             // descrição da transação
    observacoes: '',                           // observações adicionais (não usado mais)
    efetivado: true,                           // se já foi efetivado ou está planejado
    categoria_id: '',                          // ID da categoria selecionada
    categoria_texto: '',                       // texto digitado para categoria
    subcategoria_id: '',                       // ID da subcategoria selecionada
    subcategoria_texto: '',                    // texto digitado para subcategoria
    
    // Campos condicionais (null quando não aplicável ao tipo)
    conta_id: null,                            // conta para receita/despesa
    cartao_id: null,                           // cartão para compras
    conta_origem_id: null,                     // conta origem para transferência
    conta_destino_id: null,                    // conta destino para transferência
    fatura_vencimento: null,                   // data de vencimento da fatura do cartão
    
    // Configurações de recorrência/parcelamento
    numero_parcelas: 1,                       // quantidade de parcelas ou recorrências
    frequencia: 'mensal',                      // frequência (semanal|quinzenal|mensal|anual)
  });

  // ===== ESTADOS DE UI =====
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  
  // Estados específicos por tipo
  const [opcoesFatura, setOpcoesFatura] = useState([]);                    // opções de fatura para cartão
  const [validacaoTransferencia, setValidacaoTransferencia] = useState(null); // validação em tempo real para transferência
  const [escopoEdicao, setEscopoEdicao] = useState('atual');               // escopo de edição para grupos
  const [subcategoriasLocais, setSubcategoriasLocais] = useState([]);      // subcategorias carregadas dinamicamente
  
  // Estado para criação de categoria/subcategoria
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
    nome: '',
    categoriaId: ''
  });

  // ===== FUNÇÃO: CARREGAR SUBCATEGORIAS POR CATEGORIA =====
  const getSubcategoriasPorCategoria = useCallback(async (categoriaId) => {
    if (!categoriaId || !user?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('categoria_id', categoriaId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      
      // Atualizar estado local para uso imediato
      setSubcategoriasLocais(data || []);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao carregar subcategorias:', error);
      return [];
    }
  }, [user?.id]);

  // ===== CONFIGURAÇÕES: TIPOS DE TRANSAÇÃO =====
  const tiposTransacao = [
    {
      id: 'receita',
      nome: 'Receita',
      icone: <TrendingUp size={18} />,
      cor: '#10b981',
      corHeader: 'receita-header',
      emoji: '💰',
      descricao: 'Entrada de dinheiro'
    },
    {
      id: 'despesa',
      nome: 'Despesa',
      icone: <TrendingDown size={18} />,
      cor: '#ef4444',
      corHeader: 'despesa-header',
      emoji: '💸',
      descricao: 'Saída de dinheiro'
    },
    {
      id: 'cartao',
      nome: 'Despesa de cartão',
      icone: <CreditCard size={18} />,
      cor: '#8b5cf6',
      corHeader: 'cartao-header',
      emoji: '💳',
      descricao: 'Compra no cartão'
    },
    {
      id: 'transferencia',
      nome: 'Transferência',
      icone: <ArrowRightLeft size={18} />,
      cor: '#3b82f6',
      corHeader: 'transferencia-header',
      emoji: '🔄',
      descricao: 'Entre contas'
    }
  ];

  // ===== CONFIGURAÇÕES: SUBTIPOS DE RECEITA =====
  const subtiposReceita = [
    {
      id: 'extra',
      nome: 'Extra',
      icone: <Star size={16} />,
      descricao: 'Valor único',
      exemplo: ' bônus, 13º'
    },
    {
      id: 'previsivel',
      nome: 'Recorrente',
      icone: <Repeat size={16} />,
      descricao: 'Repetem automaticamente',
      exemplo: ' salário'
    },
    {
      id: 'parcelada',
      nome: 'Parcelada',
      icone: <Calendar size={16} />,
      descricao: 'Em parcelas',
      exemplo: ' freelance'
    }
  ];

  // ===== CONFIGURAÇÕES: SUBTIPOS DE DESPESA =====
  const subtiposDespesa = [
    {
      id: 'extra',
      nome: 'Extra',
      icone: <Star size={16} />,
      descricao: 'Valor único',
      exemplo: 'compra'
    },
    {
      id: 'previsivel',
      nome: 'Recorrente',
      icone: <Repeat size={16} />,
      descricao: 'Todo mês',
      exemplo: 'aluguel'
    },
    {
      id: 'parcelada',
      nome: 'Parcelada',
      icone: <Calendar size={16} />,
      descricao: 'Em parcelas',
      exemplo: 'móvel'
    }
  ];

  // ===== COMPUTED VALUES =====
  
  // Tipo atual selecionado
  const tipoAtual = useMemo(() => 
    tiposTransacao.find(t => t.id === transactionData.tipo), 
    [transactionData.tipo]
  );

  // Subtipos disponíveis baseado no tipo atual
  const subtiposDisponiveis = useMemo(() => {
    if (transactionData.tipo === 'receita') return subtiposReceita;
    if (transactionData.tipo === 'despesa') return subtiposDespesa;
    return [];
  }, [transactionData.tipo]);

  // Se deve mostrar seletor de subtipos
  const mostrarSubtipos = useMemo(() => 
    transactionData.tipo === 'receita' || transactionData.tipo === 'despesa',
    [transactionData.tipo]
  );

  // Se deve mostrar toggle de status (efetivado/planejado)
  const mostrarStatus = useMemo(() => 
    transactionData.tipo !== 'transferencia' && transactionData.tipo !== 'cartao',
    [transactionData.tipo]
  );

  // ===== PREVIEW DINÂMICO DO HEADER =====
  const headerPreview = useMemo(() => {
    const { valor, descricao, tipo, subtipo } = transactionData;
    
    if (!valor && !descricao) return 'Preencha os dados';
    
    let preview = '';
    const valorFormatado = valor ? `R$ ${valor}` : '';
    
    switch(tipo) {
      case 'receita':
        if (subtipo === 'previsivel') {
          preview = `Receita mensal`;
        } else if (subtipo === 'parcelada') {
          preview = `Receita parcelada`;
        } else {
          preview = `Receita extra`;
        }
        if (valorFormatado) preview += ` de ${valorFormatado}`;
        break;
        
      case 'despesa':
        if (subtipo === 'previsivel') {
          preview = `Despesa fixa`;
        } else if (subtipo === 'parcelada') {
          preview = `Despesa parcelada`;
        } else {
          preview = `Despesa extra`;
        }
        if (valorFormatado) preview += ` de ${valorFormatado}`;
        break;
        
      case 'cartao':
        preview = `Compra no cartão`;
        if (valorFormatado) preview += ` de ${valorFormatado}`;
        break;
        
      case 'transferencia':
        preview = `Transferência`;
        if (valorFormatado) preview += ` de ${valorFormatado}`;
        break;
    }
    
    if (descricao) {
      preview += ` - ${descricao.substring(0, 20)}${descricao.length > 20 ? '...' : ''}`;
    }
    
    return preview;
  }, [transactionData]);

  // ===== CATEGORIAS FILTRADAS =====
  const categoriasFiltradas = useMemo(() => {
    if (!categorias || categorias.length === 0) return [];
    
    // Determinar tipo de categoria baseado no tipo de transação
    const tipoCategoria = transactionData.tipo === 'cartao' ? 'despesa' : transactionData.tipo;
    const categoriasDoTipo = categorias.filter(cat => 
      cat && cat.tipo === tipoCategoria && cat.ativo
    );
    
    // Se não há texto de filtro, retornar todas do tipo
    if (!transactionData.categoria_texto) return categoriasDoTipo;
    
    // Filtrar por texto digitado
    return categoriasDoTipo.filter(cat => 
      cat.nome && cat.nome.toLowerCase().includes(transactionData.categoria_texto.toLowerCase())
    );
  }, [categorias, transactionData.categoria_texto, transactionData.tipo]);

  // ===== SUBCATEGORIAS FILTRADAS =====
  const subcategoriasFiltradas = useMemo(() => {
    if (!transactionData.categoria_id) return [];
    
    // Usar subcategorias carregadas dinamicamente ou as globais como fallback
    const subcategoriasParaUsar = subcategoriasLocais.length > 0 ? subcategoriasLocais : subcategorias;
    
    if (!subcategoriasParaUsar || subcategoriasParaUsar.length === 0) return [];
    
    // Filtrar por categoria selecionada
    const subcategoriasDoTipo = subcategoriasParaUsar.filter(sub => 
      sub && sub.categoria_id === transactionData.categoria_id && sub.ativo
    );
    
    // Se não há texto de filtro, retornar todas da categoria
    if (!transactionData.subcategoria_texto) return subcategoriasDoTipo;
    
    // Filtrar por texto digitado
    return subcategoriasDoTipo.filter(sub => 
      sub.nome && sub.nome.toLowerCase().includes(transactionData.subcategoria_texto.toLowerCase())
    );
  }, [subcategoriasLocais, subcategorias, transactionData.categoria_id, transactionData.subcategoria_texto]);

  // ===== HANDLERS: MUDANÇA DE TIPO =====
  const handleTipoChange = useCallback((novoTipo) => {
    setTransactionData(prev => ({
      ...prev,
      tipo: novoTipo,
      subtipo: 'extra', // Reset subtipo
      
      // Resetar categoria e subcategoria sempre que mudar tipo
      categoria_id: '',
      categoria_texto: '',
      subcategoria_id: '',
      subcategoria_texto: '',
      
      // Limpar campos específicos baseado no novo tipo
      conta_id: (novoTipo === 'receita' || novoTipo === 'despesa') ? prev.conta_id : null,
      cartao_id: novoTipo === 'cartao' ? prev.cartao_id : null,
      conta_origem_id: novoTipo === 'transferencia' ? prev.conta_origem_id : null,
      conta_destino_id: novoTipo === 'transferencia' ? prev.conta_destino_id : null,
      fatura_vencimento: novoTipo === 'cartao' ? prev.fatura_vencimento : null
    }));
    
    // Limpar subcategorias locais também
    setSubcategoriasLocais([]);
    
    // Limpar erros relacionados a campos que mudaram
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.conta_id;
      delete newErrors.cartao_id;
      delete newErrors.conta_origem_id;
      delete newErrors.conta_destino_id;
      delete newErrors.categoria_id;
      delete newErrors.subcategoria_id;
      return newErrors;
    });
  }, []);

  // ===== HANDLERS: MUDANÇA DE SUBTIPO =====
  const handleSubtipoChange = useCallback((novoSubtipo) => {
    setTransactionData(prev => ({
      ...prev,
      subtipo: novoSubtipo
    }));
  }, []);

  // ===== HANDLERS: MUDANÇA DE INPUT GENÉRICO =====
  const handleInputChange = useCallback((field, value) => {
    setTransactionData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo específico se existir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);
  
  // ===== HANDLERS: CANCELAR E FECHAR MODAL =====
  const handleCancelar = useCallback(() => {
    // Reset completo do estado
    setTransactionData({
      tipo: tipoInicial,
      subtipo: 'extra',
      modoEdicao: false,
      transacaoOriginal: null,
      valor: '',
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      observacoes: '',
      efetivado: true,
      categoria_id: '',
      categoria_texto: '',
      subcategoria_id: '',
      subcategoria_texto: '',
      conta_id: null,
      cartao_id: null,
      conta_origem_id: null,
      conta_destino_id: null,
      fatura_vencimento: null,
      numero_parcelas: 1,
      frequencia: 'mensal',
      total_recorrencias: 12
    });
    
    // Limpar estados auxiliares
    setErrors({});
    setValidacaoTransferencia(null);
    setOpcoesFatura([]);
    setSubcategoriasLocais([]);
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
    
    onClose();
  }, [tipoInicial, onClose]);

  // ===== HANDLERS: MUDANÇA DE VALOR =====
  const handleValorChange = useCallback((valorRecebido) => {
    handleInputChange('valor', valorRecebido);
  }, [handleInputChange]);

  // ===== HANDLERS PARA CATEGORIA =====
const handleCategoriaChange = useCallback((e) => {
  const { value } = e.target;
  handleInputChange('categoria_texto', value);
  handleInputChange('categoria_id', '');
  handleInputChange('subcategoria_id', '');
  handleInputChange('subcategoria_texto', '');
  setCategoriaDropdownOpen(true);
}, [handleInputChange]);

const handleSelecionarCategoria = useCallback(async (categoria) => {
  handleInputChange('categoria_id', categoria.id);
  handleInputChange('categoria_texto', categoria.nome);
  handleInputChange('subcategoria_id', '');
  handleInputChange('subcategoria_texto', '');
  setCategoriaDropdownOpen(false);
  
  // Carregar subcategorias da categoria selecionada
  try {
    const subcategoriasCarregadas = await getSubcategoriasPorCategoria(categoria.id);
    console.log('🔄 Subcategorias carregadas:', subcategoriasCarregadas.length);
  } catch (error) {
    console.error('❌ Erro ao carregar subcategorias:', error);
  }
}, [handleInputChange, getSubcategoriasPorCategoria]);

const handleCategoriaBlur = useCallback(() => {
  const timer = setTimeout(() => {
    setCategoriaDropdownOpen(false);
    
    // Verificar se precisa criar categoria
    if (transactionData.categoria_texto && !transactionData.categoria_id) {
      const existe = categorias.find(cat => 
        cat.nome.toLowerCase() === transactionData.categoria_texto.toLowerCase()
      );
      if (!existe) {
        setConfirmacao({
          show: true,
          type: 'categoria',
          nome: transactionData.categoria_texto,
          categoriaId: ''
        });
      }
    }
  }, 200);
  return () => clearTimeout(timer);
}, [transactionData.categoria_texto, transactionData.categoria_id, categorias]);

// ===== HANDLERS PARA SUBCATEGORIA =====
const handleSubcategoriaChange = useCallback((e) => {
  const { value } = e.target;
  handleInputChange('subcategoria_texto', value);
  handleInputChange('subcategoria_id', '');
  if (transactionData.categoria_id) {
    setSubcategoriaDropdownOpen(true);
  }
}, [handleInputChange, transactionData.categoria_id]);

const handleSelecionarSubcategoria = useCallback((subcategoria) => {
  handleInputChange('subcategoria_id', subcategoria.id);
  handleInputChange('subcategoria_texto', subcategoria.nome);
  setSubcategoriaDropdownOpen(false);
}, [handleInputChange]);

const handleSubcategoriaBlur = useCallback(() => {
  const timer = setTimeout(() => {
    setSubcategoriaDropdownOpen(false);
    
    // Verificar se precisa criar subcategoria
    if (transactionData.subcategoria_texto && !transactionData.subcategoria_id && transactionData.categoria_id) {
      const existe = subcategoriasFiltradas.find(sub => 
        sub.nome.toLowerCase() === transactionData.subcategoria_texto.toLowerCase()
      );
      if (!existe) {
        setConfirmacao({
          show: true,
          type: 'subcategoria',
          nome: transactionData.subcategoria_texto,
          categoriaId: transactionData.categoria_id
        });
      }
    }
  }, 200);
  return () => clearTimeout(timer);
}, [transactionData.subcategoria_texto, transactionData.subcategoria_id, transactionData.categoria_id, subcategoriasFiltradas]);

// ===== HANDLERS PARA CARTÃO =====
const calcularFaturaAutomatica = useCallback(async (cartaoId, dataCompra) => {
  if (!cartaoId || !dataCompra || !calcularFaturaVencimento) return;
  
  try {
    console.log('🎯 Calculando fatura para:', { cartaoId, dataCompra });
    
    const faturaCalculada = await calcularFaturaVencimento(cartaoId, dataCompra);
    
    if (faturaCalculada?.data_vencimento) {
      console.log('✅ Fatura calculada:', faturaCalculada.data_vencimento);
      handleInputChange('fatura_vencimento', faturaCalculada.data_vencimento);
    }
  } catch (error) {
    console.error('❌ Erro ao calcular fatura:', error);
  }
}, [calcularFaturaVencimento, handleInputChange]);

const gerarOpcoesFatura = useCallback(async (cartaoId, dataCompra) => {
  if (!cartaoId || !dataCompra || !calcularFaturaVencimento) return [];
  
  try {
    // Calcular fatura padrão
    const faturaCalculada = await calcularFaturaVencimento(cartaoId, dataCompra);
    if (!faturaCalculada?.data_vencimento) return [];
    
    const dataVencimentoPadrao = new Date(faturaCalculada.data_vencimento);
    const opcoes = [];
    
    // Gerar 7 opções: 3 antes + calculada + 3 depois
    for (let i = -3; i <= 3; i++) {
      const dataOpcao = new Date(dataVencimentoPadrao);
      dataOpcao.setMonth(dataOpcao.getMonth() + i);
      
      const valorOpcao = dataOpcao.toISOString().split('T')[0];
      const mesNome = dataOpcao.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      const dataFormatada = dataOpcao.toLocaleDateString('pt-BR');
      
      opcoes.push({
        valor_opcao: valorOpcao,
        label_opcao: `${mesNome} - Venc: ${dataFormatada}`,
        is_default: i === 0, // A calculada é a padrão
        mes_referencia: mesNome
      });
    }
    
    console.log('📅 Opções de fatura geradas:', opcoes);
    return opcoes;
    
  } catch (error) {
    console.error('❌ Erro ao gerar opções de fatura:', error);
    return [];
  }
}, [calcularFaturaVencimento]);

const handleCartaoChange = useCallback(async (cartaoId) => {
  handleInputChange('cartao_id', cartaoId);
  
  if (cartaoId && transactionData.data) {
    try {
      // Gerar opções de fatura
      const opcoes = await gerarOpcoesFatura(cartaoId, transactionData.data);
      setOpcoesFatura(opcoes);
      
      // Selecionar opção padrão (calculada)
      const opcaoPadrao = opcoes.find(opcao => opcao.is_default);
      if (opcaoPadrao) {
        handleInputChange('fatura_vencimento', opcaoPadrao.valor_opcao);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar opções de fatura:', error);
    }
  }
}, [handleInputChange, transactionData.data, gerarOpcoesFatura]);

// ===== HANDLERS PARA CRIAR CATEGORIA/SUBCATEGORIA =====
const handleConfirmarCriacao = useCallback(async () => {
  try {
    if (confirmacao.type === 'categoria') {
      const tipoCategoria = transactionData.tipo === 'cartao' ? 'despesa' : transactionData.tipo;
      const corCategoria = tipoCategoria === 'receita' ? '#10b981' : '#ef4444';
      
      const { data, error } = await supabase
        .from('categorias')
        .insert([{
          nome: confirmacao.nome,
          tipo: tipoCategoria,
          cor: corCategoria,
          usuario_id: user.id,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Atualizar estado
      handleInputChange('categoria_id', data.id);
      handleInputChange('categoria_texto', data.nome);
      
      showNotification(`Categoria "${confirmacao.nome}" criada com sucesso!`, 'success');
      
    } else if (confirmacao.type === 'subcategoria') {
      const { data, error } = await supabase
        .from('subcategorias')
        .insert([{
          nome: confirmacao.nome,
          categoria_id: confirmacao.categoriaId,
          usuario_id: user.id,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Atualizar estado
      handleInputChange('subcategoria_id', data.id);
      handleInputChange('subcategoria_texto', data.nome);
      
      showNotification(`Subcategoria "${confirmacao.nome}" criada com sucesso!`, 'success');
    }
  } catch (error) {
    console.error('❌ Erro ao criar categoria/subcategoria:', error);
    showNotification('Erro inesperado. Tente novamente.', 'error');
  }
  
  // Fechar modal de confirmação
  setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
}, [confirmacao, transactionData.tipo, user.id, handleInputChange, showNotification]);

// ===== HANDLERS PARA TRANSFERÊNCIA =====
const handleContaOrigemChange = useCallback((contaId) => {
  handleInputChange('conta_origem_id', contaId);
  validarTransferenciaSeCompleta(contaId, transactionData.conta_destino_id, transactionData.valor);
}, [handleInputChange, transactionData.conta_destino_id, transactionData.valor]);

const handleContaDestinoChange = useCallback((contaId) => {
  handleInputChange('conta_destino_id', contaId);
  validarTransferenciaSeCompleta(transactionData.conta_origem_id, contaId, transactionData.valor);
}, [handleInputChange, transactionData.conta_origem_id, transactionData.valor]);

const validarTransferenciaSeCompleta = useCallback(
  debounce(async (origem, destino, valor) => {
    if (!origem || !destino || !valor) {
      setValidacaoTransferencia(null);
      return;
    }
    
    try {
      const validacao = await validarTransferencia({
        contaOrigemId: origem,
        contaDestinoId: destino,
        valor: valor
      });
      setValidacaoTransferencia(validacao);
    } catch (error) {
      console.error('Erro na validação:', error);
      setValidacaoTransferencia({ valida: false, erro: 'Erro na validação' });
    }
  }, 500),
  [validarTransferencia]
);

const handleInverterContas = useCallback(() => {
  if (!transactionData.conta_origem_id || !transactionData.conta_destino_id) return;
  
  const origem = transactionData.conta_origem_id;
  const destino = transactionData.conta_destino_id;
  
  handleInputChange('conta_origem_id', destino);
  handleInputChange('conta_destino_id', origem);
  
  // Revalidar transferência com contas invertidas
  validarTransferenciaSeCompleta(destino, origem, transactionData.valor);
}, [transactionData.conta_origem_id, transactionData.conta_destino_id, transactionData.valor, handleInputChange, validarTransferenciaSeCompleta]);

// ===== RENDERIZAÇÃO CONDICIONAL DE CAMPOS =====
const renderFormFields = () => {
  // Mostrar loading se ainda carregando dados essenciais
  if (loadingContas || loadingCategorias || loadingCartoes) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Carregando dados...</p>
      </div>
    );
  }

 switch(transactionData.tipo) {
    case 'receita':
    case 'despesa':
      return renderReceitaDespesaFields();
    case 'cartao':
      return renderCartaoFields();
    case 'transferencia':
      return renderTransferenciaFields();
    default:
      return null;
  }
};

// ===== RENDER CAMPOS RECEITA/DESPESA =====
const renderReceitaDespesaFields = () => (
  <div className="form-fields-receita-despesa">
    {/* Categoria e Subcategoria em linha */}
    <div style={{display: 'flex', gap: '16px', width: '100%'}}>
      {/* Categoria com autocomplete */}
      <div className="form-group" style={{flex: 1, width: '50%'}}>
        <label className="form-label">
          <Tag size={14} />
          Categoria *
        </label>
        <div className="dropdown-container">
          <div style={{position: 'relative'}}>
            <input
              type="text"
              value={transactionData.categoria_texto}
              onChange={handleCategoriaChange}
              onBlur={handleCategoriaBlur}
              onFocus={() => setCategoriaDropdownOpen(true)}
              placeholder="Digite ou selecione uma categoria"
              disabled={loading}
              autoComplete="off"
              className={`input-text input-with-icon ${!transactionData.categoria_id ? 'input-muted' : ''} ${errors.categoria_id ? 'error' : ''}`}
            />
            <Search size={14} className="input-search-icon" />
          </div>
          
          {categoriaDropdownOpen && categoriasFiltradas && categoriasFiltradas.length > 0 && (
            <div className="dropdown-options">
              {categoriasFiltradas.map(categoria => (
                <div
                  key={categoria.id}
                  onMouseDown={() => handleSelecionarCategoria(categoria)}
                  className="dropdown-option"
                >
                  <div 
                    className="category-color-tag"
                    style={{backgroundColor: categoria.cor || '#10b981'}}
                  ></div>
                  {categoria.nome}
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.categoria_id && <div className="form-error">{errors.categoria_id}</div>}
      </div>

      {/* Subcategoria */}
      <div className="form-group" style={{flex: 1, width: '50%'}}>
        <label className="form-label">
          <Tag size={14} />
          Subcategoria
        </label>
        <div className="dropdown-container">
          <input
            type="text"
            value={transactionData.subcategoria_texto}
            onChange={handleSubcategoriaChange}
            onBlur={handleSubcategoriaBlur}
            onFocus={() => setSubcategoriaDropdownOpen(true)}
            placeholder="Digite ou selecione uma subcategoria"
            disabled={loading || !transactionData.categoria_id}
            autoComplete="off"
            className="input-text"
          />
          
          {subcategoriaDropdownOpen && subcategoriasFiltradas && subcategoriasFiltradas.length > 0 && (
            <div className="dropdown-options">
              {subcategoriasFiltradas.map(subcategoria => (
                <div
                  key={subcategoria.id}
                  onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                  className="dropdown-option"
                >
                  <div 
                    className="category-color-tag"
                    style={{backgroundColor: categoriasFiltradas?.find(cat => cat.id === transactionData.categoria_id)?.cor || '#10b981'}}
                  ></div>
                  {subcategoria.nome}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Conta */}
    <div className="form-group">
      <label className="form-label">
        <Building size={14} />
        {transactionData.tipo === 'receita' ? 'Conta Destino' : 'Conta Débito'} *
      </label>
      <select
        className={`input-select ${errors.conta_id ? 'error' : ''}`}
        value={transactionData.conta_id || ''}
        onChange={(e) => handleInputChange('conta_id', e.target.value)}
        disabled={loading}
      >
        <option value="">Selecione uma conta</option>
        {contas.filter(conta => conta.ativo).map(conta => (
          <option key={conta.id} value={conta.id}>
            {conta.nome} - {formatCurrency(conta.saldo || 0)}
          </option>
        ))}
      </select>
      {errors.conta_id && <div className="form-error">{errors.conta_id}</div>}
    </div>

        {/* Campos de Recorrência */}
        {transactionData.subtipo === 'previsivel' && (
          <div className="recurrence-fields">
            <div className="flex gap-3 row">
              <div className="form-group">
                <label className="form-label">
                  <Repeat size={14} />
                  Frequência
                </label>
                <select
                  className="input-select"
                  value={transactionData.frequencia}
                  onChange={(e) => handleInputChange('frequencia', e.target.value)}
                  disabled={loading}
                >
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              
              {/* Info sobre recorrência automática */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#6b7280' }}>
                  <Calendar size={14} />
                  Duração
                </label>
                <div className="recurrence-info">
                  <span className="recurrence-auto-text">
                    Criará automaticamente por 20 anos
                  </span>
                  <small className="recurrence-help-text">
                    Você pode cancelar ou editar quando quiser
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {transactionData.subtipo === 'parcelada' && (
          <div className="recurrence-fields">
            <div className="flex gap-3 row">
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} />
                  Parcelas
                </label>
                <div className="input-number-container">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={transactionData.numero_parcelas}
                    onChange={(e) => handleInputChange('numero_parcelas', parseInt(e.target.value) || 1)}
                    disabled={loading}
                    className="input-number"
                  />
                  <div className="input-number-controls">
                    <button
                      type="button"
                      onClick={() => handleInputChange('numero_parcelas', Math.min(60, transactionData.numero_parcelas + 1))}
                      disabled={loading || transactionData.numero_parcelas >= 60}
                      className="input-number-btn"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('numero_parcelas', Math.max(1, transactionData.numero_parcelas - 1))}
                      disabled={loading || transactionData.numero_parcelas <= 1}
                      className="input-number-btn"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <Repeat size={14} />
                  Frequência
                </label>
                <select
                  className="input-select"
                  value={transactionData.frequencia}
                  onChange={(e) => handleInputChange('frequencia', e.target.value)}
                  disabled={loading}
                >
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>
          </div>
        )}
  </div>
);

// ===== RENDER CAMPOS CARTÃO =====
const renderCartaoFields = () => (
  <div className="form-fields-cartao">
    <div className="flex gap-3 row">
      {/* Cartão */}
      <div className="form-group">
        <label className="form-label">
          <CreditCard size={14} />
          Cartão *
        </label>
        <select
          className={`input-select ${errors.cartao_id ? 'error' : ''}`}
          value={transactionData.cartao_id || ''}
          onChange={(e) => handleCartaoChange(e.target.value)}
          disabled={loading || loadingCartoes}
        >
          <option value="">
            {loadingCartoes ? 'Carregando cartões...' : 'Selecione um cartão'}
          </option>
          {cartoes && cartoes.length > 0 && cartoes
            .filter(cartao => cartao && cartao.ativo)
            .map(cartao => (
              <option key={cartao.id} value={cartao.id}>
                {cartao.nome} - Limite: {formatCurrency(cartao.limite || 0)}
              </option>
            ))
          }
        </select>
        {errors.cartao_id && <div className="form-error">{errors.cartao_id}</div>}
        
        {cartoes && cartoes.length === 0 && !loadingCartoes && (
          <div className="form-info">
            Nenhum cartão encontrado. Cadastre um cartão primeiro.
          </div>
        )}
      </div>
      
      {/* Parcelas */}
      <div className="form-group">
        <label className="form-label">
          <Hash size={14} />
          Parcelas
        </label>
        <select
          className="input-select"
          value={transactionData.numero_parcelas}
          onChange={(e) => handleInputChange('numero_parcelas', parseInt(e.target.value))}
          disabled={loading}
        >
          <option value={1}>1x à vista</option>
          {Array.from({length: 23}, (_, i) => i + 2).map(num => (
            <option key={num} value={num}>{num}x</option>
          ))}
        </select>
      </div>
    </div>

{/* Categoria e Subcategoria em linha para cartão */}
    <div style={{display: 'flex', gap: '16px', width: '100%'}}>
      {/* Categoria com autocomplete */}
      <div className="form-group" style={{flex: 1, width: '50%'}}>
        <label className="form-label">
          <Tag size={14} />
          Categoria *
        </label>
        <div className="dropdown-container">
          <div style={{position: 'relative'}}>
            <input
              type="text"
              value={transactionData.categoria_texto}
              onChange={handleCategoriaChange}
              onBlur={handleCategoriaBlur}
              onFocus={() => setCategoriaDropdownOpen(true)}
              placeholder="Digite ou selecione uma categoria"
              disabled={loading}
              autoComplete="off"
              className={`input-text input-with-icon ${!transactionData.categoria_id ? 'input-muted' : ''} ${errors.categoria_id ? 'error' : ''}`}
            />
            <Search size={14} className="input-search-icon" />
          </div>
          
          {categoriaDropdownOpen && categoriasFiltradas && categoriasFiltradas.length > 0 && (
            <div className="dropdown-options">
              {categoriasFiltradas.map(categoria => (
                <div
                  key={categoria.id}
                  onMouseDown={() => handleSelecionarCategoria(categoria)}
                  className="dropdown-option"
                >
                  <div 
                    className="category-color-tag"
                    style={{backgroundColor: categoria.cor || '#ef4444'}}
                  ></div>
                  {categoria.nome}
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.categoria_id && <div className="form-error">{errors.categoria_id}</div>}
      </div>

      {/* Subcategoria */}
      <div className="form-group" style={{flex: 1, width: '50%'}}>
        <label className="form-label">
          <Tag size={14} />
          Subcategoria
        </label>
        <div className="dropdown-container">
          <input
            type="text"
            value={transactionData.subcategoria_texto}
            onChange={handleSubcategoriaChange}
            onBlur={handleSubcategoriaBlur}
            onFocus={() => setSubcategoriaDropdownOpen(true)}
            placeholder="Digite ou selecione uma subcategoria"
            disabled={loading || !transactionData.categoria_id}
            autoComplete="off"
            className="input-text"
          />
          
          {subcategoriaDropdownOpen && subcategoriasFiltradas && subcategoriasFiltradas.length > 0 && (
            <div className="dropdown-options">
              {subcategoriasFiltradas.map(subcategoria => (
                <div
                  key={subcategoria.id}
                  onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                  className="dropdown-option"
                >
                  <div 
                    className="category-color-tag"
                    style={{backgroundColor: categoriasFiltradas?.find(cat => cat.id === transactionData.categoria_id)?.cor || '#ef4444'}}
                  ></div>
                  {subcategoria.nome}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Fatura de Vencimento */}
    {transactionData.cartao_id && opcoesFatura && opcoesFatura.length > 0 && (
      <div className="form-group">
        <label className="form-label">
          <Calendar size={14} />
          Fatura de Vencimento
        </label>
        <select
          className="input-select"
          value={transactionData.fatura_vencimento || ''}
          onChange={(e) => handleInputChange('fatura_vencimento', e.target.value)}
          disabled={loading}
        >
          {opcoesFatura.map(opcao => (
            <option key={opcao.valor_opcao} value={opcao.valor_opcao}>
              {opcao.label_opcao}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);

// ===== RENDER CAMPOS TRANSFERÊNCIA =====
const renderTransferenciaFields = () => (
  <div className="form-fields-transferencia">
    <div className="flex gap-3 row items-end">
      <div className="form-group">
        <label className="form-label">
          <Building size={14} />
          De (Origem) *
        </label>
        <select
          className={`input-select ${errors.conta_origem_id ? 'error' : ''}`}
          value={transactionData.conta_origem_id || ''}
          onChange={(e) => handleContaOrigemChange(e.target.value)}
          disabled={loading}
        >
          <option value="">Selecione origem</option>
          {contas.filter(conta => conta.ativo).map(conta => (
            <option key={conta.id} value={conta.id}>
              {conta.nome} - {formatCurrency(conta.saldo || 0)}
            </option>
          ))}
        </select>
        {errors.conta_origem_id && <div className="form-error">{errors.conta_origem_id}</div>}
      </div>

      {/* Botão de inverter */}
      <div className="form-group" style={{ minWidth: 'auto' }}>
        <button
          type="button"
          onClick={handleInverterContas}
          disabled={loading || !transactionData.conta_origem_id || !transactionData.conta_destino_id}
          className="btn-inverter-contas"
          title="Inverter contas"
        >
          <ArrowRightLeft size={16} />
        </button>
      </div>
      
      <div className="form-group">
        <label className="form-label">
          <Building size={14} />
          Para (Destino) *
        </label>
        <select
          className={`input-select ${errors.conta_destino_id ? 'error' : ''}`}
          value={transactionData.conta_destino_id || ''}
          onChange={(e) => handleContaDestinoChange(e.target.value)}
          disabled={loading}
        >
          <option value="">Selecione destino</option>
          {contas.filter(conta => conta.ativo && conta.id !== transactionData.conta_origem_id).map(conta => (
            <option key={conta.id} value={conta.id}>
              {conta.nome} - {formatCurrency(conta.saldo || 0)}
            </option>
          ))}
        </select>
        {errors.conta_destino_id && <div className="form-error">{errors.conta_destino_id}</div>}
      </div>
    </div>

    {/* Validação em tempo real */}
    {validacaoTransferencia && (
      <div className={`validation-info ${validacaoTransferencia.valida ? 'success' : 'warning'}`}>
        {validacaoTransferencia.valida ? (
          <span>✅ Transferência válida</span>
        ) : (
          <span>⚠️ {validacaoTransferencia.erro}</span>
        )}
      </div>
    )}
  </div>
);

// ===== VALIDAÇÃO DO FORMULÁRIO =====
const validateForm = useCallback(() => {
  const newErrors = {};
  
  // Validações universais
  if (!transactionData.valor || parseFloat(transactionData.valor.toString().replace(/\./g, '').replace(',', '.')) <= 0) {
    newErrors.valor = "Valor é obrigatório e deve ser maior que zero";
  }
  if (!transactionData.data) {
    newErrors.data = "Data é obrigatória";
  }

  
  // Validações específicas por tipo
  switch (transactionData.tipo) {
    case 'receita':
    case 'despesa':
      if (!transactionData.categoria_texto.trim()) {
        newErrors.categoria_id = "Categoria é obrigatória";
      }
      if (!transactionData.conta_id) {
        newErrors.conta_id = "Conta é obrigatória";
      }
      break;
      
    case 'cartao':
      if (!transactionData.cartao_id) {
        newErrors.cartao_id = "Cartão é obrigatório";
      }
      if (!transactionData.categoria_texto.trim()) {
        newErrors.categoria_id = "Categoria é obrigatória";
      }
      break;
      
    case 'transferencia':
      if (!transactionData.conta_origem_id) {
        newErrors.conta_origem_id = "Conta de origem é obrigatória";
      }
      if (!transactionData.conta_destino_id) {
        newErrors.conta_destino_id = "Conta de destino é obrigatória";
      }
      if (transactionData.conta_origem_id === transactionData.conta_destino_id) {
        newErrors.conta_destino_id = "Conta de destino deve ser diferente da origem";
      }
      break;
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}, [transactionData]);

// ===== CONVERSÃO DE VALOR =====
const getValorNumerico = useCallback(() => {
  const valorString = transactionData.valor.toString();
  
  // Se contém vírgula = valor já formatado (ex: "789,50")
  if (valorString.includes(',')) {
    const partes = valorString.split(',');
    const inteira = partes[0].replace(/\./g, '');
    const decimal = partes[1] || '00';
    const valorFinal = parseFloat(`${inteira}.${decimal}`);
    return isNaN(valorFinal) ? 0 : valorFinal;
  } 
  
  // Se não tem vírgula, tratar como valor direto
  // Se tem pontos = milhares (ex: "1.789" = 1789)
  // Se só números = valor direto (ex: "789" = 789)
  const apenasNumeros = valorString.replace(/\./g, '');
  const valorFinal = parseFloat(apenasNumeros);
  return isNaN(valorFinal) ? 0 : valorFinal;
}, [transactionData.valor]);

// ===== SALVAR TRANSFERÊNCIA =====
const salvarTransferencia = useCallback(async () => {
  if (!realizarTransferencia) {
    throw new Error('Função de transferência não está disponível');
  }
  
  const resultado = await realizarTransferencia({
    contaOrigemId: transactionData.conta_origem_id,
    contaDestinoId: transactionData.conta_destino_id,
    valor: getValorNumerico(),
    data: transactionData.data,
    descricao: transactionData.descricao.trim()
  });
  
  return {
    success: resultado.success,
    error: resultado.error,
    message: resultado.success ? 'Transferência realizada com sucesso!' : resultado.error
  };
}, [realizarTransferencia, transactionData, getValorNumerico]);

// ===== CRIAR RECEITA/DESPESA =====
const criarReceitaDespesa = useCallback(async () => {
  const valorNumerico = getValorNumerico();
  
  // Criar categoria se não existe
  let categoriaId = transactionData.categoria_id;
  if (!categoriaId && transactionData.categoria_texto.trim()) {
    try {
      const { data: novaCategoria, error } = await supabase
        .from('categorias')
        .insert([{
          nome: transactionData.categoria_texto.trim(),
          tipo: transactionData.tipo,
          cor: transactionData.tipo === 'receita' ? '#10b981' : '#ef4444',
          usuario_id: user.id,
          ativo: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      categoriaId = novaCategoria.id;
      console.log('✅ Categoria criada:', novaCategoria.nome);
    } catch (error) {
      throw new Error('Erro ao criar categoria: ' + error.message);
    }
  }
  
  const dadosBase = {
    usuario_id: user.id,
    descricao: transactionData.descricao.trim(),
    categoria_id: categoriaId,
    subcategoria_id: transactionData.subcategoria_id || null,
    conta_id: transactionData.conta_id,
    valor: valorNumerico,
    tipo: transactionData.tipo,
    observacoes: transactionData.observacoes.trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let transacoesCriadas = [];

  switch (transactionData.subtipo) {
    case 'extra':
      // Transação única
      transacoesCriadas = [{
        ...dadosBase,
        data: transactionData.data,
        efetivado: transactionData.efetivado,
        recorrente: false,
        grupo_recorrencia: null
      }];
      break;

    case 'parcelada':
    case 'previsivel':
      // Transações recorrentes
      const grupoId = crypto.randomUUID();
      const dataBase = new Date(transactionData.data);
      
      // Calcular total de recorrências baseado no subtipo
      const totalRecorrencias = transactionData.subtipo === 'previsivel' ? 
        (() => {
          switch (transactionData.frequencia) {
            case 'semanal': return 20 * 52;   // 20 anos, 52 semanas por ano
            case 'quinzenal': return 20 * 26; // 20 anos, 26 quinzenas por ano
            case 'mensal': return 20 * 12;    // 20 anos, 12 meses por ano
            case 'anual': return 20;          // 20 anos
            default: return 20 * 12;          // Default: 20 anos mensais
          }
        })() : 
        transactionData.numero_parcelas; // Para parceladas, usar o número definido pelo usuário
        
      const frequencia = transactionData.frequencia;

      for (let i = 0; i < totalRecorrencias; i++) {
        const dataTransacao = new Date(dataBase);
        
        // Calcular data baseada na frequência
        switch (frequencia) {
          case 'semanal':
            dataTransacao.setDate(dataTransacao.getDate() + (7 * i));
            break;
          case 'quinzenal':
            dataTransacao.setDate(dataTransacao.getDate() + (14 * i));
            break;
          case 'mensal':
            dataTransacao.setMonth(dataTransacao.getMonth() + i);
            break;
          case 'anual':
            dataTransacao.setFullYear(dataTransacao.getFullYear() + i);
            break;
        }
        
        // Primeira transação segue o status escolhido, demais ficam não efetivadas
        const efetivoStatus = i === 0 ? transactionData.efetivado : false;
        
        // Adicionar sufixo para parceladas
        const sufixo = transactionData.subtipo === 'parcelada' ? ` (${i + 1}/${totalRecorrencias})` : '';
        
        transacoesCriadas.push({
          ...dadosBase,
          data: dataTransacao.toISOString().split('T')[0],
          descricao: dadosBase.descricao + sufixo,
          efetivado: efetivoStatus,
          recorrente: true,
          grupo_recorrencia: transactionData.subtipo === 'previsivel' ? grupoId : null,
          grupo_parcelamento: transactionData.subtipo === 'parcelada' ? grupoId : null,
          parcela_atual: transactionData.subtipo === 'parcelada' ? i + 1 : null,
          total_parcelas: transactionData.subtipo === 'parcelada' ? totalRecorrencias : null,
          numero_recorrencia: transactionData.subtipo === 'previsivel' ? i + 1 : null,
          total_recorrencias: transactionData.subtipo === 'previsivel' ? totalRecorrencias : null
        });
      }
      break;
  }

  // Inserir todas as transações de uma vez
  const { error } = await supabase.from('transacoes').insert(transacoesCriadas);
  if (error) throw error;
  
  // Mensagem baseada no tipo
  let mensagem = '';
  switch (transactionData.subtipo) {
    case 'extra':
      mensagem = `${transactionData.tipo === 'receita' ? 'Receita' : 'Despesa'} extra registrada com sucesso!`;
      break;
    case 'parcelada':
      mensagem = `${transactionData.numero_parcelas} parcelas criadas com sucesso!`;
      break;
    case 'previsivel':
      mensagem = `${transactionData.tipo === 'receita' ? 'Receita' : 'Despesa'} recorrente configurada para o futuro!`;
      break;
  }
  
  return { success: true, message: mensagem };
}, [user.id, transactionData, getValorNumerico]);

// ===== CRIAR DESPESA DE CARTÃO =====
const criarDespesaCartao = useCallback(async () => {
  const valorNumerico = getValorNumerico();
  console.log('🔍 DEBUG criarDespesaCartao:', {
    valorNumerico,
    cartao_id: transactionData.cartao_id,
    categoria_id: transactionData.categoria_id,
    categoria_texto: transactionData.categoria_texto,
    descricao: transactionData.descricao,
    data: transactionData.data,
    fatura_vencimento: transactionData.fatura_vencimento
  });

  // Criar categoria se não existe
  let categoriaId = transactionData.categoria_id;
  if (!categoriaId && transactionData.categoria_texto.trim()) {
    try {
      const { data: novaCategoria, error } = await supabase
        .from('categorias')
        .insert([{
          nome: transactionData.categoria_texto.trim(),
          tipo: 'despesa',
          cor: '#ef4444',
          usuario_id: user.id,
          ativo: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      categoriaId = novaCategoria.id;
    } catch (error) {
      throw new Error('Erro ao criar categoria: ' + error.message);
    }
  }
const valorPorParcela = valorNumerico / transactionData.numero_parcelas;
  
  let transacoesCriadas = [];

  if (transactionData.numero_parcelas > 1) {
    // Criar parcelas
    const grupoParcelamento = crypto.randomUUID();
    
    for (let i = 1; i <= transactionData.numero_parcelas; i++) {
      // Calcular data de vencimento de cada parcela (próximos meses)
      const dataVencimento = new Date(transactionData.fatura_vencimento);
      dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));
      
      transacoesCriadas.push({
        usuario_id: user.id,
        cartao_id: transactionData.cartao_id,
        categoria_id: categoriaId,
        subcategoria_id: transactionData.subcategoria_id || null,
        descricao: `${transactionData.descricao.trim()} (${i}/${transactionData.numero_parcelas})`,
        valor: valorPorParcela, // Valor total (para cada parcela)
        data: transactionData.data,
        tipo: 'despesa',
        fatura_vencimento: dataVencimento.toISOString().split('T')[0],
        // Campos de parcelamento
        numero_parcelas: transactionData.numero_parcelas,
        parcela_atual: i,
        total_parcelas: transactionData.numero_parcelas,
        grupo_parcelamento: grupoParcelamento,
        efetivado: false,
        observacoes: transactionData.observacoes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  } else {
    // Transação única (à vista)
    transacoesCriadas = [{
      usuario_id: user.id,
      cartao_id: transactionData.cartao_id,
      categoria_id: categoriaId,
      subcategoria_id: transactionData.subcategoria_id || null,
      descricao: transactionData.descricao.trim(),
      valor: valorNumerico,
      data: transactionData.data,
      tipo: 'despesa',
      fatura_vencimento: transactionData.fatura_vencimento,
      numero_parcelas: 1,
      parcela_atual: 1,
      total_parcelas: 1,
      efetivado: false,
      observacoes: transactionData.observacoes.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
  }
  // Inserir todas as transações
  const { error } = await supabase.from('transacoes').insert(transacoesCriadas);
  if (error) throw error;

  // Mensagem baseada no parcelamento
  const mensagem = transactionData.numero_parcelas > 1 
    ? `Compra parcelada em ${transactionData.numero_parcelas}x criada com sucesso!`
    : 'Compra no cartão registrada com sucesso!';

  return { success: true, message: mensagem };
}, [user.id, transactionData, getValorNumerico]);

// ===== HANDLER PRINCIPAL PARA SALVAR =====
const handleSalvar = useCallback(async (continuar = false) => {
  try {
    setLoading(true);
    
    // Validação básica
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    let resultado;
    
    // Escolher estratégia de salvamento baseada no tipo
    switch (transactionData.tipo) {
      case 'transferencia':
        resultado = await salvarTransferencia();
        break;
        
      case 'receita':
      case 'despesa':
        resultado = await criarReceitaDespesa();
        break;
        
      case 'cartao':
        resultado = await criarDespesaCartao();
        break;
        
      default:
        throw new Error('Tipo de transação não suportado');
    }
    
    if (!resultado.success) {
      throw new Error(resultado.error || 'Erro ao salvar transação');
    }
    
    showNotification(resultado.message, 'success');
    
    if (onSave) onSave();
    
    if (continuar && !transactionData.modoEdicao) {
      // Reset form para continuar adicionando
      setTransactionData(prev => ({
        ...prev,
        valor: '',
        descricao: '',
        observacoes: '',
        categoria_id: '',
        categoria_texto: '',
        subcategoria_id: '',
        subcategoria_texto: ''
      }));
      setErrors({});
    } else {
      handleCancelar();
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
    showNotification(`Erro ao salvar: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}, [transactionData, validateForm, salvarTransferencia, criarReceitaDespesa, criarDespesaCartao, showNotification, onSave, handleCancelar]);

// ===== DETECÇÃO DE TIPO E SUBTIPO =====
const detectarTipoTransacao = useCallback((transacao) => {
  if (!transacao) return 'receita';
  if (transacao.cartao_id) return 'cartao';
  if (transacao.transferencia || transacao.conta_destino_id) return 'transferencia';
  return transacao.tipo || 'receita';
}, []);

const detectarSubtipoTransacao = useCallback((transacao) => {
  if (!transacao) return 'extra';
  if (transacao.grupo_parcelamento || transacao.parcela_atual) return 'parcelada';
  if (transacao.grupo_recorrencia || transacao.eh_recorrente) return 'previsivel';
  return 'extra';
}, []);

// ===== PREENCHIMENTO PARA EDIÇÃO =====
const preencherFormularioEdicao = useCallback(async (transacao) => {
  if (!transacao) return;
  
  console.log('🖊️ Preenchendo formulário para edição:', transacao);
  
  const tipoDetectado = detectarTipoTransacao(transacao);
  const subtipoDetectado = detectarSubtipoTransacao(transacao);
  
  // Formatar valor
  const valorFormatado = transacao.valor ? 
    transacao.valor.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) : '';
  
  // Buscar categoria se existe
  let categoriaNome = '';
  if (transacao.categoria_id && categorias && categorias.length > 0) {
    const categoria = categorias.find(c => c.id === transacao.categoria_id);
    categoriaNome = categoria?.nome || '';
  }
  
  // Buscar subcategoria se existe
  let subcategoriaNome = '';
  if (transacao.subcategoria_id && subcategorias && subcategorias.length > 0) {
    const subcategoria = subcategorias.find(s => s.id === transacao.subcategoria_id);
    subcategoriaNome = subcategoria?.nome || '';
  }
  
  // Preencher formulário
  setTransactionData({
    tipo: tipoDetectado,
    subtipo: subtipoDetectado,
    modoEdicao: true,
    transacaoOriginal: transacao,
    
    // Dados principais
    valor: valorFormatado,
    data: transacao.data || new Date().toISOString().split('T')[0],
    descricao: transacao.descricao?.replace(/\s\(\d+\/\d+\)$/, '') || '',
    observacoes: transacao.observacoes || '',
    efetivado: transacao.efetivado !== false,
    
    // Categoria
    categoria_id: transacao.categoria_id || '',
    categoria_texto: categoriaNome,
    subcategoria_id: transacao.subcategoria_id || '',
    subcategoria_texto: subcategoriaNome,
    
    // Campos específicos por tipo
    conta_id: transacao.conta_id || null,
    cartao_id: transacao.cartao_id || null,
    conta_origem_id: transacao.conta_origem_id || null,
    conta_destino_id: transacao.conta_destino_id || null,
    fatura_vencimento: transacao.fatura_vencimento || null,
    
    // Configurações de recorrência
    numero_parcelas: transacao.total_parcelas || transacao.numero_parcelas || 12,
    frequencia: 'mensal',
    total_recorrencias: transacao.total_recorrencias || 12
  });
  
  console.log('✅ Formulário preenchido para tipo:', tipoDetectado, 'subtipo:', subtipoDetectado);
}, []);

const verificarGrupoEdicao = useCallback((transacao) => {
  if (!transacao || !isParceladaOuRecorrente) return null;
  
  try {
    const infoGrupo = isParceladaOuRecorrente(transacao);
    console.log('🔍 Verificando grupo para edição:', infoGrupo);
    return infoGrupo;
  } catch (error) {
    console.error('Erro ao verificar grupo:', error);
    return null;
  }
}, []);

const transacaoInfo = isParceladaOuRecorrenteSafe(transactionData.transacaoOriginal);

// ===== EFFECTS =====
// Carregar cartões quando o modal abrir
useEffect(() => {
  if (isOpen && user && fetchCartoes) {
    const carregarCartoes = async () => {
      try {
        const cartoesCarregados = await fetchCartoes();
        setCartoes(cartoesCarregados || []);
      } catch (error) {
        console.error('Erro ao carregar cartões:', error);
      }
    };
    
    carregarCartoes();
  }
}, [isOpen, user, fetchCartoes]);

// Recalcular fatura quando data da compra mudar
useEffect(() => {
  if (transactionData.tipo === 'cartao' && transactionData.cartao_id && transactionData.data) {
    const atualizarOpcoesFatura = async () => {
      const opcoes = await gerarOpcoesFatura(transactionData.cartao_id, transactionData.data);
      setOpcoesFatura(opcoes);
      
      // Selecionar opção padrão se não há fatura selecionada
      if (!transactionData.fatura_vencimento) {
        const opcaoPadrao = opcoes.find(opcao => opcao.is_default);
        if (opcaoPadrao) {
          handleInputChange('fatura_vencimento', opcaoPadrao.valor_opcao);
        }
      }
    };
    
    atualizarOpcoesFatura();
  }
}, [transactionData.tipo, transactionData.cartao_id, transactionData.data, gerarOpcoesFatura, transactionData.fatura_vencimento, handleInputChange]);

// Auto-selecionar cartão se houver apenas um
useEffect(() => {
  if (
    transactionData.tipo === 'cartao' && 
    !transactionData.modoEdicao && 
    cartoes && 
    cartoes.length === 1 && 
    !transactionData.cartao_id
  ) {
    const unicoCartao = cartoes[0];
    if (unicoCartao && unicoCartao.ativo !== false) {
      handleInputChange('cartao_id', unicoCartao.id);
    }
  }
}, [transactionData.tipo, transactionData.modoEdicao, cartoes, transactionData.cartao_id, handleInputChange]);

useEffect(() => {
  if (!isOpen) return;
  
  if (transacaoEditando) {
    // Usar timeout para evitar loop
    const timer = setTimeout(() => {
      preencherFormularioEdicao(transacaoEditando);
    }, 100);
    
    return () => clearTimeout(timer);
  } else {
    // Reset para modo criação
    setTransactionData(prev => ({
      ...prev,
      tipo: tipoInicial,
      subtipo: 'extra',
      modoEdicao: false,
      transacaoOriginal: null,
      data: new Date().toISOString().split('T')[0]
    }));
  }
}, [isOpen, tipoInicial]);

// ===== RENDER =====
if (!isOpen) return null;

return (
    <div className="modal-overlay active" data-modal="unified-transaction">
    <div className="forms-modal-container">
      
      {/* Header dinâmico */}
      <div className={`modal-header ${tipoAtual.corHeader}`}>
        <div className="modal-header-content">
          <div className="modal-icon-container modal-icon-primary">
            {tipoAtual.icone}
          </div>
          <div>
            <h2 className="modal-title">
              {transactionData.modoEdicao ? 'Editar' : 'Nova'} {tipoAtual.nome}
            </h2>
            <p className="modal-subtitle">
              {headerPreview}
            </p>
          </div>
        </div>
        <button className="modal-close" onClick={handleCancelar}>
          <X size={18} />
        </button>
      </div>

      <div className="modal-body">
        
        {/* Seletor de tipos */}
        <div className="type-selector-unified">
          {tiposTransacao.map(tipo => (
            <button
              key={tipo.id}
              type="button"
              className={`type-tab ${transactionData.tipo === tipo.id ? 'active' : ''}`}
              onClick={() => handleTipoChange(tipo.id)}
              disabled={loading}
              style={{
                '--tipo-cor': tipo.cor
              }}
            >
              <span className="tab-icon">{tipo.emoji}</span>
              <span className="tab-text">{tipo.nome}</span>
            </button>
          ))}
        </div>

          {/* Seletor de subtipos - Estilo do modal antigo */}
          {mostrarSubtipos && (
            <div className="flex flex-col mb-3">
              <div 
                className="type-selector mb-2"
                style={{
                  display: 'flex',
                  gap: '6px',
                  padding: '4px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}
              >
                {subtiposDisponiveis.map((subtipo) => (
                  <button
                    key={subtipo.id}
                    type="button"
                    className={`type-option ${transactionData.subtipo === subtipo.id ? 'active' : ''}`}
                    onClick={() => handleSubtipoChange(subtipo.id)}
                    disabled={loading}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: transactionData.subtipo === subtipo.id ? `2px solid #10b981` : '1px solid transparent',
                      background: transactionData.subtipo === subtipo.id ? '#dcfce7' : 'transparent',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      minHeight: '48px',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    <div style={{ 
                      color: '#10b981', 
                      marginRight: '8px', 
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {subtipo.icone}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '14px', 
                        lineHeight: '1.2',
                        color: transactionData.subtipo === subtipo.id ? '#166534' : '#374151'
                      }}>
                        {subtipo.nome}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        lineHeight: '1.2'
                      }}>
                        {subtipo.descricao}
                      </div>
                    </div>
                    {transactionData.subtipo === subtipo.id && (
                      <div style={{ 
                        color: '#10b981', 
                        fontWeight: 'bold',
                        fontSize: '16px',
                        marginLeft: '4px'
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        {/* Status toggle (oculto para transferência) */}
        {mostrarStatus && (
          
            
            <div className="status-toggle">
              <button
                type="button"
                className={`status-option ${transactionData.efetivado ? 'active' : ''}`}
                onClick={() => handleInputChange('efetivado', true)}
                disabled={loading}
              >
                <CheckCircle size={16} />
                Já {transactionData.tipo === 'receita' ? 'Recebida' : 'Paga'}
              </button>
              <button
                type="button"
                className={`status-option ${!transactionData.efetivado ? 'active' : ''}`}
                onClick={() => handleInputChange('efetivado', false)}
                disabled={loading}
              >
                <Clock size={16} />
                Planejada
              </button>
            </div>
          
        )}

        {/* Escopo de edição para grupos */}
        {transactionData.modoEdicao && verificarGrupoEdicao(transactionData.transacaoOriginal) && (
          <div className="confirmation-warning mb-3">
            <AlertCircle size={16} />
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                {verificarGrupoEdicao(transactionData.transacaoOriginal)?.isParcelada ? 'Transação Parcelada' : 'Transação Recorrente'}
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.4' }}>
                Esta transação faz parte de um grupo. Como deseja aplicar as alterações?
              </p>

              <div className="confirmation-options" style={{ gap: '8px' }}>
                <label className={`confirmation-option ${escopoEdicao === 'atual' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="escopoEdicao"
                    value="atual"
                    checked={escopoEdicao === 'atual'}
                    onChange={(e) => setEscopoEdicao(e.target.value)}
                    disabled={loading}
                  />
                  <div className="confirmation-option-content">
                    <div className="confirmation-option-header">
                      <CheckCircle size={16} />
                      <span>Alterar apenas esta</span>
                    </div>
                    <p className="confirmation-option-description">
                      Modifica somente esta transação específica
                    </p>
                  </div>
                </label>
                
                <label className={`confirmation-option ${escopoEdicao === 'futuras' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="escopoEdicao"
                    value="futuras"
                    checked={escopoEdicao === 'futuras'}
                    onChange={(e) => setEscopoEdicao(e.target.value)}
                    disabled={loading}
                  />
                  <div className="confirmation-option-content">
                    <div className="confirmation-option-header">
                      <AlertCircle size={16} />
                      <span>Alterar esta e futuras</span>
                    </div>
                    <p className="confirmation-option-description">
                      Modifica esta e todas as transações futuras do grupo
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação para Criar Categoria/Subcategoria */}
        {confirmacao.show && (
          <div className="modal-overlay-confirmation">
            <div className="forms-modal-container modal-small">
              <div className="modal-header">
                <div className="modal-header-content">
                  <div className="modal-icon-container modal-icon-primary">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h2 className="modal-title">
                      Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
                    </h2>
                    <p className="modal-subtitle">
                      {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
                      <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' })}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmarCriacao}
                  className="btn-primary"
                >
                  Criar {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campos principais */}
        <div className="flex gap-3 row">
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={14} />
              Valor *
            </label>
            <InputMoney
              value={transactionData.valor}
              onChange={handleValorChange}
              placeholder="R$ 0,00 ou 5+3,50"
              disabled={loading}
              enableCalculator={true}
              className={errors.valor ? 'error' : ''}
            />
            {errors.valor && <div className="form-error">{errors.valor}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} />
              Data *
            </label>
            <input
              type="date"
              className={`input-date ${errors.data ? 'error' : ''}`}
              value={transactionData.data}
              onChange={(e) => handleInputChange('data', e.target.value)}
              disabled={loading}
            />
            {errors.data && <div className="form-error">{errors.data}</div>}
          </div>
        </div>

        {/* Descrição */}
        <div className="form-group">
          <label className="form-label">
            <FileText size={14} />
            Descrição
          </label>
          <input
            type="text"
            className={`input-text ${errors.descricao ? 'error' : ''}`}
            placeholder={`Descreva a ${tipoAtual.nome.toLowerCase()}...`}
            value={transactionData.descricao}
            onChange={(e) => handleInputChange('descricao', e.target.value)}
            disabled={loading}
          />
          {errors.descricao && <div className="form-error">{errors.descricao}</div>}
        </div>

        {/* Campos específicos por tipo */}
        {renderFormFields()}
      </div>

      {/* Footer com ações */}
      <div className="modal-footer">
        <button
          type="button"
          onClick={handleCancelar}
          disabled={loading}
          className="btn-cancel"
        >
          Cancelar
        </button>
        
        {!transactionData.modoEdicao && (
          <button
            type="button"
            onClick={() => handleSalvar(true)}
            disabled={loading}
            className="btn-secondary btn-secondary--success"
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Salvando...
              </>
            ) : (
              <>
                <Plus size={14} />
                Continuar Adicionando
              </>
            )}
          </button>
        )}
        
        <button
          type="button"
          onClick={() => handleSalvar(false)}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <>
              <span className="btn-spinner"></span>
              Salvando...
            </>
          ) : (
            <>
              {tipoAtual.icone}
              {transactionData.modoEdicao ? 'Atualizar' : 'Salvar'} {tipoAtual.nome}
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);
};

UnifiedTransactionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  transacaoEditando: PropTypes.object,
  tipoInicial: PropTypes.oneOf(['receita', 'despesa', 'cartao', 'transferencia'])
};

// ===== ESTILOS PARA BOTÃO DE INVERTER =====
const styles = `
.btn-inverter-contas {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-inverter-contas:hover:not(:disabled) {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  transform: rotate(180deg);
}

.btn-inverter-contas:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

// Injetar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default React.memo(UnifiedTransactionModal);
