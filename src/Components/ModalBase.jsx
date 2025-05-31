
import React from 'react';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';
import './ModalBase.css';

const ModalBase = ({ isOpen, onClose, icon, title, children, footer, feedback }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            {icon}
            <span>{title}</span>
          </h2>
          <button className="btn-fechar" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {feedback?.visible && (
          <div className={`feedback-message ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <div className="modal-content">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

ModalBase.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  feedback: PropTypes.shape({
    visible: PropTypes.bool,
    message: PropTypes.string,
    type: PropTypes.oneOf(['success', 'error'])
  })
};

export default ModalBase;
