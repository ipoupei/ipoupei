// src/modules/cartoes/components/ModalConfirmacaoParcelamento.jsx
import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';

const ModalConfirmacaoParcelamento = ({
  isOpen,
  onClose,
  transacao,
  excluirTodasParcelas,
  onChangeExcluirTodas,
  onConfirmar,
  loading = false
}) => {
  if (!isOpen || !transacao) return null;

  // Calcular parcelas futuras (incluindo a atual)
  const parcelasFuturas = transacao.total_parcelas - transacao.parcela_atual + 1;
  const parcelasPassadas = transacao.parcela_atual - 1;

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-danger">
              <Trash2 size={18} />
            </div>
            <div>
              <h2 className="modal-title">Excluir parcelas do parcelamento</h2>
              <p className="modal-subtitle">Esta transação faz parte de um parcelamento</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" disabled={loading}>×</button>
        </div>

        <div className="modal-body">
          <div className="confirmation-question">
            <p className="confirmation-text">
              Você deseja excluir apenas esta parcela ou todas as parcelas futuras deste parcelamento?
            </p>
          </div>
          
          {/* Informações do Parcelamento */}
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
            <div className="confirmation-item">
              <strong>Data da Parcela:</strong> {transacao.data ? new Date(transacao.data).toLocaleDateString('pt-BR') : 'N/A'}
            </div>
          </div>

          {/* Resumo das Parcelas */}
          <div className="summary-panel">
            <h4 className="summary-title">Resumo do Parcelamento</h4>
            <div className="confirmation-info">
              <div className="confirmation-item">
                <strong>Parcelas já pagas:</strong> {parcelasPassadas} parcela{parcelasPassadas !== 1 ? 's' : ''}
              </div>
              <div className="confirmation-item">
                <strong>Parcelas futuras (incluindo atual):</strong> {parcelasFuturas} parcela{parcelasFuturas !== 1 ? 's' : ''}
              </div>
              <div className="confirmation-item">
                <strong>Valor total restante:</strong> {formatCurrency(Math.abs(transacao.valor) * parcelasFuturas)}
              </div>
            </div>
          </div>

          {/* Opções de Exclusão */}
          <div className="confirmation-options">
            <label className="radio-option">
              <input
                type="radio"
                name="excluir-opcao"
                value="apenas-esta"
                checked={!excluirTodasParcelas}
                onChange={() => onChangeExcluirTodas(false)}
                disabled={loading}
              />
              <div className="radio-option-content">
                <span className="radio-option-title">Excluir apenas esta parcela</span>
                <small className="radio-option-description">
                  Remove somente a parcela {transacao.parcela_atual}/{transacao.total_parcelas}. 
                  As outras {parcelasFuturas - 1} parcelas futuras serão mantidas.
                </small>
              </div>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="excluir-opcao"
                value="todas-futuras"
                checked={excluirTodasParcelas}
                onChange={() => onChangeExcluirTodas(true)}
                disabled={loading}
              />
              <div className="radio-option-content">
                <span className="radio-option-title">Excluir todas as futuras parcelas</span>
                <small className="radio-option-description">
                  Remove esta parcela e todas as {parcelasFuturas - 1} parcelas futuras. 
                  Total: {parcelasFuturas} parcela{parcelasFuturas !== 1 ? 's' : ''} excluída{parcelasFuturas !== 1 ? 's' : ''}.
                </small>
              </div>
            </label>
          </div>

          {/* Aviso sobre a ação */}
          <div className="confirmation-warning">
            <AlertTriangle size={16} />
            <div>
              <p>
                <strong>Esta ação não pode ser desfeita.</strong>
              </p>
              <p>
                {excluirTodasParcelas 
                  ? `Serão excluídas ${parcelasFuturas} parcelas deste parcelamento.`
                  : `Será excluída apenas 1 parcela deste parcelamento.`
                }
              </p>
              {excluirTodasParcelas && parcelasFuturas > 1 && (
                <p style={{ marginTop: '8px', color: '#DC2626' }}>
                  💡 Valor total que será removido: {formatCurrency(Math.abs(transacao.valor) * parcelasFuturas)}
                </p>
              )}
            </div>
          </div>
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
                {excluirTodasParcelas ? 'Excluir Todas as Futuras' : 'Excluir Apenas Esta'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacaoParcelamento;