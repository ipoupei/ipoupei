// src/modules/cartoes/components/ModalReabrirFatura.jsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import useFaturaOperations from '../hooks/useFaturaOperations';

const ModalReabrirFatura = ({ 
  isOpen, 
  onClose, 
  cartao, 
  valorFatura, 
  mesReferencia, 
  anoReferencia,
  onSuccess 
}) => {
  const [confirmacao, setConfirmacao] = useState(false);
  
  const { reabrirFatura, isLoading, error, setError } = useFaturaOperations();

  useEffect(() => {
    if (isOpen) {
      setConfirmacao(false);
      setError(null);
    }
  }, [isOpen, setError]);

  const handleConfirmar = async () => {
    if (!confirmacao) {
      setError('Confirme a operação marcando a caixa de confirmação');
      return;
    }

    const resultado = await reabrirFatura(
      cartao.id, 
      mesReferencia, 
      anoReferencia
    );

    if (resultado.success) {
      onSuccess && onSuccess();
      onClose();
    }
  };

  const mesNome = new Date(anoReferencia, mesReferencia - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-warning">
              <RotateCcw />
            </div>
            <div>
              <h2 className="modal-title">Reabrir Fatura</h2>
              <p className="modal-subtitle">Reverter o pagamento da fatura</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Aviso Principal */}
          <div className="confirmation-warning">
            <AlertTriangle size={16} />
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#92400E' }}>Atenção!</h3>
              <p>
                Esta operação irá reverter o pagamento da fatura, retornando todas as 
                transações para o status "não efetivada" e removendo a vinculação com a conta de débito.
              </p>
            </div>
          </div>

          {/* Informações da Fatura */}
          <div className="summary-panel">
            <h3 className="summary-title">Detalhes da Operação</h3>
            <div className="confirmation-info">
              <div className="confirmation-item">
                <strong>Cartão:</strong> {cartao.nome}
              </div>
              <div className="confirmation-item">
                <strong>Período da Fatura:</strong> {mesNome}
              </div>
              <div className="confirmation-item">
                <strong>Valor da Fatura:</strong> 
                <span className="summary-value" style={{ color: '#DC3545' }}>
                  {formatCurrency(valorFatura)}
                </span>
              </div>
            </div>
          </div>

          {/* Consequências */}
          <div className="summary-panel danger">
            <h4 className="summary-title" style={{ color: '#A02834' }}>O que acontecerá:</h4>
            <div style={{ fontSize: '14px', color: '#A02834', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 8px 0' }}>• Todas as transações desta fatura voltarão ao status "não efetivada"</p>
              <p style={{ margin: '0 0 8px 0' }}>• A vinculação com a conta de débito será removida</p>
              <p style={{ margin: '0 0 8px 0' }}>• O valor retornará ao saldo disponível da conta</p>
              <p style={{ margin: '0' }}>• A fatura voltará ao status "em aberto"</p>
            </div>
          </div>

          {/* Confirmação */}
          <div className="confirmation-warning">
            <input
              type="checkbox"
              id="confirmacao-reabrir"
              checked={confirmacao}
              onChange={(e) => setConfirmacao(e.target.checked)}
              disabled={isLoading}
              style={{ marginTop: '2px' }}
            />
            <div>
              <p>
                Confirmo que desejo reabrir esta fatura do cartão{' '}
                <strong>{cartao.nome}</strong> referente ao período de{' '}
                <strong>{mesNome}</strong>. Entendo que esta operação reverterá 
                o pagamento já realizado.
              </p>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="summary-panel danger">
              <div className="confirmation-item">
                <AlertTriangle size={16} style={{ color: '#DC3545', marginRight: '8px' }} />
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="btn-secondary--warning"
            onClick={handleConfirmar}
            disabled={isLoading || !confirmacao}
          >
            {isLoading ? (
              <>
                <div className="btn-spinner"></div>
                Reabrindo...
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                Confirmar Reabertura
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalReabrirFatura;