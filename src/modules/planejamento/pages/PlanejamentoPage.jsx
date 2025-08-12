import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, ArrowLeft, ArrowRight, Target, TrendingUp, AlertTriangle, 
  CheckCircle, Edit3, Trophy, Clock, Zap, Brain, PieChart,
  DollarSign, Plus, Minus, BarChart3, ChevronDown, ChevronUp, 
  ChevronRight, HelpCircle, Home, Info, Search, TrendingDown,
  Lightbulb, Calculator, History
} from 'lucide-react';
import useAuth from '@modules/auth/hooks/useAuth';
import useCategorias from '@modules/categorias/hooks/useCategorias';
import { supabase } from '@lib/supabaseClient';
import '@shared/styles/PrincipalArquivoDeClasses.css';

/**
 * 💰 PLANEJAMENTO FINANCEIRO - Redesign com Sugestões e Projeções
 * Interface compacta e funcional com histórico e meta de economia
 */
const PlanejamentoPage = () => {
  const { user } = useAuth();
  const { categorias, loading: loadingCategorias, error: errorCategorias } = useCategorias();
  
  // Estados principais
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const mesFormatado = `${ano}-${String(mes).padStart(2, '0')}`;
    return mesFormatado;
  });
  
  const [planejamento, setPlanejamento] = useState([]);
  const [projecoesMensais, setProjecoesMensais] = useState([]);
  const [historicoCategorias, setHistoricoCategorias] = useState([]);
  const [resumoRegra, setResumoRegra] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editandoItem, setEditandoItem] = useState(null);
  const [valorTemp, setValorTemp] = useState('');
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  
  // Estados de colapso
  const [despesasColapsadas, setDespesasColapsadas] = useState(false);
  const [receitasColapsadas, setReceitasColapsadas] = useState(false);
  const [categoriasColapsadas, setCategoriasColapsadas] = useState({});
  
  // Estados para sugestões e economia
  const [mostrandoSugestoes, setMostrandoSugestoes] = useState({});
  const [buscandoEconomia, setBuscandoEconomia] = useState(false);
  const [metaEconomia, setMetaEconomia] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    if (user && categorias.length > 0) {
      carregarDados();
    }
  }, [user, mesAtual, categorias]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarPlanejamento(),
        carregarProjecoesMensais(),
        carregarHistoricoCategorias(),
        carregarResumoRegra(),
        carregarPerfilUsuario()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      mostrarFeedback('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarPlanejamento = async () => {
    try {
    const { data, error } = await supabase.rpc('planejamento_mensal_ipoupei_2025', {
        p_mes_ano: mesAtual
      });
      
      if (error) throw error;
      setPlanejamento(data || []);
      
    } catch (error) {
      console.error('❌ Erro ao carregar planejamento:', error);
      setPlanejamento([]);
    }
  };

  // Nova função para carregar projeções mensais (planejadas + efetivadas)
  const carregarProjecoesMensais = async () => {
    try {
      const { data, error } = await supabase.rpc('projecoes_mensais_ipoupei_2025', {
        p_mes_ano: mesAtual
      });
      
      if (error) throw error;
      setProjecoesMensais(data || []);
      
    } catch (error) {
      console.error('❌ Erro ao carregar projeções:', error);
      setProjecoesMensais([]);
    }
  };

  // Nova função para carregar histórico das categorias (últimos 6 meses)
  const carregarHistoricoCategorias = async () => {
    try {
      const { data, error } = await supabase.rpc('historico_categorias_ipoupei_2025', {
        p_usuario_id: user.id,
        p_meses_anteriores: 6
      });
      
      if (error) throw error;
      setHistoricoCategorias(data || []);
      
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      setHistoricoCategorias([]);
    }
  };

  const carregarResumoRegra = async () => {
    try {
      const { data, error } = await supabase.rpc('resumo_regra_50_30_20', {
        p_mes_ano: mesAtual
      });
      
      if (error) throw error;
      setResumoRegra(data);
    } catch (error) {
      console.error('Erro ao carregar resumo regra:', error);
      setResumoRegra(null);
    }
  };

  const carregarPerfilUsuario = async () => {
    try {
      const { data, error } = await supabase.rpc('ip_prod_buscar_valor_hora_trabalhada', {
        p_usuario_id: user.id
      });

      if (error) {
        setPerfilUsuario(null);
        return;
      }

      if (data && data.length > 0) {
        const dadosHora = data[0];
        const perfilCompleto = {
          valor_hora_trabalho: dadosHora.valor_hora_trabalhada,
          renda_mensal: dadosHora.renda_mensal,
          nome: dadosHora.nome || dadosHora.nome_completo,
          horas_trabalhadas_mes: dadosHora.horas_mes || dadosHora.media_horas_trabalhadas_mes,
          dados_completos: dadosHora.tem_dados_completos || (dadosHora.valor_hora_trabalhada > 0),
          tipo_renda: dadosHora.tipo_renda
        };
        setPerfilUsuario(perfilCompleto);
      } else {
        setPerfilUsuario(null);
      }
      
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar perfil:', error);
      setPerfilUsuario(null);
    }
  };

  const salvarPlanejamento = async (categoriaId, subcategoriaId, valor) => {
    try {
      const { data, error } = await supabase.rpc('salvar_planejamento', {
        p_mes_ano: mesAtual,
        p_categoria_id: categoriaId,
        p_valor_planejado: parseFloat(valor) || 0,
        p_subcategoria_id: subcategoriaId || null
      });

      if (error) throw error;
      
      if (data?.success) {
        await carregarDados();
        mostrarFeedback('Planejamento salvo!', 'success');
      } else {
        throw new Error(data?.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      mostrarFeedback('Erro ao salvar: ' + error.message, 'error');
    }
  };

  // Nova função para buscar economia automática
  const buscarEconomiaAutomatica = async () => {
    if (!metaEconomia || parseFloat(metaEconomia) <= 0) {
      mostrarFeedback('Informe uma meta de economia válida', 'error');
      return;
    }

    setBuscandoEconomia(true);
    try {
      const { data, error } = await supabase.rpc('economia_categorias_ipoupei_2025', {
        p_usuario_id: user.id,
        p_mes_ano: mesAtual,
        p_meta_economia: parseFloat(metaEconomia)
      });

      if (error) throw error;

      if (data && data.length > 0) {
        // Aplicar as sugestões automaticamente
        for (const sugestao of data) {
          await salvarPlanejamento(
            sugestao.categoria_id,
            sugestao.subcategoria_id,
            sugestao.valor_sugerido
          );
        }
        
        mostrarFeedback(`Economia de R$ ${metaEconomia} aplicada com sucesso!`, 'success');
        setMetaEconomia('');
      } else {
        mostrarFeedback('Não foi possível encontrar economia suficiente', 'error');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar economia:', error);
      mostrarFeedback('Erro ao buscar economia: ' + error.message, 'error');
    } finally {
      setBuscandoEconomia(false);
    }
  };

  // Função para obter sugestão baseada no histórico
const obterSugestaoHistorica = (categoriaId, subcategoriaId = null) => {
  const historico = historicoCategorias.find(h => 
    String(h.categoria_id) === String(categoriaId) && 
    (subcategoriaId ? String(h.subcategoria_id) === String(subcategoriaId) : !h.subcategoria_id)
  );
  
  return historico ? {
    media: historico.valor_medio || 0,
    tendencia: historico.tendencia || 'estavel',
    meses_dados: historico.meses_com_dados || 0
  } : null;
};


const iniciarEdicao = (categoriaId, subcategoriaId = null) => {
  console.log('✏️ Iniciando edição:', { categoriaId, subcategoriaId });
  
  let valorAtual = 0;
  
  if (subcategoriaId) {
    const itemSubcategoria = planejamento.find(p => 
      String(p.categoria_id) === String(categoriaId) && String(p.subcategoria_id) === String(subcategoriaId)
    );
    valorAtual = itemSubcategoria?.valor_planejado || 0;
  } else {
    const itemCategoriaPrincipal = planejamento.find(p => 
      String(p.categoria_id) === String(categoriaId) && !p.subcategoria_id
    );
    
    if (itemCategoriaPrincipal) {
      valorAtual = itemCategoriaPrincipal.valor_planejado || 0;
    } else {
      valorAtual = 0;
    }
  }
  
  setEditandoItem({ categoriaId, subcategoriaId });
  setValorTemp(valorAtual.toString());
};
  const cancelarEdicao = () => {
    setEditandoItem(null);
    setValorTemp('');
    setMostrandoSugestoes({});
  };

  const confirmarEdicao = async () => {
    if (!editandoItem) return;
    
    try {
      await salvarPlanejamento(
        editandoItem.categoriaId, 
        editandoItem.subcategoriaId, 
        valorTemp
      );
      
      setEditandoItem(null);
      setValorTemp('');
      setMostrandoSugestoes({});
      
    } catch (error) {
      console.error('❌ Erro na confirmação:', error);
      mostrarFeedback('Erro ao salvar: ' + error.message, 'error');
    }
  };

  // Função para aplicar sugestão histórica
  const aplicarSugestao = (valor) => {
    setValorTemp(valor.toString());
  };

  // Função para toggle de sugestões
  const toggleSugestoes = (categoriaId, subcategoriaId = null) => {
    const chave = `${categoriaId}-${subcategoriaId || 'principal'}`;
    setMostrandoSugestoes(prev => ({
      ...prev,
      [chave]: !prev[chave]
    }));
  };

  const navegarMes = (direcao) => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const novaData = new Date(ano, mes - 1);
    novaData.setMonth(novaData.getMonth() + direcao);
    
    const novoMes = `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}`;
    setMesAtual(novoMes);
  };

  const voltarParaHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const mesHoje = `${ano}-${String(mes).padStart(2, '0')}`;
    setMesAtual(mesHoje);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor || 0);
  };

  const formatarHoras = (valor) => {
    if (!perfilUsuario?.valor_hora_trabalho || perfilUsuario.valor_hora_trabalho <= 0) {
      return '--h';
    }
    const horas = (valor || 0) / perfilUsuario.valor_hora_trabalho;
    return `${horas.toFixed(0)}h`;
  };

  const mostrarFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: '', type: '' }), 3000);
  };

  const obterStatusCategoria = (planejado, executado) => {
    if (!planejado) return 'sem-planejamento';
    const percentual = (executado / planejado) * 100;
    if (percentual <= 80) return 'sucesso';
    if (percentual <= 100) return 'atencao';
    return 'excesso';
  };

  const toggleColapsarCategoria = (categoriaId) => {
    setCategoriasColapsadas(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }));
  };

  // Função para obter valor projetado (planejado + efetivado)
