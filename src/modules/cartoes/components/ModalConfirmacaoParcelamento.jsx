// src/modules/cartoes/components/ModalConfirmacaoParcelamento.jsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';

const ModalConfirmacaoParcelamento = ({
  isOpen,
  onClose,
  transacao,
  excluirTodasParcelas,
  onChangeExcluirTodas,
  onConfirmar
}) => {
  if (!isOpen || !transacao) return null;

  const parcelasFuturas = transacao.total_parcelas - transacao.parcela_atual + 1;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-danger">
              <Trash2 size={18} />
            </div>
            <div>
              <h2 className="modal-title">Excluir Parcela</h2>
              <p className="modal-subtitle">Esta transação faz parte de um parcelamento</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="confirmation-question">
            <p className="confirmation-text">
              Você deseja aplicar esta alteração para todas as parcelas futuras deste parcelamento?
            </p>
          </div>
          
          <div className="confirmation-info">
            <div className="confirmation-item">
              <strong>Descrição:</strong> {transacao.descricao}
            </div>
            <div className="confirmation-item">
              <strong>Parcela Atual:</strong> {transacao.parcela_atual}/{transacao.total_parcelas}
            </div>
            <div className="confirmation-item">
              <strong>Valor da Parcela:</strong> {formatCurrency(Math.abs(transacao.valor))}
            </div>
          </div>

          <div className="confirmation-options">
            <label className="radio-option">
              <input
                type="radio"
                name="excluir-opcao"
                value="apenas-esta"
                checked={!excluirTodasParcelas}
                onChange={() => onChangeExcluirTodas(false)}
              />
              <span>Excluir apenas esta parcela</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="excluir-opcao"
                value="todas-futuras"
                checked={excluirTodasParcelas}
                onChange={() => onChangeExcluirTodas(true)}
              />
              <span>Excluir esta e todas as parcelas futuras</span>
            </label>
          </div>

          <div className="confirmation-warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <p>
              Esta ação não pode ser desfeita. 
              {excluirTodasParcelas && ` Serão excluídas ${parcelasFuturas} parcelas.`}
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
              {excluirTodasParcelas ? 'Excluir Parcelas' : 'Excluir Parcela'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacaoParcelamento;