// src/modules/cartoes/components/GestaoCartoes/ModalConfirmacaoSimples.jsx
import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';

const ModalConfirmacaoSimples = ({
  isOpen,
  onClose,
  transacao,
  onConfirmar,
  loading = false
}) => {
  if (!isOpen || !transacao) return null;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-danger">
              <Trash2 size={18} />
            </div>
            <div>
              <h2 className="modal-title">Confirmar Exclusão</h2>
              <p className="modal-subtitle">Esta ação não pode ser desfeita</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" disabled={loading}>×</button>
        </div>

        <div className="modal-body">
          <div className="confirmation-question">
            <p className="confirmation-text">
              Tem certeza que deseja excluir esta transação?
            </p>
          </div>
          
          {/* Informações da Transação */}
          <div className="confirmation-info">
            <div className="confirmation-item">
              <strong>Descrição:</strong> {transacao.descricao}
            </div>
            <div className="confirmation-item">
              <strong>Valor:</strong> {formatCurrency(Math.abs(transacao.valor))}
            </div>
            <div className="confirmation-item">
              <strong>Data:</strong> {transacao.data ? new Date(transacao.data).toLocaleDateString('pt-BR') : 'N/A'}
            </div>
            <div className="confirmation-item">
              <strong>Categoria:</strong> {transacao.categoria_nome || 'N/A'}
            </div>
            {transacao.conta_pagamento_nome && (
              <div className="confirmation-item">
                <strong>Conta:</strong> {transacao.conta_pagamento_nome}
              </div>
            )}
          </div>

          {/* Aviso sobre a ação */}
          <div className="confirmation-warning">
            <AlertTriangle size={16} />
            <div>
              <p>
                <strong>Esta transação será excluída permanentemente.</strong>
              </p>
              <p>
                Esta ação não pode ser desfeita. A transação será removida do sistema 
                e não aparecerá mais em relatórios ou extratos.
              </p>
              {transacao.efetivado && (
                <p style={{ marginTop: '8px', color: '#DC2626' }}>
                  ⚠️ Esta transação já foi efetivada. A exclusão pode afetar o saldo da conta.
                </p>
              )}
            </div>
          </div>

          {/* Informações adicionais se houver */}
          {transacao.observacoes && (
            <div className="summary-panel">
              <h4 className="summary-title">Observações</h4>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                {transacao.observacoes}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            onClick={onClose} 
            className="btn-cancel"
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirmar} 
            className="btn-secondary btn-secondary--danger"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Excluir Transação
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacaoSimples;