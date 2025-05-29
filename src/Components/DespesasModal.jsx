import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingDown, 
  Plus, 
  X, 
  Calendar, 
  FileText, 
  Tag, 
  Building, 
  DollarSign, 
  MessageSquare, 
  Search,
  PlusCircle,
  CheckCircle,
  Clock,
  Repeat,
  Hash
} from 'lucide-react';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';
import { supabase } from '../lib/supabaseClient';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatCurrency';
import './FormsModal.css';

/**
 * Modal moderno para lançamento de despesas com funcionalidade de recorrência
 * VERSÃO ATUALIZADA - com despesas recorrentes e status de efetivação
 */
const DespesasModal = ({ isOpen, onClose, onSave }) => {
  const valorInputRef = useRef(null);
  const categoriaInputRef = useRef(null);
  const subcategoriaInputRef = useRef(null);
  
  const { user } = useAuth();
  const { categorias, loading: categoriasLoading, addCategoria, addSubcategoria } = useCategorias();
  const { contas, loading: contasLoading } = useContas();
  
  // Memoizar categorias de despesa para evitar recalculos desnecessários
  const categoriasDespesa = useMemo(() => 
    categorias.filter(cat => cat.tipo === 'despesa'), 
    [categorias]
  );
  
  // Memoizar contas ativas
  const contasAtivas = useMemo(() => 
    contas.filter(conta => conta.ativo),
    [contas]
  );
  
  // Função para obter data atual - memoizada para evitar recalculos
  const getCurrentDate = useCallback(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }, []);
  
  // Função para verificar se data é futura
  const isDataFutura = useCallback((data) => {
    if (!data) return false;
    const hoje = new Date();
    const dataTransacao = new Date(data);
    hoje.setHours(0, 0, 0, 0);
    dataTransacao.setHours(0, 0, 0, 0);
    return dataTransacao > hoje;
  }, []);
  
  const [formData, setFormData] = useState({
    valor: 0,
    data: getCurrentDate(),
    // *** CAMPOS PARA RECORRÊNCIA ***
    isRecorrente: false,
    totalRecorrencias: 12,
    tipoRecorrencia: 'mensal',
    primeiroEfetivado: true,
    // *** CAMPOS RESTANTES ***
    descricao: '',
    categoria: '',
    categoriaTexto: '',
    subcategoria: '',
    subcategoriaTexto: '',
    contaDebito: '',
    efetivado: true,
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
  
  // Opções de recorrência
  const opcoesRecorrencia = useMemo(() => [
    { value: 'semanal', label: 'Semanal' },
    { value: 'quinzenal', label: 'Quinzenal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'anual', label: 'Anual' }
  ], []);
  
  // Opções de quantidade de recorrências
  const opcoesQuantidade = useMemo(() => 
    Array.from({ length: 60 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1} ${i === 0 ? 'vez' : 'vezes'}`
    })),
    []
  );
  
  // Calcula valor total da recorrência
  const valorTotalRecorrencia = useMemo(() => 
    formData.isRecorrente ? formData.valor * formData.totalRecorrencias : formData.valor,
    [formData.valor, formData.totalRecorrencias, formData.isRecorrente]
  );
  
  // Calcula data final estimada (só para recorrentes)
  const dataFinalEstimada = useMemo(() => {
    if (!formData.isRecorrente || !formData.data || !formData.totalRecorrencias) return null;
    
    const dataInicio = new Date(formData.data);
    let dataFinal = new Date(dataInicio);
    
    switch (formData.tipoRecorrencia) {
      case 'semanal':
        dataFinal.setDate(dataFinal.getDate() + (7 * (formData.totalRecorrencias - 1)));
        break;
      case 'quinzenal':
        dataFinal.setDate(dataFinal.getDate() + (14 * (formData.totalRecorrencias - 1)));
        break;
      case 'mensal':
        dataFinal.setMonth(dataFinal.getMonth() + (formData.totalRecorrencias - 1));
        break;
      case 'anual':
        dataFinal.setFullYear(dataFinal.getFullYear() + (formData.totalRecorrencias - 1));
        break;
      default:
        dataFinal.setMonth(dataFinal.getMonth() + (formData.totalRecorrencias - 1));
    }
    
    return dataFinal.toLocaleDateString('pt-BR');
  }, [formData.isRecorrente, formData.data, formData.totalRecorrencias, formData.tipoRecorrencia]);
  
  // USEEFFECT OTIMIZADO - apenas quando necessário
  useEffect(() => {
    if (!categoriasDespesa.length) return;
    
    if (formData.categoriaTexto) {
      const filtradas = categoriasDespesa.filter(cat =>
        cat.nome.toLowerCase().includes(formData.categoriaTexto.toLowerCase())
      );
      setCategoriasFiltradas(filtradas);
    } else {
      setCategoriasFiltradas(categoriasDespesa);
    }
  }, [formData.categoriaTexto, categoriasDespesa]);
  
  // USEEFFECT OTIMIZADO para subcategorias
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
  
  // Efeito para definir status efetivado baseado na data
  useEffect(() => {
    if (formData.data) {
      const dataFutura = isDataFutura(formData.data);
      setFormData(prev => ({
        ...prev,
        efetivado: !dataFutura, // Se não é futura, está efetivado
        primeiroEfetivado: !dataFutura // Para recorrentes também
      }));
    }
  }, [formData.data, isDataFutura]);
  
  // Reset form quando modal abre
  const resetForm = useCallback(() => {
    const dataAtual = getCurrentDate();
    setFormData({
      valor: 0,
      data: dataAtual,
      // Campos de recorrência
      isRecorrente: false,
      totalRecorrencias: 12,
      tipoRecorrencia: 'mensal',
      primeiroEfetivado: true,
      // Outros campos
      descricao: '',
      categoria: '',
      categoriaTexto: '',
      subcategoria: '',
      subcategoriaTexto: '',
      contaDebito: '',
      efetivado: true,
      observacoes: ''
    });
    setErrors({});
    setFeedback({ visible: false, message: '', type: '' });
    setCategoriaDropdownOpen(false);
    setSubcategoriaDropdownOpen(false);
    setConfirmacao({ show: false, type: '', nome: '', categoriaId: '' });
  }, [getCurrentDate]);
  
  // USEEFFECT apenas para abertura do modal
  useEffect(() => {
    if (isOpen) {
      resetForm();
      const timer = setTimeout(() => {
        valorInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetForm]);
  
  // CALLBACKS MEMOIZADOS para evitar re-criação
  const showFeedback = useCallback((message, type = 'success') => {
    setFeedback({ visible: true, message, type });
    const timer = setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // Para checkbox, usa o valor checked
    const inputValue = type === 'checkbox' ? checked : value;
    
    // Lógica especial para categoria
    if (name === 'categoria') {
      setFormData(prev => ({
        ...prev,
        [name]: inputValue,
        subcategoria: '' // Reseta a subcategoria
      }));
    } else if (name === 'data') {
      // Quando muda a data, atualiza também o status efetivado
      const dataFutura = isDataFutura(inputValue);
      setFormData(prev => ({
        ...prev,
        [name]: inputValue,
        efetivado: !dataFutura, // Se não é futura, está efetivado
        primeiroEfetivado: !dataFutura // Para recorrentes também
      }));
    } else if (name === 'totalRecorrencias') {
      // Garantir que seja pelo menos 1
      const quantidade = Math.max(1, parseInt(inputValue) || 1);
      setFormData(prev => ({
        ...prev,
        [name]: quantidade
      }));
    } else if (name === 'isRecorrente') {
      // Quando ativa/desativa recorrência, reset alguns campos
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
  
  const handleValorChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, valor: value }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }
  }, [errors.valor]);
  
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
    
    if (!formData.valor || formData.valor === 0) {
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
    if (!formData.contaDebito) {
      newErrors.contaDebito = "Conta é obrigatória";
    }
    if (formData.observacoes.length > 300) {
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
    
    // Verifica se a conta está ativa
    const conta = contas.find(c => c.id === formData.contaDebito);
    if (conta && !conta.ativo) {
      newErrors.contaDebito = "Esta conta está inativa";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, contas]);
  
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      if (formData.isRecorrente) {
        // *** USAR FUNÇÃO DE RECORRÊNCIA ***
        const { data, error } = await supabase
          .rpc('criar_transacoes_recorrentes', {
            p_usuario_id: user.id,
            p_tipo: 'despesa',
            p_descricao: formData.descricao.trim(),
            p_valor: formData.valor,
            p_categoria_id: formData.categoria,
            p_conta_id: formData.contaDebito,
            p_data_inicio: formData.data,
            p_total_recorrencias: formData.totalRecorrencias,
            p_tipo_recorrencia: formData.tipoRecorrencia,
            p_subcategoria_id: formData.subcategoria || null,
            p_primeiro_efetivado: formData.primeiroEfetivado,
            p_observacoes: formData.observacoes.trim() || null
          });
        
        if (error) throw error;
        
        console.log("✅ Despesas recorrentes criadas. Grupo ID:", data);
        
        if (onSave) onSave();
        
        const mensagem = `${formData.totalRecorrencias} despesas recorrentes criadas com sucesso!`;
        showFeedback(mensagem);
        
      } else {
        // *** TRANSAÇÃO SIMPLES ***
        const dadosDespesa = {
          usuario_id: user.id,
          data: formData.data,
          descricao: formData.descricao.trim(),
          categoria_id: formData.categoria,
          subcategoria_id: formData.subcategoria || null,
          conta_id: formData.contaDebito,
          valor: formData.valor,
          tipo: 'despesa',
          observacoes: formData.observacoes.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('transacoes')
          .insert([dadosDespesa])
          .select();
        
        if (error) throw error;
        
        console.log("✅ Despesa simples salva:", data);
        
        if (onSave) onSave();
        
        showFeedback('Despesa registrada com sucesso!');
      }
      
      if (criarNova) {
        // Reset campos principais mantendo categoria e conta
        setFormData(prev => {
          const dataAtual = getCurrentDate();
          return {
            ...prev,
            valor: 0,
            data: dataAtual,
            descricao: '',
            efetivado: true,
            isRecorrente: false,
            totalRecorrencias: 12,
            observacoes: ''
          };
        });
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
      console.error('❌ Erro ao salvar despesa:', error);
      showFeedback(`Erro ao salvar despesa: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, user.id, formData, onSave, showFeedback, getCurrentDate, resetForm, onClose]);
  
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
  
  // EARLY RETURN - se não estiver aberto
  if (!isOpen) return null;
  
  return (
    <div className="receitas-modal-overlay">
      <div className="receitas-modal-container">
        {/* Header compacto */}
        <div className="receitas-modal-header">
          <h2 className="receitas-modal-title">
            {formData.isRecorrente ? <Repeat size={18} style={{ color: '#ef4444' }} /> : <TrendingDown size={18} style={{ color: '#ef4444' }} />}
            {formData.isRecorrente ? 'Despesas Recorrentes' : 'Nova Despesa'}
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
          {(categoriasLoading || contasLoading) ? (
            <div className="receitas-loading">
              <div className="receitas-loading-spinner" style={{ borderTopColor: '#ef4444' }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando dados...
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="receitas-form">
              {/* ===== ORDEM REORGANIZADA ===== */}
              
              {/* 1. VALOR E DATA - Layout horizontal compacto */}
              <div className="receitas-form-row">
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <DollarSign size={14} />
                    Valor {formData.isRecorrente ? '(cada)' : ''} *
                  </label>
                  <InputMoney
                    ref={valorInputRef}
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    disabled={submitting}
                    className={`receitas-form-input receitas-valor-input ${errors.valor ? 'error' : ''}`}
                    style={{ color: '#ef4444' }}
                  />
                  {errors.valor && (
                    <div className="receitas-form-error">{errors.valor}</div>
                  )}
                </div>
                
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <Calendar size={14} />
                    {formData.isRecorrente ? 'Início' : 'Data'} *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.data ? 'error' : ''}`}
                  />
                  {errors.data && (
                    <div className="receitas-form-error">{errors.data}</div>
                  )}
                </div>
              </div>
              
              {/* 2. TOGGLE RECORRENTE */}
              <div className="receitas-form-group receitas-form-full">
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    name="isRecorrente"
                    checked={formData.isRecorrente}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                  <Repeat size={16} />
                  Despesa recorrente (repetir automaticamente)
                </label>
                <small style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                  💡 Marque para criar múltiplas despesas (aluguel, financiamento, etc.)
                </small>
              </div>
              
              {/* 3. CAMPOS ESPECÍFICOS DE RECORRÊNCIA - Aparecem apenas se isRecorrente = true */}
              {formData.isRecorrente && (
                <>
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
                      {errors.tipoRecorrencia && (
                        <div className="receitas-form-error">{errors.tipoRecorrencia}</div>
                      )}
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
                      {errors.totalRecorrencias && (
                        <div className="receitas-form-error">{errors.totalRecorrencias}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview da Recorrência */}
                  {formData.valor > 0 && formData.totalRecorrencias > 0 && (
                    <div className="cartao-preview-compacto" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <div className="preview-texto" style={{ color: '#ef4444', flexDirection: 'column', gap: '4px' }}>
                        <span>🔄 {formData.totalRecorrencias}x de {formatCurrency(formData.valor)} ({formData.tipoRecorrencia})</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                          Total: {formatCurrency(valorTotalRecorrencia)}
                          {dataFinalEstimada && ` • Até: ${dataFinalEstimada}`}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* 4. STATUS DE EFETIVAÇÃO */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  {formData.isRecorrente ? 
                    (formData.primeiroEfetivado ? <CheckCircle size={14} /> : <Clock size={14} />) :
                    (formData.efetivado ? <CheckCircle size={14} /> : <Clock size={14} />)
                  }
                  Status {formData.isRecorrente ? 'do Primeiro Lançamento' : 'da Transação'}
                </label>
                
                {formData.isRecorrente ? (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: formData.primeiroEfetivado ? '#ef4444' : '#6b7280'
                    }}>
                      <input
                        type="radio"
                        name="primeiroEfetivado"
                        checked={formData.primeiroEfetivado === true}
                        onChange={() => setFormData(prev => ({ ...prev, primeiroEfetivado: true }))}
                        disabled={submitting}
                      />
                      <CheckCircle size={16} />
                      Primeira já paga
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: !formData.primeiroEfetivado ? '#f59e0b' : '#6b7280'
                    }}>
                      <input
                        type="radio"
                        name="primeiroEfetivado"
                        checked={formData.primeiroEfetivado === false}
                        onChange={() => setFormData(prev => ({ ...prev, primeiroEfetivado: false }))}
                        disabled={submitting}
                      />
                      <Clock size={16} />
                      Todas planejadas
                    </label>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: formData.efetivado ? '#ef4444' : '#6b7280'
                    }}>
                      <input
                        type="radio"
                        name="efetivado"
                        checked={formData.efetivado === true}
                        onChange={() => setFormData(prev => ({ ...prev, efetivado: true }))}
                        disabled={submitting}
                      />
                      <CheckCircle size={16} />
                      Despesa já paga
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: !formData.efetivado ? '#f59e0b' : '#6b7280'
                    }}>
                      <input
                        type="radio"
                        name="efetivado"
                        checked={formData.efetivado === false}
                        onChange={() => setFormData(prev => ({ ...prev, efetivado: false }))}
                        disabled={submitting}
                      />
                      <Clock size={16} />
                      Despesa planejada
                    </label>
                  </div>
                )}
                
                <small style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                  💡 {formData.isRecorrente ? 
                    'Define se o primeiro lançamento já foi pago ou está planejado' :
                    'Despesas futuras são automaticamente marcadas como planejadas'
                  }
                </small>
              </div>
              
              {/* ===== DEMAIS CAMPOS ===== */}
              
              {/* 5. DESCRIÇÃO */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <FileText size={14} />
                  Descrição *
                  {formData.isRecorrente && <small>(será numerada automaticamente)</small>}
                </label>
                <input
                  type="text"
                  name="descricao"
                  placeholder={formData.isRecorrente ? "Ex: Aluguel, Financiamento, Plano de saúde" : "Ex: Almoço no restaurante, Compras no supermercado"}
                  value={formData.descricao}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`receitas-form-input ${errors.descricao ? 'error' : ''}`}
                />
                {errors.descricao && (
                  <div className="receitas-form-error">{errors.descricao}</div>
                )}
                {formData.isRecorrente && formData.descricao && (
                  <small style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                    💡 Será salvo como: "{formData.descricao} (1/{formData.totalRecorrencias})", "{formData.descricao} (2/{formData.totalRecorrencias})", etc.
                  </small>
                )}
              </div>
              
              {/* 6. CATEGORIA */}
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
                {errors.categoria && (
                  <div className="receitas-form-error">{errors.categoria}</div>
                )}
              </div>
              
              {/* 7. SUBCATEGORIA */}
              {categoriaSelecionada && (
                <div className="receitas-form-group receitas-form-full">
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
              
              {/* 8. CONTA DÉBITO */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <Building size={14} />
                  Conta Débito *
                </label>
                <select
                  name="contaDebito"
                  value={formData.contaDebito}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`receitas-form-input ${errors.contaDebito ? 'error' : ''}`}
                >
                  <option value="">Selecione uma conta</option>
                  {contasAtivas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} - {formatCurrency(conta.saldo)}
                    </option>
                  ))}
                </select>
                {errors.contaDebito && (
                  <div className="receitas-form-error">{errors.contaDebito}</div>
                )}
              </div>
              
              {/* 9. OBSERVAÇÕES */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <MessageSquare size={14} />
                  Observações <small>(máx. 300)</small>
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleObservacoesChange}
                  placeholder={formData.isRecorrente ? 
                    "Adicione informações extras sobre estas despesas recorrentes" :
                    "Adicione informações extras sobre esta despesa"
                  }
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
                  className="receitas-btn receitas-btn-tertiary"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      {formData.isRecorrente ? 'Criando...' : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} />
                      {formData.isRecorrente ? 'Criar e Nova' : 'Salvar e Nova'}
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="receitas-btn receitas-btn-primary"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      {formData.isRecorrente ? `Criando ${formData.totalRecorrencias} despesas...` : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      {formData.isRecorrente ? `Criar ${formData.totalRecorrencias} Despesas` : 'Salvar Despesa'}
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
                className="receitas-confirmation-btn receitas-confirmation-btn-primary"
                style={{ backgroundColor: '#ef4444' }}
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
  onSave: PropTypes.func
};

export default DespesasModal;