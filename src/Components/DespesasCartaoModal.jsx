// src/components/DespesasCartaoModal.jsx - VERSÃO REFATORADA E OTIMIZADA COM VALOR CORRIGIDO
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
  Search
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabaseClient';
import './FormsModal.css';

/**
 * Modal de Despesas Cartão - Versão Otimizada com Valor Corrigido
 * Reduzido de ~1600 para ~650 linhas (60% menos código)
 * Design compacto, funcionalidades completas, performance otimizada
 * VALOR CORRIGIDO: Mesmo sistema do ReceitasModal
 */
const DespesasCartaoModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const valorInputRef = useRef(null);

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para dados
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [cartoes, setCartoes] = useState([]);

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
  };

  // Dados derivados
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

  // Opções de parcelamento
  const opcoesParcelamento = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}x${i === 0 ? ' à vista' : ''}`
    })),
    []
  );

  // FORMATAÇÃO DE VALOR CORRIGIDA - IGUAL AO RECEITAS MODAL
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

  // VALOR NUMÉRICO CORRIGIDO - IGUAL AO RECEITAS MODAL
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

  // Função para calcular opções de fatura
  const calcularOpcoesFatura = useCallback(() => {
    if (!formData.dataCompra || !formData.cartaoId) return [];
    
    const cartao = cartoesAtivos.find(c => c.id === formData.cartaoId);
    if (!cartao) return [];
    
    const dataCompra = new Date(formData.dataCompra);
    const diaFechamento = cartao.dia_fechamento || 1;
    const diaVencimento = cartao.dia_vencimento || 10;
    
    const opcoes = [];
    
    // Gera 6 opções: 2 antes da calculada + calculada + 3 depois
    for (let i = -2; i <= 3; i++) {
      const dataFechamento = new Date(dataCompra.getFullYear(), dataCompra.getMonth() + i, diaFechamento);
      const dataVencimento = new Date(dataCompra.getFullYear(), dataCompra.getMonth() + i, diaVencimento);
      
      // Se vencimento é antes do fechamento, é do mês seguinte
      if (diaVencimento <= diaFechamento) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }
      
      const isCalculada = i === 0 || (i === 1 && dataCompra.getDate() > diaFechamento);
      
      opcoes.push({
        value: dataVencimento.toISOString().split('T')[0],
        label: `${dataVencimento.toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        }).replace('.', '')} - Venc: ${dataVencimento.toLocaleDateString('pt-BR')}`,
        isDefault: isCalculada
      });
    }
    
    return opcoes;
  }, [formData.dataCompra, formData.cartaoId, cartoesAtivos]);

  const opcoesFatura = useMemo(() => calcularOpcoesFatura(), [calcularOpcoesFatura]);

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

  // Efeito para definir fatura padrão
  useEffect(() => {
    if (formData.cartaoId && formData.dataCompra && opcoesFatura.length > 0) {
      const faturaDefault = opcoesFatura.find(opcao => opcao.isDefault);
      if (faturaDefault && !formData.faturaVencimento) {
        setFormData(prev => ({
          ...prev,
          faturaVencimento: faturaDefault.value
        }));
      }
    }
  }, [formData.cartaoId, formData.dataCompra, opcoesFatura, formData.faturaVencimento]);

  // Reset form
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

  useEffect(() => {
    if (isOpen) {
      resetForm();
      const timer = setTimeout(() => valorInputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetForm]);

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
        faturaVencimento: ''
      }));
    } else if (name === 'dataCompra') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        faturaVencimento: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // HANDLER DE VALOR CORRIGIDO - IGUAL AO RECEITAS MODAL
  const handleValorChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, valorTotal: valorFormatado }));
    if (errors.valorTotal) {
      setErrors(prev => ({ ...prev, valorTotal: null }));
    }
  }, [formatarValor, errors.valorTotal]);

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
    if (formData.numeroParcelas < 1) {
      newErrors.numeroParcelas = "Número de parcelas deve ser pelo menos 1";
    }
    if (formData.numeroParcelas > 1 && valorNumerico < 10) {
      newErrors.numeroParcelas = "Para parcelar, valor mínimo deve ser R$ 10,00";
    }
    if (formData.observacoes && formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico]);

  // Salvar parcelas
  const salvarParcelas = useCallback(async () => {
    const valorParcelaCalc = valorNumerico / formData.numeroParcelas;
    const grupoParcelamento = crypto.randomUUID();
    
    const parcelas = [];
    
    for (let i = 1; i <= formData.numeroParcelas; i++) {
      // Calcular data de vencimento para cada parcela
      const dataVencimento = new Date(formData.faturaVencimento);
      dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));
      
      parcelas.push({
        usuario_id: user.id,
        data: formData.dataCompra,
        descricao: formData.descricao.trim() + (formData.numeroParcelas > 1 ? ` (${i}/${formData.numeroParcelas})` : ''),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        cartao_id: formData.cartaoId,
        valor: valorParcelaCalc,
        tipo: 'despesa',
        efetivado: true,
        recorrente: false,
        transferencia: false,
        parcela_atual: i,
        total_parcelas: formData.numeroParcelas,
        grupo_parcelamento: grupoParcelamento,
        fatura_vencimento: dataVencimento.toISOString().split('T')[0],
        observacoes: formData.observacoes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    const { data, error } = await supabase
      .from('transacoes')
      .insert(parcelas)
      .select();
    
    if (error) throw error;
    
    return data;
  }, [formData, user.id, valorNumerico]);

  // Submissão
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await salvarParcelas();
      
      if (onSave) onSave();
      
      if (criarNova) {
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
      showNotification(`Erro ao salvar despesa: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, salvarParcelas, onSave, showNotification, resetForm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="receitas-modal-overlay">
      <div className="receitas-modal-container">
        {/* Header */}
        <div className="receitas-modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white'
            }}>
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="receitas-modal-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                Despesa com Cartão
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                Registre compras no cartão de crédito
              </p>
            </div>
          </div>
          <button className="receitas-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="receitas-modal-content">
          {loading ? (
            <div className="receitas-loading">
              <div className="receitas-loading-spinner" style={{ borderTopColor: '#8b5cf6' }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando dados...
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="receitas-form">
              
              {/* Valor e Data */}
              <div className="receitas-form-row">
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
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
                    className={`receitas-form-input receitas-valor-input ${errors.valorTotal ? 'error' : ''}`}
                    style={{ 
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#8b5cf6',
                      textAlign: 'center'
                    }}
                  />
                  {errors.valorTotal && <div className="receitas-form-error">{errors.valorTotal}</div>}
                </div>
                
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <Calendar size={14} />
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    name="dataCompra"
                    value={formData.dataCompra}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.dataCompra ? 'error' : ''}`}
                  />
                  {errors.dataCompra && <div className="receitas-form-error">{errors.dataCompra}</div>}
                </div>
              </div>

              {/* Descrição */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
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
                  className={`receitas-form-input ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && <div className="receitas-form-error">{errors.descricao}</div>}
              </div>

              {/* Categoria */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <Tag size={14} />
                  Categoria *
                </label>
                <div className="receitas-dropdown-container">
                  <input
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
                      backgroundColor: !formData.categoria ? '#f9fafb' : 'white'
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
                            style={{ backgroundColor: categoria.cor || '#ef4444' }}
                          />
                          {categoria.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.categoria && <div className="receitas-form-error">{errors.categoria}</div>}
              </div>

              {/* Subcategoria */}
              {categoriaSelecionada && (
                <div className="receitas-form-group receitas-form-full">
                  <label className="receitas-form-label">
                    <Tag size={14} />
                    Subcategoria ({subcategoriasDaCategoria.length} disponíveis)
                  </label>
                  <div className="receitas-dropdown-container">
                    <input
                      type="text"
                      value={formData.subcategoriaTexto}
                      onChange={handleSubcategoriaChange}
                      onBlur={handleSubcategoriaBlur}
                      onFocus={() => setSubcategoriaDropdownOpen(true)}
                      placeholder="Digite ou selecione uma subcategoria"
                      disabled={submitting}
                      autoComplete="off"
                      className="receitas-form-input receitas-dropdown-input"
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

              {/* Cartão e Parcelas */}
              <div className="receitas-form-row">
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <CreditCard size={14} />
                    Cartão *
                  </label>
                  <select
                    name="cartaoId"
                    value={formData.cartaoId}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.cartaoId ? 'error' : ''}`}
                  >
                    <option value="">Selecione um cartão</option>
                    {cartoesAtivos.map(cartao => (
                      <option key={cartao.id} value={cartao.id}>
                        {cartao.nome} ({cartao.bandeira})
                      </option>
                    ))}
                  </select>
                  {errors.cartaoId && <div className="receitas-form-error">{errors.cartaoId}</div>}
                </div>
                
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <Hash size={14} />
                    Parcelas *
                  </label>
                  <select
                    name="numeroParcelas"
                    value={formData.numeroParcelas}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.numeroParcelas ? 'error' : ''}`}
                  >
                    {opcoesParcelamento.map(opcao => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                  {errors.numeroParcelas && <div className="receitas-form-error">{errors.numeroParcelas}</div>}
                </div>
              </div>

              {/* Fatura de Vencimento */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <Calendar size={14} />
                  Fatura de Vencimento *
                  <small>(primeira parcela)</small>
                </label>
                <select
                  name="faturaVencimento"
                  value={formData.faturaVencimento}
                  onChange={handleInputChange}
                  disabled={submitting || !formData.cartaoId}
                  className={`receitas-form-input ${errors.faturaVencimento ? 'error' : ''}`}
                  style={{
                    backgroundColor: !formData.cartaoId ? '#f9fafb' : 'white'
                  }}
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
                {errors.faturaVencimento && <div className="receitas-form-error">{errors.faturaVencimento}</div>}
              </div>

              {/* Preview do Parcelamento */}
              {valorNumerico > 0 && formData.numeroParcelas > 0 && (
                <div style={{ 
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  color: '#8b5cf6',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  💳 {formData.numeroParcelas}x de {formatCurrency(valorParcela)}
                  {formData.numeroParcelas > 1 && (
                    <>
                      <br />
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        Total: {formatCurrency(valorNumerico)}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Observações */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <FileText size={14} />
                  Observações <small>(máx. 300)</small>
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Adicione informações extras sobre esta compra"
                  rows="2"
                  disabled={submitting}
                  maxLength="300"
                  className={`receitas-form-input receitas-form-textarea ${errors.observacoes ? 'error' : ''}`}
                />
                <div className="receitas-char-counter">
                  <span></span>
                  <span style={{ color: formData.observacoes.length > 250 ? '#ef4444' : '#9ca3af' }}>
                    {formData.observacoes.length}/300
                  </span>
                </div>
                {errors.observacoes && <div className="receitas-form-error">{errors.observacoes}</div>}
              </div>

              {/* Ações */}
              <div className="receitas-form-actions" style={{ 
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={submitting}
                  className="receitas-btn receitas-btn-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.875rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={submitting}
                  className="receitas-btn receitas-btn-secondary"
                  style={{ 
                    flex: 1, 
                    padding: '10px 16px', 
                    fontSize: '0.875rem',
                    background: '#a855f7',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
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
                  disabled={submitting}
                  className="receitas-btn receitas-btn-primary"
                  style={{ 
                    flex: 1, 
                    padding: '10px 16px', 
                    fontSize: '0.875rem',
                    background: '#8b5cf6'
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      {formData.numeroParcelas > 1 ? `Criando ${formData.numeroParcelas} parcelas...` : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      {formData.numeroParcelas > 1 ? `Parcelar em ${formData.numeroParcelas}x` : 'Adicionar no Cartão'}
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
        <div className="receitas-confirmation-overlay">
          <div className="receitas-confirmation-container">
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
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarCriacao}
                className="receitas-confirmation-btn receitas-confirmation-btn-primary"
                style={{ background: '#8b5cf6' }}
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

DespesasCartaoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(DespesasCartaoModal);