import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, AlertTriangle, CheckCircle, Filter, Download, Eye, EyeOff, CreditCard, Banknote, ArrowRight, X, Clock, Repeat, Zap } from 'lucide-react';

// Hooks
import useAuth from '@modules/auth/hooks/useAuth';

// Services
import { supabase } from '@lib/supabaseClient';

// Styles
import '@shared/styles/PrincipalArquivoDeClasses.css';

// Hook para buscar contas do usuário
const useUserContas = (userId) => {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContas = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('contas')
          .select(`
            id,
            nome,
            tipo,
            banco,
            cor,
            icone,
            ativo,
            cartoes (
              id,
              nome,
              bandeira,
              limite
            )
          `)
          .eq('usuario_id', userId)
          .eq('ativo', true)
          .order('nome');

        if (fetchError) throw fetchError;

        // Formatar dados para o select
        const contasFormatadas = data.map(conta => ({
          id: conta.id,
          nome: conta.nome,
          tipo: conta.cartoes && conta.cartoes.length > 0 ? 'cartao' : conta.tipo,
          banco: conta.banco,
          cor: conta.cor,
          icone: conta.icone
        }));

        setContas(contasFormatadas);
      } catch (err) {
        console.error('Erro ao buscar contas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContas();
  }, [userId]);

  return { contas, loading, error };
};

