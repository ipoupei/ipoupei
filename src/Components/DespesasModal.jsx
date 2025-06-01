// src/components/DespesasModal.jsx - VERSÃO ORIGINAL COM EDIÇÃO ADICIONADA
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
  CreditCard, 
  Building,
  CheckCircle,
  Clock,
  PlusCircle,
  X,
  Search,
  Edit
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabaseClient';
import './FormsModal.css';

const DespesasModal = ({ isOpen, onClose, onSave, transacaoEditando }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const valorInputRef = useRef(null);
  const isEditMode = Boolean(transacaoEditando);

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipoDespesa, setTipoDespesa] = useState('simples');

  // Estados para dados
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [contas, setContas] = useState([]);

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
    totalRecorrencias: 12,
    tipoRecorrencia: 'mensal',
    primeiroEfetivado: true,
    numeroParcelas: 2,
    primeiraParcela: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  // ✅ NOVA FUNÇÃO: Preencher formulário para edição
  const preencherFormularioEdicao = useCallback(() => {
    if (!transacaoEditando) return;
    
    console.log('🖊️ Preenchendo formulário para edição:', transacaoEditando);
    
    // Determinar tipo de despesa baseado na descrição e dados
    let tipoDetectado = 'simples';
    if (transacaoEditando.descricao && /\(\d+\/\d+\)/.test(transacaoEditando.descricao)) {
      if (transacaoEditando.total_parcelas > 1) {
        tipoDetectado = 'parcelada';
      } else {
        tipoDetectado = 'recorrente';
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
      descricao: transacaoEditando.descricao?.replace(/\s\(\d+\/\d+\)$/, '') || '', // Remove sufixo de parcela/recorrência
      categoria: transacaoEditando.categoria_id || '',
      categoriaTexto: categoria?.nome || '',
      subcategoria: transacaoEditando.subcategoria_id || '',
      subcategoriaTexto: subcategoria?.nome || '',
      conta: transacaoEditando.conta_id || '',
      efetivado: transacaoEditando.efetivado ?? true,
      observacoes: transacaoEditando.observacoes || '',
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true,
      numeroParcelas: transacaoEditando.total_parcelas || 2,
      primeiraParcela: transacaoEditando.data || new Date().toISOString().split('T')[0]
    });
  }, [transacaoEditando, categorias, subcategorias]);

  // Carregar dados quando modal abre
  useEffect(() => {
    if (isOpen && user) {
      carregarDados();
    }
  }, [isOpen, user]);

  // ✅ Preencher formulário quando dados estão carregados e há transação para editar
  useEffect(() => {
    if (isOpen && categorias.length > 0 && transacaoEditando) {
      preencherFormularioEdicao();
    }
  }, [isOpen, categorias.length, transacaoEditando, preencherFormularioEdicao]);

  const carregarDados = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [categoriasRes, subcategoriasRes, contasRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('usuario_id', user.id).eq('tipo', 'despesa').eq('ativo', true).order('nome'),
        supabase.from('subcategorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome'),
        supabase.from('contas').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
      setContas(contasRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Formatação de valor DEFINITIVAMENTE CORRIGIDA
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

  // Valor numérico DEFINITIVAMENTE CORRIGIDO
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

  // Dados derivados
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

  // Opções para selects
  const opcoesRecorrencia = [
    { value: 'semanal', label: 'Semanal' },
    { value: 'quinzenal', label: 'Quinzenal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'anual', label: 'Anual' }
  ];

  const opcoesQuantidade = Array.from({ length: 60 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${i === 0 ? 'vez' : 'vezes'}`
  }));

  const opcoesParcelas = Array.from({ length: 47 }, (_, i) => ({
    value: i + 2,
    label: `${i + 2}x`
  }));

  // Cálculos
  const valorTotal = useMemo(() => {
    return tipoDespesa === 'recorrente' ? valorNumerico * formData.totalRecorrencias : valorNumerico;
  }, [valorNumerico, formData.totalRecorrencias, tipoDespesa]);

  const valorParcela = useMemo(() => {
    return tipoDespesa === 'parcelada' && formData.numeroParcelas > 0 
      ? valorNumerico / formData.numeroParcelas 
      : valorNumerico;
  }, [valorNumerico, formData.numeroParcelas, tipoDespesa]);

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

  // Reset form
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
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true,
      numeroParcelas: 2,
      primeiraParcela: dataAtual
    });
    setErrors({});
    setTipoDespesa('simples');
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, []);

  useEffect(() => {
    if (isOpen && !transacaoEditando) {
      resetForm();
      const timer = setTimeout(() => valorInputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, transacaoEditando, resetForm]);

  // Handler para ESC e cancelar
  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

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

  // Handlers de input
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let inputValue = type === 'checkbox' ? checked : value;
    
    if (name === 'totalRecorrencias' || name === 'numeroParcelas') {
      inputValue = parseFloat(value) || 0;
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

  const handleValorChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, valor: valorFormatado }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  }, [formatarValor, errors.valor]);

  // Handlers de categoria
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

  // Handlers de subcategoria
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

  // Criar categoria/subcategoria
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

  // Validação
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
    
    if (tipoDespesa === 'recorrente') {
      if (formData.totalRecorrencias < 1) {
        newErrors.totalRecorrencias = "Quantidade deve ser pelo menos 1";
      }
      if (formData.totalRecorrencias > 60) {
        newErrors.totalRecorrencias = "Máximo de 60 recorrências";
      }
    }

    if (tipoDespesa === 'parcelada') {
      if (formData.numeroParcelas < 2) {
        newErrors.numeroParcelas = "Mínimo de 2 parcelas";
      }
      if (formData.numeroParcelas > 48) {
        newErrors.numeroParcelas = "Máximo de 48 parcelas";
      }
      if (!formData.primeiraParcela) {
        newErrors.primeiraParcela = "Data da primeira parcela é obrigatória";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, tipoDespesa, valorNumerico]);

  // ✅ NOVA FUNÇÃO: Atualizar transação existente
  const atualizarTransacao = useCallback(async () => {
    try {
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
  }, [formData, valorNumerico, transacaoEditando, user.id, showNotification]);

  // Submissão
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // ✅ MODO EDIÇÃO: Atualizar transação existente
      if (isEditMode) {
        await atualizarTransacao();
        
        if (onSave) onSave();
        
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
        
        return;
      }
      
      // MODO CRIAÇÃO: Lógica original mantida
      if (tipoDespesa === 'recorrente') {
        const despesas = [];
        const dataBase = new Date(formData.data);
        
        for (let i = 0; i < formData.totalRecorrencias; i++) {
          const dataDespesa = new Date(dataBase);
          
          switch (formData.tipoRecorrencia) {
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
          
          despesas.push({
            usuario_id: user.id,
            data: dataDespesa.toISOString().split('T')[0],
            descricao: `${formData.descricao.trim()} (${i + 1}/${formData.totalRecorrencias})`,
            categoria_id: formData.categoria,
            subcategoria_id: formData.subcategoria || null,
            conta_id: formData.conta,
            valor: valorNumerico,
            tipo: 'despesa',
            efetivado: i === 0 ? formData.primeiroEfetivado : false,
            observacoes: formData.observacoes.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        const { error } = await supabase.from('transacoes').insert(despesas);
        if (error) throw error;
        
        showNotification(`${formData.totalRecorrencias} despesas recorrentes criadas!`, 'success');
        
      } else if (tipoDespesa === 'parcelada') {
        const parcelas = [];
        const dataBase = new Date(formData.primeiraParcela);
        
        for (let i = 0; i < formData.numeroParcelas; i++) {
          const dataParcela = new Date(dataBase);
          dataParcela.setMonth(dataParcela.getMonth() + i);
          
          parcelas.push({
            usuario_id: user.id,
            data: dataParcela.toISOString().split('T')[0],
            descricao: `${formData.descricao.trim()} (${i + 1}/${formData.numeroParcelas})`,
            categoria_id: formData.categoria,
            subcategoria_id: formData.subcategoria || null,
            conta_id: formData.conta,
            valor: valorParcela,
            tipo: 'despesa',
            efetivado: false,
            observacoes: formData.observacoes.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        const { error } = await supabase.from('transacoes').insert(parcelas);
        if (error) throw error;
        
        showNotification(`Despesa parcelada em ${formData.numeroParcelas}x criada!`, 'success');
        
      } else {
        const dadosDespesa = {
          usuario_id: user.id,
          data: formData.data,
          descricao: formData.descricao.trim(),
          categoria_id: formData.categoria,
          subcategoria_id: formData.subcategoria || null,
          conta_id: formData.conta,
          valor: valorNumerico,
          tipo: 'despesa',
          efetivado: formData.efetivado,
          observacoes: formData.observacoes.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase.from('transacoes').insert([dadosDespesa]);
        if (error) throw error;
        
        showNotification('Despesa registrada com sucesso!', 'success');
      }
      
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
  }, [validateForm, user.id, formData, tipoDespesa, valorParcela, valorNumerico, onSave, showNotification, resetForm, onClose, isEditMode, atualizarTransacao]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.1)' 
        }}>
          <h2 className="modal-title">
            <div className="form-icon-wrapper" style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white'
            }}>
              {isEditMode ? <Edit size={18} /> :
               tipoDespesa === 'recorrente' ? <Repeat size={18} /> : 
               tipoDespesa === 'parcelada' ? <CreditCard size={18} /> : 
               <TrendingDown size={18} />}
            </div>
            <div>
              <div className="form-title-main">
                {isEditMode ? 'Editar Despesa' :
                 tipoDespesa === 'recorrente' ? 'Despesas Recorrentes' : 
                 tipoDespesa === 'parcelada' ? 'Despesa Parcelada' : 
                 'Nova Despesa'}
              </div>
              <div className="form-title-subtitle">
                {isEditMode ? 'Atualize os dados da despesa' :
                 tipoDespesa === 'recorrente' ? 'Gastos que se repetem' : 
                 tipoDespesa === 'parcelada' ? 'Divida um gasto em parcelas' : 
                 'Registre um novo gasto'}
              </div>
            </div>
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="modal-content">
          {loading ? (
            <div className="form-loading">
              <div className="form-loading-spinner" style={{ borderTopColor: '#ef4444' }}></div>
              <p>Carregando dados...</p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="form">
              
              {/* ✅ Tipo de Despesa - Oculto no modo edição */}
              {!isEditMode && (
                <div className="form-field-group">
                  <label className="form-label">
                    <Tag size={14} />
                    Tipo de Despesa
                  </label>
                  <div className="form-radio-group despesa-tipo-grid">
                    {[
                      { value: 'simples', label: 'Simples', icon: <TrendingDown size={14} />, desc: 'Único' },
                      { value: 'recorrente', label: 'Recorrente', icon: <Repeat size={14} />, desc: 'Repetir' },
                      { value: 'parcelada', label: 'Parcelada', icon: <CreditCard size={14} />, desc: 'Dividir' }
                    ].map(tipo => (
                      <label
                        key={tipo.value}
                        className={`form-radio-option ${tipoDespesa === tipo.value ? 'selected despesa' : ''}`}
                      >
                        <input
                          type="radio"
                          name="tipoDespesa"
                          value={tipo.value}
                          checked={tipoDespesa === tipo.value}
                          onChange={(e) => setTipoDespesa(e.target.value)}
                        />
                        {tipo.icon}
                        <div>
                          <div>{tipo.label}</div>
                          <small>{tipo.desc}</small>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Valor e Data */}
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">
                    <DollarSign size={14} />
                    {tipoDespesa === 'parcelada' ? 'Valor Total' : 'Valor'} *
                  </label>
                  <input
                    ref={valorInputRef}
                    type="text"
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    disabled={submitting}
                    className={`form-input valor despesa ${errors.valor ? 'error' : ''}`}
                  />
                  {errors.valor && <div className="form-error">{errors.valor}</div>}
                </div>
                
                <div className="form-field">
                  <label className="form-label">
                    <Calendar size={14} />
                    {tipoDespesa === 'recorrente' ? 'Data Início' : 
                     tipoDespesa === 'parcelada' ? 'Data Compra' : 'Data'} *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`form-input ${errors.data ? 'error' : ''}`}
                  />
                  {errors.data && <div className="form-error">{errors.data}</div>}
                </div>
              </div>

              {/* Campos específicos por tipo - Ocultos no modo edição */}
              {tipoDespesa === 'recorrente' && !isEditMode && (
                <>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">
                        <Repeat size={14} />
                        Frequência *
                      </label>
                      <select
                        name="tipoRecorrencia"
                        value={formData.tipoRecorrencia}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="form-input"
                      >
                        {opcoesRecorrencia.map(opcao => (
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
                  
                  {/* Preview da Recorrência */}
                  {valorNumerico > 0 && formData.totalRecorrencias > 0 && (
                    <div className="form-preview despesa">
                      🔄 {formData.totalRecorrencias}x de {formatCurrency(valorNumerico)} ({formData.tipoRecorrencia})
                      <br />
                      <small>Total: {formatCurrency(valorTotal)}</small>
                    </div>
                  )}

                  {/* Status da primeira recorrência */}
                  <div className="form-field-group">
                    <label className="form-label">
                      <CheckCircle size={14} />
                      Status da Primeira Despesa
                    </label>
                    <div className="form-radio-group">
                      <label className={`form-radio-option ${formData.primeiroEfetivado ? 'selected despesa' : ''}`}>
                        <input
                          type="radio"
                          checked={formData.primeiroEfetivado === true}
                          onChange={() => setFormData(prev => ({ ...prev, primeiroEfetivado: true }))}
                          disabled={submitting}
                        />
                        <CheckCircle size={14} />
                        <div>
                          <div>Primeira já paga</div>
                          <small>Dinheiro saiu</small>
                        </div>
                      </label>
                      <label className={`form-radio-option ${!formData.primeiroEfetivado ? 'selected warning' : ''}`}>
                        <input
                          type="radio"
                          checked={formData.primeiroEfetivado === false}
                          onChange={() => setFormData(prev => ({ ...prev, primeiroEfetivado: false }))}
                          disabled={submitting}
                        />
                        <Clock size={14} />
                        <div>
                          <div>Todas planejadas</div>
                          <small>A pagar</small>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {tipoDespesa === 'parcelada' && !isEditMode && (
                <>
                  <div className="form-row">
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
                        className="form-input"
                      >
                        {opcoesParcelas.map(opcao => (
                          <option key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">
                        <Calendar size={14} />
                        Primeira Parcela *
                      </label>
                      <input
                        type="date"
                        name="primeiraParcela"
                        value={formData.primeiraParcela}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className={`form-input ${errors.primeiraParcela ? 'error' : ''}`}
                      />
                      {errors.primeiraParcela && <div className="form-error">{errors.primeiraParcela}</div>}
                    </div>
                  </div>

                  {/* Preview do Parcelamento */}
                  {valorNumerico > 0 && formData.numeroParcelas > 0 && (
                    <div className="form-preview cartao">
                      💳 {formData.numeroParcelas}x de {formatCurrency(valorParcela)}
                      <br />
                      <small>Total: {formatCurrency(valorNumerico)}</small>
                    </div>
                  )}
                </>
              )}

              {/* Status (apenas para despesas simples) */}
              {(tipoDespesa === 'simples' || isEditMode) && (
                <div className="form-field-group">
                  <label className="form-label">
                    <CheckCircle size={14} />
                    Status da Despesa
                  </label>
                  <div className="form-radio-group">
                    <label className={`form-radio-option ${formData.efetivado ? 'selected despesa' : ''}`}>
                      <input
                        type="radio"
                        checked={formData.efetivado === true}
                        onChange={() => setFormData(prev => ({ ...prev, efetivado: true }))}
                        disabled={submitting}
                      />
                      <CheckCircle size={16} />
                      <div>
                        <div>Já paga</div>
                        <small>Dinheiro saiu</small>
                      </div>
                    </label>
                    <label className={`form-radio-option ${!formData.efetivado ? 'selected warning' : ''}`}>
                      <input
                        type="radio"
                        checked={formData.efetivado === false}
                        onChange={() => setFormData(prev => ({ ...prev, efetivado: false }))}
                        disabled={submitting}
                      />
                      <Clock size={16} />
                      <div>
                        <div>Planejada</div>
                        <small>A pagar</small>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div className="form-field-group">
                <label className="form-label">
                  <FileText size={14} />
                  Descrição *
                </label>
                <input
                  type="text"
                  name="descricao"
                  placeholder={
                    tipoDespesa === 'recorrente' ? 
                      "Ex: Aluguel, Financiamento, Plano de saúde" :
                    tipoDespesa === 'parcelada' ?
                      "Ex: Notebook, Geladeira, Móveis" :
                      "Ex: Supermercado, Combustível, Restaurante"
                  }
                  value={formData.descricao}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`form-input ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && <div className="form-error">{errors.descricao}</div>}
              </div>

              {/* Categoria */}
              <div className="form-field-group">
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
                    placeholder="Digite ou selecione uma categoria"
                    disabled={submitting}
                    autoComplete="off"
                    className={`form-input ${errors.categoria ? 'error' : ''}`}
                  />
                  <Search size={14} className="form-dropdown-icon" />
                  
                  {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
                    <div className="form-dropdown-options">
                      {categoriasFiltradas.map(categoria => (
                        <div
                          key={categoria.id}
                          className="form-dropdown-option"
                          onMouseDown={() => handleSelecionarCategoria(categoria)}
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

              {/* Subcategoria */}
              {categoriaSelecionada && (
                <div className="form-field-group">
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
                      placeholder="Digite ou selecione uma subcategoria"
                      disabled={submitting}
                      autoComplete="off"
                      className="form-input"
                    />
                    <Search size={14} className="form-dropdown-icon" />
                    
                    {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
                      <div className="form-dropdown-options">
                        {subcategoriasFiltradas.map(subcategoria => (
                          <div
                            key={subcategoria.id}
                            className="form-dropdown-option"
                            onMouseDown={() => handleSelecionarSubcategoria(subcategoria)}
                          >
                            {subcategoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Conta */}
              <div className="form-field-group">
                <label className="form-label">
                  <Building size={14} />
                  Conta de Débito *
                </label>
                <select
                  name="conta"
                  value={formData.conta}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`form-input ${errors.conta ? 'error' : ''}`}
                >
                  <option value="">Selecione uma conta</option>
                  {contasAtivas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} - {formatCurrency(conta.saldo_atual || conta.saldo || 0)}
                    </option>
                  ))}
                </select>
                {errors.conta && <div className="form-error">{errors.conta}</div>}
              </div>

              {/* Observações */}
              <div className="form-field-group">
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
                  className={`form-input form-textarea ${errors.observacoes ? 'error' : ''}`}
                />
                <div className="form-char-counter">
                  <span></span>
                  <span className={formData.observacoes.length > 250 ? 'text-danger' : ''}>
                    {formData.observacoes.length}/300
                  </span>
                </div>
                {errors.observacoes && <div className="form-error">{errors.observacoes}</div>}
              </div>

              {/* Ações */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={submitting}
                  className="form-btn form-btn-secondary"
                >
                  Cancelar
                </button>
                
                {/* ✅ Botão "Continuar Adicionando" apenas no modo criação */}
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={submitting}
                    className="form-btn form-btn-secondary"
                    style={{ 
                      background: '#dc2626',
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
                  className={`form-btn form-btn-primary ${tipoDespesa === 'parcelada' ? 'cartao' : 'despesa'}`}
                >
                  {submitting ? (
                    <>
                      <div className="form-spinner"></div>
                      {isEditMode ? 'Atualizando...' :
                       tipoDespesa === 'recorrente' ? `Criando ${formData.totalRecorrencias} despesas...` : 
                       tipoDespesa === 'parcelada' ? `Criando ${formData.numeroParcelas} parcelas...` :
                       'Salvando...'}
                    </>
                  ) : (
                    <>
                      {isEditMode ? <Edit size={14} /> : <Plus size={14} />}
                      {isEditMode ? 'Atualizar Despesa' :
                       tipoDespesa === 'recorrente' ? `Criar ${formData.totalRecorrencias} Despesas` : 
                       tipoDespesa === 'parcelada' ? `Parcelar em ${formData.numeroParcelas}x` :
                       'Adicionar Despesa'}
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
  transacaoEditando: PropTypes.object // ✅ Nova prop para edição
};

export default React.memo(DespesasModal);