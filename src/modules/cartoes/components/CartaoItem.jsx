import React from 'react';
import PropTypes from 'prop-types';
import { Edit, Archive, Trash2, CreditCard } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';
import '@shared/styles/FormsModal.css';

/**
 * Componente para exibir item de cartão
 * Versão migrada para FormsModal.css
 */
const CartaoItem = ({ cartao, onEdit, onArchive, onDelete }) => {
  // Função para obter o ícone da bandeira baseado no tipo
  const getBandeiraIcon = (bandeira) => {
    const icons = {
      'visa': '💳',
      'mastercard': '💳', 
      'elo': '💳',
      'amex': '💳',
      'hipercard': '💳',
      'diners': '💳',
      'discover': '💳',
      'jcb': '💳',
      'aura': '💳',
      'outros': '💳'
    };
    return icons[bandeira?.toLowerCase()] || '💳';
  };

  // Função para determinar se o cartão está arquivado
  const isArchived = !cartao.ativo;

  return (
    <div className={`credit-card-item ${isArchived ? 'archived' : ''}`}>
      <div className="card-header">
        {/* Ícone do Cartão com cor personalizada */}
        <div 
          className="account-icon"
          style={{ 
            backgroundColor: cartao.cor || '#8b5cf6',
            color: 'white'
          }}
        >
          {getBandeiraIcon(cartao.bandeira)}
        </div>
        
        {/* Informações do Cartão */}
        <div className="account-info">
          {/* Nome e Bandeira */}
          <div className="account-name">
            {cartao.nome}
            {cartao.bandeira && (
              <span 
                style={{
                  background: '#f3f4f6',
                  color: '#6b7280',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  marginLeft: '8px'
                }}
              >
                {cartao.bandeira}
              </span>
            )}
            {isArchived && (
              <span className="archived-badge">ARQUIVADO</span>
            )}
          </div>
          
          {/* Banco se disponível */}
          {cartao.banco && (
            <div className="account-type">
              {cartao.banco}
            </div>
          )}
          
          {/* Informações Principais em Grid */}
          <div className="account-balance">
            {/* Limite */}
            <div className="balance-current positive">
              {formatCurrency(cartao.limite || 0)}
            </div>
            
            {/* Datas importantes */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              fontSize: '0.8rem',
              color: '#6b7280',
              marginTop: '4px'
            }}>
              <span>
                <strong>Fecha:</strong> Dia {cartao.dia_fechamento || 1}
              </span>
              <span>
                <strong>Vence:</strong> Dia {cartao.dia_vencimento || 10}
              </span>
            </div>
          </div>
          
          {/* Conta de Pagamento */}
          {cartao.conta_pagamento_nome && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CreditCard size={12} />
              <span>Pago via: {cartao.conta_pagamento_nome}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Ações do Cartão */}
      <div className="card-actions">
        <button
          onClick={() => onEdit(cartao)}
          className="card-action-btn edit"
          title="Editar cartão"
        >
          <Edit size={16} />
        </button>
        
        <button
          onClick={() => onArchive(cartao.id)}
          className="card-action-btn archive"
          title={isArchived ? "Desarquivar cartão" : "Arquivar cartão"}
        >
          <Archive size={16} />
        </button>
        
        <button
          onClick={() => onDelete(cartao.id)}
          className="card-action-btn delete"
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
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    nome: PropTypes.string.isRequired,
    limite: PropTypes.number,
    bandeira: PropTypes.string,
    banco: PropTypes.string,
    dia_fechamento: PropTypes.number,
    dia_vencimento: PropTypes.number,
    cor: PropTypes.string,
    ativo: PropTypes.bool,
    conta_pagamento_nome: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default CartaoItem;