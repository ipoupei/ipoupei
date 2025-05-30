import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeftRight, ArrowRight, DollarSign, FileText, X, Wallet, AlertTriangle } from 'lucide-react';
import InputMoney from './ui/InputMoney';
import { formatCurrency } from '../utils/formatCurrency';
import useContas from '../hooks/useContas';
import useTransferencias from '../hooks/useTransferencias';
import './ContasModal.css'; // Reutilizando o CSS das contas

/**
 * Modal para transferências entre contas
 * VERSÃO ATUALIZADA - Permite saldo negativo e melhora feedback
 */
const TransferenciasModal = ({ isOpen, onClose }) => {
  // Hooks
  const { contas, loading: contasLoading, fetchContas } = useContas();
  const { realizarTransferencia, loading: transferLoading, error: transferError, setError, verificarTransferencia } = useTransferencias();
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    contaOrigemId: '',
    contaDestinoId: '',
    valor: 0,
    descricao: ''
  });
  
  // Estados de UI
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  const [confirmacao, setConfirmacao] = useState({ visible: false, dados: null });
  const [avisoSaldoNegativo, setAvisoSaldoNegativo] = useState(null);

  // Filtra contas ativas para os selects
  const contasAtivas = contas.filter(conta => conta.ativo);

  // Função para mostrar feedback
  const showFeedback = (message, type = 'success') => {
    setFeedback({ visible: true, message, type });
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 5000);
  };

  // Limpa o formulário
  const resetForm = () => {
    setFormData({
      contaOrigemId: '',
      contaDestinoId: '',
      valor: 0,
      descricao: ''
    });
    setErrors({});
    setError(null);
    setAvisoSaldoNegativo(null);
  };

  // Handler para mudanças nos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa o erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // Recalcula aviso de saldo negativo quando muda conta origem ou valor
    if (name === 'contaOrigemId' || name === 'valor') {
      calcularAvisoSaldoNegativo();
    }
  };

  // Handler para o valor
  const handleValorChange = (value) => {
    setFormData(prev => ({
      ...prev,
      valor: value
    }));
    
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: null }));
    }

    // Recalcula aviso de saldo negativo
    setTimeout(() => calcularAvisoSaldoNegativo(), 100);
  };

  // Calcula e mostra aviso se o saldo ficará negativo
  const calcularAvisoSaldoNegativo = () => {
    if (formData.contaOrigemId && formData.valor > 0) {
      const contaOrigem = contasAtivas.find(c => c.id === formData.contaOrigemId);
      if (contaOrigem && contaOrigem.saldo < formData.valor) {
        const novoSaldo = contaOrigem.saldo - formData.valor;
        setAvisoSaldoNegativo({
          conta: contaOrigem.nome,
          saldoAtual: contaOrigem.saldo,
          novoSaldo: novoSaldo
        });
      } else {
        setAvisoSaldoNegativo(null);
      }
    } else {
      setAvisoSaldoNegativo(null);
    }
  };

  // Effect para recalcular aviso quando dados mudam
  useEffect(() => {
    calcularAvisoSaldoNegativo();
  }, [formData.contaOrigemId, formData.valor, contasAtivas]);

  // Validação do formulário - SEM validação de saldo insuficiente
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.contaOrigemId) {
      newErrors.contaOrigemId = 'Selecione a conta de origem';
    }
    
    if (!formData.contaDestinoId) {
      newErrors.contaDestinoId = 'Selecione a conta de destino';
    }
    
    if (formData.contaOrigemId === formData.contaDestinoId) {
      newErrors.contaDestinoId = 'Conta de destino deve ser diferente da origem';
    }
    
    if (!formData.valor || formData.valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }
    
    // REMOVIDA a validação de saldo insuficiente
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Inverte as contas (origem vira destino e vice-versa)
  const inverterContas = () => {
    setFormData(prev => ({
      ...prev,
      contaOrigemId: prev.contaDestinoId,
      contaDestinoId: prev.contaOrigemId
    }));
    
    // Limpa erros
    setErrors({});
  };

  // Abre confirmação da transferência
  const handleConfirmarTransferencia = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const contaOrigem = contasAtivas.find(c => c.id === formData.contaOrigemId);
      const contaDestino = contasAtivas.find(c => c.id === formData.contaDestinoId);
      
      setConfirmacao({
        visible: true,
        dados: {
          ...formData,
          contaOrigemNome: contaOrigem?.nome,
          contaDestinoNome: contaDestino?.nome,
          valorFormatado: formatCurrency(formData.valor),
          novoSaldoOrigem: contaOrigem ? contaOrigem.saldo - formData.valor : 0,
          novoSaldoDestino: contaDestino ? contaDestino.saldo + formData.valor : 0,
          avisoSaldoNegativo: avisoSaldoNegativo
        }
      });
    }
  };

  // Executa a transferência
  const executarTransferencia = async () => {
    try {
      console.log('🚀 Executando transferência...', formData);
      
      const result = await realizarTransferencia(formData);
      
      console.log('📋 Resultado da transferência:', result);
      
      if (result.success) {
        // Mostra mensagem de sucesso
        showFeedback(result.message, result.aviso ? 'warning' : 'success');
        
        // Reseta o formulário
        resetForm();
        setConfirmacao({ visible: false, dados: null });
        
        // Aguarda um pouco e atualiza as contas
        setTimeout(async () => {
          console.log('🔄 Atualizando lista de contas...');
          await fetchContas();
          
          // Verifica se a transferência foi gravada
          const verificacao = await verificarTransferencia(
            formData.contaOrigemId, 
            formData.contaDestinoId, 
            formData.valor
          );
          
          console.log('✅ Verificação de gravação:', verificacao);
          
          if (!verificacao) {
            showFeedback('⚠️ Transferência realizada, mas verifique os saldos das contas', 'warning');
          }
        }, 1000);
        
      } else {
        console.error('❌ Erro na transferência:', result.error);
        showFeedback(result.error || 'Erro ao realizar transferência', 'error');
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      showFeedback('Erro inesperado ao realizar transferência', 'error');
    }
  };

  // Cancela a confirmação
  const cancelarConfirmacao = () => {
    setConfirmacao({ visible: false, dados: null });
  };

  // Obtém o ícone da conta
  const getContaIcon = (tipo) => {
    switch (tipo) {
      case 'corrente': return '🏦';
      case 'poupanca': return '🐷';
      case 'investimento': return '📈';
      case 'carteira': return '👛';
      default: return '💳';
    }
  };

  // Reset quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Se não estiver aberto, não renderiza
  if (!isOpen) return null;

  return (
    <div className="contas-modal-overlay">
      <div className="contas-modal-container">
        {/* Cabeçalho */}
        <div className="contas-modal-header">
          <h2>
            <ArrowLeftRight size={20} className="icon-header" />
            <span>Transferir entre Contas</span>
          </h2>
          <button 
            className="btn-fechar" 
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="contas-modal-content">
          {/* Feedback */}
          {(feedback.visible || transferError) && (
            <div className={`feedback-message ${feedback.type || 'error'}`}>
              {feedback.message || transferError}
            </div>
          )}
          
          {/* Loading */}
          {contasLoading && (
            <div className="contas-loading">
              <div className="loading-spinner"></div>
              <p>Carregando contas...</p>
            </div>
          )}
          
          {/* Verificação de contas suficientes */}
          {!contasLoading && contasAtivas.length < 2 && (
            <div className="contas-empty">
              <Wallet size={48} strokeWidth={1} />
              <p>Você precisa ter pelo menos 2 contas para fazer transferências</p>
              <button 
                className="btn-primary"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          )}
          
          {/* Formulário */}
          {!contasLoading && contasAtivas.length >= 2 && (
            <form className="conta-form" onSubmit={handleConfirmarTransferencia}>
              <h3>Nova Transferência</h3>
              
              {/* Conta de Origem */}
              <div className="form-group">
                <label htmlFor="contaOrigemId">Conta de Origem *</label>
                <select
                  id="contaOrigemId"
                  name="contaOrigemId"
                  value={formData.contaOrigemId}
                  onChange={handleChange}
                  className={errors.contaOrigemId ? 'error' : ''}
                >
                  <option value="">Selecione a conta de origem</option>
                  {contasAtivas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {getContaIcon(conta.tipo)} {conta.nome} - {formatCurrency(conta.saldo)}
                    </option>
                  ))}
                </select>
                {errors.contaOrigemId && (
                  <div className="form-error">{errors.contaOrigemId}</div>
                )}
              </div>
              
              {/* Botão para inverter contas */}
              {formData.contaOrigemId && formData.contaDestinoId && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                  <button
                    type="button"
                    onClick={inverterContas}
                    className="btn-secondary"
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ArrowLeftRight size={14} />
                    Inverter
                  </button>
                </div>
              )}
              
              {/* Conta de Destino */}
              <div className="form-group">
                <label htmlFor="contaDestinoId">Conta de Destino *</label>
                <select
                  id="contaDestinoId"
                  name="contaDestinoId"
                  value={formData.contaDestinoId}
                  onChange={handleChange}
                  className={errors.contaDestinoId ? 'error' : ''}
                >
                  <option value="">Selecione a conta de destino</option>
                  {contasAtivas
                    .filter(conta => conta.id !== formData.contaOrigemId)
                    .map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {getContaIcon(conta.tipo)} {conta.nome} - {formatCurrency(conta.saldo)}
                    </option>
                  ))}
                </select>
                {errors.contaDestinoId && (
                  <div className="form-error">{errors.contaDestinoId}</div>
                )}
              </div>
              
              {/* Valor */}
              <div className="form-group">
                <label htmlFor="valor">Valor da Transferência *</label>
                <InputMoney
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  className={errors.valor ? 'error' : ''}
                />
                {errors.valor && (
                  <div className="form-error">{errors.valor}</div>
                )}
              </div>

              {/* Aviso de Saldo Negativo */}
              {avisoSaldoNegativo && (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fb923c',
                  borderRadius: '6px',
                  padding: '12px',
                  margin: '12px 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <AlertTriangle size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '14px', color: '#9a3412' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      ⚠️ Saldo Insuficiente - Permitindo Continuar
                    </div>
                    <div>
                      A conta <strong>{avisoSaldoNegativo.conta}</strong> tem saldo de{' '}
                      <strong>{formatCurrency(avisoSaldoNegativo.saldoAtual)}</strong> e ficará com{' '}
                      <strong style={{ color: '#dc2626' }}>
                        {formatCurrency(avisoSaldoNegativo.novoSaldo)}
                      </strong> após a transferência.
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                      💡 Isso é equivalente a usar cheque especial ou ficar devendo na conta.
                    </div>
                  </div>
                </div>
              )}
              
              {/* Descrição */}
              <div className="form-group">
                <label htmlFor="descricao">Descrição (opcional)</label>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Ex: Pagamento de conta, Reserva para viagem"
                  maxLength={100}
                />
                <small style={{ fontSize: '12px', color: '#666' }}>
                  {formData.descricao.length}/100 caracteres
                </small>
              </div>
              
              {/* Preview da transferência */}
              {formData.contaOrigemId && formData.contaDestinoId && formData.valor > 0 && (
                <div style={{
                  background: avisoSaldoNegativo ? '#fef3c7' : '#f0f9ff',
                  border: `1px solid ${avisoSaldoNegativo ? '#f59e0b' : '#0ea5e9'}`,
                  borderRadius: '6px',
                  padding: '12px',
                  margin: '16px 0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: avisoSaldoNegativo ? '#92400e' : '#0369a1',
                    fontWeight: '500'
                  }}>
                    <span>{avisoSaldoNegativo ? '⚠️' : '💸'}</span>
                    <span>{formatCurrency(formData.valor)}</span>
                    <ArrowRight size={16} />
                    <span>{avisoSaldoNegativo ? '⚠️' : '💰'}</span>
                  </div>
                </div>
              )}
              
              {/* Botões */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={transferLoading}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={transferLoading || !formData.contaOrigemId || !formData.contaDestinoId || !formData.valor}
                  className="btn-primary"
                >
                  {transferLoading ? 'Processando...' : 'Confirmar Transferência'}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Modal de Confirmação */}
        {confirmacao.visible && (
          <div className="contas-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="contas-modal-container" style={{ maxWidth: '450px' }}>
              <div className="contas-modal-header">
                <h2>
                  <ArrowLeftRight size={20} className="icon-header" />
                  <span>Confirmar Transferência</span>
                </h2>
              </div>
              
              <div className="contas-modal-content">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: confirmacao.dados?.avisoSaldoNegativo ? '#ea580c' : '#0369a1',
                    marginBottom: '16px' 
                  }}>
                    {confirmacao.dados?.valorFormatado}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>De</div>
                      <div style={{ fontWeight: '500' }}>{confirmacao.dados?.contaOrigemNome}</div>
                    </div>
                    
                    <ArrowRight size={20} color={confirmacao.dados?.avisoSaldoNegativo ? '#ea580c' : '#0369a1'} />
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Para</div>
                      <div style={{ fontWeight: '500' }}>{confirmacao.dados?.contaDestinoNome}</div>
                    </div>
                  </div>

                  {/* Aviso de saldo negativo na confirmação */}
                  {confirmacao.dados?.avisoSaldoNegativo && (
                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <AlertTriangle size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <div style={{ fontSize: '13px', color: '#92400e', textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          Atenção: Saldo Negativo
                        </div>
                        <div>
                          {confirmacao.dados.avisoSaldoNegativo.conta} ficará com{' '}
                          <strong style={{ color: '#dc2626' }}>
                            {formatCurrency(confirmacao.dados.avisoSaldoNegativo.novoSaldo)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    <div>Saldo após transferência:</div>
                    <div style={{ 
                      color: confirmacao.dados?.novoSaldoOrigem < 0 ? '#dc2626' : '#059669',
                      fontWeight: '500'
                    }}>
                      <strong>{confirmacao.dados?.contaOrigemNome}:</strong> {formatCurrency(confirmacao.dados?.novoSaldoOrigem)}
                    </div>
                    <div style={{ color: '#059669', fontWeight: '500' }}>
                      <strong>{confirmacao.dados?.contaDestinoNome}:</strong> {formatCurrency(confirmacao.dados?.novoSaldoDestino)}
                    </div>
                  </div>
                  
                  {confirmacao.dados?.descricao && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px', 
                      background: '#f1f5f9', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      <strong>Descrição:</strong> {confirmacao.dados.descricao}
                    </div>
                  )}
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={cancelarConfirmacao}
                    className="btn-secondary"
                    disabled={transferLoading}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="button"
                    onClick={executarTransferencia}
                    disabled={transferLoading}
                    className="btn-primary"
                    style={{
                      background: confirmacao.dados?.avisoSaldoNegativo ? '#ea580c' : '#3b82f6'
                    }}
                  >
                    {transferLoading ? 'Transferindo...' : (
                      confirmacao.dados?.avisoSaldoNegativo ? 'Confirmar mesmo assim' : 'Confirmar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

TransferenciasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default TransferenciasModal;