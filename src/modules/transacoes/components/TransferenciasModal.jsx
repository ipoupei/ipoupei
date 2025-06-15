// src/modules/transacoes/components/TransferenciasModal.jsx - VERSÃO CSS PURO
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
  FileText
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import { supabase } from '@lib/supabaseClient';
import '@shared/styles/FormsModal.css';

/**
 * Modal de Transferências - CSS Puro
 * Seguindo o padrão dos outros modais
 */
const TransferenciasModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const valorInputRef = useRef(null);

  // Estados
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    contaOrigemId: '',
    contaDestinoId: '',
    valor: '',
    descricao: ''
  });
  const [errors, setErrors] = useState({});

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

  // Cálculo do aviso de saldo negativo
  const avisoSaldoNegativo = useMemo(() => {
    if (contaOrigem && valorNumerico > 0) {
      const novoSaldo = Number(contaOrigem.saldo) - valorNumerico;
      return novoSaldo < 0 ? { conta: contaOrigem.nome, novoSaldo } : null;
    }
    return null;
  }, [contaOrigem, valorNumerico]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({ contaOrigemId: '', contaDestinoId: '', valor: '', descricao: '' });
    setErrors({});
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

  // Validação
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.contaOrigemId) newErrors.contaOrigemId = "Selecione a conta de origem";
    if (!formData.contaDestinoId) newErrors.contaDestinoId = "Selecione a conta de destino";
    if (formData.contaOrigemId === formData.contaDestinoId) newErrors.contaDestinoId = "Deve ser diferente da origem";
    if (!valorNumerico || valorNumerico <= 0) newErrors.valor = "Valor deve ser maior que zero";
    if (formData.descricao && formData.descricao.length > 100) newErrors.descricao = "Máximo de 100 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico]);

  // Executar transferência
  const executarTransferencia = useCallback(async () => {
    if (!validateForm()) {
      showNotification('Corrija os erros no formulário', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      // Verificar se as contas ainda existem
      const { data: contasAtualizadas, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .in('id', [formData.contaOrigemId, formData.contaDestinoId])
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      if (contasError) {
        throw new Error('Erro ao acessar dados das contas');
      }

      if (!contasAtualizadas || contasAtualizadas.length !== 2) {
        throw new Error('Uma ou ambas as contas não foram encontradas');
      }

      const contaOrigemAtualizada = contasAtualizadas.find(c => c.id === formData.contaOrigemId);
      const contaDestinoAtualizada = contasAtualizadas.find(c => c.id === formData.contaDestinoId);

      if (!contaOrigemAtualizada || !contaDestinoAtualizada) {
        throw new Error('Erro ao identificar as contas');
      }
      
      const dataAtual = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString();
      const valorFinal = Math.round(valorNumerico * 100) / 100;
      
      if (valorFinal <= 0) {
        throw new Error('Valor da transferência deve ser maior que zero');
      }
      
      // Criar identificador único para a transferência
      const identificadorTransferencia = `TRANS_${timestamp.replace(/[-:.T]/g, '')}_${Math.random().toString(36).substr(2, 5)}`;
      
      const transacoes = [
        {
          usuario_id: user.id,
          data: dataAtual,
          descricao: `Transferência para ${contaDestinoAtualizada.nome}${formData.descricao ? ` - ${formData.descricao}` : ''} [${identificadorTransferencia}]`,
          conta_id: formData.contaOrigemId,
          valor: valorFinal,
          tipo: 'despesa',
          efetivado: true,
          transferencia: true,
          observacoes: formData.descricao || null,
          created_at: timestamp,
          updated_at: timestamp
        },
        {
          usuario_id: user.id,
          data: dataAtual,
          descricao: `Transferência de ${contaOrigemAtualizada.nome}${formData.descricao ? ` - ${formData.descricao}` : ''} [${identificadorTransferencia}]`,
          conta_id: formData.contaDestinoId,
          valor: valorFinal,
          tipo: 'receita',
          efetivado: true,
          transferencia: true,
          observacoes: formData.descricao || null,
          created_at: timestamp,
          updated_at: timestamp
        }
      ];
      
      // Inserir transações
      const { data: transacoesInseridas, error: transacoesError } = await supabase
        .from('transacoes')
        .insert(transacoes)
        .select();
      
      if (transacoesError) {
        throw new Error('Erro ao registrar transações: ' + transacoesError.message);
      }
      
      // Calcular novos saldos
      const saldoOrigemAtual = parseFloat(contaOrigemAtualizada.saldo);
      const saldoDestinoAtual = parseFloat(contaDestinoAtualizada.saldo);
      const novoSaldoOrigem = Number((saldoOrigemAtual - valorFinal).toFixed(2));
      const novoSaldoDestino = Number((saldoDestinoAtual + valorFinal).toFixed(2));
      
      // Atualizar saldos das contas
      const { error: origemError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoOrigem,
          updated_at: timestamp
        })
        .eq('id', formData.contaOrigemId)
        .eq('usuario_id', user.id);
      
      if (origemError) {
        throw new Error('Erro ao atualizar saldo da conta de origem: ' + origemError.message);
      }
      
      const { error: destinoError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoDestino,
          updated_at: timestamp
        })
        .eq('id', formData.contaDestinoId)
        .eq('usuario_id', user.id);
      
      if (destinoError) {
        throw new Error('Erro ao atualizar saldo da conta de destino: ' + destinoError.message);
      }
      
      const avisoSaldo = novoSaldoOrigem < 0;
      
      showNotification(
        avisoSaldo 
          ? `Transferência realizada! ${contaOrigemAtualizada.nome} ficou com saldo negativo.`
          : 'Transferência realizada com sucesso!',
        avisoSaldo ? 'warning' : 'success'
      );
      
      resetForm();
      await carregarContas();
      if (onSave) onSave();
      setTimeout(() => onClose(), 1500);
      
    } catch (error) {
      console.error('Erro na transferência:', error);
      showNotification(`Erro ao realizar transferência: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, user.id, formData, valorNumerico, showNotification, resetForm, carregarContas, onSave, onClose]);

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
              
              {/* Valor */}
              <div className="flex flex-col mb-3">
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
              {formData.contaOrigemId && formData.contaDestinoId && valorNumerico > 0 && contaOrigem && contaDestino && (
                <div className={`summary-panel ${avisoSaldoNegativo ? 'warning' : 'success'} mb-3`}>
                  <div className="summary-header">
                    <ArrowLeftRight size={16} />
                    <strong>Preview da Transferência</strong>
                  </div>
                  <div className="transfer-preview">
                    <div className="transfer-from">
                      <span className="transfer-account">{contaOrigem.nome}</span>
                      <span className="transfer-amount">-{formatCurrency(valorNumerico)}</span>
                    </div>
                    <div className="transfer-arrow">
                      <ArrowRight size={16} />
                    </div>
                    <div className="transfer-to">
                      <span className="transfer-account">{contaDestino.nome}</span>
                      <span className="transfer-amount">+{formatCurrency(valorNumerico)}</span>
                    </div>
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
              disabled={submitting || !formData.contaOrigemId || !formData.contaDestinoId || !valorNumerico}
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