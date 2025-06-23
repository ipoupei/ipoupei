// src/modules/transacoes/components/DespesasCartaoModal.jsx
// ✅ VERSÃO LIMPA E CORRIGIDA - Com Suporte para Edição
// ❌ PROIBIDO: Chamadas diretas ao banco, lógica de negócio no componente

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  FileText, 
  Tag, 
  DollarSign, 
  Hash, 
  PlusCircle,
  X,
  Search,
  Edit3
} from 'lucide-react';

// ✅ USAR: Novos hooks refatorados
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import useCartoesData from '@modules/cartoes/hooks/useCartoesData';
import useFaturaOperations from '@modules/cartoes/hooks/useFaturaOperations';
import useCategorias from '@modules/categorias/hooks/useCategorias';

import { formatCurrency } from '@utils/formatCurrency';
import '@shared/styles/FormsModal.css';

const DespesasCartaoModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  transacaoEditando = null 
}) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ HOOKS
  const { 
    fetchCartoes,
    calcularFaturaVencimento,
    loading: cartoesLoading,
    error: cartoesError
  } = useCartoesData();
  
  const { 
    criarDespesaCartao,
    criarDespesaParcelada,
    editarTransacao,
    loading: operationLoading,
    error: operationError
  } = useFaturaOperations();
  
  const { 
    categorias, 
    loading: categoriasLoading,
    addCategoria,
    addSubcategoria,
    getCategoriasPorTipo,
    getSubcategoriasPorCategoria
  } = useCategorias();
  
  const valorInputRef = useRef(null);

  // ✅ ESTADOS
  const [cartoes, setCartoes] = useState([]);
  const [opcoesFatura, setOpcoesFatura] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
    nome: '',
    categoriaId: ''
  });

  const [formData, setFormData] = useState({
    valorTotal: '',
    dataCompra: new Date().toISOString().split('T')[0],
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    cartaoId: '',
    numeroParcelas: 1,
    faturaVencimento: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState({});

  // ✅ MODO DE EDIÇÃO
  const isEditMode = Boolean(transacaoEditando);

  // ✅ DADOS DERIVADOS
  const categoriasDisponiveis = useMemo(() => 
    getCategoriasPorTipo('despesa'), 
    [getCategoriasPorTipo]
  );

  const categoriaSelecionada = useMemo(() => 
    categoriasDisponiveis.find(cat => cat.id === formData.categoria), 
    [categoriasDisponiveis, formData.categoria]
  );

  const subcategoriasDaCategoria = useMemo(() => 
    getSubcategoriasPorCategoria(formData.categoria), 
    [getSubcategoriasPorCategoria, formData.categoria]
  );

  const opcoesParcelamento = useMemo(() => 
    Array.from({ length: isEditMode ? 1 : 24 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}x${i === 0 ? ' à vista' : ''}`
    })),
    [isEditMode]
  );

  const cartoesParaEdicao = useMemo(() => {
    if (!cartoes || cartoes.length === 0) {
      if (isEditMode && transacaoEditando?.cartao_id) {
        return [{
          id: transacaoEditando.cartao_id,
          nome: 'Carregando cartão...',
          bandeira: '',
          ativo: true
        }];
      }
      return [];
    }

    const cartoesAtivos = cartoes.filter(c => c.ativo !== false);
    
    if (isEditMode && transacaoEditando?.cartao_id) {
      const cartaoAtual = cartoesAtivos.find(c => c.id === transacaoEditando.cartao_id);
      
      if (!cartaoAtual) {
        const cartaoTemporario = {
          id: transacaoEditando.cartao_id,
          nome: 'Carregando cartão...',
          bandeira: '',
          ativo: true
        };
        return [cartaoTemporario, ...cartoesAtivos];
      }
    }
    
    return cartoesAtivos;
  }, [cartoes, isEditMode, transacaoEditando]);

  const valorNumerico = useMemo(() => {
    if (!formData.valorTotal) return 0;
    const valorString = formData.valorTotal.toString();
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
  }, [formData.valorTotal]);

  const valorParcela = useMemo(() => 
    formData.numeroParcelas > 0 ? valorNumerico / formData.numeroParcelas : 0,
    [valorNumerico, formData.numeroParcelas]
  );

  // ✅ FUNCTIONS
  const formatarValor = useCallback((valor) => {
    const apenasNumeros = valor.toString().replace(/\D/g, '');
    if (!apenasNumeros || apenasNumeros === '0') return '';
    const valorEmCentavos = parseInt(apenasNumeros, 10);
    const valorEmReais = valorEmCentavos / 100;
    return valorEmReais.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  const calcularDataVencimentoParcela = useCallback((dataBaseVencimento, numeroParcela) => {
    if (!dataBaseVencimento || numeroParcela < 1) return null;
    
    const partes = dataBaseVencimento.split('-');
    const anoBase = parseInt(partes[0]);
    const mesBase = parseInt(partes[1]) - 1;
    const diaBase = parseInt(partes[2]);
    
    const novaData = new Date(anoBase, mesBase + (numeroParcela - 1), diaBase);
    
    if (novaData.getDate() !== diaBase) {
      novaData.setDate(0);
    }
    
    const ano = novaData.getFullYear();
    const mes = String(novaData.getMonth() + 1).padStart(2, '0');
    const dia = String(novaData.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  }, []);

  const calcularOpcoesFatura = useCallback(async () => {
    if (!formData.dataCompra || !formData.cartaoId) return [];
    
    try {
      const faturaCalculada = await calcularFaturaVencimento(formData.cartaoId, formData.dataCompra);
      
      if (!faturaCalculada) {
        return calcularOpcoesFaturaFallback();
      }
      
      const opcoes = [];
      const dataBase = faturaCalculada.data_vencimento;
      
      for (let i = -2; i <= 3; i++) {
        const partes = dataBase.split('-');
        const ano = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[2]);
        
        const novaData = new Date(ano, mes + i, dia);
        const dataFormatada = `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}-${String(novaData.getDate()).padStart(2, '0')}`;
        
        opcoes.push({
          value: dataFormatada,
          label: `${novaData.toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: 'numeric' 
          }).replace('.', '')} - Venc: ${novaData.toLocaleDateString('pt-BR')}`,
          isDefault: i === 0
        });
      }
      
      return opcoes;
      
    } catch (error) {
      console.error('Erro ao calcular opções via hook:', error);
      return calcularOpcoesFaturaFallback();
    }
  }, [formData.dataCompra, formData.cartaoId, calcularFaturaVencimento]);

  const calcularOpcoesFaturaFallback = useCallback(() => {
    if (!formData.dataCompra || !formData.cartaoId) return [];
    
    const cartao = cartoes.find(c => c.id === formData.cartaoId);
    if (!cartao) return [];
    
    const dataCompra = new Date(formData.dataCompra + 'T12:00:00');
    const diaFechamento = cartao.dia_fechamento || 1;
    const diaVencimento = cartao.dia_vencimento || 10;
    
    const opcoes = [];
    
    for (let i = -2; i <= 3; i++) {
      const anoFechamento = dataCompra.getFullYear();
      const mesFechamento = dataCompra.getMonth() + i;
      const dataFechamento = new Date(anoFechamento, mesFechamento, diaFechamento, 12, 0, 0);
      
      let anoVencimento = dataFechamento.getFullYear();
      let mesVencimento = dataFechamento.getMonth();
      
      if (diaVencimento <= diaFechamento) {
        mesVencimento += 1;
      }
      
      const dataVencimento = new Date(anoVencimento, mesVencimento, diaVencimento, 12, 0, 0);
      const dataVencimentoString = `${dataVencimento.getFullYear()}-${String(dataVencimento.getMonth() + 1).padStart(2, '0')}-${String(dataVencimento.getDate()).padStart(2, '0')}`;
      
      opcoes.push({
        value: dataVencimentoString,
        label: `${dataVencimento.toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        }).replace('.', '')} - Venc: ${dataVencimento.toLocaleDateString('pt-BR')}`,
        isDefault: i === 0
      });
    }
    
    return opcoes;
  }, [formData.dataCompra, formData.cartaoId, cartoes]);

  const resetForm = useCallback(() => {
    const dataAtual = new Date().toISOString().split('T')[0];
    setFormData({
      valorTotal: '',
      dataCompra: dataAtual,
      descricao: '',
      categoria: '',
      categoriaTexto: '',
      subcategoria: '',
      subcategoriaTexto: '',
      cartaoId: '',
      numeroParcelas: 1,
      faturaVencimento: '',
      observacoes: ''
    });
    setErrors({});
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, []);

  // ✅ EFFECTS
  useEffect(() => {
    if (isOpen && user) {
      const carregarDados = async () => {
        try {
          const cartoesData = await fetchCartoes();
          setCartoes(cartoesData);
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
          showNotification('Erro ao carregar dados', 'error');
        }
      };
      carregarDados();
    }
  }, [isOpen, user, fetchCartoes, showNotification]);

  useEffect(() => {
    if (isEditMode && transacaoEditando && categorias.length > 0) {
      console.log('🔄 Carregando dados para edição:', transacaoEditando);
      
      const valorFormatado = (transacaoEditando.valor || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      const categoria = categorias.find(c => c.id === transacaoEditando.categoria_id);
      
      let subcategoria = null;
      let subcategoriasDisponiveis = [];
      
      if (transacaoEditando.subcategoria_id) {
        try {
          subcategoriasDisponiveis = getSubcategoriasPorCategoria(transacaoEditando.categoria_id);
          subcategoria = subcategoriasDisponiveis.find(s => s.id === transacaoEditando.subcategoria_id);
        } catch (error) {
          console.warn('⚠️ Erro ao buscar subcategorias:', error);
        }
        
        if (!subcategoria && categoria?.subcategorias) {
          subcategoria = categoria.subcategorias.find(s => s.id === transacaoEditando.subcategoria_id);
        }
      }
      
      const dadosFormulario = {
        valorTotal: valorFormatado,
        dataCompra: transacaoEditando.data ? transacaoEditando.data.split('T')[0] : new Date().toISOString().split('T')[0],
        descricao: transacaoEditando.descricao || '',
        categoria: transacaoEditando.categoria_id || '',
        categoriaTexto: categoria?.nome || '',
        subcategoria: transacaoEditando.subcategoria_id || '',
        subcategoriaTexto: subcategoria?.nome || '',
        cartaoId: transacaoEditando.cartao_id || '',
        numeroParcelas: transacaoEditando.numero_parcelas || 1,
        faturaVencimento: transacaoEditando.fatura_vencimento || '',
        observacoes: transacaoEditando.observacoes || ''
      };
      
      console.log('📝 DADOS FINAIS DO FORMULÁRIO:', dadosFormulario);
      
      setFormData(dadosFormulario);
      
      if (subcategoria && subcategoriasDisponiveis.length > 0) {
        setSubcategoriasFiltradas(subcategoriasDisponiveis);
      }
    }
  }, [isEditMode, transacaoEditando, categorias, getSubcategoriasPorCategoria]);

  useEffect(() => {
    if (!isEditMode && formData.cartaoId && formData.dataCompra) {
      calcularOpcoesFatura().then(setOpcoesFatura);
    } else if (isEditMode) {
      setOpcoesFatura([{
        value: formData.faturaVencimento,
        label: `Fatura Atual - ${formData.faturaVencimento ? new Date(formData.faturaVencimento + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}`,
        isDefault: true
      }]);
    } else {
      setOpcoesFatura([]);
    }
  }, [formData.cartaoId, formData.dataCompra, calcularOpcoesFatura, isEditMode, formData.faturaVencimento]);

  useEffect(() => {
    if (!categoriasDisponiveis.length) return;
    const filtradas = formData.categoriaTexto 
      ? categoriasDisponiveis.filter(cat => cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase()))
      : categoriasDisponiveis;
    setCategoriasFiltradas(filtradas);
  }, [formData.categoriaTexto, categoriasDisponiveis]);

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

  useEffect(() => {
    if (!isEditMode && formData.cartaoId && formData.dataCompra && opcoesFatura.length > 0) {
      const faturaDefault = opcoesFatura.find(opcao => opcao.isDefault);
      if (faturaDefault && !formData.faturaVencimento) {
        setFormData(prev => ({
          ...prev,
          faturaVencimento: faturaDefault.value
        }));
      }
    }
  }, [formData.cartaoId, formData.dataCompra, opcoesFatura, formData.faturaVencimento, isEditMode]);

  useEffect(() => {
    if (isOpen && !isEditMode) {
      resetForm();
      const timer = setTimeout(() => valorInputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetForm, isEditMode]);

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
  }, [isOpen]);

  // ✅ HANDLERS
  const handleCancelar = useCallback(() => {
    if (!isEditMode) {
      resetForm();
    }
    onClose();
  }, [resetForm, onClose, isEditMode]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'categoria') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subcategoria: '',
        subcategoriaTexto: ''
      }));
    } else if (name === 'numeroParcelas') {
      const parcelas = Math.max(1, parseInt(value) || 1);
      setFormData(prev => ({
        ...prev,
        [name]: parcelas
      }));
    } else if (name === 'cartaoId') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        faturaVencimento: isEditMode ? prev.faturaVencimento : ''
      }));
    } else if (name === 'dataCompra') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        faturaVencimento: isEditMode ? prev.faturaVencimento : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors, isEditMode]);

  const handleValorChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, valorTotal: valorFormatado }));
    if (errors.valorTotal) {
      setErrors(prev => ({ ...prev, valorTotal: null }));
    }
  }, [formatarValor, errors.valorTotal]);

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

  const handleSelecionarCategoria = useCallback((categoria) => {
    setFormData(prev => ({
      ...prev,
      categoria: categoria.id,
      categoriaTexto: categoria.nome,
      subcategoria: '',
      subcategoriaTexto: ''
    }));
    setCategoriaDropdownOpen(false);
  }, []);

  const handleCategoriaBlur = useCallback(() => {
    const timer = setTimeout(() => {
      setCategoriaDropdownOpen(false);
      if (formData.categoriaTexto && !formData.categoria) {
        const existe = categoriasDisponiveis.find(cat => 
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
  }, [formData.categoriaTexto, formData.categoria, categoriasDisponiveis]);

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

  const handleConfirmarCriacao = useCallback(async () => {
    try {
      if (confirmacao.type === 'categoria') {
        const resultado = await addCategoria({
          nome: confirmacao.nome,
          tipo: 'despesa',
          cor: '#EF4444'
        });
        
        if (resultado.success) {
          setFormData(prev => ({
            ...prev,
            categoria: resultado.data.id,
            categoriaTexto: resultado.data.nome
          }));
          showNotification(`Categoria "${confirmacao.nome}" criada com sucesso!`, 'success');
        } else {
          throw new Error(resultado.error);
        }
        
      } else if (confirmacao.type === 'subcategoria') {
        const resultado = await addSubcategoria(confirmacao.categoriaId, {
          nome: confirmacao.nome
        });
        
        if (resultado.success) {
          setFormData(prev => ({
            ...prev,
            subcategoria: resultado.data.id,
            subcategoriaTexto: resultado.data.nome
          }));
          showNotification(`Subcategoria "${confirmacao.nome}" criada com sucesso!`, 'success');
        } else {
          throw new Error(resultado.error);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar categoria/subcategoria:', error);
      showNotification('Erro inesperado. Tente novamente.', 'error');
    }
    
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, [confirmacao, addCategoria, addSubcategoria, showNotification]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!valorNumerico || valorNumerico === 0) {
      newErrors.valorTotal = "Valor é obrigatório";
    }
    if (!formData.dataCompra) {
      newErrors.dataCompra = "Data é obrigatória";
    }
    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição é obrigatória";
    }
    if (!formData.categoria && !formData.categoriaTexto.trim()) {
      newErrors.categoria = "Categoria é obrigatória";
    }
    if (!formData.cartaoId) {
      newErrors.cartaoId = "Cartão é obrigatório";
    }
    if (!formData.faturaVencimento) {
      newErrors.faturaVencimento = "Fatura é obrigatória";
    }
    if (!isEditMode) {
      if (formData.numeroParcelas < 1) {
        newErrors.numeroParcelas = "Número de parcelas deve ser pelo menos 1";
      }
      if (formData.numeroParcelas > 1 && valorNumerico < 10) {
        newErrors.numeroParcelas = "Para parcelar, valor mínimo deve ser R$ 10,00";
      }
    }
    if (formData.observacoes && formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico, isEditMode]);

  const salvarDespesaCartao = useCallback(async () => {
    try {
      console.log('💾 Iniciando operação via hook:', {
        isEditMode,
        valor: valorNumerico,
        transacaoId: transacaoEditando?.id
      });
      
      if (isEditMode) {
        const resultado = await editarTransacao(transacaoEditando.id, {
          categoria_id: formData.categoria,
          subcategoria_id: formData.subcategoria || null,
          descricao: formData.descricao.trim(),
          valor: valorNumerico,
          data: formData.dataCompra,
          observacoes: formData.observacoes.trim() || null
        });
        
        if (!resultado.success) {
          throw new Error(resultado.error);
        }
        
        return [resultado];
        
      } else {
        if (formData.numeroParcelas === 1) {
          const resultado = await criarDespesaCartao({
            cartao_id: formData.cartaoId,
            categoria_id: formData.categoria,
            subcategoria_id: formData.subcategoria || null,
            descricao: formData.descricao.trim(),
            valor: valorNumerico,
            data_compra: formData.dataCompra,
            fatura_vencimento: formData.faturaVencimento,
            observacoes: formData.observacoes.trim() || null
          });
          
          if (!resultado.success) {
            throw new Error(resultado.error);
          }
          
          return [resultado];
          
        } else {
          const resultado = await criarDespesaParcelada({
            cartao_id: formData.cartaoId,
            categoria_id: formData.categoria,
            subcategoria_id: formData.subcategoria || null,
            descricao: formData.descricao.trim(),
            valor_total: valorNumerico,
            numero_parcelas: formData.numeroParcelas,
            data_compra: formData.dataCompra,
            fatura_vencimento: formData.faturaVencimento,
            observacoes: formData.observacoes.trim() || null
          });
          
          if (!resultado.success) {
            throw new Error(resultado.error);
          }
          
          return [resultado];
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar via hook:', error);
      throw error;
    }
  }, [formData, valorNumerico, criarDespesaCartao, criarDespesaParcelada, editarTransacao, isEditMode, transacaoEditando]);

  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await salvarDespesaCartao();
      
      if (onSave) onSave();
      
      if (isEditMode) {
        showNotification('Transação editada com sucesso!', 'success');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (criarNova) {
        showNotification('Despesa de cartão salva! Pronto para a próxima.', 'success');
        setFormData(prev => ({
          ...prev,
          valorTotal: '',
          dataCompra: new Date().toISOString().split('T')[0],
          descricao: '',
          numeroParcelas: 1,
          faturaVencimento: '',
          observacoes: ''
        }));
        setErrors({});
        setTimeout(() => valorInputRef.current?.focus(), 100);
      } else {
        showNotification('Despesa de cartão registrada com sucesso!', 'success');
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar despesa de cartão:', error);
      showNotification(`Erro ao salvar: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, salvarDespesaCartao, onSave, showNotification, resetForm, onClose, isEditMode]);

  if (!isOpen) return null;

  const isLoadingData = cartoesLoading || categoriasLoading;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="forms-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className={`modal-icon-container ${isEditMode ? 'modal-icon-blue' : 'modal-icon-purple'}`}>
              {isEditMode ? <Edit3 size={18} /> : <CreditCard size={18} />}
            </div>
            <div>
              <h2 className="modal-title">
                {isEditMode ? 'Editar Despesa do Cartão' : 'Despesa com Cartão'}
              </h2>
              <p className="modal-subtitle">
                {isEditMode 
                  ? 'Altere os dados da transação do cartão' 
                  : 'Registre compras no cartão de crédito'
                }
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="modal-body">
          {isLoadingData ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Carregando dados...</p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)}>
              
              <h3 className="section-title">
                {isEditMode ? 'Dados da Transação' : 'Informações da Compra'}
              </h3>
              
              {/* Valor e Data */}
              <div className="flex gap-3 row mb-3">
                <div>
                  <label className="form-label">
                    <DollarSign size={14} />
                    Valor Total *
                  </label>
                  <input
                    ref={valorInputRef}
                    type="text"
                    value={formData.valorTotal}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    disabled={submitting}
                    className={`input-money input-money-highlight ${errors.valorTotal ? 'error' : ''}`}
                  />
                  {errors.valorTotal && <div className="form-error">{errors.valorTotal}</div>}
                </div>
                
                <div>
                  <label className="form-label">
                    <Calendar size={14} />
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    name="dataCompra"
                    value={formData.dataCompra}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`input-date ${errors.dataCompra ? 'error' : ''}`}
                  />
                  {errors.dataCompra && <div className="form-error">{errors.dataCompra}</div>}
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <FileText size={14} />
                  Descrição *
                </label>
                <input
                  type="text"
                  name="descricao"
                  placeholder="Ex: Compra na Amazon, Mercado, Combustível"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`input-text ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && <div className="form-error">{errors.descricao}</div>}
              </div>

              {/* Categoria */}
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

              {/* Subcategoria */}
              {categoriaSelecionada && (
                <div className="flex flex-col mb-3">
                  <label className="form-label">
                    <Tag size={14} />
                    Subcategoria ({subcategoriasDaCategoria.length} disponíveis)
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

              {/* Cartão e Parcelas */}
              <div className="flex gap-3 row mb-3">
                <div>
                  <label className="form-label">
                    <CreditCard size={14} />
                    Cartão *
                  </label>
                  <div className="select-search">
                    <select
                      name="cartaoId"
                      value={formData.cartaoId}
                      onChange={handleInputChange}
                      disabled={submitting || isEditMode}
                      className={`${errors.cartaoId ? 'error' : ''}`}
                    >
                      <option value="">Selecione um cartão</option>
                      {cartoesParaEdicao.map(cartao => (
                        <option key={cartao.id} value={cartao.id}>
                          {cartao.nome} ({cartao.bandeira})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.cartaoId && <div className="form-error">{errors.cartaoId}</div>}
                  {isEditMode && (
                    <small className="form-help-text">
                    </small>
                  )}
                </div>
                
                {!isEditMode && (
                  <div>
                    <label className="form-label">
                      <Hash size={14} />
                      Parcelas *
                    </label>
                    <div className="select-search">
                      <select
                        name="numeroParcelas"
                        value={formData.numeroParcelas}
                        onChange={handleInputChange}
                        disabled={submitting || isEditMode}
                        className={errors.numeroParcelas ? 'error' : ''}
                      >
                        {opcoesParcelamento.map(opcao => (
                          <option key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.numeroParcelas && <div className="form-error">{errors.numeroParcelas}</div>}
                  </div>
                )}
              </div>

              {/* Fatura de Vencimento */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <Calendar size={14} />
                  Fatura de Vencimento *
                  {!isEditMode && <small className="form-label-small">(primeira parcela)</small>}
                </label>
                <div className="select-search">
                  <select
                    name="faturaVencimento"
                    value={formData.faturaVencimento}
                    onChange={handleInputChange}
                    disabled={submitting || !formData.cartaoId || isEditMode}
                    className={`${!formData.cartaoId || isEditMode ? 'input-disabled' : ''} ${errors.faturaVencimento ? 'error' : ''}`}
                  >
                    <option value="">
                      {!formData.cartaoId ? "Selecione um cartão primeiro" : "Selecione a fatura"}
                    </option>
                    {opcoesFatura.map(opcao => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.faturaVencimento && <div className="form-error">{errors.faturaVencimento}</div>}
                {isEditMode && (
                  <small className="form-help-text">
                    💡 Fatura não pode ser alterada na edição
                  </small>
                )}
              </div>

              {/* Preview do Parcelamento */}
              {!isEditMode && valorNumerico > 0 && formData.numeroParcelas > 0 && formData.faturaVencimento && (
                <div className="summary-panel summary-panel-purple mb-3">
                  <div className="parcelamento-preview">
                    <div className="parcelamento-header">
                      💳 {formData.numeroParcelas}x de {formatCurrency(valorParcela)}
                    </div>
                    
                    {formData.numeroParcelas > 1 && (
                      <div className="parcelamento-detalhes">
                        <div className="parcelamento-total">
                          Total: {formatCurrency(valorNumerico)}
                        </div>
                          <div className="parcelamento-cronograma">
                            <strong>Cronograma: </strong>
                            {Array.from({ length: Math.min(formData.numeroParcelas, 6) }, (_, i) => {
                              const dataParcela = calcularDataVencimentoParcela(formData.faturaVencimento, i + 1);
                              if (!dataParcela) return null;

                              const dataFormatada = new Date(dataParcela + 'T12:00:00').toLocaleDateString('pt-BR', {
                                month: 'short',
                                year: 'numeric'
                              }).replace('.', '');

                              return (
                                <span key={i} className="parcela-cronograma">
                                  {i + 1}ª: {dataFormatada}
                                  {i < Math.min(formData.numeroParcelas, 6) - 1 && ' • '}
                                </span>
                              );
                            })}
                            {formData.numeroParcelas > 6 && (
                              <span className="parcela-cronograma">
                                +{formData.numeroParcelas - 6} mais...
                              </span>
                            )}
                          </div>

                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <FileText size={14} />
                  Observações <small className="form-label-small">(máx. 300)</small>
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Adicione informações extras sobre esta compra"
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

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={submitting}
            className="btn-cancel"
          >
            Cancelar
          </button>
          
          {isEditMode ? (
            <button
              type="submit"
              onClick={(e) => handleSubmit(e, false)}
              disabled={submitting || isLoadingData}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <div className="btn-spinner"></div>
                  Salvando Alterações...
                </>
              ) : (
                <>
                  <Edit3 size={14} />
                  Salvar Alterações
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting || isLoadingData}
                className="btn-secondary btn-secondary--success"
              >
                {submitting ? (
                  <>
                    <div className="btn-spinner"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <PlusCircle size={14} />
                    Continuar Adicionando
                  </>
                )}
              </button>
              <button
                type="submit"
                onClick={(e) => handleSubmit(e, false)}
                disabled={submitting || isLoadingData}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <div className="btn-spinner"></div>
                    {formData.numeroParcelas > 1 ? `Criando ${formData.numeroParcelas} parcelas...` : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    {formData.numeroParcelas > 1 ? `Parcelar em ${formData.numeroParcelas}x` : 'Adicionar no Cartão'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de Confirmação para Criar Categoria/Subcategoria */}
      {confirmacao.show && (
        <div className="modal-overlay-confirmation">
          <div className="forms-modal-container modal-small">
            <div className="modal-header">
              <h3 className="modal-title">
                Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
              </h3>
            </div>
            <div className="modal-body">
              <p className="confirmation-message">
                {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
                <strong className="confirmation-name">"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
              </p>
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

      {/* Display de Error */}
      {(cartoesError || operationError) && (
        <div className="modal-overlay-error">
          <div className="error-toast">
            {cartoesError || operationError}
          </div>
        </div>
      )}
    </div>
  );
};

DespesasCartaoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  transacaoEditando: PropTypes.object
};

export default React.memo(DespesasCartaoModal);