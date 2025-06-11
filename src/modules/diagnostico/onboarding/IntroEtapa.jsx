// src/modules/diagnostico/etapas/IntroEtapa.jsx
import { useDiagnosticoFlowStore } from '../store/diagnosticoFlowStore';
import Button from '../../../shared/components/ui/Button';

const IntroEtapa = () => {
  const { proximaEtapa, getEtapaAtual } = useDiagnosticoFlowStore();
  const etapa = getEtapaAtual();

  return (
    <div className="etapa-container intro-etapa">
      <div className="etapa-header">
        <div className="etapa-icone-grande">{etapa.icone}</div>
        <h1>{etapa.titulo}</h1>
        <p className="etapa-subtitulo">{etapa.subtitulo}</p>
      </div>

      <div className="intro-content">
        <div className="intro-cards">
          <div className="intro-card">
            <div className="card-icone">📊</div>
            <h3>Análise Completa</h3>
            <p>Vamos analisar sua situação financeira atual de forma detalhada</p>
          </div>
          
          <div className="intro-card">
            <div className="card-icone">🎯</div>
            <h3>Score Personalizado</h3>
            <p>Você receberá um score e saberá exatamente onde está na jornada</p>
          </div>
          
          <div className="intro-card">
            <div className="card-icone">🚀</div>
            <h3>Plano de Ação</h3>
            <p>Receberá um plano personalizado para melhorar sua vida financeira</p>
          </div>
        </div>

        <div className="intro-tempo">
          <p><strong>⏱️ Tempo estimado:</strong> 5-10 minutos</p>
          <p><strong>💡 Dica:</strong> Durante o processo, vamos cadastrar seus dados reais no app!</p>
        </div>
      </div>

      <div className="etapa-footer">
        <Button onClick={proximaEtapa} variant="primary" size="large">
          Começar Diagnóstico
        </Button>
      </div>
    </div>
  );
};

export default IntroEtapa;