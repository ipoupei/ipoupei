// src/components/TransferenciasModal.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  ArrowLeftRight, 
  ArrowRight, 
  DollarSign, 
  X, 
  Building, 
  AlertTriangle,
  Repeat
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabaseClient';
import './FormsModal.css';

/**
 * Modal de Transferências - Versão Corrigida
 * Corrige problemas de formatação de moeda, layout e lógica
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

  useEffect(() => {
    if (isOpen && user) {
      carregarContas();
    }
  }, [isOpen, user, carregarContas]);

  // Formatação de valor ULTRA CORRIGIDA
  const formatarValor = useCallback((valor) => {
    // Remove tudo que não é dígito
    const apenasNumeros = valor.toString().replace(/\D/g, '');
    
    // Se não tem números, retorna vazio
    if (!apenasNumeros || apenasNumeros === '0') return '';
    
    // Converte para centavos e depois para reais
    const valorEmCentavos = parseInt(apenasNumeros, 10);
    const valorEmReais = valorEmCentavos / 100;
    
    // Formata com vírgula decimal brasileira
    return valorEmReais.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  // Valor numérico ULTRA CORRIGIDO
  const valorNumerico = useMemo(() => {
    if (!formData.valor) return 0;
    
    // Remove formatação brasileira e converte para número decimal
    const valorString = formData.valor.toString();
    
    // Remove pontos de milhares e substitui vírgula por ponto
    const valorLimpo = valorString
      .replace(/\./g, '') // Remove pontos (separadores de milhares)
      .replace(',', '.'); // Substitui vírgula por ponto decimal
      
    const numero = parseFloat(valorLimpo);
    return isNaN(numero) ? 0 : Math.round(numero * 100) / 100; // Arredonda para 2 casas decimais
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

  // Cálculo do aviso de saldo negativo corrigido
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

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setTimeout(() => valorInputRef.current?.focus(), 150);
    }
  }, [isOpen, resetForm]);

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, valorNumerico]);

  // Executar transferência ULTRA CORRIGIDA
  const executarTransferencia = useCallback(async () => {
    if (!validateForm()) {
      showNotification('Corrija os erros no formulário', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('=== DEBUG TRANSFERÊNCIA ===');
      console.log('Valor original:', formData.valor);
      console.log('Valor numérico calculado:', valorNumerico);
      console.log('Conta origem ID:', formData.contaOrigemId);
      console.log('Conta destino ID:', formData.contaDestinoId);
      
      // Verificar se as contas ainda existem
      const { data: contasAtualizadas, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .in('id', [formData.contaOrigemId, formData.contaDestinoId])
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      if (contasError) {
        console.error('Erro ao buscar contas:', contasError);
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

      console.log('Conta origem:', contaOrigemAtualizada.nome, 'Saldo atual:', contaOrigemAtualizada.saldo);
      console.log('Conta destino:', contaDestinoAtualizada.nome, 'Saldo atual:', contaDestinoAtualizada.saldo);
      
      const grupoTransferencia = crypto.randomUUID();
      const dataAtual = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString();
      
      // Garantir que o valor é um número válido
      const valorFinal = Math.round(valorNumerico * 100) / 100; // Arredonda para 2 casas decimais
      
      if (valorFinal <= 0) {
        throw new Error('Valor da transferência deve ser maior que zero');
      }
      
      console.log('Valor final da transferência:', valorFinal);
      
      // Criar transações SEM grupo_transferencia (que não existe na tabela)
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
      
      console.log('Transações a serem inseridas:', transacoes);
      
      // Inserir transações
      const { data: transacoesInseridas, error: transacoesError } = await supabase
        .from('transacoes')
        .insert(transacoes)
        .select();
      
      if (transacoesError) {
        console.error('Erro ao inserir transações:', transacoesError);
        throw new Error('Erro ao registrar transações: ' + transacoesError.message);
      }
      
      console.log('Transações inseridas com sucesso:', transacoesInseridas);
      
      // Calcular novos saldos com MÁXIMA PRECISÃO
      const saldoOrigemAtual = parseFloat(contaOrigemAtualizada.saldo);
      const saldoDestinoAtual = parseFloat(contaDestinoAtualizada.saldo);
      
      console.log('Saldos atuais EXATOS:');
      console.log('- Origem:', saldoOrigemAtual, typeof saldoOrigemAtual);
      console.log('- Destino:', saldoDestinoAtual, typeof saldoDestinoAtual);
      console.log('- Valor transferência:', valorFinal, typeof valorFinal);
      
      // Calcula com precisão máxima
      const novoSaldoOrigem = Number((saldoOrigemAtual - valorFinal).toFixed(2));
      const novoSaldoDestino = Number((saldoDestinoAtual + valorFinal).toFixed(2));
      
      console.log('Novos saldos calculados:');
      console.log('- Origem:', saldoOrigemAtual, '-', valorFinal, '=', novoSaldoOrigem);
      console.log('- Destino:', saldoDestinoAtual, '+', valorFinal, '=', novoSaldoDestino);
      
      // Atualizar saldos das contas INDIVIDUALMENTE para garantir sucesso
      console.log('Atualizando conta origem...');
      const { data: contaOrigemAtualizada2, error: origemError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoOrigem,
          updated_at: timestamp
        })
        .eq('id', formData.contaOrigemId)
        .eq('usuario_id', user.id)
        .select();
      
      if (origemError) {
        console.error('Erro ao atualizar conta origem:', origemError);
        throw new Error('Erro ao atualizar saldo da conta de origem: ' + origemError.message);
      }
      
      console.log('Conta origem atualizada:', contaOrigemAtualizada2);
      
      console.log('Atualizando conta destino...');
      const { data: contaDestinoAtualizada2, error: destinoError } = await supabase
        .from('contas')
        .update({ 
          saldo: novoSaldoDestino,
          updated_at: timestamp
        })
        .eq('id', formData.contaDestinoId)
        .eq('usuario_id', user.id)
        .select();
      
      if (destinoError) {
        console.error('Erro ao atualizar conta destino:', destinoError);
        throw new Error('Erro ao atualizar saldo da conta de destino: ' + destinoError.message);
      }
      
      console.log('Conta destino atualizada:', contaDestinoAtualizada2);
      
      console.log('Saldos atualizados com sucesso!');
      
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
      console.error('=== ERRO NA TRANSFERÊNCIA ===');
      console.error('Detalhes do erro:', error);
      console.error('Stack trace:', error.stack);
      
      showNotification(
        `Erro ao realizar transferência: ${error.message}`, 
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, user.id, formData, valorNumerico, showNotification, resetForm, carregarContas, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="receitas-modal-overlay">
      <div className="receitas-modal-container">
        {/* Header */}
        <div className="receitas-modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white'
            }}>
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h2 className="receitas-modal-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                Transferir entre Contas
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                {contas.length} conta{contas.length !== 1 ? 's' : ''} disponível{contas.length !== 1 ? 'is' : ''}
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
              <div className="receitas-loading-spinner" style={{ borderTopColor: '#10b981' }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Carregando contas...
              </p>
            </div>
          ) : contas.length < 2 ? (
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
                Precisa de pelo menos 2 contas para transferir
              </p>
              <button onClick={onClose} className="receitas-btn receitas-btn-primary" style={{ background: '#10b981' }}>
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); executarTransferencia(); }} className="receitas-form">
              
              {/* Valor */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
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
                  className={`receitas-form-input receitas-valor-input ${errors.valor ? 'error' : ''}`}
                  style={{ 
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: '#10b981',
                    textAlign: 'center'
                  }}
                />
                {errors.valor && <div className="receitas-form-error">{errors.valor}</div>}
              </div>

              {/* Contas - Tamanhos iguais */}
              <div className="receitas-form-row">
                <div className="receitas-form-group" style={{ flex: 1 }}>
                  <label className="receitas-form-label">
                    <Building size={14} />
                    De *
                  </label>
                  <select
                    name="contaOrigemId"
                    value={formData.contaOrigemId}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.contaOrigemId ? 'error' : ''}`}
                  >
                    <option value="">Selecione origem</option>
                    {contas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} - {formatCurrency(conta.saldo)}
                      </option>
                    ))}
                  </select>
                  {errors.contaOrigemId && <div className="receitas-form-error">{errors.contaOrigemId}</div>}
                </div>
                
                <div className="receitas-form-group" style={{ flex: 1 }}>
                  <label className="receitas-form-label">
                    <Building size={14} />
                    Para *
                  </label>
                  <select
                    name="contaDestinoId"
                    value={formData.contaDestinoId}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`receitas-form-input ${errors.contaDestinoId ? 'error' : ''}`}
                  >
                    <option value="">Selecione destino</option>
                    {contas.filter(c => c.id !== formData.contaOrigemId).map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} - {formatCurrency(conta.saldo)}
                      </option>
                    ))}
                  </select>
                  {errors.contaDestinoId && <div className="receitas-form-error">{errors.contaDestinoId}</div>}
                </div>
              </div>

              {/* Botão Inverter */}
              {formData.contaOrigemId && formData.contaDestinoId && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                  <button
                    type="button"
                    onClick={inverterContas}
                    disabled={submitting}
                    className="receitas-btn receitas-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <Repeat size={14} />
                    Inverter
                  </button>
                </div>
              )}

              {/* Aviso saldo negativo */}
              {avisoSaldoNegativo && (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fb923c',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                  color: '#9a3412'
                }}>
                  <AlertTriangle size={18} color="#ea580c" />
                  <div>
                    <strong>{avisoSaldoNegativo.conta}</strong> ficará com{' '}
                    <strong style={{ color: '#dc2626' }}>{formatCurrency(avisoSaldoNegativo.novoSaldo)}</strong>
                  </div>
                </div>
              )}

              {/* Preview com nomes das contas */}
              {formData.contaOrigemId && formData.contaDestinoId && valorNumerico > 0 && contaOrigem && contaDestino && (
                <div style={{
                  background: avisoSaldoNegativo ? '#fef3c7' : '#f0f9ff',
                  border: `1px solid ${avisoSaldoNegativo ? '#f59e0b' : '#10b981'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '0.875rem',
                  color: avisoSaldoNegativo ? '#92400e' : '#065f46',
                  fontWeight: '500'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <span>{avisoSaldoNegativo ? '⚠️' : '💸'}</span>
                    <span style={{ fontSize: '0.75rem' }}>{contaOrigem.nome}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(valorNumerico)}</span>
                    <ArrowRight size={16} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.75rem' }}>{contaDestino.nome}</span>
                    <span>{avisoSaldoNegativo ? '⚠️' : '💰'}</span>
                  </div>
                </div>
              )}

              {/* Descrição opcional */}
              <div className="receitas-form-group receitas-form-full">
                <label className="receitas-form-label">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Ex: Pagamento de conta"
                  disabled={submitting}
                  maxLength="100"
                  className="receitas-form-input"
                />
              </div>

              {/* Ações */}
              <div className="receitas-form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="receitas-btn receitas-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.contaOrigemId || !formData.contaDestinoId || !valorNumerico}
                  className="receitas-btn receitas-btn-primary"
                  style={{ 
                    flex: 1,
                    background: avisoSaldoNegativo ? '#f59e0b' : '#10b981'
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="receitas-btn-spinner"></div>
                      Transferindo...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight size={14} />
                      {avisoSaldoNegativo ? 'Transferir mesmo assim' : 'Transferir'}
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

TransferenciasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(TransferenciasModal);