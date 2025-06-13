// src/modules/diagnostico/etapas/Step01_WelcomeDiagnostico.jsx
import React from 'react';
import { Zap, ArrowRight, Clock, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDiagnosticoEmocionalStore from '@modules/diagnostico/store/diagnosticoEmocionalStore';
import '@modules/diagnostico/styles/DiagnosticoEmocional.css';

const Step01_WelcomeDiagnostico = () => {
  const navigate = useNavigate();
  const { nextEtapa, resetarDiagnostico } = useDiagnosticoEmocionalStore();



  
  const handleComecar = () => {
    // Reset para garantir estado limpo
    resetarDiagnostico();
    // Avançar para próxima etapa
    nextEtapa();
    navigate('/susto-consciente/renda');
  };

  const etapasPreview = [
    { numero: 1, titulo: 'Renda e situação', tempo: '30s' },
    { numero: 2, titulo: 'Gastos principais', tempo: '45s' },
    { numero: 3, titulo: 'Dívidas e vilões', tempo: '45s' },
    { numero: 4, titulo: 'Saldos atuais', tempo: '30s' },
    { numero: 5, titulo: 'Seu diagnóstico', tempo: '30s' }
  ];

  return (
    <div className="diagnostico-emocional-wrapper">
      <div className="diagnostico-emocional-container">
        <div className="welcome-diagnostico">
          <div className="welcome-header">
            <div className="welcome-icon">
              <Zap size={64} color="#ef4444" />
            </div>
            
            <h1 className="welcome-title">
              Descobrir sua <span className="destaque">Situação Financeira</span>
            </h1>
            
            <p className="welcome-subtitle">
              Em 3 minutos você vai saber exatamente onde está e para onde ir
            </p>
          </div>
          
          <div className="welcome-content">
            <p className="welcome-description">
              Vamos fazer algumas perguntas rápidas sobre sua vida financeira. 
              No final, você vai receber um <strong>diagnóstico personalizado</strong> e um 
              <strong> plano para transformar</strong> sua relação com o dinheiro.
            </p>
            
            <div className="benefits-preview">
              <div className="benefit-item">
                <Clock size={20} color="#10b981" />
                <span className="benefit-text">Diagnóstico em 3 minutos</span>
              </div>
              <div className="benefit-item">
                <Target size={20} color="#10b981" />
                <span className="benefit-text">Plano 100% personalizado</span>
              </div>
              <div className="benefit-item">
                <TrendingUp size={20} color="#10b981" />
                <span className="benefit-text">Resultados visíveis em 30 dias</span>
              </div>
            </div>

            <div className="etapas-preview">
              <h4 className="etapas-title">O que vamos descobrir:</h4>
              <div className="etapas-list">
                {etapasPreview.map((etapa) => (
                  <div key={etapa.numero} className="etapa-item">
                    <span className="etapa-numero">{etapa.numero}</span>
                    <span className="etapa-titulo">{etapa.titulo}</span>
                    <span className="etapa-tempo">{etapa.tempo}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleComecar}
              className="btn-comecar"
            >
              <Zap size={24} />
              Começar meu Diagnóstico
              <ArrowRight size={24} />
            </button>
            
            <div className="privacy-assurance">
              <p className="privacy-note">
                🔒 <strong>Privacidade garantida:</strong> Seus dados são criptografados e nunca compartilhados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step01_WelcomeDiagnostico;