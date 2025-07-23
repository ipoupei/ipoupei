// src/modules/diagnostico/onboarding/etapa08_ResumoFinanceiro.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, DollarSign, PieChart, Target, AlertTriangle, Clock, Users, Banknote } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';
import { useTransactions } from '@modules/transacoes/store/transactionsStore';
import useAnaliseFinanceira from '@modules/diagnostico/hooks/useAnaliseFinanceira';

// CSS refatorado
import '@modules/diagnostico/styles/DiagnosticoOnboarding.css';

const ResumoFinanceiroEtapa = ({ 
  onContinuar, 
  onVoltar, 
  etapaAtual = 8, 
  totalEtapas = 11,
  dadosExistentes = null,
  todosDados = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [analiseCompleta, setAnaliseCompleta] = useState(false);

  // ✅ Hook para buscar transações (para análise avançada)
const { 
  transacoes, 
  loading: loadingTransacoes,
  fetchTransacoes // ✅ Adicionar esta função
} = useTransactions();

// ✅ ADICIONAR: Forçar carregamento das transações
useEffect(() => {
  console.log('🔄 Forçando carregamento de transações...');
  if (fetchTransacoes) {
    fetchTransacoes();
  }
}, [fetchTransacoes]);

useEffect(() => {
  console.log('🔍 DEBUG - Transações carregadas:', {
    totalTransacoes: transacoes?.length || 0,
    primeiraTransacao: transacoes?.[0],
    tiposTransacoes: transacoes?.map(t => t.tipo),
    datasTransacoes: transacoes?.map(t => t.data).slice(0, 5) // ✅ MUDAR AQUI
  });
}, [transacoes]);


  // ✅ Hook da análise financeira completa
  const { 
    analise, 
    loading: loadingAnalise, 
    elegibilidade,
    insightsRapidos 
  } = useAnaliseFinanceira(transacoes, {
    mesesAnalise: 3,
    percentualEconomiaSimulacao: 0.1,
    taxaInvestimento: 0.15
  });

  // Configuração de vídeos (mantido do código original)
  const videosConfig = {
    critica: {
      url: "https://www.youtube.com/embed/B6dQWtSoafc",
      titulo: "🚨 Situação Crítica - Como Reverter",
      subtitle: "Estratégias urgentes para equilibrar suas finanças"
    },
    atencao: {
      url: "https://www.youtube.com/embed/SydNs8r078w", 
      titulo: "⚠️ Melhorando sua Situação Financeira",
      subtitle: "Passos práticos para criar margem de segurança"
    },
    regular: {
      url: "https://www.youtube.com/embed/SydNs8r078w",
      titulo: "📊 Otimizando suas Finanças",
      subtitle: "Como evoluir para uma situação mais saudável"
    },
    boa: {
      url: "https://www.youtube.com/embed/BuPAjxiOjBw",
      titulo: "✅ Maximizando seu Potencial Financeiro", 
      subtitle: "Estratégias de investimento e crescimento"
    }
  };

  // Processar dados do diagnóstico (mantido do código original)
  const resumoFinanceiro = useMemo(() => {
    console.log('📊 Processando dados para resumo:', todosDados);

    const receitas = todosDados.receitas || {};
    const despesasFixas = todosDados.despesas_fixas || {};
    const despesasVariaveis = todosDados.despesas_variaveis || {};
    const cartoes = todosDados.cartoes || {};
    const contas = todosDados.contas || {};

    // ✅ CORREÇÃO: Incluir despesas de cartão
    const despesasCartao = todosDados.despesas_cartao || {};

    const totalReceitas = receitas.valorTotalReceitas || 0;
    const totalDespesasFixas = despesasFixas.valorTotalDespesasFixas || 0;
    const totalDespesasVariaveis = (despesasVariaveis.valorTotalCombinado || despesasVariaveis.valorTotalEstimativas || 0);
    const totalDespesasCartao = despesasCartao.valorTotalDespesas || 0;
    const totalDespesas = totalDespesasFixas + totalDespesasVariaveis + totalDespesasCartao;
    const saldoMensal = totalReceitas - totalDespesas;

    const percentualDespesasFixas = totalReceitas > 0 ? (totalDespesasFixas / totalReceitas) * 100 : 0;
    const percentualDespesasVariaveis = totalReceitas > 0 ? (totalDespesasVariaveis / totalReceitas) * 100 : 0;
    const percentualDespesasCartao = totalReceitas > 0 ? (totalDespesasCartao / totalReceitas) * 100 : 0;
    const percentualSobra = totalReceitas > 0 ? (saldoMensal / totalReceitas) * 100 : 0;

    const getSituacaoFinanceira = () => {
      if (saldoMensal < 0) {
        return {
          status: 'critica',
          icone: '🚨',
          titulo: 'Situação Crítica',
          descricao: 'Suas despesas excedem sua renda',
          cor: 'danger',
          videoConfig: videosConfig.critica
        };
      } else if (percentualSobra < 10) {
        return {
          status: 'atencao',
          icone: '⚠️',
          titulo: 'Necessita Atenção',
          descricao: 'Pouca margem para emergências',
          cor: 'warning',
          videoConfig: videosConfig.atencao
        };
      } else if (percentualSobra < 20) {
        return {
          status: 'regular',
          icone: '📊',
          titulo: 'Situação Regular',
          descricao: 'Há espaço para melhorias',
          cor: 'info',
          videoConfig: videosConfig.regular
        };
      } else {
        return {
          status: 'boa',
          icone: '✅',
          titulo: 'Situação Saudável',
          descricao: 'Boa margem para poupança e investimentos',
          cor: 'success',
          videoConfig: videosConfig.boa
        };
      }
    };

    const situacao = getSituacaoFinanceira();

    const getRecomendacoes = () => {
      const recomendacoes = [];

      if (percentualDespesasFixas > 60) {
        recomendacoes.push({
          tipo: 'despesas_fixas',
          icone: '🏠',
          titulo: 'Revisar Despesas Fixas',
          descricao: 'Suas despesas fixas estão muito altas (acima de 60% da renda)',
          prioridade: 'alta'
        });
      }

      if (percentualDespesasVariaveis > 30) {
        recomendacoes.push({
          tipo: 'despesas_variaveis',
          icone: '🛒',
          titulo: 'Controlar Gastos Variáveis',
          descricao: 'Oportunidade de economia nos gastos variáveis',
          prioridade: 'media'
        });
      }

      if (percentualDespesasCartao > 30) {
        recomendacoes.push({
          tipo: 'despesas_cartao',
          icone: '💳',
          titulo: 'Reduzir Uso do Cartão',
          descricao: 'Parcelas do cartão estão comprometendo muito da renda',
          prioridade: 'alta'
        });
      }

      if (saldoMensal > 0 && percentualSobra >= 20) {
        recomendacoes.push({
          tipo: 'investimentos',
          icone: '📈',
          titulo: 'Começar a Investir',
          descricao: 'Você tem uma boa margem para iniciar investimentos',
          prioridade: 'baixa'
        });
      }

      if (saldoMensal > 0 && !recomendacoes.find(r => r.tipo === 'emergencia')) {
        recomendacoes.push({
          tipo: 'emergencia',
          icone: '🛡️',
          titulo: 'Reserva de Emergência',
          descricao: 'Crie uma reserva equivalente a 6 meses de despesas',
          prioridade: 'alta'
        });
      }

      return recomendacoes;
    };

    return {
      receitas: {
        total: totalReceitas,
        fontes: receitas.totalReceitas || 0
      },
      despesas: {
        fixas: totalDespesasFixas,
        variaveis: totalDespesasVariaveis,
        cartao: totalDespesasCartao,
        total: totalDespesas
      },
      saldo: saldoMensal,
      percentuais: {
        despesasFixas: percentualDespesasFixas,
        despesasVariaveis: percentualDespesasVariaveis,
        despesasCartao: percentualDespesasCartao,
        sobra: percentualSobra
      },
      situacao,
      recomendacoes: getRecomendacoes(),
      patrimonio: {
        contas: contas.totalContas || 0,
        cartoes: cartoes.totalCartoes || 0
      }
    };
  }, [todosDados]);

  // Simular análise completa após 2 segundos (mantido)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnaliseCompleta(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinuar = useCallback(() => {
    setLoading(true);
    
    const dadosResumo = {
      resumoCalculado: resumoFinanceiro,
      analiseAvancada: analise || null,
      analiseCompleta: true,
      geradoEm: new Date().toISOString()
    };
    
    console.log('✅ Resumo financeiro gerado:', dadosResumo);
    
    setTimeout(() => {
      onContinuar(dadosResumo);
      setLoading(false);
    }, 1000);
  }, [resumoFinanceiro, analise, onContinuar]);

  const progressoPercentual = Math.round(((etapaAtual + 1) / totalEtapas) * 100);

  const etapas = [
    { numero: 1, nome: 'Intro', ativa: false, completa: true },
    { numero: 2, nome: 'Categorias', ativa: false, completa: true },
    { numero: 3, nome: 'Contas', ativa: false, completa: true },
    { numero: 4, nome: 'Cartões', ativa: false, completa: true },
    { numero: 5, nome: 'Desp.Cartão', ativa: false, completa: true },
    { numero: 6, nome: 'Receitas', ativa: false, completa: true },
    { numero: 7, nome: 'Desp.Fixas', ativa: false, completa: true },
    { numero: 8, nome: 'Desp.Variáveis', ativa: false, completa: true },
    { numero: 9, nome: 'Resumo', ativa: true, completa: false },
    { numero: 10, nome: 'Metas', ativa: false, completa: false },
    { numero: 11, nome: 'Fim', ativa: false, completa: false }
  ];

  if (!analiseCompleta) {
    return (
      <div className="diagnostico-container">
        <div className="diagnostico-header">
          <div className="header-row">
            <div className="header-title">Analisando...</div>
            <div className="header-progress">Processando dados</div>
          </div>
        </div>
        <div className="diagnostico-main">
          <div className="main-icon">🔄</div>
          <h1 className="main-title">Analisando sua situação financeira...</h1>
          <p className="main-subtitle">Aguarde enquanto processamos todas as informações</p>
          <div className="loading-spinner"></div>
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
              <h3 className="video-title">{resumoFinanceiro.situacao.videoConfig.titulo}</h3>
              <p className="video-subtitle">{resumoFinanceiro.situacao.videoConfig.subtitle}</p>
            </div>

            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src={resumoFinanceiro.situacao.videoConfig.url}
                title={`Tutorial: ${resumoFinanceiro.situacao.titulo}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="video-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span className="benefit-text">Análise detalhada</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">💡</span>
                <span className="benefit-text">Dicas personalizadas</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span className="benefit-text">Próximos passos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo à Direita */}
        <div className="diagnostico-content-right">
          <div className="main-icon">📊</div>
          <h1 className="main-title">Seu Diagnóstico Financeiro Completo</h1>
          <p className="main-subtitle">Análise completa da sua situação atual e projeções futuras</p>
          <p className="main-description">
            Com base em todas as informações coletadas, preparamos uma análise 
            personalizada da sua situação financeira, projeções e simulações.
          </p>

          {/* Status da Situação Financeira */}
          <div className={`status-card ${resumoFinanceiro.situacao.cor}`}>
            <div className="status-icon">
              {resumoFinanceiro.situacao.icone}
            </div>
            <div className="status-info">
              <h3>{resumoFinanceiro.situacao.titulo}</h3>
              <p>{resumoFinanceiro.situacao.descricao}</p>
            </div>
            <div className="status-valor">
              <div className="valor-principal">
                {formatCurrency(resumoFinanceiro.saldo)}
              </div>
              <div className="valor-legenda">
                Saldo mensal
              </div>
            </div>
          </div>

          {/* Cards Resumo Financeiro */}
          <div className="resumo-cards-grid">
            
            <div className="preview-card-base receitas">
              <div className="card-header-mini">
                <div className="card-icon-mini">
                  <TrendingUp size={16} />
                </div>
                <h4>Receitas</h4>
              </div>
              <div className="card-valor-mini">
                {formatCurrency(resumoFinanceiro.receitas.total)}
              </div>
            </div>

            <div className="preview-card-base despesas-fixas">
              <div className="card-header-mini">
                <div className="card-icon-mini">
                  <TrendingDown size={16} />
                </div>
                <h4>Fixas</h4>
              </div>
              <div className="card-valor-mini">
                {formatCurrency(resumoFinanceiro.despesas.fixas)}
              </div>
            </div>

            <div className="preview-card-base despesas-variaveis">
              <div className="card-header-mini">
                <div className="card-icon-mini">
                  <PieChart size={16} />
                </div>
                <h4>Variáveis</h4>
              </div>
              <div className="card-valor-mini">
                {formatCurrency(resumoFinanceiro.despesas.variaveis)}
              </div>
            </div>

            {/* ✅ NOVO: Card Despesas Cartão */}
            <div className="preview-card-base cartao">
              <div className="card-header-mini">
                <div className="card-icon-mini">
                  <Target size={16} />
                </div>
                <h4>Cartão</h4>
              </div>
              <div className="card-valor-mini">
                {formatCurrency(resumoFinanceiro.despesas.cartao)}
              </div>
            </div>

            <div className={`preview-card-base saldo ${resumoFinanceiro.saldo >= 0 ? 'positivo' : 'negativo'}`}>
              <div className="card-header-mini">
                <div className="card-icon-mini">
                  <DollarSign size={16} />
                </div>
                <h4>Saldo</h4>
              </div>
              <div className="card-valor-mini">
                {formatCurrency(Math.abs(resumoFinanceiro.saldo))}
              </div>
            </div>

          </div>

          {/* ===== 1. SAÚDE FINANCEIRA DETALHADA ===== */}
          {analise && (
            <div className="analise-section saude-financeira">
              <h3 className="section-title">💚 Saúde Financeira Detalhada</h3>
              
              <div className={`saude-card ${analise.saudeFinanceira.status.cor}`}>
                <div className="saude-status">
                  <span className="status-icon-large">{analise.saudeFinanceira.status.icone}</span>
                  <div className="status-info">
                    <h4>{analise.saudeFinanceira.status.titulo}</h4>
                    <p>{analise.saudeFinanceira.status.descricao}</p>
                  </div>
                </div>
                
                <div className="saude-metricas-grid">
                  <div className="metrica-card">
                    <div className="metrica-valor">{formatCurrency(analise.saudeFinanceira.saldo)}</div>
                    <div className="metrica-label">Sobra/Déficit Mensal</div>
                  </div>
                  <div className="metrica-card">
                    <div className="metrica-valor">{analise.saudeFinanceira.comprometimento.toFixed(1)}%</div>
                    <div className="metrica-label">Da Renda Comprometida</div>
                  </div>
                  <div className="metrica-card">
                    <div className="metrica-valor">{analise.saudeFinanceira.diasTrabalhadosParaDespesas}</div>
                    <div className="metrica-label">Dias Trabalhados p/ Despesas</div>
                  </div>
                  <div className="metrica-card">
                    <div className="metrica-valor">{analise.saudeFinanceira.taxaPoupanca.toFixed(1)}%</div>
                    <div className="metrica-label">Taxa de Poupança</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== 2. CATEGORIAS COM MAIOR GASTO ===== */}
          {analise && analise.categorias.principais.length > 0 && (
            <div className="analise-section categorias-gastos">
              <h3 className="section-title">🏷️ Onde Seu Dinheiro Vai</h3>
              <p className="section-subtitle">
                Principais categorias ({analise.categorias.principais.length} de {analise.categorias.totalCategorias}) - 
                representam {analise.categorias.representatividadePrincipais.toFixed(1)}% das suas despesas
              </p>
              
              <div className="categorias-grid">
                {analise.categorias.principais.slice(0, 6).map((categoria, index) => (
                  <div key={categoria.nome} className="categoria-card">
                    <div className="categoria-rank">#{index + 1}</div>
                    <div className="categoria-info">
                      <span className="categoria-icone">{categoria.icone}</span>
                      <div className="categoria-detalhes">
                        <h4>{categoria.nome}</h4>
                        <div className="categoria-valores">
                          <div className="valor-principal">{formatCurrency(categoria.valorMedio)}</div>
                          <div className="valor-detalhes">
                            <span>{categoria.percentualRenda.toFixed(1)}% da renda</span>
                            <span>•</span>
                            <span><Clock size={12} /> {categoria.horasTrabalho}h trabalho</span>
                            <span>•</span>
                            <span>{categoria.quantidade} transações</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 3. PROJEÇÃO DE FUTURO ===== */}
          {analise && (
            <div className="analise-section projecao-futuro">
              <h3 className="section-title">🔮 Sua Projeção Financeira</h3>
              <p className="section-subtitle">
                Se você mantiver o padrão atual de gastos e receitas
              </p>
              
              <div className="projecao-timeline">
                <div className="periodo-card">
                  <h4>6 Meses</h4>
                  <div className={`valor ${analise.projecao.em6Meses >= 0 ? 'positivo' : 'negativo'}`}>
                    {formatCurrency(analise.projecao.em6Meses)}
                  </div>
                  <div className="tendencia">
                    {analise.projecao.em6Meses >= 0 ? '📈 Acumulando' : '📉 Endividando'}
                  </div>
                </div>
                <div className="periodo-card">
                  <h4>1 Ano</h4>
                  <div className={`valor ${analise.projecao.em12Meses >= 0 ? 'positivo' : 'negativo'}`}>
                    {formatCurrency(analise.projecao.em12Meses)}
                  </div>
                  <div className="tendencia">
                    {analise.projecao.tendencia === 'crescimento' ? '📈 Crescendo' : '📉 Decrescendo'}
                  </div>
                </div>
                <div className="periodo-card">
                  <h4>2 Anos</h4>
                  <div className={`valor ${analise.projecao.em24Meses >= 0 ? 'positivo' : 'negativo'}`}>
                    {formatCurrency(analise.projecao.em24Meses)}
                  </div>
                  <div className="tendencia">
                    {Math.abs(analise.projecao.em24Meses) > Math.abs(analise.projecao.em12Meses) ? '⚡ Acelerando' : '🐌 Desacelerando'}
                  </div>
                </div>
              </div>
              
              {analise.projecao.tendencia === 'endividamento' && (
                <div className="alerta-endividamento">
                  <span className="alerta-icon">⚠️</span>
                  <div>
                    <strong>Atenção:</strong> Mantendo esse padrão, você pode acumular dívidas. 
                    Considere revisar seus gastos principais.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== 4. SIMULAÇÃO DE ECONOMIA + INVESTIMENTO ===== */}
          {analise && (
            <div className="analise-section simulacao-economia">
              <h3 className="section-title">💎 Poder da Economia + Investimento</h3>
              <p className="section-subtitle">
                Se você economizar 10% das suas despesas ({formatCurrency(analise.simulacao.premissas.economiaMonsal)}/mês) 
                e investir com rendimento de 15% ao ano
              </p>
              
              <div className="simulacao-grid">
                {analise.simulacao.projecoes.map(projecao => (
                  <div key={projecao.anos} className="simulacao-card">
                    <h4>{projecao.anos} anos</h4>
                    <div className="simulacao-valores">
                      <div className="valor-investido">
                        <span className="label">Você investiu</span>
                        <span className="valor">{formatCurrency(projecao.valorInvestido)}</span>
                      </div>
                      <div className="valor-final">
                        <span className="label">Você terá</span>
                        <span className="valor destaque">{formatCurrency(projecao.montanteFinal)}</span>
                      </div>
                      <div className="rendimento">
                        <span className="label">Rendimento</span>
                        <span className="valor positivo">+{formatCurrency(projecao.rendimento)}</span>
                      </div>
                      <div className="multiplicador">
                        Seu dinheiro multiplicou <strong>{projecao.multiplicador.toFixed(1)}x</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="economia-destaque">
                <h4>💡 Impacto Imediato da Economia</h4>
                <div className="impactos-grid">
                  <div className="impacto">
                    <span className="valor">+{formatCurrency(analise.simulacao.impactoImediato.sobraMensalExtra)}</span>
                    <span className="label">Extra por mês</span>
                  </div>
                  <div className="impacto">
                    <span className="valor">+{formatCurrency(analise.simulacao.impactoImediato.emUmAno)}</span>
                    <span className="label">Em 1 ano (com juros)</span>
                  </div>
                  <div className="impacto">
                    <span className="valor">{analise.simulacao.impactoImediato.tempoParaDobrar.toFixed(1)} anos</span>
                    <span className="label">Para dobrar o dinheiro</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Distribuição Visual */}
          <div className="distribuicao-visual-compact">
            <h4>📈 Distribuição da sua renda:</h4>
            <div className="barra-distribuicao">
              <div 
                className="segmento despesas-fixas"
                style={{ width: `${resumoFinanceiro.percentuais.despesasFixas}%` }}
                title={`Despesas Fixas: ${resumoFinanceiro.percentuais.despesasFixas.toFixed(1)}%`}
              />
              <div 
                className="segmento despesas-variaveis"
                style={{ width: `${resumoFinanceiro.percentuais.despesasVariaveis}%` }}
                title={`Despesas Variáveis: ${resumoFinanceiro.percentuais.despesasVariaveis.toFixed(1)}%`}
              />
              <div 
                className="segmento cartao"
                style={{ width: `${resumoFinanceiro.percentuais.despesasCartao}%` }}
                title={`Cartão: ${resumoFinanceiro.percentuais.despesasCartao.toFixed(1)}%`}
              />
              <div 
                className={`segmento sobra ${resumoFinanceiro.saldo >= 0 ? 'positiva' : 'negativa'}`}
                style={{ width: `${Math.abs(resumoFinanceiro.percentuais.sobra)}%` }}
                title={`${resumoFinanceiro.saldo >= 0 ? 'Sobra' : 'Déficit'}: ${Math.abs(resumoFinanceiro.percentuais.sobra).toFixed(1)}%`}
              />
            </div>
            <div className="percentuais-row">
              <span className="percentual-item">
                Fixas: {resumoFinanceiro.percentuais.despesasFixas.toFixed(1)}%
              </span>
              <span className="percentual-item">
                Variáveis: {resumoFinanceiro.percentuais.despesasVariaveis.toFixed(1)}%
              </span>
              <span className="percentual-item">
                Cartão: {resumoFinanceiro.percentuais.despesasCartao.toFixed(1)}%
</span>
<span className="percentual-item">
{resumoFinanceiro.saldo >= 0 ? 'Sobra' : 'Déficit'}: {Math.abs(resumoFinanceiro.percentuais.sobra).toFixed(1)}%
</span>
</div>
</div>
{/* Recomendações Principais */}
      {resumoFinanceiro.recomendacoes.length > 0 && (
        <div className="recomendacoes-compact">
          <h4>💡 Principais recomendações:</h4>
          <div className="recomendacoes-lista">
            {resumoFinanceiro.recomendacoes.slice(0, 3).map((rec, index) => (
              <div key={index} className={`recomendacao-item ${rec.prioridade}`}>
                <span className="rec-icon-small">{rec.icone}</span>
                <div className="rec-texto">
                  <strong>{rec.titulo}</strong>
                  <p>{rec.descricao}</p>
                </div>
                <div className={`rec-badge ${rec.prioridade}`}>
                  {rec.prioridade}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos Passos */}
      <div className="proximos-passos-compact">
        <h4>🎯 Seus próximos passos:</h4>
        <div className="passos-grid">
          <div className="passo-mini">
            <div className="passo-numero-mini">1</div>
            <div className="passo-texto-mini">
              <strong>Complete o diagnóstico</strong>
              <span>Defina suas metas financeiras</span>
            </div>
          </div>
          <div className="passo-mini">
            <div className="passo-numero-mini">2</div>
            <div className="passo-texto-mini">
              <strong>Use o painel do iPoupei</strong>
              <span>Acompanhe seus gastos diários</span>
            </div>
          </div>
          <div className="passo-mini">
            <div className="passo-numero-mini">3</div>
            <div className="passo-texto-mini">
              <strong>Implemente melhorias</strong>
              <span>Siga as recomendações personalizadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== INSIGHTS RÁPIDOS ===== */}
      {insightsRapidos.length > 0 && (
        <div className="insights-rapidos">
          <h4>⚡ Insights Importantes:</h4>
          <div className="insights-lista">
            {insightsRapidos.map((insight, index) => (
              <div key={index} className={`insight-item ${insight.tipo}`}>
                <span className="insight-icon">{insight.icone}</span>
                <div className="insight-texto">
                  <strong>{insight.titulo}</strong>
                  <p>{insight.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status da Análise Avançada */}
      {!elegibilidade.elegivel && (
        <div className="info-analise-avancada">
          <div className="info-icon">ℹ️</div>
          <div className="info-texto">
            <strong>Análise Avançada</strong>
            <p>
              {elegibilidade.motivo}. Continue usando o iPoupei para desbloquear 
              análises mais detalhadas com base nas suas transações reais.
            </p>
            <div className="progresso-analise">
              <div className="progresso-bar">
                <div 
                  className="progresso-fill"
                  style={{ width: `${elegibilidade.progresso * 100}%` }}
                />
              </div>
              <span className="progresso-texto">
                {Math.round(elegibilidade.progresso * 100)}% completo
              </span>
            </div>
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
        disabled={loading}
        className="btn-back"
      >
        <ArrowLeft size={12} />
        Voltar
      </button>
    </div>
    
    <div className="nav-right">
      <button
        onClick={handleContinuar}
        disabled={loading}
        className="btn-continue"
      >
        {loading ? (
          <>
            <div className="loading-spinner-small"></div>
            Salvando...
          </>
        ) : (
          <>
            Continuar
            <ArrowRight size={12} />
          </>
        )}
      </button>
    </div>
  </div>

</div>
);
};
ResumoFinanceiroEtapa.propTypes = {
onContinuar: PropTypes.func.isRequired,
onVoltar: PropTypes.func.isRequired,
etapaAtual: PropTypes.number,
totalEtapas: PropTypes.number,
dadosExistentes: PropTypes.object,
todosDados: PropTypes.object
};
export default ResumoFinanceiroEtapa;