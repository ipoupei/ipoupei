// src/modules/diagnostico/onboarding/etapa00_IntroPercepcao.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

// Hooks que você criou
import { usePercepcaoFinanceira } from '@modules/diagnostico/hooks/usePercepcaoFinanceira';
import useDiagnosticoPercepcaoStore from '@modules/diagnostico/store/diagnosticoPercepcaoStore';


// CSS original
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const IntroPercepcaoEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 0, 
  totalEtapas = 11,
  dadosExistentes = null 
}) => {
  // Usar o store que você criou
  const { 
    percepcao, 
    setPercepcao, 
    salvarPercepcaoAsync, 
    carregarPercepcaoAsync,
    isPercepcaoCompleta 
  } = useDiagnosticoPercepcaoStore();

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const percepcaoCompleta = isPercepcaoCompleta();

  // Carregar dados existentes quando o componente monta
  useEffect(() => {
    carregarPercepcaoAsync();
  }, [carregarPercepcaoAsync]);

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true);
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
  }, []);

  const handleSelecionarResposta = useCallback((pergunta, resposta) => {
    setPercepcao({ [pergunta]: resposta });
  }, [setPercepcao]);

  const handleSalvar = useCallback(async () => {
    if (!percepcaoCompleta) return;

    setSalvando(true);
    try {
      await salvarPercepcaoAsync();
      handleFecharModal();
      console.log('✅ Dados salvos com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }, [percepcaoCompleta, salvarPercepcaoAsync]);

  const handleContinuar = useCallback(async () => {
    if (!percepcaoCompleta) {
      setModalAberto(true);
      return;
    }

    // Se os dados não estão salvos, salvar primeiro
    if (modalAberto) {
      await handleSalvar();
      return;
    }

    // Continuar para próxima etapa
    onContinuar(percepcao);
  }, [percepcaoCompleta, modalAberto, handleSalvar, onContinuar, percepcao]);

  const perguntas = [
    {
      id: 'controleFinanceiro',
      pergunta: 'Como você avalia seu controle financeiro atual?',
      opcoes: [
        { valor: 'nenhum', label: '😰 Não tenho controle nenhum' },
        { valor: 'pouco', label: '😐 Tenho pouco controle' },
        { valor: 'parcial', label: '🙂 Tenho controle parcial' },
        { valor: 'total', label: '😎 Tenho controle total' }
      ]
    },
    {
      id: 'disciplinaGastos',
      pergunta: 'Com que frequência você controla seus gastos?',
      opcoes: [
        { valor: 'nunca', label: '🤷‍♂️ Nunca controlo' },
        { valor: 'raramente', label: '😅 Raramente' },
        { valor: 'as-vezes', label: '🤔 Às vezes' },
        { valor: 'sempre', label: '💪 Sempre controlo' }
      ]
    },
    {
      id: 'planejamentoFuturo',
      pergunta: 'Você planeja seu futuro financeiro?',
      opcoes: [
        { valor: 'nao', label: '😟 Não penso nisso' },
        { valor: 'pensando', label: '🤯 Estou pensando em começar' },
        { valor: 'sim-basico', label: '📝 Sim, tenho planos básicos' },
        { valor: 'sim-planos', label: '🎯 Sim, tenho planos detalhados' }
      ]
    },
    {
      id: 'sentimentoGeral',
      pergunta: 'Como você se sente em relação ao dinheiro?',
      opcoes: [
        { valor: 'ansioso', label: '😰 Ansioso e preocupado' },
        { valor: 'confuso', label: '😵 Confuso, não sei o que fazer' },
        { valor: 'esperancoso', label: '😊 Esperançoso, quero melhorar' },
        { valor: 'confiante', label: '😎 Confiante no meu futuro' }
      ]
    }
  ];

  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: true, completa: percepcaoCompleta },
    { numero: 2, nome: 'Categorias', ativa: false, completa: false },
    { numero: 3, nome: 'Contas', ativa: false, completa: false },
    { numero: 4, nome: 'Cartões', ativa: false, completa: false },
    { numero: 5, nome: 'Desp.Cartão', ativa: false, completa: false },
    { numero: 6, nome: 'Receitas', ativa: false, completa: false },
    { numero: 7, nome: 'Desp.Fixas', ativa: false, completa: false },
    { numero: 8, nome: 'Desp.Variáveis', ativa: false, completa: false },
    { numero: 9, nome: 'Resumo', ativa: false, completa: false },
    { numero: 10, nome: 'Metas', ativa: false, completa: false },
    { numero: 11, nome: 'Fim', ativa: false, completa: false }
  ];

  return (
    <div className="diagnostico-container">
      
      {/* Header Compacto */}
      <div className="diagnostico-header">
        <div className="header-row">
          <div className="header-title">Diagnóstico Financeiro</div>
          <div className="header-progress">
            Etapa {etapaAtual + 1} de {totalEtapas} • {progressoPercentual}%
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressoPercentual}%` }}
          />
        </div>

        <div className="steps-row">
          {etapas.map((etapa) => (
            <div 
              key={etapa.numero}
              className={`step ${etapa.ativa ? 'active' : ''} ${etapa.completa ? 'completed' : ''}`}
            >
              <div className="step-circle">
                {etapa.completa ? '✓' : etapa.numero}
              </div>
              <div className="step-label">{etapa.nome}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Layout Principal - Vídeo à Esquerda, Conteúdo à Direita */}
      <div className="diagnostico-main-with-video">
        
        {/* Vídeo à Esquerda */}
        <div className="diagnostico-video-left">
          <div className="video-container">
            <div className="video-header">
              <h3 className="video-title">🎬 Introdução ao diagnóstico</h3>
              <p className="video-subtitle">Conheça o processo em 4 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Introdução: Como funciona o diagnóstico financeiro"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">🔍</span>
                <span className="benefit-text">Análise personalizada</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📈</span>
                <span className="benefit-text">Estratégias práticas</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span className="benefit-text">Metas alcançáveis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">🎯</div>
          <h1 className="main-title">Bem-vindo ao seu diagnóstico financeiro!</h1>
          <p className="main-subtitle">Vamos entender sua situação atual para criar um plano personalizado</p>
          <p className="main-description">
            Primeiro, queremos conhecer como você se relaciona com o dinheiro hoje. 
            Não existem respostas certas ou erradas - seja honesto conosco!
          </p>

          {/* Status Card */}
          <div className={`status-card ${percepcaoCompleta ? 'completed' : 'pending'}`}>
            <div className="status-icon">
              {percepcaoCompleta ? '✅' : '📝'}
            </div>
            <div className="status-info">
              <h3>
                {percepcaoCompleta ? 'Questionário Respondido' : 'Questionário de Percepção'}
              </h3>
              <p>
                {percepcaoCompleta 
                  ? 'Todas as 4 perguntas foram respondidas'
                  : '4 perguntas rápidas sobre sua relação com o dinheiro'
                }
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="action-buttons">
            <button
              onClick={handleAbrirModal}
              className="btn-primary"
            >
              <span>📝</span>
              {percepcaoCompleta ? 'Revisar' : 'Responder'}
            </button>
          </div>

          {/* Grid de Informações */}
          <div className="info-grid">
            <div className="info-item success">
              <div className="info-icon">📊</div>
              <div className="info-title">Análise Completa</div>
              <div className="info-text">Situação detalhada</div>
            </div>

            <div className="info-item info">
              <div className="info-icon">🎯</div>
              <div className="info-title">Plano Personalizado</div>
              <div className="info-text">Estratégias específicas</div>
            </div>

            <div className="info-item warning">
              <div className="info-icon">🚀</div>
              <div className="info-title">Resultados Reais</div>
              <div className="info-text">Ferramentas práticas</div>
            </div>

            <div className="info-item info">
              <div className="info-icon">⏱️</div>
              <div className="info-title">10-15 min</div>
              <div className="info-text">Dados reais</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação Inferior */}
      <div className="navigation">
        <div className="nav-left">
          {/* Primeira etapa, sem botão voltar */}
        </div>
        
        <div className="nav-right">
          <button
            onClick={handleContinuar}
            disabled={!percepcaoCompleta || salvando}
            className="btn-continue"
          >
            {salvando ? 'Salvando...' : 'Continuar'}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="modal-overlay" onClick={handleFecharModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h2 className="modal-title">Como você se vê financeiramente?</h2>
              <p className="modal-subtitle">4 perguntas para um diagnóstico preciso</p>
              <button 
                className="modal-close"
                onClick={handleFecharModal}
                aria-label="Fechar modal"
              >
                <X size={12} />
              </button>
            </div>
            
            <div className="modal-content">
              {perguntas.map((pergunta, index) => (
                <div key={pergunta.id} className="question-group">
                  <label className="question-label">
                    {index + 1}. {pergunta.pergunta}
                  </label>
                  <div className="options-grid">
                    {pergunta.opcoes.map((opcao) => (
                      <button
                        key={opcao.valor}
                        type="button"
                        className={`option ${
                          percepcao[pergunta.id] === opcao.valor ? 'selected' : ''
                        }`}
                        onClick={() => handleSelecionarResposta(pergunta.id, opcao.valor)}
                      >
                        <span className="option-text">{opcao.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="navigation">
              <div className="nav-left">
                <button 
                  onClick={handleFecharModal}
                  className="btn-back"
                >
                  <ArrowLeft size={12} />
                  Cancelar
                </button>
              </div>
              
              <div className="nav-right">
                <button 
                  onClick={handleSalvar}
                  disabled={!percepcaoCompleta || salvando}
                  className="btn-continue"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                  <CheckCircle size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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