// Hook personalizado para buscar dados da análise
const useContaAnalysis = (contaId, periodo, userId) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalysisData = async () => {
    if (!contaId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Chamada REAL para a função do banco
      const { data, error: rpcError } = await supabase.rpc(
        'ip_prod_analise_conta_completa',
        {
          p_conta_id: contaId,
          p_usuario_id: userId,
          p_periodo: periodo
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message || 'Erro ao buscar dados da análise');
      }

      if (!data) {
        throw new Error('Nenhum dado retornado pela função');
      }

      console.log('Dados recebidos do banco:', data); // Debug
      setDados(data);
      
    } catch (err) {
      console.error('Erro ao buscar análise da conta:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [contaId, periodo, userId]);

  return { dados, loading, error, refetch: fetchAnalysisData };
};

// Componente de estado vazio quando não há dados
const EmptyState = ({ message = "Nenhum dado encontrado para esta conta no período selecionado" }) => (
  <div className="ip_estado_vazio">
    <div className="ip_estado_vazio_icone">📊</div>
    <h3 className="ip_estado_vazio_titulo">Sem dados para análise</h3>
    <p className="ip_estado_vazio_descricao">{message}</p>
  </div>
);

// Componente de loading
const LoadingSpinner = () => (
  <div className="ip_loading_container">
    <div className="ip_loading_spinner"></div>
    <p className="ip_loading_texto">Carregando análise da conta...</p>
  </div>
);

// Componente de erro
const ErrorMessage = ({ error, onRetry }) => (
  <div className="ip_card_medio">
    <div className="ip_mensagem_feedback erro">
      <AlertTriangle size={20} />
      <div>
        <strong>Erro ao carregar dados</strong>
        <p>{error}</p>
      </div>
    </div>
    {onRetry && (
      <button className="ip_botao_azul ip_mt_3" onClick={onRetry}>
        Tentar novamente
      </button>
    )}
  </div>
);

// Componente para quando não há autenticação
const AuthRequired = () => (
  <div className="ip_card_medio">
    <div className="ip_mensagem_feedback aviso">
      <AlertTriangle size={20} />
      <div>
        <strong>Autenticação necessária</strong>
        <p>Você precisa estar logado para ver a análise da conta.</p>
      </div>
    </div>
  </div>
);

// Componente principal
const ContaAnalysisPage = () => {
  // Estados da interface
  const [selectedConta, setSelectedConta] = useState('');
  const [periodo, setPeriodo] = useState('3m');
  const [showSaldos, setShowSaldos] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Hook de autenticação do projeto
  const { user, loading: authLoading } = useAuth();
  
  // Hook para buscar contas do usuário
  const { contas, loading: contasLoading, error: contasError } = useUserContas(user?.id);

  // Definir primeira conta como selecionada quando carregar
  useEffect(() => {
    if (contas && contas.length > 0 && !selectedConta) {
      setSelectedConta(contas[0].id);
    }
  }, [contas, selectedConta]);

  // Hook para buscar dados da análise
  const { dados, loading: analysisLoading, error: analysisError, refetch } = useContaAnalysis(
    selectedConta, 
    periodo, 
    user?.id
  );

  // Mapeamento de ícones
  const iconMap = {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Repeat,
    Clock
  };

  // Handlers
  const handleCategoryClick = (data) => {
    setSelectedCategory(data);
    setDrawerOpen(true);
  };

  const formatCurrency = (value) => {
    if (!showSaldos || value === null || value === undefined) return '••••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (!showSaldos || value === null || value === undefined) return '••••••';
    return `${value > 0 ? '+' : ''}${value}%`;
  };

  // Estados de carregamento e verificações
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthRequired />;
  }

  if (contasLoading) {
    return <LoadingSpinner />;
  }

  if (contasError) {
    return <ErrorMessage error={contasError} onRetry={() => window.location.reload()} />;
  }

  if (!contas || contas.length === 0) {
    return <EmptyState message="Você ainda não possui contas cadastradas. Cadastre uma conta para ver a análise." />;
  }

  if (analysisLoading) {
    return <LoadingSpinner />;
  }

  if (analysisError) {
    return <ErrorMessage error={analysisError} onRetry={refetch} />;
  }

  if (!dados) {
    return <EmptyState />;
  }

  // Destructuring dos dados vindos do banco
  const {
    conta,
    resumoPeriodo,
    evolucaoFinanceira = [],
    categoriasDespesas = [],
    sazonalidadeSemanal = [],
    insights = [],
    projecao,
    proximosEventos = [],
    transacoesRecentes = []
  } = dados;

  return (
    <div className="ip_container_basico" style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Roboto', sans-serif" }}>
      {/* Header */}
      <div className="ip_card_grande">
        <div className="ip_flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="ip_texto_principal" style={{ fontSize: '24px', fontWeight: '700', color: '#333', margin: '0 0 8px 0' }}>
              Análise Detalhada por Conta
            </h1>
            <p style={{ color: '#666', margin: '0', fontSize: '16px' }}>
              Veja se vai faltar ou sobrar dinheiro nesta conta e o que fazer agora.
            </p>
          </div>
          
          <div className="ip_flex ip_gap_3">
            <select 
              value={selectedConta} 
              onChange={(e) => setSelectedConta(e.target.value)}
              className="ip_input_select"
              style={{ minWidth: '160px' }}
              disabled={contasLoading}
            >
              <option value="">Selecione uma conta</option>
              {contas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} - {conta.banco}
                </option>
              ))}
            </select>
            
            <select 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
              className="ip_input_select"
              style={{ minWidth: '160px' }}
            >
              <option value="1m">Último mês</option>
              <option value="3m">Últimos 3 meses</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="1y">Último ano</option>
            </select>
            
            <button 
              onClick={() => setShowSaldos(!showSaldos)}
              className="ip_botao_azul ip_flex ip_gap_2"
            >
              {showSaldos ? <Eye size={16} /> : <EyeOff size={16} />}
              {showSaldos ? 'Ocultar Valores' : 'Mostrar Valores'}
            </button>
          </div>
        </div>
      </div>

      {/* Resumo da Conta */}
      <div className="ip_card_grande">
        <div className="ip_flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div className="ip_flex ip_gap_3" style={{ marginBottom: '16px' }}>
              <div className="ip_icone_item" style={{ background: conta.cor || '#008080' }}>
                {conta.isCartao ? <CreditCard size={20} /> : <Banknote size={20} />}
              </div>
              <div className="ip_info_item">
                <h2 className="ip_nome_item">{conta.nome}</h2>
                <p className="ip_tipo_item">{conta.tipo} • {conta.banco}</p>
              </div>
            </div>
            <div className="ip_flex ip_gap_4">
              <div className="ip_info_item">
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {conta.isCartao ? 'Fatura Atual' : 'Saldo Atual'}
                </span>
                <span className="ip_valor_destaque" style={{ color: '#008080' }}>
                  {formatCurrency(conta.saldoAtual)}
                </span>
              </div>
              <div className="ip_flex ip_flex_coluna ip_gap_2">
                <span className="ip_badge_azul">
                  D+30: {formatCurrency(projecao.projecao30dias)}
                </span>
                {conta.isCartao && conta.limite && (
                  <span className="ip_badge_amarelo">
                    Limite: {formatCurrency(conta.limite)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="ip_flex ip_gap_4">
            <div className="ip_card_estatistica receitas">
              <div className="ip_icone_estatistica">
                <TrendingUp size={20} />
              </div>
              <div className="ip_conteudo_estatistica">
                <div className="ip_valor_estatistica">
                  {formatCurrency(resumoPeriodo.totalEntradas)}
                </div>
                <div className="ip_label_estatistica">
                  {conta.isCartao ? 'Compras no Período' : 'Entradas no Período'}
                </div>
              </div>
            </div>
            <div className="ip_card_estatistica despesas">
              <div className="ip_icone_estatistica">
                <TrendingDown size={20} />
              </div>
              <div className="ip_conteudo_estatistica">
                <div className="ip_valor_estatistica">
                  {formatCurrency(resumoPeriodo.totalSaidas)}
                </div>
                <div className="ip_label_estatistica">
                  {conta.isCartao ? 'Pagamentos' : 'Saídas no Período'}
                </div>
              </div>
            </div>
            <div className="ip_card_estatistica saldo">
              <div className="ip_icone_estatistica">
                <Target size={20} />
              </div>
              <div className="ip_conteudo_estatistica">
                <div className={`ip_valor_estatistica ${resumoPeriodo.variacao >= 0 ? 'positivo' : 'negativo'}`}>
                  {formatCurrency(resumoPeriodo.variacao)}
                </div>
                <div className="ip_label_estatistica">
                  Variação no Período
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Insights */}
      {insights && insights.length > 0 && (
        <div className="ip_mb_4">
          <h3 className="ip_texto_principal" style={{ fontSize: '18px', marginBottom: '16px' }}>
            Insights Inteligentes
          </h3>
          <div className="ip_grid_responsivo_cards">
            {insights.map((insight, index) => {
              const IconComponent = iconMap[insight.icon] || AlertTriangle;
              const borderColor = insight.tipo === 'positivo' ? '#006400' : 
                                 insight.tipo === 'atencao' ? '#ffc107' : '#666666';
              const badgeColor = insight.prioridade === 'Alta' ? { bg: '#ffebee', color: '#dc3545' } :
                                insight.prioridade === 'Média' ? { bg: '#fff3e0', color: '#ff9800' } :
                                { bg: '#e8f5e8', color: '#006400' };
              
              return (
                <div key={index} className="ip_card_medio" style={{ borderLeft: `4px solid ${borderColor}` }}>
                  <div className="ip_flex ip_gap_3" style={{ marginBottom: '12px' }}>
                    <IconComponent size={20} color="#008080" />
                    <div className="ip_flex" style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 className="ip_texto_principal" style={{ fontSize: '16px', margin: '0' }}>
                        {insight.titulo}
                      </h4>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        background: badgeColor.bg,
                        color: badgeColor.color
                      }}>
                        {insight.prioridade}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    {insight.descricao}
                  </p>
                  <div className="ip_flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="ip_valor_verde" style={{ fontSize: '16px' }}>
                      {showSaldos ? insight.valor : '••••••'}
                    </span>
                    <button className="ip_botao_azul ip_botao_pequeno ip_flex ip_gap_1">
                      {insight.cta}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projeção próximos 30 dias */}
      <div className="ip_card_grande ip_mb_4">
        <div className="ip_flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '16px' }}>
          <div>
            <h3 className="ip_texto_principal" style={{ fontSize: '18px', marginBottom: '8px' }}>
              Projeção próximos 30 dias
            </h3>
            <p style={{ color: '#666', fontSize: '14px', margin: '0', lineHeight: '1.5' }}>
              Se nada mudar, em 15 dias você deve estar com <strong>
                {formatCurrency(projecao.projecao15dias)}
              </strong>
            </p>
          </div>
          <button className="ip_botao_azul ip_flex ip_gap_2">
            <Clock size={16} />
            Agendar provisão
          </button>
        </div>
        
        <div className="ip_card_pequeno" style={{ background: '#fafafa' }}>
          <div className="ip_flex" style={{ justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
            <span className="ip_badge_azul" style={{ fontSize: '12px' }}>
              D+7: {formatCurrency(projecao.projecao7dias)}
            </span>
            <span className="ip_badge_azul" style={{ fontSize: '12px' }}>
              D+15: {formatCurrency(projecao.projecao15dias)}
            </span>
            <span className="ip_badge_azul" style={{ fontSize: '12px' }}>
              D+30: {formatCurrency(projecao.projecao30dias)}
            </span>
          </div>
          
          <div>
            <h4 className="ip_texto_principal" style={{ fontSize: '14px', marginBottom: '12px' }}>
              Próximos eventos
            </h4>
            <div className="ip_flex ip_flex_coluna ip_gap_2">
              {proximosEventos.map((evento, index) => {
                const borderColor = evento.tipo === 'entrada' ? '#006400' :
                                  evento.tipo === 'saida' ? '#dc3545' :
                                  evento.tipo === 'fatura' ? '#ff9800' : '#008080';
                
                return (
                  <div key={index} className="ip_card_minusculo" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'auto 1fr auto', 
                    gap: '12px', 
                    alignItems: 'center',
                    borderLeft: `3px solid ${borderColor}`
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#666', minWidth: '50px' }}>
                      {evento.data}
                    </span>
                    <span style={{ fontSize: '14px', color: '#333' }}>
                      {evento.evento}
                    </span>
                    <span className={evento.valor > 0 ? 'ip_valor_verde' : 'ip_valor_vermelho'} style={{ fontSize: '14px' }}>
                      {formatCurrency(evento.valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="ip_grid_2_colunas ip_mb_4">
        {/* Evolução Financeira */}
        <div className="ip_grafico_container">
          <div style={{ marginBottom: '16px' }}>
            <h3 className="ip_grafico_titulo" style={{ fontSize: '16px' }}>Evolução Financeira</h3>
            <p style={{ color: '#666', fontSize: '14px', margin: '0', textAlign: 'center' }}>
              Entradas, saídas e saldo ao longo do tempo
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoFinanceira}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelStyle={{ color: '#333' }}
              />
              <Legend />
              {evolucaoFinanceira.length > 0 && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="entradas" 
                    stroke="#006400" 
                    strokeWidth={3}
                    name={conta?.isCartao ? "Compras" : "Entradas"}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saidas" 
                    stroke="#DC3545" 
                    strokeWidth={3}
                    name={conta?.isCartao ? "Pagamentos" : "Saídas"}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#008080" 
                    strokeWidth={3}
                    name={conta?.isCartao ? "Fatura" : "Saldo"}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Categoria */}
        <div className="ip_grafico_container">
          <div style={{ marginBottom: '16px' }}>
            <h3 className="ip_grafico_titulo" style={{ fontSize: '16px' }}>Distribuição por Categoria</h3>
            <p style={{ color: '#666', fontSize: '14px', margin: '0', textAlign: 'center' }}>
              Clique em uma fatia para ver detalhes
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              {categoriasDespesas.length > 0 && (
                <Pie
                  data={categoriasDespesas}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  onClick={handleCategoryClick}
                  style={{ cursor: 'pointer' }}
                  label={({ name, percentual }) => showSaldos ? `${name} ${percentual}%` : '••••••'}
                >
                  {categoriasDespesas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              )}
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sazonalidade */}
      <div className="ip_grafico_container ip_mb_4">
        <div style={{ marginBottom: '16px' }}>
          <h3 className="ip_grafico_titulo" style={{ fontSize: '16px' }}>Padrão de Gastos por Semana do Mês</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '0', textAlign: 'center' }}>
            Identificando sua sazonalidade financeira
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sazonalidadeSemanal}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="semana" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelStyle={{ color: '#333' }}
            />
            {sazonalidadeSemanal.length > 0 && (
              <Bar dataKey="valor" fill="#008080" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela Auditável */}
      <div className="ip_card_grande ip_mb_4">
        <div style={{ marginBottom: '16px' }}>
          <h3 className="ip_texto_principal" style={{ fontSize: '18px', marginBottom: '4px' }}>
            Modo Auditável
          </h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '0' }}>
            Últimas transações do período selecionado
          </p>
        </div>
        
        <div className="ip_tabela">
          <div className="ip_tabela_header">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 100px 120px 110px 80px',
              gap: '12px',
              padding: '12px 16px'
            }}>
              <span>Data</span>
              <span>Descrição</span>
              <span>Valor</span>
              <span>Categoria</span>
              <span>Tipo</span>
              <span>Ações</span>
            </div>
          </div>
          
          {transacoesRecentes.map((transacao) => (
            <div key={transacao.id} className="ip_tabela_linha">
              <div className="ip_tabela_celula" style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 100px 120px 110px 80px',
                gap: '12px',
                alignItems: 'center'
              }}>
                <span>{transacao.data}</span>
                <span className="ip_flex ip_gap_2">
                  <span>{transacao.icon}</span>
                  {transacao.descricao}
                  {!transacao.efetivado && (
                    <span className="ip_badge_amarelo" style={{ fontSize: '10px' }}>Pendente</span>
                  )}
                </span>
                <span className={transacao.valor > 0 ? 'ip_valor_verde' : 'ip_valor_vermelho'}>
                  {formatCurrency(transacao.valor)}
                </span>
                <span>{transacao.categoria}</span>
                <span>
                  <span className={`ip_badge_${transacao.tipo === 'Recorrente' ? 'azul' : 
                                   transacao.tipo === 'Parcela' ? 'roxo' : 'amarelo'}`} 
                        style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {transacao.tipo === 'Recorrente' && <Repeat size={12} />}
                    {transacao.tipo === 'Parcela' && <Calendar size={12} />}
                    {transacao.tipo === 'Extra' && <Zap size={12} />}
                    {transacao.tipo}
                  </span>
                </span>
                <div className="ip_flex ip_gap_1">
                  <button className="ip_botao_icone_pequeno_card" disabled title="Recategorizar">📝</button>
                  <button className="ip_botao_icone_pequeno_card" disabled title="Dividir">✂️</button>
                  <button className="ip_botao_icone_pequeno_card" disabled title="Ignorar">👁️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="ip_flex ip_gap_3" style={{ justifyContent: 'center', padding: '20px 0' }}>
        <button className="ip_botao_azul ip_flex ip_gap_2">
          <Download size={16} />
          Exportar Relatório
        </button>
        <button className="ip_botao_azul_outline ip_flex ip_gap_2">
          <Filter size={16} />
          Filtros Avançados
        </button>
        <button className="ip_botao_azul_outline ip_flex ip_gap_2">
          <Target size={16} />
          Criar Regra a partir do Insight
        </button>
      </div>

      {/* Drawer para categoria selecionada */}
      {drawerOpen && selectedCategory && (
        <div 
          className="ip_modal_fundo"
          onClick={() => setDrawerOpen(false)}
        >
          <div 
            className="ip_modal_medio"
            style={{
              width: '400px',
              height: '100%',
              marginLeft: 'auto',
              marginRight: '0',
              borderRadius: '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ip_header_azul">
              <h3 className="ip_modal_titulo">Detalhes: {selectedCategory.name}</h3>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="ip_modal_close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="ip_modal_content">
              <div className="ip_grid_3_colunas ip_mb_4">
                <div className="ip_card_pequeno ip_texto_centro">
                  <span className="ip_label_estatistica">Total gasto</span>
                  <span className="ip_metrica_numero" style={{ fontSize: '18px' }}>
                    {formatCurrency(selectedCategory.value)}
                  </span>
                </div>
                <div className="ip_card_pequeno ip_texto_centro">
                  <span className="ip_label_estatistica">Transações</span>
                  <span className="ip_metrica_numero" style={{ fontSize: '18px' }}>
                    {selectedCategory.transacoes}
                  </span>
                </div>
                <div className="ip_card_pequeno ip_texto_centro">
                  <span className="ip_label_estatistica">Ticket médio</span>
                  <span className="ip_metrica_numero" style={{ fontSize: '18px' }}>
                    {formatCurrency(selectedCategory.value / selectedCategory.transacoes)}
                  </span>
                </div>
              </div>
              
              <div className="ip_card_pequeno">
                <h4 className="ip_texto_principal" style={{ fontSize: '14px', marginBottom: '8px' }}>
                  Participação no Total
                </h4>
                <div className="ip_flex" style={{ alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${selectedCategory.percentual}%`,
                      height: '100%',
                      background: selectedCategory.color,
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: selectedCategory.color }}>
                    {selectedCategory.percentual}%
                  </span>
                </div>
              </div>
              
              <p style={{ color: '#666', fontSize: '14px', marginTop: '16px' }}>
                Esta categoria representa {selectedCategory.percentual}% dos seus gastos no período analisado. 
                {selectedCategory.percentual > 30 && (
                  <strong> Considere analisar se há oportunidades de otimização nesta categoria.</strong>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de última atualização */}
      <div className="ip_flex" style={{ justifyContent: 'center', padding: '10px 0', fontSize: '12px', color: '#999' }}>
        Dados atualizados em tempo real • Última sincronização: {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  );
};

export default ContaAnalysisPage;