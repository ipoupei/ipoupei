// src/components/ContasModal.jsx - VERSÃO REFATORADA E OTIMIZADA COMPLETA
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Building, 
  Plus, 
  Edit, 
  Archive,
  X, 
  AlertTriangle,
  DollarSign,
  Palette,
  FileText
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabaseClient';
import './FormsModal.css';

/**
 * Modal de Contas - Versão Otimizada Completa
 * Reduzido drasticamente, com sincronização automática e correção de saldo
 */
const ContasModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const nomeInputRef = useRef(null);

  // Estados principais
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editandoConta, setEditandoConta] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'corrente',
    banco: '',
    saldo: '',
    cor: '#3B82F6'
  });

  // Estado para correção de saldo
  const [correcaoSaldo, setCorrecaoSaldo] = useState({
    show: false,
    contaId: '',
    contaNome: '',
    saldoAtual: 0,
    novoSaldo: 0,
    diferenca: 0
  });

  const [errors, setErrors] = useState({});

  // Cores predefinidas
  const coresPredefinidas = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Tipos de conta
  const tiposConta = [
    { value: 'corrente', label: 'Conta Corrente', icon: '🏦' },
    { value: 'poupanca', label: 'Poupança', icon: '🐷' },
    { value: 'investimento', label: 'Investimentos', icon: '📈' },
    { value: 'carteira', label: 'Carteira', icon: '👛' }
  ];

  // Carregar contas
  const carregarContas = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      showNotification('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    if (isOpen && user) {
      carregarContas();
    }
  }, [isOpen, user, carregarContas]);

  // Formatação de valor
  const formatarValor = useCallback((valor) => {
    const valorLimpo = valor.toString().replace(/\D/g, '');
    const valorNumerico = parseFloat(valorLimpo) / 100;
    if (isNaN(valorNumerico) || valorNumerico === 0) return '';
    return valorNumerico.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  const valorNumerico = useMemo(() => {
    const valor = parseFloat(formData.saldo.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    return valor;
  }, [formData.saldo]);

  // Cálculo do resumo
  const resumo = useMemo(() => {
    const total = contas.reduce((sum, conta) => sum + (conta.saldo || 0), 0);
    const positivas = contas.filter(conta => (conta.saldo || 0) > 0).length;
    const negativas = contas.filter(conta => (conta.saldo || 0) < 0).length;
    
    return { total, positivas, negativas, totalContas: contas.length };
  }, [contas]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      tipo: 'corrente',
      banco: '',
      saldo: '',
      cor: '#3B82F6'
    });
    setErrors({});
    setEditandoConta(null);
    setMostrarForm(false);
  }, []);

  // Handler para ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (mostrarForm) {
          resetForm();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, mostrarForm, resetForm, onClose]);

  // Handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleSaldoChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, saldo: valorFormatado }));
    if (errors.saldo) {
      setErrors(prev => ({ ...prev, saldo: null }));
    }
  }, [formatarValor, errors.saldo]);

  const handleCorChange = useCallback((cor) => {
    setFormData(prev => ({ ...prev, cor }));
  }, []);

  // Iniciar nova conta
  const iniciarNovaConta = useCallback(() => {
    resetForm();
    setMostrarForm(true);
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  }, [resetForm]);

  // Iniciar edição
  const iniciarEdicao = useCallback((conta) => {
    setFormData({
      nome: conta.nome,
      tipo: conta.tipo,
      banco: conta.banco || '',
      saldo: formatarValor((conta.saldo * 100).toString()),
      cor: conta.cor || '#3B82F6'
    });
    setEditandoConta(conta);
    setMostrarForm(true);
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  }, [formatarValor]);

  // Validação
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    if (!formData.tipo) {
      newErrors.tipo = "Tipo é obrigatório";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Verificar se saldo mudou significativamente
  const verificarMudancaSaldo = useCallback((contaOriginal, novoSaldo) => {
    const saldoAtual = contaOriginal.saldo || 0;
    const diferenca = novoSaldo - saldoAtual;
    
    // Se a diferença for maior que R$ 1,00, perguntar sobre correção
    if (Math.abs(diferenca) >= 1) {
      setCorrecaoSaldo({
        show: true,
        contaId: contaOriginal.id,
        contaNome: contaOriginal.nome,
        saldoAtual,
        novoSaldo,
        diferenca
      });
      return true;
    }
    
    return false;
  }, []);

  // Aplicar correção de saldo
  const aplicarCorrecaoSaldo = useCallback(async (tipo) => {
    try {
      setSubmitting(true);
      
      if (tipo === 'transacao') {
        // Criar transação de correção
        const transacaoCorrecao = {
          usuario_id: user.id,
          data: new Date().toISOString().split('T')[0],
          descricao: `Correção de saldo - ${correcaoSaldo.contaNome}`,
          categoria_id: null, // Sem categoria para correções
          conta_id: correcaoSaldo.contaId,
          valor: Math.abs(correcaoSaldo.diferenca),
          tipo: correcaoSaldo.diferenca > 0 ? 'receita' : 'despesa',
          efetivado: true,
          observacoes: 'Transação de correção automática',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: transacaoError } = await supabase
          .from('transacoes')
          .insert([transacaoCorrecao]);
        
        if (transacaoError) throw transacaoError;
        
        showNotification(
          `Transação de correção criada: ${correcaoSaldo.diferenca > 0 ? '+' : ''}${formatCurrency(correcaoSaldo.diferenca)}`,
          'success'
        );
      }
      
      // Atualizar saldo da conta
      const { error: contaError } = await supabase
        .from('contas')
        .update({ 
          saldo: correcaoSaldo.novoSaldo,
          updated_at: new Date().toISOString()
        })
        .eq('id', correcaoSaldo.contaId);
      
      if (contaError) throw contaError;
      
      // Finalizar edição
      await finalizarEdicao();
      
    } catch (error) {
      console.error('Erro ao aplicar correção:', error);
      showNotification('Erro ao aplicar correção de saldo', 'error');
    } finally {
      setSubmitting(false);
      setCorrecaoSaldo({ show: false, contaId: '', contaNome: '', saldoAtual: 0, novoSaldo: 0, diferenca: 0 });
    }
  }, [correcaoSaldo, user.id, showNotification]);

  // Finalizar edição após correção
  const finalizarEdicao = useCallback(async () => {
    await carregarContas();
    resetForm();
    if (onSave) onSave(); // Notificar outros componentes
    showNotification('Conta atualizada com sucesso!', 'success');
  }, [carregarContas, resetForm, onSave, showNotification]);

  // Submissão
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (editandoConta) {
        // Verificar mudança de saldo antes de salvar
        if (verificarMudancaSaldo(editandoConta, valorNumerico)) {
          return; // Aguardar decisão do usuário
        }
        
        // Editar conta existente
        const { error } = await supabase
          .from('contas')
          .update({
            nome: formData.nome.trim(),
            tipo: formData.tipo,
            banco: formData.banco.trim(),
            saldo: valorNumerico,
            cor: formData.cor,
            updated_at: new Date().toISOString()
          })
          .eq('id', editandoConta.id);
        
        if (error) throw error;
        
        await finalizarEdicao();
        
      } else {
        // Criar nova conta
        const { error } = await supabase
          .from('contas')
          .insert([{
            usuario_id: user.id,
            nome: formData.nome.trim(),
            tipo: formData.tipo,
            banco: formData.banco.trim(),
            saldo: valorNumerico,
            cor: formData.cor,
            ativo: true,
            incluir_soma_total: true,
            ordem: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
        
        await carregarContas();
        resetForm();
        if (onSave) onSave(); // Notificar outros componentes
        showNotification('Conta criada com sucesso!', 'success');
      }
      
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      showNotification('Erro ao salvar conta', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, editandoConta, verificarMudancaSaldo, valorNumerico, formData, user.id, finalizarEdicao, carregarContas, resetForm, onSave, showNotification]);

  // Arquivar conta
  const arquivarConta = useCallback(async (contaId) => {
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('contas')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId);
      
      if (error) throw error;
      
      await carregarContas();
      if (onSave) onSave(); // Notificar outros componentes
      showNotification('Conta arquivada com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro ao arquivar conta:', error);
      showNotification('Erro ao arquivar conta', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [carregarContas, onSave, showNotification]);

  if (!isOpen) return null;

  return (
    <div className="receitas-modal-overlay">
      <div className="receitas-modal-container" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="receitas-modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.1)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white'
            }}>
              <Building size={18} />
            </div>
            <div>
              <h2 className="receitas-modal-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                Gerenciar Contas
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                {resumo.totalContas} conta{resumo.totalContas !== 1 ? 's' : ''} • Total: {formatCurrency(resumo.total)}
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
              <div className="receitas-loading-spinner" style={{ borderTopColor: '#3b82f6' }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando contas...
              </p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              {contas.length > 0 && (
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
                      color: resumo.total >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {formatCurrency(resumo.total)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                      Positivas
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
                      {resumo.positivas}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                      Negativas
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>
                      {resumo.negativas}
                    </div>
                  </div>
                </div>
              )}

              {/* Botão Nova Conta */}
              {!mostrarForm && (
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <button
                    onClick={iniciarNovaConta}
                    disabled={submitting}
                    className="receitas-btn receitas-btn-primary"
                    style={{ 
                      padding: '12px 20px',
                      fontSize: '0.9rem',
                      background: '#3b82f6'
                    }}
                  >
                    <Plus size={16} />
                    Nova Conta
                  </button>
                </div>
              )}

              {/* Formulário */}
              {mostrarForm && (
                <form onSubmit={handleSubmit} className="receitas-form" style={{ marginBottom: '24px' }}>
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
                      {editandoConta ? <Edit size={16} /> : <Plus size={16} />}
                      {editandoConta ? 'Editar Conta' : 'Nova Conta'}
                    </h3>

                    {/* Nome e Tipo */}
                    <div className="receitas-form-row">
                      <div className="receitas-form-group">
                        <label className="receitas-form-label">
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
                          className={`receitas-form-input ${errors.nome ? 'error' : ''}`}
                        />
                        {errors.nome && <div className="receitas-form-error">{errors.nome}</div>}
                      </div>
                      
                      <div className="receitas-form-group">
                        <label className="receitas-form-label">
                          <FileText size={14} />
                          Tipo *
                        </label>
                        <select
                          name="tipo"
                          value={formData.tipo}
                          onChange={handleInputChange}
                          disabled={submitting}
                          className={`receitas-form-input ${errors.tipo ? 'error' : ''}`}
                        >
                          {tiposConta.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.icon} {tipo.label}
                            </option>
                          ))}
                        </select>
                        {errors.tipo && <div className="receitas-form-error">{errors.tipo}</div>}
                      </div>
                    </div>

                    {/* Banco e Saldo */}
                    <div className="receitas-form-row">
                      <div className="receitas-form-group">
                        <label className="receitas-form-label">
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
                          className="receitas-form-input"
                        />
                      </div>
                      
                      <div className="receitas-form-group">
                        <label className="receitas-form-label">
                          <DollarSign size={14} />
                          Saldo Atual
                        </label>
                        <input
                          type="text"
                          value={formData.saldo}
                          onChange={handleSaldoChange}
                          placeholder="0,00"
                          disabled={submitting}
                          className="receitas-form-input receitas-valor-input"
                          style={{ 
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#3b82f6',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    </div>

                    {/* Seletor de Cor */}
                    <div className="receitas-form-group receitas-form-full">
                      <label className="receitas-form-label">
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

                    {/* Ações */}
                    <div className="receitas-form-actions">
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={submitting}
                        className="receitas-btn receitas-btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="receitas-btn receitas-btn-primary"
                        style={{ background: '#3b82f6' }}
                      >
                        {submitting ? (
                          <>
                            <div className="receitas-btn-spinner"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            {editandoConta ? <Edit size={14} /> : <Plus size={14} />}
                            {editandoConta ? 'Atualizar Conta' : 'Criar Conta'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Lista de Contas */}
              {contas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {contas.map(conta => (
                    <div
                      key={conta.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${conta.cor}`,
                        background: 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
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
                          fontSize: '18px'
                        }}
                      >
                        {tiposConta.find(t => t.value === conta.tipo)?.icon || '💳'}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          {conta.nome}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                          {tiposConta.find(t => t.value === conta.tipo)?.label}
                          {conta.banco && ` • ${conta.banco}`}
                        </div>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '600',
                          color: (conta.saldo || 0) >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {formatCurrency(conta.saldo || 0)}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => iniciarEdicao(conta)}
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
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => arquivarConta(conta.id)}
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
                        >
                          <Archive size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loading && !mostrarForm && (
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
                    Nenhuma conta cadastrada
                  </p>
                  <button
                    onClick={iniciarNovaConta}
                    className="receitas-btn receitas-btn-primary"
                    style={{ background: '#3b82f6' }}
                  >
                    <Plus size={16} />
                    Criar Primeira Conta
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Modal de Correção de Saldo */}
        {correcaoSaldo.show && (
          <div className="receitas-confirmation-overlay">
            <div className="receitas-confirmation-container" style={{ maxWidth: '500px' }}>
              <h3 className="receitas-confirmation-title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '16px' 
              }}>
                <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                Alteração de Saldo Detectada
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
                    {correcaoSaldo.contaNome}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                    <div>Saldo atual: <strong>{formatCurrency(correcaoSaldo.saldoAtual)}</strong></div>
                    <div>Novo saldo: <strong>{formatCurrency(correcaoSaldo.novoSaldo)}</strong></div>
                    <div style={{ 
                      marginTop: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: correcaoSaldo.diferenca > 0 ? '#059669' : '#dc2626'
                    }}>
                      Diferença: {correcaoSaldo.diferenca > 0 ? '+' : ''}{formatCurrency(correcaoSaldo.diferenca)}
                    </div>
                  </div>
                </div>
                
                <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#6b7280' }}>
                  Como você gostaria de tratar essa alteração de saldo?
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr', 
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    background: '#f9fafb'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem' }}>
                      💰 Criar Transação de Correção
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      Uma {correcaoSaldo.diferenca > 0 ? 'receita' : 'despesa'} de correção será criada no mês atual, 
                      mantendo o histórico completo de movimentações.
                    </div>
                  </div>
                  
                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    background: '#f9fafb'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem' }}>
                      ⚙️ Ajustar Saldo Inicial
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      O saldo da conta será atualizado diretamente, sem criar transações. 
                      Use apenas para correções de valores iniciais.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="receitas-confirmation-actions" style={{ gap: '8px' }}>
                <button 
                  onClick={() => setCorrecaoSaldo({ show: false, contaId: '', contaNome: '', saldoAtual: 0, novoSaldo: 0, diferenca: 0 })}
                  className="receitas-confirmation-btn receitas-confirmation-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => aplicarCorrecaoSaldo('saldo')}
                  disabled={submitting}
                  className="receitas-confirmation-btn receitas-confirmation-btn-primary"
                  style={{ background: '#6b7280' }}
                >
                  {submitting ? 'Ajustando...' : 'Ajustar Saldo'}
                </button>
                <button 
                  onClick={() => aplicarCorrecaoSaldo('transacao')}
                  disabled={submitting}
                  className="receitas-confirmation-btn receitas-confirmation-btn-primary"
                  style={{ background: correcaoSaldo.diferenca > 0 ? '#10b981' : '#ef4444' }}
                >
                  {submitting ? 'Criando...' : 'Criar Transação'}
                </button>
              </div>
            </div>
          </div>
        )}
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