// src/modules/diagnostico/onboarding/etapa01_Categorias.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, ArrowRight, ArrowLeft, CheckCircle, Plus } from 'lucide-react';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import CategoriasModal from '@modules/categorias/components/CategoriasModal';

// CSS completamente novo
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';





const CategoriasEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 1, 
  totalEtapas = 11,
  dadosExistentes = null 
}) => {
  const { categorias, loading, criarCategoria } = useCategorias();
  const [modalAberto, setModalAberto] = useState(false);

  const temCategorias = categorias && categorias.length > 0;
  const podeContinuar = true; // Pode continuar mesmo sem categorias

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true);
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
  }, []);

  const handleCriarCategoriasBasicas = useCallback(async () => {
    try {
      for (const categoria of categoriasRecomendadas) {
        await criarCategoria(categoria);
      }
    } catch (error) {
      console.error('Erro ao criar categorias básicas:', error);
    }
  }, [criarCategoria]);

  const handleContinuar = useCallback(() => {
    const dadosCategoria = {
      totalCategorias: categorias?.length || 0,
      temCategorias,
      completoEm: new Date().toISOString()
    };
    onContinuar(dadosCategoria);
  }, [categorias, temCategorias, onContinuar]);

  const categoriasRecomendadas = [
    { icone: '🏠', nome: 'Moradia', tipo: 'despesa', cor: '#ef4444' },
    { icone: '🍽️', nome: 'Alimentação', tipo: 'despesa', cor: '#f97316' },
    { icone: '🚗', nome: 'Transporte', tipo: 'despesa', cor: '#eab308' },
    { icone: '🏥', nome: 'Saúde', tipo: 'despesa', cor: '#06b6d4' },
    { icone: '🎮', nome: 'Lazer', tipo: 'despesa', cor: '#8b5cf6' },
    { icone: '💼', nome: 'Salário', tipo: 'receita', cor: '#10b981' }
  ];

  const criarCategoriasBasicas = useCallback(async () => {
    try {
      for (const categoria of categoriasRecomendadas) {
        await criarCategoria(categoria);
      }
    } catch (error) {
      console.error('Erro ao criar categorias básicas:', error);
    }
  }, [criarCategoria]);

  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: false, completa: true },
    { numero: 2, nome: 'Categorias', ativa: true, completa: false },
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
          <h1 className="main-title">Carregando suas categorias...</h1>
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
              <h3 className="video-title">🎬 Como organizar categorias</h3>
              <p className="video-subtitle">Aprenda em 3 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/AouQXjW93Bg"
                title="Tutorial: Como organizar categorias financeiras"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">⚡</span>
                <span className="benefit-text">Configuração rápida</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span className="benefit-text">Organização eficaz</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span className="benefit-text">Relatórios precisos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">📁</div>
          <h1 className="main-title">Organize suas categorias</h1>
          <p className="main-subtitle">Como você gosta de classificar seus gastos e ganhos?</p>
          <p className="main-description">
            As categorias ajudam você a entender onde seu dinheiro vai e de onde vem. 
            Você pode usar nossas sugestões ou criar suas próprias.
          </p>

          {/* Status Card */}
          <div className={`status-card ${temCategorias ? 'completed' : 'pending'}`}>
            <div className="status-icon">
              {temCategorias ? '✅' : '📁'}
            </div>
            <div className="status-info">
              <h3>
                {temCategorias 
                  ? `${categorias.length} categoria${categorias.length > 1 ? 's' : ''} criada${categorias.length > 1 ? 's' : ''}`
                  : 'Categorias Financeiras'
                }
              </h3>
              <p>
                {temCategorias 
                  ? 'Suas categorias estão prontas para organizar suas finanças'
                  : 'Organize receitas e despesas em categorias que fazem sentido para você'
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
              {temCategorias ? 'Gerenciar Categorias' : 'Criar Categorias'}
            </button>

            {!temCategorias && (
              <button
                onClick={handleCriarCategoriasBasicas}
                className="btn-secondary"
              >
                ⚡ Usar categorias básicas
              </button>
            )}
          </div>

          {/* Grid de Informações ou Categorias Existentes */}
          {temCategorias ? (
            <div className="categorias-existentes">
              {categorias.slice(0, 4).map((categoria) => (
                <div key={categoria.id} className="preview-card-base">
                  <div 
                    className="categoria-cor"
                    style={{ backgroundColor: categoria.cor }}
                  >
                    {categoria.icone || '📁'}
                  </div>
                  <div className="item-info-base">
                    <div className="categoria-nome">{categoria.nome}</div>
                    <div className="categoria-tipo">
                      {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </div>
                  </div>
                </div>
              ))}
              {categorias.length > 4 && (
                <div className="preview-card-base mais">
                  <div className="categoria-cor">
                    +{categorias.length - 4}
                  </div>
                  <div className="item-info-base">
                    <div className="categoria-nome">Mais categorias</div>
                    <div className="categoria-tipo">Ver todas</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item success">
                <div className="info-icon">🏠</div>
                <div className="info-title">Essenciais</div>
                <div className="info-text">Moradia, comida...</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">🎮</div>
                <div className="info-title">Lazer</div>
                <div className="info-text">Entretenimento</div>
              </div>

              <div className="info-item warning">
                <div className="info-icon">💼</div>
                <div className="info-title">Receitas</div>
                <div className="info-text">Salário, extras...</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">🎯</div>
                <div className="info-title">Personalize</div>
                <div className="info-text">Do seu jeito</div>
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
            {temCategorias ? 'Continuar' : 'Pular por agora'}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Modal de Categorias */}
      <CategoriasModal
        isOpen={modalAberto}
        onClose={handleFecharModal}
      />
    </div>
  );
};

CategoriasEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object
};

export default CategoriasEtapa;