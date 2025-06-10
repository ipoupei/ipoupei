// src/modules/diagnostico/components/DiagnosticoModal.jsx
import { useNavigate } from 'react-router-dom';
import Modal from '../../../shared/components/ui/Modal';
import Button from '../../../shared/components/ui/Button';

const DiagnosticoModal = ({ isOpen, onClose, diagnosticoAnterior = null }) => {
  const navigate = useNavigate();

  const handleRefazerDiagnostico = () => {
    onClose();
    navigate('/diagnostico');
  };

  const handleVerResultados = () => {
    onClose();
    // Navegar para página de resultados ou abrir modal com resultados
    navigate('/diagnostico/resultados');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💡 Diagnóstico Financeiro">
      <div className="diagnostico-modal-content">
        {diagnosticoAnterior ? (
          <div className="diagnostico-existente">
            <div className="resultado-anterior">
              <h3>🎯 Seu último diagnóstico:</h3>
              <div className="score-resumo">
                <span className="score">{diagnosticoAnterior.score} pontos</span>
                <span className="etapa">Etapa: {diagnosticoAnterior.etapaJornada?.nome}</span>
              </div>
              <p className="data">
                Feito em: {new Date(diagnosticoAnterior.dataCompleta).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="opcoes">
              <Button onClick={handleVerResultados} variant="secondary" fullWidth>
                Ver Resultados Completos
              </Button>
              <Button onClick={handleRefazerDiagnostico} variant="primary" fullWidth>
                Refazer Diagnóstico
              </Button>
            </div>
          </div>
        ) : (
          <div className="primeiro-diagnostico">
            <div className="intro">
              <h3>🚀 Descubra sua situação financeira atual!</h3>
              <p>Em apenas 5-10 minutos, você vai:</p>
              <ul>
                <li>📊 Descobrir seu score financeiro</li>
                <li>🎯 Saber em que etapa da jornada está</li>
                <li>📋 Receber um plano personalizado</li>
                <li>💡 Configurar o app com seus dados reais</li>
              </ul>
            </div>

            <div className="cta">
              <Button onClick={handleRefazerDiagnostico} variant="primary" size="large" fullWidth>
                Começar Diagnóstico
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export { DiagnosticoModal };