const obterValorProjetado = (categoriaId, subcategoriaId = null) => {
  const projecao = projecoesMensais.find(p => 
    p.categoria_id === categoriaId && 
    // MUDANÇA: comparar como string se for UUID
    (subcategoriaId ? String(p.subcategoria_id) === String(subcategoriaId) : !p.subcategoria_id)
  );
  
  return {
    valor_planejado: projecao?.valor_planejado || 0,
    valor_efetivado: projecao?.valor_efetivado || 0,
    valor_total: (projecao?.valor_planejado || 0) + (projecao?.valor_efetivado || 0)
  };
};
  // Dados computados
 const categoriasPorTipo = useMemo(() => {
  console.log('🔄 Recalculando categoriasPorTipo...');
  
  const resultado = { despesa: [], receita: [] };
  
  categorias.forEach(categoria => {
    if (categoria.tipo && resultado[categoria.tipo]) {
      
      const itensPlanejamento = planejamento.filter(p => String(p.categoria_id) === String(categoria.id));
      
      const itemCategoriaPrincipal = itensPlanejamento.find(p => !p.subcategoria_id);
      const itensSubcategorias = itensPlanejamento.filter(p => p.subcategoria_id);
      
      const somaSubcategoriasPlanejado = itensSubcategorias.reduce((soma, item) => soma + (item.valor_planejado || 0), 0);
      
      // Obter projeção da categoria - COMPARAÇÃO COMO STRING
      const projecaoCategoria = obterValorProjetado(String(categoria.id));
      
      let valorCategoriaPlanejado = 0;
      let valorCategoriaProjetado = projecaoCategoria.valor_total;
      
      if (itemCategoriaPrincipal) {
        const valorDiretoCategoria = itemCategoriaPrincipal.valor_planejado || 0;
        
        if (somaSubcategoriasPlanejado > valorDiretoCategoria) {
          valorCategoriaPlanejado = somaSubcategoriasPlanejado;
        } else {
          valorCategoriaPlanejado = valorDiretoCategoria;
        }
      } else {
        valorCategoriaPlanejado = somaSubcategoriasPlanejado;
      }
      
      const subcategoriasComDados = itensSubcategorias.map(itemSub => {
        const subcategoriaInfo = categoria.subcategorias?.find(sub => String(sub.id) === String(itemSub.subcategoria_id)) || {
          id: itemSub.subcategoria_id,
          nome: itemSub.subcategoria_nome || `Subcategoria ${itemSub.subcategoria_id}`
        };
        
        const projecaoSub = obterValorProjetado(String(categoria.id), String(itemSub.subcategoria_id));
        
        return {
          ...subcategoriaInfo,
          valor_planejado: itemSub.valor_planejado || 0,
          valor_projetado: projecaoSub.valor_total
        };
      });
      
      const categoriaCompleta = {
        ...categoria,
        subcategorias: subcategoriasComDados,
        planejamento: {
          valor_planejado: valorCategoriaPlanejado,
          valor_projetado: valorCategoriaProjetado,
          percentual_executado: valorCategoriaPlanejado > 0 ? (valorCategoriaProjetado / valorCategoriaPlanejado) * 100 : 0,
          detalhes: itensPlanejamento,
          item_principal: itemCategoriaPrincipal,
          soma_subcategorias_planejado: somaSubcategoriasPlanejado
        }
      };
      
      resultado[categoria.tipo].push(categoriaCompleta);
    }
  });
  
  return resultado;
}, [categorias, planejamento, projecoesMensais]);

  const estatisticas = useMemo(() => {
    if (!resumoRegra) return null;
    
    const total = resumoRegra.total_planejado || 0;
    const executado = resumoRegra.total_executado || 0;
    const economia = Math.max(0, total - executado);
    
    return {
      total,
      executado,
      economia,
      percentualExecutado: total > 0 ? (executado / total) * 100 : 0,
      economiaAnual: economia * 12,
      horasEconomizadas: perfilUsuario?.valor_hora_trabalho ? economia / perfilUsuario.valor_hora_trabalho : 0
    };
  }, [resumoRegra, perfilUsuario]);

  const sucessoPlanejamento = useMemo(() => {
    if (!estatisticas) return { nivel: 'indefinido', texto: 'Sem dados' };
    
    const percentualExecutado = estatisticas.percentualExecutado;
    
    if (percentualExecutado <= 50) {
      return { nivel: 'excelente', texto: 'Execução Excelente!' };
    } else if (percentualExecutado <= 80) {
      return { nivel: 'bom', texto: 'Boa Execução' };
    } else if (percentualExecutado <= 100) {
      return { nivel: 'atencao', texto: 'Atenção aos Gastos' };
    } else {
      return { nivel: 'excesso', texto: 'Orçamento Estourado' };
    }
  }, [estatisticas]);

  if (loading || loadingCategorias) {
    return (
      <div className="ip_loading_container">
        <div className="ip_loading_spinner"></div>
        <span className="ip_loading_texto">Carregando planejamento...</span>
      </div>
    );
  }

  if (errorCategorias) {
    return (
      <div className="ip_estado_vazio">
        <AlertTriangle className="ip_estado_vazio_icone" />
        <h3 className="ip_estado_vazio_titulo">Erro ao carregar categorias</h3>
        <p className="ip_estado_vazio_descricao">Verifique suas categorias antes de acessar o planejamento.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--ip-cinza-50)',
      padding: 0 
    }}>
      {/* Header Estilo DRE */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div className="ip_flex ip_gap_3">
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain size={24} color="white" />
            </div>
            <div>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                margin: 0,
                color: '#1f2937'
              }}>
                Coach Financeiro
              </h1>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                margin: 0 
              }}>
                Planejamento Mensal Inteligente - {(() => {
                  const [ano, mes] = mesAtual.split('-');
                  const dataCorreta = new Date(parseInt(ano), parseInt(mes) - 1, 1);
                  return dataCorreta.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                })()}
              </p>
            </div>
          </div>
          
          <div className="ip_flex ip_gap_2">
            <button onClick={() => navegarMes(-1)} className="ip_botao_navegacao">
              <ArrowLeft size={16} />
            </button>
            <button onClick={voltarParaHoje} className="ip_botao_hoje">
              <Home size={14} />
              Hoje
            </button>
            <button onClick={() => navegarMes(1)} className="ip_botao_navegacao">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem 1rem'
      }}>

        {/* Ferramenta de Busca de Economia */}
        <div className="ip_card_pequeno" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <div className="ip_flex" style={{ alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
            <Search size={20} />
            <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>Buscar Economia</span>
          </div>
          
          <div className="ip_flex" style={{ gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', display: 'block' }}>
                Meta de economia mensal:
              </label>
              <input
                type="number"
                value={metaEconomia}
                onChange={(e) => setMetaEconomia(e.target.value)}
                placeholder="Ex: 500"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                step="0.01"
                min="0"
              />
            </div>
            <button
              onClick={buscarEconomiaAutomatica}
              disabled={buscandoEconomia || !metaEconomia}
              style={{
                background: buscandoEconomia ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                cursor: buscandoEconomia ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '500'
              }}
            >
              {buscandoEconomia ? (
                <>
                  <Calculator size={16} className="animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Lightbulb size={16} />
                  Buscar Economia
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        {estatisticas && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div className="ip_card_pequeno" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PLANEJADO TOTAL
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>
                {formatarMoeda(estatisticas.total)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {formatarHoras(estatisticas.total)}
              </div>
            </div>

            <div className="ip_card_pequeno" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PROJETADO
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>
                {formatarMoeda(estatisticas.executado)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {estatisticas.percentualExecutado.toFixed(0)}%
              </div>
            </div>

            <div className="ip_card_pequeno" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ECONOMIA
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669', marginBottom: '0.25rem' }}>
                {formatarMoeda(estatisticas.economia)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {formatarMoeda(estatisticas.economiaAnual)}/ano
              </div>
            </div>

            <div className="ip_card_pequeno" style={{ 
              textAlign: 'center', 
              padding: '1rem',
              background: sucessoPlanejamento.nivel === 'excelente' ? '#f0fdf4' :
                         sucessoPlanejamento.nivel === 'bom' ? '#f0f9ff' :
                         sucessoPlanejamento.nivel === 'atencao' ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${
                sucessoPlanejamento.nivel === 'excelente' ? '#bbf7d0' :
                sucessoPlanejamento.nivel === 'bom' ? '#bfdbfe' :
                sucessoPlanejamento.nivel === 'atencao' ? '#fed7aa' : '#fecaca'
              }`
            }}>
              <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                STATUS
              </div>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: sucessoPlanejamento.nivel === 'excelente' ? '#065f46' :
                       sucessoPlanejamento.nivel === 'bom' ? '#1e40af' :
                       sucessoPlanejamento.nivel === 'atencao' ? '#92400e' : '#991b1b',
                marginBottom: '0.25rem' 
              }}>
                {sucessoPlanejamento.texto}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Meta: 80%
              </div>
            </div>
          </div>
        )}

        {/* Regra 50/30/20 */}
        {resumoRegra && (
          <div className="ip_card_pequeno" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <div className="ip_flex" style={{ alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
              <PieChart size={20} />
              <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>Regra 50/30/20</span>
              <Info size={16} color="#6b7280" title="🏠 50% Necessidades | 🎯 30% Desejos | 💰 20% Investimentos" />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                height: '12px', 
                background: '#f3f4f6', 
                borderRadius: '6px', 
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{ 
                  position: 'absolute',
                  left: 0,
                  width: `${resumoRegra.necessidades?.percentual_atual || 0}%`,
                  height: '100%',
                  background: '#fca5a5'
                }} />
                
                <div style={{ 
                  position: 'absolute',
                  left: `${resumoRegra.necessidades?.percentual_atual || 0}%`,
                  width: `${resumoRegra.desejos?.percentual_atual || 0}%`,
                  height: '100%',
                  background: '#fde68a'
                }} />
                
                <div style={{ 
                  position: 'absolute',
                  left: `${(resumoRegra.necessidades?.percentual_atual || 0) + (resumoRegra.desejos?.percentual_atual || 0)}%`,
                  width: `${resumoRegra.investimentos?.percentual_atual || 0}%`,
                  height: '100%',
                  background: '#86efac'
                }} />
              </div>
            </div>
            
            <div className="ip_flex" style={{ gap: '2rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                🏠 Necessidades: {resumoRegra.necessidades?.percentual_atual?.toFixed(0) || 0}%
              </span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                🎯 Desejos: {resumoRegra.desejos?.percentual_atual?.toFixed(0) || 0}%
              </span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                💰 Investimentos: {resumoRegra.investimentos?.percentual_atual?.toFixed(0) || 0}%
              </span>
            </div>
          </div>
        )}

        {/* Seção Planejamento */}
        <div className="ip_card_pequeno" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ 
            padding: '1.5rem', 
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <div className="ip_flex" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} />
              <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                Planejamento por Categoria
              </span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                Clique para editar valores
              </span>
            </div>
          </div>

          {categorias.length === 0 ? (
            <div className="ip_estado_vazio" style={{ padding: '3rem' }}>
              <Target className="ip_estado_vazio_icone" size={48} />
              <h3 className="ip_estado_vazio_titulo">Nenhuma categoria encontrada</h3>
              <p className="ip_estado_vazio_descricao">Crie suas categorias primeiro para começar o planejamento.</p>
            </div>
          ) : (
            <div>
              {/* Receitas */}
              {categoriasPorTipo.receita.length > 0 && (
                <div>
                  <div 
                    style={{
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '0.75rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: '1px solid #bbf7d0'
                    }}
                    onClick={() => setReceitasColapsadas(!receitasColapsadas)}
                  >
                    <div className="ip_flex" style={{ alignItems: 'center', gap: '0.5rem' }}>
                      <Plus size={16} />
                      <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>RECEITAS</span>
                      {receitasColapsadas ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                      P: {formatarMoeda(categoriasPorTipo.receita.reduce((acc, cat) => acc + (cat.planejamento?.valor_planejado || 0), 0))} | 
                      R: {formatarMoeda(categoriasPorTipo.receita.reduce((acc, cat) => acc + (cat.planejamento?.valor_projetado || 0), 0))}
                    </div>
                  </div>
                  
                  {!receitasColapsadas && categoriasPorTipo.receita.map(categoria => {
                    const planejado = categoria.planejamento?.valor_planejado || 0;
                    const projetado = categoria.planejamento?.valor_projetado || 0;
                    const status = obterStatusCategoria(planejado, projetado);
                    const isEditando = editandoItem?.categoriaId === categoria.id && !editandoItem?.subcategoriaId;
                    const isColapsada = categoriasColapsadas[categoria.id];
                    const chaveSugestao = `${categoria.id}-principal`;
                    const mostrandoSugestao = mostrandoSugestoes[chaveSugestao];
                    const sugestaoHistorica = obterSugestaoHistorica(categoria.id);
                    
                    return (
                      <div key={categoria.id}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 80px',
                          alignItems: 'center',
                          padding: '0.5rem 1.5rem',
                          borderBottom: '1px solid #f3f4f6',
                          minHeight: '48px'
                        }}>
                          {/* Categoria */}
                          <div className="ip_flex" style={{ alignItems: 'center', gap: '0.75rem' }}>
                            {categoria.subcategorias && categoria.subcategorias.length > 0 && (
                              <button
                                onClick={() => toggleColapsarCategoria(categoria.id)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: '#6b7280'
                                }}
                              >
                                {isColapsada ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                            <div style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '6px',
                              backgroundColor: categoria.cor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              color: 'white'
                            }}>
                              {categoria.icone}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                                {categoria.nome}
                              </div>
                              {categoria.classificacao_regra && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {categoria.classificacao_regra === 'necessidades' && '🏠 50%'}
                                  {categoria.classificacao_regra === 'desejos' && '🎯 30%'}
                                  {categoria.classificacao_regra === 'investimentos' && '💰 20%'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Planejado */}
                          <div style={{ textAlign: 'center' }}>
                            {isEditando ? (
                              <div>
                                <div className="ip_flex" style={{ gap: '0.25rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                  <input
                                    type="number"
                                    value={valorTemp}
                                    onChange={(e) => setValorTemp(e.target.value)}
                                    style={{
                                      width: '80px',
                                      padding: '0.25rem 0.5rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      textAlign: 'right'
                                    }}
                                    autoFocus
                                    step="0.01"
                                    min="0"
                                  />
                                  <button 
                                    onClick={confirmarEdicao}
                                    style={{
                                      background: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '0.25rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <CheckCircle size={12} />
                                  </button>
                                  <button 
                                    onClick={cancelarEdicao}
                                    style={{
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '0.25rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                                
                                {/* Botão de Sugestões */}
                                <div className="ip_flex" style={{ gap: '0.25rem', justifyContent: 'center' }}>
                                  <button
                                    onClick={() => toggleSugestoes(categoria.id)}
                                    style={{
                                      background: '#f3f4f6',
                                      color: '#6b7280',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      padding: '0.25rem',
                                      cursor: 'pointer',
                                      fontSize: '0.7rem'
                                    }}
                                    title="Ver sugestões baseadas no histórico"
                                  >
                                    <History size={10} />
                                  </button>
                                </div>
                                
                                {/* Painel de Sugestões */}
                                {mostrandoSugestao && sugestaoHistorica && (
                                  <div style={{
                                    position: 'absolute',
                                    background: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    zIndex: 10,
                                    minWidth: '200px',
                                    fontSize: '0.75rem',
                                    marginTop: '0.5rem'
                                  }}>
                                    <div style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                      Sugestões baseadas no histórico:
                                    </div>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                      <strong>Média:</strong> {formatarMoeda(sugestaoHistorica.media)}
                                      <button
                                        onClick={() => aplicarSugestao(sugestaoHistorica.media)}
                                        style={{
                                          background: '#10b981',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '0.25rem 0.5rem',
                                          marginLeft: '0.5rem',
                                          cursor: 'pointer',
                                          fontSize: '0.7rem'
                                        }}
                                      >
                                        Aplicar
                                      </button>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                      Baseado em {sugestaoHistorica.meses_dados} meses
                                      {sugestaoHistorica.tendencia === 'crescente' && ' 📈'}
                                      {sugestaoHistorica.tendencia === 'decrescente' && ' 📉'}
                                      {sugestaoHistorica.tendencia === 'estavel' && ' ➡️'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div 
                                onClick={() => iniciarEdicao(categoria.id)}
                                style={{ 
                                  cursor: 'pointer',
                                  padding: '0.25rem',
                                  borderRadius: '4px',
                                  border: '1px solid transparent'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                              >
                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                                  {formatarMoeda(planejado)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {formatarHoras(planejado)}
                                </div>
                                {sugestaoHistorica && (
                                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                    Média: {formatarMoeda(sugestaoHistorica.media)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Projetado (com horas para despesas) */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                              {formatarMoeda(projetado)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {formatarHoras(projetado)}
                            </div>
                          </div>

                          {/* Status */}
                          <div style={{ textAlign: 'center' }}>
                            {planejado > 0 ? (
                              <div style={{ 
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                background: status === 'sucesso' ? '#dcfce7' :
                                           status === 'atencao' ? '#fef3c7' : '#fee2e2',
                                color: status === 'sucesso' ? '#166534' :
                                       status === 'atencao' ? '#92400e' : '#991b1b'
                              }}>
                                {((projetado / planejado) * 100).toFixed(0)}%
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>-</span>
                            )}
                          </div>
                        </div>

                        {/* Subcategorias das Despesas */}
                        {categoria.subcategorias && categoria.subcategorias.length > 0 && !isColapsada && (
                          <div style={{ background: '#fafafa' }}>
                            {categoria.subcategorias.map(subcategoria => {
                              const subPlanejado = subcategoria.valor_planejado || 0;
                              const subProjetado = subcategoria.valor_projetado || 0;
                              const subStatus = obterStatusCategoria(subPlanejado, subProjetado);
                              const isSubEditando = editandoItem?.categoriaId === categoria.id && editandoItem?.subcategoriaId === subcategoria.id;
                              const chaveSubSugestao = `${categoria.id}-${subcategoria.id}`;
                              const mostrandoSubSugestao = mostrandoSugestoes[chaveSubSugestao];
                              const sugestaoSubHistorica = obterSugestaoHistorica(categoria.id, subcategoria.id);
                              
                              return (
                                <div key={subcategoria.id} style={{
                                  display: 'grid',
                                  gridTemplateColumns: '2fr 1fr 1fr 80px',
                                  alignItems: 'center',
                                  padding: '0.375rem 1.5rem 0.375rem 3rem',
                                  borderBottom: '1px solid #f3f4f6',
                                  minHeight: '40px'
                                }}>
                                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    └ {subcategoria.nome}
                                  </div>

                                  <div style={{ textAlign: 'center' }}>
                                    {isSubEditando ? (
                                      <div>
                                        <div className="ip_flex" style={{ gap: '0.25rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                          <input
                                            type="number"
                                            value={valorTemp}
                                            onChange={(e) => setValorTemp(e.target.value)}
                                            style={{
                                              width: '70px',
                                              padding: '0.25rem',
                                              border: '1px solid #d1d5db',
                                              borderRadius: '4px',
                                              fontSize: '0.7rem',
                                              textAlign: 'right'
                                            }}
                                            autoFocus
                                            step="0.01"
                                            min="0"
                                          />
                                          <button 
                                            onClick={confirmarEdicao}
                                            style={{
                                              background: '#10b981',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              padding: '0.25rem',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            <CheckCircle size={10} />
                                          </button>
                                          <button 
                                            onClick={cancelarEdicao}
                                            style={{
                                              background: '#ef4444',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              padding: '0.25rem',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            ×
                                          </button>
                                        </div>
                                        
                                        <div className="ip_flex" style={{ gap: '0.25rem', justifyContent: 'center' }}>
                                          <button
                                            onClick={() => toggleSugestoes(categoria.id, subcategoria.id)}
                                            style={{
                                              background: '#f3f4f6',
                                              color: '#6b7280',
                                              border: '1px solid #d1d5db',
                                              borderRadius: '4px',
                                              padding: '0.25rem',
                                              cursor: 'pointer',
                                              fontSize: '0.7rem'
                                            }}
                                          >
                                            <History size={8} />
                                          </button>
                                        </div>
                                        
                                        {mostrandoSubSugestao && sugestaoSubHistorica && (
                                          <div style={{
                                            position: 'absolute',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            padding: '0.75rem',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            zIndex: 10,
                                            minWidth: '180px',
                                            fontSize: '0.7rem',
                                            marginTop: '0.5rem'
                                          }}>
                                            <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                                              Média: {formatarMoeda(sugestaoSubHistorica.media)}
                                              <button
                                                onClick={() => aplicarSugestao(sugestaoSubHistorica.media)}
                                                style={{
                                                  background: '#10b981',
                                                  color: 'white',
                                                  border: 'none',
                                                  borderRadius: '4px',
                                                  padding: '0.25rem 0.5rem',
                                                  marginLeft: '0.5rem',
                                                  cursor: 'pointer',
                                                  fontSize: '0.6rem'
                                                }}
                                              >
                                                Aplicar
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div 
                                        onClick={() => iniciarEdicao(categoria.id, subcategoria.id)}
                                        style={{ 
                                          cursor: 'pointer',
                                          padding: '0.25rem',
                                          borderRadius: '4px'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                      >
                                        <div style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                                          {formatarMoeda(subPlanejado)}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                          {formatarHoras(subPlanejado)}
                                        </div>
                                        {sugestaoSubHistorica && (
                                          <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                            Média: {formatarMoeda(sugestaoSubHistorica.media)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                                      {formatarMoeda(subProjetado)}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                      {formatarHoras(subProjetado)}
                                    </div>
                                  </div>

                                  <div style={{ textAlign: 'center' }}>
                                    {subPlanejado > 0 ? (
                                      <div style={{ 
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: '500',
                                        background: subStatus === 'sucesso' ? '#dcfce7' :
                                                   subStatus === 'atencao' ? '#fef3c7' : '#fee2e2',
                                        color: subStatus === 'sucesso' ? '#166534' :
                                               subStatus === 'atencao' ? '#92400e' : '#991b1b'
                                      }}>
                                        {((subProjetado / subPlanejado) * 100).toFixed(0)}%
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>-</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card de Insights */}
        {estatisticas && estatisticas.economia > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Trophy size={24} color="white" />
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#065f46',
                margin: '0 0 0.5rem 0'
              }}>
                Parabéns! Você está economizando!
              </h3>
              
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                margin: 0,
                lineHeight: 1.5
              }}>
                <strong>{formatarMoeda(estatisticas.economia)}</strong> economizados este mês = 
                <strong> {formatarMoeda(estatisticas.economiaAnual)}</strong> por ano
                ({estatisticas.horasEconomizadas.toFixed(0)} horas de trabalho poupadas!)
              </p>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback.show && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: feedback.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanejamentoPage;