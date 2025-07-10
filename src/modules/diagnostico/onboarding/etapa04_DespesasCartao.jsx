// src/modules/diagnostico/onboarding/etapa04_DespesasCartao.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft, CreditCard, Plus, ShoppingCart } from 'lucide-react';
import useCartoes from '@modules/cartoes/hooks/useCartoesData';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';
import { formatCurrency } from '@shared/utils/formatCurrency';

// CSS refatorado
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const DespesasCartaoEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 4, 
  totalEtapas = 11,
  dadosExistentes = null,
  todosDados = null // ✅ RECEBER TODOS OS DADOS DO DIAGNÓSTICO
}) => {
  const { cartoes, loading } = useCartoes();
  const [modalAberto, setModalAberto] = useState(false);

  // Por enquanto, vamos assumir que não há despesas cadastradas no diagnóstico
  // Isso pode ser melhorado depois com hook de transações quando necessário
  const despesasCartao = [];

  // ✅ USAR DADOS DO DIAGNÓSTICO EM VEZ DE HOOK SEPARADO
  const dadosCartoesFromDiagnostico = todosDados?.cartoes;
  const temCartoesDiagnostico = dadosCartoesFromDiagnostico?.totalCartoes > 0;
  
  // ✅ LÓGICA CORRIGIDA: Se chegou até aqui via DiagnosticoRouter, confia que tem cartões
  // Mas faz fallback para verificação local se necessário
  const temCartoes = temCartoesDiagnostico || (cartoes && cartoes.length > 0);
  
  console.log('🔍 DespesasCartaoEtapa - Verificação de cartões:', {
    dadosCartoesFromDiagnostico,
    temCartoesDiagnostico,
    cartoesFromHook: cartoes?.length || 0,
    temCartoes,
    loading
  });

  const temDespesasCartao = despesasCartao.length > 0;
  const podeContinuar = true; // Etapa opcional - sempre pode continuar

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true);
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
  }, []);

  const handleContinuar = useCallback(() => {
    const dadosDespesasCartao = {
      totalDespesasCartao: despesasCartao.length,
      valorTotalDespesas: despesasCartao.reduce((total, despesa) => total + (despesa.valor || 0), 0),
      temDespesasCartao,
      completoEm: new Date().toISOString()
    };
    onContinuar(dadosDespesasCartao);
  }, [despesasCartao, temDespesasCartao, onContinuar]);

  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: false, completa: true },
    { numero: 2, nome: 'Categorias', ativa: false, completa: true },
    { numero: 3, nome: 'Contas', ativa: false, completa: true },
    { numero: 4, nome: 'Cartões', ativa: false, completa: true },
    { numero: 5, nome: 'Desp.Cartão', ativa: true, completa: false },
    { numero: 6, nome: 'Receitas', ativa: false, completa: false },
    { numero: 7, nome: 'Desp.Fixas', ativa: false, completa: false },
    { numero: 8, nome: 'Desp.Variáveis', ativa: false, completa: false },
    { numero: 9, nome: 'Resumo', ativa: false, completa: false },
    { numero: 10, nome: 'Metas', ativa: false, completa: false },
    { numero: 11, nome: 'Fim', ativa: false, completa: false }
  ];

  // ✅ LOADING STATE MELHORADO
  if (loading && !cartoes?.length && !dadosCartoesFromDiagnostico) {
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
          <h1 className="main-title">Carregando dados dos cartões...</h1>
        </div>
      </div>
    );
  }

  // ✅ REMOÇÃO DA VERIFICAÇÃO PROBLEMÁTICA
  // Se chegou até aqui, o DiagnosticoRouter já verificou que tem cartões
  // Não precisamos fazer verificação duplicada que pode causar inconsistências

  // ✅ FALLBACK: Se por algum motivo não temos dados de cartões, usar dados do diagnóstico
  const cartoesParaExibir = cartoes?.length > 0 ? cartoes : [
    {
      id: 'fallback-1',
      nome: dadosCartoesFromDiagnostico?.nomeCartao || 'Cartão Principal',
      limite: dadosCartoesFromDiagnostico?.limiteTotal || 0,
      cor: '#6b7280',
      bandeira: 'Cartão'
    }
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

      {/* Conteúdo Principal - Layout com Vídeo */}
      <div className="diagnostico-main-with-video">
        
        {/* Vídeo à Esquerda */}
        <div className="diagnostico-video-left">
          <div className="video-container">
            <div className="video-header">
              <h3 className="video-title">🎬 Registrando gastos do cartão</h3>
              <p className="video-subtitle">Controle em 3 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/AouQXjW93Bg"
                title="Tutorial: Como registrar gastos do cartão de crédito"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">💡</span>
                <span className="benefit-text">Evitar surpresas</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span className="benefit-text">Controle de fatura</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span className="benefit-text">Planejamento</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">🛒</div>
          <h1 className="main-title">Gastos no cartão de crédito</h1>
          <p className="main-subtitle">Registre os principais gastos dos seus cartões</p>
          <p className="main-description">
            Vamos registrar os gastos que você já fez ou planeja fazer nos seus cartões. 
            Isso ajuda a controlar as próximas faturas e evitar surpresas.
          </p>

          {/* ✅ STATUS CARD MELHORADO */}
          <div className={`status-card ${temDespesasCartao ? 'completed' : 'pending'}`}>
            <div className="status-icon">
              {temDespesasCartao ? '✅' : '🛒'}
            </div>
            <div className="status-info">
              <h3>
                {temDespesasCartao 
                  ? `${despesasCartao.length} gasto${despesasCartao.length > 1 ? 's' : ''} registrado${despesasCartao.length > 1 ? 's' : ''}`
                  : 'Gastos do Cartão'
                }
              </h3>
              <p>
                {temDespesasCartao 
                  ? `Total gasto: ${formatCurrency(despesasCartao.reduce((total, despesa) => total + (despesa.valor || 0), 0))}`
                  : `Você tem ${dadosCartoesFromDiagnostico?.totalCartoes || cartoesParaExibir.length} cartão${(dadosCartoesFromDiagnostico?.totalCartões || cartoesParaExibir.length) > 1 ? 'ões' : ''} cadastrado${(dadosCartoesFromDiagnostico?.totalCartões || cartoesParaExibir.length) > 1 ? 's' : ''}`
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
              {temDespesasCartao ? 'Gerenciar Gastos' : 'Adicionar Gasto'}
            </button>
          </div>

          {/* Despesas Existentes ou Cartões Disponíveis */}
          {temDespesasCartao ? (
            <div className="despesas-existentes">
              <p>Nenhuma despesa registrada ainda.</p>
            </div>
          ) : (
            <>
              {/* ✅ CARTÕES DISPONÍVEIS MELHORADO */}
              <div className="cartoes-disponiveis">
                <h4>💳 Seus cartões disponíveis:</h4>
                <div className="cartoes-mini-grid">
                  {cartoesParaExibir.slice(0, 2).map((cartao) => (
                    <div key={cartao.id} className="cartao-mini">
                      <div 
                        className="cartao-mini-cor"
                        style={{ backgroundColor: cartao.cor || '#6b7280' }}
                      >
                        <CreditCard size={12} />
                      </div>
                      <div className="cartao-mini-info">
                        <span className="cartao-mini-nome">{cartao.nome}</span>
                        <span className="cartao-mini-limite">
                          {formatCurrency(cartao.limite || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {cartoesParaExibir.length > 2 && (
                    <div className="cartao-mini mais">
                      <div className="cartao-mini-cor">
                        +{cartoesParaExibir.length - 2}
                      </div>
                      <div className="cartao-mini-info">
                        <span className="cartao-mini-nome">Mais cartões</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="info-grid">
                <div className="info-item success">
                  <div className="info-icon">🛒</div>
                  <div className="info-title">Compras</div>
                  <div className="info-text">Supermercado</div>
                </div>

                <div className="info-item info">
                  <div className="info-icon">⛽</div>
                  <div className="info-title">Combustível</div>
                  <div className="info-text">Posto</div>
                </div>

                <div className="info-item warning">
                  <div className="info-icon">🍕</div>
                  <div className="info-title">Delivery</div>
                  <div className="info-text">Comida</div>
                </div>

                <div className="info-item info">
                  <div className="info-icon">👕</div>
                  <div className="info-title">Roupas</div>
                  <div className="info-text">Shopping</div>
                </div>
              </div>
            </>
          )}

          {/* Dica sobre gastos */}
          {!temDespesasCartao && (
            <div className="dica-gastos">
              <div className="dica-icon">💡</div>
              <div className="dica-texto">
                <strong>Dica:</strong> Registre apenas os gastos principais. 
                Você pode adicionar outros depois conforme usar o app!
              </div>
            </div>
          )}

          {/* ✅ INFO SOBRE DADOS DO DIAGNÓSTICO */}
          {dadosCartoesFromDiagnostico && (
            <div className="info-diagnostico">
              <div className="info-icon">📊</div>
              <div className="info-texto">
                <strong>Limite total disponível:</strong> {formatCurrency(dadosCartoesFromDiagnostico.limiteTotal || 0)}
                <br />
                <small>Baseado nos cartões cadastrados na etapa anterior</small>
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
            className="btn-continue"
          >
            {temDespesasCartao ? 'Continuar' : 'Pular por agora'}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Modal de Despesas do Cartão */}
      {modalAberto && (
        <DespesasCartaoModal
          isOpen={modalAberto}
          onClose={handleFecharModal}
        />
      )}

    </div>
  );
};

DespesasCartaoEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object,
  todosDados: PropTypes.object // ✅ NOVA PROP OBRIGATÓRIA
};

export default DespesasCartaoEtapa;