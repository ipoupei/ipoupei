import React, { useEffect, useRef } from 'react';

/**
 * Componente Modal Wrapper com posicionamento fixo
 * Garantindo que o modal apareça acima de outros elementos sem gerar barra de rolagem horizontal
 */
const ModalWrapper = ({ isOpen, onClose, title, children }) => {
  // Referência para o modal
  const modalRef = useRef(null);

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    // Previne scroll do body quando o modal está aberto
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Fecha o modal ao clicar fora dele
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Se não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  return (
    <div 
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
      onClick={handleOutsideClick}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          width: '90%',
          maxWidth: '400px', // Tamanho controlado para evitar barra de rolagem horizontal
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden' // Impede que o conteúdo gere rolagem horizontal
        }}
      >
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #edf2f7'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1
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
            overflowX: 'hidden', // Impede rolagem horizontal
            flexGrow: 1,
            maxHeight: 'calc(90vh - 60px)' // 60px para o header
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;