import React from 'react';
import PropTypes from 'prop-types';
import { Edit2, Archive, Trash2 } from 'lucide-react';
import { formatCurrency } from '@utils/formatCurrency';
import '@shared/styles/FormsModal.css';

/**
 * Componente para exibir um cartão de crédito na lista
 * Versão atualizada usando CSS unificado
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
      diners: { icon: '💳', nome: 'Diners Club' },
      discover: { icon: '💳', nome: 'Discover' },
      jcb: { icon: '💳', nome: 'JCB' },
      aura: { icon: '💳', nome: 'Aura' },
      outros: { icon: '💳', nome: 'Outros' }
    };
    
    return bandeiras[bandeira] || { icon: '💳', nome: 'Desconhecida' };
  };
  
  // Formata o valor do limite
  const limiteFormatado = formatCurrency(cartao.limite || 0);
  
  // Obtém informações da bandeira
  const { icon: bandeiraIcon, nome: bandeiraNome } = getBandeiraInfo(cartao.bandeira);

  return (
    <div 
      className="cartao-item list-item" 
      style={{ borderLeftColor: cartao.cor || 'var(--color-cartoes)' }}
    >
      <div className="cartao-item-content list-item-content">
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
            <span className="detail-label">Limite</span>
            <span className="detail-value">{limiteFormatado}</span>
          </div>
          
          <div className="cartao-item-detail">
            <span className="detail-label">Fechamento</span>
            <span className="detail-value">Dia {cartao.dia_fechamento || 1}</span>
          </div>
          
          <div className="cartao-item-detail">
            <span className="detail-label">Vencimento</span>
            <span className="detail-value">Dia {cartao.dia_vencimento || 10}</span>
          </div>
        </div>
      </div>
      
      {/* Botões de ação */}
      <div className="list-item-actions">
        <button 
          className="action-btn action-btn--edit"
          onClick={onEdit}
          title="Editar cartão"
        >
          <Edit2 size={16} />
        </button>
        
        <button 
          className="action-btn action-btn--archive"
          onClick={onArchive}
          title="Arquivar cartão"
        >
          <Archive size={16} />
        </button>
        
        <button 
          className="action-btn action-btn--delete"
          onClick={onDelete}
          title="Excluir cartão"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

CartaoItem.propTypes = {
  cartao: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    limite: PropTypes.number,
    dia_fechamento: PropTypes.number,
    dia_vencimento: PropTypes.number,
    bandeira: PropTypes.string,
    banco: PropTypes.string,
    cor: PropTypes.string,
    ativo: PropTypes.bool
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default CartaoItem;