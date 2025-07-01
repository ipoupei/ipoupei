// src/modules/contas/components/ContasModal.jsx - VERSÃO CORRIGIDA COM STORE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Building, 
  Plus, 
  Edit, 
  Archive,
  ArchiveRestore,
  X, 
  Calculator,
  DollarSign,
  Palette,
  FileText,
  Eye,
  EyeOff,
  Lock,
  AlertCircle
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import useContas from '@modules/contas/hooks/useContas';
import '@shared/styles/FormsModal.css';
import useContasStore from '@/modules/contas/store/contasStore';


/**
 * Modal de Gerenciamento de Contas - VERSÃO CORRIGIDA COM STORE
 * ✅ Usa useContas que agora funciona com store
 * ✅ Elimina dependências diretas do Supabase
 * ✅ Interface limpa e consistente
 */
const ContasModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ USAR HOOK REFATORADO COM STORE
  const {
    contas,
    contasArquivadas,
    loading,
    addConta,
    updateConta,
    arquivarConta,
    desarquivarConta,
    corrigirSaldoConta,
    fetchContasArquivadas,
    // ✅ REMOVIDO: recalcularSaldos - não existe mais, pois store gerencia automaticamente
  } = useContas();
  
  const nomeInputRef = useRef(null);

  // =============================================================================
  // ESTADOS PRINCIPAIS
  // =============================================================================
  
  const [submitting, setSubmitting] = useState(false);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);
  
  // Estados do formulário de conta
  const [modoFormulario, setModoFormulario] = useState(null); // null, 'criar', 'editar'
  const [contaEditando, setContaEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'corrente',
    banco: '',
    saldoInicial: '0,00',
    cor: '#3B82F6'
  });
  const [formErrors, setFormErrors] = useState({});

  // Estados dos modais de ação
  const [modalCorreirSaldo, setModalCorrigirSaldo] = useState({
    ativo: false,
    conta: null,
    novoSaldo: '',
    metodo: 'ajuste', // 'ajuste' ou 'saldo_inicial'
    motivo: ''
  });

  const [modalArquivar, setModalArquivar] = useState({
    ativo: false,
    conta: null,
    motivo: ''
  });

  const [modalDesarquivar, setModalDesarquivar] = useState({
    ativo: false,
    conta: null
  });

  // =============================================================================
  // CONFIGURAÇÕES E CONSTANTES
  // =============================================================================
  
  const tiposConta = [
    { value: 'corrente', label: 'Conta Corrente', icon: '🏦' },
    { value: 'poupanca', label: 'Poupança', icon: '🐷' },
    { value: 'investimento', label: 'Investimentos', icon: '📈' },
    { value: 'carteira', label: 'Carteira', icon: '👛' }
  ];

  const coresPredefinidas = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================
  
  const formatarValorInput = useCallback((valor) => {
    const apenasNumeros = valor.toString().replace(/\D/g, '');
    if (!apenasNumeros || apenasNumeros === '0') return '';
    const valorEmCentavos = parseInt(apenasNumeros, 10);
    const valorEmReais = valorEmCentavos / 100;
    return valorEmReais.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  const parseValorInput = useCallback((valorString) => {
    if (!valorString) return 0;
    
    const valorLimpo = valorString.toString();
    if (valorLimpo.includes(',')) {
      const partes = valorLimpo.split(',');
      const inteira = partes[0].replace(/\./g, '');
      const decimal = partes[1] || '00';
      const valorFinal = parseFloat(`${inteira}.${decimal}`);
      return isNaN(valorFinal) ? 0 : valorFinal;
    } else {
      const apenasNumeros = valorLimpo.replace(/\./g, '');
      const valorFinal = parseFloat(apenasNumeros) / 100;
      return isNaN(valorFinal) ? 0 : valorFinal;
    }
  }, []);

  const resetFormulario = useCallback(() => {
    setFormData({
      nome: '',
      tipo: 'corrente',
      banco: '',
      saldoInicial: '0,00',
      cor: '#3B82F6'
    });
    setFormErrors({});
    setContaEditando(null);
    setModoFormulario(null);
  }, []);

  // =============================================================================
  // CÁLCULOS E RESUMOS
  // =============================================================================
  
  const resumo = React.useMemo(() => {
    const saldoTotal = contas.reduce((sum, conta) => sum + (conta.saldo_atual || conta.saldo || 0), 0);
    const contasPositivas = contas.filter(conta => (conta.saldo_atual || conta.saldo || 0) > 0).length;
    const contasNegativas = contas.filter(conta => (conta.saldo_atual || conta.saldo || 0) < 0).length;
    
    return { 
      saldoTotal, 
      contasPositivas, 
      contasNegativas, 
      totalAtivas: contas.length,
      totalArquivadas: contasArquivadas.length
    };
  }, [contas, contasArquivadas]);

  // =============================================================================
  // HANDLERS DE EVENTOS
  // =============================================================================
  
  // Carregar arquivadas quando necessário
  useEffect(() => {
    if (isOpen && mostrarArquivadas && user) {
      fetchContasArquivadas();
    }
  }, [isOpen, mostrarArquivadas, user, fetchContasArquivadas]);

  // ESC para fechar - CORRIGIDO para fechar modais aninhados primeiro
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        // Prioridade: fechar modais aninhados primeiro
        if (modalCorreirSaldo.ativo) {
          setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' });
        } else if (modalArquivar.ativo) {
          setModalArquivar({ ativo: false, conta: null, motivo: '' });
        } else if (modalDesarquivar.ativo) {
          setModalDesarquivar({ ativo: false, conta: null });
        } else if (modoFormulario) {
          resetFormulario();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, modoFormulario, modalCorreirSaldo.ativo, modalArquivar.ativo, modalDesarquivar.ativo, resetFormulario, onClose]);

  // =============================================================================
  // HANDLERS DO FORMULÁRIO
  // =============================================================================
  
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [formErrors]);

  const handleSaldoChange = useCallback((e) => {
    const valorOriginal = e.target.value;
    
    if (valorOriginal === '' || valorOriginal === '-') {
      setFormData(prev => ({ ...prev, saldoInicial: valorOriginal }));
      if (formErrors.saldoInicial) {
        setFormErrors(prev => ({ ...prev, saldoInicial: null }));
      }
      return;
    }
    
    const isNegativo = valorOriginal.startsWith('-');
    const valorSemSinal = valorOriginal.replace('-', '');
    const valorFormatado = formatarValorInput(valorSemSinal);
    const valorFinal = isNegativo ? `-${valorFormatado}` : valorFormatado;
    
    setFormData(prev => ({ ...prev, saldoInicial: valorFinal }));
    if (formErrors.saldoInicial) {
      setFormErrors(prev => ({ ...prev, saldoInicial: null }));
    }
  }, [formatarValorInput, formErrors.saldoInicial]);

  const handleCorChange = useCallback((cor) => {
    setFormData(prev => ({ ...prev, cor }));
  }, []);

  // =============================================================================
  // AÇÕES DO FORMULÁRIO
  // =============================================================================
  
  const iniciarCriacaoConta = useCallback(() => {
    resetFormulario();
    setModoFormulario('criar');
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  }, [resetFormulario]);

  const iniciarEdicaoConta = useCallback((conta) => {
    setFormData({
      nome: conta.nome,
      tipo: conta.tipo,
      banco: conta.banco || '',
      saldoInicial: '', // ✅ Não preenchemos para edição
      cor: conta.cor || '#3B82F6'
    });
    setContaEditando(conta);
    setModoFormulario('editar');
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  }, []);

  const validarFormulario = useCallback(() => {
    const erros = {};
    
    if (!formData.nome.trim()) {
      erros.nome = "Nome é obrigatório";
    }
    if (!formData.tipo) {
      erros.tipo = "Tipo é obrigatório";
    }
    
    // ✅ Saldo inicial obrigatório apenas na criação
    if (modoFormulario === 'criar' && !formData.saldoInicial) {
      erros.saldoInicial = "Saldo inicial é obrigatório";
    }
    
    setFormErrors(erros);
    return Object.keys(erros).length === 0;
  }, [formData, modoFormulario]);

  // ✅ FUNÇÃO CORRIGIDA - Usa hooks em vez de Supabase direto
  const submeterFormulario = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (modoFormulario === 'editar' && contaEditando) {
        // ✅ USAR HOOK EM VEZ DE SUPABASE DIRETO
        await updateConta(contaEditando.id, {
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          banco: formData.banco.trim(),
          cor: formData.cor
        });
        
        showNotification('Conta atualizada com sucesso!', 'success');
        
      } else {
        // ✅ USAR HOOK EM VEZ DE SUPABASE DIRETO
        const saldoInicial = parseValorInput(formData.saldoInicial);
        
        await addConta({
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          banco: formData.banco.trim(),
          saldoInicial: saldoInicial,
          cor: formData.cor
        });
        
        const { forceRefreshContas } = useContasStore.getState();
        forceRefreshContas(); // 🔁
        showNotification('Conta criada com sucesso!', 'success');
      }
      
      // ✅ NÃO PRECISA MAIS recalcularSaldos - store atualiza automaticamente
      resetFormulario();
      if (onSave) onSave();
      
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      showNotification('Erro ao salvar conta', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validarFormulario, modoFormulario, contaEditando, formData, parseValorInput, updateConta, addConta, resetFormulario, onSave, showNotification]);

  // =============================================================================
  // AÇÕES DE CORREÇÃO DE SALDO
  // =============================================================================
  
  const iniciarCorrecaoSaldo = useCallback((conta) => {
    setModalCorrigirSaldo({
      ativo: true,
      conta,
      novoSaldo: (conta.saldo_atual || conta.saldo || 0).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }),
      metodo: 'ajuste',
      motivo: ''
    });
  }, []);

  const processarCorrecaoSaldo = useCallback(async () => {
    if (!modalCorreirSaldo.conta) return;

    const novoSaldoNumerico = parseFloat(
      modalCorreirSaldo.novoSaldo.replace(/\./g, '').replace(',', '.')
    );

    if (isNaN(novoSaldoNumerico)) {
      showNotification('Valor inválido', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // ✅ USAR HOOK EM VEZ DE LÓGICA PRÓPRIA
      const resultado = await corrigirSaldoConta(
        modalCorreirSaldo.conta.id,
        novoSaldoNumerico,
        modalCorreirSaldo.metodo,
        modalCorreirSaldo.motivo
      );

      if (resultado.success) {
        setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' });
        if (onSave) onSave();
      }
    } catch (error) {
      console.error('Erro ao corrigir saldo:', error);
    } finally {
      setSubmitting(false);
    }
  }, [modalCorreirSaldo, corrigirSaldoConta, onSave, showNotification]);

  // =============================================================================
  // AÇÕES DE ARQUIVAMENTO
  // =============================================================================
  
  const iniciarArquivamento = useCallback((conta) => {
    setModalArquivar({ ativo: true, conta, motivo: '' });
  }, []);

  const processarArquivamento = useCallback(async () => {
    if (!modalArquivar.conta) return;
    
    setSubmitting(true);
    try {
      // ✅ USAR HOOK EM VEZ DE LÓGICA PRÓPRIA
      const resultado = await arquivarConta(modalArquivar.conta.id, modalArquivar.motivo);
      
      if (resultado.success) {
        setModalArquivar({ ativo: false, conta: null, motivo: '' });
        if (onSave) onSave();
      }
    } catch (error) {
      console.error('Erro ao arquivar:', error);
    } finally {
      setSubmitting(false);
    }
  }, [modalArquivar, arquivarConta, onSave]);

  const iniciarDesarquivamento = useCallback((conta) => {
    setModalDesarquivar({ ativo: true, conta });
  }, []);

  const processarDesarquivamento = useCallback(async () => {
    if (!modalDesarquivar.conta) return;
    
    setSubmitting(true);
    try {
      // ✅ USAR HOOK EM VEZ DE LÓGICA PRÓPRIA
      const resultado = await desarquivarConta(modalDesarquivar.conta.id);
      
      if (resultado.success) {
        setModalDesarquivar({ ativo: false, conta: null });
        if (onSave) onSave();
      }
    } catch (error) {
      console.error('Erro ao desarquivar:', error);
    } finally {
      setSubmitting(false);
    }
  }, [modalDesarquivar, desarquivarConta, onSave]);

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  const renderConta = useCallback((conta, isArquivada = false) => {
    const saldoAtual = conta.saldo_atual || conta.saldo || 0;
    const saldoInicial = conta.saldo_inicial || 0;
    const temDiferenca = Math.abs(saldoAtual - saldoInicial) > 0.01;
    
    return (
      <div 
        key={conta.id} 
        className={`account-card ${isArquivada ? 'archived' : ''}`}
        style={{ borderLeftColor: conta.cor }}
      >
        <div className="card-header">
          <div className="account-icon" style={{ backgroundColor: conta.cor }}>
            {tiposConta.find(t => t.value === conta.tipo)?.icon || '💳'}
          </div>
          <div className="account-info">
            <div className="account-name">
              {conta.nome}
              {isArquivada && <span className="archived-badge">ARQUIVADA</span>}
            </div>
            <div className="account-type">
              {tiposConta.find(t => t.value === conta.tipo)?.label}
              {conta.banco && ` • ${conta.banco}`}
            </div>
            <div className="account-balance">
              <div className={`balance-current ${saldoAtual >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(saldoAtual)}
              </div>
              {temDiferenca && (
                <div className="balance-initial">
                  (inicial: {formatCurrency(saldoInicial)})
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="card-actions">
          {!isArquivada && (
            <button
              type="button"
              className="card-action-btn"
              onClick={() => iniciarCorrecaoSaldo(conta)}
              disabled={submitting}
              title="Corrigir saldo"
            >
              <Calculator size={16} />
            </button>
          )}
          
          {!isArquivada && (
            <button
              type="button"
              className="card-action-btn edit"
              onClick={() => iniciarEdicaoConta(conta)}
              disabled={submitting}
              title="Editar conta"
            >
              <Edit size={16} />
            </button>
          )}
          
          <button
            type="button"
            className={`card-action-btn ${isArquivada ? 'success' : 'archive'}`}
            onClick={() => {
              if (isArquivada) {
                iniciarDesarquivamento(conta);
              } else {
                iniciarArquivamento(conta);
              }
            }}
            disabled={submitting}
            title={isArquivada ? "Desarquivar conta" : "Arquivar conta"}
          >
            {isArquivada ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          </button>
        </div>
      </div>
    );
  }, [tiposConta, submitting, iniciarCorrecaoSaldo, iniciarEdicaoConta, iniciarArquivamento, iniciarDesarquivamento]);

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================
  
  if (!isOpen) return null;

  return (
    <>
      {/* MODAL PRINCIPAL - Z-INDEX: 1000 */}
      <div className="modal-overlay active" style={{ zIndex: 1000 }}>
        <div className="forms-modal-container">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-content">
              <div className="modal-icon-container modal-icon-primary">
                <Building size={18} />
              </div>
              <div>
                <h2 className="modal-title">Gerenciar Contas</h2>
                <p className="modal-subtitle">
                  {resumo.totalAtivas} ativa{resumo.totalAtivas !== 1 ? 's' : ''} • 
                  {resumo.totalArquivadas > 0 && ` ${resumo.totalArquivadas} arquivada${resumo.totalArquivadas !== 1 ? 's' : ''} • `}
                  Total: {formatCurrency(resumo.saldoTotal)}
                </p>
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          
          {/* Body */}
          <div className="modal-body">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Carregando contas...</p>
              </div>
            ) : (
              <>
                {/* Controles superiores */}
                <div className="controls-container mb-3">
                  <button
                    onClick={() => setMostrarArquivadas(!mostrarArquivadas)}
                    className={`btn-secondary ${mostrarArquivadas ? 'active' : ''}`}
                  >
                    {mostrarArquivadas ? <EyeOff size={14} /> : <Eye size={14} />}
                    {mostrarArquivadas ? 'Ocultar Arquivadas' : 'Ver Arquivadas'}
                    {resumo.totalArquivadas > 0 && (
                      <span className="count-badge">{resumo.totalArquivadas}</span>
                    )}
                  </button>
                  
                  {!modoFormulario ? (
                    <button
                      onClick={iniciarCriacaoConta}
                      disabled={submitting}
                      className="btn-primary"
                    >
                      <Plus size={14} />
                      Nova Conta
                    </button>
                  ) : (
                    <button
                      onClick={resetFormulario}
                      disabled={submitting}
                      className="btn-cancel"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                  )}
                </div>

                {/* Resumo financeiro */}
                {(contas.length > 0 || contasArquivadas.length > 0) && (
                  <div className="summary-panel mb-3">
                    <div className="summary-stats">
                      <div className="stat-item">
                        <div className="stat-label">Saldo Total</div>
                        <div className={`stat-value ${resumo.saldoTotal >= 0 ? 'positive' : 'negative'}`}>
                          {formatCurrency(resumo.saldoTotal)}
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-label">Positivas</div>
                        <div className="stat-value positive">{resumo.contasPositivas}</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-label">Negativas</div>
                        <div className="stat-value negative">{resumo.contasNegativas}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulário de conta */}
                {modoFormulario && (
                  <div className="section-block mb-3">
                    <h3 className="section-title">
                      {modoFormulario === 'editar' ? 'Editar Conta' : 'Nova Conta'}
                    </h3>

                    <form onSubmit={submeterFormulario}>
                      {/* Nome e Tipo */}
                      <div className="flex gap-3 row mb-3">
                        <div className="flex flex-col">
                          <label className="form-label">
                            <Building size={14} />
                            Nome da Conta *
                          </label>
                          <input
                            ref={nomeInputRef}
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleInputChange}
                            placeholder="Ex: Banco do Brasil, Nubank"
                            disabled={submitting}
                            className={`input-text ${formErrors.nome ? 'error' : ''}`}
                          />
                          {formErrors.nome && <div className="form-error">{formErrors.nome}</div>}
                        </div>
                        
                        <div className="flex flex-col">
                          <label className="form-label">
                            <FileText size={14} />
                            Tipo *
                          </label>
                          <div className="select-search">
                            <select
                              name="tipo"
                              value={formData.tipo}
                              onChange={handleInputChange}
                              disabled={submitting}
                              className={formErrors.tipo ? 'error' : ''}
                            >
                              {tiposConta.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>
                                  {tipo.icon} {tipo.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {formErrors.tipo && <div className="form-error">{formErrors.tipo}</div>}
                        </div>
                      </div>

                      {/* Banco e Saldo */}
                      <div className="flex gap-3 row mb-3">
                        <div className="flex flex-col">
                          <label className="form-label">
                            <Building size={14} />
                            Banco 
                            <span className="form-label-small">(opcional)</span>
                          </label>
                          <input
                            type="text"
                            name="banco"
                            value={formData.banco}
                            onChange={handleInputChange}
                            placeholder="Ex: Itaú, Santander"
                            disabled={submitting}
                            className="input-text"
                          />
                        </div>
                        
                        <div className="flex flex-col">
                          {modoFormulario === 'criar' ? (
                            <>
                              <label className="form-label">
                                <DollarSign size={14} />
                                Saldo Inicial *
                                <span className="form-label-small">(Ex: 1000 ou -500,00)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.saldoInicial}
                                onChange={handleSaldoChange}
                                placeholder="0,00"
                                disabled={submitting}
                                className={`input-money ${parseValorInput(formData.saldoInicial) >= 0 ? 'positive' : 'negative'} ${formErrors.saldoInicial ? 'error' : ''}`}
                              />
                              {formErrors.saldoInicial && <div className="form-error">{formErrors.saldoInicial}</div>}
                            </>
                          ) : (
                            <>
                              <label className="form-label">
                                <Lock size={14} />
                                Saldo Inicial
                                <span className="form-label-small">(somente leitura)</span>
                              </label>
                              <input
                                type="text"
                                value={formatCurrency(contaEditando?.saldo_inicial || 0)}
                                disabled={true}
                                className="input-money input-disabled"
                                readOnly
                              />
                              <div className="confirmation-info-box" style={{ marginTop: '8px' }}>
                                <AlertCircle size={16} />
                                <p>Para alterar o saldo, use a opção <strong>"Corrigir Saldo"</strong> na lista de contas.</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Informações adicionais na edição */}
                      {modoFormulario === 'editar' && contaEditando && (
                        <div className="summary-panel" style={{ marginBottom: '16px' }}>
                          <div className="summary-header">
                            <Calculator size={16} />
                            <strong>Informações da Conta</strong>
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                            gap: '12px', 
                            fontSize: '0.9rem',
                            marginTop: '12px'
                          }}>
                            <div>
                              <div style={{ color: '#6b7280', marginBottom: '4px', fontSize: '0.8rem' }}>Saldo Inicial:</div>
                              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                {formatCurrency(contaEditando.saldo_inicial || 0)}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#6b7280', marginBottom: '4px', fontSize: '0.8rem' }}>Saldo Atual:</div>
                              <div className={`summary-value ${(contaEditando.saldo_atual || contaEditando.saldo || 0) >= 0 ? 'positive' : 'negative'}`}>
                                {formatCurrency(contaEditando.saldo_atual || contaEditando.saldo || 0)}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#6b7280', marginBottom: '4px', fontSize: '0.8rem' }}>Diferença:</div>
                              <div className={`summary-value ${((contaEditando.saldo_atual || contaEditando.saldo || 0) - (contaEditando.saldo_inicial || 0)) >= 0 ? 'positive' : 'negative'}`}>
                                {formatCurrency((contaEditando.saldo_atual || contaEditando.saldo || 0) - (contaEditando.saldo_inicial || 0))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Seletor de Cor */}
                      <div className="flex flex-col mb-3">
                        <label className="form-label">
                          <Palette size={14} />
                          Cor da Conta
                        </label>
                        <div className="color-picker">
                          {coresPredefinidas.map(cor => (
                            <button
                              key={cor}
                              type="button"
                              onClick={() => handleCorChange(cor)}
                              disabled={submitting}
                              className={`color-option ${formData.cor === cor ? 'active' : ''}`}
                              style={{ backgroundColor: cor }}
                              title={`Cor: ${cor}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Ações do formulário */}
                      <div className="flex gap-3 row">
                        <button
                          type="button"
                          onClick={resetFormulario}
                          disabled={submitting}
                          className="btn-cancel"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn-primary"
                        >
                          {submitting ? (
                            <>
                              <span className="btn-spinner"></span>
                              Salvando...
                            </>
                          ) : (
                            <>
                              {modoFormulario === 'editar' ? <Edit size={14} /> : <Plus size={14} />}
                              {modoFormulario === 'editar' ? 'Atualizar Conta' : 'Criar Conta'}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Lista de Contas Ativas */}
                {!modoFormulario && contas.length > 0 && (
                  <div className="mb-3">
                    <h3 className="section-title">Contas Ativas ({contas.length})</h3>
                    <div className="account-list">
                      {contas.map(conta => renderConta(conta, false))}
                    </div>
                  </div>
                )}

                {/* Lista de Contas Arquivadas */}
                {!modoFormulario && mostrarArquivadas && contasArquivadas.length > 0 && (
                  <div className="mb-3">
                    <h3 className="section-title archived">Contas Arquivadas ({contasArquivadas.length})</h3>
                    <div className="account-list">
                      {contasArquivadas.map(conta => renderConta(conta, true))}
                    </div>
                  </div>
                )}

                {/* Estado vazio */}
                {!modoFormulario && contas.length === 0 && !loading && (
                  <div className="empty-state">
                    <Building size={48} className="empty-state-icon" />
                    <h3 className="empty-state-title">
                      {contasArquivadas.length > 0 ? 
                        'Todas as contas estão arquivadas' : 
                        'Nenhuma conta cadastrada'
                      }
                    </h3>
                    <p className="empty-state-description">
                      {contasArquivadas.length > 0 ? 
                        'Use o botão "Ver Arquivadas" para visualizar suas contas arquivadas' :
                        'Crie sua primeira conta para começar a controlar suas finanças'
                      }
                    </p>
                    <button
                      onClick={iniciarCriacaoConta}
                      className="btn-primary"
                    >
                      <Plus size={16} />
                      Criar Primeira Conta
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAIS ANINHADOS - Z-INDEX: 1100 */}

      {/* Modal de Correção de Saldo */}
      {modalCorreirSaldo.ativo && (
        <div className="modal-overlay active" style={{ zIndex: 1100 }}>
          <div className="forms-modal-container modal-small">
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon-container modal-icon-purple">
                  <Calculator size={18} />
                </div>
                <div>
                  <h2 className="modal-title">Corrigir Saldo da Conta</h2>
                  <p className="modal-subtitle">Ajuste o saldo conforme necessário</p>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={() => setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' })}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="account-summary mb-3">
                <h4>{modalCorreirSaldo.conta?.nome}</h4>
                <div className="account-balances">
                  <div>Saldo inicial: <strong>{formatCurrency(modalCorreirSaldo.conta?.saldo_inicial || 0)}</strong></div>
                  <div>Saldo atual: <strong>{formatCurrency(modalCorreirSaldo.conta?.saldo_atual || modalCorreirSaldo.conta?.saldo || 0)}</strong></div>
                </div>
              </div>
              
              <div className="flex flex-col mb-3">
                <label className="form-label">Novo saldo desejado:</label>
                <input
                  type="text"
                  value={modalCorreirSaldo.novoSaldo}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,-]/g, '');
                    setModalCorrigirSaldo(prev => ({ ...prev, novoSaldo: valor }));
                  }}
                  placeholder="0,00"
                  className="input-money input-money-highlight"
                />
              </div>

              <div className="flex flex-col mb-3">
                <label className="form-label">Como corrigir o saldo:</label>
                <div className="method-selector">
                  <label className={`method-option ${modalCorreirSaldo.metodo === 'ajuste' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="metodo"
                      value="ajuste"
                      checked={modalCorreirSaldo.metodo === 'ajuste'}
                      onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, metodo: e.target.value }))}
                    />
                    <div>
                      <div className="method-title">💰 Criar transação de ajuste</div>
                      <div className="method-desc">Mantém o histórico completo e registra o motivo do ajuste</div>
                    </div>
                  </label>
                  
                  <label className={`method-option ${modalCorreirSaldo.metodo === 'saldo_inicial' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="metodo"
                      value="saldo_inicial"
                      checked={modalCorreirSaldo.metodo === 'saldo_inicial'}
                      onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, metodo: e.target.value }))}
                    />
                    <div>
                      <div className="method-title">⚙️ Alterar saldo inicial</div>
                      <div className="method-desc">Modifica o valor base da conta (use para correções iniciais)</div>
                    </div>
                  </label>
                </div>
              </div>

              {modalCorreirSaldo.metodo === 'ajuste' && (
                <div className="flex flex-col mb-3">
                  <label className="form-label">
                    Motivo da correção 
                    <span className="form-label-small">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={modalCorreirSaldo.motivo}
                    onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Ex: Correção de divergência, transação não registrada"
                    className="input-text"
                    maxLength={200}
                  />
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' })}
                className="btn-cancel"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                onClick={processarCorrecaoSaldo}
                disabled={submitting || !modalCorreirSaldo.novoSaldo}
                className="btn-secondary btn-secondary--success"
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Corrigindo...
                  </>
                ) : (
                  <>
                    <Calculator size={14} />
                    Corrigir Saldo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Arquivamento */}
      {modalArquivar.ativo && (
        <div className="modal-overlay active" style={{ zIndex: 1100 }}>
          <div className="forms-modal-container modal-small">
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon-container modal-icon-warning">
                  <Archive size={18} />
                </div>
                <div>
                  <h2 className="modal-title">Arquivar Conta</h2>
                  <p className="modal-subtitle">Esta ação pode ser desfeita</p>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={() => setModalArquivar({ ativo: false, conta: null, motivo: '' })}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="summary-panel warning mb-3">
                <div className="summary-header">
                  <Archive size={16} />
                  <strong>{modalArquivar.conta?.nome}</strong>
                </div>
                <p className="summary-value">
                  Você está arquivando esta conta. O saldo de{' '}
                  <strong>{formatCurrency(modalArquivar.conta?.saldo_atual || modalArquivar.conta?.saldo || 0)}</strong>{' '}
                  será removido do dashboard. As transações continuarão visíveis nos relatórios.
                </p>
              </div>
              
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  Motivo do arquivamento 
                  <span className="form-label-small">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={modalArquivar.motivo}
                  onChange={(e) => setModalArquivar(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ex: Conta encerrada, não utilizo mais"
                  className="input-text"
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setModalArquivar({ ativo: false, conta: null, motivo: '' })}
                className="btn-cancel"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                onClick={processarArquivamento}
                disabled={submitting}
                className="btn-secondary btn-secondary--warning"
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Arquivando...
                  </>
                ) : (
                  <>
                    <Archive size={14} />
                    Arquivar Conta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Desarquivamento */}
      {modalDesarquivar.ativo && (
        <div className="modal-overlay active" style={{ zIndex: 1100 }}>
          <div className="forms-modal-container modal-small">
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon-container modal-icon-success">
                  <ArchiveRestore size={18} />
                </div>
                <div>
                  <h2 className="modal-title">Desarquivar Conta</h2>
                  <p className="modal-subtitle">Reativar conta arquivada</p>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={() => setModalDesarquivar({ ativo: false, conta: null })}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="summary-panel success mb-3">
                <div className="summary-header">
                  <ArchiveRestore size={16} />
                  <strong>{modalDesarquivar.conta?.nome}</strong>
                </div>
                <p className="summary-value">
                  Esta conta será reativada e voltará a aparecer no dashboard. O saldo de{' '}
                  <strong>{formatCurrency(modalDesarquivar.conta?.saldo_atual || modalDesarquivar.conta?.saldo || 0)}</strong>{' '}
                  será incluído nos cálculos totais novamente.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setModalDesarquivar({ ativo: false, conta: null })}
                className="btn-cancel"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                onClick={processarDesarquivamento}
                disabled={submitting}
                className="btn-secondary btn-secondary--success"
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Desarquivando...
                  </>
                ) : (
                  <>
                    <ArchiveRestore size={14} />
                    Desarquivar Conta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ContasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(ContasModal);