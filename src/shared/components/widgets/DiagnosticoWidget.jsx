// src/shared/components/widgets/DiagnosticoWidget.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, TrendingUp } from 'lucide-react';
import useDiagnosticoEmocionalStore from '../../modules/diagnostico/store/diagnosticoEmocionalStore';

const DiagnosticoWidget = () => {
  const navigate = useNavigate();
  const { diagnosticoCompleto, calcularSituacaoFinanceira } = useDiagnosticoEmocionalStore();

  const handleIniciarDiagnostico = () => {
    navigate('/diagnostico');
  };

  const handleVerResultados = () => {
    navigate('/diagnostico/resumo');
  };

  const handleRefazerDiagnostico = () => {
    navigate('/diagnostico');
  };

  // Se o diagnóstico foi feito, mostra resumo
  if (diagnosticoCompleto) {
    const situacao = calcularSituacaoFinanceira();
    
    return (
      <div className="diagnostico-widget completo">
        <div className="widget-header">
          <div className="widget-icon">
            <TrendingUp size={24} color="#10b981" />
          </div>
          <h3 className="widget-title">Seu Diagnóstico</h3>
        </div>
        
        <div className="widget-content">
          <div className="diagnostico-resultado-resumo">
            <div className={`situacao-badge ${situacao.tipo}`}>
              {situacao.mensagem}
            </div>
            <p className="situacao-descricao">
              {situacao.alerta}
            </p>
          </div>
        </div>
        
        <div className="widget-actions">
          <button 
            onClick={handleVerResultados}
            className="btn-ver-resultados"
          >
            Ver Detalhes
            <ArrowRight size={16} />
          </button>
          <button 
            onClick={handleRefazerDiagnostico}
            className="btn-refazer"
          >
            Refazer Diagnóstico
          </button>
        </div>
      </div>
    );
  }

  // Se ainda não fez o diagnóstico, mostra CTA
  return (
    <div className="diagnostico-widget inicial">
      <div className="widget-header">
        <div className="widget-icon">
          <Zap size={24} color="#667eea" />
        </div>
        <h3 className="widget-title">Diagnóstico Financeiro</h3>
      </div>
      
      <div className="widget-content">
        <p className="widget-description">
          Descubra sua situação financeira em 3 minutos e receba um plano personalizado.
        </p>
        
        <div className="beneficios-mini">
          <div className="beneficio-mini">
            <span className="beneficio-icone">⚡</span>
            <span>Diagnóstico rápido</span>
          </div>
          <div className="beneficio-mini">
            <span className="beneficio-icone">🎯</span>
            <span>Plano personalizado</span>
          </div>
          <div className="beneficio-mini">
            <span className="beneficio-icone">📊</span>
            <span>Resultados em 30 dias</span>
          </div>
        </div>
      </div>
      
      <div className="widget-actions">
        <button 
          onClick={handleIniciarDiagnostico}
          className="btn-iniciar-diagnostico"
        >
          <Zap size={16} />
          Fazer Diagnóstico
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default DiagnosticoWidget;