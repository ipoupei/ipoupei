// src/components/ui/Modal.jsx
import React, { useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Componente Modal Base Otimizado
 * - Performance otimizada com useCallback
 * - Acessibilidade completa (ARIA)
 * - Controle de foco e escape
 * - Portal para renderização
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Gerenciar foco ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      // Salvar elemento focado antes do modal
      previousActiveElement.current = document.activeElement;
      
      // Focar no modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar foco anterior
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      
      // Restaurar scroll do body
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handler para tecla ESC
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  // Handler para clique no backdrop
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  }, [onClose, closeOnBackdrop]);

  // Trap focus dentro do modal
  const handleKeyDownTrap = useCallback((e) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, []);

  // Adicionar event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleKeyDownTrap);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleKeyDownTrap);
      };
    }
  }, [isOpen, handleKeyDown, handleKeyDownTrap]);

  // Tamanhos do modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        ref={modalRef}
        className={`modal-container ${sizeClasses[size]} ${className}`}
        tabIndex={-1}
        {...props}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {icon && <span className="modal-icon">{icon}</span>}
            {title}
          </h2>
          
          {showCloseButton && (
            <button
              onClick={onClose}
              className="modal-close"
              aria-label="Fechar modal"
              type="button"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={`modal-content ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );

  // Renderizar via portal
  return createPortal(modalContent, document.body);
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  className: PropTypes.string,
  contentClassName: PropTypes.string
};

export default Modal;