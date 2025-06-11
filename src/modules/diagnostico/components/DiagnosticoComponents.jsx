// src/modules/diagnostico/components/DiagnosticoComponents.jsx
import StepWrapper from './StepWrapper';
import OptionCard from './OptionCard';
import MoneyInput from './MoneyInput';

// Componentes adicionais que podem ser usados no diagnóstico
export const ResultadoVisual = ({ situacao }) => {
  const getStatusColor = (tipo) => {
    switch (tipo) {
      case 'critico': return '#ef4444';
      case 'atencao': return '#f59e0b';
      case 'bom': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '12px',
      backgroundColor: '#f9fafb',
      border: `2px solid ${getStatusColor(situacao.tipo)}20`,
      margin: '1rem 0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(situacao.tipo),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          {situacao.tipo === 'critico' ? '⚠️' : 
           situacao.tipo === 'atencao' ? '🤔' : '✅'}
        </div>
        <div>
          <h3 style={{ margin: 0, color: getStatusColor(situacao.tipo) }}>
            {situacao.mensagem}
          </h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            {situacao.alerta}
          </p>
        </div>
      </div>
      <p style={{ margin: 0, fontWeight: '500', color: '#374151' }}>
        {situacao.recomendacao}
      </p>
    </div>
  );
};

export const AlertBox = ({ tipo, titulo, children }) => {
  const getAlertStyles = (tipo) => {
    switch (tipo) {
      case 'critico':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          color: '#dc2626'
        };
      case 'atencao':
        return {
          backgroundColor: '#fffbeb',
          borderColor: '#f59e0b',
          color: '#d97706'
        };
      case 'bom':
        return {
          backgroundColor: '#ecfdf5',
          borderColor: '#10b981',
          color: '#047857'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          borderColor: '#6b7280',
          color: '#374151'
        };
    }
  };

  const styles = getAlertStyles(tipo);

  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '12px',
      border: `2px solid ${styles.borderColor}`,
      backgroundColor: styles.backgroundColor,
      margin: '1rem 0'
    }}>
      <h4 style={{ 
        margin: '0 0 1rem 0', 
        color: styles.color,
        fontSize: '1.1rem',
        fontWeight: '600'
      }}>
        {titulo}
      </h4>
      <div style={{ color: styles.color }}>
        {children}
      </div>
    </div>
  );
};

export { StepWrapper, OptionCard, MoneyInput };