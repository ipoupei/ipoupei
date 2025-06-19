import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Calendar, TrendingUp, TrendingDown, Award, AlertTriangle, CheckCircle, 
  Target, DollarSign, CreditCard, ChevronRight, ChevronDown, 
  ArrowLeft, Eye, EyeOff, Zap, Plus, Minus, RotateCcw, RefreshCw,
  FileText
} from 'lucide-react';
import useCartoes from '../hooks/useCartoes';
import useCartoesStore from '../store/cartoesStore';
import useFaturaOperations from '../hooks/useFaturaOperations';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import ModalPagamentoFatura from './ModalPagamentoFatura';
import ModalReabrirFatura from './ModalReabrirFatura';
import ModalEstornoCartao from './ModalEstornoCartao';
import '../styles/GestaoCartoes.css';

const GestaoCartoes = () => {
  const {
    cartoes,
    faturaDetalhada,
    isLoading,
    fetchCartoes,
    fetchFaturaDetalhada,
    exportarCartoes,
    fetchFaturasDisponiveis
  } = useCartoes();

  const {
    visualizacao,
    cartaoSelecionado,
    filtroCategoria,
    mostrarValores,
    parcelasExpandidas,
    setVisualizacao,
    setCartaoSelecionado,
    setFiltroCategoria,
    toggleMostrarValores,
    toggleParcela,
    resetFiltros
  } = useCartoesStore();

  const { verificarStatusFatura } = useFaturaOperations();

  const [transacoesAgrupadas, setTransacoesAgrupadas] = useState([]);
  const [faturaStatus, setFaturaStatus] = useState({ faturaEstaPaga: false });
  const [faturasDisponiveis, setFaturasDisponiveis] = useState([]);
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  
  // Estados dos modais
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalReabertura, setModalReabertura] = useState(false);
  const [modalEstorno, setModalEstorno] = useState(false);

  useEffect(() => {
    fetchCartoes();
  }, [fetchCartoes]);

  useEffect(() => {
    if (cartaoSelecionado && visualizacao === 'detalhada') {
      carregarFaturasDisponiveis();
    }
  }, [cartaoSelecionado, visualizacao]);

  useEffect(() => {
    if (faturaSelecionada && cartaoSelecionado) {
      // ✅ NOVO: Usar fatura_vencimento como parâmetro principal
      fetchFaturaDetalhada(cartaoSelecionado.id, faturaSelecionada.fatura_vencimento);
      verificarStatusFaturaAtual();
    }
  }, [faturaSelecionada, cartaoSelecionado, fetchFaturaDetalhada]);

  useEffect(() => {
    if (faturaDetalhada?.transacoes && filtroCategoria) {
      const transacoesFiltradas = filtroCategoria === 'Todas' 
        ? faturaDetalhada.transacoes 
        : faturaDetalhada.transacoes.filter(t => t.categoria === filtroCategoria);

      const agrupadas = agruparTransacoesPorParcelas(transacoesFiltradas);
      setTransacoesAgrupadas(agrupadas);
    }
  }, [faturaDetalhada, filtroCategoria]);

  // ✅ REFATORADO: Carregar faturas disponíveis usando nova RPC
  const carregarFaturasDisponiveis = async () => {
    try {
      const faturas = await fetchFaturasDisponiveis(cartaoSelecionado.id);
      setFaturasDisponiveis(faturas);
      
      // ✅ NOVO: Selecionar automaticamente a primeira fatura em aberto (mais antiga) ou a mais antiga disponível
      const faturaAbertaMaisAntiga = faturas
        .filter(f => f.status === 'aberta')
        .sort((a, b) => new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento))[0]; // Mais antiga primeiro
      
      const faturaParaSelecionar = faturaAbertaMaisAntiga || faturas[0]; // Primeira da lista (mais antiga)
      
      if (faturaParaSelecionar) {
        setFaturaSelecionada(faturaParaSelecionar);
      }
    } catch (error) {
      console.error('Erro ao carregar faturas disponíveis:', error);
      // Fallback para dados padrão
      const dataAtual = new Date();
      const proximoVencimento = calcularProximoVencimento(cartaoSelecionado.dia_vencimento);
      const mesNomeCompleto = dataAtual.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      const faturaDefault = {
        fatura_vencimento: proximoVencimento,
        mes: dataAtual.getMonth() + 1,
        ano: dataAtual.getFullYear(),
        mes_nome: mesNomeCompleto.charAt(0).toUpperCase() + mesNomeCompleto.slice(1),
        status: 'aberta',
        valor_total: cartaoSelecionado?.fatura_atual || 0
      };
      setFaturasDisponiveis([faturaDefault]);
      setFaturaSelecionada(faturaDefault);
    }
  };

  // ✅ REFATORADO: Verificar status usando fatura_vencimento
  const verificarStatusFaturaAtual = async () => {
    if (cartaoSelecionado && faturaSelecionada) {
      const status = await verificarStatusFatura(
        cartaoSelecionado.id, 
        faturaSelecionada.fatura_vencimento
      );
      setFaturaStatus(status);
    }
  };

  const agruparTransacoesPorParcelas = (transacoes) => {
    const agrupadas = [];
    const processados = new Set();

    transacoes.forEach(transacao => {
      if (processados.has(transacao.id)) return;

      if (transacao.grupo_parcelamento) {
        const parcelasDoGrupo = transacoes.filter(t => 
          t.grupo_parcelamento === transacao.grupo_parcelamento
        );
        
        const parcelaAtual = parcelasDoGrupo.find(t => t.status !== 'Futura');
        if (parcelaAtual) {
          agrupadas.push({
            ...parcelaAtual,
            parcelas: parcelasDoGrupo,
            temParcelas: true
          });
          parcelasDoGrupo.forEach(p => processados.add(p.id));
        }
      } else {
        agrupadas.push(transacao);
        processados.add(transacao.id);
      }
    });

    return agrupadas;
  };

  const calcularDiasVencimento = (dataVencimento) => {
    if (!dataVencimento) return 0;
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
    return diasRestantes;
  };

  // ✅ NOVO: Calcular próximo vencimento (função auxiliar)
  const calcularProximoVencimento = (diaVencimento, dataReferencia = new Date()) => {
    const proximoVencimento = new Date(dataReferencia);
    proximoVencimento.setDate(diaVencimento || 15);
    proximoVencimento.setHours(23, 59, 59, 999);

    if (proximoVencimento < dataReferencia) {
      proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
    }

    return proximoVencimento.toISOString().split('T')[0];
  };

  const formatarValorComPrivacidade = (valor) => {
    if (!mostrarValores) return "••••••";
    return formatCurrency(valor || 0);
  };

  const handleVerDetalheCartao = (cartao) => {
    setCartaoSelecionado(cartao);
    setVisualizacao('detalhada');
  };

  const handleVoltarConsolidada = () => {
    setVisualizacao('consolidada');
    setCartaoSelecionado(null);
    setFaturaSelecionada(null);
    resetFiltros();
  };

  const handleTrocarCartao = (cartaoId) => {
    const novoCartao = cartoes.find(c => c.id === cartaoId);
    if (novoCartao) {
      setCartaoSelecionado(novoCartao);
      setFaturaSelecionada(null); // Reset fatura quando trocar cartão
    }
  };

  // ✅ REFATORADO: Trocar fatura usando fatura_vencimento como chave
  const handleTrocarFatura = (faturaVencimento) => {
    const novaFatura = faturasDisponiveis.find(f => 
      f.fatura_vencimento === faturaVencimento
    );
    if (novaFatura) {
      setFaturaSelecionada(novaFatura);
      // Os dados serão atualizados automaticamente pelo useEffect
    }
  };

  const handleSuccessOperacao = () => {
    // Recarregar dados após operação bem-sucedida
    fetchCartoes();
    if (cartaoSelecionado && faturaSelecionada) {
      fetchFaturaDetalhada(cartaoSelecionado.id, faturaSelecionada.fatura_vencimento);
      verificarStatusFaturaAtual();
    }
  };

  // ✅ REFATORADO: Calcular totais usando os novos campos
  const calcularTotais = () => {
    if (!cartoes?.length) return { totalCartoes: 0, cartoesAtivos: 0, proximoVencimento: 0 };

    const totalCartoes = cartoes.reduce((total, cartao) => total + (cartao.fatura_atual || 0), 0);
    const cartoesAtivos = cartoes.filter(c => c.ativo).length;
    
    // ✅ CORRIGIDO: Usar fatura_vencimento_atual ou vencimento
    const vencimentos = cartoes
      .map(c => c.fatura_vencimento_atual || c.vencimento)
      .filter(v => v)
      .map(v => calcularDiasVencimento(v));
    
    const proximoVencimento = vencimentos.length > 0 ? Math.min(...vencimentos) : 0;

    return { totalCartoes, cartoesAtivos, proximoVencimento };
  };

  // ✅ REFATORADO: Status baseado no limite usado real
  const obterStatusUtilizacao = (percentual) => {
    if (percentual <= 30) return 'status-verde';
    if (percentual <= 60) return 'status-amarelo';
    return 'status-vermelho';
  };

  const obterStatusVencimento = (dias) => {
    if (dias > 7) return { classe: 'status-verde', texto: 'No Prazo' };
    if (dias > 3) return { classe: 'status-amarelo', texto: 'Atenção' };
    return { classe: 'status-vermelho', texto: 'Urgente' };
  };

  if (isLoading) {
    return (
      <div className="gestao-cartoes">
        <div className="gestao-cartoes__loading">
          <div className="skeleton skeleton--header"></div>
          <div className="skeleton-grid">
            <div className="skeleton skeleton--card"></div>
            <div className="skeleton skeleton--card"></div>
            <div className="skeleton skeleton--card"></div>
          </div>
        </div>
      </div>
    );
  }

  if (visualizacao === 'consolidada') {
    const { totalCartoes, cartoesAtivos, proximoVencimento } = calcularTotais();

    return (
      <div className="gestao-cartoes">
        {/* Header */}
        <div className="gestao-cartoes__header">
          <div className="gestao-cartoes__header-content">
            <div className="gestao-cartoes__title">
              <h1 className="gestao-cartoes__main-title">Gestão de Cartões</h1>
              <p className="gestao-cartoes__subtitle">Visão consolidada das suas faturas</p>
            </div>
            <div className="gestao-cartoes__actions">
              <button
                className="gestao-cartoes__btn gestao-cartoes__btn--secondary"
                onClick={toggleMostrarValores}
              >
                {mostrarValores ? <Eye className="icon" /> : <EyeOff className="icon" />}
                {mostrarValores ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                className="gestao-cartoes__btn gestao-cartoes__btn--secondary"
                onClick={exportarCartoes}
              >
                <FileText className="icon" />
                Exportar Tudo
              </button>
            </div>
          </div>
        </div>

        <div className="gestao-cartoes__content">
          {/* Resumo Geral */}
          <div className="gestao-cartoes__resumo">
            <div className="gestao-cartoes__indicador">
              <p className="gestao-cartoes__indicador-label">Total em Cartões</p>
              <p className="gestao-cartoes__indicador-valor">
                {formatarValorComPrivacidade(totalCartoes)}
              </p>
            </div>
            <div className="gestao-cartoes__indicador">
              <p className="gestao-cartoes__indicador-label">Cartões Ativos</p>
              <p className="gestao-cartoes__indicador-valor">{cartoesAtivos}</p>
            </div>
            <div className="gestao-cartoes__indicador">
              <p className="gestao-cartoes__indicador-label">Próximo Vencimento</p>
              <p className="gestao-cartoes__indicador-valor">
                {proximoVencimento === Infinity ? 0 : proximoVencimento} dias
              </p>
            </div>
          </div>

          {/* Lista de Cartões */}
          <div className="gestao-cartoes__lista">
            {cartoes?.map((cartao) => {
              // ✅ CORRIGIDO: Usar fatura_vencimento_atual ou vencimento
              const dataVencimento = cartao.fatura_vencimento_atual || cartao.vencimento;
              const diasVencimento = calcularDiasVencimento(dataVencimento);
              // ✅ CORRIGIDO: Usar percentual_limite baseado no limite usado real
              const percentualLimite = cartao.percentual_limite || 0;
              
              return (
                <div 
                  key={cartao.id}
                  className="cartao-item"
                  onClick={() => handleVerDetalheCartao(cartao)}
                >
                  <div className="cartao-item__info">
                    <div className="cartao-item__header">
                      <div 
                        className="cartao-item__cor"
                        style={{ backgroundColor: cartao.cor || '#6B7280' }}
                      ></div>
                      <div className="cartao-item__nome-container">
                        <p className="cartao-item__nome">{cartao.nome || 'Cartão sem nome'}</p>
                        <p className="cartao-item__bandeira">{cartao.bandeira || 'Bandeira'}</p>
                      </div>
                    </div>
                    
                    <div className="cartao-item__valores">
                      <div className="cartao-item__valor-grupo">
                        <p className="cartao-item__valor-label">Fatura Atual</p>
                        <p className="cartao-item__valor">
                          {formatarValorComPrivacidade(cartao.fatura_atual || 0)}
                        </p>
                      </div>
                      
                      <div className="cartao-item__valor-grupo">
                        <p className="cartao-item__valor-label">Limite Total</p>
                        <p className="cartao-item__valor">
                          {formatarValorComPrivacidade(cartao.limite || 0)}
                        </p>
                      </div>
                    </div>

                    {/* ✅ CORRIGIDO: Utilização baseada no limite usado real */}
                    <div className="cartao-item__utilizacao">
                      <div className="cartao-item__utilizacao-header">
                        <span className="cartao-item__utilizacao-label">Utilização</span>
                        <span className="cartao-item__utilizacao-percentual">
                          {percentualLimite}%
                        </span>
                      </div>
                      <div className="cartao-item__barra-progresso">
                        <div 
                          className={`cartao-item__progresso ${obterStatusUtilizacao(percentualLimite)}`}
                          style={{ width: `${Math.min(percentualLimite, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="cartao-item__vencimento">
                      <p className="cartao-item__valor-label">Vencimento</p>
                      <p className="cartao-item__valor">
                        {diasVencimento} dias
                      </p>
                    </div>
                  </div>
                  
                  <ChevronRight className="cartao-item__chevron" />
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {(!cartoes || cartoes.length === 0) && (
            <div className="gestao-cartoes__empty">
              <div className="empty-state">
                <CreditCard className="empty-state__icon" />
                <h3 className="empty-state__title">Nenhum cartão encontrado</h3>
                <p className="empty-state__description">
                  Adicione seus cartões para acompanhar as faturas e gastos.
                </p>
                <button className="empty-state__button">
                  <Plus className="icon" />
                  Adicionar Cartão
                </button>
              </div>
            </div>
          )}

          {/* Insights */}
          {cartoes?.length > 0 && (
            <div className="gestao-cartoes__insights">
              <div className="insight-card insight-card--dica">
                <div className="insight-card__header">
                  <Zap className="insight-card__icon" />
                  <p className="insight-card__titulo">Dica Rápida</p>
                </div>
                <p className="insight-card__texto">
                  Você tem {cartoes.length} faturas vencendo este mês. Programe os pagamentos com antecedência!
                </p>
              </div>

              <div className="insight-card insight-card--parabens">
                <div className="insight-card__header">
                  <Target className="insight-card__icon" />
                  <p className="insight-card__titulo">Parabéns!</p>
                </div>
                <p className="insight-card__texto">
                  Seu uso de crédito está saudável. Continue assim!
                </p>
              </div>

              <div className="insight-card insight-card--atencao">
                <div className="insight-card__header">
                  <AlertTriangle className="insight-card__icon" />
                  <p className="insight-card__titulo">Atenção</p>
                </div>
                <p className="insight-card__texto">
                  Gastos com delivery subiram este mês. Que tal cozinhar mais em casa?
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Verificação de segurança para visualização detalhada
  if (!cartaoSelecionado) {
    return (
      <div className="gestao-cartoes">
        <div className="gestao-cartoes__error">
          <div className="error-state">
            <AlertTriangle className="error-state__icon" />
            <h3 className="error-state__title">Cartão não encontrado</h3>
            <p className="error-state__description">
              Não foi possível carregar os detalhes do cartão selecionado.
            </p>
            <button 
              className="error-state__button"
              onClick={handleVoltarConsolidada}
            >
              <ArrowLeft className="icon" />
              Voltar à lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Visualização Detalhada
  const dataVencimento = faturaSelecionada?.fatura_vencimento || cartaoSelecionado.fatura_vencimento_atual || cartaoSelecionado.vencimento;
  const diasVencimento = calcularDiasVencimento(dataVencimento);
  const statusVencimento = obterStatusVencimento(diasVencimento);
  const categorias = faturaDetalhada?.gastos_categoria || [];
  const categoriasUnicas = ['Todas', ...new Set(faturaDetalhada?.transacoes?.map(t => t.categoria) || [])];

  // ✅ NOVO: Obter valor da fatura selecionada ou usar faturaDetalhada
  const valorFaturaAtual = faturaSelecionada?.valor_total || faturaDetalhada?.valor_total_fatura || 0;

  return (
    <div className="gestao-cartoes">
      {/* Header Detalhada */}
      <div className="gestao-cartoes__header">
        <div className="gestao-cartoes__header-content">
          <div className="gestao-cartoes__title">
            <button 
              className="gestao-cartoes__btn-voltar"
              onClick={handleVoltarConsolidada}
            >
              <ArrowLeft className="icon" />
              Voltar
            </button>
            <div className="gestao-cartoes__title-info">
              <h1 className="gestao-cartoes__main-title">{cartaoSelecionado.nome || 'Cartão'}</h1>
              <p className="gestao-cartoes__subtitle">
                Fatura de {faturaSelecionada?.mes_nome || 'Carregando...'}
              </p>
            </div>
          </div>
          
          <div className="gestao-cartoes__actions">
            {/* Seletor de Cartão */}
            <select 
              className="gestao-cartoes__select"
              value={cartaoSelecionado.id}
              onChange={(e) => handleTrocarCartao(e.target.value)}
            >
              {cartoes?.map(c => (
                <option key={c.id} value={c.id}>{c.nome || 'Cartão sem nome'}</option>
              ))}
            </select>

            {/* ✅ REFATORADO: Seletor de Fatura com meses em português-br e ordenação cronológica */}
            <select 
              className="gestao-cartoes__select"
              value={faturaSelecionada ? faturaSelecionada.fatura_vencimento : ''}
              onChange={(e) => handleTrocarFatura(e.target.value)}
              disabled={!faturasDisponiveis?.length}
            >
              {faturasDisponiveis?.map(fatura => (
                <option 
                  key={fatura.fatura_vencimento} 
                  value={fatura.fatura_vencimento}
                >
                  {fatura.mes_nome} - {fatura.status === 'aberta' ? 'Em Aberto' : 'Fechada'}
                  {fatura.valor_total > 0 ? ` (${formatCurrency(fatura.valor_total)})` : ''}
                </option>
              ))}
            </select>

            <button
              className="gestao-cartoes__btn gestao-cartoes__btn--secondary"
              onClick={toggleMostrarValores}
            >
              {mostrarValores ? <Eye className="icon" /> : <EyeOff className="icon" />}
            </button>
          </div>
        </div>
      </div>

      <div className="gestao-cartoes__content gestao-cartoes__content--detalhada">
        <div className="gestao-cartoes__main">
          {/* ✅ REFATORADO: Resumo da Fatura com valores corretos */}
          <div className="fatura-resumo">
            <div className="fatura-resumo__valores">
              <div className="fatura-resumo__valor-item">
                <p className="fatura-resumo__label">Valor Total</p>
                <p className="fatura-resumo__valor fatura-resumo__valor--principal">
                  {formatarValorComPrivacidade(valorFaturaAtual)}
                </p>
                <p className="fatura-resumo__info">Vence em {diasVencimento} dias</p>
              </div>
              
              <div className="fatura-resumo__valor-item">
                <p className="fatura-resumo__label">Limite Usado</p>
                <p className="fatura-resumo__valor fatura-resumo__valor--limite">
                  {cartaoSelecionado.percentual_limite || 0}%
                </p>
                <p className="fatura-resumo__info">
                  {formatarValorComPrivacidade(cartaoSelecionado.limite_usado || 0)} de {formatarValorComPrivacidade(cartaoSelecionado.limite || 0)}
                </p>
              </div>
            </div>

            {/* ✅ CORRIGIDO: Barra de progresso baseada no limite usado */}
            <div className="fatura-resumo__progresso">
              <div 
                className={`fatura-resumo__barra ${obterStatusUtilizacao(cartaoSelecionado.percentual_limite || 0)}`}
                style={{ width: `${Math.min(cartaoSelecionado.percentual_limite || 0, 100)}%` }}
              ></div>
            </div>

            {/* ✅ REFATORADO: Botões de Ação da Fatura com valor correto */}
            <div className="fatura-resumo__acoes">
              {faturaStatus.faturaEstaPaga ? (
                <button 
                  className="fatura-resumo__btn-reabrir"
                  onClick={() => setModalReabertura(true)}
                >
                  <RotateCcw className="icon" />
                  Reabrir Fatura
                </button>
              ) : (
                <button 
                  className="fatura-resumo__btn-pagar"
                  onClick={() => setModalPagamento(true)}
                >
                  <DollarSign className="icon" />
                  Pagar Fatura - {formatarValorComPrivacidade(valorFaturaAtual)}
                </button>
              )}
              
              <button 
                className="fatura-resumo__btn-estorno"
                onClick={() => setModalEstorno(true)}
              >
                <RefreshCw className="icon" />
                Lançar Estorno
              </button>
            </div>
          </div>

          {/* ✅ REFATORADO: Análise por Categoria da fatura selecionada */}
          {categorias.length > 0 && (
            <div className="analise-gastos">
              <h3 className="analise-gastos__titulo">Análise de Gastos</h3>
              
              <div className="analise-gastos__content">
                <div className="analise-gastos__grafico">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={categorias}
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        fill="#8884d8"
                        dataKey="valor"
                        label={false}
                      >
                        {categorias.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Valor']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="analise-gastos__lista">
                  {categorias.slice(0, 6).map((cat, index) => (
                    <div key={index} className="categoria-item">
                      <div className="categoria-item__info">
                        <div 
                          className="categoria-item__cor"
                          style={{ backgroundColor: cat.cor }}
                        ></div>
                        <span className="categoria-item__nome">{cat.categoria}</span>
                      </div>
                      <div className="categoria-item__valores">
                        <span className="categoria-item__valor">
                          {formatarValorComPrivacidade(cat.valor)}
                        </span>
                        <span className="categoria-item__percentual">{cat.percentual}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ✅ MANTIDO: Lista de Transações da fatura selecionada */}
          <div className="transacoes-lista">
            <div className="transacoes-lista__header">
              <h3 className="transacoes-lista__titulo">
                Transações ({transacoesAgrupadas.length})
              </h3>
              {categoriasUnicas.length > 1 && (
                <select 
                  className="gestao-cartoes__select gestao-cartoes__select--small"
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  {categoriasUnicas.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="transacoes-lista__items">
              {transacoesAgrupadas.map((transacao) => (
                <div key={transacao.id} className="transacao-item">
                  <div className="transacao-item__content">
                    <div className="transacao-item__info">
                      <div 
                        className="transacao-item__cor"
                        style={{ backgroundColor: transacao.categoria_cor || '#6B7280' }}
                      ></div>
                      <div className="transacao-item__detalhes">
                        <p className="transacao-item__descricao">{transacao.descricao || 'Transação'}</p>
                        <div className="transacao-item__meta">
                          <span className="transacao-item__estabelecimento">
                            {transacao.estabelecimento || 'Estabelecimento'}
                          </span>
                          <span className="transacao-item__separador">•</span>
                          <span className="transacao-item__data">
                            {transacao.data ? new Date(transacao.data).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit' 
                            }) : 'Data'}
                          </span>
                          {transacao.parcela && (
                            <>
                              <span className="transacao-item__separador">•</span>
                              <span className="transacao-item__parcela">
                                {transacao.parcela}
                              </span>
                              {transacao.temParcelas && (
                                <button
                                  className="transacao-item__btn-parcelas"
                                  onClick={() => toggleParcela(transacao.grupo_parcelamento)}
                                >
                                  {parcelasExpandidas[transacao.grupo_parcelamento] ? 
                                    <Minus className="icon" /> : <Plus className="icon" />
                                  }
                                  {parcelasExpandidas[transacao.grupo_parcelamento] ? 'Ocultar' : 'Ver todas'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="transacao-item__valores">
                      <p className="transacao-item__valor">
                        {formatarValorComPrivacidade(transacao.valor)}
                      </p>
                      <span className={`transacao-item__status transacao-item__status--${(transacao.status || 'pendente').toLowerCase()}`}>
                        {transacao.status || 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {/* Parcelas Expandidas */}
                  {transacao.temParcelas && parcelasExpandidas[transacao.grupo_parcelamento] && (
                    <div className="transacao-item__parcelas">
                      {transacao.parcelas?.map((parcela, idx) => (
                        <div key={idx} className="parcela-item">
                          <div className="parcela-item__info">
                            <span className="parcela-item__numero">{parcela.parcela || `${idx + 1}`}</span>
                            <span className="parcela-item__separador">•</span>
                            <span className="parcela-item__data">
                              {parcela.data ? new Date(parcela.data).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit' 
                              }) : 'Data'}
                            </span>
                          </div>
                          <div className="parcela-item__valores">
                            <span className="parcela-item__valor">
                              {formatarValorComPrivacidade(parcela.valor)}
                            </span>
                            <span className={`parcela-item__status parcela-item__status--${(parcela.status || 'pendente').toLowerCase()}`}>
                              {parcela.status || 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {transacoesAgrupadas.length === 0 && (
              <div className="transacoes-lista__empty">
                <p>Nenhuma transação encontrada para este filtro.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="gestao-cartoes__sidebar">
          {/* Vencimento */}
          <div className="sidebar-card">
            <div className="sidebar-card__header">
              <Calendar className="sidebar-card__icon" />
              <h4 className="sidebar-card__titulo">Vencimento</h4>
            </div>
            <div className="sidebar-card__content sidebar-card__content--center">
              <p className="sidebar-card__valor-principal">{diasVencimento}</p>
              <p className="sidebar-card__label">dias restantes</p>
              <span className={`sidebar-card__status ${statusVencimento.classe}`}>
                {statusVencimento.texto}
              </span>
            </div>
          </div>

          {/* Status da Fatura */}
          <div className="sidebar-card">
            <div className="sidebar-card__header">
              <CheckCircle className="sidebar-card__icon" />
              <h4 className="sidebar-card__titulo">Status da Fatura</h4>
            </div>
            <div className="sidebar-card__content sidebar-card__content--center">
              <span className={`sidebar-card__status ${faturaStatus.faturaEstaPaga ? 'status-verde' : 'status-amarelo'}`}>
                {faturaStatus.faturaEstaPaga ? 'Paga' : 'Em Aberto'}
              </span>
              <p className="sidebar-card__info">
                {faturaStatus.faturaEstaPaga 
                  ? `${faturaStatus.transacoesEfetivadas} transações efetivadas`
                  : `${faturaStatus.totalTransacoes} transações pendentes`
                }
              </p>
            </div>
          </div>

          {/* ✅ REFATORADO: Comparativo usando valores da fatura selecionada */}
          <div className="sidebar-card">
            <div className="sidebar-card__header">
              <TrendingUp className="sidebar-card__icon sidebar-card__icon--red" />
              <h4 className="sidebar-card__titulo">Comparativo</h4>
            </div>
            <div className="sidebar-card__content">
              <p className="sidebar-card__label">Mês Anterior</p>
              <p className="sidebar-card__valor">
                {formatarValorComPrivacidade(faturaDetalhada?.comparativo_mes_anterior?.valor_anterior || 0)}
              </p>
              <div className="sidebar-card__variacao">
                <span className={`sidebar-card__status ${
                  (faturaDetalhada?.comparativo_mes_anterior?.variacao_percentual || 0) > 0 ? 'status-vermelho' : 'status-verde'
                }`}>
                  {(faturaDetalhada?.comparativo_mes_anterior?.variacao_percentual || 0) > 0 ? '+' : ''}
                  {faturaDetalhada?.comparativo_mes_anterior?.variacao_percentual || 0}%
                </span>
                <p className="sidebar-card__info">
                  Você gastou {formatarValorComPrivacidade(
                    Math.abs(valorFaturaAtual - (faturaDetalhada?.comparativo_mes_anterior?.valor_anterior || 0))
                  )} {(faturaDetalhada?.comparativo_mes_anterior?.variacao_percentual || 0) > 0 ? 'a mais' : 'a menos'}
                </p>
              </div>
            </div>
          </div>

          {/* Saúde do Cartão */}
          <div className="sidebar-card">
            <div className="sidebar-card__header">
              <Target className="sidebar-card__icon" />
              <h4 className="sidebar-card__titulo">Saúde do Cartão</h4>
            </div>
            <div className="sidebar-card__content sidebar-card__content--center">
              <div className="score-circular">
                <svg className="score-circular__svg" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="35" 
                    stroke="#E5E7EB" 
                    strokeWidth="8" 
                    fill="none" 
                  />
                  <circle
                    cx="50" 
                    cy="50" 
                    r="35" 
                    stroke="#10B981" 
                    strokeWidth="8" 
                    fill="none"
                    strokeDasharray={`${(faturaDetalhada?.insights?.saude_score || 75) * 2.2} 220`}
                    strokeLinecap="round"
                    className="score-circular__progress"
                  />
                </svg>
                <span className="score-circular__valor">
                  {faturaDetalhada?.insights?.saude_score || 75}
                </span>
              </div>
              <p className="sidebar-card__status status-verde">Boa</p>
              <p className="sidebar-card__info">Seu uso está saudável</p>
            </div>
          </div>

          {/* Insights */}
          <div className="sidebar-card">
            <div className="sidebar-card__header">
              <Zap className="sidebar-card__icon sidebar-card__icon--yellow" />
              <h4 className="sidebar-card__titulo">Insights</h4>
            </div>
            <div className="sidebar-card__content">
              <div className="insight-mini insight-mini--orange">
                <p className="insight-mini__titulo">Categoria Destaque</p>
                <p className="insight-mini__texto">
                  <strong>{faturaDetalhada?.insights?.categoria_maior_gasto || 'Outros'}</strong> foi sua maior categoria este mês
                </p>
              </div>
              <div className="insight-mini insight-mini--blue">
                <p className="insight-mini__titulo">💡 Dica de Economia</p>
                <p className="insight-mini__texto">
                  {faturaDetalhada?.insights?.dica_economia || 'Continue controlando seus gastos!'}
                </p>
              </div>
            </div>
          </div>

          {/* Conquistas */}
          <div className="sidebar-card">
            <div className="sidebar-card__header">
              <Award className="sidebar-card__icon sidebar-card__icon--yellow" />
              <h4 className="sidebar-card__titulo">Conquistas</h4>
            </div>
            <div className="sidebar-card__content">
              <div className="conquista-item conquista-item--green">
                <CheckCircle className="conquista-item__icon" />
                <div className="conquista-item__info">
                  <p className="conquista-item__titulo">Histórico Limpo</p>
                  <p className="conquista-item__descricao">12 meses sem atraso</p>
                </div>
              </div>
              <div className="conquista-item conquista-item--blue">
                <Target className="conquista-item__icon" />
                <div className="conquista-item__info">
                  <p className="conquista-item__titulo">Uso Consciente</p>
                  <p className="conquista-item__descricao">Limite bem controlado</p>
                </div>
              </div>
              <div className="conquista-item conquista-item--purple">
                <Award className="conquista-item__icon" />
                <div className="conquista-item__info">
                  <p className="conquista-item__titulo">Organizador</p>
                  <p className="conquista-item__descricao">Categorias bem definidas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso Educativo */}
          <div className="sidebar-card sidebar-card--alerta">
            <div className="sidebar-card__header">
              <AlertTriangle className="sidebar-card__icon sidebar-card__icon--orange" />
              <h4 className="sidebar-card__titulo">Importante</h4>
            </div>
            <div className="sidebar-card__content">
              <p className="sidebar-card__texto">
                Consulte taxas e encargos junto à operadora do cartão para mais detalhes.
              </p>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="sidebar-card">
            <div className="sidebar-card__header">
              <h4 className="sidebar-card__titulo">Ações Rápidas</h4>
            </div>
            <div className="sidebar-card__content">
              <button className="acao-rapida">
                📊 Ver fatura anterior
              </button>
              <button className="acao-rapida">
                📈 Comparar últimos 6 meses
              </button>
              <button className="acao-rapida">
                🎯 Definir meta de gastos
              </button>
              <button className="acao-rapida">
                📧 Configurar alertas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ REFATORADO: Modais com fatura_vencimento corretos */}
      <ModalPagamentoFatura
        isOpen={modalPagamento}
        onClose={() => setModalPagamento(false)}
        cartao={cartaoSelecionado}
        valorFatura={valorFaturaAtual}
        faturaVencimento={faturaSelecionada?.fatura_vencimento || null}
        mesReferencia={faturaSelecionada?.mes}
        anoReferencia={faturaSelecionada?.ano}
        onSuccess={handleSuccessOperacao}
      />

      <ModalReabrirFatura
        isOpen={modalReabertura}
        onClose={() => setModalReabertura(false)}
        cartao={cartaoSelecionado}
        valorFatura={valorFaturaAtual}
        faturaVencimento={faturaSelecionada?.fatura_vencimento || null}
        mesReferencia={faturaSelecionada?.mes}
        anoReferencia={faturaSelecionada?.ano}
        onSuccess={handleSuccessOperacao}
      />

      <ModalEstornoCartao
        isOpen={modalEstorno}
        onClose={() => setModalEstorno(false)}
        cartao={cartaoSelecionado}
        faturaVencimento={faturaSelecionada?.fatura_vencimento || null}
        onSuccess={handleSuccessOperacao}
      />
    </div>
  );
};

export default GestaoCartoes;