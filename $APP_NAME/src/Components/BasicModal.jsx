import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Componente de modal básico melhorado
 * Agora com suporte para fechar com ESC ou clicando fora
 */
const BasicModal = ({ isOpen, onClose, title, children }) => {
  // Efeito para controlar o evento de ESC e o scroll do body
  React.useEffect(() => {
    // Handler para tecla ESC
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    // Handler para click fora do modal
    const handleOutsideClick = (e) => {
      // Se o evento é no overlay (background), fecha o modal
      if (e.target.classList.contains('modal-overlay') && isOpen) {
        onClose();
      }
    };

    // Adiciona event listeners quando o modal está aberto
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'hidden'; // Impede scroll do body
    }

    // Cleanup: remove listeners e restaura scroll quando o modal fecha
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = ''; // Restaura scroll
    };
  }, [isOpen, onClose]);

  // Se não estiver aberto, não renderiza nada
  if (!isOpen) return null;
  
  // Renderiza o modal via portal (para evitar problemas de z-index)
  return createPortal(
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        className="modal-container"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          width: '90%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          margin: '0 10px',
          animation: 'modalFadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()} // Impede propagação para o overlay
      >
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #edf2f7',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1
          }}
        >
          <h2 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: 600,
            color: '#1f2937'
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div 
          style={{ 
            padding: '16px',
            overflowY: 'auto',
            overflowX: 'hidden',
            flexGrow: 1,
            maxHeight: 'calc(90vh - 60px)'
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BasicModal;