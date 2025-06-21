// src/modules/cartoes/components/CartaoItem.jsx
// ✅ AJUSTES MÍNIMOS: Pequenas melhorias, funcionalidade preservada
import React from 'react';
import PropTypes from 'prop-types';
import { Edit, Archive, Trash2, CreditCard } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';
import '@shared/styles/FormsModal.css';

/**
 * Componente para exibir item de cartão
 * ✅ AJUSTADO: Melhorias mínimas, estrutura preservada
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

  // ✅ MELHORIA: Verificação mais robusta de status
  const isArchived = cartao.ativo === false;

  // ✅ MELHORIA: Formatação de cores mais consistente
  const corCartao = cartao.cor || '#8b5cf6';

  return (
    <div className={`credit-card-item ${isArchived ? 'archived' : ''}`}>
      <div className="card-header">
        {/* Ícone do Cartão com cor personalizada */}
        <div 
          className="account-icon"
          style={{ 
            backgroundColor: corCartao,
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
              Limite: {formatCurrency(cartao.limite || 0)}
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
          
          {/* ✅ MELHORIA: Conta de débito vinculada (padrão do sistema) */}
          {cartao.conta_debito_id && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CreditCard size={12} />
              <span>Conta vinculada: {cartao.conta_debito_nome || 'Configurada'}</span>
            </div>
          )}
          
          {/* ✅ COMPATIBILIDADE: Campo antigo ainda suportado */}
          {!cartao.conta_debito_id && cartao.conta_pagamento_nome && (
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
          disabled={false} // ✅ Sempre permitir edição
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
          title="Remover cartão"
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
    conta_debito_id: PropTypes.string, // ✅ NOVO: Campo padrão do sistema
    conta_debito_nome: PropTypes.string, // ✅ NOVO: Nome da conta vinculada
    conta_pagamento_nome: PropTypes.string // ✅ COMPATIBILIDADE: Campo antigo
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default CartaoItem;