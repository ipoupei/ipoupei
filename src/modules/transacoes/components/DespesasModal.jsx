// src/modules/transacoes/components/DespesasModal.jsx - VERSÃO COMPLETA
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
  CreditCard,
  Receipt,
  HelpCircle
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import useContas from '@modules/contas/hooks/useContas';
import '@shared/styles/FormsModal.css';

const DespesasModal = ({ isOpen, onClose, onSave, transacaoEditando }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const { contas, recalcularSaldos } = useContas();
  
  const valorInputRef = useRef(null);
  const isEditMode = Boolean(transacaoEditando);

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipoDespesa, setTipoDespesa] = useState('extra');

  // Estados para dados
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [cartoes, setCartoes] = useState([]);

  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriaSelectedIndex, setCategoriaSelectedIndex] = useState(-1);
  const [subcategoriaSelectedIndex, setSubcategoriaSelectedIndex] = useState(-1);

  // Estado para confirmação
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
    nome: '',
    categoriaId: ''
  });

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
    cartao: '',
    efetivado: true,
    observacoes: '',
    frequenciaPrevisivel: 'mensal',
    numeroParcelas: 12,
    frequenciaParcelada: 'mensal',
    usarCartao: false,
    totalRecorrencias: 12,
    tipoRecorrencia: 'mensal',
    primeiroEfetivado: true,
    primeiraParcela: new Date().toISOString().split('T')[0]
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
      icone: <CreditCard size={16} />, 
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

  const opcoesParcelas = Array.from({ length: 60 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${i === 0 ? 'parcela' : 'parcelas'}`
  }));

  const opcoesQuantidade = Array.from({ length: 60 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${i === 0 ? 'vez' : 'vezes'}`
  }));

  // ===== FUNÇÕES UTILITÁRIAS =====
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

  const valorNumerico = useMemo(() => {
    if (!formData.valor) return 0;
    const valorString = formData.valor.toString();
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

  const contasAtivas = useMemo(() => 
    contas.filter(conta => conta.ativo !== false), 
    [contas]
  );

  const cartoesAtivos = useMemo(() => 
    cartoes.filter(cartao => cartao.ativo !== false), 
    [cartoes]
  );

  const categoriaSelecionada = useMemo(() => 
    categorias.find(cat => cat.id === formData.categoria), 
    [categorias, formData.categoria]
  );

  const subcategoriasDaCategoria = useMemo(() => 
    subcategorias.filter(sub => sub.categoria_id === formData.categoria), 
    [subcategorias, formData.categoria]
  );

  const categoriasFiltradas = useMemo(() => {
    if (!categorias.length) return [];
    return formData.categoriaTexto 
      ? categorias.filter(cat => cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase()))
      : categorias;
  }, [formData.categoriaTexto, categorias]);

  const subcategoriasFiltradas = useMemo(() => {
    if (!subcategoriasDaCategoria.length) return [];
    return formData.subcategoriaTexto 
      ? subcategoriasDaCategoria.filter(sub => sub.nome.toLowerCase().includes(formData.subcategoriaTexto.toLowerCase()))
      : subcategoriasDaCategoria;
  }, [formData.subcategoriaTexto, subcategoriasDaCategoria]);

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

  // ===== PREENCHIMENTO PARA EDIÇÃO =====
  const preencherFormularioEdicao = useCallback(() => {
    if (!transacaoEditando) return;
    
    console.log('🖊️ Preenchendo formulário para edição:', transacaoEditando);
    
    // Determinar tipo de despesa baseado na descrição e dados
    let tipoDetectado = 'extra';
    if (transacaoEditando.descricao && /\(\d+\/\d+\)/.test(transacaoEditando.descricao)) {
      if (transacaoEditando.total_parcelas > 1) {
        tipoDetectado = 'parcelada';
      } else {
        tipoDetectado = 'previsivel';
      }
    }
    
    // Formatar valor para exibição
    const valorFormatado = transacaoEditando.valor ? 
      transacaoEditando.valor.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) : '';
    
    // Buscar nomes de categoria e subcategoria
    const categoria = categorias.find(c => c.id === transacaoEditando.categoria_id);
    const subcategoria = subcategorias.find(s => s.id === transacaoEditando.subcategoria_id);
    
    setTipoDespesa(tipoDetectado);
    setFormData({
      valor: valorFormatado,
      data: transacaoEditando.data || new Date().toISOString().split('T')[0],
      descricao: transacaoEditando.descricao?.replace(/\s\(\d+\/\d+\)$/, '') || '',
      categoria: transacaoEditando.categoria_id || '',
      categoriaTexto: categoria?.nome || '',
      subcategoria: transacaoEditando.subcategoria_id || '',
      subcategoriaTexto: subcategoria?.nome || '',
      conta: transacaoEditando.conta_id || '',
      cartao: transacaoEditando.cartao_id || '',
      efetivado: transacaoEditando.efetivado ?? true,
      observacoes: transacaoEditando.observacoes || '',
      frequenciaPrevisivel: 'mensal',
      numeroParcelas: transacaoEditando.total_parcelas || 12,
      frequenciaParcelada: 'mensal',
      usarCartao: Boolean(transacaoEditando.cartao_id),
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true,
      primeiraParcela: transacaoEditando.data || new Date().toISOString().split('T')[0]
    });
  }, [transacaoEditando, categorias, subcategorias]);

  // ===== HANDLERS DE INPUT =====
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let inputValue = type === 'checkbox' ? checked : value;
    
    if (name === 'numeroParcelas' || name === 'totalRecorrencias') {
      inputValue = parseFloat(value) || 1;
    }
    
    if (name === 'usarCartao') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: inputValue,
        conta: inputValue ? '' : prev.conta,
        cartao: inputValue ? prev.cartao : ''
      }));
    } else if (name === 'categoria') {
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

  const handleValorChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, valor: valorFormatado }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  }, [formatarValor, errors.valor]);

  const handleTipoChange = useCallback((novoTipo) => {
    setTipoDespesa(novoTipo);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.numeroParcelas;
      delete newErrors.totalRecorrencias;
      return newErrors;
    });
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
    setCategoriaSelectedIndex(-1);
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
    setCategoriaSelectedIndex(-1);
  }, []);

  const handleCategoriaBlur = useCallback(() => {
    setTimeout(() => {
      setCategoriaDropdownOpen(false);
      setCategoriaSelectedIndex(-1);
      
      // Verificar se precisa criar categoria
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
  }, [formData.categoriaTexto, formData.categoria, categorias]);

  const handleCategoriaKeyDown = useCallback((e) => {
    if (!categoriaDropdownOpen || categoriasFiltradas.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setCategoriaSelectedIndex(prev => 
          prev < categoriasFiltradas.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCategoriaSelectedIndex(prev => 
          prev > 0 ? prev - 1 : categoriasFiltradas.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (categoriaSelectedIndex >= 0 && categoriaSelectedIndex < categoriasFiltradas.length) {
          handleSelecionarCategoria(categoriasFiltradas[categoriaSelectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setCategoriaDropdownOpen(false);
        setCategoriaSelectedIndex(-1);
        break;
    }
  }, [categoriaDropdownOpen, categoriasFiltradas, categoriaSelectedIndex, handleSelecionarCategoria]);

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
      setSubcategoriaSelectedIndex(-1);
    }
  }, [categoriaSelecionada]);

  const handleSelecionarSubcategoria = useCallback((subcategoria) => {
    setFormData(prev => ({
      ...prev,
      subcategoria: subcategoria.id,
      subcategoriaTexto: subcategoria.nome
    }));
    setSubcategoriaDropdownOpen(false);
    setSubcategoriaSelectedIndex(-1);
  }, []);

  const handleSubcategoriaBlur = useCallback(() => {
    setTimeout(() => {
      setSubcategoriaDropdownOpen(false);
      setSubcategoriaSelectedIndex(-1);
      
      // Verificar se precisa criar subcategoria
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
  }, [formData.subcategoriaTexto, formData.subcategoria, formData.categoria, categoriaSelecionada, subcategoriasDaCategoria]);

  const handleSubcategoriaKeyDown = useCallback((e) => {
    if (!subcategoriaDropdownOpen || subcategoriasFiltradas.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSubcategoriaSelectedIndex(prev => 
          prev < subcategoriasFiltradas.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSubcategoriaSelectedIndex(prev => 
          prev > 0 ? prev - 1 : subcategoriasFiltradas.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (subcategoriaSelectedIndex >= 0 && subcategoriaSelectedIndex < subcategoriasFiltradas.length) {
          handleSelecionarSubcategoria(subcategoriasFiltradas[subcategoriaSelectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSubcategoriaDropdownOpen(false);
        setSubcategoriaSelectedIndex(-1);
        break;
    }
  }, [subcategoriaDropdownOpen, subcategoriasFiltradas, subcategoriaSelectedIndex, handleSelecionarSubcategoria]);

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

  // ===== CARREGAR DADOS =====
  const carregarDados = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [categoriasRes, subcategoriasRes, cartoesRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('usuario_id', user.id).eq('tipo', 'despesa').eq('ativo', true).order('nome'),
        supabase.from('subcategorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome'),
        supabase.from('cartoes').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
      setCartoes(cartoesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados', 'error');
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
      cartao: '',
      efetivado: true,
      observacoes: '',
      frequenciaPrevisivel: 'mensal',
      numeroParcelas: 12,
      frequenciaParcelada: 'mensal',
      usarCartao: false,
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true,
      primeiraParcela: dataAtual
    });
    setErrors({});
    setTipoDespesa('extra');
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setCategoriaSelectedIndex(-1);
    setSubcategoriaSelectedIndex(-1);
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
    if (formData.usarCartao && !formData.cartao) {
      newErrors.cartao = "Cartão é obrigatório quando selecionado";
    }
    if (!formData.usarCartao && !formData.conta) {
      newErrors.conta = "Conta é obrigatória";
    }
    if (formData.observacoes && formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
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
  }, [formData, tipoDespesa, valorNumerico]);

  // ===== ATUALIZAR TRANSAÇÃO =====
  const atualizarTransacao = useCallback(async () => {
    try {
      const dadosAtualizacao = {
        data: formData.data,
        descricao: formData.descricao.trim(),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        conta_id: formData.usarCartao ? null : formData.conta,
        cartao_id: formData.usarCartao ? formData.cartao : null,
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
  }, [formData, valorNumerico, transacaoEditando, user.id, showNotification]);

  // ===== CRIAR DESPESAS =====
  const criarDespesas = useCallback(async () => {
    try {
      const dadosBase = {
        usuario_id: user.id,
        descricao: formData.descricao.trim(),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        conta_id: formData.usarCartao ? null : formData.conta,
        cartao_id: formData.usarCartao ? formData.cartao : null,
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
          
          const totalRecorrencias = tipoDespesa === 'previsivel' ? 
            formData.totalRecorrencias : 
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
              grupo_recorrencia: grupoId
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
      await recalcularSaldos();
      
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
  }, [validateForm, criarDespesas, recalcularSaldos, onSave, showNotification, resetForm, onClose, isEditMode, atualizarTransacao]);

  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // ===== EFFECTS =====
  useEffect(() => {
    if (isOpen && user) {
      carregarDados();
    }
  }, [isOpen, user, carregarDados]);

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

  const corAtual = tiposDespesa.find(t => t.id === tipoDespesa)?.cor || '#EF4444';

  return (
    <div className="modal-overlay">
      <div className="modal-container despesas-layout">
        {/* Header */}
        <div className="modal-header simple">
          <h2 className="modal-title">
            <div className="form-icon-wrapper" style={{ background: corAtual }}>
              {isEditMode ? <Edit size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <div className="form-title-main">
                {isEditMode ? 'Editar Despesa' : 'Nova Despesa'}
              </div>
              <div className="form-title-subtitle">
                {isEditMode ? 'Atualize os dados da despesa' : 'Registre um novo gasto'}
              </div>
            </div>
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="form-loading">
              <div className="form-loading-spinner"></div>
              <p>Carregando dados...</p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="form despesas-form">
              
              {/* VALOR E DATA */}
              <div className="form-row primeira-linha">
                <div className="form-field valor-field">
                  <label className="form-label">
                    <DollarSign size={14} />
                    {tipoDespesa === 'parcelada' ? 'Valor por Parcela' : 'Valor'} *
                  </label>
                  <input
                    ref={valorInputRef}
                    type="text"
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    disabled={submitting}
                    className={`form-input valor-input despesa-valor ${errors.valor ? 'error' : ''}`}
                  />
                  {errors.valor && <div className="form-error">{errors.valor}</div>}
                </div>
                
                <div className="form-field data-field">
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
                    className={`form-input data-input ${errors.data ? 'error' : ''}`}
                  />
                  {errors.data && <div className="form-error">{errors.data}</div>}
                </div>
              </div>

              {/* ESCOLHA DO TIPO */}
              {!isEditMode && (
                <div className="form-section tipo-section">
                  <div className="section-header">
                    <span className="section-subtitle">Escolha o tipo e preencha os dados</span>
                  </div>
                  
                  <div className="tipos-buttons despesa-tipos">
                    {tiposDespesa.map((tipo) => (
                      <div key={tipo.id} className="tipo-wrapper">
                        <button
                          type="button"
                          className={`tipo-button ${tipoDespesa === tipo.id ? 'active' : ''}`}
                          onClick={() => handleTipoChange(tipo.id)}
                          disabled={submitting}
                          style={{ '--cor-tipo': tipo.cor }}
                          title={tipo.tooltip}
                        >
                          <div className="tipo-icon">{tipo.icone}</div>
                          <div className="tipo-content">
                            <div className="tipo-nome">{tipo.nome}</div>
                            <div className="tipo-desc">{tipo.descricao}</div>
                          </div>
                        </button>
                        <div className="tipo-tooltip">
                          <HelpCircle size={12} />
                          <div className="tooltip-content">{tipo.tooltip}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATUS */}
              <div className="form-section status-section">
                <label className="form-label status-label">
                  <CheckCircle size={14} />
                  Status da {tipoDespesa === 'extra' ? 'Despesa' : 'Primeira'}
                </label>
                <div className="status-options">
                  <label className={`status-option ${formData.efetivado ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      checked={formData.efetivado === true}
                      onChange={() => setFormData(prev => ({ ...prev, efetivado: true }))}
                      disabled={submitting}
                    />
                    <CheckCircle size={16} />
                    <div className="status-content">
                      <div className="status-title">Primeira já paga</div>
                      <div className="status-subtitle">Dinheiro saiu da conta</div>
                    </div>
                  </label>
                  <label className={`status-option ${!formData.efetivado ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      checked={formData.efetivado === false}
                      onChange={() => setFormData(prev => ({ ...prev, efetivado: false }))}
                      disabled={submitting}
                    />
                    <Clock size={16} />
                    <div className="status-content">
                      <div className="status-title">Todas planejadas</div>
                      <div className="status-subtitle">A pagar</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS POR TIPO */}
              {tipoDespesa === 'previsivel' && !isEditMode && (
                <div className="form-row tipo-fields">
                  <div className="form-field">
                    <label className="form-label">
                      <Repeat size={14} />
                      Frequência *
                    </label>
                    <select
                      name="frequenciaPrevisivel"
                      value={formData.frequenciaPrevisivel}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className="form-input"
                    >
                      {opcoesFrequencia.map(opcao => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">
                      <Hash size={14} />
                      Quantidade *
                    </label>
                    <select
                      name="totalRecorrencias"
                      value={formData.totalRecorrencias}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className="form-input"
                    >
                      {opcoesQuantidade.map(opcao => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {tipoDespesa === 'parcelada' && !isEditMode && (
                <div className="form-row tipo-fields">
                  <div className="form-field">
                    <label className="form-label">
                      <Repeat size={14} />
                      Frequência *
                    </label>
                    <select
                      name="frequenciaParcelada"
                      value={formData.frequenciaParcelada}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className="form-input"
                    >
                      {opcoesFrequencia.map(opcao => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">
                      <Hash size={14} />
                      Número de Parcelas *
                    </label>
                    <select
                      name="numeroParcelas"
                      value={formData.numeroParcelas}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className={`form-input ${errors.numeroParcelas ? 'error' : ''}`}
                    >
                      {opcoesParcelas.map(opcao => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                    {errors.numeroParcelas && <div className="form-error">{errors.numeroParcelas}</div>}
                  </div>
                </div>
              )}

              {/* PREVIEW */}
              {valorNumerico > 0 && (
                <div className={`preview-card despesa-${tipoDespesa}`} style={{ borderColor: corAtual + '40', background: corAtual + '10' }}>
                  <div className="preview-header">
                    {tiposDespesa.find(t => t.id === tipoDespesa)?.icone}
                    <strong>Despesa {tiposDespesa.find(t => t.id === tipoDespesa)?.nome}</strong>
                  </div>
                  <div className="preview-content">
                    <div className="preview-valor">{calculos.mensagemPrincipal}</div>
                    <div className="preview-info">{calculos.mensagemSecundaria}</div>
                  </div>
                </div>
              )}

              {/* DESCRIÇÃO */}
              <div className="form-field descricao-field">
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
                  className={`form-input descricao-input ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && <div className="form-error">{errors.descricao}</div>}
              </div>

              {/* CATEGORIA */}
              <div className="form-row categorias-row">
                <div className="form-field categoria-field">
                  <label className="form-label">
                    <Tag size={14} />
                    Categoria *
                  </label>
                  <div className="form-dropdown-wrapper">
                    <input
                      type="text"
                      value={formData.categoriaTexto}
                      onChange={handleCategoriaChange}
                      onBlur={handleCategoriaBlur}
                      onFocus={() => setCategoriaDropdownOpen(true)}
                      onKeyDown={handleCategoriaKeyDown}
                      placeholder="Digite ou selecione uma categoria"
                      disabled={submitting}
                      autoComplete="off"
                      className={`form-input categoria-input ${errors.categoria ? 'error' : ''}`}
                    />
                    <Search size={14} className="form-dropdown-icon" />
                    
                    {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
                      <div className="form-dropdown-options">
                        {categoriasFiltradas.map((categoria, index) => (
                          <div
                            key={categoria.id}
                            className={`form-dropdown-option despesa-context ${
                              index === categoriaSelectedIndex ? 'selected' : ''
                            }`}
                            onMouseDown={() => handleSelecionarCategoria(categoria)}
                            onMouseEnter={() => setCategoriaSelectedIndex(index)}
                          >
                            <div 
                              className="category-color"
                              style={{ backgroundColor: categoria.cor || '#ef4444' }}
                            />
                            {categoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.categoria && <div className="form-error">{errors.categoria}</div>}
                </div>

                <div className="form-field subcategoria-field">
                  <label className="form-label">
                    <Tag size={14} />
                    Subcategoria <small>({subcategoriasDaCategoria.length} disponíveis)</small>
                  </label>
                  <div className="form-dropdown-wrapper">
                    <input
                      type="text"
                      value={formData.subcategoriaTexto}
                      onChange={handleSubcategoriaChange}
                      onBlur={handleSubcategoriaBlur}
                      onFocus={() => setSubcategoriaDropdownOpen(true)}
                      onKeyDown={handleSubcategoriaKeyDown}
                      placeholder="Digite ou selecione uma subcategoria"
                      disabled={submitting || !categoriaSelecionada}
                      autoComplete="off"
                      className="form-input subcategoria-input"
                    />
                    <Search size={14} className="form-dropdown-icon" />
                    
                    {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
                      <div className="form-dropdown-options">
                        {subcategoriasFiltradas.map((subcategoria, index) => (
                          <div
                            key={subcategoria.id}
                            className={`form-dropdown-option ${
                              index === subcategoriaSelectedIndex ? 'selected' : ''
                            }`}
                            onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                            onMouseEnter={() => setSubcategoriaSelectedIndex(index)}
                          >
                            {subcategoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARTÃO OU CONTA */}
              <div className="form-section pagamento-section">
                <label className="form-label">
                  <Building size={14} />
                  Como vai pagar?
                </label>
                <div className="form-radio-group pagamento-radio">
                  <label className={`form-radio-option ${!formData.usarCartao ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="usarCartao"
                      checked={!formData.usarCartao}
                      onChange={() => handleInputChange({ target: { name: 'usarCartao', type: 'checkbox', checked: false }})}
                      disabled={submitting}
                    />
                    <Building size={16} />
                    <div>
                      <div>Débito/Dinheiro</div>
                      <small>Sai da conta na hora</small>
                    </div>
                  </label>
                  <label className={`form-radio-option ${formData.usarCartao ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="usarCartao"
                      checked={formData.usarCartao}
                      onChange={() => handleInputChange({ target: { name: 'usarCartao', type: 'checkbox', checked: true }})}
                      disabled={submitting}
                    />
                    <CreditCard size={16} />
                    <div>
                      <div>Cartão de Crédito</div>
                      <small>Paga na fatura</small>
                    </div>
                  </label>
                </div>
              </div>

              {/* CONTA OU CARTÃO ESPECÍFICO */}
              {!formData.usarCartao ? (
                <div className="form-field conta-field">
                  <label className="form-label">
                    <Building size={14} />
                    Conta de Débito *
                  </label>
                  <select
                    name="conta"
                    value={formData.conta}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`form-input conta-select ${errors.conta ? 'error' : ''}`}
                  >
                    <option value="">Selecione uma conta</option>
                    {contasAtivas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} - {formatCurrency(conta.saldo || 0)}
                      </option>
                    ))}
                  </select>
                  {errors.conta && <div className="form-error">{errors.conta}</div>}
                  
                  {contasAtivas.length === 0 && (
                    <div className="form-info">
                      <small>Nenhuma conta ativa encontrada. Crie uma conta primeiro.</small>
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-field cartao-field">
                  <label className="form-label">
                    <CreditCard size={14} />
                    Cartão de Crédito *
                  </label>
                  <select
                    name="cartao"
                    value={formData.cartao}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`form-input cartao-select ${errors.cartao ? 'error' : ''}`}
                  >
                    <option value="">Selecione um cartão</option>
                    {cartoesAtivos.map(cartao => (
                      <option key={cartao.id} value={cartao.id}>
                        {cartao.nome} - Limite: {formatCurrency(cartao.limite || 0)}
                      </option>
                    ))}
                  </select>
                  {errors.cartao && <div className="form-error">{errors.cartao}</div>}
                  
                  {cartoesAtivos.length === 0 && (
                    <div className="form-info">
                      <small>Nenhum cartão ativo encontrado. Crie um cartão primeiro.</small>
                    </div>
                  )}
                </div>
              )}

              {/* OBSERVAÇÕES */}
              <div className="form-field observacoes-field">
                <label className="form-label">
                  <FileText size={14} />
                  Observações <small>(máx. 300)</small>
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Observações adicionais (opcional)..."
                  rows="2"
                  disabled={submitting}
                  maxLength="300"
                  className={`form-input form-textarea observacoes-textarea ${errors.observacoes ? 'error' : ''}`}
                />
                <div className="form-char-counter">
                  <span></span>
                  <span className={formData.observacoes.length > 250 ? 'text-danger' : ''}>
                    {formData.observacoes.length}/300
                  </span>
                </div>
                {errors.observacoes && <div className="form-error">{errors.observacoes}</div>}
              </div>

              {/* AÇÕES */}
              <div className="form-actions despesas-actions">
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={submitting}
                  className="form-btn form-btn-secondary cancelar-btn"
                >
                  Cancelar
                </button>
                
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={submitting}
                    className="form-btn form-btn-tertiary continuar-btn"
                    style={{ 
                      background: corAtual,
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {submitting ? (
                      <>
                        <div className="form-spinner"></div>
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
                  disabled={submitting}
                  className={`form-btn form-btn-primary adicionar-btn despesa-${tipoDespesa}`}
                  style={{
                    background: corAtual
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="form-spinner"></div>
                      {isEditMode ? 'Atualizando...' :
                       tipoDespesa === 'previsivel' ? `Criando ${formData.totalRecorrencias} despesas...` :
                       tipoDespesa === 'parcelada' ? `Criando ${formData.numeroParcelas} parcelas...` :
                       'Salvando...'}
                    </>
                  ) : (
                    <>
                      {isEditMode ? <Edit size={14} /> : <Plus size={14} />}
                      {isEditMode ? 'Atualizar Despesa' :
                       tipoDespesa === 'previsivel' ? `Criar ${formData.totalRecorrencias} Despesas` :
                       tipoDespesa === 'parcelada' ? `Parcelar em ${formData.numeroParcelas}x` :
                       'Adicionar Despesa Extra'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Modal de Confirmação */}
      {confirmacao.show && (
        <div className="confirmation-overlay">
          <div className="confirmation-container">
            <h3 className="confirmation-title">
              Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
            </h3>
            <p className="confirmation-message">
              {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
              <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
            </p>
            <div className="confirmation-actions">
              <button 
                onClick={() => setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' })}
                className="form-btn form-btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarCriacao}
                className="form-btn form-btn-primary despesa"
                style={{ background: '#EF4444' }}
              >
                Criar {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
              </button>
            </div>
          </div>
        </div>
      )}
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