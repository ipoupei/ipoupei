// src/modules/cartoes/components/GestaoCartoes.jsx
// ✅ CORRIGIDO: Campos obrigatórios para edição de transações

import React, { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Calendar, TrendingUp, TrendingDown, Award, AlertTriangle, CheckCircle, 
  Target, DollarSign, CreditCard, ChevronRight, ChevronDown, 
  ArrowLeft, Eye, EyeOff, Zap, Plus, Minus, RotateCcw, RefreshCw,
  FileText, Edit3, Trash2
} from 'lucide-react';

// ✅ HOOKS CORRIGIDOS
import { useCartoesData } from '../hooks/useCartoesData';
import { useFaturaOperations } from '../hooks/useFaturaOperations';
import { useCartoesStore } from '../store/useCartoesStore';
import { formatCurrency } from '@shared/utils/formatCurrency';

// Importar modais
import ModalPagamentoFatura from './ModalPagamentoFatura';
import ModalReabrirFatura from './ModalReabrirFatura';
import ModalEstornoCartao from './ModalEstornoCartao';
import DespesasCartaoModal from '@modules/transacoes/components/DespesasCartaoModal'; // ✅ MODAL DE EDIÇÃO

// ✅ IMPORTAR CSS DA TRANSAÇÕES PARA BOTÕES DE AÇÃO
import '@modules/transacoes/styles/TransacoesPage.css';
import '../styles/GestaoCartoes.css';

