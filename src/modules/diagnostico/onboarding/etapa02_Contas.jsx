// src/modules/diagnostico/onboarding/etapa02_Contas.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft, Wallet, Plus } from 'lucide-react';
import useContas from '@modules/contas/hooks/useContas';
import ContasModal from '@modules/contas/components/ContasModal';
import { formatCurrency } from '@shared/utils/formatCurrency';

// CSS completamente novo
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const ContasEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 2, 
  totalEtapas = 11,
  dadosExistentes = null 
}) => {
  const { contas, loading, criarConta } = useContas();
  const [modalAberto, setModalAberto] = useState(false);

  const temContas = contas && contas.length > 0;
  const podeContinuar = temContas; // Obrigatório ter pelo menos uma conta

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true);
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
  }, []);

  const handleCriarContasBasicas = useCallback(async () => {
    const contasBasicas = [
      {
        nome: 'Conta Corrente',
        tipo: 'conta_corrente',
        banco: 'Principal',
        saldo: 0,
        cor: '#0066cc'
      },
      {
        nome: 'Poupança',
        tipo: 'poupanca',
        banco: 'Principal',
        saldo: 0,
        cor: '#22c55e'
      }
    ];

    try {
      for (const conta of contasBasicas) {
        await criarConta(conta);
      }
    } catch (error) {
      console.error('Erro ao criar contas básicas:', error);
    }
  }, [criarConta]);

  const handleContinuar = useCallback(() => {
    if (temContas) {
      const dadosContas = {
        totalContas: contas.length,
        saldoTotal: contas.reduce((total, conta) => total + (conta.saldo || 0), 0),
        temContas,
        completoEm: new Date().toISOString()
      };
      onContinuar(dadosContas);
    }
  }, [contas, temContas, onContinuar]);

  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: false, completa: true },
    { numero: 2, nome: 'Categorias', ativa: false, completa: true },
    { numero: 3, nome: 'Contas', ativa: true, completa: false },
    { numero: 4, nome: 'Cartões', ativa: false, completa: false },
    { numero: 5, nome: 'Desp.Cartão', ativa: false, completa: false },
    { numero: 6, nome: 'Receitas', ativa: false, completa: false },
    { numero: 7, nome: 'Desp.Fixas', ativa: false, completa: false },
    { numero: 8, nome: 'Desp.Variáveis', ativa: false, completa: false },
    { numero: 9, nome: 'Resumo', ativa: false, completa: false },
    { numero: 10, nome: 'Metas', ativa: false, completa: false },
    { numero: 11, nome: 'Fim', ativa: false, completa: false }
  ];

  if (loading) {
    return (
      <div className="diagnostico-container">
        <div className="diagnostico-header">
          <div className="header-row">
            <div className="header-title">Carregando...</div>
            <div className="header-progress">Aguarde</div>
          </div>
        </div>
        <div className="diagnostico-main">
          <div className="main-icon">⏳</div>
          <h1 className="main-title">Carregando suas contas...</h1>
        </div>
      </div>
    );
  }

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

      {/* Conteúdo Principal - Layout com Vídeo */}
      <div className="diagnostico-main-with-video">
        
        {/* Vídeo à Esquerda */}
        <div className="diagnostico-video-left">
          <div className="video-container">
            <div className="video-header">
              <h3 className="video-title">🎬 Cadastrando suas contas</h3>
              <p className="video-subtitle">Configure em 2 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Tutorial: Como cadastrar suas contas bancárias"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">💳</span>
                <span className="benefit-text">Controle total</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span className="benefit-text">Saldo atualizado</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🔒</span>
                <span className="benefit-text">Dados seguros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">🏦</div>
          <h1 className="main-title">Suas contas bancárias</h1>
          <p className="main-subtitle">Onde você guarda seu dinheiro?</p>
          <p className="main-description">
            Cadastre as contas que você usa no dia a dia. Isso nos ajuda a ter uma visão 
            completa de onde está seu dinheiro e como ele se movimenta.
          </p>

          {/* Status Card */}
          <div className={`status-card ${temContas ? 'completed' : 'pending'}`}>
            <div className="status-icon">
              {temContas ? '✅' : '🏦'}
            </div>
            <div className="status-info">
              <h3>
                {temContas 
                  ? `${contas.length} conta${contas.length > 1 ? 's' : ''} cadastrada${contas.length > 1 ? 's' : ''}`
                  : 'Contas Bancárias'
                }
              </h3>
              <p>
                {temContas 
                  ? `Saldo total: ${formatCurrency(contas.reduce((total, conta) => total + (conta.saldo || 0), 0))}`
                  : 'Cadastre suas contas para ter controle completo das suas finanças'
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
              <Plus size={14} />
              {temContas ? 'Gerenciar Contas' : 'Adicionar Conta'}
            </button>

            {!temContas && (
              <button
                onClick={handleCriarContasBasicas}
                className="btn-secondary"
              >
                ⚡ Criar contas básicas
              </button>
            )}
          </div>

          {/* Contas Existentes ou Informações */}
          {temContas ? (
            <div className="contas-existentes">
              {contas.slice(0, 4).map((conta) => (
                <div key={conta.id} className="preview-card-base">
                  <div 
                    className="conta-icone"
                    style={{ backgroundColor: conta.cor || '#6b7280' }}
                  >
                    <Wallet size={14} />
                  </div>
                  <div className="item-info-base">
                    <div className="conta-nome">{conta.nome}</div>
                    <div className="conta-tipo">{conta.tipo?.replace('_', ' ')}</div>
                  </div>
                  <div className="value-badge-base">
                    {formatCurrency(conta.saldo || 0)}
                  </div>
                </div>
              ))}
              {contas.length > 4 && (
                <div className="preview-card-base mais">
                  <div className="conta-icone">
                    +{contas.length - 4}
                  </div>
                  <div className="item-info-base">
                    <div className="conta-nome">Mais contas</div>
                    <div className="conta-tipo">Ver todas</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item success">
                <div className="info-icon">🏦</div>
                <div className="info-title">Corrente</div>
                <div className="info-text">Dia a dia</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">💰</div>
                <div className="info-title">Poupança</div>
                <div className="info-text">Reservas</div>
              </div>

              <div className="info-item warning">
                <div className="info-icon">📱</div>
                <div className="info-title">Digital</div>
                <div className="info-text">App bancos</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">💵</div>
                <div className="info-title">Dinheiro</div>
                <div className="info-text">Físico</div>
              </div>
            </div>
          )}

          {/* Alerta para etapa obrigatória */}
          {!temContas && (
            <div className="alert-base">
              <div className="alerta-icon">⚠️</div>
              <div className="alerta-texto">
                <strong>Esta etapa é obrigatória</strong> para continuar o diagnóstico
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navegação Inferior */}
      <div className="navigation">
        <div className="nav-left">
          <button
            onClick={onVoltar}
            className="btn-back"
          >
            <ArrowLeft size={12} />
            Voltar
          </button>
        </div>
        
        <div className="nav-right">
          <button
            onClick={handleContinuar}
            disabled={!temContas}
            className="btn-continue"
          >
            Continuar
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Modal de Contas */}
      <ContasModal
        isOpen={modalAberto}
        onClose={handleFecharModal}
      />
    </div>
  );
};

ContasEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object
};

export default ContasEtapa;