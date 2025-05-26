import React from 'react';
import PropTypes from 'prop-types';
import { Edit2, Archive, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Componente para exibir um cartão de crédito na lista
 * Versão corrigida com os nomes corretos dos campos do banco
 */
const CartaoItem = ({ cartao, onEdit, onArchive, onDelete }) => {
  // Obtém o ícone e nome da bandeira
  const getBandeiraInfo = (bandeira) => {
    const bandeiras = {
      visa: { icon: '💳', nome: 'Visa' },
      mastercard: { icon: '💳', nome: 'Mastercard' },
      elo: { icon: '💳', nome: 'Elo' },
      amex: { icon: '💳', nome: 'American Express' },
      hipercard: { icon: '💳', nome: 'Hipercard' },
      outros: { icon: '💳', nome: 'Outros' }
    };
    
    return bandeiras[bandeira] || { icon: '💳', nome: 'Desconhecida' };
  };
  
  // Formata o valor do limite
  const limiteFormatado = formatCurrency(cartao.limite || 0);
  
  // Obtém informações da bandeira
  const { icon: bandeiraIcon, nome: bandeiraNome } = getBandeiraInfo(cartao.bandeira);

  return (
    <div className="cartao-item" style={{ borderLeftColor: cartao.cor || '#7c3aed' }}>
      <div className="cartao-item-content">
        {/* Informações principais */}
        <div className="cartao-item-main">
          <div className="cartao-item-nome">{cartao.nome}</div>
          <div className="cartao-item-bandeira">
            <span className="bandeira-icon">{bandeiraIcon}</span>
            <span className="bandeira-nome">{bandeiraNome}</span>
          </div>
          {cartao.banco && (
            <div className="cartao-item-banco">{cartao.banco}</div>
          )}
        </div>
        
        {/* Informações secundárias */}
        <div className="cartao-item-details">
          <div className="cartao-item-detail">
            <span className="detail-label">Limite:</span>
            <span className="detail-value">{limiteFormatado}</span>
          </div>
          
          <div className="cartao-item-detail">
            <span className="detail-label">Fechamento:</span>
            <span className="detail-value">Dia {cartao.dia_fechamento || 1}</span>
          </div>
          
          <div className="cartao-item-detail">
            <span className="detail-label">Vencimento:</span>
            <span className="detail-value">Dia {cartao.dia_vencimento || 10}</span>
          </div>
        </div>
      </div>
      
      {/* Botões de ação */}
      <div className="cartao-item-actions">
        <button 
          className="action-button edit"
          onClick={onEdit}
          title="Editar cartão"
        >
          <Edit2 size={16} />
        </button>
        
        <button 
          className="action-button archive"
          onClick={onArchive}
          title="Arquivar cartão"
        >
          <Archive size={16} />
        </button>
        
        <button 
          className="action-button delete"
          onClick={onDelete}
          title="Excluir cartão"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <style jsx>{`
        .cartao-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-left: 4px solid;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
          margin-bottom: 12px;
        }

        .cartao-item:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .cartao-item-content {
          flex: 1;
        }

        .cartao-item-main {
          margin-bottom: 8px;
        }

        .cartao-item-nome {
          font-weight: 600;
          font-size: 16px;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .cartao-item-bandeira {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .bandeira-icon {
          font-size: 14px;
        }

        .bandeira-nome {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .cartao-item-banco {
          font-size: 12px;
          color: #9ca3af;
        }

        .cartao-item-details {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cartao-item-detail {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 13px;
          color: #374151;
          font-weight: 500;
        }

        .cartao-item-actions {
          display: flex;
          gap: 8px;
          margin-left: 16px;
        }

        .action-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-button.edit {
          color: #3b82f6;
        }

        .action-button.edit:hover {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .action-button.archive {
          color: #f59e0b;
        }

        .action-button.archive:hover {
          background: #fffbeb;
          color: #d97706;
        }

        .action-button.delete {
          color: #ef4444;
        }

        .action-button.delete:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        @media (max-width: 640px) {
          .cartao-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .cartao-item-actions {
            align-self: flex-end;
            margin-left: 0;
          }

          .cartao-item-details {
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

CartaoItem.propTypes = {
  cartao: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    limite: PropTypes.number,
    dia_fechamento: PropTypes.number, // Campo corrigido do DB
    dia_vencimento: PropTypes.number, // Campo corrigido do DB
    bandeira: PropTypes.string,
    banco: PropTypes.string, // Campo adicional do DB
    cor: PropTypes.string,
    ativo: PropTypes.bool
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default CartaoItem;