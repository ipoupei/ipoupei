// src/modules/cartoes/components/ModalConfirmacaoParcelamento.jsx
import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';

const ModalConfirmacaoParcelamento = ({
  isOpen,
  onClose,
  transacao,
  onConfirmar,
  loading = false
}) => {
  if (!isOpen || !transacao) return null;

  const parcelaAtual = transacao.parcela_atual || 1;
  const totalParcelas = transacao.total_parcelas || 1;
  const valorParcela = Math.abs(transacao.valor || 0);

  return (
    <div className="modal-overlay active">
      <div className="modal-compacto">
        {/* Header */}
        <div className="modal-header-compact">
          <div className="modal-title-compact">
            <Trash2 size={16} className="text-red-500" />
            <span>Excluir Parcela</span>
          </div>
          <button onClick={onClose} className="modal-close-compact" disabled={loading}>×</button>
        </div>

        <div className="modal-body-compact">
          {/* Info da Transação */}
          <div className="transacao-info-refined">
            <div className="transacao-principal">
              <span className="transacao-desc">{transacao.descricao}</span>
              <span className="transacao-valor-destaque">{formatCurrency(valorParcela)}</span>
            </div>
            <div className="transacao-parcela-info">
              Parcela {parcelaAtual} de {totalParcelas}
            </div>
          </div>

          {/* Confirmação Simples */}
          <div className="confirmacao-simples">
            <p className="confirmacao-pergunta">
              Confirma a exclusão desta parcela?
            </p>
          </div>

          {/* Aviso */}
          <div className="aviso-refined">
            <AlertTriangle size={14} />
            <span>Esta ação não pode ser desfeita</span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer-compact">
          <button onClick={onClose} className="btn-cancelar-compact" disabled={loading}>
            Cancelar
          </button>
          <button onClick={onConfirmar} className="btn-excluir-compact" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-compact"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Excluir Parcela
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacaoParcelamento;