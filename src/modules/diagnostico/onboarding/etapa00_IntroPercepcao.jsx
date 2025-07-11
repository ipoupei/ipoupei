// src/modules/diagnostico/onboarding/etapa00_IntroPercepcao.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, ArrowRight, ArrowLeft, CheckCircle, Calculator, Clock, DollarSign } from 'lucide-react';

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
  // ➕ NOVO: Estado para controlar qual etapa do modal está ativa
  const [etapaModal, setEtapaModal] = useState(1); // 1: Percepção, 2: Renda e Horas

  const percepcaoCompleta = isPercepcaoCompleta();

  // ➕ NOVO: Verificar se apenas as perguntas de percepção estão completas
  const percepcaoBasicaCompleta = ['controleFinanceiro', 'disciplinaGastos', 'planejamentoFuturo', 'sentimentoGeral']
    .every(campo => percepcao[campo] && percepcao[campo] !== '');

  // ➕ NOVO: Verificar se dados de renda estão completos
  const rendaCompleta = ['rendaMensal', 'horasTrabalhadasMes', 'tipoRenda']
    .every(campo => percepcao[campo] && percepcao[campo] !== '');

  // ➕ NOVO: Calcular valor da hora trabalhada
  const valorHora = percepcao.rendaMensal && percepcao.horasTrabalhadasMes ? 
    (parseFloat(percepcao.rendaMensal.replace(/[^\d,]/g, '').replace(',', '.')) / parseInt(percepcao.horasTrabalhadasMes)).toFixed(2) : 0;

  // Carregar dados existentes quando o componente monta
  useEffect(() => {
    carregarPercepcaoAsync();
  }, [carregarPercepcaoAsync]);

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true);
    setEtapaModal(1); // Sempre começar na primeira etapa
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
    setEtapaModal(1); // Reset para primeira etapa
  }, []);

  const handleSelecionarResposta = useCallback((pergunta, resposta) => {
    setPercepcao({ [pergunta]: resposta });
  }, [setPercepcao]);

  // ➕ NOVO: Função para formatar moeda
  const formatarMoeda = (valor) => {
    const numero = valor.replace(/\D/g, '');
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero / 100);
  };

  // ➕ NOVO: Handler para mudança na renda
  const handleRendaChange = (e) => {
    const valor = e.target.value;
    setPercepcao({ rendaMensal: formatarMoeda(valor) });
  };

  // ➕ NOVO: Navegação entre etapas do modal
  const handleProximaEtapaModal = useCallback(() => {
    if (etapaModal === 1 && percepcaoBasicaCompleta) {
      setEtapaModal(2);
    }
  }, [etapaModal, percepcaoBasicaCompleta]);

  const handleVoltarEtapaModal = useCallback(() => {
    if (etapaModal === 2) {
      setEtapaModal(1);
    }
  }, [etapaModal]);

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
              <p className="video-subtitle">Conheça o processo em 3 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/GBKcmAFiUf8"

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
            {/* ➕ ALTERADO: Texto atualizado */}
            Primeiro, queremos conhecer como você se relaciona com o dinheiro e sua situação de renda. 
            Seja honesto conosco para um diagnóstico mais preciso!
          </p>

          {/* ➕ ALTERADO: Status Cards Grid (ao invés de card único) */}
          <div className="status-cards-grid">
            <div className={`status-card ${percepcaoBasicaCompleta ? 'completed' : 'pending'}`}>
              <div className="status-icon">
                {percepcaoBasicaCompleta ? '✅' : '📝'}
              </div>
              <div className="status-info">
                <h3>Percepção Financeira</h3>
                <p>4 perguntas sobre sua relação com o dinheiro</p>
              </div>
            </div>

            <div className={`status-card ${rendaCompleta ? 'completed' : 'pending'}`}>
              <div className="status-icon">
                {rendaCompleta ? '✅' : '💰'}
              </div>
              <div className="status-info">
                <h3>Renda e Trabalho</h3>
                <p>Informações sobre sua renda e horas trabalhadas</p>
                {/* ➕ NOVO: Preview do valor da hora */}
                {valorHora > 0 && (
                  <div className="valor-hora-preview">
                    <Calculator size={14} />
                    <span>R$ {valorHora}/hora</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="action-buttons">
            <button
              onClick={handleAbrirModal}
              className="btn-primary"
            >
              <span>📝</span>
              {/* ➕ ALTERADO: Texto do botão */}
              {percepcaoCompleta ? 'Revisar' : 'Responder'} Questionário
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

      {/* ➕ MODAL COMPLETAMENTE NOVO com Múltiplas Etapas */}
      {modalAberto && (
        <div className="modal-overlay" onClick={handleFecharModal}>
          <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              {/* ➕ NOVO: Indicadores de progresso do modal */}
              <div className="modal-progress">
                <div className="modal-step-indicators">
                  <div className={`step-indicator ${etapaModal >= 1 ? 'active' : ''} ${percepcaoBasicaCompleta ? 'completed' : ''}`}>
                    <span>{percepcaoBasicaCompleta ? '✓' : '1'}</span>
                    <span>Percepção</span>
                  </div>
                  <div className="step-connector"></div>
                  <div className={`step-indicator ${etapaModal >= 2 ? 'active' : ''} ${rendaCompleta ? 'completed' : ''}`}>
                    <span>{rendaCompleta ? '✓' : '2'}</span>
                    <span>Renda</span>
                  </div>
                </div>
              </div>

              <h2 className="modal-title">
                {etapaModal === 1 ? 'Como você se vê financeiramente?' : 'Qual sua renda e carga horária?'}
              </h2>
              <p className="modal-subtitle">
                {etapaModal === 1 
                  ? '4 perguntas para um diagnóstico preciso'
                  : 'Vamos calcular o valor da sua hora trabalhada'
                }
              </p>
              <button 
                className="modal-close"
                onClick={handleFecharModal}
                aria-label="Fechar modal"
              >
                <X size={12} />
              </button>
            </div>
            
            <div className="modal-content">
              {etapaModal === 1 && (
                // ➕ Etapa 1: Percepção Financeira (mantida como estava)
                <div className="etapa-percepcao">
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
              )}

              {etapaModal === 2 && (
                // ➕ NOVA: Etapa 2 - Renda e Horas Trabalhadas
                <div className="etapa-renda">
                  <div className="renda-form-grid">
                    
                    {/* Tipo de Renda */}
                    <div className="form-group full-width">
                      <label className="question-label">
                        <DollarSign size={16} />
                        Como você caracteriza sua renda?
                      </label>
                      <div className="options-grid renda-tipo">
                        {[
                          { valor: 'fixa', label: '💼 Salário Fixo', desc: 'CLT, funcionário público' },
                          { valor: 'variavel', label: '📈 Renda Variável', desc: 'Comissões, freelancer' },
                          { valor: 'mista', label: '⚖️ Mista', desc: 'Fixo + variável' },
                          { valor: 'autonomo', label: '🏪 Autônomo', desc: 'Negócio próprio' }
                        ].map((tipo) => (
                          <button
                            key={tipo.valor}
                            type="button"
                            className={`option-renda ${percepcao.tipoRenda === tipo.valor ? 'selected' : ''}`}
                            onClick={() => setPercepcao({ tipoRenda: tipo.valor })}
                          >
                            <div className="option-content">
                              <span className="option-text">{tipo.label}</span>
                              <span className="option-desc">{tipo.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Renda Mensal */}
                    <div className="form-group">
                      <label className="form-label">
                        <DollarSign size={16} />
                        Renda média mensal
                      </label>
                      <input
                        type="text"
                        value={percepcao.rendaMensal || ''}
                        onChange={handleRendaChange}
                        placeholder="R$ 0,00"
                        className="form-input money-input"
                      />
                      <span className="form-hint">Considere sua renda líquida média</span>
                    </div>

                    {/* Horas Trabalhadas */}
                    <div className="form-group">
                      <label className="form-label">
                        <Clock size={16} />
                        Horas por mês
                      </label>
                      <input
                        type="number"
                        value={percepcao.horasTrabalhadasMes || ''}
                        onChange={(e) => setPercepcao({ horasTrabalhadasMes: e.target.value })}
                        placeholder="160"
                        min="1"
                        max="744"
                        className="form-input"
                      />
                      <span className="form-hint">Exemplo: 40h/semana ≈ 160h/mês</span>
                    </div>

                    {/* Valor da Hora Calculado */}
                    {valorHora > 0 && (
                      <div className="valor-hora-resultado">
                        <div className="resultado-header">
                          <Calculator size={20} />
                          <h3>Valor da sua hora:</h3>
                        </div>
                        <div className="resultado-valor">R$ {valorHora}</div>
                        <p className="resultado-desc">
                          Este cálculo te ajudará a tomar melhores decisões sobre tempo vs dinheiro
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="navigation">
              <div className="nav-left">
                {etapaModal === 1 ? (
                  <button 
                    onClick={handleFecharModal}
                    className="btn-back"
                  >
                    <ArrowLeft size={12} />
                    Cancelar
                  </button>
                ) : (
                  <button 
                    onClick={handleVoltarEtapaModal}
                    className="btn-back"
                  >
                    <ArrowLeft size={12} />
                    Voltar
                  </button>
                )}
              </div>
              
              <div className="nav-right">
                {etapaModal === 1 ? (
                  <button 
                    onClick={handleProximaEtapaModal}
                    disabled={!percepcaoBasicaCompleta}
                    className="btn-continue"
                  >
                    Próximo
                    <ArrowRight size={12} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSalvar}
                    disabled={!percepcaoCompleta || salvando}
                    className="btn-continue"
                  >
                    {salvando ? 'Salvando...' : 'Salvar'}
                    <CheckCircle size={12} />
                  </button>
                )}
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