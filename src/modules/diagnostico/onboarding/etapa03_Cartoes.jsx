// src/modules/diagnostico/onboarding/etapa03_Cartoes.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft, CreditCard, Plus } from 'lucide-react';
import { useCartoesData } from '@modules/cartoes/hooks/useCartoesData';
import { useCartoesStore } from '@modules/cartoes/store/useCartoesStore';
import CartoesModal from '@modules/cartoes/components/CartoesModal';
import { formatCurrency } from '@shared/utils/formatCurrency';


// CSS refatorado
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';
import '@shared/styles/globals.css';

const CartoesEtapa = ({ onContinuar, onVoltar, etapaAtual = 3, totalEtapas = 11, dadosExistentes = null }) => {
  // ✅ Hook para funções de busca
  const { fetchCartoes, loading } = useCartoesData();
  
  // ✅ Store para dados dos cartões
  const { 
    cartoes, 
    setCartoes,
    loadingStates 
  } = useCartoesStore();
  
  const [modalAberto, setModalAberto] = useState(false);
  const temCartoes = cartoes && cartoes.length > 0;

  // ✅ Carregar cartões e atualizar store
  const carregarCartoes = useCallback(async () => {
    try {
      const cartoesCarregados = await fetchCartoes();
      setCartoes(cartoesCarregados || []); // ✅ Atualizar store
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      setCartoes([]);
    }
  }, [fetchCartoes, setCartoes]);

  useEffect(() => {
    carregarCartoes();
  }, [carregarCartoes]);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
    carregarCartoes(); // Recarregar após fechar modal
  }, [carregarCartoes]);
  

  const handleAbrirModal = useCallback(() => {
  setModalAberto(true);
}, []);


// ✅ NOVA FUNÇÃO que usa os dados atualizados
const encontrarProximaEtapaComDados = (etapaAtualIndex, dadosAtualizados) => {
  let proximaEtapa = etapaAtualIndex + 1;
  
  while (proximaEtapa < totalEtapas && devePularEtapaComDados(proximaEtapa, dadosAtualizados)) {
    console.log(`🔄 Pulando etapa ${proximaEtapa}: ${etapas[proximaEtapa].titulo}`);
    proximaEtapa++;
  }
  
  console.log(`✅ Próxima etapa válida encontrada: ${proximaEtapa}`);
  return proximaEtapa;
};

// ✅ NOVA FUNÇÃO que recebe os dados como parâmetro
const devePularEtapaComDados = (indiceEtapa, dados) => {
  const etapa = etapas[indiceEtapa];
  
  if (!etapa.condicional) return false;
  
  if (etapa.id === 'despesas-cartao') {
    const dadosCartoes = dados.cartoes;
    const temCartoes = dadosCartoes && dadosCartoes.totalCartoes > 0;
    
    console.log('🔍 Verificando etapa despesas-cartao COM DADOS ATUALIZADOS:', { 
      dadosCartoes, 
      temCartoes,
      totalCartoes: dadosCartoes?.totalCartoes,
      resultado: !temCartoes
    });
    
    return !temCartoes;
  }
  
  return false;
};
// ✅ VERSÃO CORRETA (simples):
const handleContinuar = useCallback(() => {
  const dadosCartoes = {
    totalCartoes: cartoes?.length || 0,
    limiteTotal: cartoes?.reduce((total, cartao) => total + (cartao.limite || 0), 0) || 0,
    temCartoes,
    completoEm: new Date().toISOString()
  };
  
  console.log('🎯 Dados dos cartões sendo enviados:', dadosCartoes);
  onContinuar(dadosCartoes);
}, [cartoes, temCartoes, onContinuar]);





  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: false, completa: true },
    { numero: 2, nome: 'Categorias', ativa: false, completa: true },
    { numero: 3, nome: 'Contas', ativa: false, completa: true },
    { numero: 4, nome: 'Cartões', ativa: true, completa: false },
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
          <h1 className="main-title">Carregando seus cartões...</h1>
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
              <h3 className="video-title">🎬 Controlando cartões de crédito</h3>
              <p className="video-subtitle">Aprenda em 4 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Tutorial: Como controlar cartões de crédito"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span className="benefit-text">Evitar surpresas</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span className="benefit-text">Controle de limite</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">💰</span>
                <span className="benefit-text">Planejar compras</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">💳</div>
          <h1 className="main-title">Seus cartões de crédito</h1>
          <p className="main-subtitle">Controle seus cartões para evitar surpresas</p>
          <p className="main-description">
            Cadastre seus cartões de crédito para ter controle total sobre limites, faturas 
            e gastos. Se você não usa cartão, pode pular esta etapa tranquilamente.
          </p>

          {/* Status Card */}
          <div className={`status-card ${temCartoes ? 'completed' : 'pending'}`}>
            <div className="status-icon">
              {temCartoes ? '✅' : '💳'}
            </div>
            <div className="status-info">
              <h3>
                {temCartoes 
                  ? `${cartoes.length} cartão${cartoes.length > 1 ? 'ões' : ''} cadastrado${cartoes.length > 1 ? 's' : ''}`
                  : 'Cartões de Crédito'
                }
              </h3>
              <p>
                {temCartoes 
                  ? `Limite total: ${formatCurrency(cartoes.reduce((total, cartao) => total + (cartao.limite || 0), 0))}`
                  : 'Cadastre seus cartões para ter controle sobre faturas e gastos'
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
              {temCartoes ? 'Gerenciar Cartões' : 'Adicionar Cartão'}
            </button>
          </div>

          {/* Cartões Existentes ou Informações */}
          {temCartoes ? (
            <div className="cartoes-existentes">
              {cartoes.slice(0, 3).map((cartao) => {
                const percentualUso = 0; // Sem gastos ainda no diagnóstico
                
                return (
                  <div key={cartao.id} className="preview-card-base">
                    <div 
                      className="cartao-icone"
                      style={{ backgroundColor: cartao.cor || '#6b7280' }}
                    >
                      <CreditCard size={14} />
                    </div>
                    <div className="cartao-info">
                      <div className="cartao-nome">{cartao.nome}</div>
                      <div className="cartao-bandeira">{cartao.bandeira || 'Cartão'}</div>
                    </div>
                    <div className="cartao-limite">
                      <div className="limite-valor">
                        {formatCurrency(cartao.limite || 0)}
                      </div>
                      <div className="limite-label">Limite</div>
                    </div>
                  </div>
                );
              })}
              {cartoes.length > 3 && (
                <div className="preview-card-base mais">
                  <div className="cartao-icone">
                    +{cartoes.length - 3}
                  </div>
                  <div className="cartao-info">
                    <div className="cartao-nome">Mais cartões</div>
                    <div className="cartao-bandeira">Ver todos</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item success">
                <div className="info-icon">💳</div>
                <div className="info-title">Visa</div>
                <div className="info-text">Mais usado</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">💳</div>
                <div className="info-title">Mastercard</div>
                <div className="info-text">Popular</div>
              </div>

              <div className="info-item warning">
                <div className="info-icon">💳</div>
                <div className="info-title">Elo</div>
                <div className="info-text">Nacional</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">✋</div>
                <div className="info-title">Sem cartão</div>
                <div className="info-text">Pode pular</div>
              </div>
            </div>
          )}

          {/* Dica sobre cartões */}
          {!temCartoes && (
            <div className="preview-card-base">
              <div className="dica-icon">💡</div>
              <div className="dica-texto">
                <strong>Dica:</strong> Muitas pessoas preferem usar apenas dinheiro ou débito. 
                Esta etapa é totalmente opcional - você pode pular tranquilamente!
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
            {temCartoes ? 'Continuar' : 'Pular por agora'}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Modal de Cartões */}
      {modalAberto && (
        <CartoesModal
          isOpen={modalAberto}
          onClose={handleFecharModal}
        />
      )}

      {/* Estilos específicos para cartões */}

    </div>
  );
};

CartoesEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object
};

export default CartoesEtapa;