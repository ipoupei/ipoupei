// src/modules/diagnostico/onboarding/etapa00_IntroPercepcao.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DiagnosticoEtapaLayout from '@modules/diagnostico/styles/DiagnosticoEtapaLayout';
import Button from '@shared/components/ui/Button';

const IntroPercepcaoEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 0, 
  totalEtapas = 11,
  dadosExistentes = null 
}) => {
  const [dadosPercepcao, setDadosPercepcao] = useState({
    controleFinanceiro: '',
    disciplinaGastos: '',
    planejamentoFuturo: '',
    sentimentoGeral: ''
  });
  
  const [modalAberto, setModalAberto] = useState(false);

  // Verifica se todos os campos foram preenchidos
  const percepcaoCompleta = Object.values(dadosPercepcao).every(valor => valor !== '');

  const handleAbrirModal = () => {
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleSelecionarResposta = (pergunta, resposta) => {
    setDadosPercepcao(prev => ({
      ...prev,
      [pergunta]: resposta
    }));
  };

  const handleContinuar = () => {
    if (percepcaoCompleta) {
      // Salvar dados da percepção
      onContinuar(dadosPercepcao);
    }
  };

  const perguntas = [
    {
      id: 'controleFinanceiro',
      pergunta: 'Como você avalia seu controle financeiro atual?',
      opcoes: [
        { valor: 'nenhum', label: '😰 Não tenho controle nenhum', cor: '#ef4444' },
        { valor: 'pouco', label: '😐 Tenho pouco controle', cor: '#f97316' },
        { valor: 'parcial', label: '🙂 Tenho controle parcial', cor: '#eab308' },
        { valor: 'total', label: '😎 Tenho controle total', cor: '#22c55e' }
      ]
    },
    {
      id: 'disciplinaGastos',
      pergunta: 'Com que frequência você controla seus gastos?',
      opcoes: [
        { valor: 'nunca', label: '🤷‍♂️ Nunca controlo', cor: '#ef4444' },
        { valor: 'raramente', label: '😅 Raramente', cor: '#f97316' },
        { valor: 'as-vezes', label: '🤔 Às vezes', cor: '#eab308' },
        { valor: 'sempre', label: '💪 Sempre controlo', cor: '#22c55e' }
      ]
    },
    {
      id: 'planejamentoFuturo',
      pergunta: 'Você planeja seu futuro financeiro?',
      opcoes: [
        { valor: 'nao', label: '😟 Não penso nisso', cor: '#ef4444' },
        { valor: 'pensando', label: '🤯 Estou pensando em começar', cor: '#f97316' },
        { valor: 'sim-basico', label: '📝 Sim, tenho planos básicos', cor: '#eab308' },
        { valor: 'sim-planos', label: '🎯 Sim, tenho planos detalhados', cor: '#22c55e' }
      ]
    },
    {
      id: 'sentimentoGeral',
      pergunta: 'Como você se sente em relação ao dinheiro?',
      opcoes: [
        { valor: 'ansioso', label: '😰 Ansioso e preocupado', cor: '#ef4444' },
        { valor: 'confuso', label: '😵 Confuso, não sei o que fazer', cor: '#f97316' },
        { valor: 'esperancoso', label: '😊 Esperançoso, quero melhorar', cor: '#eab308' },
        { valor: 'confiante', label: '😎 Confiante no meu futuro', cor: '#22c55e' }
      ]
    }
  ];

  // Modal de percepção personalizado
  const ModalPercepcao = () => (
    modalAberto && (
      <div className="modal-overlay" onClick={handleFecharModal}>
        <div className="modal-container percepcao-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Como você se vê financeiramente?</h2>
            <p>Responda com sinceridade para um diagnóstico mais preciso</p>
            <button 
              className="modal-close"
              onClick={handleFecharModal}
            >
              ✕
            </button>
          </div>
          
          <div className="modal-content">
            {perguntas.map((pergunta) => (
              <div key={pergunta.id} className="pergunta-grupo">
                <h3>{pergunta.pergunta}</h3>
                <div className="opcoes-grid">
                  {pergunta.opcoes.map((opcao) => (
                    <button
                      key={opcao.valor}
                      className={`opcao-btn ${
                        dadosPercepcao[pergunta.id] === opcao.valor ? 'selecionada' : ''
                      }`}
                      onClick={() => handleSelecionarResposta(pergunta.id, opcao.valor)}
                      style={{ 
                        borderColor: dadosPercepcao[pergunta.id] === opcao.valor ? opcao.cor : '#e5e7eb' 
                      }}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="modal-footer">
            <Button 
              onClick={handleFecharModal}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                handleFecharModal();
                if (percepcaoCompleta) handleContinuar();
              }}
              disabled={!percepcaoCompleta}
              variant="primary"
            >
              Salvar Respostas
            </Button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <>
      <DiagnosticoEtapaLayout
        icone="🎯"
        titulo="Bem-vindo ao seu diagnóstico financeiro!"
        subtitulo="Vamos entender sua situação atual para criar um plano personalizado"
        descricao="Primeiro, queremos conhecer como você se relaciona com o dinheiro hoje. Não existem respostas certas ou erradas - seja honesto conosco!"
        temDados={percepcaoCompleta}
        labelBotaoPrincipal="Responder Questionário"
        onAbrirModal={handleAbrirModal}
        onVoltar={onVoltar}
        onContinuar={handleContinuar}
        podeVoltar={false}
        podeContinuar={percepcaoCompleta}
        etapaAtual={etapaAtual}
        totalEtapas={totalEtapas}
        dadosExistentes={
          percepcaoCompleta 
            ? "Questionário de percepção respondido completamente" 
            : null
        }
        dicas={[
          "Seja honesto em suas respostas - isso nos ajuda a criar um plano mais eficaz",
          "Não se preocupe se suas respostas não são 'perfeitas' - estamos aqui para melhorar juntos",
          "Leva apenas 2 minutos para responder todas as perguntas"
        ]}
        className="primeira-etapa"
      >
        {/* Conteúdo adicional da etapa */}
        <div className="intro-cards">
          <div className="intro-card">
            <div className="card-icone">📊</div>
            <h3>Análise Completa</h3>
            <p>Vamos analisar sua situação financeira atual de forma detalhada</p>
          </div>
          
          <div className="intro-card">
            <div className="card-icone">🎯</div>
            <h3>Plano Personalizado</h3>
            <p>Você receberá um plano específico para sua situação e objetivos</p>
          </div>
          
          <div className="intro-card">
            <div className="card-icone">🚀</div>
            <h3>Resultados Reais</h3>
            <p>Ferramentas práticas para transformar sua vida financeira</p>
          </div>
        </div>

        <div className="tempo-estimado">
          <p><strong>⏱️ Tempo estimado:</strong> 10-15 minutos</p>
          <p><strong>💡 Processo:</strong> Cada etapa cadastra seus dados reais no aplicativo</p>
        </div>
      </DiagnosticoEtapaLayout>

      <ModalPercepcao />

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .percepcao-modal {
          background: white;
          border-radius: 24px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          text-align: center;
          position: relative;
        }

        .modal-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .modal-header p {
          margin: 0;
          opacity: 0.9;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          padding: 2rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .pergunta-grupo {
          margin-bottom: 2rem;
        }

        .pergunta-grupo h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .opcoes-grid {
          display: grid;
          gap: 0.75rem;
        }

        .opcao-btn {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: left;
        }

        .opcao-btn:hover {
          border-color: #667eea;
          background: #f8fafc;
        }

        .opcao-btn.selecionada {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .intro-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .intro-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .intro-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .card-icone {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .intro-card h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #374151;
        }

        .intro-card p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .tempo-estimado {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          margin: 2rem 0;
        }

        .tempo-estimado p {
          margin: 0.5rem 0;
          color: #0369a1;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .percepcao-modal {
            margin: 1rem;
            border-radius: 16px;
          }

          .modal-header {
            padding: 1.5rem;
          }

          .modal-content {
            padding: 1.5rem;
          }

          .intro-cards {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .intro-card {
            padding: 1.25rem;
          }
        }
      `}</style>
    </>
  );
};

IntroPercepcaoEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object
};

export default IntroPercepcaoEtapa;