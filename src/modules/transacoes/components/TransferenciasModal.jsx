// src/modules/transacoes/components/TransferenciasModal.jsx - CORRIGIDO COM CAMPO DE DATA
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  ArrowLeftRight, 
  ArrowRight, 
  DollarSign, 
  X, 
  Building, 
  AlertTriangle,
  Repeat,
  FileText,
  Calendar
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import useTransferencias from '@/modules/transacoes/hooks/useTransferencias';
import '@shared/styles/FormsModal.css';

/**
 * Modal de Transferências - ATUALIZADO COM CAMPO DE DATA
 * ✅ Usa useTransferencias (com RPC e refresh global)
 * ✅ Adiciona campo de data da transferência
 * ✅ Mantém toda a UI original
 */
const TransferenciasModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ USAR O HOOK CORRETO
  const { 
    realizarTransferencia, 
    validarTransferencia,
    loading: transferLoading 
  } = useTransferencias();
  
  const valorInputRef = useRef(null);

  // Estados
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    contaOrigemId: '',
    contaDestinoId: '',
    valor: '',
    data: new Date().toISOString().split('T')[0], // ✅ ADICIONADO CAMPO DE DATA
    descricao: ''
  });
  const [errors, setErrors] = useState({});
  const [validacao, setValidacao] = useState(null); // ✅ Para dados de validação

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
        .order('nome');
      
      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      showNotification('Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Formatação de valor
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

  // Valor numérico
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

  // Dados das contas
  const contaOrigem = useMemo(() => 
    contas.find(c => c.id === formData.contaOrigemId),
    [contas, formData.contaOrigemId]
  );

  const contaDestino = useMemo(() => 
    contas.find(c => c.id === formData.contaDestinoId),
    [contas, formData.contaDestinoId]
  );

  // ✅ VALIDAÇÃO usando o hook
  useEffect(() => {
    const executarValidacao = async () => {
      if (formData.contaOrigemId && formData.contaDestinoId && valorNumerico > 0) {
        const resultado = await validarTransferencia({
          contaOrigemId: formData.contaOrigemId,
          contaDestinoId: formData.contaDestinoId,
          valor: valorNumerico
        });
        setValidacao(resultado);
      } else {
        setValidacao(null);
      }
    };

    executarValidacao();
  }, [formData.contaOrigemId, formData.contaDestinoId, valorNumerico, validarTransferencia]);

  // Cálculo do aviso de saldo negativo usando validação
  const avisoSaldoNegativo = useMemo(() => {
    if (validacao?.valida && validacao.dados?.saldoInsuficiente) {
      return {
        conta: validacao.dados.contaOrigem.nome,
        novoSaldo: validacao.dados.novoSaldoOrigem
      };
    }
    return null;
  }, [validacao]);

  // Reset form
  const resetForm = useCallback(() => {
    const dataAtual = new Date().toISOString().split('T')[0]; // ✅ RESETAR DATA PARA HOJE
    setFormData({ 
      contaOrigemId: '', 
      contaDestinoId: '', 
      valor: '', 
      data: dataAtual, // ✅ RESETAR DATA
      descricao: '' 
    });
    setErrors({});
    setValidacao(null);
  }, []);

  // Effects
  useEffect(() => {
    if (isOpen && user) {
      carregarContas();
    }
  }, [isOpen, user, carregarContas]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setTimeout(() => valorInputRef.current?.focus(), 150);
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }, [errors]);

  const handleValorChange = useCallback((e) => {
    const valorFormatado = formatarValor(e.target.value);
    setFormData(prev => ({ ...prev, valor: valorFormatado }));
    if (errors.valor) setErrors(prev => ({ ...prev, valor: null }));
  }, [formatarValor, errors.valor]);

  const inverterContas = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      contaOrigemId: prev.contaDestinoId,
      contaDestinoId: prev.contaOrigemId
    }));
  }, []);

  // Validação do formulário
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.contaOrigemId) newErrors.contaOrigemId = "Selecione a conta de origem";
    if (!formData.contaDestinoId) newErrors.contaDestinoId = "Selecione a conta de destino";
    if (formData.contaOrigemId === formData.contaDestinoId) newErrors.contaDestinoId = "Deve ser diferente da origem";
    if (!valorNumerico || valorNumerico <= 0) newErrors.valor = "Valor deve ser maior que zero";
    if (!formData.data) newErrors.data = "Data é obrigatória"; // ✅ VALIDAÇÃO DA DATA
    if (formData.descricao && formData.descricao.length > 100) newErrors.descricao = "Máximo de 100 caracteres";
    
    // ✅ Verificar validação do hook
    if (validacao && !validacao.valida) {
      newErrors.geral = validacao.erro;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico, validacao]);

  // ✅ EXECUTAR TRANSFERÊNCIA usando o hook COM DATA
  const executarTransferencia = useCallback(async () => {
    if (!validateForm()) {
      showNotification('Corrija os erros no formulário', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('🔄 Iniciando transferência via hook com data...');
      
      // ✅ USAR O HOOK que tem RPC + refresh global INCLUINDO A DATA
      const resultado = await realizarTransferencia({
        contaOrigemId: formData.contaOrigemId,
        contaDestinoId: formData.contaDestinoId,
        valor: valorNumerico,
        data: formData.data, // ✅ ENVIAR DATA DA TRANSFERÊNCIA
        descricao: formData.descricao
      });

      console.log('📊 Resultado da transferência:', resultado);

      if (resultado.success) {
        const avisoSaldo = avisoSaldoNegativo;
        
        showNotification(
          avisoSaldo 
            ? `Transferência realizada! ${avisoSaldo.conta} ficou com saldo negativo.`
            : 'Transferência realizada com sucesso!',
          avisoSaldo ? 'warning' : 'success'
        );
        
        resetForm();
        await carregarContas(); // Recarregar contas locais
        if (onSave) onSave();
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error(resultado.error || 'Erro na transferência');
      }
      
    } catch (error) {
      console.error('❌ Erro na transferência:', error);
      showNotification(`Erro ao realizar transferência: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, realizarTransferencia, formData, valorNumerico, avisoSaldoNegativo, showNotification, resetForm, carregarContas, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-primary">
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h2 className="modal-title">Transferir entre Contas</h2>
              <p className="modal-subtitle">
                {contas.length} {contas.length === 1 ? 'conta disponível' : 'contas disponíveis'}
                {(transferLoading || submitting) && ' • Processando...'}
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
          ) : contas.length < 2 ? (
            <div className="empty-state">
              <Building size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">Precisa de pelo menos 2 contas</h3>
              <p className="empty-state-description">
                Para fazer transferências você precisa ter pelo menos 2 contas ativas.
              </p>
              <button onClick={onClose} className="btn-primary">
                Entendi
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); executarTransferencia(); }}>
              
              <h3 className="section-title">Informações da Transferência</h3>
              
              {/* ✅ Erro geral de validação */}
              {errors.geral && (
                <div className="summary-panel error mb-3">
                  <div className="summary-header">
                    <AlertTriangle size={16} />
                    <strong>Erro de Validação</strong>
                  </div>
                  <p className="summary-value">{errors.geral}</p>
                </div>
              )}
              
              {/* ✅ VALOR E DATA - Igual ao modal de receitas */}
              <div className="flex gap-3 row mb-3">
                <div>
                  <label className="form-label">
                    <DollarSign size={14} />
                    Valor da Transferência *
                  </label>
                  <input
                    ref={valorInputRef}
                    type="text"
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    disabled={submitting}
                    className={`input-money input-money-highlight ${errors.valor ? 'error' : ''}`}
                  />
                  {errors.valor && <div className="form-error">{errors.valor}</div>}
                </div>
                
                <div>
                  <label className="form-label">
                    <Calendar size={14} />
                    Data da Transferência *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`input-date ${errors.data ? 'error' : ''}`}
                  />
                  {errors.data && <div className="form-error">{errors.data}</div>}
                </div>
              </div>

              {/* Contas */}
              <div className="flex gap-3 row mb-3">
                <div>
                  <label className="form-label">
                    <Building size={14} />
                    De (Origem) *
                  </label>
                  <div className="select-search">
                    <select
                      name="contaOrigemId"
                      value={formData.contaOrigemId}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className={errors.contaOrigemId ? 'error' : ''}
                    >
                      <option value="">Selecione origem</option>
                      {contas.map(conta => (
                        <option key={conta.id} value={conta.id}>
                          {conta.nome} - {formatCurrency(conta.saldo)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.contaOrigemId && <div className="form-error">{errors.contaOrigemId}</div>}
                </div>
                
                <div>
                  <label className="form-label">
                    <Building size={14} />
                    Para (Destino) *
                  </label>
                  <div className="select-search">
                    <select
                      name="contaDestinoId"
                      value={formData.contaDestinoId}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className={errors.contaDestinoId ? 'error' : ''}
                    >
                      <option value="">Selecione destino</option>
                      {contas.filter(c => c.id !== formData.contaOrigemId).map(conta => (
                        <option key={conta.id} value={conta.id}>
                          {conta.nome} - {formatCurrency(conta.saldo)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.contaDestinoId && <div className="form-error">{errors.contaDestinoId}</div>}
                </div>
              </div>

              {/* Botão Inverter */}
              {formData.contaOrigemId && formData.contaDestinoId && (
                <div className="flex flex-col mb-3">
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={inverterContas}
                      disabled={submitting}
                      className="btn-secondary"
                    >
                      <Repeat size={14} />
                      Inverter Contas
                    </button>
                  </div>
                </div>
              )}

              {/* Aviso saldo negativo */}
              {avisoSaldoNegativo && (
                <div className="summary-panel warning mb-3">
                  <div className="summary-header">
                    <AlertTriangle size={16} />
                    <strong>Atenção: Saldo Negativo</strong>
                  </div>
                  <p className="summary-value">
                    <strong>{avisoSaldoNegativo.conta}</strong> ficará com{' '}
                    <strong>{formatCurrency(avisoSaldoNegativo.novoSaldo)}</strong>
                  </p>
                </div>
              )}

              {/* Preview da transferência */}
              {validacao?.valida && validacao.dados && valorNumerico > 0 && (
                <div className={`summary-panel ${avisoSaldoNegativo ? 'warning' : 'success'} mb-3`}>
                  <div className="summary-header">
                    <ArrowLeftRight size={16} />
                    <strong>Resumo da Transferência</strong>
                  </div>
                  <div className="transfer-preview">
                    <div className="transfer-from">
                      <span className="transfer-account">{validacao.dados.contaOrigem.nome}</span>
                      <span className="transfer-amount">-{formatCurrency(valorNumerico)}</span>
                    </div>
                    <div className="transfer-arrow">
                      <ArrowRight size={16} />
                    </div>
                    <div className="transfer-to">
                      <span className="transfer-account">{validacao.dados.contaDestino.nome}</span>
                      <span className="transfer-amount">+{formatCurrency(valorNumerico)}</span>
                    </div>
                  </div>
                  {/* ✅ EXIBIR DATA DA TRANSFERÊNCIA NO PREVIEW */}
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    📅 {new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {/* Descrição opcional */}
              <div className="flex flex-col mb-3">
                <label className="form-label">
                  <FileText size={14} />
                  Descrição <span className="form-label-small">(opcional, máx. 100)</span>
                </label>
                <input
                  type="text"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Ex: Pagamento de conta, reserva de emergência"
                  disabled={submitting}
                  maxLength="100"
                  className={`input-text ${errors.descricao ? 'error' : ''}`}
                />
                <div className="char-counter">
                  <span></span>
                  <span className={formData.descricao.length > 80 ? 'char-counter-warning' : ''}>
                    {formData.descricao.length}/100
                  </span>
                </div>
                {errors.descricao && <div className="form-error">{errors.descricao}</div>}
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        {contas.length >= 2 && (
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={(e) => { e.preventDefault(); executarTransferencia(); }}
              disabled={submitting || !validacao?.valida || !valorNumerico}
              className={`btn-primary ${avisoSaldoNegativo ? 'btn-warning' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Transferindo...
                </>
              ) : (
                <>
                  <ArrowLeftRight size={14} />
                  {avisoSaldoNegativo ? 'Transferir Mesmo Assim' : 'Realizar Transferência'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

TransferenciasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(TransferenciasModal);