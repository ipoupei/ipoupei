// src/modules/cartoes/components/CartaoItem.jsx - VERSÃO CORRIGIDA fonte legível
import React from 'react';
import PropTypes from 'prop-types';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { formatCurrency } from '@utils/formatCurrency';

/**
 * Componente para exibir item de cartão
 * ✅ CORREÇÃO: Fontes mais legíveis para limite, fechamento e vencimento
 * ✅ CORREÇÃO: Contraste melhorado e tamanhos de fonte adequados
 */
const CartaoItem = ({ cartao, onEdit, onArchive, onDelete }) => {
  return (
    <div className="cartao-item" style={{
      display: 'flex',
      alignItems: 'center',
      padding: '20px',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      background: 'white',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Ícone do Cartão */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '16px',
        fontSize: '20px',
        color: 'white',
        fontWeight: 'bold'
      }}>
        💳
      </div>
      
      {/* Informações do Cartão */}
      <div style={{ flex: 1 }}>
        {/* Nome e Bandeira */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: '#1f2937' 
          }}>
            {cartao.nome}
          </h3>
          <span style={{
            background: '#f3f4f6',
            color: '#6b7280',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>
            {cartao.bandeira}
          </span>
        </div>
        
        {/* Informações Principais - ✅ CORREÇÃO: Fontes mais legíveis */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          marginBottom: '8px'
        }}>
          {/* Limite */}
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280', 
              marginBottom: '2px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Limite
            </div>
            <div style={{ 
              fontSize: '0.95rem',  // ✅ Aumentado de 0.8rem
              fontWeight: '600', 
              color: '#059669',
              fontFamily: 'system-ui, -apple-system, sans-serif'  // ✅ Fonte mais legível
            }}>
              {formatCurrency(cartao.limite || 0)}
            </div>
          </div>
          
          {/* Fechamento */}
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280', 
              marginBottom: '2px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Fechamento
            </div>
            <div style={{ 
              fontSize: '0.95rem',  // ✅ Aumentado de 0.8rem
              fontWeight: '600', 
              color: '#374151',
              fontFamily: 'system-ui, -apple-system, sans-serif'  // ✅ Fonte mais legível
            }}>
              Dia {cartao.dia_fechamento || 1}
            </div>
          </div>
          
          {/* Vencimento */}
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280', 
              marginBottom: '2px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Vencimento
            </div>
            <div style={{ 
              fontSize: '0.95rem',  // ✅ Aumentado de 0.8rem
              fontWeight: '600', 
              color: '#374151',
              fontFamily: 'system-ui, -apple-system, sans-serif'  // ✅ Fonte mais legível
            }}>
              Dia {cartao.dia_vencimento || 10}
            </div>
          </div>
        </div>
        
        {/* Conta de Pagamento */}
        {cartao.conta_pagamento_nome && (
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>🏦</span>
            <span>Pago via: {cartao.conta_pagamento_nome}</span>
          </div>
        )}
      </div>
      
      {/* Ações */}
      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
        <button
          onClick={() => onEdit(cartao)}
          style={{
            background: 'none',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '36px',
            height: '36px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f0f9ff';
            e.target.style.borderColor = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.borderColor = '#e5e7eb';
          }}
          title="Editar cartão"
        >
          <Edit size={16} />
        </button>
        
        <button
          onClick={() => onArchive(cartao.id)}
          style={{
            background: 'none',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '36px',
            height: '36px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#fffbeb';
            e.target.style.borderColor = '#f59e0b';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.borderColor = '#e5e7eb';
          }}
          title="Arquivar cartão"
        >
          <Archive size={16} />
        </button>
        
        <button
          onClick={() => onDelete(cartao.id)}
          style={{
            background: 'none',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            width: '36px',
            height: '36px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#fef2f2';
            e.target.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.borderColor = '#e5e7eb';
          }}
          title="Excluir cartão"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

CartaoItem.propTypes = {
  cartao: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default CartaoItem;