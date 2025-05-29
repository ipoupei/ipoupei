import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  CreditCard, 
  Plus, 
  X, 
  Calendar, 
  FileText, 
  Tag, 
  DollarSign, 
  MessageSquare, 
  Hash, 
  PlusCircle,
  Search
} from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useCartoes from '../hooks/useCartoes';
import { supabase } from '../lib/supabaseClient';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatCurrency';
import './FormsModal.css';

const DespesasCartaoModal = ({ isOpen, onClose, onSave }) => {
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  
  const { user } = useAuth();
  const { categorias, loading: categoriasLoading, addCategoria, addSubcategoria } = useCategorias();
  const { cartoes, loading: cartoesLoading } = useCartoes();
  
  // Memoizar categorias de despesa para evitar recalculos desnecessários
  const categoriasDespesa = useMemo(() => 
    categorias.filter(cat => cat.tipo === 'despesa'), 
    [categorias]
  );
  
  // Memoizar cartões ativos
  const cartoesAtivos = useMemo(() => 
    cartoes.filter(cartao => cartao.ativo),
    [cartoes]
  );
  
  // Função para obter data atual - memoizada para evitar recalculos
  const getCurrentDate = useCallback(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }, []);
  
  const [formData, setFormData] = useState({
    valorTotal: 0,
    dataCompra: getCurrentDate(),
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
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
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
  
  // Memoizar categoria selecionada
  const categoriaSelecionada = useMemo(() => 
    categoriasDespesa.find(cat => cat.id === formData.categoria),
    [categoriasDespesa, formData.categoria]
  );
  
  // Opções de parcelamento
  const opcoesParcelamento = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}x${i === 0 ? ' à vista' : ''}`
    })),
    []
  );
  
  // Calcula o valor da parcela
  const valorParcela = useMemo(() => 
    formData.valorTotal > 0 && formData.numeroParcelas > 0
      ? formData.valorTotal / formData.numeroParcelas
      : 0,
    [formData.valorTotal, formData.numeroParcelas]
  );
  
  // Função para calcular opções de fatura baseada na data da compra e cartão selecionado
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
        fechamento: dataFechamento.toLocaleDateString('pt-BR'),
        vencimento: dataVencimento.toLocaleDateString('pt-BR'),
        isDefault: isCalculada
      });
    }
    
    return opcoes;
  }, [formData.dataCompra, formData.cartaoId, cartoesAtivos]);
  
  // Opções de fatura memoizadas
  const opcoesFatura = useMemo(() => calcularOpcoesFatura(), [calcularOpcoesFatura]);
  
  // Filtrar categorias - useCallback para evitar recriação da função
  const filtrarCategorias = useCallback(() => {
    if (formData.categoriaTexto) {
      const filtradas = categoriasDespesa.filter(cat =>
        cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase())
      );
      setCategoriasFiltradas(filtradas);
    } else {
      setCategoriasFiltradas(categoriasDespesa);
    }
  }, [formData.categoriaTexto, categoriasDespesa]);
  
  // Filtrar subcategorias - useCallback para evitar recriação da função
  const filtrarSubcategorias = useCallback(() => {
    if (categoriaSelecionada && formData.subcategoriaTexto) {
      const filtradas = (categoriaSelecionada.subcategorias || []).filter(sub =>
        sub.nome.toLowerCase().includes(formData.subcategoriaTexto.toLowerCase())
      );
      setSubcategoriasFiltradas(filtradas);
    } else if (categoriaSelecionada) {
      setSubcategoriasFiltradas(categoriaSelecionada.subcategorias || []);
    } else {
      setSubcategoriasFiltradas([]);
    }
  }, [formData.subcategoriaTexto, categoriaSelecionada]);
  
  // UseEffect para filtrar categorias
  useEffect(() => {
    filtrarCategorias();
  }, [filtrarCategorias]);
  
  // UseEffect para filtrar subcategorias
  useEffect(() => {
    filtrarSubcategorias();
  }, [filtrarSubcategorias]);
  
  // Efeito para definir fatura padrão quando cartão ou data mudam
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
  
  // Reset form quando modal abre
  const resetForm = useCallback(() => {
    setFormData({
      valorTotal: 0,
      dataCompra: getCurrentDate(),
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
    setFeedback({ visible: false, message: '', type: '' });
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, [getCurrentDate]);
  
  // UseEffect para quando o modal abre
  useEffect(() => {
    if (isOpen) {
      resetForm();
      const timer = setTimeout(() => {
        valorInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetForm]);
  
  const showFeedback = useCallback((message, type = 'success') => {
    setFeedback({ visible: true, message, type });
    const timer = setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Lógica especial para categoria
    if (name === 'categoria') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subcategoria: '' // Reseta a subcategoria
      }));
    } else if (name === 'numeroParcelas') {
      // Garantir que o número de parcelas seja pelo menos 1
      const parcelas = Math.max(1, parseInt(value) || 1);
      setFormData(prev => ({
        ...prev,
        [name]: parcelas
      }));
    } else if (name === 'cartaoId') {
      // Quando muda o cartão, recalcula a fatura automaticamente
      setFormData(prev => ({
        ...prev,
        [name]: value,
        faturaVencimento: '' // Será recalculado no próximo useEffect
      }));
    } else if (name === 'dataCompra') {
      // Quando muda a data, recalcula a fatura automaticamente
      setFormData(prev => ({
        ...prev,
        [name]: value,
        faturaVencimento: '' // Será recalculado no próximo useEffect
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);
  
  const handleValorChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, valorTotal: value }));
    if (errors.valorTotal) {
      setErrors(prev => ({ ...prev, valorTotal: null }));
    }
  }, [errors.valorTotal]);
  
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
        const existe = categoriasDespesa.find(cat =>
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
  }, [formData.categoriaTexto, formData.categoria, categoriasDespesa]);
  
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
        const result = await addCategoria({
          nome: confirmacao.nome,
          tipo: 'despesa',
          cor: '#EF4444'
        });
        
        if (result.success) {
          setFormData(prev => ({
            ...prev,
            categoria: result.data.id,
            categoriaTexto: result.data.nome
          }));
          
          showFeedback(`Categoria "${confirmacao.nome}" criada com sucesso!`);
        } else {
          showFeedback('Erro ao criar categoria. Tente novamente.', 'error');
        }
      } else if (confirmacao.type === 'subcategoria') {
        const result = await addSubcategoria(confirmacao.categoriaId, {
          nome: confirmacao.nome
        });
        
        if (result.success) {
          setFormData(prev => ({
            ...prev,
            subcategoria: result.data.id,
            subcategoriaTexto: result.data.nome
          }));
          
          showFeedback(`Subcategoria "${confirmacao.nome}" criada com sucesso!`);
        } else {
          showFeedback('Erro ao criar subcategoria. Tente novamente.', 'error');
        }
      }
    } catch (error) {
      console.error('Erro ao criar categoria/subcategoria:', error);
      showFeedback('Erro inesperado. Tente novamente.', 'error');
    }
    
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, [confirmacao, addCategoria, addSubcategoria, showFeedback]);
  
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.valorTotal || formData.valorTotal === 0) {
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
    if (formData.numeroParcelas > 1 && formData.valorTotal < 10) {
      newErrors.numeroParcelas = "Para parcelar, valor mínimo deve ser R$ 10,00";
    }
    if (formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    // Verifica se o cartão está ativo
    const cartao = cartoes.find(c => c.id === formData.cartaoId);
    if (cartao && !cartao.ativo) {
      newErrors.cartaoId = "Este cartão está inativo";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, cartoes]);
  
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // *** NOVA IMPLEMENTAÇÃO COM FUNÇÃO DO BANCO ***
      // Usar a função do banco para gerar automaticamente todas as parcelas
      const { data, error } = await supabase
        .rpc('gerar_parcelas_cartao', {
          p_usuario_id: user.id,
          p_cartao_id: formData.cartaoId,
          p_categoria_id: formData.categoria,
          p_subcategoria_id: formData.subcategoria || null,
          p_descricao: formData.descricao.trim(),
          p_valor_total: formData.valorTotal,
          p_numero_parcelas: formData.numeroParcelas,
          p_data_compra: formData.dataCompra,
          p_fatura_vencimento: formData.faturaVencimento,
          p_observacoes: formData.observacoes.trim() || null
        });
      
      if (error) {
        // Se a função do banco não existir ainda, usar método alternativo
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('⚠️ Função do banco não encontrada, usando método alternativo...');
          await salvarComMetodoAlternativo();
        } else {
          throw error;
        }
      } else {
        console.log("✅ Parcelas criadas com sucesso. Grupo ID:", data);
      }
      
      if (onSave) {
        onSave(); // Notifica o Dashboard para atualizar
      }
      
      if (criarNova) {
        showFeedback('Despesa parcelada salva! Pronto para a próxima.');
        // Reset apenas os campos principais, mantendo categoria e cartão
        setFormData(prev => ({
          ...prev,
          valorTotal: 0,
          dataCompra: getCurrentDate(),
          descricao: '',
          numeroParcelas: 1,
          faturaVencimento: '',
          observacoes: ''
        }));
        setErrors({});
        // Foca no campo de valor para facilitar entrada rápida
        const timer = setTimeout(() => {
          valorInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        showFeedback('Despesa de cartão registrada com sucesso!');
        const timer = setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
        return () => clearTimeout(timer);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar despesa de cartão:', error);
      showFeedback(`Erro ao salvar despesa: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, user.id, formData, onSave, showFeedback, getCurrentDate, resetForm, onClose]);
  
  // Método alternativo caso a função do banco não exista ainda
  const salvarComMetodoAlternativo = useCallback(async () => {
    const valorParcelaCalc = formData.valorTotal / formData.numeroParcelas;
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
        valor: formData.valorTotal, // Valor total para referência
        valor_parcela: valorParcelaCalc,
        numero_parcelas: formData.numeroParcelas,
        parcela_atual: i,
        fatura_vencimento: dataVencimento.toISOString().split('T')[0],
        grupo_parcelamento: grupoParcelamento,
        observacoes: formData.observacoes.trim() || null,
        tipo: 'despesa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    const { data, error } = await supabase
      .from('transacoes')
      .insert(parcelas)
      .select();
    
    if (error) throw error;
    
    console.log("✅ Parcelas salvas com método alternativo:", data);
  }, [formData, user.id]);
  
  const handleObservacoesChange = useCallback((e) => {
    if (e.target.value.length <= 300) {
      handleInputChange(e);
    }
  }, [handleInputChange]);
  
  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);
  
  const handleCancelarConfirmacao = useCallback(() => {
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div className="receitas-modal-overlay">
      <div className="receitas-modal-container">
        {/* Header compacto */}
        <div className="receitas-modal-header">
          <h2 className="receitas-modal-title">
            <CreditCard size={18} style={{ color: '#8b5cf6' }} />
            Despesa com Cartão de Crédito
          </h2>
          <button className="receitas-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="receitas-modal-content">
          {/* Feedback */}
          {feedback.visible && (
            <div className={`receitas-feedback ${feedback.type}`}>
              {feedback.type === 'success' ? '✅' : '❌'} {feedback.message}
            </div>
          )}
          
          {/* Loading */}
          {(categoriasLoading || cartoesLoading) ? (
            <div className="receitas-loading">
              <div className="receitas-loading-spinner"></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando dados...
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="receitas-form">
              {/* Valor e Data - Layout horizontal compacto */}
              <div className="receitas-form-row">
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <DollarSign size={14} />
                    Valor Total *
                  </label>
                  <InputMoney
                    ref={valorInputRef}
                    value={formData.valorTotal}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    disabled={submitting}
                    className={`receitas-form-input receitas-valor-input ${errors.valorTotal ? 'error' : ''}`}
                  />
                  {errors.valorTotal && (
                    <div className="receitas-form-error">{errors.valorTotal}</div>
                  )}
                </div>
                
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <Calendar size={14} />
                    Data *
                  </label>
                  <input
                    type="date"
                    name="dataCompra"
                    value={formData.dataCompra}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.dataCompra ? 'error' : ''}`}
                  />
                  {errors.dataCompra && (
                    <div className="receitas-form-error">{errors.dataCompra}</div>
                  )}
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
                {errors.descricao && (
                  <div className="receitas-form-error">{errors.descricao}</div>
                )}
              </div>
              
              {/* Categoria */}
              <div className="receitas-form-group receitas-form-full">
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
                    className={`receitas-form-input receitas-dropdown-input ${errors.subcategoria ? 'error' : ''}`}
                    style={{
                      backgroundColor: !formData.categoria ? '#f9fafb' : 'white'
                    }}
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
                        {cartao.nome}
                      </option>
                    ))}
                  </select>
                  {errors.cartaoId && (
                    <div className="receitas-form-error">{errors.cartaoId}</div>
                  )}
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
                  {errors.numeroParcelas && (
                    <div className="receitas-form-error">{errors.numeroParcelas}</div>
                  )}
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
                {errors.faturaVencimento && (
                  <div className="receitas-form-error">{errors.faturaVencimento}</div>
                )}
              </div>
              
              {/* Preview Compacto do Parcelamento */}
              {formData.valorTotal > 0 && formData.numeroParcelas > 0 && (
                <div className="cartao-preview-compacto">
                  <span className="preview-texto">
                    💳 {formData.numeroParcelas}x de {formatCurrency(valorParcela)}
                    {formData.numeroParcelas > 1 && ` = ${formatCurrency(formData.valorTotal)}`}
                  </span>
                </div>
              )}
              
              {/* Observações */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <MessageSquare size={14} />
                  Observações <small>(máx. 300)</small>
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleObservacoesChange}
                  placeholder="Adicione informações extras sobre esta compra"
                  rows="2"
                  disabled={submitting}
                  className={`receitas-form-input receitas-form-textarea ${errors.observacoes ? 'error' : ''}`}
                />
                <div className="receitas-char-counter">
                  <span></span>
                  <span>{formData.observacoes.length}/300</span>
                </div>
                {errors.observacoes && (
                  <div className="receitas-form-error">{errors.observacoes}</div>
                )}
              </div>
              
              {/* Botões de ação compactos */}
              <div className="receitas-form-actions">
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={submitting}
                  className="receitas-btn receitas-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={submitting}
                  className="receitas-btn receitas-btn-cartao"
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} />
                      Salvar e Nova
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="receitas-btn receitas-btn-cartao"
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Salvar Despesa
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
                onClick={handleCancelarConfirmacao}
                className="receitas-confirmation-btn receitas-confirmation-btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarCriacao}
                className="receitas-confirmation-btn receitas-confirmation-btn-cartao"
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

export default DespesasCartaoModal; 