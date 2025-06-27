// src/modules/transacoes/components/DespesasModal.jsx - VERSÃO REFATORADA COM ZUSTAND
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingDown, 
  Plus, 
  Calendar, 
  FileText, 
  Tag, 
  DollarSign, 
  Repeat, 
  Hash, 
  Building,
  CheckCircle,
  Clock,
  PlusCircle,
  X,
  Search,
  Edit,
  ShoppingBag,
  Receipt,
  HelpCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
// ✅ REMOVIDO: import useContas - vamos usar fetch direto como TransferenciasModal
import { useTransactions } from '@modules/transacoes/store/transactionsStore';
import '@shared/styles/FormsModal.css';

const DespesasModal = ({ isOpen, onClose, onSave, transacaoEditando }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ REFATORAÇÃO: Usar fetch direto igual TransferenciasModal
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ✅ CORREÇÃO: Usar o hook correto para obter a função
  const { updateGrupoValor, isParceladaOuRecorrente } = useTransactions();
  
  const valorInputRef = useRef(null);
  const isEditMode = Boolean(transacaoEditando);

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [tipoDespesa, setTipoDespesa] = useState('extra');

  // Estados para dados (apenas categorias - contas vêm do Zustand)
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);

  // Estado para confirmação
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
    nome: '',
    categoriaId: ''
  });

  // ✅ CORREÇÃO: Estados para edição de grupos
  const [mostrarEscopoEdicao, setMostrarEscopoEdicao] = useState(false);
  const [escopoEdicao, setEscopoEdicao] = useState('atual');
  const [transacaoInfo, setTransacaoInfo] = useState(null);
  const [valorOriginal, setValorOriginal] = useState(0);

  // Estado do formulário
  const [formData, setFormData] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    conta: '',
    efetivado: true,
    observacoes: '',
    frequenciaPrevisivel: 'mensal',
    numeroParcelas: 12,
    frequenciaParcelada: 'mensal',
    totalRecorrencias: 12,
    tipoRecorrencia: 'mensal',
    primeiroEfetivado: true
  });

  const [errors, setErrors] = useState({});

  // ===== CONFIGURAÇÕES =====
  const tiposDespesa = [
    { 
      id: 'extra', 
      nome: 'Extra', 
      icone: <ShoppingBag size={16} />, 
      descricao: 'Gasto único', 
      cor: '#F59E0B',
      tooltip: 'Gastos pontuais que não se repetem: presentes, reparos, compras esporádicas, emergências.'
    },
    { 
      id: 'previsivel', 
      nome: 'Previsível', 
      icone: <Repeat size={16} />, 
      descricao: 'Gasto fixo', 
      cor: '#EF4444',
      tooltip: 'Gastos que se repetem regularmente: aluguel, financiamentos, planos, assinaturas.'
    },
    { 
      id: 'parcelada', 
      nome: 'Parcelada', 
      icone: <Receipt size={16} />, 
      descricao: 'Em parcelas', 
      cor: '#8B5CF6',
      tooltip: 'Compras divididas em várias parcelas: eletrodomésticos, viagens, cursos.'
    }
  ];

  const opcoesFrequencia = [
    { value: 'semanal', label: 'Semanal' },
    { value: 'quinzenal', label: 'Quinzenal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'anual', label: 'Anual' }
  ];

  // ===== FUNÇÕES UTILITÁRIAS =====
const formatarValor = useCallback((valor) => {
  // ✅ CORREÇÃO: Se contém operadores matemáticos, não formatar
  if (/[+\-*/()]/.test(valor)) {
    return valor; // Deixa passar direto para o InputMoney processar
  }
  
  // Formatação normal apenas para números puros
  const apenasNumeros = valor.toString().replace(/\D/g, '');
  if (!apenasNumeros || apenasNumeros === '0') return '';
  const valorEmCentavos = parseInt(apenasNumeros, 10);
  const valorEmReais = valorEmCentavos / 100;
  return valorEmReais.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}, []);
  
const valorNumerico = useMemo(() => {
  if (!formData.valor) return 0;
  const valorString = formData.valor.toString();
  
  // ✅ CORREÇÃO: Se contém operadores, não converter ainda
  if (/[+\-*/()]/.test(valorString)) {
    return 0; // Retorna 0 temporário para cálculos de preview
  }
  
  // Conversão normal apenas para números formatados
  if (valorString.includes(',')) {
    const partes = valorString.split(',');
    const inteira = partes[0].replace(/\./g, '');
    const decimal = partes[1] || '00';
    const valorFinal = parseFloat(`${inteira}.${decimal}`);
    return isNaN(valorFinal) ? 0 : valorFinal;
  } else {
    const apenasNumeros = valorString.replace(/\./g, '');
    const valorFinal = parseFloat(apenasNumeros) / 100;
    return isNaN(valorFinal) ? 0 : valorFinal;
  }
}, [formData.valor]);
  
  // ✅ REFATORAÇÃO: Usar fetch direto como TransferenciasModal
  const contasAtivas = useMemo(() => 
    contas.filter(conta => conta.ativo !== false), 
    [contas]
  );

  const categoriaSelecionada = useMemo(() => 
    categorias.find(cat => cat.id === formData.categoria), 
    [categorias, formData.categoria]
  );

  const subcategoriasDaCategoria = useMemo(() => 
    subcategorias.filter(sub => sub.categoria_id === formData.categoria), 
    [subcategorias, formData.categoria]
  );

  // ✅ CORREÇÃO: Carregar subcategorias por categoria CORRIGIDO
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
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao carregar subcategorias:', error);
      return [];
    }
  }, [user?.id]);

  // Effects para filtros de categoria
  useEffect(() => {
    if (!categorias.length) return;
    const filtradas = formData.categoriaTexto 
      ? categorias.filter(cat => cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase()))
      : categorias;
    setCategoriasFiltradas(filtradas);
  }, [formData.categoriaTexto, categorias]);

  useEffect(() => {
    if (!subcategoriasDaCategoria.length) {
      setSubcategoriasFiltradas([]);
      return;
    }
    const filtradas = formData.subcategoriaTexto 
      ? subcategoriasDaCategoria.filter(sub => sub.nome.toLowerCase().includes(formData.subcategoriaTexto.toLowerCase()))
      : subcategoriasDaCategoria;
    setSubcategoriasFiltradas(filtradas);
  }, [formData.subcategoriaTexto, subcategoriasDaCategoria]);

  // ✅ CORREÇÃO: Identificar tipo e grupo no modo edição CORRIGIDO
  useEffect(() => {
    if (isEditMode && transacaoEditando) {
      console.log('🔍 [EDIT MODE] Analisando transação para edição:', transacaoEditando);
      
      // ✅ Usar a função do store para identificar tipo
      const infoGrupo = isParceladaOuRecorrente(transacaoEditando);
      console.log('🎯 [EDIT MODE] Análise do grupo via store:', infoGrupo);
      
      // Determinar tipo baseado na análise
      let tipoIdentificado = 'extra';
      if (infoGrupo.isParcelada) {
        tipoIdentificado = 'parcelada';
      } else if (infoGrupo.isRecorrente) {
        tipoIdentificado = 'previsivel';
      }
      
      console.log('🎯 [EDIT MODE] Tipo identificado:', tipoIdentificado);
      setTipoDespesa(tipoIdentificado);
      
      // Armazenar informações do grupo
      setTransacaoInfo(infoGrupo);
      
      // Armazenar valor original
      const valorOrig = transacaoEditando.valor || 0;
      setValorOriginal(valorOrig);
      console.log('💰 [EDIT MODE] Valor original armazenado:', valorOrig);
    } else {
      setTransacaoInfo(null);
      setValorOriginal(0);
    }
  }, [isEditMode, transacaoEditando, isParceladaOuRecorrente]);

  // ===== CÁLCULOS PARA PREVIEW =====
  const calculos = useMemo(() => {
    const valor = valorNumerico;
    
    switch (tipoDespesa) {
      case 'previsivel':
        const frequenciaTexto = {
          'semanal': 'semanalmente',
          'quinzenal': 'quinzenalmente', 
          'mensal': 'mensalmente',
          'anual': 'anualmente'
        }[formData.frequenciaPrevisivel] || 'mensalmente';

        return {
          valorUnico: valor,
          frequenciaTexto,
          tipo: 'previsivel',
          mensagemPrincipal: `Você gastará ${formatCurrency(valor)} ${frequenciaTexto}`,
          mensagemSecundaria: 'Será criada automaticamente para o futuro. Você pode editar quando precisar.'
        };
        
      case 'parcelada':
        return {
          valorUnico: valor,
          totalParcelas: formData.numeroParcelas,
          valorTotal: valor * formData.numeroParcelas,
          tipo: 'parcelada',
          mensagemPrincipal: `${formatCurrency(valor)} × ${formData.numeroParcelas} = ${formatCurrency(valor * formData.numeroParcelas)}`,
          mensagemSecundaria: `${formData.numeroParcelas} parcelas • Frequência: ${formData.frequenciaParcelada}`
        };
        
      case 'extra':
      default:
        return {
          valorUnico: valor,
          tipo: 'extra',
          mensagemPrincipal: formatCurrency(valor),
          mensagemSecundaria: 'Gasto único'
        };
    }
  }, [tipoDespesa, valorNumerico, formData.frequenciaPrevisivel, formData.numeroParcelas, formData.frequenciaParcelada]);

  // ✅ CORREÇÃO: Preenchimento para edição CORRIGIDO
  const preencherFormularioEdicao = useCallback(async () => {
    if (!transacaoEditando || !categorias.length) return;
    
    console.log('🖊️ [CORRIGIDO] Preenchendo formulário para edição:', transacaoEditando);
    
    // Formatar valor para exibição
    const valorFormatado = transacaoEditando.valor ? 
      transacaoEditando.valor.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) : '';
    
    // Buscar categoria
    const categoria = categorias.find(c => c.id === transacaoEditando.categoria_id);
    let subcategoriaTexto = '';
    let subcategoriaId = '';

    // ✅ CORREÇÃO: Carregar subcategoria corretamente
    if (transacaoEditando.subcategoria_id) {
      console.log('🔍 [CORRIGIDO] Carregando subcategoria:', transacaoEditando.subcategoria_id);
      
      try {
        const { data: subcategoriaData, error } = await supabase
          .from('subcategorias')
          .select('*')
          .eq('id', transacaoEditando.subcategoria_id)
          .eq('usuario_id', user.id)
          .single();

        if (!error && subcategoriaData) {
          subcategoriaTexto = subcategoriaData.nome;
          subcategoriaId = subcategoriaData.id;
          console.log('✅ [CORRIGIDO] Subcategoria carregada:', subcategoriaData.nome);
          
          // Garantir que as subcategorias da categoria estão carregadas
          const subcategoriasCarregadas = await getSubcategoriasPorCategoria(transacaoEditando.categoria_id);
          setSubcategorias(prev => {
            const semCategoriasAntigas = prev.filter(sub => sub.categoria_id !== transacaoEditando.categoria_id);
            return [...semCategoriasAntigas, ...subcategoriasCarregadas];
          });
        }
      } catch (error) {
        console.error('❌ Erro ao carregar subcategoria:', error);
      }
    }
    
    setFormData({
      valor: valorFormatado,
      data: transacaoEditando.data || new Date().toISOString().split('T')[0],
      descricao: transacaoEditando.descricao?.replace(/\s\(\d+\/\d+\)$/, '') || '',
      categoria: transacaoEditando.categoria_id || '',
      categoriaTexto: categoria?.nome || '',
      subcategoria: subcategoriaId,
      subcategoriaTexto: subcategoriaTexto,
      conta: transacaoEditando.conta_id || '',
      efetivado: transacaoEditando.efetivado ?? true,
      observacoes: transacaoEditando.observacoes || '',
      frequenciaPrevisivel: 'mensal',
      numeroParcelas: transacaoEditando.total_parcelas || 12,
      frequenciaParcelada: 'mensal',
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true
    });

    console.log('✅ [CORRIGIDO] Formulário preenchido com subcategoria:', {
      subcategoria_id: subcategoriaId,
      subcategoriaTexto: subcategoriaTexto
    });
  }, [transacaoEditando, categorias, user?.id, getSubcategoriasPorCategoria]);

  // ===== HANDLERS DE INPUT =====
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let inputValue = type === 'checkbox' ? checked : value;
    
    if (name === 'numeroParcelas' || name === 'totalRecorrencias') {
      inputValue = parseInt(value) || 1;
    }
    
    if (name === 'categoria') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: inputValue, 
        subcategoria: '', 
        subcategoriaTexto: '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: inputValue }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // ✅ CORREÇÃO: Handle de valor CORRIGIDO para verificar mudança de valor
