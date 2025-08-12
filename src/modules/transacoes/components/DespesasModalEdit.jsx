// src/modules/transacoes/components/DespesasModalEdit.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingDown, 
  Calendar, 
  FileText, 
  Tag, 
  DollarSign, 
  Building,
  CheckCircle,
  Clock,
  X,
  Search,
  Edit,
  ShoppingBag,
  Receipt,
  Repeat,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import { useTransactions } from '@modules/transacoes/store/transactionsStore';
import '@shared/styles/FormsModal.css';
import InputMoney from '@shared/components/ui/InputMoney';

const DespesasModalEdit = ({ isOpen, onClose, onSave, transacaoEditando }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const { updateGrupoValor, isParceladaOuRecorrente, updateTransacao } = useTransactions();
  const [dadosOriginais, setDadosOriginais] = useState({
  categoria: '',
  subcategoria: ''
});
  
  const valorInputRef = useRef(null);

  // Validação obrigatória
  if (!transacaoEditando && isOpen) {
    console.error('DespesasModalEdit: transacaoEditando é obrigatória');
    return null;
  }

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  // Estados para dados
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);

  // Estado para confirmação de criação de categoria/subcategoria
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
    nome: '',
    categoriaId: ''
  });

  // Estados para edição de grupos
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
    efetivado: true
  });

  const [errors, setErrors] = useState({});

  // ===== IDENTIFICAÇÃO AUTOMÁTICA DO TIPO =====
  const tipoTransacao = useMemo(() => {
    if (!transacaoEditando) return 'extra';

    console.log('🔍 Identificando tipo da transação:', {
      id: transacaoEditando.id,
      grupo_parcelamento: transacaoEditando.grupo_parcelamento,
      grupo_recorrencia: transacaoEditando.grupo_recorrencia,
      parcela_atual: transacaoEditando.parcela_atual,
      total_parcelas: transacaoEditando.total_parcelas
    });

    if (transacaoEditando.grupo_parcelamento) {
      console.log('✅ Transação é PARCELADA (grupo_parcelamento presente)');
      return 'parcelada';
    }

    if (transacaoEditando.grupo_recorrencia) {
      console.log('✅ Transação é PREVISÍVEL (grupo_recorrencia presente)');
      return 'previsivel';
    }

    console.log('✅ Transação é EXTRA (sem grupos)');
    return 'extra';
  }, [transacaoEditando]);

  // ===== CONFIGURAÇÕES DE TIPO =====
  const tiposDespesa = [
    { 
      id: 'extra', 
      nome: 'Despesa Extra', 
      icone: <ShoppingBag size={16} />, 
      descricao: 'Gasto único', 
      cor: '#F59E0B'
    },
    { 
      id: 'previsivel', 
      nome: 'Despesa Mensal',
      icone: <Repeat size={16} />, 
      descricao: 'Repetem todo mês',
      cor: '#EF4444'
    },
    { 
      id: 'parcelada', 
      nome: 'Despesa Parcelada', 
      icone: <Receipt size={16} />, 
      descricao: 'Em parcelas', 
      cor: '#8B5CF6'
    }
  ];

  // ===== FUNÇÕES UTILITÁRIAS =====
  const formatarValor = useCallback((valor) => {
    if (!valor && valor !== 0) return '';
    
    // Se contém operadores matemáticos, não formatar
    if (typeof valor === 'string' && /[+\-*/()]/.test(valor)) {
      return valor;
    }
    
    // Garantir que é um número
    const numeroValor = typeof valor === 'number' ? valor : parseFloat(valor);
    if (isNaN(numeroValor)) return '';
    
    // Formatação normal para números
    return numeroValor.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  // Valor numérico processado
  const valorNumerico = useMemo(() => {
    if (!formData.valor) return 0;
    const valorString = formData.valor.toString();
    
    // Se contém operadores, não converter ainda
    if (/[+\-*/()]/.test(valorString)) {
      return 0;
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

  // Contas ativas
  const contasAtivas = useMemo(() => 
    contas.filter(conta => conta.ativo !== false), 
    [contas]
  );

  // Categoria selecionada
  const categoriaSelecionada = useMemo(() => 
    categorias.find(cat => cat.id === formData.categoria), 
    [categorias, formData.categoria]
  );

  // Subcategorias da categoria
  const subcategoriasDaCategoria = useMemo(() => 
    subcategorias.filter(sub => sub.categoria_id === formData.categoria), 
    [subcategorias, formData.categoria]
  );

  // ===== PREVIEW DINÂMICO =====
  const previewInfo = useMemo(() => {
    const valor = valorNumerico;
    const tipo = tipoTransacao;
    
    if (tipo === 'parcelada' && transacaoInfo) {
      return {
        tipo: 'parcelada',
        icone: <Receipt size={16} />,
        mensagemPrincipal: `Parcela ${transacaoInfo.parcelaAtual} de ${transacaoInfo.totalParcelas}`,
        mensagemSecundaria: `Valor: ${formatCurrency(valor)}`,
        cor: '#8B5CF6'
      };
    }
    
    if (tipo === 'previsivel' && transacaoInfo) {
      return {
        tipo: 'previsivel',
        icone: <Repeat size={16} />,
        mensagemPrincipal: `Ocorrência ${transacaoInfo.numeroRecorrencia}${transacaoInfo.totalRecorrencias ? ` de ${transacaoInfo.totalRecorrencias}` : ''}`,
        mensagemSecundaria: `Valor: ${formatCurrency(valor)}`,
        cor: '#EF4444'
      };
    }
    
    return {
      tipo: 'extra',
      icone: <ShoppingBag size={16} />,
      mensagemPrincipal: formatCurrency(valor),
      mensagemSecundaria: 'Despesa única',
      cor: '#F59E0B'
    };
  }, [valorNumerico, tipoTransacao, transacaoInfo]);

  // ===== CARREGAR DADOS =====
  const carregarContas = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      setContas(data || []);
      console.log('✅ Contas carregadas:', data?.length || 0);
    } catch (error) {
      console.error('❌ Erro ao carregar contas:', error);
      showNotification('Erro ao carregar contas', 'error');
    }
  }, [user, showNotification]);

  const carregarDados = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    console.log('🔄 Carregando dados do modal...');
    
    try {
      const [categoriasRes, subcategoriasRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('usuario_id', user.id).eq('tipo', 'despesa').eq('ativo', true).order('nome'),
        supabase.from('subcategorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome')
      ]);

      if (categoriasRes.error) throw categoriasRes.error;
      if (subcategoriasRes.error) throw subcategoriasRes.error;

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
      setDadosCarregados(true);
      
      console.log('✅ Dados carregados:', {
        categorias: categoriasRes.data?.length || 0,
        subcategorias: subcategoriasRes.data?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Carregar subcategorias por categoria
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

  // ===== PREENCHER FORMULÁRIO PARA EDIÇÃO =====
  const preencherFormularioEdicao = useCallback(async () => {
  if (!transacaoEditando || !dadosCarregados) {
    console.log('🚫 Não é possível preencher formulário ainda:', {
      temTransacao: !!transacaoEditando,
      dadosCarregados
    });
    return;
  }
  
  console.log('🖊️ Preenchendo formulário para edição:', {
    transacao: transacaoEditando,
    valor: transacaoEditando.valor,
    valorTipo: typeof transacaoEditando.valor
  });
  
  // CORREÇÃO: Melhor tratamento do valor
  let valorFormatado = '';
  if (transacaoEditando.valor !== null && transacaoEditando.valor !== undefined) {
    const valorNum = Number(transacaoEditando.valor);
    if (!isNaN(valorNum) && valorNum > 0) {
      valorFormatado = valorNum.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      console.log('💰 Valor formatado:', valorFormatado, 'de', valorNum);
    }
  }
  
  const categoria = categorias.find(c => c.id === transacaoEditando.categoria_id);
  let subcategoriaTexto = '';
  let subcategoriaId = '';

  // Carregar subcategoria se existir
  if (transacaoEditando.subcategoria_id) {
    console.log('🔍 Carregando subcategoria:', transacaoEditando.subcategoria_id);
    
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
        console.log('✅ Subcategoria carregada:', subcategoriaData.nome);
        
        // Carregar todas as subcategorias da categoria
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
  
  // Formatar data corretamente
  let dataFormatada = new Date().toISOString().split('T')[0];
  if (transacaoEditando.data) {
    try {
      const dataObj = new Date(transacaoEditando.data);
      if (!isNaN(dataObj.getTime())) {
        dataFormatada = dataObj.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('⚠️ Erro ao formatar data:', error);
    }
  }
  
  const novoFormData = {
    valor: valorFormatado,
    data: dataFormatada,
    descricao: transacaoEditando.descricao || '',
    categoria: transacaoEditando.categoria_id || '',
    categoriaTexto: categoria?.nome || '',
    subcategoria: subcategoriaId,
    subcategoriaTexto: subcategoriaTexto,
    conta: transacaoEditando.conta_id || '',
    efetivado: transacaoEditando.efetivado ?? true
  };

  console.log('📝 Dados do formulário preenchidos:', novoFormData);
  setFormData(novoFormData);

  // NOVO: Armazenar dados originais para comparação
  setDadosOriginais({
    categoria: transacaoEditando.categoria_id || '',
    subcategoria: subcategoriaId
  });

  console.log('✅ Formulário preenchido para edição');
}, [transacaoEditando, dadosCarregados, categorias, user?.id, getSubcategoriasPorCategoria]);


const verificarAlteracoesGrupo = useCallback(() => {
  if (!transacaoInfo || (!transacaoInfo.isParcelada && !transacaoInfo.isRecorrente)) {
    setMostrarEscopoEdicao(false);
    return;
  }

  // Verificar se valor foi alterado
  const valorAlterado = Math.abs(valorNumerico - valorOriginal) > 0.01 && valorNumerico > 0;
  
  // Verificar se categoria foi alterada
  const categoriaAlterada = formData.categoria !== dadosOriginais.categoria;
  
  // Verificar se subcategoria foi alterada
  const subcategoriaAlterada = formData.subcategoria !== dadosOriginais.subcategoria;

  const temAlteracao = valorAlterado || categoriaAlterada || subcategoriaAlterada;

  console.log('🔍 Verificando alterações em grupo:', {
    valorAlterado,
    categoriaAlterada,
    subcategoriaAlterada,
    temAlteracao,
    valorNumerico,
    valorOriginal,
    categoriaAtual: formData.categoria,
    categoriaOriginal: dadosOriginais.categoria,
    subcategoriaAtual: formData.subcategoria,
    subcategoriaOriginal: dadosOriginais.subcategoria
  });

  setMostrarEscopoEdicao(temAlteracao);
}, [formData.categoria, formData.subcategoria, dadosOriginais, valorNumerico, valorOriginal, transacaoInfo]);


  // ===== IDENTIFICAR TIPO E GRUPO =====
useEffect(() => {
  verificarAlteracoesGrupo();
}, [verificarAlteracoesGrupo]);

  useEffect(() => {
    if (transacaoEditando) {
      console.log('🔍 Analisando transação para edição:', transacaoEditando);
      
      const infoGrupo = isParceladaOuRecorrente(transacaoEditando);
      console.log('🎯 Análise do grupo via store:', infoGrupo);
      
      setTransacaoInfo(infoGrupo);
      
      const valorOrig = transacaoEditando.valor || 0;
      setValorOriginal(valorOrig);
      console.log('💰 Valor original armazenado:', valorOrig);
    } else {
      setTransacaoInfo(null);
      setValorOriginal(0);
    }
  }, [transacaoEditando, isParceladaOuRecorrente]);

  // ===== EFFECTS PARA FILTROS =====
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

  // ===== HANDLERS DE INPUT =====
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let inputValue = type === 'checkbox' ? checked : value;
    
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

  // Handle de valor - CORRIGIDO
  const handleValorChange = useCallback((valorRecebido) => {
    console.log('💰 Handle valor change:', valorRecebido, typeof valorRecebido);
    
    // Se receber um número do InputMoney (calculadora processou)
    if (typeof valorRecebido === 'number') {
      const valorFormatado = valorRecebido.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      setFormData(prev => ({ ...prev, valor: valorFormatado }));
      console.log('💰 Valor formatado (número):', valorFormatado);
    } else {
      // String vinda do input
      setFormData(prev => ({ ...prev, valor: valorRecebido }));
      console.log('💰 Valor string:', valorRecebido);
    }
    
    // Verificar mudança de valor para grupos
    if (transacaoInfo && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente)) {
      if (typeof valorRecebido === 'number') {
        const novoValor = valorRecebido;
        
        if (Math.abs(novoValor - valorOriginal) > 0.01 && novoValor > 0) { // Usar tolerância para float
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
  }, [errors.valor, transacaoInfo, valorOriginal]);

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
  
  const subcategoriasCarregadas = await getSubcategoriasPorCategoria(categoria.id);
  setSubcategorias(prev => {
    const semCategoriasAntigas = prev.filter(sub => sub.categoria_id !== categoria.id);
    return [...semCategoriasAntigas, ...subcategoriasCarregadas];
  });

  // NOVO: Verificar alterações após selecionar categoria
  setTimeout(() => verificarAlteracoesGrupo(), 100);
}, [getSubcategoriasPorCategoria, verificarAlteracoesGrupo]);



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

  // NOVO: Verificar alterações após selecionar subcategoria
  setTimeout(() => verificarAlteracoesGrupo(), 100);
}, [verificarAlteracoesGrupo]);

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

  // ===== RESET FORM =====
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
  setDadosOriginais({ categoria: '', subcategoria: '' }); // NOVO
  setCategoriaDropdownOpen(false);
  setSubcategoriaDropdownOpen(false);
  setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  setDadosCarregados(false);
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
    if (!formData.categoria && !formData.categoriaTexto.trim()) {
      newErrors.categoria = "Categoria é obrigatória";
    }
    if (!formData.conta) {
      newErrors.conta = "Conta é obrigatória";
    }
    
    if (transacaoInfo && mostrarEscopoEdicao && !escopoEdicao) {
      newErrors.escopoEdicao = "Escolha o escopo da alteração";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico, transacaoInfo, mostrarEscopoEdicao, escopoEdicao]);

  // ===== ATUALIZAR TRANSAÇÃO =====
  const atualizarTransacao = useCallback(async () => {
  try {
    if (transacaoInfo && mostrarEscopoEdicao && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente)) {
      console.log('🔄 Atualizando grupo de transações:', {
        transacaoId: transacaoEditando.id,
        escopoEdicao,
        valorNumerico,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        transacaoInfo
      });

      // Se apenas categoria/subcategoria foram alteradas, fazer update manual
      const valorAlterado = Math.abs(valorNumerico - valorOriginal) > 0.01;
      const categoriaAlterada = formData.categoria !== dadosOriginais.categoria;
      const subcategoriaAlterada = formData.subcategoria !== dadosOriginais.subcategoria;

      if ((categoriaAlterada || subcategoriaAlterada) && !valorAlterado) {
        // Update de categoria/subcategoria para grupo
        const campoGrupo = transacaoInfo.isParcelada ? 'grupo_parcelamento' : 'grupo_recorrencia';
        const grupoId = transacaoEditando[campoGrupo];

        let query = supabase
          .from('transacoes')
          .update({
            categoria_id: formData.categoria,
            subcategoria_id: formData.subcategoria || null,
            updated_at: new Date().toISOString()
          })
          .eq(campoGrupo, grupoId)
          .eq('usuario_id', user.id);

        // Aplicar filtro de escopo
        if (escopoEdicao === 'atual') {
          query = query.eq('id', transacaoEditando.id);
        } else if (escopoEdicao === 'futuras') {
          query = query.gte('data', transacaoEditando.data);
        }

        const { error } = await query;
        if (error) throw error;

        showNotification('Categoria/subcategoria atualizada com sucesso!', 'success');
        return true;
      } else {
        // Update de valor (usando função existente)
        const resultado = await updateGrupoValor(
          transacaoEditando.id,
          escopoEdicao,
          valorNumerico
        );

        if (!resultado.success) {
          throw new Error(resultado.error || 'Erro ao atualizar grupo de transações');
        }

        showNotification(resultado.message || 'Transações atualizadas com sucesso!', 'success');
        return true;
      }
    }

    // CORRIGIDO - descrição sempre preenchida
    const dadosAtualizacao = {
      data: formData.data,
      descricao: formData.descricao.trim() || 'Despesa',
      categoria_id: formData.categoria,
      subcategoria_id: formData.subcategoria || null,
      conta_id: formData.conta,
      valor: valorNumerico,
      efetivado: formData.efetivado,
      updated_at: new Date().toISOString()
    };

    console.log('📝 Atualizando transação com dados:', dadosAtualizacao);

    const resultado = await updateTransacao(transacaoEditando.id, dadosAtualizacao);

    if (!resultado.success) {
      throw new Error(resultado.error || 'Erro ao atualizar transação');
    }

    showNotification('Despesa atualizada com sucesso!', 'success');
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar despesa:', error);
    throw error;
  }
}, [formData, valorNumerico, transacaoEditando, user.id, showNotification, transacaoInfo, mostrarEscopoEdicao, escopoEdicao, updateGrupoValor, valorOriginal, dadosOriginais]);

  // ===== SUBMISSÃO =====
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await atualizarTransacao();
      await carregarContas();
      
      if (onSave) onSave();
      
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erro ao salvar despesa:', error);
      showNotification(`Erro ao salvar despesa: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, atualizarTransacao, carregarContas, onSave, showNotification, resetForm, onClose]);

  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // ===== EFFECTS PRINCIPAIS =====
  
  // Effect para carregar dados iniciais quando modal abre
  useEffect(() => {
    if (isOpen && user) {
      console.log('🚀 Modal aberto, carregando dados...');
      setDadosCarregados(false);
      Promise.all([
        carregarContas(),
        carregarDados()
      ]).then(() => {
        console.log('✅ Todos os dados carregados');
      });
    }
  }, [isOpen, user, carregarContas, carregarDados]);

  // Effect para preencher formulário após dados carregados
  useEffect(() => {
    if (isOpen && dadosCarregados && transacaoEditando) {
      console.log('📝 Dados carregados, preenchendo formulário...');
      preencherFormularioEdicao();
    }
  }, [isOpen, dadosCarregados, transacaoEditando, preencherFormularioEdicao]);

  // Effect para focar no input de valor
  useEffect(() => {
    if (isOpen && dadosCarregados && formData.valor) {
      setTimeout(() => {
        if (valorInputRef.current) {
          valorInputRef.current.focus();
          console.log('🎯 Foco definido no input de valor');
        }
      }, 200);
    }
  }, [isOpen, dadosCarregados, formData.valor]);

  // Effect para tecla ESC
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

  // Effect para debug - monitorar mudanças no formData
  useEffect(() => {
    if (formData.valor) {
      console.log('📊 FormData atualizado:', {
        valor: formData.valor,
        valorNumerico,
        transacaoEditando: transacaoEditando?.id
      });
    }
  }, [formData.valor, valorNumerico, transacaoEditando?.id]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        {/* Modal de Confirmação de Criação */}
        {confirmacao.show && (
          <div className="modal-overlay-confirmation">
            <div className="forms-modal-container modal-small">
              <div className="modal-header">
                <div className="modal-header-content">
                  <div className="modal-icon-container modal-icon-danger">
                    <TrendingDown size={18} />
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
              <Edit size={18} />
            </div>
            <div>
              <h2 className="modal-title">Editar Despesa</h2>
              <p className="modal-subtitle">
                {transacaoInfo?.isParcelada && `Parcela ${transacaoInfo.parcelaAtual}/${transacaoInfo.totalParcelas}`}
                {transacaoInfo?.isRecorrente && `Ocorrência ${transacaoInfo.numeroRecorrencia}${transacaoInfo.totalRecorrencias ? `/${transacaoInfo.totalRecorrencias}` : ''}`}
                {!transacaoInfo && 'Despesa única'}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading || !dadosCarregados ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">
                {loading ? 'Carregando dados...' : 'Preparando formulário...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {/* ESCOPO DE EDIÇÃO */}
              {transacaoInfo && mostrarEscopoEdicao && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente) && (
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

              {/* TIPO DE DESPESA - APENAS DISPLAY */}
              <div className="flex flex-col mb-3">
                <div 
                  className="type-selector mb-2" 
                  style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '6px', 
                    padding: '4px',
                    display: 'flex',
                    gap: '2px'
                  }}
                >
                  {tiposDespesa.map((tipo) => (
                    <div
                      key={tipo.id}
                      className={`type-option ${tipoTransacao === tipo.id ? 'active' : 'inactive'}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: tipoTransacao === tipo.id ? tipo.cor + '15' : 'transparent',
                        border: tipoTransacao === tipo.id ? `1px solid ${tipo.cor}` : '1px solid transparent',
                        opacity: tipoTransacao === tipo.id ? 1 : 0.4,
                        flex: 1,
                        cursor: 'default',
                        minHeight: '44px'
                      }}
                    >
                      <div style={{ 
                        color: tipo.cor, 
                        marginRight: '6px', 
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {tipo.icone}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '13px', 
                          lineHeight: '1.2',
                          color: tipoTransacao === tipo.id ? '#111827' : '#9ca3af'
                        }}>
                          {tipo.nome}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#6b7280',
                          lineHeight: '1.2',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {tipo.descricao}
                        </div>
                      </div>
                      {tipoTransacao === tipo.id && (
                        <div style={{ 
                          color: tipo.cor, 
                          fontWeight: 'bold',
                          fontSize: '14px',
                          marginLeft: '4px'
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {transacaoInfo && (transacaoInfo.isParcelada || transacaoInfo.isRecorrente) && (
                  <div className="confirmation-info-box" style={{ 
                    marginTop: '4px',
                    padding: '6px 8px',
                    fontSize: '12px'
                  }}>
                    <HelpCircle size={14} />
                    <p style={{ margin: 0 }}>
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

              {/* VALOR E DATA */}
              <div className="flex gap-3 row mb-3">
                <div>
                  <label className="form-label">
                    <DollarSign size={14} />
                    Valor *
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
                    Data *
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

              {/* STATUS */}
              <div className="flex flex-col mb-3">
                <label className="form-label" style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#374151'
                }}>
                  <CheckCircle size={12} />
                  Status da Despesa
                </label>
                
                <div 
                  className="status-selector"
                  style={{
                    display: 'flex',
                    gap: '4px',
                    background: '#f8fafc',
                    padding: '3px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <button
                    type="button"
                    className={`status-option ${formData.efetivado ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, efetivado: true }))}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: formData.efetivado ? '2px solid #10b981' : '1px solid transparent',
                      background: formData.efetivado ? '#dcfce7' : 'transparent',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      minHeight: '38px',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    <CheckCircle 
                      size={14} 
                      style={{ 
                        color: formData.efetivado ? '#10b981' : '#6b7280',
                        flexShrink: 0
                      }} 
                    />
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        lineHeight: '1.2',
                        color: formData.efetivado ? '#166534' : '#374151'
                      }}>
                        Paga
                      </div>
                      <small style={{ 
                        fontSize: '10px', 
                        color: '#6b7280',
                        lineHeight: '1.2'
                      }}>
                        Dinheiro saiu da conta
                      </small>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    className={`status-option ${!formData.efetivado ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, efetivado: false }))}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: !formData.efetivado ? '2px solid #f59e0b' : '1px solid transparent',
                      background: !formData.efetivado ? '#fef3c7' : 'transparent',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      minHeight: '38px',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    <Clock 
                      size={14} 
                      style={{ 
                        color: !formData.efetivado ? '#f59e0b' : '#6b7280',
                        flexShrink: 0
                      }} 
                    />
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        lineHeight: '1.2',
                        color: !formData.efetivado ? '#92400e' : '#374151'
                      }}>
                        Planejada
                      </div>
                      <small style={{ 
                        fontSize: '10px', 
                        color: '#6b7280',
                        lineHeight: '1.2'
                      }}>
                        A pagar
                      </small>
                    </div>
                  </button>
                </div>
              </div>

              {/* PREVIEW */}
              {valorNumerico > 0 && (
                <div className="summary-panel danger mb-3" style={{ borderColor: previewInfo.cor }}>
                  <div className="summary-header">
                    {previewInfo.icone}
                    <strong>Editando {tiposDespesa.find(t => t.id === tipoTransacao)?.nome}</strong>
                  </div>
                  <h4 className="summary-title">{previewInfo.mensagemPrincipal}</h4>
                  <p className="summary-value">{previewInfo.mensagemSecundaria}</p>
                </div>
              )}

              {/* DESCRIÇÃO */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <FileText size={14} />
                  Descrição
                </label>
                <input
                  type="text"
                  name="descricao"
                  placeholder="Ex: Supermercado, Aluguel, Remédio..."
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

              {/* CONTA DE DÉBITO */}
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
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || !dadosCarregados}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                Atualizando...
              </>
            ) : (
              <>
                <Edit size={14} />
                {mostrarEscopoEdicao ? 'Atualizar Grupo' : 'Atualizar Despesa'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

DespesasModalEdit.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  transacaoEditando: PropTypes.object.isRequired
};

export default React.memo(DespesasModalEdit);