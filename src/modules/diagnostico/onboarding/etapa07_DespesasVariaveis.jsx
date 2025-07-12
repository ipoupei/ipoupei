// src/modules/diagnostico/onboarding/etapa07_DespesasVariaveis.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft, ShoppingBag, Plus, HelpCircle, Calculator, TrendingDown } from 'lucide-react';
import UnifiedTransactionModal from '@modules/transacoes/components/UnifiedTransactionModal';
import { useTransactions } from '@modules/transacoes/store/transactionsStore';
import { formatCurrency } from '@shared/utils/formatCurrency';
import InputMoney from '@shared/components/ui/InputMoney';

// CSS refatorado
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const DespesasVariaveisEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 7, 
  totalEtapas = 11,
  dadosExistentes = null 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [precisaRecarregar, setPrecisaRecarregar] = useState(true);

  // Estados para estimativas manuais
  const [estimativas, setEstimativas] = useState({
    lazer: 0,
    compras: 0,
    alimentacao: 0,
    transporte: 0,
    saude: 0,
    outros: 0
  });

  // Hook de transações
  const { 
    transacoes, 
    loading: loadingTransacoes,
    setFiltros, 
    fetchTransacoes 
  } = useTransactions();

  // Filtrar apenas despesas variáveis das transações carregadas
  const despesasVariaveisCarregadas = transacoes.filter(t => 
    t.tipo === 'despesa' && 
    !t.grupo_recorrencia && 
    !t.eh_recorrente && 
    !t.cartao_id // Excluir despesas de cartão (já foram tratadas)
  );

  // Buscar despesas variáveis existentes
  const carregarDespesasVariaveis = useCallback(async () => {
    if (!precisaRecarregar) return;
    
    try {
      setLoading(true);
      console.log('🔄 Carregando despesas variáveis para diagnóstico...');
      
      // Configurar filtros para buscar apenas despesas
      setFiltros({ 
        tipos: ['despesa'],
        categorias: [],
        contas: [],
        cartoes: [],
        status: [],
        busca: ''
      });
      
      // Buscar transações (que serão filtradas automaticamente)
      await fetchTransacoes();
      
      setPrecisaRecarregar(false);
      console.log('✅ Despesas variáveis carregadas via store');
    } catch (error) {
      console.error('❌ Erro ao carregar despesas variáveis:', error);
    } finally {
      setLoading(false);
    }
  }, [precisaRecarregar, setFiltros, fetchTransacoes]);

  // Carregar dados existentes
  useEffect(() => {
    if (dadosExistentes?.estimativas) {
      setEstimativas(dadosExistentes.estimativas);
    }
  }, [dadosExistentes]);

  // Carregar despesas variáveis quando o componente montar
  useEffect(() => {
    carregarDespesasVariaveis();
  }, [carregarDespesasVariaveis]);

  const temDespesasVariaveis = despesasVariaveisCarregadas && despesasVariaveisCarregadas.length > 0;
  const temEstimativas = Object.values(estimativas).some(valor => valor > 0);
  const podeContinuar = temDespesasVariaveis || temEstimativas; // Pode continuar com transações OU estimativas

  // Categorias de despesas variáveis
  const categorias = [
    {
      key: 'lazer',
      nome: 'Lazer e Entretenimento',
      icone: '🎉',
      descricao: 'Cinema, shows, viagens, restaurantes',
      cor: '#8B5CF6'
    },
    {
      key: 'compras',
      nome: 'Compras e Consumo',
      icone: '🛒',
      descricao: 'Roupas, eletrônicos, presentes',
      cor: '#F59E0B'
    },
    {
      key: 'alimentacao',
      nome: 'Alimentação Variável',
      icone: '🍕',
      descricao: 'Delivery, lanches, supermercado extra',
      cor: '#EF4444'
    },
    {
      key: 'transporte',
      nome: 'Transporte Extra',
      icone: '🚗',
      descricao: 'Uber, táxi, combustível adicional',
      cor: '#06B6D4'
    },
    {
      key: 'saude',
      nome: 'Saúde Variável',
      icone: '💊',
      descricao: 'Medicamentos, consultas extras',
      cor: '#10B981'
    },
    {
      key: 'outros',
      nome: 'Outros Gastos',
      icone: '📝',
      descricao: 'Imprevistos, doações, diversos',
      cor: '#6B7280'
    }
  ];

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true);
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
  }, []);

  const handleSalvarDespesa = useCallback(() => {
    console.log('💾 Despesa variável salva, recarregando dados...');
    setPrecisaRecarregar(true);
    setModalAberto(false);
    
    // Limpar filtros e recarregar
    setTimeout(() => {
      carregarDespesasVariaveis();
    }, 500);
  }, [carregarDespesasVariaveis]);

  const handleEstimativaChange = useCallback((categoria, valor) => {
    setEstimativas(prev => ({
      ...prev,
      [categoria]: valor || 0
    }));
  }, []);

  const handleContinuar = useCallback(() => {
    if (podeContinuar) {
      const valorTotalTransacoes = despesasVariaveisCarregadas.reduce((total, despesa) => {
        return total + (despesa.valor || 0);
      }, 0);

      const valorTotalEstimativas = Object.values(estimativas).reduce((total, valor) => {
        return total + valor;
      }, 0);

      // Calcular distribuição por categoria das transações
      const despesasPorCategoria = {};
      despesasVariaveisCarregadas.forEach(despesa => {
        const categoria = despesa.categoria_nome || 'Outros';
        if (!despesasPorCategoria[categoria]) {
          despesasPorCategoria[categoria] = { quantidade: 0, valor: 0 };
        }
        despesasPorCategoria[categoria].quantidade += 1;
        despesasPorCategoria[categoria].valor += despesa.valor || 0;
      });

      const dadosDespesasVariaveis = {
        totalDespesasVariaveis: despesasVariaveisCarregadas.length,
        valorTotalTransacoes,
        valorTotalEstimativas,
        valorTotalCombinado: valorTotalTransacoes + valorTotalEstimativas,
        temDespesasVariaveis,
        temEstimativas,
        estimativas,
        despesasPorCategoria,
        metodoColeta: temDespesasVariaveis ? 'transacoes' : 'estimativas',
        completoEm: new Date().toISOString()
      };
      
      console.log('✅ Dados das despesas variáveis para diagnóstico:', dadosDespesasVariaveis);
      onContinuar(dadosDespesasVariaveis);
    }
  }, [despesasVariaveisCarregadas, estimativas, temDespesasVariaveis, temEstimativas, podeContinuar, onContinuar]);

  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: false, completa: true },
    { numero: 2, nome: 'Categorias', ativa: false, completa: true },
    { numero: 3, nome: 'Contas', ativa: false, completa: true },
    { numero: 4, nome: 'Cartões', ativa: false, completa: true },
    { numero: 5, nome: 'Desp.Cartão', ativa: false, completa: true },
    { numero: 6, nome: 'Receitas', ativa: false, completa: true },
    { numero: 7, nome: 'Desp.Fixas', ativa: false, completa: true },
    { numero: 8, nome: 'Desp.Variáveis', ativa: true, completa: false },
    { numero: 9, nome: 'Resumo', ativa: false, completa: false },
    { numero: 10, nome: 'Metas', ativa: false, completa: false },
    { numero: 11, nome: 'Fim', ativa: false, completa: false }
  ];

  // Calcular totais e métricas
  const valorTotalTransacoes = despesasVariaveisCarregadas.reduce((total, despesa) => total + (despesa.valor || 0), 0);
  const valorTotalEstimativas = Object.values(estimativas).reduce((total, valor) => total + valor, 0);
  const valorTotalCombinado = valorTotalTransacoes + valorTotalEstimativas;

  if (loading && !despesasVariaveisCarregadas.length) {
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
          <h1 className="main-title">Carregando suas despesas variáveis...</h1>
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
              <h3 className="video-title">🎬 Controlando gastos variáveis</h3>
              <p className="video-subtitle">Otimize em 5 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/-yEZX2ar8WI"
                title="Tutorial: Como controlar despesas variáveis"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">💰</span>
                <span className="benefit-text">Economizar mais</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span className="benefit-text">Foco no essencial</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📈</span>
                <span className="benefit-text">Mais sobra</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">🛒</div>
          <h1 className="main-title">Suas despesas variáveis</h1>
          <p className="main-subtitle">Gastos que variam mês a mês</p>
          <p className="main-description">
            Agora vamos falar sobre os gastos que variam mensalmente - lazer, compras, 
            alimentação extra. Estes são os mais fáceis de controlar e onde você pode economizar.
          </p>

          {/* Status Card */}
          <div className={`status-card ${podeContinuar ? 'completed' : 'pending'}`}>
            <div className="status-icon">
              {podeContinuar ? '✅' : '🛒'}
            </div>
            <div className="status-info">
              <h3>
                {temDespesasVariaveis 
                  ? `${despesasVariaveisCarregadas.length} despesa${despesasVariaveisCarregadas.length > 1 ? 's' : ''} variável${despesasVariaveisCarregadas.length > 1 ? 'eis' : ''} registrada${despesasVariaveisCarregadas.length > 1 ? 's' : ''}`
                  : temEstimativas 
                    ? 'Estimativas preenchidas'
                    : 'Despesas Variáveis'
                }
              </h3>
              <p>
                {valorTotalCombinado > 0
                  ? `Total estimado: ${formatCurrency(valorTotalCombinado)}`
                  : 'Registre ou estime suas despesas variáveis para um diagnóstico completo'
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
              {temDespesasVariaveis ? 'Gerenciar Despesas' : 'Adicionar Despesa'}
            </button>
          </div>

          {/* Despesas Existentes */}
          {temDespesasVariaveis && (
            <div className="despesas-existentes">
              <h4>📊 Despesas registradas:</h4>
              {despesasVariaveisCarregadas.slice(0, 4).map((despesa) => (
                <div key={despesa.id} className="despesa-preview">
                  <div className="despesa-icone">
                    <TrendingDown size={14} />
                  </div>
                  <div className="item-info-base">
                    <div className="despesa-nome">{despesa.descricao}</div>
                    <div className="despesa-categoria">{despesa.categoria_nome || 'Despesa variável'}</div>
                  </div>
                  <div className="value-badge-base">
                    {formatCurrency(despesa.valor || 0)}
                  </div>
                </div>
              ))}
              {despesasVariaveisCarregadas.length > 4 && (
                <div className="despesa-preview mais">
                  <div className="despesa-icone">
                    +{despesasVariaveisCarregadas.length - 4}
                  </div>
                  <div className="item-info-base">
                    <div className="despesa-nome">Mais despesas</div>
                    <div className="despesa-categoria">Ver todas</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estimativas Manuais */}
          <div className="estimativas-section">
            <h4>📝 Ou estime seus gastos mensais por categoria:</h4>
            <p className="estimativas-subtitle">
              Se você não tem todas as despesas registradas, pode estimar valores médios mensais:
            </p>
            
            <div className="estimativas-grid">
              {categorias.map((categoria) => (
                <div key={categoria.key} className="estimativa-item">
                  <div className="estimativa-header">
                    <span className="categoria-icone">{categoria.icone}</span>
                    <div className="item-info-base">
                      <h5 className="categoria-nome">{categoria.nome}</h5>
                      <p className="categoria-descricao">{categoria.descricao}</p>
                    </div>
                  </div>
                  <div className="estimativa-input">
                    <InputMoney
                      value={estimativas[categoria.key]}
                      onChange={(valor) => handleEstimativaChange(categoria.key, valor)}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo dos valores */}
          {valorTotalCombinado > 0 && (
            <div className="resumo-variaveis">
              <h4>📊 Resumo das suas despesas variáveis:</h4>
              <div className="resumo-stats">
                {valorTotalTransacoes > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">Transações registradas:</span>
                    <span className="stat-value stat-warning">
                      {formatCurrency(valorTotalTransacoes)}
                    </span>
                  </div>
                )}
                {valorTotalEstimativas > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">Estimativas adicionais:</span>
                    <span className="stat-value stat-info">
                      {formatCurrency(valorTotalEstimativas)}
                    </span>
                  </div>
                )}
                <div className="stat-item stat-total">
                  <span className="stat-label">Total estimado mensal:</span>
                  <span className="stat-value stat-primary">
                    {formatCurrency(valorTotalCombinado)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dicas sobre economia */}
          <div className="dica-economia">
            <div className="dica-icon">💡</div>
            <div className="dica-texto">
              <strong>Dica de economia:</strong> Despesas variáveis são onde você mais pode economizar! 
              Comece definindo um limite mensal para cada categoria e acompanhe seus gastos semanalmente.
            </div>
          </div>

          {/* Informação sobre opcional */}
          {!podeContinuar && (
            <div className="alerta-opcional">
              <div className="alerta-icon">ℹ️</div>
              <div className="alerta-texto">
                <strong>Esta etapa é opcional</strong> - se você não tem certeza dos valores, 
                pode continuar e ajustar depois no aplicativo
              </div>
            </div>
          )}

          {/* Loading overlay quando está carregando */}
          {loading && (valorTotalTransacoes > 0 || temEstimativas) && (
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
            disabled={loading || loadingTransacoes}
            className="btn-continue"
          >
            Continuar
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Modal Unificado de Transações - Modo Despesa */}
      <UnifiedTransactionModal
        isOpen={modalAberto}
        onClose={handleFecharModal}
        onSave={handleSalvarDespesa}
        tipoInicial="despesa"
      />

    </div>
  );
};

DespesasVariaveisEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object
};

export default DespesasVariaveisEtapa;