// ✅ FUNÇÃO CORRIGIDA: handleValorChange - Permite operadores matemáticos
const handleValorChange = useCallback((valorNumericoRecebido) => {
  // ✅ CORREÇÃO: Se receber um número do InputMoney (calculadora processou)
  if (typeof valorNumericoRecebido === 'number') {
    // Formatar o número recebido
    const valorFormatado = valorNumericoRecebido.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    setFormData(prev => ({ ...prev, valor: valorFormatado }));
  } else {
    // Recebido string (usuário digitando) - deixar passar
    setFormData(prev => ({ ...prev, valor: valorNumericoRecebido }));
  }
  
  // ✅ LÓGICA CORRIGIDA: Verificar mudança de valor apenas com números finais
  if (isEditMode && transacaoInfo && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente)) {
    // Só verificar se é um número final (não expressão matemática)
    if (typeof valorNumericoRecebido === 'number') {
      const novoValor = valorNumericoRecebido;
      
      if (novoValor !== valorOriginal && novoValor > 0) {
        setMostrarEscopoEdicao(true);
      } else {
        setMostrarEscopoEdicao(false);
      }
    }
  } else {
    setMostrarEscopoEdicao(false);
  }
  
  if (errors.valor) {
    setErrors(prev => ({ ...prev, valor: null }));
  }
}, [errors.valor, isEditMode, transacaoInfo, valorOriginal]);
  

  const handleTipoChange = useCallback((novoTipo) => {
    setTipoDespesa(novoTipo);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.numeroParcelas;
      delete newErrors.totalRecorrencias;
      return newErrors;
    });
  }, []);

  // ✅ CORREÇÃO: Handlers para input numérico com incremento/decremento
  const handleNumeroParcelasChange = useCallback((e) => {
    const valor = parseInt(e.target.value) || 1;
    const valorLimitado = Math.max(1, Math.min(60, valor));
    setFormData(prev => ({ ...prev, numeroParcelas: valorLimitado }));
    
    if (errors.numeroParcelas) {
      setErrors(prev => ({ ...prev, numeroParcelas: null }));
    }
  }, [errors.numeroParcelas]);

  const handleIncrementoParcelas = useCallback(() => {
    setFormData(prev => ({ 
      ...prev, 
      numeroParcelas: Math.min(60, prev.numeroParcelas + 1) 
    }));
  }, []);

  const handleDecrementoParcelas = useCallback(() => {
    setFormData(prev => ({ 
      ...prev, 
      numeroParcelas: Math.max(1, prev.numeroParcelas - 1) 
    }));
  }, []);

  // ===== HANDLERS DE CATEGORIA =====
  const handleCategoriaChange = useCallback((e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      categoriaTexto: value,
      categoria: '',
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    setCategoriaDropdownOpen(true);
    if (errors.categoria) {
      setErrors(prev => ({ ...prev, categoria: null }));
    }
  }, [errors.categoria]);

  const handleSelecionarCategoria = useCallback(async (categoria) => {
    setFormData(prev => ({
      ...prev,
      categoria: categoria.id,
      categoriaTexto: categoria.nome,
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    setCategoriaDropdownOpen(false);
    
    // Carregar subcategorias da categoria selecionada
    const subcategoriasCarregadas = await getSubcategoriasPorCategoria(categoria.id);
    setSubcategorias(prev => {
      // Remover subcategorias antigas da categoria anterior e adicionar as novas
      const semCategoriasAntigas = prev.filter(sub => sub.categoria_id !== categoria.id);
      return [...semCategoriasAntigas, ...subcategoriasCarregadas];
    });
  }, [getSubcategoriasPorCategoria]);

  const handleCategoriaBlur = useCallback(() => {
    const timer = setTimeout(() => {
      setCategoriaDropdownOpen(false);
      if (formData.categoriaTexto && !formData.categoria) {
        const existe = categorias.find(cat => 
          cat.nome.toLowerCase() === formData.categoriaTexto.toLowerCase()
        );
        if (!existe) {
          setConfirmacao({
            show: true,
            type: 'categoria',
            nome: formData.categoriaTexto,
            categoriaId: ''
          });
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [formData.categoriaTexto, formData.categoria, categorias]);

  // ===== HANDLERS DE SUBCATEGORIA =====
  const handleSubcategoriaChange = useCallback((e) => {
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      subcategoriaTexto: value, 
      subcategoria: '' 
    }));
    if (categoriaSelecionada) {
      setSubcategoriaDropdownOpen(true);
    }
  }, [categoriaSelecionada]);

  const handleSelecionarSubcategoria = useCallback((subcategoria) => {
    setFormData(prev => ({
      ...prev,
      subcategoria: subcategoria.id,
      subcategoriaTexto: subcategoria.nome
    }));
    setSubcategoriaDropdownOpen(false);
  }, []);

  const handleSubcategoriaBlur = useCallback(() => {
    const timer = setTimeout(() => {
      setSubcategoriaDropdownOpen(false);
      if (formData.subcategoriaTexto && !formData.subcategoria && categoriaSelecionada) {
        const existe = subcategoriasDaCategoria.find(sub => 
          sub.nome.toLowerCase() === formData.subcategoriaTexto.toLowerCase()
        );
        if (!existe) {
          setConfirmacao({
            show: true,
            type: 'subcategoria',
            nome: formData.subcategoriaTexto,
            categoriaId: formData.categoria
          });
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [formData.subcategoriaTexto, formData.subcategoria, formData.categoria, categoriaSelecionada, subcategoriasDaCategoria]);

  // ===== CRIAR CATEGORIA/SUBCATEGORIA =====
  const handleConfirmarCriacao = useCallback(async () => {
    try {
      if (confirmacao.type === 'categoria') {
        const { data, error } = await supabase
          .from('categorias')
          .insert([{
            nome: confirmacao.nome,
            tipo: 'despesa',
            cor: '#EF4444',
            usuario_id: user.id,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        setFormData(prev => ({
          ...prev,
          categoria: data.id,
          categoriaTexto: data.nome
        }));
        
        setCategorias(prev => [...prev, data]);
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
        
        setFormData(prev => ({
          ...prev,
          subcategoria: data.id,
          subcategoriaTexto: data.nome
        }));
        
        setSubcategorias(prev => [...prev, data]);
        showNotification(`Subcategoria "${confirmacao.nome}" criada com sucesso!`, 'success');
      }
    } catch (error) {
      console.error('❌ Erro ao criar categoria/subcategoria:', error);
      showNotification('Erro inesperado. Tente novamente.', 'error');
    }
    
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, [confirmacao, user.id, showNotification]);

  // ✅ REFATORAÇÃO: Carregar contas direto do banco (igual TransferenciasModal)
  const carregarContas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      showNotification('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ REFATORAÇÃO: REMOVER carregarDados - categorias apenas
  const carregarCategorias = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // ✅ APENAS CATEGORIAS - contas vêm do fetch direto
      const [categoriasRes, subcategoriasRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('usuario_id', user.id).eq('tipo', 'despesa').eq('ativo', true).order('nome'),
        supabase.from('subcategorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showNotification('Erro ao carregar categorias', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    const dataAtual = new Date().toISOString().split('T')[0];
    setFormData({
      valor: '',
      data: dataAtual,
      descricao: '',
      categoria: '',
      categoriaTexto: '',
      subcategoria: '',
      subcategoriaTexto: '',
      conta: '',
      efetivado: true,
      observacoes: '',
      frequenciaPrevisivel: 'mensal',
      numeroParcelas: 12,
      frequenciaParcelada: 'mensal',
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true
    });
    setErrors({});
    setTipoDespesa('extra');
    setEscopoEdicao('atual');
    setMostrarEscopoEdicao(false);
    setTransacaoInfo(null);
    setValorOriginal(0);
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, []);

  // ===== VALIDAÇÃO =====
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!valorNumerico || valorNumerico === 0) {
      newErrors.valor = "Valor é obrigatório";
    }
    if (!formData.data) {
      newErrors.data = "Data é obrigatória";
    }
    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição é obrigatória";
    }
    if (!formData.categoria && !formData.categoriaTexto.trim()) {
      newErrors.categoria = "Categoria é obrigatória";
    }
    if (!formData.conta) {
      newErrors.conta = "Conta é obrigatória";
    }
    if (formData.observacoes && formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    // ✅ CORREÇÃO: Validação para transações de grupo que mudaram valor
    if (isEditMode && transacaoInfo && mostrarEscopoEdicao && !escopoEdicao) {
      newErrors.escopoEdicao = "Escolha o escopo da alteração";
    }
    
    if (tipoDespesa === 'parcelada') {
      if (formData.numeroParcelas < 1) {
        newErrors.numeroParcelas = "Número de parcelas deve ser pelo menos 1";
      }
      if (formData.numeroParcelas > 60) {
        newErrors.numeroParcelas = "Máximo de 60 parcelas";
      }
    }

    if (tipoDespesa === 'previsivel') {
      if (formData.totalRecorrencias < 1) {
        newErrors.totalRecorrencias = "Quantidade deve ser pelo menos 1";
      }
      if (formData.totalRecorrencias > 60) {
        newErrors.totalRecorrencias = "Máximo de 60 recorrências";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, tipoDespesa, valorNumerico, isEditMode, transacaoInfo, mostrarEscopoEdicao, escopoEdicao]);

  // ✅ CORREÇÃO: Atualizar transação CORRIGIDO
  const atualizarTransacao = useCallback(async () => {
    try {
      // ✅ CORREÇÃO: Se é transação de grupo e o valor mudou, usar updateGrupoTransacoesValor
      if (transacaoInfo && mostrarEscopoEdicao && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente)) {
        console.log('🔄 [CORRIGIDO] Atualizando grupo de transações via hook correto:', {
          transacaoId: transacaoEditando.id,
          escopoEdicao,
          valorNumerico,
          transacaoInfo
        });

        const resultado = await updateGrupoValor(
          transacaoEditando.id,
          escopoEdicao, // 'atual' ou 'futuras'
          valorNumerico
        );

        if (!resultado.success) {
          throw new Error(resultado.error || 'Erro ao atualizar grupo de transações');
        }

        showNotification(resultado.message || 'Transações atualizadas com sucesso!', 'success');
        return true;
      }

      // Caso contrário, atualização normal individual
      const dadosAtualizacao = {
        data: formData.data,
        descricao: formData.descricao.trim(),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        conta_id: formData.conta,
        valor: valorNumerico,
        efetivado: formData.efetivado,
        observacoes: formData.observacoes.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('transacoes')
        .update(dadosAtualizacao)
        .eq('id', transacaoEditando.id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      showNotification('Despesa atualizada com sucesso!', 'success');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar despesa:', error);
      throw error;
    }
  }, [formData, valorNumerico, transacaoEditando, user.id, showNotification, transacaoInfo, mostrarEscopoEdicao, escopoEdicao, updateGrupoValor]);

  // ===== CRIAR DESPESAS =====
  const criarDespesas = useCallback(async () => {
    try {
      const dadosBase = {
        usuario_id: user.id,
        descricao: formData.descricao.trim(),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        conta_id: formData.conta,
        valor: valorNumerico,
        tipo: 'despesa',
        tipo_despesa: tipoDespesa,
        observacoes: formData.observacoes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let despesasCriadas = [];

      switch (tipoDespesa) {
        case 'extra':
          despesasCriadas = [{
            ...dadosBase,
            data: formData.data,
            efetivado: formData.efetivado,
            recorrente: false,
            grupo_recorrencia: null
          }];
          break;

        case 'parcelada':
        case 'previsivel':
          const grupoId = crypto.randomUUID();
          const dataBase = new Date(formData.data);
          
          // ✅ CORREÇÃO: Para previsíveis, criar por muitos anos (igual às receitas)
          const totalRecorrencias = tipoDespesa === 'previsivel' ? 
            (() => {
              switch (formData.frequenciaPrevisivel) {
                case 'semanal': return 20 * 52; // 20 anos
                case 'quinzenal': return 20 * 26; // 20 anos
                case 'mensal': return 20 * 12; // 20 anos
                case 'anual': return 20; // 20 anos
                default: return 20 * 12;
              }
            })() : 
            formData.numeroParcelas;
          
          const frequencia = tipoDespesa === 'previsivel' ? 
            formData.frequenciaPrevisivel : 
            formData.frequenciaParcelada;

          for (let i = 0; i < totalRecorrencias; i++) {
            const dataDespesa = new Date(dataBase);
            
            switch (frequencia) {
              case 'semanal':
                dataDespesa.setDate(dataDespesa.getDate() + (7 * i));
                break;
              case 'quinzenal':
                dataDespesa.setDate(dataDespesa.getDate() + (14 * i));
                break;
              case 'mensal':
                dataDespesa.setMonth(dataDespesa.getMonth() + i);
                break;
              case 'anual':
                dataDespesa.setFullYear(dataDespesa.getFullYear() + i);
                break;
            }
            
            const efetivoStatus = i === 0 ? formData.efetivado : false;
            const sufixo = tipoDespesa === 'parcelada' ? ` (${i + 1}/${totalRecorrencias})` : '';
            
            despesasCriadas.push({
              ...dadosBase,
              data: dataDespesa.toISOString().split('T')[0],
              descricao: dadosBase.descricao + sufixo,
              efetivado: efetivoStatus,
              recorrente: true,
              grupo_recorrencia: tipoDespesa === 'previsivel' ? grupoId : null,
              grupo_parcelamento: tipoDespesa === 'parcelada' ? grupoId : null,
              parcela_atual: tipoDespesa === 'parcelada' ? i + 1 : null,
              total_parcelas: tipoDespesa === 'parcelada' ? totalRecorrencias : null,
              numero_recorrencia: tipoDespesa === 'previsivel' ? i + 1 : null,
              total_recorrencias: tipoDespesa === 'previsivel' ? totalRecorrencias : null
            });
          }
          break;
      }

      const { error } = await supabase.from('transacoes').insert(despesasCriadas);
      if (error) throw error;
      
      let mensagem = '';
      switch (tipoDespesa) {
        case 'extra':
          mensagem = 'Despesa extra registrada com sucesso!';
          break;
        case 'parcelada':
          mensagem = `${formData.numeroParcelas} parcelas criadas com sucesso!`;
          break;
        case 'previsivel':
          mensagem = `Despesa previsível configurada para o futuro!`;
          break;
      }
      
      showNotification(mensagem, 'success');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao criar despesas:', error);
      throw error;
    }
  }, [user.id, formData, tipoDespesa, valorNumerico, showNotification]);

  // ===== SUBMISSÃO =====
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Modo edição
      if (isEditMode) {
        await atualizarTransacao();
        
        if (onSave) onSave();
        
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
        
        return;
      }
      
      // Modo criação
      await criarDespesas();
      await carregarContas(); // ✅ Recarregar contas após criar despesa
      
      if (onSave) onSave();
      
      if (criarNova) {
        setFormData(prev => ({
          ...prev,
          valor: '',
          data: new Date().toISOString().split('T')[0],
          descricao: '',
          efetivado: true,
          observacoes: ''
        }));
        setErrors({});
        setTimeout(() => valorInputRef.current?.focus(), 100);
      } else {
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar despesa:', error);
      showNotification(`Erro ao salvar despesa: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, criarDespesas, carregarContas, onSave, showNotification, resetForm, onClose, isEditMode, atualizarTransacao]);

  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // ===== EFFECTS =====
  // ✅ REFATORAÇÃO: Carregar contas + categorias ao abrir (igual TransferenciasModal)
  useEffect(() => {
    if (isOpen && user) {
      carregarContas(); // ✅ Sempre busca dados frescos do banco
      carregarCategorias();
    }
  }, [isOpen, user, carregarContas, carregarCategorias]);

  useEffect(() => {
    if (isOpen && categorias.length > 0 && transacaoEditando) {
      preencherFormularioEdicao();
    }
  }, [isOpen, categorias.length, transacaoEditando, preencherFormularioEdicao]);

  useEffect(() => {
    if (isOpen && !transacaoEditando) {
      resetForm();
      setTimeout(() => valorInputRef.current?.focus(), 150);
    }
  }, [isOpen, transacaoEditando, resetForm]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancelar();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleCancelar]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      
      <div className="forms-modal-container">
        {/* Modal de Confirmação */}
      {confirmacao.show && (
        <div className="modal-overlay-confirmation">
          <div className="forms-modal-container modal-small">
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon-container modal-icon-danger">
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
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-danger">
              {isEditMode ? <Edit size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <h2 className="modal-title">
                {isEditMode ? 'Editar Despesa' : 'Nova Despesa'}
              </h2>
              <p className="modal-subtitle">
                {isEditMode ? 'Atualize os dados da despesa' : 'Registre um novo gasto'}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          
      
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Carregando dados...</p>
            </div>
            
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)}>
              
              {/* ✅ CORREÇÃO: ESCOPO DE EDIÇÃO MELHORADO */}
              {isEditMode && transacaoInfo && mostrarEscopoEdicao && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente) && (
                <div className="confirmation-warning mb-3">
                  <AlertCircle size={16} />
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                      {transacaoInfo.isParcelada ? 'Despesa Parcelada Detectada' : 'Despesa Previsível Detectada'}
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.4' }}>
                      {transacaoInfo.isParcelada 
                        ? `Esta é a parcela ${transacaoInfo.parcelaAtual} de ${transacaoInfo.totalParcelas}. Você alterou o valor.` 
                        : `Esta é uma despesa que se repete automaticamente. Você alterou o valor.`
                      }
                      <br />Escolha o escopo da alteração:
                    </p>
                    
                    <div className="confirmation-options" style={{ gap: '8px' }}>
                      <label className={`confirmation-option ${escopoEdicao === 'atual' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="escopoEdicao"
                          value="atual"
                          checked={escopoEdicao === 'atual'}
                          onChange={(e) => setEscopoEdicao(e.target.value)}
                          disabled={submitting}
                        />
                        <div className="confirmation-option-content">
                          <div className="confirmation-option-header">
                            <CheckCircle size={16} />
                            <span>
                              {transacaoInfo.isParcelada 
                                ? 'Alterar apenas esta parcela' 
                                : 'Alterar apenas esta ocorrência'
                              }
                            </span>
                          </div>
                          <p className="confirmation-option-description">
                            {transacaoInfo.isParcelada
                              ? 'Modifica somente a parcela atual, mantendo as demais com o valor original'
                              : 'Modifica somente esta ocorrência específica da despesa recorrente'
                            }
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
                          disabled={submitting}
                        />
                        <div className="confirmation-option-content">
                          <div className="confirmation-option-header">
                            <AlertCircle size={16} />
                            <span>
                              {transacaoInfo.isParcelada
                                ? 'Alterar esta e todas as parcelas futuras'
                                : 'Alterar esta e todas as ocorrências futuras'
                              }
                            </span>
                          </div>
                          <p className="confirmation-option-description">
                            {transacaoInfo.isParcelada
                              ? 'Modifica esta parcela e todas as parcelas ainda não efetivadas'
                              : 'Modifica esta e todas as ocorrências futuras não efetivadas da despesa'
                            }
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {errors.escopoEdicao && <div className="form-error">{errors.escopoEdicao}</div>}
                  </div>
                </div>
              )}

              <h3 className="section-title">Informações da Despesa</h3>
              
              {/* VALOR E DATA */}
              <div className="flex gap-3 row mb-3">
                <div>
                  <label className="form-label">
                    <DollarSign size={14} />
                    {tipoDespesa === 'parcelada' ? 'Valor por Parcela' : 'Valor'} *
                  </label>
                  <InputMoney
                    ref={valorInputRef}
                    value={typeof formData.valor === 'string' && /[+\-*/()]/.test(formData.valor) ? 0 : valorNumerico}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00 (ou 5+3,50)"
                    disabled={submitting}
                    enableCalculator={true}
                    showCalculationFeedback={true}
                    className={`input-money-highlight ${errors.valor ? 'error' : ''}`}
                  />
                  {errors.valor && <div className="form-error">{errors.valor}</div>}
                </div>
                
                <div>
                  <label className="form-label">
                    <Calendar size={14} />
                    {tipoDespesa === 'previsivel' ? 'Data Início' : 
                     tipoDespesa === 'parcelada' ? 'Data Compra' : 'Data'} *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`input-date ${errors.data ? 'error' : ''}`}
                  />
                  {errors.data && <div className="form-error">{errors.data}</div>}
                </div>
              </div>

              {/* ESCOLHA DO TIPO - Mostra o tipo identificado quando editando */}
              {isEditMode ? (
                <div className="flex flex-col mb-3">
                  <h3 className="section-title">Tipo de Despesa Detectado</h3>
                  <div className="type-selector mb-2" style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    padding: '0px' 
                  }}>
                    {tiposDespesa.map((tipo) => (
                      <div
                        key={tipo.id}
                        className={`type-option ${tipoDespesa === tipo.id ? 'active' : 'inactive'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: tipoDespesa === tipo.id ? tipo.cor + '15' : 'transparent',
                          border: tipoDespesa === tipo.id ? `1px solid ${tipo.cor}` : '1px solid transparent',
                          opacity: tipoDespesa === tipo.id ? 1 : 0.4,
                          marginBottom: '0px'
                        }}
                        title={tipo.tooltip}
                      >
                        <div style={{ color: tipo.cor, marginRight: '8px' }}>{tipo.icone}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>{tipo.nome}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{tipo.descricao}</div>
                        </div>
                        {tipoDespesa === tipo.id && (
                          <div style={{ color: tipo.cor, fontWeight: 'bold' }}>✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {transacaoInfo && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente) && (
                    <div className="confirmation-info-box" style={{ marginTop: '4px' }}>
                      <HelpCircle size={16} />
                      <p>
                        {transacaoInfo.isParcelada && (
                          <>📦 Parcela {transacaoInfo.parcelaAtual} de {transacaoInfo.totalParcelas}</>
                        )}
                        {transacaoInfo.isRecorrente && (
                          <>🔄 Ocorrência {transacaoInfo.numeroRecorrencia}{transacaoInfo.totalRecorrencias ? ` de ${transacaoInfo.totalRecorrencias}` : ''}</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col mb-3">
                  <h3 className="section-title">Tipo de Despesa</h3>
                  <div className="type-selector mb-2">
                    {tiposDespesa.map((tipo) => (
                      <button
                        key={tipo.id}
                        type="button"
                        className={`type-option ${tipoDespesa === tipo.id ? 'active' : ''}`}
                        onClick={() => handleTipoChange(tipo.id)}
                        disabled={submitting}
                        title={tipo.tooltip}
                      >
                        <div className="type-option-content">
                          <div className="type-option-icon">{tipo.icone}</div>
                          <div className="type-option-text">
                            <div className="type-option-name">{tipo.nome}</div>
                            <div className="type-option-desc">{tipo.descricao}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STATUS */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <CheckCircle size={14} />
                  Status da {tipoDespesa === 'extra' ? 'Despesa' : 'Primeira'}
                </label>
                <div className="status-selector">
                  <button
                    type="button"
                    className={`status-option ${formData.efetivado ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, efetivado: true }))}
                    disabled={submitting}
                  >
                    <CheckCircle size={16} />
                    <div>
                      <div>Primeira já paga</div>
                      <small>Dinheiro saiu da conta</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`status-option ${!formData.efetivado ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, efetivado: false }))}
                    disabled={submitting}
                  >
                    <Clock size={16} />
                    <div>
                      <div>
                        {/* ✅ CORREÇÃO: Pluralização correta */}
                        {tipoDespesa === 'extra' ? 'Planejada' : 'Todas planejadas'}
                      </div>
                      <small>A pagar</small>
                    </div>
                  </button>
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS POR TIPO */}
              {tipoDespesa === 'previsivel' && !isEditMode && (
                <div className="flex flex-col mb-3">
                  <label className="form-label">
                    <Repeat size={14} />
                    Frequência *
                  </label>
                  <div className="select-search">
                    <select
                      name="frequenciaPrevisivel"
                      value={formData.frequenciaPrevisivel}
                      onChange={handleInputChange}
                      disabled={submitting}
                    >
                      {opcoesFrequencia.map(opcao => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {tipoDespesa === 'parcelada' && !isEditMode && (
                <div className="flex gap-3 row mb-3">
                  <div>
                    <label className="form-label">
                      <Repeat size={14} />
                      Frequência *
                    </label>
                    <div className="select-search">
                      <select
                        name="frequenciaParcelada"
                        value={formData.frequenciaParcelada}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        {opcoesFrequencia.map(opcao => (
                          <option key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">
                      <Hash size={14} />
                      Número de Parcelas *
                    </label>
                    {/* ✅ CORREÇÃO: Input numérico com botões de incremento/decremento */}
                    <div className="input-number-container">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.numeroParcelas}
                        onChange={handleNumeroParcelasChange}
                        disabled={submitting}
                        className={`input-number ${errors.numeroParcelas ? 'error' : ''}`}
                      />
                      <div className="input-number-controls">
                        <button
                          type="button"
                          onClick={handleIncrementoParcelas}
                          disabled={submitting || formData.numeroParcelas >= 60}
                          className="input-number-btn"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={handleDecrementoParcelas}
                          disabled={submitting || formData.numeroParcelas <= 1}
                          className="input-number-btn"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    </div>
                    {errors.numeroParcelas && <div className="form-error">{errors.numeroParcelas}</div>}
                  </div>
                </div>
              )}

              {/* PREVIEW */}
              {valorNumerico > 0 && (
                <div className="summary-panel danger mb-3">
                  <div className="summary-header">
                    {tiposDespesa.find(t => t.id === tipoDespesa)?.icone}
                    <strong>Despesa {tiposDespesa.find(t => t.id === tipoDespesa)?.nome}</strong>
                  </div>
                  <h4 className="summary-title">{calculos.mensagemPrincipal}</h4>
                  <p className="summary-value">{calculos.mensagemSecundaria}</p>
                </div>
              )}

              {/* DESCRIÇÃO */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <FileText size={14} />
                  Descrição *
                </label>
                <input
                  type="text"
                  name="descricao"
                  placeholder={
                    tipoDespesa === 'previsivel' ? "Ex: Aluguel, Financiamento, Plano de saúde" :
                    tipoDespesa === 'parcelada' ? "Ex: Geladeira, Viagem, Curso" :
                    "Ex: Presente, Reparo, Compra pontual"
                  }
                  value={formData.descricao}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`input-text ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && <div className="form-error">{errors.descricao}</div>}
              </div>

              {/* CATEGORIA */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <Tag size={14} />
                  Categoria *
                </label>
                <div className="dropdown-container">
                  <div style={{position: 'relative'}}>
                    <input
                      type="text"
                      value={formData.categoriaTexto}
                      onChange={handleCategoriaChange}
                      onBlur={handleCategoriaBlur}
                      onFocus={() => setCategoriaDropdownOpen(true)}
                      placeholder="Digite ou selecione uma categoria"
                      disabled={submitting}
                      autoComplete="off"
                      className={`input-text input-with-icon ${!formData.categoria ? 'input-muted' : ''} ${errors.categoria ? 'error' : ''}`}
                      style={{
                        paddingLeft: categoriaSelecionada ? '28px' : '10px'
                      }}
                    />
                    {categoriaSelecionada && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: categoriaSelecionada.cor || '#ef4444',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                    <Search size={14} className="input-search-icon" />
                  </div>
                  
                  {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
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
                {errors.categoria && <div className="form-error">{errors.categoria}</div>}
              </div>

              {/* SUBCATEGORIA */}
              {categoriaSelecionada && (
                <div className="flex flex-col mb-3">
                  <label className="form-label">
                    <Tag size={14} />
                    Subcategoria <span className="form-label-small">({subcategoriasDaCategoria.length} disponíveis)</span>
                  </label>
                  <div className="dropdown-container">
                    <div style={{position: 'relative'}}>
                      <input
                        type="text"
                        value={formData.subcategoriaTexto}
                        onChange={handleSubcategoriaChange}
                        onBlur={handleSubcategoriaBlur}
                        onFocus={() => setSubcategoriaDropdownOpen(true)}
                        placeholder="Digite ou selecione uma subcategoria"
                        disabled={submitting}
                        autoComplete="off"
                        className="input-text input-with-icon"
                        style={{
                          paddingLeft: '28px'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: categoriaSelecionada.cor || '#ef4444',
                          pointerEvents: 'none'
                        }}
                      />
                      <Search size={14} className="input-search-icon" />
                      
                    </div>
                    
                    {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
                      <div className="dropdown-options">
                        {subcategoriasFiltradas.map(subcategoria => (
                          <div
                            key={subcategoria.id}
                            onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                            className="dropdown-option"
                          >
                            <div 
                              className="category-color-tag"
                              style={{backgroundColor: categoriaSelecionada.cor || '#ef4444'}}
                            ></div>
                            {subcategoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                </div>
                
              )}

              {/* ✅ REFATORAÇÃO: CONTA DE DÉBITO - Usando fetch direto (igual TransferenciasModal) */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <Building size={14} />
                  Conta de Débito *
                </label>
                <div className="select-search">
                  <select
                    name="conta"
                    value={formData.conta}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={errors.conta ? 'error' : ''}
                  >
                    <option value="">Selecione uma conta</option>
                    {contasAtivas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} - {formatCurrency(conta.saldo || 0)}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.conta && <div className="form-error">{errors.conta}</div>}
                
                {contasAtivas.length === 0 && (
                  <div className="form-info">
                    Nenhuma conta ativa encontrada. Crie uma conta primeiro.
                  </div>
                )}

              </div>

              {/* OBSERVAÇÕES */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <FileText size={14} />
                  Observações <span className="form-label-small">(máx. 300)</span>
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Observações adicionais (opcional)..."
                  rows="2"
                  disabled={submitting}
                  maxLength="300"
                  className={`textarea-observations ${errors.observacoes ? 'error' : ''}`}
                />
                <div className="char-counter">
                  <span></span>
                  <span className={formData.observacoes.length > 250 ? 'char-counter-warning' : ''}>
                    {formData.observacoes.length}/300
                  </span>
                </div>
                {errors.observacoes && <div className="form-error">{errors.observacoes}</div>}
              
              </div>

            </form>
            
          )}

        </div>

        {/* AÇÕES */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={submitting}
            className="btn-cancel"
          >
            Cancelar
          </button>
          
          {!isEditMode && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={submitting}
              className="btn-secondary btn-secondary--danger"
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <PlusCircle size={14} />
                  Continuar Adicionando
                </>
              )}
            </button>
          )}
          
          <button
            type="submit"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                {isEditMode ? 'Atualizando...' :
                 tipoDespesa === 'previsivel' ? `Criando despesas para o futuro...` :
                 tipoDespesa === 'parcelada' ? `Criando ${formData.numeroParcelas} parcelas...` :
                 'Salvando...'}
              </>
            ) : (
              <>
                {isEditMode ? <Edit size={14} /> : <Plus size={14} />}
                {isEditMode ? 
                  (mostrarEscopoEdicao ? 'Atualizar Grupo' : 'Atualizar Despesa') :
                 tipoDespesa === 'previsivel' ? `Criar Despesas Futuras` :
                 tipoDespesa === 'parcelada' ? `Parcelar em ${formData.numeroParcelas}x` :
                 'Adicionar Despesa'}
              </>
            )}
          </button>

        </div>
      </div>
      

    </div>
  );
};

DespesasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  transacaoEditando: PropTypes.object
};

export default React.memo(DespesasModal);
