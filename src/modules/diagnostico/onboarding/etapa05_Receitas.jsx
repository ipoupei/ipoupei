// src/modules/diagnostico/onboarding/etapa05_Receitas.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft, DollarSign, Plus, TrendingUp } from 'lucide-react';
import UnifiedTransactionModal from '@modules/transacoes/components/UnifiedTransactionModal';
import { useTransactions } from '@modules/transacoes/store/transactionsStore';
import { formatCurrency } from '@shared/utils/formatCurrency';

// CSS refatorado
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const ReceitasEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 5, 
  totalEtapas = 11,
  dadosExistentes = null 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [precisaRecarregar, setPrecisaRecarregar] = useState(true);

  // Hook de transações
  const { 
    transacoes, 
    loading: loadingTransacoes,
    setFiltros, 
    fetchTransacoes,
    limparFiltros 
  } = useTransactions();

  // Filtrar apenas receitas das transações carregadas
  const receitasCarregadas = transacoes.filter(t => t.tipo === 'receita');

  // Buscar receitas existentes
  const carregarReceitas = useCallback(async () => {
    if (!precisaRecarregar) return;
    
    try {
      setLoading(true);
      console.log('🔄 Carregando receitas para diagnóstico...');
      
      // Configurar filtros para buscar apenas receitas
      setFiltros({ 
        tipos: ['receita'],
        // Limpar outros filtros para pegar todas as receitas
        categorias: [],
        contas: [],
        cartoes: [],
        status: [],
        busca: ''
      });
      
      // Buscar transações (que serão filtradas automaticamente)
      await fetchTransacoes();
      
      setPrecisaRecarregar(false);
      console.log('✅ Receitas carregadas via store');
    } catch (error) {
      console.error('❌ Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  }, [precisaRecarregar, setFiltros, fetchTransacoes]);

  // Carregar receitas quando o componente montar
  useEffect(() => {
    carregarReceitas();
  }, [carregarReceitas]);

  const temReceitas = receitasCarregadas && receitasCarregadas.length > 0;
  const podeContinuar = temReceitas; // Etapa obrigatória - precisa ter pelo menos uma receita

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true);
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
  }, []);

  const handleSalvarReceita = useCallback(() => {
    console.log('💾 Receita salva, recarregando dados...');
    setPrecisaRecarregar(true);
    setModalAberto(false);
    
    // Limpar filtros e recarregar
    setTimeout(() => {
      carregarReceitas();
    }, 500);
  }, [carregarReceitas]);

  const handleContinuar = useCallback(() => {
    console.log('🚀 handleContinuar chamado na etapa de receitas');
    console.log('📊 Receitas carregadas:', receitasCarregadas);
    console.log('✅ Tem receitas:', temReceitas);
    
    if (temReceitas) {
      const valorTotalReceitas = receitasCarregadas.reduce((total, receita) => {
        return total + (receita.valor || 0);
      }, 0);

      const dadosReceitas = {
        totalReceitas: receitasCarregadas.length,
        valorTotalReceitas,
        temReceitas,
        receitasPorTipo: {
          fixas: receitasCarregadas.filter(r => r.recorrente || r.grupo_recorrencia).length,
          extras: receitasCarregadas.filter(r => !r.recorrente && !r.grupo_recorrencia && !r.grupo_parcelamento).length,
          parceladas: receitasCarregadas.filter(r => r.grupo_parcelamento).length
        },
        completoEm: new Date().toISOString()
      };
      
      console.log('✅ Dados das receitas para diagnóstico:', dadosReceitas);
      console.log('🔄 Chamando onContinuar...');
      onContinuar(dadosReceitas);
    } else {
      console.log('❌ Não tem receitas, não pode continuar');
    }
  }, [receitasCarregadas, temReceitas, onContinuar]);

  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: false, completa: true },
    { numero: 2, nome: 'Categorias', ativa: false, completa: true },
    { numero: 3, nome: 'Contas', ativa: false, completa: true },
    { numero: 4, nome: 'Cartões', ativa: false, completa: true },
    { numero: 5, nome: 'Desp.Cartão', ativa: false, completa: true },
    { numero: 6, nome: 'Receitas', ativa: true, completa: false },
    { numero: 7, nome: 'Desp.Fixas', ativa: false, completa: false },
    { numero: 8, nome: 'Desp.Variáveis', ativa: false, completa: false },
    { numero: 9, nome: 'Resumo', ativa: false, completa: false },
    { numero: 10, nome: 'Metas', ativa: false, completa: false },
    { numero: 11, nome: 'Fim', ativa: false, completa: false }
  ];

  if (loading && !receitasCarregadas.length) {
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
          <h1 className="main-title">Carregando suas receitas...</h1>
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
              <h3 className="video-title">🎬 Cadastrando suas receitas</h3>
              <p className="video-subtitle">Organize em 3 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Tutorial: Como cadastrar suas fontes de renda"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">💰</span>
                <span className="benefit-text">Controle total</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span className="benefit-text">Planejamento</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span className="benefit-text">Metas claras</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">💰</div>
          <h1 className="main-title">Suas fontes de renda</h1>
          <p className="main-subtitle">De onde vem seu dinheiro?</p>
          <p className="main-description">
            Registre todas as suas fontes de renda - salário, freelances, aluguéis, investimentos. 
            Isso é fundamental para entender sua capacidade financeira e fazer um diagnóstico preciso.
          </p>

          {/* Status Card */}
          <div className={`status-card ${temReceitas ? 'completed' : 'pending'}`}>
            <div className="status-icon">
              {temReceitas ? '✅' : '💰'}
            </div>
            <div className="status-info">
              <h3>
                {temReceitas 
                  ? `${receitasCarregadas.length} fonte${receitasCarregadas.length > 1 ? 's' : ''} de renda registrada${receitasCarregadas.length > 1 ? 's' : ''}`
                  : 'Fontes de Renda'
                }
              </h3>
              <p>
                {temReceitas 
                  ? `Renda total: ${formatCurrency(receitasCarregadas.reduce((total, receita) => total + (receita.valor || 0), 0))}`
                  : 'Cadastre suas fontes de renda para um diagnóstico completo'
                }
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="action-buttons">
            <button
              onClick={handleAbrirModal}
              disabled={loading || loadingTransacoes}
              className="btn-primary"
            >
              <Plus size={14} />
              {temReceitas ? 'Gerenciar Receitas' : 'Adicionar Receita'}
            </button>
          </div>

          {/* Receitas Existentes ou Informações */}
          {temReceitas ? (
            <div className="receitas-existentes">
              {receitasCarregadas.slice(0, 4).map((receita) => {
                // Determinar tipo da receita
                let tipoReceita = 'Renda extra';
                if (receita.grupo_recorrencia || receita.eh_recorrente) {
                  tipoReceita = 'Renda fixa';
                } else if (receita.grupo_parcelamento) {
                  tipoReceita = 'Renda parcelada';
                }

                return (
                  <div key={receita.id} className="preview-card-base">
                    <div className="receita-icone">
                      <DollarSign size={14} />
                    </div>
                    <div className="item-info-base">
                      <div className="receita-nome">{receita.descricao}</div>
                      <div className="receita-tipo">{tipoReceita}</div>
                    </div>
                    <div className="value-badge-base">
                      {formatCurrency(receita.valor || 0)}
                    </div>
                  </div>
                );
              })}
              {receitasCarregadas.length > 4 && (
                <div className="preview-card-base mais">
                  <div className="receita-icone">
                    +{receitasCarregadas.length - 4}
                  </div>
                  <div className="item-info-base">
                    <div className="receita-nome">Mais receitas</div>
                    <div className="receita-tipo">Ver todas</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item success">
                <div className="info-icon">💼</div>
                <div className="info-title">Salário</div>
                <div className="info-text">Trabalho CLT</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">💻</div>
                <div className="info-title">Freelance</div>
                <div className="info-text">Projetos extras</div>
              </div>

              <div className="info-item warning">
                <div className="info-icon">🏠</div>
                <div className="info-title">Aluguel</div>
                <div className="info-text">Renda passiva</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">📈</div>
                <div className="info-title">Investimentos</div>
                <div className="info-text">Dividendos</div>
              </div>
            </div>
          )}

          {/* Resumo das receitas quando existem */}
          {temReceitas && (
            <div className="resumo-receitas">
              <h4>📊 Resumo das suas receitas:</h4>
              <div className="resumo-stats">
                <div className="stat-item">
                  <span className="stat-label">Receitas fixas:</span>
                  <span className="stat-value">
                    {receitasCarregadas.filter(r => r.recorrente || r.grupo_recorrencia).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Receitas extras:</span>
                  <span className="stat-value">
                    {receitasCarregadas.filter(r => !r.recorrente && !r.grupo_recorrencia && !r.grupo_parcelamento).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Receitas parceladas:</span>
                  <span className="stat-value">
                    {receitasCarregadas.filter(r => r.grupo_parcelamento).length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Alerta para etapa obrigatória */}
          {!temReceitas && (
            <div className="alert-base">
              <div className="alerta-icon">⚠️</div>
              <div className="alerta-texto">
                <strong>Esta etapa é obrigatória</strong> para continuar o diagnóstico - 
                precisamos conhecer sua renda para análises precisas
              </div>
            </div>
          )}

          {/* Dicas sobre receitas */}
          {!temReceitas && (
            <div className="dica-receitas">
              <div className="dica-icon">💡</div>
              <div className="dica-texto">
                <strong>Dicas:</strong> Inclua todas as fontes de renda, mesmo as irregulares. 
                Para rendas variáveis, use uma média mensal. Registre valores líquidos!
              </div>
            </div>
          )}

          {/* Loading overlay quando está carregando */}
          {loading && receitasCarregadas.length > 0 && (
            <div className="loading-overlay">
              <div className="loading-spinner-small"></div>
              <span>Atualizando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Navegação Inferior */}
      <div className="navigation">
        <div className="nav-left">
          <button
            onClick={onVoltar}
            disabled={loading || loadingTransacoes}
            className="btn-back"
          >
            <ArrowLeft size={12} />
            Voltar
          </button>
        </div>
        
        <div className="nav-right">
          <button
            onClick={handleContinuar}
            disabled={!temReceitas || loading || loadingTransacoes}
            className="btn-continue"
          >
            Continuar
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Modal Unificado de Transações - Modo Receita */}
      <UnifiedTransactionModal
        isOpen={modalAberto}
        onClose={handleFecharModal}
        onSave={handleSalvarReceita}
        tipoInicial="receita"
      />


    </div>
  );
};

ReceitasEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object
};

export default ReceitasEtapa;