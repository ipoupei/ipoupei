// src/modules/diagnostico/components/StepWrapper.jsx
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const StepWrapper = ({
  titulo,
  subtitulo,
  children,
  onVoltar,
  onContinuar,
  podeContinuar = true,
  textoBotao = "Continuar",
  etapaAtual = 1,
  totalEtapas = 8,
  showProgress = true
}) => {
  const progressPercentage = (etapaAtual / totalEtapas) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Progress Bar */}
        {showProgress && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#f3f4f6',
              borderRadius: '4px',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280', 
              fontWeight: '500' 
            }}>
              Etapa {etapaAtual} de {totalEtapas}
            </span>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            margin: '0 0 0.5rem 0', 
            color: '#1f2937' 
          }}>
            {titulo}
          </h1>
          {subtitulo && (
            <p style={{ 
              color: '#6b7280', 
              margin: 0, 
              fontSize: '1.1rem' 
            }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Content */}
        <div style={{ marginBottom: '2rem' }}>
          {children}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '2px solid #e5e7eb'
        }}>
          {onVoltar && (
            <button 
              onClick={onVoltar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: '2px solid #d1d5db',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e5e7eb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
          )}
          
          {onContinuar && (
            <button 
              onClick={onContinuar}
              disabled={!podeContinuar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2rem',
                background: podeContinuar 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                  : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: podeContinuar ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '1rem',
                boxShadow: podeContinuar 
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
                  : 'none',
                transition: 'all 0.2s ease',
                opacity: podeContinuar ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (podeContinuar) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (podeContinuar) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }
              }}
            >
              {textoBotao}
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepWrapper;