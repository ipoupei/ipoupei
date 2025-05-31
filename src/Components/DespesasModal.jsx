// src/components/DespesasModal.jsx - VERSÃO ZUSTAND COMPATÍVEL
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
  Search
} from 'lucide-react';

// Imports compatíveis com Zustand
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabaseClient';

// CSS existente
import './FormsModal.css';

/**
 * Modal de Despesas - Versão Zustand Compatível
 * Integrado com os stores do Zustand existentes
 * Remove dependências de hooks inexistentes
 */
const DespesasModal = ({ isOpen, onClose, onSave }) => {
  // Zustand stores
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // Refs para focus management
  const valorInputRef = useRef(null);

  // Estados principais
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipoDespesa, setTipoDespesa] = useState('simples');

  // Estados para dados
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);

  // Estado do formulário
  const [formData, setFormData] = useState({
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    categoria: '',
    conta: '',
    efetivado: true,
    observacoes: '',
    // Campos de recorrência
    totalRecorrencias: 12,
    tipoRecorrencia: 'mensal',
    primeiroEfetivado: true,
    // Campos de parcelamento
    numeroParcelas: 2,
    primeiraParcela: new Date().toISOString().split('T')[0]
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
      // Buscar categorias de despesa
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('tipo', 'despesa')
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

  const opcoesParcelas = useMemo(() =>
    Array.from({ length: 47 }, (_, i) => ({
      value: i + 2,
      label: `${i + 2}x`
    })),
    []
  );

  // Cálculos derivados
  const valorTotal = useMemo(() => {
    if (tipoDespesa === 'recorrente') {
      return formData.valor * formData.totalRecorrencias;
    }
    return formData.valor;
  }, [formData.valor, formData.totalRecorrencias, tipoDespesa]);

  const valorParcela = useMemo(() => {
    if (tipoDespesa === 'parcelada' && formData.numeroParcelas > 0) {
      return formData.valor / formData.numeroParcelas;
    }
    return formData.valor;
  }, [formData.valor, formData.numeroParcelas, tipoDespesa]);

  const dataFinal = useMemo(() => {
    if (tipoDespesa === 'recorrente' && formData.data) {
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
    } else if (tipoDespesa === 'parcelada' && formData.primeiraParcela) {
      const data = new Date(formData.primeiraParcela);
      data.setMonth(data.getMonth() + (formData.numeroParcelas - 1));
      return data.toLocaleDateString('pt-BR');
    }
    
    return null;
  }, [tipoDespesa, formData.data, formData.totalRecorrencias, formData.tipoRecorrencia, formData.primeiraParcela, formData.numeroParcelas]);

  // Verificar se data é futura
  const isDataFutura = useCallback((data) => {
    if (!data) return false;
    const hoje = new Date();
    const dataTransacao = new Date(data);
    hoje.setHours(0, 0, 0, 0);
    dataTransacao.setHours(0, 0, 0, 0);
    return dataTransacao > hoje;
  }, []);

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
      valor: 0,
      data: dataAtual,
      descricao: '',
      categoria: '',
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

  // Handlers
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let inputValue = type === 'checkbox' ? checked : value;
    
    // Converter números quando necessário
    if (name === 'valor' || name === 'totalRecorrencias' || name === 'numeroParcelas') {
      inputValue = parseFloat(value) || 0;
    }
    
    if (name === 'data') {
      const dataFutura = isDataFutura(inputValue);
      setFormData(prev => ({
        ...prev,
        [name]: inputValue,
        efetivado: !dataFutura,
        primeiroEfetivado: !dataFutura
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: inputValue }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors, isDataFutura]);

  const handleTipoDespesaChange = useCallback((tipo) => {
    setTipoDespesa(tipo);
  }, []);

  // Validação do formulário
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
    if (!formData.categoria) {
      newErrors.categoria = "Categoria é obrigatória";
    }
    if (!formData.conta) {
      newErrors.conta = "Conta é obrigatória";
    }
    if (formData.observacoes && formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    // Validações específicas para recorrentes
    if (tipoDespesa === 'recorrente') {
      if (formData.totalRecorrencias < 1) {
        newErrors.totalRecorrencias = "Quantidade deve ser pelo menos 1";
      }
      if (formData.totalRecorrencias > 60) {
        newErrors.totalRecorrencias = "Máximo de 60 recorrências";
      }
    }

    // Validações específicas para parceladas
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
  }, [formData, tipoDespesa]);

  // Submissão do formulário
  const handleSubmit = useCallback(async (e, criarNova = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (tipoDespesa === 'recorrente') {
        // Criar despesas recorrentes
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
            conta_id: formData.conta,
            valor: formData.valor,
            tipo: 'despesa',
            efetivado: i === 0 ? formData.primeiroEfetivado : false,
            observacoes: formData.observacoes.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        const { data, error } = await supabase
          .from('transacoes')
          .insert(despesas)
          .select();
        
        if (error) throw error;
        
        showNotification(`${formData.totalRecorrencias} despesas recorrentes criadas!`, 'success');
        
      } else if (tipoDespesa === 'parcelada') {
        // Criar despesas parceladas
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
            conta_id: formData.conta,
            valor: valorParcela,
            tipo: 'despesa',
            efetivado: false, // Parcelas começam como planejadas
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
        
        showNotification(`Despesa parcelada em ${formData.numeroParcelas}x criada!`, 'success');
        
      } else {
        // Transação simples
        const dadosDespesa = {
          usuario_id: user.id,
          data: formData.data,
          descricao: formData.descricao.trim(),
          categoria_id: formData.categoria,
          conta_id: formData.conta,
          valor: formData.valor,
          tipo: 'despesa',
          efetivado: formData.efetivado,
          observacoes: formData.observacoes.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('transacoes')
          .insert([dadosDespesa])
          .select();
        
        if (error) throw error;
        
        showNotification('Despesa registrada com sucesso!', 'success');
      }
      
      if (onSave) onSave();
      
      if (criarNova) {
        setFormData(prev => ({
          ...prev,
          valor: 0,
          data: new Date().toISOString().split('T')[0],
          descricao: '',
          efetivado: true,
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
      console.error('❌ Erro ao salvar despesa:', error);
      showNotification(`Erro ao salvar despesa: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, user.id, formData, tipoDespesa, valorParcela, onSave, showNotification, resetForm, onClose]);

  const handleCancelar = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="receitas-modal-overlay">
      <div className="receitas-modal-container">
        {/* Header */}
        <div className="receitas-modal-header">
          <h2 className="receitas-modal-title">
            {tipoDespesa === 'recorrente' ? (
              <Repeat size={18} style={{ color: '#ef4444' }} />
            ) : tipoDespesa === 'parcelada' ? (
              <CreditCard size={18} style={{ color: '#ef4444' }} />
            ) : (
              <TrendingDown size={18} style={{ color: '#ef4444' }} />
            )}
            {tipoDespesa === 'recorrente' ? 'Despesas Recorrentes' : 
             tipoDespesa === 'parcelada' ? 'Despesa Parcelada' : 
             'Nova Despesa'}
          </h2>
          <button className="receitas-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="receitas-modal-content">
          {/* Loading */}
          {loading ? (
            <div className="receitas-loading">
              <div className="receitas-loading-spinner" style={{ borderTopColor: '#ef4444' }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando dados...
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="receitas-form">
              
              {/* Tipo de Despesa */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <Tag size={14} />
                  Tipo de Despesa
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {[
                    { value: 'simples', label: 'Simples', icon: <TrendingDown size={16} /> },
                    { value: 'recorrente', label: 'Recorrente', icon: <Repeat size={16} /> },
                    { value: 'parcelada', label: 'Parcelada', icon: <CreditCard size={16} /> }
                  ].map(tipo => (
                    <label
                      key={tipo.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: tipoDespesa === tipo.value ? '2px solid #ef4444' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: tipoDespesa === tipo.value ? '#fef2f2' : 'white',
                        color: tipoDespesa === tipo.value ? '#ef4444' : '#374151',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="tipoDespesa"
                        value={tipo.value}
                        checked={tipoDespesa === tipo.value}
                        onChange={(e) => handleTipoDespesaChange(e.target.value)}
                        style={{ display: 'none' }}
                      />
                      {tipo.icon}
                      {tipo.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Valor e Data */}
              <div className="receitas-form-row">
                <div className="receitas-form-group">
                  <label className="receitas-form-label">
                    <DollarSign size={14} />
                    {tipoDespesa === 'parcelada' ? 'Valor Total' : 'Valor'} *
                  </label>
                  <input
                    ref={valorInputRef}
                    type="number"
                    name="valor"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={handleInputChange}
                    placeholder="0.00"
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
                    {tipoDespesa === 'recorrente' ? 'Data Início' : 
                     tipoDespesa === 'parcelada' ? 'Data Compra' : 'Data'} *
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

              {/* Campos específicos por tipo */}
              {tipoDespesa === 'recorrente' && (
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
                  {formData.valor > 0 && formData.totalRecorrencias > 0 && (
                    <div className="cartao-preview-compacto" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <div className="preview-texto" style={{ color: '#ef4444', flexDirection: 'column', gap: '4px' }}>
                        <span>🔄 {formData.totalRecorrencias}x de {formatCurrency(formData.valor)} ({formData.tipoRecorrencia})</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                          Total: {formatCurrency(valorTotal)}
                          {dataFinal && ` • Até: ${dataFinal}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status da primeira recorrência */}
                  <div className="receitas-form-group receitas-form-full">
                    <label className="receitas-form-label">
                      {formData.primeiroEfetivado ? <CheckCircle size={14} /> : <Clock size={14} />}
                      Status da Primeira Despesa
                    </label>
                    
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
                  </div>
                </>
              )}

              {tipoDespesa === 'parcelada' && (
                <>
                  <div className="receitas-form-row">
                    <div className="receitas-form-group">
                      <label className="receitas-form-label">
                        <Hash size={14} />
                        Número de Parcelas *
                      </label>
                      <select
                        name="numeroParcelas"
                        value={formData.numeroParcelas}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className={`receitas-form-input ${errors.numeroParcelas ? 'error' : ''}`}
                      >
                        {opcoesParcelas.map(opcao => (
                          <option key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="receitas-form-group">
                      <label className="receitas-form-label">
                        <Calendar size={14} />
                        Primeira Parcela *
                      </label>
                      <input
                        type="date"
                        name="primeiraParcela"
                        value={formData.primeiraParcela}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className={`receitas-form-input ${errors.primeiraParcela ? 'error' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Preview do Parcelamento */}
                  {formData.valor > 0 && formData.numeroParcelas > 0 && (
                    <div className="cartao-preview-compacto" style={{ backgroundColor: 'rgba(147, 51, 234, 0.08)', borderColor: 'rgba(147, 51, 234, 0.15)' }}>
                      <div className="preview-texto" style={{ color: '#9333ea', flexDirection: 'column', gap: '4px' }}>
                        <span>💳 {formData.numeroParcelas}x de {formatCurrency(valorParcela)}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                          Total: {formatCurrency(formData.valor)}
                          {dataFinal && ` • Até: ${dataFinal}`}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Descrição */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
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
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`receitas-form-input ${errors.categoria ? 'error' : ''}`}
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <div className="receitas-form-error">{errors.categoria}</div>
                )}
              </div>

              {/* Conta */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  <Building size={14} />
                  Conta de Débito *
                </label>
                <select
                  name="conta"
                  value={formData.conta}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`receitas-form-input ${errors.conta ? 'error' : ''}`}
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

              {/* Status (apenas para despesas simples) */}
              {tipoDespesa === 'simples' && (
                <div className="receitas-form-group receitas-form-full">
                  <label className="receitas-form-label">
                    {formData.efetivado ? <CheckCircle size={14} /> : <Clock size={14} />}
                    Status da Despesa
                  </label>
                  
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
                  placeholder="Observações adicionais (opcional)..."
                  rows="2"
                  disabled={submitting}
                  maxLength="300"
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

              {/* Botões de ação */}
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
                  className="receitas-btn receitas-btn-primary"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      {tipoDespesa === 'recorrente' ? `Criando ${formData.totalRecorrencias} despesas...` : 
                       tipoDespesa === 'parcelada' ? `Criando ${formData.numeroParcelas} parcelas...` :
                       'Salvando...'}
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      {tipoDespesa === 'recorrente' ? `Criar ${formData.totalRecorrencias} Despesas` : 
                       tipoDespesa === 'parcelada' ? `Parcelar em ${formData.numeroParcelas}x` :
                       'Salvar Despesa'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

DespesasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(DespesasModal);