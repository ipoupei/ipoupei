// src/modules/transacoes/components/DespesasCartaoModal.jsx - OTIMIZADO COM ZUSTAND
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

// ✅ OTIMIZAÇÃO: Usar stores e hooks existentes
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import useCartoesStore from '@modules/cartoes/store/cartoesStore';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import useCartoes from '@modules/cartoes/hooks/useCartoes';

import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import '@shared/styles/FormsModal.css';

/**
 * Modal de Despesas Cartão - OTIMIZADO COM ZUSTAND E HOOKS
 * ✅ MELHORIAS IMPLEMENTADAS:
 * - Usar useCartoesStore para dados dos cartões (cache)
 * - Usar useCategoriasStore para categorias (cache)
 * - Usar useCartoes.adicionarDespesaCartao() para salvar
 * - Calcular fatura_vencimento via RPC existente
 * - Menos fetches diretos, mais reuso de dados
 */
const DespesasCartaoModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ OTIMIZAÇÃO: Usar stores em vez de estado local
  const { 
    cartoes, 
    cartoesAtivos,
    loading: isLoadingCartoes,
    fetchCartoes,
    adicionarDespesaCartao 
  } = useCartoes();
  
  const { 
    categorias, 
    loading: isLoadingCategorias,
    addCategoria,
    addSubcategoria,
    getCategoriasPorTipo,
    getSubcategoriasPorCategoria
  } = useCategorias();
  
  const valorInputRef = useRef(null);

  // Estados reduzidos (apenas o que não está no store)
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para dropdowns (UI local)
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [subcategoriaDropdownOpen, setSubcategoriaDropdownOpen] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);

  // Estado para confirmação (UI local)
  const [confirmacao, setConfirmacao] = useState({
    show: false,
    type: '',
    nome: '',
    categoriaId: ''
  });

  // Estado do formulário (local)
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

  // ✅ OTIMIZAÇÃO: Carregar dados via stores quando modal abre
  useEffect(() => {
    if (isOpen && user) {
      carregarDadosOtimizado();
    }
  }, [isOpen, user]);

  const carregarDadosOtimizado = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // ✅ USAR HOOKS: Os dados já estão sendo carregados automaticamente pelos hooks
      // useCategorias já carrega automaticamente quando o usuário está autenticado
      // useCartoes já carrega automaticamente quando o usuário está autenticado
      
      // Apenas force refresh se necessário
      if (cartoesAtivos.length === 0) {
        await fetchCartoes(true); // force refresh
      }
      
      console.log('✅ Dados carregados via hooks:', {
        cartoes: cartoesAtivos.length,
        categorias: categoriasDisponiveis.length,
        subcategorias: todasSubcategorias.length
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados via hooks:', error);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ OTIMIZAÇÃO: Dados derivados dos hooks
  const categoriasDisponiveis = useMemo(() => 
    getCategoriasPorTipo('despesa'), 
    [getCategoriasPorTipo]
  );

  const todasSubcategorias = useMemo(() => {
    return categorias.reduce((acc, categoria) => {
      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        acc.push(...categoria.subcategorias);
      }
      return acc;
    }, []);
  }, [categorias]);

  const categoriaSelecionada = useMemo(() => 
    categoriasDisponiveis.find(cat => cat.id === formData.categoria), 
    [categoriasDisponiveis, formData.categoria]
  );

  const subcategoriasDaCategoria = useMemo(() => 
    getSubcategoriasPorCategoria(formData.categoria), 
    [getSubcategoriasPorCategoria, formData.categoria]
  );

  // Opções de parcelamento (mantido)
  const opcoesParcelamento = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}x${i === 0 ? ' à vista' : ''}`
    })),
    []
  );

  // Formatação de valor (mantido)
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

  // Valor numérico (mantido)
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

  // ✅ OTIMIZAÇÃO: Usar RPC existente para calcular fatura
  const calcularOpcoesFatura = useCallback(async () => {
    if (!formData.dataCompra || !formData.cartaoId) return [];
    
    try {
      console.log('🧮 Calculando opções de fatura via RPC');
      
      // ✅ USAR RPC: buscar_opcoes_fatura (se existir) ou calcular_fatura_vencimento
      const { data: opcoesFatura, error } = await supabase
        .rpc('buscar_opcoes_fatura', {
          p_cartao_id: formData.cartaoId,
          p_data_compra: formData.dataCompra
        });
        
      if (error) {
        console.warn('RPC buscar_opcoes_fatura não encontrada, usando fallback');
        return calcularOpcoesFaturaFallback();
      }
      
      return opcoesFatura || [];
      
    } catch (error) {
      console.error('Erro ao calcular opções via RPC:', error);
      return calcularOpcoesFaturaFallback();
    }
  }, [formData.dataCompra, formData.cartaoId]);

  // Fallback para cálculo de fatura (mantido como estava)
  const calcularOpcoesFaturaFallback = useCallback(() => {
    if (!formData.dataCompra || !formData.cartaoId) return [];
    
    const cartao = cartoesAtivos.find(c => c.id === formData.cartaoId);
    if (!cartao) return [];
    
    const dataCompra = new Date(formData.dataCompra);
    const diaFechamento = cartao.dia_fechamento || 1;
    const diaVencimento = cartao.dia_vencimento || 10;
    
    const opcoes = [];
    
    for (let i = -2; i <= 3; i++) {
      const dataFechamento = new Date(dataCompra.getFullYear(), dataCompra.getMonth() + i, diaFechamento);
      const dataVencimento = new Date(dataCompra.getFullYear(), dataCompra.getMonth() + i, diaVencimento);
      
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

  const [opcoesFatura, setOpcoesFatura] = useState([]);

  // Effect para calcular opções de fatura
  useEffect(() => {
    if (formData.cartaoId && formData.dataCompra) {
      calcularOpcoesFatura().then(setOpcoesFatura);
    } else {
      setOpcoesFatura([]);
    }
  }, [formData.cartaoId, formData.dataCompra, calcularOpcoesFatura]);

  // Effects para filtros (mantidos)
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

  // Reset form (mantido)
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

  // Handler para ESC e cancelar (mantido)
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

  // Handlers de input (mantidos)
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

  // Handler de valor (mantido)
  const handleValorChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, valorTotal: valorFormatado }));
    if (errors.valorTotal) {
      setErrors(prev => ({ ...prev, valorTotal: null }));
    }
  }, [formatarValor, errors.valorTotal]);

  // Handlers de categoria (mantidos)
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

  // Handlers de subcategoria (mantidos)
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

  // ✅ OTIMIZAÇÃO: Usar hook para criar categoria/subcategoria
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

  // Validação (mantida)
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

  // ✅ OTIMIZAÇÃO: Usar hook useCartoes.adicionarDespesaCartao()
  const salvarDespesaCartao = useCallback(async () => {
    try {
      // ✅ PREPARAR: Dados para cada parcela
      const dadosBase = {
        data: formData.dataCompra,
        descricao: formData.descricao.trim(),
        categoria_id: formData.categoria,
        subcategoria_id: formData.subcategoria || null,
        observacoes: formData.observacoes.trim() || null,
        fatura_vencimento: formData.faturaVencimento
      };

      // ✅ USAR HOOK: Para cada parcela, usar adicionarDespesaCartao do hook
      const resultados = [];
      
      const valorParcelaCalc = valorNumerico / formData.numeroParcelas;
      const grupoParcelamento = crypto.randomUUID();
      
      for (let i = 1; i <= formData.numeroParcelas; i++) {
        // Calcular data de vencimento para cada parcela
        const dataVencimento = new Date(formData.faturaVencimento);
        dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));
        
        const dadosParcela = {
          ...dadosBase,
          descricao: dadosBase.descricao + (formData.numeroParcelas > 1 ? ` (${i}/${formData.numeroParcelas})` : ''),
          valor: valorParcelaCalc,
          parcela_atual: i,
          total_parcelas: formData.numeroParcelas,
          grupo_parcelamento: grupoParcelamento,
          fatura_vencimento: dataVencimento.toISOString().split('T')[0]
        };
        
        // ✅ USAR: Função do hook useCartoes
        const resultado = await adicionarDespesaCartao(formData.cartaoId, dadosParcela);
        resultados.push(resultado);
        
        if (!resultado.success) {
          throw new Error(resultado.error || `Erro na parcela ${i}`);
        }
      }
      
      console.log('✅ Todas as parcelas salvas via hook:', resultados.length);
      return resultados;
      
    } catch (error) {
      console.error('❌ Erro ao salvar via hook:', error);
      throw error;
    }
  }, [formData, valorNumerico, adicionarDespesaCartao]);

  // ✅ OTIMIZAÇÃO: Submissão usando hook
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
  }, [validateForm, salvarDespesaCartao, onSave, showNotification, resetForm, onClose]);

  if (!isOpen) return null;

  // ✅ LOADING: Mostrar loading enquanto carrega dados dos hooks
  const isLoadingData = loading || isLoadingCartoes || isLoadingCategorias;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="forms-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-purple">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="modal-title">Despesa com Cartão</h2>
              <p className="modal-subtitle">Registre compras no cartão de crédito</p>
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
              
              <h3 className="section-title">Informações da Compra</h3>
              
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
                      disabled={submitting}
                      className={errors.cartaoId ? 'error' : ''}
                    >
                      <option value="">Selecione um cartão</option>
                      {cartoesAtivos.map(cartao => (
                        <option key={cartao.id} value={cartao.id}>
                          {cartao.nome} ({cartao.bandeira})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.cartaoId && <div className="form-error">{errors.cartaoId}</div>}
                </div>
                
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
                      disabled={submitting}
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
              </div>

              {/* Fatura de Vencimento */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <Calendar size={14} />
                  Fatura de Vencimento *
                  <small className="form-label-small">(primeira parcela)</small>
                </label>
                <div className="select-search">
                  <select
                    name="faturaVencimento"
                    value={formData.faturaVencimento}
                    onChange={handleInputChange}
                    disabled={submitting || !formData.cartaoId}
                    className={`${!formData.cartaoId ? 'input-disabled' : ''} ${errors.faturaVencimento ? 'error' : ''}`}
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
              </div>

              {/* Preview do Parcelamento */}
              {valorNumerico > 0 && formData.numeroParcelas > 0 && (
                <div className="summary-panel summary-panel-purple mb-3">
                  <div className="parcelamento-preview">
                    💳 {formData.numeroParcelas}x de {formatCurrency(valorParcela)}
                    {formData.numeroParcelas > 1 && (
                      <div className="parcelamento-total">
                        Total: {formatCurrency(valorNumerico)}
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
        </div>
      </div>
      
      {/* Modal de Confirmação */}
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
    </div>
  );
};

DespesasCartaoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(DespesasCartaoModal);