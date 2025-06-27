// src/Components/ImportacaoModal.jsx
import React, { useState } from 'react';

const ImportacaoModal = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);

  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return; // Não permite fechar enquanto carrega
    onClose();
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      // Aqui você pode adicionar a lógica de importação no futuro
      console.log('Importação iniciada...');
      
      // Simular um delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Chamar onSave para atualizar a lista de transações
      if (onSave) {
        await onSave();
      }
      
      // Fechar o modal
      onClose();
    } catch (error) {
      console.error('Erro na importação:', error);
      alert('Erro ao importar transações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="forms-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon-container modal-icon-primary">
              📥
            </div>
            <div>
              <h2 className="modal-title">Importar Transações</h2>
              <p className="modal-subtitle">
                Funcionalidade em desenvolvimento
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="modal-close"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚧</div>
            <h3 style={{ marginBottom: '8px', color: '#374151' }}>
              Funcionalidade em Desenvolvimento
            </h3>
            <p style={{ marginBottom: '24px' }}>
              A funcionalidade de importação de transações estará disponível em breve.
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              Você poderá importar transações a partir de arquivos CSV, OFX e outros formatos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-right">
            <button 
              onClick={handleClose} 
              className="btn-cancel"
              disabled={loading}
            >
              Fechar
            </button>
            <button 
              onClick={handleImport} 
              className="btn-primary"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Processando...' : '📥 Importar (Em breve)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportacaoModal;
