// src/modules/cartoes/components/GestaoCartoes/ModalConfirmacaoSimples.jsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';

const ModalConfirmacaoSimples = ({
  isOpen,
  onClose,
  transacao,
  onConfirmar
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
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="confirmation-question">
            <p className="confirmation-text">
              Tem certeza que deseja excluir esta transação?
            </p>
          </div>
          
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
          </div>

          <div className="confirmation-warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <p>
              Esta transação será excluída permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-right">
            <button onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button onClick={onConfirmar} className="btn-secondary btn-secondary--danger">
              <Trash2 size={14} />
              Excluir Transação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacaoSimples;