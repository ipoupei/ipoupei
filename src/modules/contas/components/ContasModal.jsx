// src/modules/contas/components/ContasModal.jsx - REFEITO DO ZERO
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Building, 
  Plus, 
  Edit, 
  Archive,
  ArchiveRestore,
  // Trash2, // ✅ REMOVIDO - ícone de exclusão não usado mais
  X, 
  Calculator,
  DollarSign,
  Palette,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import useContas from '@modules/contas/hooks/useContas';
import '@shared/styles/FormsModal.css';

/**
 * Modal de Gerenciamento de Contas - VERSÃO LIMPA
 * Funcionalidades:
 * - Criar/editar contas
 * - Arquivar/desarquivar 
 * - Excluir (com validação)
 * - Corrigir saldo (2 métodos)
 * - Visualizar saldo inicial vs atual
 */
const ContasModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const {
    contas,
    contasArquivadas,
    loading,
    arquivarConta,
    desarquivarConta,
    // excluirConta, // ✅ REMOVIDO - função de exclusão desabilitada
    corrigirSaldoConta,
    fetchContasArquivadas,
    recalcularSaldos
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
    saldoInicial: '',
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

  // ✅ REMOVIDO - Modal de exclusão desabilitado por segurança
  // const [modalExcluir, setModalExcluir] = useState({
  //   ativo: false,
  //   conta: null,
  //   confirmacao: ''
  // });

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
      saldoInicial: '',
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
    const saldoTotal = contas.reduce((sum, conta) => sum + (conta.saldo_atual || 0), 0);
    const contasPositivas = contas.filter(conta => (conta.saldo_atual || 0) > 0).length;
    const contasNegativas = contas.filter(conta => (conta.saldo_atual || 0) < 0).length;
    
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

  // ESC para fechar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (modoFormulario) {
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
  }, [isOpen, modoFormulario, resetFormulario, onClose]);

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
    const saldoFormatado = (conta.saldo_inicial || 0).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    
    setFormData({
      nome: conta.nome,
      tipo: conta.tipo,
      banco: conta.banco || '',
      saldoInicial: saldoFormatado,
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
    
    setFormErrors(erros);
    return Object.keys(erros).length === 0;
  }, [formData]);

  const submeterFormulario = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const saldoInicial = parseValorInput(formData.saldoInicial);
      
      if (modoFormulario === 'editar' && contaEditando) {
        // Atualizar conta existente
        const { error } = await supabase
          .from('contas')
          .update({
            nome: formData.nome.trim(),
            tipo: formData.tipo,
            banco: formData.banco.trim(),
            saldo_inicial: saldoInicial,
            cor: formData.cor,
            updated_at: new Date().toISOString()
          })
          .eq('id', contaEditando.id);
        
        if (error) throw error;
        showNotification('Conta atualizada com sucesso!', 'success');
        
      } else {
        // Criar nova conta
        const { error } = await supabase
          .from('contas')
          .insert([{
            usuario_id: user.id,
            nome: formData.nome.trim(),
            tipo: formData.tipo,
            banco: formData.banco.trim(),
            saldo_inicial: saldoInicial,
            cor: formData.cor,
            ativo: true,
            incluir_soma_total: true,
            ordem: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
        showNotification('Conta criada com sucesso!', 'success');
      }
      
      await recalcularSaldos();
      resetFormulario();
      if (onSave) onSave();
      
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      showNotification('Erro ao salvar conta', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validarFormulario, modoFormulario, contaEditando, formData, parseValorInput, user.id, recalcularSaldos, resetFormulario, onSave, showNotification]);

  // =============================================================================
  // AÇÕES DE CORREÇÃO DE SALDO
  // =============================================================================
  
  const iniciarCorrecaoSaldo = useCallback((conta) => {
    setModalCorrigirSaldo({
      ativo: true,
      conta,
      novoSaldo: conta.saldo_atual?.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) || '0,00',
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
  }, [modalCorreirSaldo, corrigirSaldoConta, parseFloat, onSave, showNotification]);

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

  // ✅ REMOVIDO - Funções de exclusão desabilitadas por segurança
  // const iniciarExclusao = useCallback(async (conta) => {
  //   const resultado = await excluirConta(conta.id, false);
  //   
  //   if (resultado.error === 'POSSUI_TRANSACOES') {
  //     showNotification(resultado.message, 'warning');
  //     return;
  //   }
  //   
  //   setModalExcluir({ ativo: true, conta, confirmacao: '' });
  // }, [excluirConta, showNotification]);

  // const processarExclusao = useCallback(async () => {
  //   if (!modalExcluir.conta) return;
  //   
  //   if (modalExcluir.confirmacao !== 'EXCLUIR PERMANENTEMENTE') {
  //     showNotification('Digite exatamente "EXCLUIR PERMANENTEMENTE" para confirmar', 'error');
  //     return;
  //   }
  //   
  //   setSubmitting(true);
  //   try {
  //     const resultado = await excluirConta(modalExcluir.conta.id, true);
  //     
  //     if (resultado.success) {
  //       setModalExcluir({ ativo: false, conta: null, confirmacao: '' });
  //       if (onSave) onSave();
  //     } else if (resultado.error === 'POSSUI_TRANSACOES') {
  //       showNotification(resultado.message, 'warning');
  //       setModalExcluir({ ativo: false, conta: null, confirmacao: '' });
  //     }
  //   } catch (error) {
  //     console.error('Erro ao excluir:', error);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // }, [modalExcluir, excluirConta, onSave, showNotification]);

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  const renderConta = useCallback((conta, isArquivada = false) => {
    const temDiferenca = Math.abs((conta.saldo_atual || 0) - (conta.saldo_inicial || 0)) > 0.01;
    
    return (
      <div
        key={conta.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          borderLeft: `4px solid ${conta.cor}`,
          background: isArquivada ? '#f9fafb' : 'white',
          opacity: isArquivada ? 0.8 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        {/* Ícone da conta */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: conta.cor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px',
            fontSize: '18px',
            opacity: isArquivada ? 0.7 : 1
          }}
        >
          {tiposConta.find(t => t.value === conta.tipo)?.icon || '💳'}
        </div>
        
        {/* Informações da conta */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '600', 
            color: isArquivada ? '#6b7280' : '#1f2937', 
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {conta.nome}
            {isArquivada && (
              <span style={{
                fontSize: '0.7rem',
                background: '#f59e0b',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                ARQUIVADA
              </span>
            )}
          </div>
          
          <div style={{ 
            fontSize: '0.8rem', 
            color: isArquivada ? '#9ca3af' : '#6b7280', 
            marginBottom: '4px' 
          }}>
            {tiposConta.find(t => t.value === conta.tipo)?.label}
            {conta.banco && ` • ${conta.banco}`}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: '600',
              color: isArquivada 
                ? ((conta.saldo_atual || 0) >= 0 ? '#6b7280' : '#9ca3af')
                : ((conta.saldo_atual || 0) >= 0 ? '#10b981' : '#ef4444')
            }}>
              {formatCurrency(conta.saldo_atual || 0)}
            </div>
            {temDiferenca && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                (inicial: {formatCurrency(conta.saldo_inicial || 0)})
              </div>
            )}
          </div>
        </div>
        
        {/* Ações */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isArquivada && (
            <button
              onClick={() => iniciarCorrecaoSaldo(conta)}
              disabled={submitting}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Corrigir saldo"
            >
              <Calculator size={16} />
            </button>
          )}
          
          {!isArquivada && (
            <button
              onClick={() => iniciarEdicaoConta(conta)}
              disabled={submitting}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Editar conta"
            >
              <Edit size={16} />
            </button>
          )}
          
          <button
            onClick={() => isArquivada ? iniciarDesarquivamento(conta) : iniciarArquivamento(conta)}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              color: isArquivada ? '#10b981' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title={isArquivada ? "Desarquivar conta" : "Arquivar conta"}
          >
            {isArquivada ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          </button>
          
          {/* ✅ REMOVIDO - Botão de exclusão desabilitado por segurança */}
          {/* <button
            onClick={() => iniciarExclusao(conta)}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="Excluir conta"
          >
            <Trash2 size={16} />
          </button> */}
        </div>
      </div>
    );
  }, [tiposConta, submitting, iniciarCorrecaoSaldo, iniciarEdicaoConta, iniciarArquivamento, iniciarDesarquivamento]);

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '700px' }}>
        {/* Header */}
        <div className="modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.1)' 
        }}>
          <h2 className="modal-title">
            <div className="form-icon-wrapper" style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white'
            }}>
              <Building size={18} />
            </div>
            <div>
              <div className="form-title-main">Gerenciar Contas</div>
              <div className="form-title-subtitle">
                {resumo.totalAtivas} ativa{resumo.totalAtivas !== 1 ? 's' : ''} • 
                {resumo.totalArquivadas > 0 && ` ${resumo.totalArquivadas} arquivada${resumo.totalArquivadas !== 1 ? 's' : ''} • `}
                Total: {formatCurrency(resumo.saldoTotal)}
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
              <div className="form-loading-spinner" style={{ borderTopColor: '#3b82f6' }}></div>
              <p>Carregando contas...</p>
            </div>
          ) : (
            <>
              {/* Controles superiores */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                padding: '12px 16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => setMostrarArquivadas(!mostrarArquivadas)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: mostrarArquivadas ? '#eff6ff' : 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: mostrarArquivadas ? '#2563eb' : '#374151'
                    }}
                  >
                    {mostrarArquivadas ? <EyeOff size={14} /> : <Eye size={14} />}
                    {mostrarArquivadas ? 'Ocultar Arquivadas' : 'Ver Arquivadas'}
                    {resumo.totalArquivadas > 0 && (
                      <span style={{
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {resumo.totalArquivadas}
                      </span>
                    )}
                  </button>
                </div>
                
                {!modoFormulario && (
                  <button
                    onClick={iniciarCriacaoConta}
                    disabled={submitting}
                    className="form-btn form-btn-primary"
                    style={{ 
                      padding: '8px 16px',
                      fontSize: '0.875rem',
                      background: '#3b82f6'
                    }}
                  >
                    <Plus size={14} />
                    Nova Conta
                  </button>
                )}
              </div>

              {/* Resumo financeiro */}
              {(contas.length > 0 || contasArquivadas.length > 0) && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                      Saldo Total
                    </div>
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: '700',
                      color: resumo.saldoTotal >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {formatCurrency(resumo.saldoTotal)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                      Positivas
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
                      {resumo.contasPositivas}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                      Negativas
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>
                      {resumo.contasNegativas}
                    </div>
                  </div>
                </div>
              )}

              {/* Formulário de conta */}
              {modoFormulario && (
                <form onSubmit={submeterFormulario} className="form" style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(59, 130, 246, 0.01) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    borderRadius: '16px',
                    padding: '20px'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 20px 0', 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {modoFormulario === 'editar' ? <Edit size={16} /> : <Plus size={16} />}
                      {modoFormulario === 'editar' ? 'Editar Conta' : 'Nova Conta'}
                    </h3>

                    {/* Nome e Tipo */}
                    <div className="form-row">
                      <div className="form-field">
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
                          className={`form-input ${formErrors.nome ? 'error' : ''}`}
                        />
                        {formErrors.nome && <div className="form-error">{formErrors.nome}</div>}
                      </div>
                      
                      <div className="form-field">
                        <label className="form-label">
                          <FileText size={14} />
                          Tipo *
                        </label>
                        <select
                          name="tipo"
                          value={formData.tipo}
                          onChange={handleInputChange}
                          disabled={submitting}
                          className={`form-input ${formErrors.tipo ? 'error' : ''}`}
                        >
                          {tiposConta.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.icon} {tipo.label}
                            </option>
                          ))}
                        </select>
                        {formErrors.tipo && <div className="form-error">{formErrors.tipo}</div>}
                      </div>
                    </div>

                    {/* Banco e Saldo */}
                    <div className="form-row">
                      <div className="form-field">
                        <label className="form-label">
                          <Building size={14} />
                          Banco (opcional)
                        </label>
                        <input
                          type="text"
                          name="banco"
                          value={formData.banco}
                          onChange={handleInputChange}
                          placeholder="Ex: Itaú, Santander"
                          disabled={submitting}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-field">
                        <label className="form-label">
                          <DollarSign size={14} />
                          Saldo Inicial
                          <small style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                            (Ex: 1000 ou -500,00)
                          </small>
                        </label>
                        <input
                          type="text"
                          value={formData.saldoInicial}
                          onChange={handleSaldoChange}
                          placeholder="0,00"
                          disabled={submitting}
                          className="form-input valor receita"
                          style={{ 
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: parseValorInput(formData.saldoInicial) >= 0 ? '#10b981' : '#ef4444',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    </div>

                    {/* Seletor de Cor */}
                    <div className="form-field-group">
                      <label className="form-label">
                        <Palette size={14} />
                        Cor da Conta
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {coresPredefinidas.map(cor => (
                          <button
                            key={cor}
                            type="button"
                            onClick={() => handleCorChange(cor)}
                            disabled={submitting}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: cor,
                              border: formData.cor === cor ? '3px solid #374151' : '2px solid transparent',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Ações do formulário */}
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={resetFormulario}
                        disabled={submitting}
                        className="form-btn form-btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="form-btn form-btn-primary receita"
                      >
                        {submitting ? (
                          <>
                            <div className="form-spinner"></div>
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
                  </div>
                </form>
              )}

              {/* Lista de Contas Ativas */}
              {contas.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Building size={16} />
                    Contas Ativas ({contas.length})
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {contas.map(conta => renderConta(conta, false))}
                  </div>
                </div>
              )}

              {/* Lista de Contas Arquivadas */}
              {mostrarArquivadas && contasArquivadas.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Archive size={16} />
                    Contas Arquivadas ({contasArquivadas.length})
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {contasArquivadas.map(conta => renderConta(conta, true))}
                  </div>
                </div>
              )}

              {/* Estado vazio */}
              {contas.length === 0 && !loading && !modoFormulario && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <Building size={48} strokeWidth={1} style={{ color: '#d1d5db', marginBottom: '16px' }} />
                  <p style={{ margin: '0 0 20px 0', fontSize: '1rem' }}>
                    {contasArquivadas.length > 0 ? 
                      'Todas as contas estão arquivadas' : 
                      'Nenhuma conta cadastrada'
                    }
                  </p>
                  <button
                    onClick={iniciarCriacaoConta}
                    className="form-btn form-btn-primary receita"
                  >
                    <Plus size={16} />
                    Criar Primeira Conta
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAIS */}

        {/* Modal de Correção de Saldo */}
        {modalCorreirSaldo.ativo && (
          <div className="confirmation-overlay">
            <div className="confirmation-container" style={{ maxWidth: '500px' }}>
              <h3 className="confirmation-title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '16px' 
              }}>
                <Calculator size={20} style={{ color: '#8b5cf6' }} />
                Corrigir Saldo da Conta
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    {modalCorreirSaldo.conta?.nome}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    <div>Saldo inicial: <strong>{formatCurrency(modalCorreirSaldo.conta?.saldo_inicial || 0)}</strong></div>
                    <div>Saldo atual: <strong>{formatCurrency(modalCorreirSaldo.conta?.saldo_atual || 0)}</strong></div>
                  </div>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Novo saldo desejado:</label>
                  <input
                    type="text"
                    value={modalCorreirSaldo.novoSaldo}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/[^\d,-]/g, '');
                      setModalCorrigirSaldo(prev => ({ ...prev, novoSaldo: valor }));
                    }}
                    placeholder="0,00"
                    className="form-input"
                    style={{ fontSize: '1rem', fontWeight: '600', textAlign: 'center' }}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Como corrigir o saldo:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: modalCorreirSaldo.metodo === 'ajuste' ? '#eff6ff' : 'white'
                    }}>
                      <input
                        type="radio"
                        name="metodo"
                        value="ajuste"
                        checked={modalCorreirSaldo.metodo === 'ajuste'}
                        onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, metodo: e.target.value }))}
                      />
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                          💰 Criar transação de ajuste (recomendado)
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          Mantém o histórico completo e registra o motivo do ajuste
                        </div>
                      </div>
                    </label>
                    
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: modalCorreirSaldo.metodo === 'saldo_inicial' ? '#eff6ff' : 'white'
                    }}>
                      <input
                        type="radio"
                        name="metodo"
                        value="saldo_inicial"
                        checked={modalCorreirSaldo.metodo === 'saldo_inicial'}
                        onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, metodo: e.target.value }))}
                      />
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                          ⚙️ Alterar saldo inicial
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          Modifica o valor base da conta (use para correções iniciais)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {modalCorreirSaldo.metodo === 'ajuste' && (
                  <div className="form-field">
                    <label className="form-label">Motivo da correção (opcional):</label>
                    <input
                      type="text"
                      value={modalCorreirSaldo.motivo}
                      onChange={(e) => setModalCorrigirSaldo(prev => ({ ...prev, motivo: e.target.value }))}
                      placeholder="Ex: Correção de divergência, transação não registrada"
                      className="form-input"
                      maxLength={200}
                    />
                  </div>
                )}
              </div>
              
              <div className="confirmation-actions" style={{ gap: '8px' }}>
                <button 
                  onClick={() => setModalCorrigirSaldo({ ativo: false, conta: null, novoSaldo: '', metodo: 'ajuste', motivo: '' })}
                  className="form-btn form-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  onClick={processarCorrecaoSaldo}
                  disabled={submitting || !modalCorreirSaldo.novoSaldo}
                  className="form-btn form-btn-primary"
                  style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}
                >
                  {submitting ? (
                    <>
                      <div className="form-spinner"></div>
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
          <div className="confirmation-overlay">
            <div className="confirmation-container" style={{ maxWidth: '500px' }}>
              <h3 className="confirmation-title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '16px' 
              }}>
                <Archive size={20} style={{ color: '#f59e0b' }} />
                Arquivar Conta
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    {modalArquivar.conta?.nome}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                    Você está arquivando esta conta. O saldo de{' '}
                    <strong>{formatCurrency(modalArquivar.conta?.saldo_atual || 0)}</strong>{' '}
                    será removido do dashboard. As transações continuarão visíveis nos relatórios.
                  </div>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Motivo do arquivamento (opcional)</label>
                  <input
                    type="text"
                    value={modalArquivar.motivo}
                    onChange={(e) => setModalArquivar(prev => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Ex: Conta encerrada, não utilizo mais"
                    className="form-input"
                    maxLength={200}
                  />
                </div>
              </div>
              
              <div className="confirmation-actions" style={{ gap: '8px' }}>
                <button 
                  onClick={() => setModalArquivar({ ativo: false, conta: null, motivo: '' })}
                  className="form-btn form-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  onClick={processarArquivamento}
                  disabled={submitting}
                  className="form-btn form-btn-primary"
                  style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                >
                  {submitting ? (
                    <>
                      <div className="form-spinner"></div>
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
          <div className="confirmation-overlay">
            <div className="confirmation-container" style={{ maxWidth: '450px' }}>
              <h3 className="confirmation-title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '16px' 
              }}>
                <ArchiveRestore size={20} style={{ color: '#10b981' }} />
                Desarquivar Conta
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    {modalDesarquivar.conta?.nome}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#065f46' }}>
                    Esta conta será reativada e voltará a aparecer no dashboard. O saldo de{' '}
                    <strong>{formatCurrency(modalDesarquivar.conta?.saldo_atual || 0)}</strong>{' '}
                    será incluído nos cálculos totais novamente.
                  </div>
                </div>
              </div>
              
              <div className="confirmation-actions" style={{ gap: '8px' }}>
                <button 
                  onClick={() => setModalDesarquivar({ ativo: false, conta: null })}
                  className="form-btn form-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  onClick={processarDesarquivamento}
                  disabled={submitting}
                  className="form-btn form-btn-primary receita"
                >
                  {submitting ? (
                    <>
                      <div className="form-spinner"></div>
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

        {/* ✅ REMOVIDO - Modal de exclusão desabilitado por segurança */}
        {/* Modal de Exclusão */}
        {/* {modalExcluir.ativo && (
          <div className="confirmation-overlay">
            <div className="confirmation-container" style={{ maxWidth: '500px' }}>
              ...
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

ContasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(ContasModal);