// src/modules/cartoes/components/GestaoCartoes.jsx
// ✅ VERSÃO REFATORADA E CORRIGIDA

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, TrendingUp, TrendingDown, Award, AlertTriangle, CheckCircle, 
  Target, DollarSign, CreditCard, ChevronRight, ChevronDown, 
  ArrowLeft, Eye, EyeOff, Zap, Plus, Minus, RotateCcw, RefreshCw,
  FileText, Edit3, Trash2
} from 'lucide-react';

// ✅ HOOKS
import { useCartoesData } from '../hooks/useCartoesData';
import { useFaturaOperations } from '../hooks/useFaturaOperations';
import { useCartoesStore } from '../store/useCartoesStore';

// ✅ UTILS
import { formatCurrency } from '@shared/utils/formatCurrency';
import {
  formatarMesPortugues,
  calcularDiasVencimento,
  obterStatusUtilizacao,
  obterStatusVencimento,
  gerarOpcoesMeses
} from '../utils/cartoesUtils';

// ✅ COMPONENTES
import ModalPagamentoFatura from './ModalPagamentoFatura';
import ModalReabrirFatura from './ModalReabrirFatura';
import ModalEstornoCartao from './ModalEstornoCartao';
import ModalConfirmacaoParcelamento from './ModalConfirmacaoParcelamento';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal';

// ✅ COMPONENTES INTERNOS
import VisualizacaoConsolidada from './GestaoCartoes/VisualizacaoConsolidada';
import VisualizacaoDetalhada from './GestaoCartoes/VisualizacaoDetalhada';
import ModalConfirmacaoSimples from './GestaoCartoes/ModalConfirmacaoSimples';

// ✅ STYLES
import '@modules/transacoes/styles/TransacoesPage.css';
import '../styles/GestaoCartoes.css';

const GestaoCartoes = () => {
  // ✅ HOOKS
  const {
    fetchCartoes,
    fetchTransacoesFatura,
    fetchFaturasDisponiveis,
    fetchGastosPorCategoria,
    verificarStatusFatura,
    fetchResumoConsolidado,
    loading: loadingData,
    error: errorData
  } = useCartoesData();

  const {
    excluirTransacao,
    excluirParcelamento,
    loading: loadingOperations,
    error: errorOperations
  } = useFaturaOperations();

  // ✅ STORE
  const {
    cartoes,
    transacoesFatura,
    resumoConsolidado,
    setCartoes,
    setTransacoesFatura,
    setResumoConsolidado,
    visualizacao,
    cartaoSelecionado,
    faturaAtual,
    filtroCategoria,
    mostrarValores,
    parcelasExpandidas,
    mesSelecionado,
    loadingStates,
    errorStates,
    setVisualizacao,
    setCartaoSelecionado,
    setFaturaAtual,
    setFiltroCategoria,
    setMesSelecionado,
    toggleMostrarValores,
    toggleParcelaExpandida,
    setLoadingCartoes,
    setLoadingFaturas,
    setLoadingTransacoes,
    setErrorCartoes,
    setErrorFaturas,
    getCartoesAtivos,
    getTransacoesFiltradas,
    getCategoriasUnicas
  } = useCartoesStore();

  // ✅ ESTADOS LOCAIS
  const [gastosPorCategoria, setGastosPorCategoria] = useState([]);
  const [faturasDisponiveis, setFaturasDisponiveis] = useState([]);
  const [statusFatura, setStatusFatura] = useState({ status_paga: false });
  
  // Estados dos modais
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalReabertura, setModalReabertura] = useState(false);
  const [modalEstorno, setModalEstorno] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState(null);
  const [modalConfirmacaoParcelamento, setModalConfirmacaoParcelamento] = useState(false);
  const [excluirTodasParcelas, setExcluirTodasParcelas] = useState(false);

  // ✅ INICIALIZAÇÃO
  useEffect(() => {
    if (visualizacao !== 'consolidada') {
      setVisualizacao('consolidada');
      setCartaoSelecionado(null);
      setFaturaAtual(null);
    }
  }, []);

  useEffect(() => {
    const mesAtual = new Date().toISOString().slice(0, 7);
    if (!mesSelecionado) {
      setMesSelecionado(mesAtual);
    }
  }, [mesSelecionado, setMesSelecionado]);

  // ✅ FUNÇÕES AUXILIARES
  const formatarValorComPrivacidade = (valor) => {
    if (!mostrarValores) return "••••••";
    return formatCurrency(valor || 0);
  };

  const opcoesMeses = useMemo(() => gerarOpcoesMeses(), []);

  // ✅ CORREÇÃO ID 32: Calcular total de pendências
  const cartoesProcessados = useMemo(() => {
    return cartoes.map(cartao => {
      const faturasAbertasDoCartao = faturasDisponiveis
        .filter(f => !f.status_paga)
        .reduce((total, f) => total + (f.valor_total || 0), 0);
      
      const percentualLimite = cartao.limite > 0 
        ? Math.round(((cartao.gasto_atual || faturasAbertasDoCartao || 0) / cartao.limite) * 100) 
        : 0;
      
      const diasVencimento = calcularDiasVencimento(cartao.proxima_fatura_vencimento);
      
      return {
        ...cartao,
        total_pendencias: faturasAbertasDoCartao || cartao.gasto_atual || 0,
        percentual_limite_formatado: percentualLimite,
        dias_vencimento: diasVencimento,
        limite_disponivel: (cartao.limite || 0) - (faturasAbertasDoCartao || cartao.gasto_atual || 0)
      };
    });
  }, [cartoes, faturasDisponiveis]);

  const faturasProcessadas = useMemo(() => {
    const faturas = [...faturasDisponiveis].sort((a, b) => {
      return new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento);
    });
    
    return faturas.map(fatura => ({
      ...fatura,
      mes_nome_formatado: formatarMesPortugues(fatura.fatura_vencimento),
      opcao_display: `${formatarMesPortugues(fatura.fatura_vencimento)} - ${fatura.status_paga ? 'Paga' : 'Em Aberto'}`
    }));
  }, [faturasDisponiveis]);

  const transacoesAgrupadasProcessadas = useMemo(() => {
    const transacoesFiltradas = getTransacoesFiltradas();
    const agrupadas = [];
    const processados = new Set();

    transacoesFiltradas.forEach(transacao => {
      if (processados.has(transacao.id)) return;

      if (transacao.grupo_parcelamento) {
        const parcelasDoGrupo = transacoesFiltradas.filter(t => 
          t.grupo_parcelamento === transacao.grupo_parcelamento
        );
        
        agrupadas.push({
          ...transacao,
          parcelas: parcelasDoGrupo,
          temParcelas: true
        });
        parcelasDoGrupo.forEach(p => processados.add(p.id));
      } else {
        agrupadas.push(transacao);
        processados.add(transacao.id);
      }
    });

    return agrupadas;
  }, [transacoesFatura, filtroCategoria, parcelasExpandidas]);

  // ✅ CARREGAMENTO DE DADOS
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoadingCartoes(true);
      try {
        const cartoesData = await fetchCartoes();
        setCartoes(cartoesData);
      } catch (error) {
        setErrorCartoes(error.message);
      } finally {
        setLoadingCartoes(false);
      }
    };

    carregarDadosIniciais();
  }, [fetchCartoes, setCartoes, setLoadingCartoes, setErrorCartoes]);

  useEffect(() => {
    if (visualizacao === 'consolidada' && mesSelecionado) {
      carregarResumoConsolidado();
    }
  }, [visualizacao, mesSelecionado]);

  useEffect(() => {
    if (cartaoSelecionado && visualizacao === 'detalhada') {
      carregarFaturasDisponiveis();
    }
  }, [cartaoSelecionado, visualizacao]);

  useEffect(() => {
    if (faturaAtual && cartaoSelecionado) {
      carregarDetalhesFatura();
    }
  }, [faturaAtual, cartaoSelecionado]);

  const carregarResumoConsolidado = async () => {
    setLoadingCartoes(true);
    try {
      const resumo = await fetchResumoConsolidado(mesSelecionado);
      setResumoConsolidado(resumo);
    } catch (error) {
      setErrorCartoes(error.message);
    } finally {
      setLoadingCartoes(false);
    }
  };

  const carregarFaturasDisponiveis = async () => {
    setLoadingFaturas(true);
    try {
      const faturas = await fetchFaturasDisponiveis(cartaoSelecionado.id);
      setFaturasDisponiveis(faturas);
      
      const faturasOrdenadas = faturas.sort((a, b) => 
        new Date(a.fatura_vencimento) - new Date(b.fatura_vencimento)
      );
      const faturaAberta = faturasOrdenadas.find(f => !f.status_paga) || faturasOrdenadas[0];
      
      if (faturaAberta) {
        setFaturaAtual(faturaAberta);
      }
    } catch (error) {
      setErrorFaturas(error.message);
    } finally {
      setLoadingFaturas(false);
    }
  };

  const carregarDetalhesFatura = async () => {
    setLoadingTransacoes(true);
    try {
      const [transacoes, gastos, status] = await Promise.all([
        fetchTransacoesFatura(cartaoSelecionado.id, faturaAtual.fatura_vencimento, true),
        fetchGastosPorCategoria(cartaoSelecionado.id, faturaAtual.fatura_vencimento),
        verificarStatusFatura(cartaoSelecionado.id, faturaAtual.fatura_vencimento)
      ]);
      
      setTransacoesFatura(transacoes);
      setGastosPorCategoria(gastos);
      setStatusFatura(status);
    } catch (error) {
      console.error('Erro ao carregar detalhes da fatura:', error);
    } finally {
      setLoadingTransacoes(false);
    }
  };

  // ✅ HANDLERS DE NAVEGAÇÃO
  const handleVerDetalheCartao = (cartao) => {
    setCartaoSelecionado(cartao);
    setVisualizacao('detalhada');
  };

  const handleVoltarConsolidada = () => {
    setVisualizacao('consolidada');
    setCartaoSelecionado(null);
    setFaturaAtual(null);
    setFiltroCategoria('todas');
  };

  const handleTrocarCartao = (cartaoId) => {
    const novoCartao = cartoes.find(c => c.id === cartaoId);
    if (novoCartao) {
      setCartaoSelecionado(novoCartao);
      setFaturaAtual(null);
    }
  };

  const handleTrocarFatura = (faturaVencimento) => {
    const novaFatura = faturasDisponiveis.find(f => 
      f.fatura_vencimento === faturaVencimento
    );
    if (novaFatura) {
      setFaturaAtual(novaFatura);
    }
  };

  const handleMudarMes = (novoMes) => {
    setMesSelecionado(novoMes);
  };

  // ✅ CORREÇÕES ID 33 e 34
  const handleSuccessOperacao = () => {
    if (visualizacao === 'consolidada') {
      carregarResumoConsolidado();
    } else {
      carregarDetalhesFatura();
      carregarFaturasDisponiveis();
    }
  };

  // ✅ HANDLERS DE EDIÇÃO E EXCLUSÃO
  const handleEditarTransacao = (transacao) => {
    const transacaoCompleta = {
      ...transacao,
      cartao_id: transacao.cartao_id || cartaoSelecionado?.id,
      categoria_id: transacao.categoria_id,
      subcategoria_id: transacao.subcategoria_id,
      fatura_vencimento: transacao.fatura_vencimento || faturaAtual?.fatura_vencimento,
      numero_parcelas: transacao.numero_parcelas || transacao.total_parcelas || 1,
      categoria_nome: transacao.categoria_nome,
      conta_nome: transacao.conta_nome,
      cartao_nome: transacao.cartao_nome
    };
    
    if (!transacaoCompleta.cartao_id || !transacaoCompleta.categoria_id) {
      alert('Erro: Dados incompletos da transação');
      return;
    }
    
    setTransacaoEditando(transacaoCompleta);
    setModalEdicao(true);
  };

  // ✅ CORREÇÃO ID 35
  const handleExcluirTransacao = (transacao) => {
    setTransacaoParaExcluir(transacao);
    
    if (transacao.grupo_parcelamento && transacao.parcela_atual && transacao.total_parcelas > 1) {
      setModalConfirmacaoParcelamento(true);
    } else {
      setModalConfirmacao(true);
    }
  };

  const confirmarExclusao = async () => {
    if (!transacaoParaExcluir) return;

    try {
      let resultado;
      
      if (excluirTodasParcelas && transacaoParaExcluir.grupo_parcelamento) {
        resultado = await excluirParcelamento(
          transacaoParaExcluir.grupo_parcelamento,
          transacaoParaExcluir.parcela_atual
        );
      } else {
        resultado = await excluirTransacao(transacaoParaExcluir.id);
      }
      
      if (resultado.success) {
        setModalConfirmacao(false);
        setModalConfirmacaoParcelamento(false);
        setTransacaoParaExcluir(null);
        setExcluirTodasParcelas(false);
        handleSuccessOperacao();
      } else {
        throw new Error(resultado.error || 'Erro ao excluir transação');
      }
    } catch (error) {
      console.error('❌ Erro ao excluir transação:', error);
      alert(`Erro ao excluir transação: ${error.message}`);
    }
  };

  const cancelarExclusao = () => {
    setModalConfirmacao(false);
    setModalConfirmacaoParcelamento(false);
    setTransacaoParaExcluir(null);
    setExcluirTodasParcelas(false);
  };

  const handleFecharEdicao = () => {
    setModalEdicao(false);
    setTransacaoEditando(null);
  };

  const handleSalvarEdicao = () => {
    handleSuccessOperacao();
  };

  const calcularTotaisConsolidado = () => {
    if (!resumoConsolidado) {
      return {
        faturaAtual: 0,
        limiteTotal: 0,
        totalCartoes: 0,
        proximoVencimento: 0,
        diasVencimento: 0,
        percentualUtilizacao: 0
      };
    }

    return {
      faturaAtual: resumoConsolidado.total_faturas_abertas || 0,
      limiteTotal: resumoConsolidado.limite_total || 0,
      totalCartoes: resumoConsolidado.total_gasto_periodo || 0,
      proximoVencimento: resumoConsolidado.proxima_fatura_vencimento || null,
      diasVencimento: resumoConsolidado.dias_proximo_vencimento || 0,
      percentualUtilizacao: resumoConsolidado.percentual_utilizacao_medio || 0
    };
  };

  // ✅ LOADING STATE
  const isLoading = loadingStates.cartoes || loadingData || loadingOperations;

  if (isLoading && cartoes.length === 0) {
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

  // ✅ RENDERIZAÇÃO CONDICIONAL
  if (visualizacao === 'consolidada') {
    return (
      <>
        <VisualizacaoConsolidada
          cartoesProcessados={cartoesProcessados}
          totais={calcularTotaisConsolidado()}
          mostrarValores={mostrarValores}
          formatarValorComPrivacidade={formatarValorComPrivacidade}
          onToggleMostrarValores={toggleMostrarValores}
          onVerDetalheCartao={handleVerDetalheCartao}
        />
      </>
    );
  }

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

  // ✅ VISUALIZAÇÃO DETALHADA
  return (
    <>
      <VisualizacaoDetalhada
        cartaoSelecionado={cartaoSelecionado}
        cartaoProcessado={cartoesProcessados.find(c => c.id === cartaoSelecionado.id) || cartaoSelecionado}
        cartoes={cartoes}
        faturaAtual={faturaAtual}
        faturasProcessadas={faturasProcessadas}
        valorFaturaAtual={faturaAtual?.valor_total || 0}
        diasVencimento={calcularDiasVencimento(faturaAtual?.fatura_vencimento)}
        statusFatura={statusFatura}
        gastosPorCategoria={gastosPorCategoria}
        transacoesAgrupadasProcessadas={transacoesAgrupadasProcessadas}
        categoriasUnicas={['Todas', ...getCategoriasUnicas()]}
        filtroCategoria={filtroCategoria}
        mostrarValores={mostrarValores}
        parcelasExpandidas={parcelasExpandidas}
        formatarValorComPrivacidade={formatarValorComPrivacidade}
        onVoltarConsolidada={handleVoltarConsolidada}
        onTrocarCartao={handleTrocarCartao}
        onTrocarFatura={handleTrocarFatura}
        onToggleMostrarValores={toggleMostrarValores}
        onSetFiltroCategoria={setFiltroCategoria}
        onToggleParcelaExpandida={toggleParcelaExpandida}
        onEditarTransacao={handleEditarTransacao}
        onExcluirTransacao={handleExcluirTransacao}
        onAbrirModalPagamento={() => setModalPagamento(true)}
        onAbrirModalReabertura={() => setModalReabertura(true)}
        onAbrirModalEstorno={() => setModalEstorno(true)}
      />

      {/* Modais */}
      <ModalPagamentoFatura
        isOpen={modalPagamento}
        onClose={() => setModalPagamento(false)}
        cartao={cartaoSelecionado}
        valorFatura={faturaAtual?.valor_total || 0}
        faturaVencimento={faturaAtual?.fatura_vencimento || null}
        mesReferencia={faturaAtual ? formatarMesPortugues(faturaAtual.fatura_vencimento) : ''}
        onSuccess={handleSuccessOperacao}
      />

      <ModalReabrirFatura
        isOpen={modalReabertura}
        onClose={() => setModalReabertura(false)}
        cartao={cartaoSelecionado}
        valorFatura={faturaAtual?.valor_total || 0}
        faturaVencimento={faturaAtual?.fatura_vencimento || null}
        mesReferencia={faturaAtual ? formatarMesPortugues(faturaAtual.fatura_vencimento) : ''}
        onSuccess={handleSuccessOperacao}
      />

      <ModalEstornoCartao
        isOpen={modalEstorno}
        onClose={() => setModalEstorno(false)}
        cartao={cartaoSelecionado}
        faturaVencimento={faturaAtual?.fatura_vencimento || null}
        onSuccess={handleSuccessOperacao}
      />

      <DespesasCartaoModal
        isOpen={modalEdicao}
        onClose={handleFecharEdicao}
        onSave={handleSalvarEdicao}
        transacaoEditando={transacaoEditando}
      />

      <ModalConfirmacaoParcelamento
        isOpen={modalConfirmacaoParcelamento}
        onClose={cancelarExclusao}
        transacao={transacaoParaExcluir}
        excluirTodasParcelas={excluirTodasParcelas}
        onChangeExcluirTodas={setExcluirTodasParcelas}
        onConfirmar={confirmarExclusao}
      />

      <ModalConfirmacaoSimples
        isOpen={modalConfirmacao && !modalConfirmacaoParcelamento}
        onClose={cancelarExclusao}
        transacao={transacaoParaExcluir}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
};

export default GestaoCartoes;