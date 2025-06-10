// src/modules/diagnostico/etapas/ProcessamentoEtapa.jsx
import { useEffect, useState } from 'react';
import { useDiagnosticoFlowStore } from '../store/diagnosticoFlowStore';

const ProcessamentoEtapa = () => {
  const { processarResultados, proximaEtapa, getEtapaAtual } = useDiagnosticoFlowStore();
  const etapa = getEtapaAtual();
  
  const [etapaProcessamento, setEtapaProcessamento] = useState(0);
  const [mensagemAtual, setMensagemAtual] = useState('');

  const etapasProcessamento = [
    { titulo: 'Analisando suas contas...', tempo: 1000 },
    { titulo: 'Calculando receitas e gastos...', tempo: 1500 },
    { titulo: 'Avaliando sua disciplina financeira...', tempo: 1200 },
    { titulo: 'Analisando situação de dívidas...', tempo: 1000 },
    { titulo: 'Calculando seu score...', tempo: 2000 },
    { titulo: 'Determinando sua posição na jornada...', tempo: 1500 },
    { titulo: 'Gerando seu plano personalizado...', tempo: 2000 }
  ];

  useEffect(() => {
    const processarEtapas = async () => {
      for (let i = 0; i < etapasProcessamento.length; i++) {
        setEtapaProcessamento(i);
        setMensagemAtual(etapasProcessamento[i].titulo);
        
        // Simular processamento
        await new Promise(resolve => setTimeout(resolve, etapasProcessamento[i].tempo));
      }
      
      // Processar resultados reais
      try {
        await processarResultados();
        proximaEtapa();
      } catch (error) {
        console.error('Erro no processamento:', error);
        // Aqui você pode mostrar uma mensagem de erro
      }
    };

    processarEtapas();
  }, [processarResultados, proximaEtapa]);

  const progressoAtual = ((etapaProcessamento + 1) / etapasProcessamento.length) * 100;

  return (
    <div className="etapa-container processamento-etapa">
      <div className="etapa-header">
        <div className="etapa-icone-grande">{etapa.icone}</div>
        <h1>{etapa.titulo}</h1>
        <p className="etapa-subtitulo">{etapa.subtitulo}</p>
      </div>

      <div className="processamento-content">
        <div className="processamento-visual">
          <div className="spinner-container">
            <div className="spinner-diagnostico"></div>
          </div>
          
          <div className="progress-processamento">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressoAtual}%` }}
              ></div>
            </div>
            <p className="progress-text">{Math.round(progressoAtual)}%</p>
          </div>

          <div className="mensagem-processamento">
            <h3>{mensagemAtual}</h3>
          </div>

          <div className="etapas-lista">
            {etapasProcessamento.map((etapaProc, index) => (
              <div 
                key={index}
                className={`etapa-processamento-item ${
                  index < etapaProcessamento ? 'completa' : 
                  index === etapaProcessamento ? 'ativa' : 'pendente'
                }`}
              >
                <div className="etapa-indicador">
                  {index < etapaProcessamento ? '✅' : 
                   index === etapaProcessamento ? '⚡' : '⏳'}
                </div>
                <span>{etapaProc.titulo}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dica-processamento">
          <p>💡 <strong>Enquanto processamos seus dados...</strong></p>
          <p>Sabia que pessoas que fazem controle financeiro conseguem economizar em média 20% mais por mês?</p>
        </div>
      </div>
    </div>
  );
};

export default ProcessamentoEtapa;