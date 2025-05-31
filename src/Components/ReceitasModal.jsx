// src/components/ReceitasModal.jsx - VERSÃO REFATORADA
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
  Info,
  ArrowLeft
} from 'lucide-react';

// Imports compatíveis com Zustand
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabaseClient';

// CSS existente
import './FormsModal.css';

/**
 * Modal de Receitas - Versão Refatorada
 * Design moderno, hierarquia visual clara e UX acolhedora
 */
const ReceitasModal = ({ isOpen, onClose, onSave }) => {
  // Zustand stores
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // Refs para focus management
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para dados
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);

  // Estados para dropdowns de categoria
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);

  // Estado para confirmação de criação de categoria
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
    // Campos de recorrência
    isRecorrente: false,
    totalRecorrencias: 12,
    tipoRecorrencia: 'mensal',
    primeiroEfetivado: true
  });

  const [errors, setErrors] = useState({});

  // Carregar dados quando modal abre
  useEffect(() => {
    if (isOpen && user) {
      carregarDados();
    }
  }, [isOpen, user]);

  const carregarDados = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar categorias de receita
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('tipo', 'receita')
        .eq('ativo', true)
        .order('nome');

      if (categoriasError) throw categoriasError;

      // Buscar contas ativas
      const { data: contasData, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (contasError) throw contasError;

      setCategorias(categoriasData || []);
      setContas(contasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dados derivados memoizados
  const contasAtivas = useMemo(() => 
    contas.filter(conta => conta.ativo !== false),
    [contas]
  );

  const categoriaSelecionada = useMemo(() =>
    categorias.find(cat => cat.id === formData.categoria),
    [categorias, formData.categoria]
  );

  // Opções para selects
  const opcoesRecorrencia = useMemo(() => [
    { value: 'semanal', label: 'Semanal' },
    { value: 'quinzenal', label: 'Quinzenal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'anual', label: 'Anual' }
  ], []);

  const opcoesQuantidade = useMemo(() => 
    Array.from({ length: 60 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1} ${i === 0 ? 'vez' : 'vezes'}`
    })),
    []
  );

  // Cálculos derivados
  const valorNumerico = useMemo(() => {
    const valor = parseFloat(formData.valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    return valor;
  }, [formData.valor]);

  const valorTotal = useMemo(() => {
    if (formData.isRecorrente) {
      return valorNumerico * formData.totalRecorrencias;
    }
    return valorNumerico;
  }, [valorNumerico, formData.totalRecorrencias, formData.isRecorrente]);

  const dataFinal = useMemo(() => {
    if (formData.isRecorrente && formData.data) {
      const data = new Date(formData.data);
      const multiplicador = formData.totalRecorrencias - 1;
      
      switch (formData.tipoRecorrencia) {
        case 'semanal':
          data.setDate(data.getDate() + (7 * multiplicador));
          break;
        case 'quinzenal':
          data.setDate(data.getDate() + (14 * multiplicador));
          break;
        case 'mensal':
          data.setMonth(data.getMonth() + multiplicador);
          break;
        case 'anual':
          data.setFullYear(data.getFullYear() + multiplicador);
          break;
      }
      
      return data.toLocaleDateString('pt-BR');
    }
    
    return null;
  }, [formData.isRecorrente, formData.data, formData.totalRecorrencias, formData.tipoRecorrencia]);

  // Verificar se data é futura
  const isDataFutura = useCallback((data) => {
    if (!data) return false;
    const hoje = new Date();
    const dataTransacao = new Date(data);
    hoje.setHours(0, 0, 0, 0);
    dataTransacao.setHours(0, 0, 0, 0);
    return dataTransacao > hoje;
  }, []);

  // Effects para filtrar categorias
  useEffect(() => {
    if (!categorias.length) return;
    
    if (formData.categoriaTexto) {
      const filtradas = categorias.filter(cat =>
        cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase())
      );
      setCategoriasFiltradas(filtradas);
    } else {
      setCategoriasFiltradas(categorias);
    }
  }, [formData.categoriaTexto, categorias]);

  useEffect(() => {
    if (!categoriaSelecionada) {
      setSubcategoriasFiltradas([]);
      return;
    }
    
    if (formData.subcategoriaTexto) {
      const filtradas = (categoriaSelecionada.subcategorias || []).filter(sub =>
        sub.nome.toLowerCase().includes(formData.subcategoriaTexto.toLowerCase())
      );
      setSubcategoriasFiltradas(filtradas);
    } else {
      setSubcategoriasFiltradas(categoriaSelecionada.subcategorias || []);
    }
  }, [formData.subcategoriaTexto, categoriaSelecionada]);

  // Effect para definir status efetivado baseado na data
  useEffect(() => {
    if (formData.data) {
      const dataFutura = isDataFutura(formData.data);
      setFormData(prev => ({
        ...prev,
        efetivado: !dataFutura,
        primeiroEfetivado: !dataFutura
      }));
    }
  }, [formData.data, isDataFutura]);

  // Reset form quando modal abre
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
      isRecorrente: false,
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true
    });
    setErrors({});
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      const timer = setTimeout(() => {
        valorInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetForm]);

  // Formatação de valor monetário
  const formatarValor = useCallback((valor) => {
    const valorLimpo = valor.toString().replace(/\D/g, '');
    const valorNumerico = parseFloat(valorLimpo) / 100;
    
    if (isNaN(valorNumerico) || valorNumerico === 0) return '';
    
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // Handlers
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let inputValue = type === 'checkbox' ? checked : value;
    
    // Converter números quando necessário
    if (name === 'totalRecorrencias') {
      inputValue = Math.max(1, parseInt(value) || 1);
    }
    
    if (name === 'categoria') {
      setFormData(prev => ({
        ...prev,
        [name]: inputValue,
        subcategoria: ''
      }));
    } else if (name === 'data') {
      const dataFutura = isDataFutura(inputValue);
      setFormData(prev => ({
        ...prev,
        [name]: inputValue,
        efetivado: !dataFutura,
        primeiroEfetivado: !dataFutura
      }));
    } else if (name === 'isRecorrente') {
      setFormData(prev => ({
        ...prev,
        [name]: inputValue,
        totalRecorrencias: inputValue ? 12 : 1,
        tipoRecorrencia: inputValue ? 'mensal' : 'mensal'
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: inputValue }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors, isDataFutura]);

  const handleValorChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, valor: valorFormatado }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  }, [formatarValor, errors.valor]);

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
    const timer = setTimeout(() => {
      subcategoriaInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
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
        const existe = (categoriaSelecionada.subcategorias || []).find(sub =>
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
  }, [formData.subcategoriaTexto, formData.subcategoria, formData.categoria, categoriaSelecionada]);

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
        
        showNotification(`Subcategoria "${confirmacao.nome}" criada com sucesso!`, 'success');
      }
    } catch (error) {
      console.error('Erro ao criar categoria/subcategoria:', error);
      showNotification('Erro inesperado. Tente novamente.', 'error');
    }
    
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, [confirmacao, user.id, showNotification]);

  // Validação do formulário
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
    
    // Validações específicas para recorrentes
    if (formData.isRecorrente) {
      if (formData.totalRecorrencias < 1) {
        newErrors.totalRecorrencias = "Quantidade deve ser pelo menos 1";
      }
      if (formData.totalRecorrencias > 60) {
        newErrors.totalRecorrencias = "Máximo de 60 recorrências";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico]);

  // Submissão do formulário
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (formData.isRecorrente) {
        // Criar receitas recorrentes
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
          
          receitas.push({
            usuario_id: user.id,
            data: dataReceita.toISOString().split('T')[0],
            descricao: `${formData.descricao.trim()} (${i + 1}/${formData.totalRecorrencias})`,
            categoria_id: formData.categoria,
            subcategoria_id: formData.subcategoria || null,
            conta_id: formData.conta,
            valor: valorNumerico,
            tipo: 'receita',
            efetivado: i === 0 ? formData.primeiroEfetivado : false,
            observacoes: formData.observacoes.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        const { data, error } = await supabase
          .from('transacoes')
          .insert(receitas)
          .select();
        
        if (error) throw error;
        
        showNotification(`${formData.totalRecorrencias} receitas recorrentes criadas!`, 'success');
        
      } else {
        // Transação simples
        const transacaoData = {
          usuario_id: user.id,
          data: formData.data,
          descricao: formData.descricao.trim(),
          categoria_id: formData.categoria,
          subcategoria_id: formData.subcategoria || null,
          conta_id: formData.conta,
          valor: valorNumerico,
          tipo: 'receita',
          efetivado: formData.efetivado,
          observacoes: formData.observacoes.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('transacoes')
          .insert([transacaoData])
          .select();
        
        if (error) throw error;
        
        showNotification('Receita registrada com sucesso!', 'success');
      }
      
      if (onSave) onSave();
      
      if (criarNova) {
        setFormData(prev => ({
          ...prev,
          valor: '',
          data: new Date().toISOString().split('T')[0],
          descricao: '',
          efetivado: true,
          isRecorrente: false,
          totalRecorrencias: 12,
          observacoes: ''
        }));
        setErrors({});
        const timer = setTimeout(() => {
          valorInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
        return () => clearTimeout(timer);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar receita:', error);
      showNotification(`Erro ao salvar receita: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, user.id, formData, valorNumerico, onSave, showNotification, resetForm, onClose]);

  const handleObservacoesChange = useCallback((e) => {
    if (e.target.value.length <= 300) {
      handleInputChange(e);
    }
  }, [handleInputChange]);

  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="receitas-modal-overlay">
      <div className="receitas-modal-container">
        {/* Header Moderno */}
        <div className="receitas-modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {formData.isRecorrente ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white'
              }}>
                <Repeat size={20} />
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white'
              }}>
                <TrendingUp size={20} />
              </div>
            )}
            <div>
              <h2 className="receitas-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                {formData.isRecorrente ? 'Receitas Recorrentes' : 'Nova Receita'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '400' }}>
                {formData.isRecorrente ? 
                  'Configure receitas que se repetem automaticamente' : 
                  'Registre uma nova fonte de renda'
                }
              </p>
            </div>
          </div>
          <button className="receitas-modal-close" onClick={onClose} aria-label="Fechar" style={{
            borderRadius: '8px',
            padding: '8px'
          }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="receitas-modal-content" style={{ padding: '24px' }}>
          {/* Loading */}
          {loading ? (
            <div className="receitas-loading">
              <div className="receitas-loading-spinner" style={{ borderTopColor: '#10b981' }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando dados...
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="receitas-form">
              
              {/* BLOCO 1: Valor e Data - Hierarquia Principal */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(16, 185, 129, 0.01) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div className="receitas-form-row">
                  <div className="receitas-form-group">
                    <label className="receitas-form-label" style={{ fontWeight: '600', color: '#374151' }}>
                      <DollarSign size={16} style={{ color: '#10b981' }} />
                      Valor {formData.isRecorrente ? '(cada)' : ''} *
                    </label>
                    <input
                      ref={valorInputRef}
                      type="text"
                      name="valor"
                      value={formData.valor}
                      onChange={handleValorChange}
                      placeholder="0,00"
                      disabled={submitting}
                      className={`receitas-form-input receitas-valor-input ${errors.valor ? 'error' : ''}`}
                      style={{ 
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#10b981',
                        textAlign: 'center',
                        letterSpacing: '-0.025em'
                      }}
                    />
                    {errors.valor && (
                      <div className="receitas-form-error">{errors.valor}</div>
                    )}
                  </div>
                  
                  <div className="receitas-form-group">
                    <label className="receitas-form-label" style={{ fontWeight: '600', color: '#374151' }}>
                      <Calendar size={16} style={{ color: '#10b981' }} />
                      {formData.isRecorrente ? 'Data de Início' : 'Data'} *
                    </label>
                    <input
                      type="date"
                      name="data"
                      value={formData.data}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className={`receitas-form-input ${errors.data ? 'error' : ''}`}
                      style={{ 
                        fontSize: '0.95rem',
                        fontWeight: '500'
                      }}
                    />
                    {errors.data && (
                      <div className="receitas-form-error">{errors.data}</div>
                    )}
                  </div>
                </div>

                {/* Toggle Recorrente */}
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <input
                      type="checkbox"
                      name="isRecorrente"
                      checked={formData.isRecorrente}
                      onChange={handleInputChange}
                      disabled={submitting}
                      style={{ 
                        width: '18px', 
                        height: '18px',
                        accentColor: '#10b981'
                      }}
                    />
                    <Repeat size={18} style={{ color: '#10b981' }} />
                    <span>Receita recorrente (repetir automaticamente)</span>
                  </label>
                  {formData.isRecorrente && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px 12px', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '500' }}>
                          Ideal para salários, freelances e rendas fixas
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* BLOCO 2: Campos de Recorrência (se ativo) */}
              {formData.isRecorrente && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Repeat size={16} style={{ color: '#10b981' }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                      Configuração da Recorrência
                    </h3>
                  </div>

                  <div className="receitas-form-row">
                    <div className="receitas-form-group">
                      <label className="receitas-form-label">
                        <Repeat size={14} />
                        Frequência *
                      </label>
                      <select
                        name="tipoRecorrencia"
                        value={formData.tipoRecorrencia}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className={`receitas-form-input ${errors.tipoRecorrencia ? 'error' : ''}`}
                      >
                        {opcoesRecorrencia.map(opcao => (
                          <option key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="receitas-form-group">
                      <label className="receitas-form-label">
                        <Hash size={14} />
                        Quantidade *
                      </label>
                      <select
                        name="totalRecorrencias"
                        value={formData.totalRecorrencias}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className={`receitas-form-input ${errors.totalRecorrencias ? 'error' : ''}`}
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
                    <div style={{ 
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginTop: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                        🔄 {formData.totalRecorrencias}x de {formatCurrency(valorNumerico)} ({formData.tipoRecorrencia})
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#059669', opacity: 0.9 }}>
                        Total: {formatCurrency(valorTotal)}
                        {dataFinal && ` • Término: ${dataFinal}`}
                      </div>
                    </div>
                  )}

                  {/* Status da primeira recorrência */}
                  <div style={{ marginTop: '16px' }}>
                    <label className="receitas-form-label" style={{ marginBottom: '12px' }}>
                      {formData.primeiroEfetivado ? <CheckCircle size={14} /> : <Clock size={14} />}
                      Status da Primeira Receita
                    </label>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '12px'
                    }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer',
                        padding: '12px',
                        borderRadius: '8px',
                        border: formData.primeiroEfetivado ? '2px solid #10b981' : '1px solid #e5e7eb',
                        background: formData.primeiroEfetivado ? 'rgba(16, 185, 129, 0.05)' : 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: formData.primeiroEfetivado ? '#10b981' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="radio"
                          name="primeiroEfetivado"
                          checked={formData.primeiroEfetivado === true}
                          onChange={() => setFormData(prev => ({ ...prev, primeiroEfetivado: true }))}
                          disabled={submitting}
                          style={{ display: 'none' }}
                        />
                        <CheckCircle size={16} />
                        Primeira já recebida
                      </label>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer',
                        padding: '12px',
                        borderRadius: '8px',
                        border: !formData.primeiroEfetivado ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                        background: !formData.primeiroEfetivado ? 'rgba(245, 158, 11, 0.05)' : 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: !formData.primeiroEfetivado ? '#f59e0b' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="radio"
                          name="primeiroEfetivado"
                          checked={formData.primeiroEfetivado === false}
                          onChange={() => setFormData(prev => ({ ...prev, primeiroEfetivado: false }))}
                          disabled={submitting}
                          style={{ display: 'none' }}
                        />
                        <Clock size={16} />
                        Todas planejadas
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Status (apenas para receitas simples) */}
              {!formData.isRecorrente && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    {formData.efetivado ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : <Clock size={16} style={{ color: '#f59e0b' }} />}
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                      Status da Receita
                    </h3>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: 'pointer',
                      padding: '16px',
                      borderRadius: '12px',
                      border: formData.efetivado ? '2px solid #10b981' : '1px solid #e5e7eb',
                      background: formData.efetivado ? 'rgba(16, 185, 129, 0.05)' : 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: formData.efetivado ? '#10b981' : '#6b7280',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="radio"
                        name="efetivado"
                        checked={formData.efetivado === true}
                        onChange={() => setFormData(prev => ({ ...prev, efetivado: true }))}
                        disabled={submitting}
                        style={{ display: 'none' }}
                      />
                      <CheckCircle size={18} />
                      <div>
                        <div>Receita já recebida</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Dinheiro na conta</div>
                      </div>
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: 'pointer',
                      padding: '16px',
                      borderRadius: '12px',
                      border: !formData.efetivado ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                      background: !formData.efetivado ? 'rgba(245, 158, 11, 0.05)' : 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: !formData.efetivado ? '#f59e0b' : '#6b7280',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="radio"
                        name="efetivado"
                        checked={formData.efetivado === false}
                        onChange={() => setFormData(prev => ({ ...prev, efetivado: false }))}
                        disabled={submitting}
                        style={{ display: 'none' }}
                      />
                      <Clock size={18} />
                      <div>
                        <div>Receita planejada</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>A receber</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* BLOCO 3: Descrição e Categorização */}
              <div style={{ 
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <FileText size={16} style={{ color: '#6b7280' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                    Detalhes da Receita
                  </h3>
                </div>

                {/* Descrição */}
                <div className="receitas-form-group receitas-form-full" style={{ marginBottom: '20px' }}>
                  <label className="receitas-form-label">
                    <FileText size={14} />
                    Descrição *
                    {formData.isRecorrente && <small style={{ color: '#10b981' }}>(será numerada automaticamente)</small>}
                  </label>
                  <input
                    type="text"
                    name="descricao"
                    placeholder={formData.isRecorrente ? "Ex: Salário, Freelance, Aluguel recebido" : "Ex: Salário, Freelance, Venda"}
                    value={formData.descricao}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.descricao ? 'error' : ''}`}
                    style={{ fontSize: '0.95rem' }}
                  />
                  {errors.descricao && (
                    <div className="receitas-form-error">{errors.descricao}</div>
                  )}
                  {formData.isRecorrente && formData.descricao && (
                    <div style={{ 
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#059669'
                    }}>
                      💡 Será salvo como: "{formData.descricao} (1/{formData.totalRecorrencias})", "{formData.descricao} (2/{formData.totalRecorrencias})", etc.
                    </div>
                  )}
                </div>

                {/* Categoria */}
                <div className="receitas-form-group receitas-form-full" style={{ marginBottom: '16px' }}>
                  <label className="receitas-form-label">
                    <Tag size={14} />
                    Categoria *
                  </label>
                  <div className="receitas-dropdown-container">
                    <input
                      ref={categoriaInputRef}
                      type="text"
                      value={formData.categoriaTexto}
                      onChange={handleCategoriaChange}
                      onBlur={handleCategoriaBlur}
                      onFocus={() => setCategoriaDropdownOpen(true)}
                      placeholder="Digite ou selecione uma categoria"
                      disabled={submitting}
                      autoComplete="off"
                      className={`receitas-form-input receitas-dropdown-input ${errors.categoria ? 'error' : ''}`}
                      style={{
                        backgroundColor: !formData.categoria ? '#f9fafb' : 'white',
                        fontSize: '0.95rem'
                      }}
                    />
                    <Search size={14} className="receitas-search-icon" />
                    
                    {categoriaDropdownOpen && categoriasFiltradas.length > 0 && (
                      <div className="receitas-dropdown-options">
                        {categoriasFiltradas.map(categoria => (
                          <div
                            key={categoria.id}
                            className="receitas-dropdown-option"
                            onMouseDown={() => handleSelecionarCategoria(categoria)}
                          >
                            <div 
                              className="receitas-categoria-cor"
                              style={{ backgroundColor: categoria.cor || '#10b981' }}
                            />
                            {categoria.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.categoria && (
                    <div className="receitas-form-error">{errors.categoria}</div>
                  )}
                </div>

                {/* Subcategoria */}
                {categoriaSelecionada && (
                  <div className="receitas-form-group receitas-form-full" style={{ marginBottom: '16px' }}>
                    <label className="receitas-form-label">
                      <Tag size={14} />
                      Subcategoria
                    </label>
                    <div className="receitas-dropdown-container">
                      <input
                        ref={subcategoriaInputRef}
                        type="text"
                        value={formData.subcategoriaTexto}
                        onChange={handleSubcategoriaChange}
                        onBlur={handleSubcategoriaBlur}
                        onFocus={() => setSubcategoriaDropdownOpen(true)}
                        placeholder="Digite ou selecione uma subcategoria"
                        disabled={submitting}
                        autoComplete="off"
                        className="receitas-form-input receitas-dropdown-input"
                        style={{ fontSize: '0.95rem' }}
                      />
                      <Search size={14} className="receitas-search-icon" />
                      
                      {subcategoriaDropdownOpen && subcategoriasFiltradas.length > 0 && (
                        <div className="receitas-dropdown-options">
                          {subcategoriasFiltradas.map(subcategoria => (
                            <div
                              key={subcategoria.id}
                              className="receitas-dropdown-option"
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
                <div className="receitas-form-group receitas-form-full">
                  <label className="receitas-form-label">
                    <Building size={14} />
                    Conta de Destino *
                  </label>
                  <select
                    name="conta"
                    value={formData.conta}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.conta ? 'error' : ''}`}
                    style={{ fontSize: '0.95rem' }}
                  >
                    <option value="">Selecione uma conta</option>
                    {contasAtivas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} - {formatCurrency(conta.saldo_atual || conta.saldo || 0)}
                      </option>
                    ))}
                  </select>
                  {errors.conta && (
                    <div className="receitas-form-error">{errors.conta}</div>
                  )}
                </div>
              </div>

              {/* BLOCO 4: Observações */}
              <div style={{ 
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div className="receitas-form-group receitas-form-full">
                  <label className="receitas-form-label">
                    <FileText size={14} />
                    Observações <small>(máx. 300)</small>
                  </label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleObservacoesChange}
                    placeholder={formData.isRecorrente ? 
                      "Adicione informações extras sobre estas receitas recorrentes" :
                      "Adicione informações extras sobre esta receita"
                    }
                    rows="3"
                    disabled={submitting}
                    maxLength="300"
                    className={`receitas-form-input receitas-form-textarea ${errors.observacoes ? 'error' : ''}`}
                    style={{ fontSize: '0.9rem', lineHeight: '1.5' }}
                  />
                  <div className="receitas-char-counter">
                    <span></span>
                    <span style={{ color: formData.observacoes.length > 250 ? '#ef4444' : '#9ca3af' }}>
                      {formData.observacoes.length}/300
                    </span>
                  </div>
                  {errors.observacoes && (
                    <div className="receitas-form-error">{errors.observacoes}</div>
                  )}
                </div>
              </div>

              {/* BLOCO 5: Ações */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div className="receitas-form-actions" style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr 1fr',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  <button
                    type="button"
                    onClick={handleCancelar}
                    disabled={submitting}
                    className="receitas-btn receitas-btn-secondary"
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={submitting}
                    className="receitas-btn receitas-btn-tertiary"
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      border: 'none',
                      color: 'white'
                    }}
                  >
                    {submitting ? (
                      <>
                        <div className="receitas-btn-spinner"></div>
                        {formData.isRecorrente ? 'Criando...' : 'Salvando...'}
                      </>
                    ) : (
                      <>
                        <PlusCircle size={16} />
                        {formData.isRecorrente ? 'Criar e Nova' : 'Salvar e Nova'}
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="receitas-btn receitas-btn-primary"
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {submitting ? (
                      <>
                        <div className="receitas-btn-spinner"></div>
                        {formData.isRecorrente ? `Criando ${formData.totalRecorrencias} receitas...` : 'Salvando...'}
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        {formData.isRecorrente ? `Criar ${formData.totalRecorrencias} Receitas` : 'Salvar Receita'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Modal de Confirmação */}
      {confirmacao.show && (
        <div className="receitas-confirmation-overlay">
          <div className="receitas-confirmation-container" style={{
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 className="receitas-confirmation-title">
              Criar Nova {confirmacao.type === 'categoria' ? 'Categoria' : 'Subcategoria'}
            </h3>
            <p className="receitas-confirmation-message">
              {confirmacao.type === 'categoria' ? 'A categoria' : 'A subcategoria'}{' '}
              <strong>"{confirmacao.nome}"</strong> não existe. Deseja criá-la?
            </p>
            <div className="receitas-confirmation-actions">
              <button 
                onClick={() => setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' })}
                className="receitas-confirmation-btn receitas-confirmation-btn-secondary"
                style={{ borderRadius: '8px' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarCriacao}
                className="receitas-confirmation-btn receitas-confirmation-btn-primary"
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
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
  onSave: PropTypes.func
};

export default React.memo(ReceitasModal);