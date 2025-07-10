// src/modules/diagnostico/onboarding/etapa06_DespesasFixas.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft, Home, Plus, TrendingDown, Calculator, AlertTriangle } from 'lucide-react';
import UnifiedTransactionModal from '@modules/transacoes/components/UnifiedTransactionModal';
import { useTransactions } from '@modules/transacoes/store/transactionsStore';
import { formatCurrency } from '@shared/utils/formatCurrency';

// CSS refatorado
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const DespesasFixasEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 6, 
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
    fetchTransacoes 
  } = useTransactions();

  // Função para identificar se uma transação é despesa fixa
  const isDespesaFixa = (transacao) => {
    // 1. Deve ser despesa
    if (transacao.tipo !== 'despesa') return false;
    
    // 2. Não deve ser despesa de cartão de crédito (essas são tratadas separadamente)
    if (transacao.cartao_id) return false;
    
    // 3. Deve ter indicação de recorrência OU estar em um grupo de recorrência
    const isRecorrente = (
      transacao.recorrente ||
      transacao.grupo_recorrencia ||
      transacao.tipo_recorrencia ||
      transacao.numero_recorrencia > 0 ||
      transacao.total_recorrencias > 0
    );
    
    // 4. OU deve ter categoria típica de despesa fixa
    const categoriasDespesaFixa = [
      'moradia', 'habitacao', 'casa', 'aluguel', 'financiamento',
      'contas', 'conta', 'utilidades', 'energia', 'agua', 'luz', 'gas',
      'internet', 'telefone', 'celular', 'tv', 'streaming',
      'saude', 'plano', 'medicamento', 'farmacia',
      'transporte', 'combustivel', 'seguro', 'ipva', 'iptu',
      'educacao', 'escola', 'faculdade', 'curso',
      'assinatura', 'mensalidade', 'anuidade'
    ];
    
    const categoriaName = (transacao.categoria_nome || '').toLowerCase();
    const descricaoName = (transacao.descricao || '').toLowerCase();
    
    const isCategoriaFixa = categoriasDespesaFixa.some(palavra => 
      categoriaName.includes(palavra) || descricaoName.includes(palavra)
    );
    
    return isRecorrente || isCategoriaFixa;
  };

  // Filtrar despesas fixas das transações carregadas
  const despesasFixasCarregadas = transacoes.filter(isDespesaFixa);

  console.log('🔍 Debug Despesas Fixas:', {
    totalTransacoes: transacoes.length,
    transacoesDespesa: transacoes.filter(t => t.tipo === 'despesa').length,
    despesasComCartao: transacoes.filter(t => t.tipo === 'despesa' && t.cartao_id).length,
    despesasRecorrentes: transacoes.filter(t => t.tipo === 'despesa' && (t.eh_recorrente || t.grupo_recorrencia)).length,
    despesasFixasIdentificadas: despesasFixasCarregadas.length,
    amostraTransacoes: transacoes.slice(0, 3).map(t => ({
      id: t.id,
      descricao: t.descricao,
      tipo: t.tipo,
      valor: t.valor,
      eh_recorrente: t.eh_recorrente,
      grupo_recorrencia: t.grupo_recorrencia,
      cartao_id: t.cartao_id,
      categoria_nome: t.categoria_nome
    }))
  });

  // Buscar despesas fixas existentes
  const carregarDespesasFixas = useCallback(async () => {
    if (!precisaRecarregar) return;
    
    try {
      setLoading(true);
      console.log('🔄 Carregando todas as transações para identificar despesas fixas...');
      
      // Limpar filtros para buscar TODAS as transações
      setFiltros({ 
        tipos: [], // Buscar todos os tipos
        categorias: [],
        contas: [],
        cartoes: [],
        status: [],
        busca: ''
      });
      
      // Buscar todas as transações
      await fetchTransacoes();
      
      setPrecisaRecarregar(false);
      console.log('✅ Transações carregadas, identificando despesas fixas...');
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  }, [precisaRecarregar, setFiltros, fetchTransacoes]);

  // Carregar despesas fixas quando o componente montar
  useEffect(() => {
    carregarDespesasFixas();
  }, [carregarDespesasFixas]);

  // Recalcular quando as transações mudarem
  useEffect(() => {
    if (transacoes.length > 0) {
      console.log('📊 Recalculando despesas fixas...', {
        totalTransacoes: transacoes.length,
        despesasFixas: despesasFixasCarregadas.length
      });
    }
  }, [transacoes, despesasFixasCarregadas.length]);

  const temDespesasFixas = despesasFixasCarregadas && despesasFixasCarregadas.length > 0;
  const podeContinuar = temDespesasFixas; // Etapa obrigatória - precisa ter pelo menos uma despesa fixa

  const handleAbrirModal = useCallback(() => {
    setModalAberto(true);
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalAberto(false);
  }, []);

  const handleSalvarDespesa = useCallback(() => {
    console.log('💾 Despesa fixa salva, recarregando dados...');
    setPrecisaRecarregar(true);
    setModalAberto(false);
    
    // Recarregar dados após um delay
    setTimeout(() => {
      carregarDespesasFixas();
    }, 500);
  }, [carregarDespesasFixas]);

  const handleContinuar = useCallback(() => {
    if (temDespesasFixas) {
      const valorTotalDespesas = despesasFixasCarregadas.reduce((total, despesa) => {
        return total + (despesa.valor || 0);
      }, 0);

      // Calcular distribuição por categoria
      const despesasPorCategoria = {};
      despesasFixasCarregadas.forEach(despesa => {
        const categoria = despesa.categoria_nome || 'Outros';
        if (!despesasPorCategoria[categoria]) {
          despesasPorCategoria[categoria] = { quantidade: 0, valor: 0 };
        }
        despesasPorCategoria[categoria].quantidade += 1;
        despesasPorCategoria[categoria].valor += despesa.valor || 0;
      });

      const dadosDespesasFixas = {
        totalDespesasFixas: despesasFixasCarregadas.length,
        valorTotalDespesasFixas: valorTotalDespesas,
        temDespesasFixas,
        despesasPorCategoria,
        mediaDespesaFixa: despesasFixasCarregadas.length > 0 ? valorTotalDespesas / despesasFixasCarregadas.length : 0,
        listaDespesas: despesasFixasCarregadas.map(d => ({
          id: d.id,
          descricao: d.descricao,
          valor: d.valor,
          categoria: d.categoria_nome
        })),
        completoEm: new Date().toISOString()
      };
      
      console.log('✅ Dados das despesas fixas para diagnóstico:', dadosDespesasFixas);
      onContinuar(dadosDespesasFixas);
    }
  }, [despesasFixasCarregadas, temDespesasFixas, onContinuar]);

  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: false, completa: true },
    { numero: 2, nome: 'Categorias', ativa: false, completa: true },
    { numero: 3, nome: 'Contas', ativa: false, completa: true },
    { numero: 4, nome: 'Cartões', ativa: false, completa: true },
    { numero: 5, nome: 'Desp.Cartão', ativa: false, completa: true },
    { numero: 6, nome: 'Receitas', ativa: false, completa: true },
    { numero: 7, nome: 'Desp.Fixas', ativa: true, completa: false },
    { numero: 8, nome: 'Desp.Variáveis', ativa: false, completa: false },
    { numero: 9, nome: 'Resumo', ativa: false, completa: false },
    { numero: 10, nome: 'Metas', ativa: false, completa: false },
    { numero: 11, nome: 'Fim', ativa: false, completa: false }
  ];

  // Calcular métricas e insights
  const valorTotalDespesas = despesasFixasCarregadas.reduce((total, despesa) => total + (despesa.valor || 0), 0);
  
  // Dados das receitas do diagnóstico anterior (se disponível)
  const rendaTotal = dadosExistentes?.receitas?.valorTotalReceitas || 0;
  const percentualRenda = rendaTotal > 0 ? (valorTotalDespesas / rendaTotal) * 100 : 0;
  
  // Função para determinar status da situação financeira
  const getStatusFinanceiro = () => {
    if (percentualRenda === 0) return { cor: 'gray', status: 'Sem dados', icone: '📊' };
    if (percentualRenda <= 50) return { cor: 'success', status: 'Saudável', icone: '✅' };
    if (percentualRenda <= 70) return { cor: 'warning', status: 'Atenção', icone: '⚠️' };
    if (percentualRenda <= 90) return { cor: 'danger', status: 'Crítico', icone: '🚨' };
    return { cor: 'danger', status: 'Emergência', icone: '🆘' };
  };

  const statusFinanceiro = getStatusFinanceiro();

  if (loading && !despesasFixasCarregadas.length && transacoes.length === 0) {
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
          <h1 className="main-title">Carregando suas despesas fixas...</h1>
          <p className="main-subtitle">Analisando suas transações...</p>
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
              <h3 className="video-title">🎬 Controlando despesas fixas</h3>
              <p className="video-subtitle">Organize em 4 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/AouQXjW93Bg"
                title="Tutorial: Como controlar despesas fixas mensais"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">🏠</span>
                <span className="benefit-text">Controle total</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">💡</span>
                <span className="benefit-text">Reduzir custos</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span className="benefit-text">Planejamento</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">🏠</div>
          <h1 className="main-title">Suas despesas fixas</h1>
          <p className="main-subtitle">Gastos que você paga todo mês</p>
          <p className="main-description">
            Registre suas despesas fixas mensais - aluguel, contas básicas, planos de saúde, 
            financiamentos. São gastos obrigatórios que impactam diretamente seu orçamento.
          </p>

          {/* Status Card */}
          <div className={`status-card ${temDespesasFixas ? 'completed' : 'pending'}`}>
            <div className="status-icon">
              {temDespesasFixas ? '✅' : '🏠'}
            </div>
            <div className="status-info">
              <h3>
                {temDespesasFixas 
                  ? `${despesasFixasCarregadas.length} despesa${despesasFixasCarregadas.length > 1 ? 's' : ''} fixa${despesasFixasCarregadas.length > 1 ? 's' : ''} registrada${despesasFixasCarregadas.length > 1 ? 's' : ''}`
                  : 'Despesas Fixas'
                }
              </h3>
              <p>
                {temDespesasFixas 
                  ? `Total mensal: ${formatCurrency(valorTotalDespesas)}`
                  : 'Cadastre suas despesas fixas para entender seu orçamento base'
                }
              </p>
            </div>
          </div>

          {/* Debug Info - Remover em produção */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px', fontSize: '11px', marginBottom: '16px' }}>
              <strong>Debug:</strong> Total transações: {transacoes.length} | 
              Despesas: {transacoes.filter(t => t.tipo === 'despesa').length} | 
              Despesas fixas: {despesasFixasCarregadas.length}
            </div>
          )}

          {/* Análise Financeira */}
          {temDespesasFixas && rendaTotal > 0 && (
            <div className={`analise-financeira ${statusFinanceiro.cor}`}>
              <div className="analise-header">
                <span className="analise-icone">{statusFinanceiro.icone}</span>
                <h4>Análise: {statusFinanceiro.status}</h4>
              </div>
              <div className="analise-detalhes">
                <div className="analise-item">
                  <span className="analise-label">% da Renda Comprometida:</span>
                  <span className="analise-valor">{percentualRenda.toFixed(1)}%</span>
                </div>
                <div className="analise-item">
                  <span className="analise-label">Sobra após despesas fixas:</span>
                  <span className="analise-valor">{formatCurrency(rendaTotal - valorTotalDespesas)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="action-buttons">
            <button
              onClick={handleAbrirModal}
              disabled={loading || loadingTransacoes}
              className="btn-primary"
            >
              <Plus size={14} />
              {temDespesasFixas ? 'Gerenciar Despesas Fixas' : 'Adicionar Despesa Fixa'}
            </button>
          </div>

          {/* Despesas Existentes ou Informações */}
          {temDespesasFixas ? (
            <div className="despesas-existentes">
              {despesasFixasCarregadas.slice(0, 4).map((despesa) => {
                return (
                  <div key={despesa.id} className="preview-card-base">
                    <div className="despesa-icone">
                      <TrendingDown size={14} />
                    </div>
                    <div className="item-info-base">
                      <div className="despesa-nome">{despesa.descricao}</div>
                      <div className="despesa-categoria">{despesa.categoria_nome || 'Despesa fixa'}</div>
                    </div>
                    <div className="value-badge-base">
                      {formatCurrency(despesa.valor || 0)}
                    </div>
                  </div>
                );
              })}
              {despesasFixasCarregadas.length > 4 && (
                <div className="preview-card-base mais">
                  <div className="despesa-icone">
                    +{despesasFixasCarregadas.length - 4}
                  </div>
                  <div className="item-info-base">
                    <div className="despesa-nome">Mais despesas</div>
                    <div className="despesa-categoria">Ver todas</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item danger">
                <div className="info-icon">🏠</div>
                <div className="info-title">Moradia</div>
                <div className="info-text">Aluguel, financiamento</div>
              </div>

              <div className="info-item warning">
                <div className="info-icon">💡</div>
                <div className="info-title">Contas</div>
                <div className="info-text">Luz, água, internet</div>
              </div>

              <div className="info-item info">
                <div className="info-icon">🚗</div>
                <div className="info-title">Transporte</div>
                <div className="info-text">Combustível, seguro</div>
              </div>

              <div className="info-item success">
                <div className="info-icon">🏥</div>
                <div className="info-title">Saúde</div>
                <div className="info-text">Plano, medicamentos</div>
              </div>
            </div>
          )}

          {/* Resumo das despesas quando existem */}
          {temDespesasFixas && (
            <div className="resumo-despesas">
              <h4>📊 Resumo das suas despesas fixas:</h4>
              <div className="resumo-stats">
                <div className="stat-item">
                  <span className="stat-label">Total mensal:</span>
                  <span className="stat-value stat-danger">
                    {formatCurrency(valorTotalDespesas)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Média por despesa:</span>
                  <span className="stat-value">
                    {formatCurrency(despesasFixasCarregadas.length > 0 ? valorTotalDespesas / despesasFixasCarregadas.length : 0)}
                  </span>
                </div>
                {rendaTotal > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">% da renda comprometida:</span>
                    <span className={`stat-value ${percentualRenda > 60 ? 'stat-danger' : percentualRenda > 40 ? 'stat-warning' : 'stat-success'}`}>
                      {percentualRenda.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerta para etapa obrigatória */}
          {!temDespesasFixas && (
            <div className="alert-base">
              <div className="alerta-icon">⚠️</div>
              <div className="alerta-texto">
                <strong>Esta etapa é obrigatória</strong> para continuar o diagnóstico - 
                precisamos conhecer suas despesas fixas para análises precisas
              </div>
            </div>
          )}

          {/* Dicas sobre despesas fixas */}
          {!temDespesasFixas && (
            <div className="dica-despesas">
              <div className="dica-icon">💡</div>
              <div className="dica-texto">
                <strong>Dicas:</strong> Inclua apenas gastos que se repetem todo mês com o mesmo valor ou similar. 
                Despesas variáveis como supermercado não entram aqui!
              </div>
            </div>
          )}

          {/* Alertas baseados na análise financeira */}
          {temDespesasFixas && rendaTotal > 0 && (
            <div className={`alerta-situacao ${statusFinanceiro.cor}`}>
              <div className="alerta-icon">
                {statusFinanceiro.icone}
              </div>
              <div className="alerta-texto">
                {percentualRenda > 90 ? (
                  <>
                    <strong>Situação crítica:</strong> Suas despesas fixas consomem mais de 90% da renda. 
                    É urgente rever contratos e buscar alternativas para reduzir estes custos.
                  </>
                ) : percentualRenda > 70 ? (
                  <>
                    <strong>Atenção:</strong> Suas despesas fixas estão altas. Considere renegociar 
                    contratos ou buscar alternativas mais econômicas.
                  </>
                ) : percentualRenda > 50 ? (
                  <>
                    <strong>Cuidado:</strong> Suas despesas fixas estão no limite. Monitore para 
                    que não aumentem ainda mais.
                  </>
                ) : (
                  <>
                    <strong>Situação saudável:</strong> Suas despesas fixas estão em um patamar 
                    controlável, deixando margem para outros gastos e poupança.
                  </>
                )}
              </div>
            </div>
          )}

          {/* Loading overlay quando está carregando */}
          {loading && despesasFixasCarregadas.length > 0 && (
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
            disabled={!temDespesasFixas || loading || loadingTransacoes}
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

DespesasFixasEtapa.propTypes = {
  onContinuar: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
  etapaAtual: PropTypes.number,
  totalEtapas: PropTypes.number,
  dadosExistentes: PropTypes.object
};

export default DespesasFixasEtapa;