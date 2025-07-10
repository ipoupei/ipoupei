// src/modules/diagnostico/onboarding/etapa08_ResumoFinanceiro.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, DollarSign, PieChart, Target, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatCurrency';

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

  // Processar todos os dados coletados para gerar o resumo
  const resumoFinanceiro = useMemo(() => {
    console.log('📊 Processando dados para resumo:', todosDados);

    // Extrair dados das etapas anteriores
    const receitas = todosDados.receitas || {};
    const despesasFixas = todosDados.despesas_fixas || {};
    const despesasVariaveis = todosDados.despesas_variaveis || {};
    const cartoes = todosDados.cartoes || {};
    const contas = todosDados.contas || {};

    // Calcular valores
    const totalReceitas = receitas.valorTotalReceitas || 0;
    const totalDespesasFixas = despesasFixas.valorTotalDespesasFixas || 0;
    const totalDespesasVariaveis = (despesasVariaveis.valorTotalCombinado || despesasVariaveis.valorTotalEstimativas || 0);
    const totalDespesas = totalDespesasFixas + totalDespesasVariaveis;
    const saldoMensal = totalReceitas - totalDespesas;

    // Percentuais
    const percentualDespesasFixas = totalReceitas > 0 ? (totalDespesasFixas / totalReceitas) * 100 : 0;
    const percentualDespesasVariaveis = totalReceitas > 0 ? (totalDespesasVariaveis / totalReceitas) * 100 : 0;
    const percentualSobra = totalReceitas > 0 ? (saldoMensal / totalReceitas) * 100 : 0;

    // Análise da situação financeira
    const getSituacaoFinanceira = () => {
      if (saldoMensal < 0) {
        return {
          status: 'critica',
          icone: '🚨',
          titulo: 'Situação Crítica',
          descricao: 'Suas despesas excedem sua renda',
          cor: 'danger'
        };
      } else if (percentualSobra < 10) {
        return {
          status: 'atencao',
          icone: '⚠️',
          titulo: 'Necessita Atenção',
          descricao: 'Pouca margem para emergências',
          cor: 'warning'
        };
      } else if (percentualSobra < 20) {
        return {
          status: 'regular',
          icone: '📊',
          titulo: 'Situação Regular',
          descricao: 'Há espaço para melhorias',
          cor: 'info'
        };
      } else {
        return {
          status: 'boa',
          icone: '✅',
          titulo: 'Situação Saudável',
          descricao: 'Boa margem para poupança e investimentos',
          cor: 'success'
        };
      }
    };

    const situacao = getSituacaoFinanceira();

    // Recomendações personalizadas
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
        total: totalDespesas
      },
      saldo: saldoMensal,
      percentuais: {
        despesasFixas: percentualDespesasFixas,
        despesasVariaveis: percentualDespesasVariaveis,
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

  // Simular análise completa após 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnaliseCompleta(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinuar = useCallback(() => {
    setLoading(true);
    
    // Dados do resumo para salvar
    const dadosResumo = {
      resumoCalculado: resumoFinanceiro,
      analiseCompleta: true,
      geradoEm: new Date().toISOString()
    };
    
    console.log('✅ Resumo financeiro gerado:', dadosResumo);
    
    setTimeout(() => {
      onContinuar(dadosResumo);
      setLoading(false);
    }, 1000);
  }, [resumoFinanceiro, onContinuar]);

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
              <h3 className="video-title">🎬 Interpretando seu resumo</h3>
              <p className="video-subtitle">Entenda os resultados em 5 minutos</p>
            </div>
            
            <div className="video-embed">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/AouQXjW93Bg"
                title="Tutorial: Como interpretar seu diagnóstico financeiro"
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
          <h1 className="main-title">Seu Diagnóstico Financeiro</h1>
          <p className="main-subtitle">Análise completa da sua situação atual</p>
          <p className="main-description">
            Com base em todas as informações coletadas, preparamos uma análise 
            personalizada da sua situação financeira e recomendações específicas.
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
            
            {/* Card Receitas */}
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

            {/* Card Despesas Fixas */}
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

            {/* Card Despesas Variáveis */}
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

            {/* Card Saldo */}
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