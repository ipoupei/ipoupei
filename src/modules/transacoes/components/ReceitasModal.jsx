// src/modules/transacoes/components/ReceitasModal.jsx - OTIMIZADO COM BACKEND
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingUp, 
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
  Edit
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import useContas from '@modules/contas/hooks/useContas'; // ✅ Hook otimizado
import '@shared/styles/FormsModal.css';

/**
 * Modal de Receitas - OTIMIZADO COM BACKEND
 * ✅ CORREÇÃO BUG: Mostra saldo atual correto das contas via SQL
 * ✅ Performance otimizada com funções do backend
 * ✅ Receitas atualizam saldo automaticamente via triggers
 */
const ReceitasModal = ({ isOpen, onClose, onSave, transacaoEditando }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const { contas, recalcularSaldos } = useContas(); // ✅ Usar hook otimizado
  
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  const isEditMode = Boolean(transacaoEditando);

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipoReceita, setTipoReceita] = useState('simples');

  // Estados para dados
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  // Estados para dropdowns
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);

  // Estados para navegação por teclado
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
    efetivado: true,
    observacoes: '',
    totalRecorrencias: 12,
    tipoRecorrencia: 'mensal',
    primeiroEfetivado: true
  });

  const [errors, setErrors] = useState({});

  // ✅ Preencher formulário para edição
  const preencherFormularioEdicao = useCallback(() => {
    if (!transacaoEditando) return;
    
    console.log('🖊️ Preenchendo formulário para edição:', transacaoEditando);
    
    // Determinar tipo de receita baseado na descrição
    let tipoDetectado = 'simples';
    if (transacaoEditando.descricao && /\(\d+\/\d+\)/.test(transacaoEditando.descricao)) {
      tipoDetectado = 'recorrente';
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
    
    setTipoReceita(tipoDetectado);
    setFormData({
      valor: valorFormatado,
      data: transacaoEditando.data || new Date().toISOString().split('T')[0],
      descricao: transacaoEditando.descricao?.replace(/\s\(\d+\/\d+\)$/, '') || '',
      categoria: transacaoEditando.categoria_id || '',
      categoriaTexto: categoria?.nome || '',
      subcategoria: transacaoEditando.subcategoria_id || '',
      subcategoriaTexto: subcategoria?.nome || '',
      conta: transacaoEditando.conta_id || '',
      efetivado: transacaoEditando.efetivado ?? true,
      observacoes: transacaoEditando.observacoes || '',
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true
    });
  }, [transacaoEditando, categorias, subcategorias]);

  // ✅ Carregar categorias e subcategorias
  const carregarDados = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [categoriasRes, subcategoriasRes] = await Promise.all([
        supabase.from('categorias').select('*').eq('usuario_id', user.id).eq('tipo', 'receita').eq('ativo', true).order('nome'),
        supabase.from('subcategorias').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome')
      ]);

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Carregar dados quando modal abre
  useEffect(() => {
    if (isOpen && user) {
      carregarDados();
    }
  }, [isOpen, user, carregarDados]);

  // Preencher formulário quando dados estão carregados e há transação para editar
  useEffect(() => {
    if (isOpen && categorias.length > 0 && transacaoEditando) {
      preencherFormularioEdicao();
    }
  }, [isOpen, categorias.length, transacaoEditando, preencherFormularioEdicao]);

  // ✅ Formatação de valor
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

  // ✅ Valor numérico
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

  // ✅ Dados derivados - contas vêm do hook otimizado
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

  // Cálculos
  const valorTotal = useMemo(() => {
    return tipoReceita === 'recorrente' ? valorNumerico * formData.totalRecorrencias : valorNumerico;
  }, [valorNumerico, formData.totalRecorrencias, tipoReceita]);

  // Effects para filtros de categoria
  useEffect(() => {
    if (!categorias.length) return;
    const filtradas = formData.categoriaTexto 
      ? categorias.filter(cat => cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase()))
      : categorias;
    setCategoriasFiltradas(filtradas);
    setCategoriaSelectedIndex(-1);
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
    setSubcategoriaSelectedIndex(-1);
  }, [formData.subcategoriaTexto, subcategoriasDaCategoria]);

  // ✅ Navegação por teclado nas categorias
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
  }, [categoriaDropdownOpen, categoriasFiltradas, categoriaSelectedIndex]);

  // ✅ Navegação por teclado nas subcategorias
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
  }, [subcategoriaDropdownOpen, subcategoriasFiltradas, subcategoriaSelectedIndex]);

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
      primeiroEfetivado: true
    });
    setErrors({});
    setTipoReceita('simples');
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setCategoriaSelectedIndex(-1);
    setSubcategoriaSelectedIndex(-1);
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
    
    if (name === 'totalRecorrencias') {
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
    const timer = setTimeout(() => {
      setCategoriaDropdownOpen(false);
      setCategoriaSelectedIndex(-1);
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
    const timer = setTimeout(() => {
      setSubcategoriaDropdownOpen(false);
      setSubcategoriaSelectedIndex(-1);
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
            tipo: 'receita',
            cor: '#10B981',
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
    
    if (tipoReceita === 'recorrente') {
      if (formData.totalRecorrencias < 1) {
        newErrors.totalRecorrencias = "Quantidade deve ser pelo menos 1";
      }
      if (formData.totalRecorrencias > 60) {
        newErrors.totalRecorrencias = "Máximo de 60 recorrências";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, tipoReceita, valorNumerico]);

  // ✅ Atualizar transação existente
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

      showNotification('Receita atualizada com sucesso!', 'success');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar receita:', error);
      throw error;
    }
  }, [formData, valorNumerico, transacaoEditando, user.id, showNotification]);

  // ✅ Submissão otimizada
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // ✅ MODO EDIÇÃO
      if (isEditMode) {
        await atualizarTransacao();
        
        // ✅ Recalcular saldos via SQL
        await recalcularSaldos();
        
        if (onSave) onSave();
        
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
        
        return;
      }
      
      // ✅ MODO CRIAÇÃO - Receitas recorrentes
      if (tipoReceita === 'recorrente') {
        console.log('🔄 Criando receitas recorrentes...');
        
        const receitas = [];
        const dataBase = new Date(formData.data);
        
        for (let i = 0; i < formData.totalRecorrencias; i++) {
          const dataReceita = new Date(dataBase);
          
          switch (formData.tipoRecorrencia) {
            case 'semanal':
              dataReceita.setDate(dataReceita.getDate() + (7 * i));
              break;
            case 'quinzenal':
              dataReceita.setDate(dataReceita.getDate() + (14 * i));
              break;
            case 'mensal':
              dataReceita.setMonth(dataReceita.getMonth() + i);
              break;
            case 'anual':
              dataReceita.setFullYear(dataReceita.getFullYear() + i);
              break;
          }
          
          const efetivoStatus = i === 0 ? formData.primeiroEfetivado : false;
          
          receitas.push({
            usuario_id: user.id,
            data: dataReceita.toISOString().split('T')[0],
            descricao: `${formData.descricao.trim()} (${i + 1}/${formData.totalRecorrencias})`,
            categoria_id: formData.categoria,
            subcategoria_id: formData.subcategoria || null,
            conta_id: formData.conta,
            valor: valorNumerico,
            tipo: 'receita',
            efetivado: efetivoStatus,
            recorrente: true,
            observacoes: formData.observacoes.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        const { error } = await supabase.from('transacoes').insert(receitas);
        if (error) throw error;
        
        showNotification(`${formData.totalRecorrencias} receitas recorrentes criadas!`, 'success');
        
      } else {
        // ✅ Receita simples
        const dadosReceita = {
          usuario_id: user.id,
          data: formData.data,
          descricao: formData.descricao.trim(),
          categoria_id: formData.categoria,
          subcategoria_id: formData.subcategoria || null,
          conta_id: formData.conta,
          valor: valorNumerico,
          tipo: 'receita',
          efetivado: formData.efetivado,
          recorrente: false,
          observacoes: formData.observacoes.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase.from('transacoes').insert([dadosReceita]);
        if (error) throw error;
        
        showNotification('Receita registrada com sucesso!', 'success');
      }
      
      // ✅ Recalcular saldos via SQL
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
      console.error('❌ Erro ao salvar receita:', error);
      showNotification(`Erro ao salvar receita: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, user.id, formData, tipoReceita, valorNumerico, isEditMode, atualizarTransacao, recalcularSaldos, onSave, showNotification, resetForm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)' 
        }}>
          <h2 className="modal-title">
            <div className="form-icon-wrapper" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white'
            }}>
              {isEditMode ? <Edit size={18} /> : 
               tipoReceita === 'recorrente' ? <Repeat size={18} /> : <TrendingUp size={18} />}
            </div>
            <div>
              <div className="form-title-main">
                {isEditMode ? 'Editar Receita' :
                 tipoReceita === 'recorrente' ? 'Receitas Recorrentes' : 'Nova Receita'}
              </div>
              <div className="form-title-subtitle">
                {isEditMode ? 'Atualize os dados da receita' :
                 tipoReceita === 'recorrente' ? 'Rendas que se repetem' : 'Registre uma nova renda'}
                {contasAtivas.length > 0 && (
                  <> • {contasAtivas.length} conta{contasAtivas.length > 1 ? 's' : ''} disponível{contasAtivas.length > 1 ? 'is' : ''}</>
                )}
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
              <div className="form-loading-spinner" style={{ borderTopColor: '#10b981' }}></div>
              <p>Carregando dados...</p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="form">
              
              {/* Tipo de Receita - Oculto no modo edição */}
              {!isEditMode && (
                <div className="form-field-group">
                  <label className="form-label">
                    <Tag size={14} />
                    Tipo de Receita
                  </label>
                  <div className="form-radio-group receita-tipo-grid">
                    {[
                      { value: 'simples', label: 'Simples', icon: <TrendingUp size={14} />, desc: 'Único' },
                      { value: 'recorrente', label: 'Recorrente', icon: <Repeat size={14} />, desc: 'Repetir' }
                    ].map(tipo => (
                      <label
                        key={tipo.value}
                        className={`form-radio-option ${tipoReceita === tipo.value ? 'selected receita' : ''}`}
                      >
                        <input
                          type="radio"
                          name="tipoReceita"
                          value={tipo.value}
                          checked={tipoReceita === tipo.value}
                          onChange={(e) => setTipoReceita(e.target.value)}
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
                    {tipoReceita === 'recorrente' ? 'Valor (cada)' : 'Valor'} *
                  </label>
                  <input
                    ref={valorInputRef}
                    type="text"
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    disabled={submitting}
                    className={`form-input valor receita ${errors.valor ? 'error' : ''}`}
                  />
                  {errors.valor && <div className="form-error">{errors.valor}</div>}
                </div>
                
                <div className="form-field">
                  <label className="form-label">
                    <Calendar size={14} />
                    {tipoReceita === 'recorrente' ? 'Data Início' : 'Data'} *
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

              {/* Campos específicos para recorrente */}
              {tipoReceita === 'recorrente' && !isEditMode && (
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
                    <div className="form-preview receita">
                      🔄 {formData.totalRecorrencias}x de {formatCurrency(valorNumerico)} ({formData.tipoRecorrencia})
                      <br />
                      <small>Total esperado: {formatCurrency(valorTotal)}</small>
                    </div>
                  )}

                  {/* Status da primeira recorrência */}
                  <div className="form-field-group">
                    <label className="form-label">
                      <CheckCircle size={14} />
                      Status da Primeira Receita
                    </label>
                    <div className="form-radio-group">
                      <label className={`form-radio-option ${formData.primeiroEfetivado ? 'selected receita' : ''}`}>
                        <input
                          type="radio"
                          checked={formData.primeiroEfetivado === true}
                          onChange={() => setFormData(prev => ({ ...prev, primeiroEfetivado: true }))}
                          disabled={submitting}
                        />
                        <CheckCircle size={14} />
                        <div>
                          <div>Primeira já recebida</div>
                          <small>Dinheiro na conta</small>
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
                          <small>A receber</small>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Status - Apenas para receitas simples ou modo edição */}
              {(tipoReceita === 'simples' || isEditMode) && (
                <div className="form-field-group">
                  <label className="form-label">
                    <CheckCircle size={14} />
                    Status da Receita
                  </label>
                  <div className="form-radio-group">
                    <label className={`form-radio-option ${formData.efetivado ? 'selected receita' : ''}`}>
                      <input
                        type="radio"
                        checked={formData.efetivado === true}
                        onChange={() => setFormData(prev => ({ ...prev, efetivado: true }))}
                        disabled={submitting}
                      />
                      <CheckCircle size={16} />
                      <div>
                        <div>Já recebida</div>
                        <small>Dinheiro na conta</small>
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
                        <small>A receber</small>
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
                    tipoReceita === 'recorrente' ? 
                      "Ex: Salário, Freelance, Aluguel recebido" :
                      "Ex: Salário, Freelance, Venda"
                  }
                  value={formData.descricao}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`form-input ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && <div className="form-error">{errors.descricao}</div>}
              </div>

              {/* Categoria com navegação por teclado */}
              <div className="form-field-group">
                <label className="form-label">
                  <Tag size={14} />
                  Categoria *
                </label>
                <div className="form-dropdown-wrapper">
                  <input
                    ref={categoriaInputRef}
                    type="text"
                    value={formData.categoriaTexto}
                    onChange={handleCategoriaChange}
                    onBlur={handleCategoriaBlur}
                    onFocus={() => setCategoriaDropdownOpen(true)}
                    onKeyDown={handleCategoriaKeyDown}
                    placeholder="Digite ou selecione uma categoria"
                    disabled={submitting}
                    autoComplete="off"
                    className={`form-input ${errors.categoria ? 'error' : ''}`}
                  />
                  <Search size={14} className="form-dropdown-icon" />
                  
                  {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
                    <div className="form-dropdown-options">
                      {categoriasFiltradas.map((categoria, index) => (
                        <div
                          key={categoria.id}
                          className={`form-dropdown-option ${
                            index === categoriaSelectedIndex ? 'selected' : ''
                          }`}
                          onMouseDown={() => handleSelecionarCategoria(categoria)}
                          onMouseEnter={() => setCategoriaSelectedIndex(index)}
                        >
                          <div 
                            className="category-color"
                            style={{ backgroundColor: categoria.cor || '#10b981' }}
                          />
                          {categoria.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.categoria && <div className="form-error">{errors.categoria}</div>}
              </div>

              {/* Subcategoria com navegação por teclado */}
              {categoriaSelecionada && (
                <div className="form-field-group">
                  <label className="form-label">
                    <Tag size={14} />
                    Subcategoria <small>({subcategoriasDaCategoria.length} disponíveis)</small>
                  </label>
                  <div className="form-dropdown-wrapper">
                    <input
                      ref={subcategoriaInputRef}
                      type="text"
                      value={formData.subcategoriaTexto}
                      onChange={handleSubcategoriaChange}
                      onBlur={handleSubcategoriaBlur}
                      onFocus={() => setSubcategoriaDropdownOpen(true)}
                      onKeyDown={handleSubcategoriaKeyDown}
                      placeholder="Digite ou selecione uma subcategoria"
                      disabled={submitting}
                      autoComplete="off"
                      className="form-input"
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
              )}

              {/* ✅ CORREÇÃO BUG: Conta com saldo atual correto */}
              <div className="form-field-group">
                <label className="form-label">
                  <Building size={14} />
                  Conta de Destino *
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
                      {conta.nome} - {formatCurrency(conta.saldo || 0)}
                    </option>
                  ))}
                </select>
                {errors.conta && <div className="form-error">{errors.conta}</div>}
                
                {/* ✅ Mostrar total de contas disponíveis */}
                {contasAtivas.length === 0 && (
                  <div className="form-info">
                    <small>Nenhuma conta ativa encontrada. Crie uma conta primeiro.</small>
                  </div>
                )}
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
                
                {/* Botão "Continuar Adicionando" apenas no modo criação */}
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={submitting}
                    className="form-btn form-btn-secondary"
                    style={{ 
                      background: '#059669',
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
                  className="form-btn form-btn-primary receita"
                >
                  {submitting ? (
                    <>
                      <div className="form-spinner"></div>
                      {isEditMode ? 'Atualizando...' :
                       tipoReceita === 'recorrente' ? `Criando ${formData.totalRecorrencias} receitas...` : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      {isEditMode ? <Edit size={14} /> : <Plus size={14} />}
                      {isEditMode ? 'Atualizar Receita' :
                       tipoReceita === 'recorrente' ? `Criar ${formData.totalRecorrencias} Receitas` : 'Adicionar Receita'}
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
                className="form-btn form-btn-primary receita"
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

ReceitasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  transacaoEditando: PropTypes.object
};

export default React.memo(ReceitasModal);