const GestaoCartoes = () => {
  // ✅ HOOKS DE DADOS CORRIGIDOS
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
    excluirTransacao, // ✅ Para exclusão
    loading: loadingOperations,
    error: errorOperations
  } = useFaturaOperations();

  // ✅ STORE CORRIGIDO
  const {
    // Estados de dados
    cartoes,
    transacoesFatura,
    resumoConsolidado,
    setCartoes,
    setTransacoesFatura,
    setResumoConsolidado,
    
    // Estados de UI
    visualizacao,
    cartaoSelecionado,
    faturaAtual,
    filtroCategoria,
    mostrarValores,
    parcelasExpandidas,
    mesSelecionado,
    
    // Loading e erros por contexto
    loadingStates,
    errorStates,
    
    // Actions
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
    
    // Getters
    getCartoesAtivos,
    getTransacoesFiltradas,
    getCategoriasUnicas
  } = useCartoesStore();

  // ✅ ESTADOS LOCAIS PARA DADOS COMPLEMENTARES
  const [gastosPorCategoria, setGastosPorCategoria] = useState([]);
  const [faturasDisponiveis, setFaturasDisponiveis] = useState([]);
  const [statusFatura, setStatusFatura] = useState({ status_paga: false });
  
  // Estados dos modais
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalReabertura, setModalReabertura] = useState(false);
  const [modalEstorno, setModalEstorno] = useState(false);
  
  // ✅ ESTADOS PARA EDIÇÃO E EXCLUSÃO - CORRIGIDOS
  const [modalEdicao, setModalEdicao] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState(null);

  // ✅ GARANTIR QUE SEMPRE ABRE NA VISUALIZAÇÃO CONSOLIDADA
  useEffect(() => {
    if (visualizacao !== 'consolidada') {
      setVisualizacao('consolidada');
      setCartaoSelecionado(null);
      setFaturaAtual(null);
    }
  }, []);

  // ✅ INICIALIZAR COM MÊS ATUAL
  useEffect(() => {
    const mesAtual = new Date().toISOString().slice(0, 7);
    if (!mesSelecionado) {
      setMesSelecionado(mesAtual);
    }
  }, [mesSelecionado, setMesSelecionado]);

  // ✅ FORMATAÇÕES SIMPLES NO COMPONENTE
  const formatarMesPortugues = (dataVencimento) => {
    if (!dataVencimento) return 'Mês inválido';
    
    try {
      const data = new Date(dataVencimento + 'T12:00:00');
      if (isNaN(data.getTime())) return 'Data inválida';
      
      const mesNome = data.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      return mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
    } catch {
      return 'Data inválida';
    }
  };

  const calcularDiasVencimento = (dataVencimento) => {
    if (!dataVencimento) return 0;
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    return Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
  };

  const formatarValorComPrivacidade = (valor) => {
    if (!mostrarValores) return "••••••";
    return formatCurrency(valor || 0);
  };

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

  // ✅ GERAR OPÇÕES DE MESES PARA O SELETOR
  const gerarOpcoesMeses = () => {
    const opcoes = [];
    const hoje = new Date();
    
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const valor = data.toISOString().slice(0, 7);
      const label = data.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      const labelFormatado = label.charAt(0).toUpperCase() + label.slice(1);
      
      opcoes.push({ valor, label: labelFormatado });
    }
    
    return opcoes;
  };

  const opcoesMeses = useMemo(() => gerarOpcoesMeses(), []);

  // ✅ DADOS PROCESSADOS COM CÁLCULOS REAIS
  const cartoesProcessados = useMemo(() => {
    return cartoes.map(cartao => {
      const percentualLimite = cartao.limite > 0 
        ? Math.round(((cartao.gasto_atual || 0) / cartao.limite) * 100) 
        : 0;
      
      const diasVencimento = calcularDiasVencimento(cartao.proxima_fatura_vencimento);
      
      return {
        ...cartao,
        percentual_limite_formatado: percentualLimite,
        dias_vencimento: diasVencimento,
        limite_disponivel: (cartao.limite || 0) - (cartao.gasto_atual || 0)
      };
    });
  }, [cartoes]);

  // ✅ FATURAS ORDENADAS PELO VENCIMENTO MAIS ANTIGO
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
    console.log('🔄 MEMO: Processando transações agrupadas');
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

  // ✅ CARREGAMENTO INICIAL DE DADOS
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

  // ✅ CARREGAR RESUMO CONSOLIDADO QUANDO MÊS MUDA
  useEffect(() => {
    if (visualizacao === 'consolidada' && mesSelecionado) {
      carregarResumoConsolidado();
    }
  }, [visualizacao, mesSelecionado]);

  // ✅ CARREGAR FATURAS QUANDO CARTÃO SELECIONADO
  useEffect(() => {
    if (cartaoSelecionado && visualizacao === 'detalhada') {
      carregarFaturasDisponiveis();
    }
  }, [cartaoSelecionado, visualizacao]);

  // ✅ CARREGAR DETALHES QUANDO FATURA SELECIONADA
  useEffect(() => {
    if (faturaAtual && cartaoSelecionado) {
      carregarDetalhesFatura();
    }
  }, [faturaAtual, cartaoSelecionado]);

  // ✅ FUNÇÕES DE CARREGAMENTO
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
      // ✅ BUSCAR TRANSAÇÕES COM TODOS OS CAMPOS NECESSÁRIOS
      const [transacoes, gastos, status] = await Promise.all([
        fetchTransacoesFatura(cartaoSelecionado.id, faturaAtual.fatura_vencimento, true),
        fetchGastosPorCategoria(cartaoSelecionado.id, faturaAtual.fatura_vencimento),
        verificarStatusFatura(cartaoSelecionado.id, faturaAtual.fatura_vencimento)
      ]);

      // ✅ VERIFICAR SE AS TRANSAÇÕES TÊM OS CAMPOS NECESSÁRIOS
      console.log('🔍 Verificando campos das transações:', transacoes[0]);
      
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

  const handleSuccessOperacao = () => {
    // Recarregar dados após operação
    if (visualizacao === 'consolidada') {
      carregarResumoConsolidado();
    } else {
      carregarDetalhesFatura();
    }
  };

  // ✅ HANDLERS PARA EDIÇÃO E EXCLUSÃO - CORRIGIDOS
  const handleEditarTransacao = (transacao) => {
    console.log('✏️ Preparando transação para edição:', transacao);
    
    // ✅ GARANTIR QUE TODOS OS CAMPOS OBRIGATÓRIOS ESTÃO PRESENTES
    const transacaoCompleta = {
      ...transacao,
      // ✅ CAMPOS OBRIGATÓRIOS PARA O MODAL DE EDIÇÃO
      cartao_id: transacao.cartao_id || cartaoSelecionado?.id,
      categoria_id: transacao.categoria_id,
      subcategoria_id: transacao.subcategoria_id,
      // ✅ CAMPOS ADICIONAIS NECESSÁRIOS
      fatura_vencimento: transacao.fatura_vencimento || faturaAtual?.fatura_vencimento,
      numero_parcelas: transacao.numero_parcelas || transacao.total_parcelas || 1,
      // ✅ VERIFICAR SE OS NOMES DOS CAMPOS ESTÃO CORRETOS
      categoria_nome: transacao.categoria_nome,
      conta_nome: transacao.conta_nome,
      cartao_nome: transacao.cartao_nome
    };
    
    console.log('✅ Transação preparada para edição:', transacaoCompleta);
    
    // ✅ VERIFICAÇÃO DE SEGURANÇA
    if (!transacaoCompleta.cartao_id) {
      console.error('❌ ERRO: cartao_id não encontrado na transação');
      alert('Erro: Não foi possível identificar o cartão desta transação');
      return;
    }
    
    if (!transacaoCompleta.categoria_id) {
      console.error('❌ ERRO: categoria_id não encontrado na transação');
      alert('Erro: Não foi possível identificar a categoria desta transação');
      return;
    }
    
    setTransacaoEditando(transacaoCompleta);
    setModalEdicao(true);
  };

  const handleExcluirTransacao = (transacao) => {
    console.log('🗑️ Preparando exclusão da transação:', transacao.id);
    setTransacaoParaExcluir(transacao);
    setModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!transacaoParaExcluir) return;

    try {
      console.log('🗑️ Excluindo transação via hook:', transacaoParaExcluir.id);
      
      const resultado = await excluirTransacao(transacaoParaExcluir.id);
      
      if (resultado.success) {
        console.log('✅ Transação excluída com sucesso');
        
        setModalConfirmacao(false);
        setTransacaoParaExcluir(null);
        
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
    setTransacaoParaExcluir(null);
  };

  const handleFecharEdicao = () => {
    setModalEdicao(false);
    setTransacaoEditando(null);
  };

  const handleSalvarEdicao = () => {
    console.log('✅ Edição salva, recarregando dados');
    handleSuccessOperacao();
  };

  // ✅ CÁLCULOS REAIS PARA TOTAIS
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

  // ✅ LOADING STATES
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

  // ✅ VISUALIZAÇÃO CONSOLIDADA
  if (visualizacao === 'consolidada') {
    const totais = calcularTotaisConsolidado();

    return (
      <div className="gestao-cartoes">
        {/* Header */}
        <div className="gestao-cartoes__header">
          <div className="gestao-cartoes__header-content">
            <div className="gestao-cartoes__title">
              <h1 className="gestao-cartoes__main-title">Faturas dos Cartões</h1>
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
            </div>
          </div>
        </div>

        <div className="gestao-cartoes__content">
          {/* Lista de Cartões */}
          <div className="gestao-cartoes__lista">
            {cartoesProcessados?.map((cartao) => (
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
                        {formatarValorComPrivacidade(cartao.gasto_atual || 0)}
                      </p>
                    </div>
                    
                    <div className="cartao-item__valor-grupo">
                      <p className="cartao-item__valor-label">Limite Total</p>
                      <p className="cartao-item__valor">
                        {formatarValorComPrivacidade(cartao.limite || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="cartao-item__utilizacao">
                    <div className="cartao-item__utilizacao-header">
                      <span className="cartao-item__utilizacao-label">Utilização</span>
                      <span className="cartao-item__utilizacao-percentual">
                        {cartao.percentual_limite_formatado}%
                      </span>
                    </div>
                    <div className="cartao-item__barra-progresso">
                      <div 
                        className={`cartao-item__progresso ${obterStatusUtilizacao(cartao.percentual_limite_formatado)}`}
                        style={{ width: `${Math.min(cartao.percentual_limite_formatado, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="cartao-item__vencimento">
                    <p className="cartao-item__valor-label">Vencimento</p>
                    <p className="cartao-item__valor">
                      {cartao.dias_vencimento} dias
                    </p>
                  </div>
                </div>
                
                <ChevronRight className="cartao-item__chevron" />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(!cartoesProcessados || cartoesProcessados.length === 0) && (
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
        </div>
      </div>
    );
  }

  // ✅ VERIFICAÇÃO DE SEGURANÇA PARA VISUALIZAÇÃO DETALHADA
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

  // ✅ VISUALIZAÇÃO DETALHADA COM EDIÇÃO E EXCLUSÃO
  const cartaoProcessado = cartoesProcessados.find(c => c.id === cartaoSelecionado.id) || cartaoSelecionado;
  const valorFaturaAtual = faturaAtual?.valor_total || 0;
  const diasVencimento = calcularDiasVencimento(faturaAtual?.fatura_vencimento);
  const statusVencimento = obterStatusVencimento(diasVencimento);
  const categoriasUnicas = ['Todas', ...getCategoriasUnicas()];

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
                Fatura de {faturaAtual ? formatarMesPortugues(faturaAtual.fatura_vencimento) : 'Carregando...'}
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

            {/* Seletor de Fatura */}
            <select 
              className="gestao-cartoes__select"
              value={faturaAtual ? faturaAtual.fatura_vencimento : ''}
              onChange={(e) => handleTrocarFatura(e.target.value)}
              disabled={!faturasProcessadas?.length}
            >
              {faturasProcessadas?.map(fatura => (
                <option 
                  key={fatura.fatura_vencimento} 
                  value={fatura.fatura_vencimento}
                >
                  {fatura.opcao_display}
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
          {/* Resumo da Fatura */}
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
                  {cartaoProcessado.percentual_limite_formatado || 0}%
                </p>
                <p className="fatura-resumo__info">
                  {formatarValorComPrivacidade(cartaoProcessado.gasto_atual || 0)} de {formatarValorComPrivacidade(cartaoProcessado.limite || 0)}
                </p>
              </div>
            </div>

            <div className="fatura-resumo__progresso">
              <div 
                className={`fatura-resumo__barra ${obterStatusUtilizacao(cartaoProcessado.percentual_limite_formatado || 0)}`}
                style={{ width: `${Math.min(cartaoProcessado.percentual_limite_formatado || 0, 100)}%` }}
              ></div>
            </div>

            {/* Botões de Ação da Fatura */}
            <div className="fatura-resumo__acoes">
              {statusFatura.status_paga ? (
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

          {/* Análise por Categoria */}
          {gastosPorCategoria.length > 0 && (
            <div className="analise-gastos">
              <h3 className="analise-gastos__titulo">Análise de Gastos</h3>
              
              <div className="analise-gastos__content">
                <div className="analise-gastos__grafico">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={gastosPorCategoria}
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        fill="#8884d8"
                        dataKey="valor_total"
                        label={false}
                      >
                        {gastosPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.categoria_cor} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Valor']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="analise-gastos__lista">
                  {gastosPorCategoria.slice(0, 6).map((cat, index) => (
                    <div key={`categoria-${cat.categoria_id || index}`} className="categoria-item">
                      <div className="categoria-item__info">
                        <div 
                          className="categoria-item__cor"
                          style={{ backgroundColor: cat.categoria_cor }}
                        ></div>
                        <span className="categoria-item__nome">{cat.categoria_nome}</span>
                      </div>
                      <div className="categoria-item__valores">
                        <span className="categoria-item__valor">
                          {formatarValorComPrivacidade(cat.valor_total)}
                        </span>
                        <span className="categoria-item__percentual">{Math.round(cat.percentual)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Transações ✅ COM BOTÕES DE EDIÇÃO E EXCLUSÃO CORRIGIDOS */}
          <div className="transacoes-lista">
            <div className="transacoes-lista__header">
              <h3 className="transacoes-lista__titulo">
                Transações ({transacoesAgrupadasProcessadas.length})
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
              {transacoesAgrupadasProcessadas.map((transacao) => (
                <div key={`transacao-${transacao.id}`} className="transacao-item">
                  <div className="transacao-item__content">
                    <div className="transacao-item__info">
                      <div 
                        className="transacao-item__cor"
                        style={{ backgroundColor: transacao.categoria_cor || '#6B7280' }}
                      ></div>
                      <div className="transacao-item__detalhes">
                        <p className="transacao-item__descricao">{transacao.descricao || 'Transação'}</p>
                        <div className="transacao-item__meta">
                          <span className="transacao-item__data">
                            {transacao.data ? new Date(transacao.data).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit' 
                            }) : 'Data'}
                          </span>
                          {transacao.parcela_atual && transacao.total_parcelas && (
                            <>
                              <span className="transacao-item__separador">•</span>
                              <span className="transacao-item__parcela">
                                {transacao.parcela_atual}/{transacao.total_parcelas}
                              </span>
                              {transacao.temParcelas && (
                                <button
                                  className="transacao-item__btn-parcelas"
                                  onClick={() => toggleParcelaExpandida(transacao.grupo_parcelamento)}
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
                      <span className={`transacao-item__status transacao-item__status--${transacao.efetivado ? 'paga' : 'pendente'}`}>
                        {transacao.efetivado ? 'Paga' : 'Pendente'}
                      </span>
                    </div>

                    {/* ✅ BOTÕES DE AÇÃO - CORRIGIDOS */}
                    <div className="transacao-item__acoes">
                      <div className="action-buttons" style={{ opacity: 1, display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditarTransacao(transacao);
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6'
                          }}
                          title="Editar transação"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExcluirTransacao(transacao);
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444'
                          }}
                          title="Excluir transação"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Parcelas Expandidas */}
                  {transacao.temParcelas && parcelasExpandidas[transacao.grupo_parcelamento] && (
                    <div className="transacao-item__parcelas">
                      {transacao.parcelas?.map((parcela, idx) => (
                        <div key={`parcela-${parcela.id || idx}`} className="parcela-item">
                          <div className="parcela-item__info">
                            <span className="parcela-item__numero">{parcela.parcela_atual || `${idx + 1}`}</span>
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
                            <span className={`parcela-item__status parcela-item__status--${parcela.efetivado ? 'paga' : 'pendente'}`}>
                              {parcela.efetivado ? 'Paga' : 'Pendente'}
                            </span>
                          </div>
                          
                          {/* ✅ BOTÕES DE AÇÃO PARA PARCELAS INDIVIDUAIS */}
                          <div className="parcela-item__acoes">
                            <div className="action-buttons" style={{ opacity: 1, display: 'flex', gap: '2px', justifyContent: 'center' }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditarTransacao(parcela);
                                }}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '3px',
                                  background: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#3b82f6'
                                }}
                                title="Editar parcela"
                              >
                                <Edit3 size={10} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExcluirTransacao(parcela);
                                }}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '3px',
                                  background: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ef4444'
                                }}
                                title="Excluir parcela"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {transacoesAgrupadasProcessadas.length === 0 && (
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
              <span className={`sidebar-card__status ${statusFatura.status_paga ? 'status-verde' : 'status-amarelo'}`}>
                {statusFatura.status_paga ? 'Paga' : 'Em Aberto'}
              </span>
              <p className="sidebar-card__info">
                {statusFatura.status_paga 
                  ? `${statusFatura.transacoes_efetivadas} transações efetivadas`
                  : `${statusFatura.total_transacoes} transações pendentes`
                }
              </p>
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
                    strokeDasharray={`${((100 - (cartaoProcessado.percentual_limite_formatado || 0)) * 0.8) * 2.2} 220`}
                    strokeLinecap="round"
                    className="score-circular__progress"
                  />
                </svg>
                <span className="score-circular__valor">
                  {Math.max(0, 100 - (cartaoProcessado.percentual_limite_formatado || 0))}
                </span>
              </div>
              <p className="sidebar-card__status status-verde">
                {cartaoProcessado.percentual_limite_formatado <= 30 ? 'Excelente' : 
                 cartaoProcessado.percentual_limite_formatado <= 60 ? 'Boa' : 'Atenção'}
              </p>
              <p className="sidebar-card__info">Seu uso está {cartaoProcessado.percentual_limite_formatado <= 60 ? 'saudável' : 'alto'}</p>
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
                  <strong>{gastosPorCategoria[0]?.categoria_nome || 'Outros'}</strong> foi sua maior categoria este mês
                </p>
              </div>
              <div className="insight-mini insight-mini--blue">
                <p className="insight-mini__titulo">💡 Dica de Economia</p>
                <p className="insight-mini__texto">
                  Continue controlando seus gastos!
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
        </div>
      </div>

      {/* Modais Originais */}
      <ModalPagamentoFatura
        isOpen={modalPagamento}
        onClose={() => setModalPagamento(false)}
        cartao={cartaoSelecionado}
        valorFatura={valorFaturaAtual}
        faturaVencimento={faturaAtual?.fatura_vencimento || null}
        mesReferencia={faturaAtual ? formatarMesPortugues(faturaAtual.fatura_vencimento) : ''}
        onSuccess={handleSuccessOperacao}
      />

      <ModalReabrirFatura
        isOpen={modalReabertura}
        onClose={() => setModalReabertura(false)}
        cartao={cartaoSelecionado}
        valorFatura={valorFaturaAtual}
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

      {/* ✅ MODAL DE EDIÇÃO - CORRIGIDO */}
      <DespesasCartaoModal
        isOpen={modalEdicao}
        onClose={handleFecharEdicao}
        onSave={handleSalvarEdicao}
        transacaoEditando={transacaoEditando}
      />

      {/* ✅ MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalConfirmacao && transacaoParaExcluir && (
        <div className="modal-overlay active">
          <div className="forms-modal-container">
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon-container modal-icon-danger">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h2 className="modal-title">Confirmar Exclusão</h2>
                  <p className="modal-subtitle">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <button 
                onClick={cancelarExclusao}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-question">
                <p className="confirmation-text">
                  Tem certeza que deseja excluir esta transação?
                </p>
              </div>
              
              <div className="confirmation-info">
                <div className="confirmation-item">
                  <strong>Descrição:</strong> {transacaoParaExcluir.descricao}
                </div>
                <div className="confirmation-item">
                  <strong>Valor:</strong> {formatCurrency(Math.abs(transacaoParaExcluir.valor))}
                </div>
                <div className="confirmation-item">
                  <strong>Data:</strong> {transacaoParaExcluir.data ? new Date(transacaoParaExcluir.data).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                <div className="confirmation-item">
                  <strong>Categoria:</strong> {transacaoParaExcluir.categoria_nome || 'N/A'}
                </div>
                {transacaoParaExcluir.parcela_atual && (
                  <div className="confirmation-item">
                    <strong>Parcela:</strong> {transacaoParaExcluir.parcela_atual}/{transacaoParaExcluir.numero_parcelas || transacaoParaExcluir.total_parcelas}
                  </div>
                )}
              </div>

              <div className="confirmation-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                <p>
                  Esta transação será excluída permanentemente. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <div className="footer-right">
                <button 
                  onClick={cancelarExclusao}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarExclusao}
                  className="btn-secondary btn-secondary--danger"
                >
                  <Trash2 size={14} />
                  Excluir Transação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoCartoes;