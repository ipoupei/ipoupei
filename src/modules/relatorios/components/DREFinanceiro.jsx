import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  PieChart, 
  RefreshCw, 
  AlertTriangle,
  BarChart3,
  Filter,
  Eye,
  EyeOff,
  Settings,
  Clock,
  Briefcase,
  Info
} from 'lucide-react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';
import Button from '@shared/components/ui/Button';
import Card from '@shared/components/ui/Card';
import { formatCurrency } from '@shared/utils/formatCurrency';
import '@modules/relatorios/styles/DREFinanceiro.css';

const formatCurrencyDRE = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(value));
};

const formatCurrencyDREComplete = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função para formatar horas trabalhadas
const formatHorasTrabalho = (valor, valorHora) => {
  if (!valorHora || valorHora <= 0 || !valor || valor <= 0) return '0h';
  
  const horas = Math.round(valor / valorHora);
  return `${horas}h`;
};

// Função para gerar mensagem motivacional
const gerarMensagemMotivacional = (horas) => {
  if (horas < 1) return "⚡ Menos de 1 hora de trabalho";
  if (horas < 4) return "☕ Algumas horas de trabalho";
  if (horas < 8) return "🕐 Meio dia de trabalho";
  if (horas < 16) return "📅 1-2 dias de trabalho";
  if (horas < 40) return "📆 Menos de 1 semana";
  if (horas < 80) return "🗓️ 1-2 semanas de trabalho";
  if (horas < 160) return "📊 Quase 1 mês de trabalho";
  if (horas < 320) return "⏰ 1-2 meses de trabalho";
  return "🚨 Mais de 2 meses de trabalho!";
};

const DREFinanceiro = () => {
const { user } = useAuth();
  
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [categoriaExpandida, setCategoriaExpandida] = useState({});
  const [dadosDRE, setDadosDRE] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [modoHoras, setModoHoras] = useState(false);
  const [valorHoraTrabalhada, setValorHoraTrabalhada] = useState(null);
  const [loadingValorHora, setLoadingValorHora] = useState(false);
  const [dadosHora, setDadosHora] = useState(null);
  
  const [incluirNaoEfetivadas, setIncluirNaoEfetivadas] = useState(false);
  const [receitasExpandidas, setReceitasExpandidas] = useState(true);
  const [despesasExpandidas, setDespesasExpandidas] = useState(true);

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const anosDisponiveis = [2023, 2024, 2025, 2026];

  // Buscar dados do DRE com parâmetro de não efetivadas
  const buscarDadosDRE = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Buscando DRE para usuário:', user.id, 'ano:', anoSelecionado, 'incluir não efetivadas:', incluirNaoEfetivadas);
      
      const { data, error: rpcError } = await supabase.rpc('ip_prod_dre_financeiro', {
        p_usuario_id: user.id,
        p_ano: anoSelecionado,
        p_incluir_nao_efetivadas: incluirNaoEfetivadas
      });

      if (rpcError) {
        console.error('Erro RPC:', rpcError);
        setError(`Erro ao carregar dados: ${rpcError.message}`);
        return;
      }

      console.log('Dados recebidos:', data);

      if (data && data.erro) {
        setError(`Erro na função: ${data.mensagem}`);
        return;
      }

      if (!data || !data.receitas || !data.despesas) {
        console.warn('Estrutura de dados inválida:', data);
        setError('Estrutura de dados inválida recebida do servidor');
        return;
      }

      setDadosDRE(data);
      console.log('DRE carregado com sucesso:', data);
    } catch (err) {
      console.error('Erro na busca:', err);
      setError(`Erro inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

const buscarValorHoraTrabalhada = async () => {
  if (!user?.id) return;

  setLoadingValorHora(true);
  try {
    console.log('🔍 Buscando valor da hora para usuário:', user.id);
    
    const { data, error } = await supabase.rpc('ip_prod_buscar_valor_hora_trabalhada', {
      p_usuario_id: user.id
    });

    if (error) {
      console.error('❌ Erro RPC ao buscar valor da hora:', error);
      return await buscarValorHoraFallback();
    }

    if (data && data.length > 0) {
      const dadosHora = data[0];
      console.log('✅ Dados da hora encontrados via RPC:', dadosHora);
      setDadosHora(dadosHora);
      setValorHoraTrabalhada(dadosHora.valor_hora_trabalhada);
      return;
    }

    // Se não retornou dados via RPC, usar fallback
    await buscarValorHoraFallback();

  } catch (err) {
    console.error('❌ Erro inesperado ao buscar valor da hora:', err);
    await buscarValorHoraFallback();
  } finally {
    setLoadingValorHora(false);
  }
};

const buscarValorHoraFallback = async () => {
  try {
    console.log('🔄 Usando fallback para buscar dados do usuário...');
    
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('renda_mensal, media_horas_trabalhadas_mes')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Perfil não encontrado');
    }

    console.log('✅ Dados do perfil encontrados:', data);

    const temDadosCompletos = data.renda_mensal && data.media_horas_trabalhadas_mes && data.media_horas_trabalhadas_mes > 0;
    
    let valorHoraCalculado = null;
    if (temDadosCompletos) {
      valorHoraCalculado = data.renda_mensal / data.media_horas_trabalhadas_mes;
    }

    const dadosCompletos = {
      valor_hora_trabalhada: valorHoraCalculado,
      renda_mensal: data.renda_mensal,
      horas_mes: data.media_horas_trabalhadas_mes,
      tem_dados_completos: temDadosCompletos,
      calculado_automaticamente: true
    };

    setDadosHora(dadosCompletos);
    setValorHoraTrabalhada(valorHoraCalculado);

  } catch (err) {
    console.error('❌ Erro no fallback:', err);
    setDadosHora(null);
    setValorHoraTrabalhada(null);
  }
};

useEffect(() => {
  if (user?.id) {
    buscarDadosDRE();
    if (!dadosHora) {
      buscarValorHoraTrabalhada();
    }
  }
}, [user?.id, anoSelecionado, incluirNaoEfetivadas]);

  // Handler para mudança de ano
  const handleAnoChange = (novoAno) => {
    setAnoSelecionado(novoAno);
  };

const toggleModoHoras = async () => {
  if (!modoHoras && !valorHoraTrabalhada) {
    setLoadingValorHora(true);
    
    try {
      const { data, error } = await supabase
        .from('perfil_usuario')
        .select('renda_mensal, media_horas_trabalhadas_mes')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        alert('Erro ao buscar dados do perfil. Tente novamente.');
        return;
      }

      console.log('Dados do perfil:', data);

      if (!data) {
        alert('Perfil não encontrado. Complete seu diagnóstico financeiro.');
        return;
      }

      const temRendaEHoras = data.renda_mensal && data.media_horas_trabalhadas_mes && data.media_horas_trabalhadas_mes > 0;
      
      if (!temRendaEHoras) {
        alert('Para usar a conversão em horas, complete seu diagnóstico financeiro com dados de renda e horas trabalhadas.');
        return;
      }

      let valorHora = data.valor_hora_trabalhada;
      if (!valorHora) {
        valorHora = data.renda_mensal / data.media_horas_trabalhadas_mes;
        
        await supabase
          .from('perfil_usuario')
          .update({ valor_hora_trabalhada: valorHora })
          .eq('id', user.id);
      }

      console.log('Valor da hora:', valorHora);

      setDadosHora({
        valor_hora_trabalhada: valorHora,
        renda_mensal: data.renda_mensal,
        horas_mes: data.media_horas_trabalhadas_mes,
        tem_dados_completos: true,
        calculado_automaticamente: !data.valor_hora_trabalhada
      });
      setValorHoraTrabalhada(valorHora);
      setModoHoras(true);

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      alert('Erro inesperado. Tente novamente.');
    } finally {
      setLoadingValorHora(false);
    }
  } else {
    setModoHoras(!modoHoras);
  }
};

  // Toggle para incluir não efetivadas
  const toggleIncluirNaoEfetivadas = () => {
    setIncluirNaoEfetivadas(!incluirNaoEfetivadas);
  };

  // Toggle seção receitas
  const toggleReceitas = () => {
    setReceitasExpandidas(!receitasExpandidas);
    if (receitasExpandidas) {
      const novasCategorias = { ...categoriaExpandida };
      Object.keys(novasCategorias).forEach(key => {
        if (key.startsWith('receitas-')) {
          delete novasCategorias[key];
        }
      });
      setCategoriaExpandida(novasCategorias);
    }
  };

  // Toggle seção despesas
  const toggleDespesas = () => {
    setDespesasExpandidas(!despesasExpandidas);
    if (despesasExpandidas) {
      const novasCategorias = { ...categoriaExpandida };
      Object.keys(novasCategorias).forEach(key => {
        if (key.startsWith('despesas-')) {
          delete novasCategorias[key];
        }
      });
      setCategoriaExpandida(novasCategorias);
    }
  };

const formatarValor = (valor, ehDespesa = false) => {
  if (modoHoras && valorHoraTrabalhada && ehDespesa) {
    return formatHorasTrabalho(valor, valorHoraTrabalhada);
  }
  return formatCurrencyDRE(valor);
};

const gerarTooltip = (valor, ehDespesa = false) => {
  if (!modoHoras || !valorHoraTrabalhada || !ehDespesa) {
    return formatCurrencyDREComplete(valor || 0);
  }
  
  const horas = valor / valorHoraTrabalhada;
  const mensagem = gerarMensagemMotivacional(horas);
  return `${formatCurrencyDREComplete(valor || 0)} = ${formatHorasTrabalho(valor, valorHoraTrabalhada)}\n${mensagem}`;
};

  // Função para calcular intensidade do mapa de calor
  const calcularIntensidadeCalor = (valor, valores, tipo) => {
    if (!valores || valores.length === 0) return 0;
    
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    const range = max - min;
    
    if (range === 0) return 0;
    
    return (valor - min) / range;
  };

  // Função para obter cor do mapa de calor
  const obterCorCalor = (intensidade, tipo) => {
    if (tipo === 'receitas') {
      if (intensidade >= 0.8) return 'heatmap-green-high';
      if (intensidade >= 0.6) return 'heatmap-green-medium';
      if (intensidade >= 0.4) return 'heatmap-green-low';
      return 'heatmap-neutral';
    } else {
      if (intensidade >= 0.8) return 'heatmap-red-high';
      if (intensidade >= 0.6) return 'heatmap-red-medium';
      if (intensidade >= 0.4) return 'heatmap-red-low';
      return 'heatmap-neutral';
    }
  };

  // Função para detectar anomalias
  const detectarAnomalia = (valores) => {
    if (!valores || valores.length === 0) return [];
    
    const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
    const desvio = Math.sqrt(valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length);
    
    return valores.map(valor => {
      if (desvio === 0) return false;
      const zscore = Math.abs(valor - media) / desvio;
      return zscore > 1.5;
    });
  };

  // Toggle categoria expandida
  const toggleCategoria = (categoria) => {
    setCategoriaExpandida(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  // Calcular totais e indicadores
  const indicadores = useMemo(() => {
    if (!dadosDRE || !dadosDRE.receitas || !dadosDRE.despesas) return null;

    const totalReceitas = dadosDRE.receitas.reduce((sum, cat) => sum + (cat.total_anual || 0), 0);
    const totalDespesas = dadosDRE.despesas.reduce((sum, cat) => sum + (cat.total_anual || 0), 0);
    const saldoLiquido = totalReceitas - totalDespesas;
    
    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
      taxaPoupanca: totalReceitas > 0 ? (saldoLiquido / totalReceitas * 100) : 0,
      maiorDespesa: dadosDRE.despesas.reduce((max, cat) => 
        (cat.total_anual || 0) > (max?.total_anual || 0) ? cat : max, null
      )
    };
  }, [dadosDRE]);

  // Função para calcular totais mensais por tipo
  const calcularTotalMensal = (dados, mesIndex) => {
    if (!dados || !Array.isArray(dados)) return 0;
    
    return dados.reduce((sum, cat) => {
      let valoresMensais = [];
      if (cat.valores_mensais) {
        if (Array.isArray(cat.valores_mensais)) {
          valoresMensais = cat.valores_mensais;
        } else {
          try {
            valoresMensais = JSON.parse(cat.valores_mensais);
          } catch (e) {
            valoresMensais = [];
          }
        }
      }
      const valorMes = valoresMensais[mesIndex] || 0;
      return sum + valorMes;
    }, 0);
  };

  // Renderizar linha de categoria
  const renderLinhaCategoria = (tipo, categoria) => {
    const chaveExpansao = `${tipo}-${categoria.categoria_id}`;
    const isExpanded = categoriaExpandida[chaveExpansao];
    const corTexto = tipo === 'receitas' ? 'text-success' : 'text-danger';
    const corFundo = tipo === 'receitas' ? 'categoria-receita' : 'categoria-despesa';
    const ehDespesa = tipo === 'despesas';

    let valoresMensais = [];
    if (categoria.valores_mensais) {
      if (Array.isArray(categoria.valores_mensais)) {
        valoresMensais = categoria.valores_mensais;
      } else {
        try {
          valoresMensais = JSON.parse(categoria.valores_mensais);
        } catch (e) {
          console.warn('Erro ao fazer parse dos valores mensais:', e);
          valoresMensais = [];
        }
      }
    }
    
    while (valoresMensais.length < 12) {
      valoresMensais.push(0);
    }

    const anomalias = detectarAnomalia(valoresMensais);
    const temAnomalias = anomalias.filter(Boolean).length >= 3;

    return (
      <React.Fragment key={chaveExpansao}>
        <tr className={`${corFundo} categoria-row`} onClick={() => toggleCategoria(chaveExpansao)}>
          <td className="categoria-nome">
            <div className="categoria-header">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <div className="categoria-info">
                <span className={`categoria-titulo ${corTexto}`}>
                  {categoria.categoria_nome}
                </span>
                {temAnomalias && (
                  <span className="badge-variacao">
                    <AlertTriangle size={12} />
                    Alta Variação
                    {modoHoras && ehDespesa && valorHoraTrabalhada && (
                      <span className="badge-horas">
                        <Clock size={12} />
                        {formatHorasTrabalho(categoria.total_anual || 0, valorHoraTrabalhada)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </td>
          {valoresMensais.map((valor, mesIndex) => {
            const intensidade = calcularIntensidadeCalor(valor, valoresMensais, tipo);
            const corCalor = obterCorCalor(intensidade, tipo);
            const isAnomalia = anomalias[mesIndex];
            
            return (
              <td key={mesIndex} className={`valor-cell ${corTexto} ${corCalor}`}>
                <div className="valor-container">
                  <span 
                    className="valor-texto" 
                    title={gerarTooltip(valor, ehDespesa)}
                  >
                    {formatarValor(valor || 0, ehDespesa)}
                  </span>
                  {isAnomalia && (
                    <div className="anomalia-indicator" title="Variação significativa">
                      <AlertTriangle size={8} />
                    </div>
                  )}
                </div>
              </td>
            );
          })}
          <td className={`total-cell ${corTexto}`}>
            <span 
              className="total-valor"
              title={gerarTooltip(categoria.total_anual || 0, ehDespesa)}
            >
              {formatarValor(categoria.total_anual || 0, ehDespesa)}
            </span>
          </td>
        </tr>
        
        {/* Subcategorias */}
        {isExpanded && categoria.subcategorias && categoria.subcategorias.map((subcat, index) => {
          let valoresSubMensais = [];
          if (subcat.valores_mensais) {
            if (Array.isArray(subcat.valores_mensais)) {
              valoresSubMensais = subcat.valores_mensais;
            } else {
              try {
                valoresSubMensais = JSON.parse(subcat.valores_mensais);
              } catch (e) {
                console.warn('Erro ao fazer parse dos valores mensais da subcategoria:', e);
                valoresSubMensais = [];
              }
            }
          }
          
          while (valoresSubMensais.length < 12) {
            valoresSubMensais.push(0);
          }
          
          return (
            <tr key={`${chaveExpansao}-sub-${index}`} className="subcategoria-row">
              <td className="subcategoria-nome">
                <div className="subcategoria-header">
                  <span className="subcategoria-bullet">•</span>
                  <span className="subcategoria-texto">
                    {subcat.subcategoria_nome || 'Sem subcategoria'}
                  </span>
                </div>
              </td>
              {valoresSubMensais.map((valor, mesIndex) => {
                const intensidade = calcularIntensidadeCalor(valor, valoresSubMensais, tipo);
                const corCalor = obterCorCalor(intensidade * 0.7, tipo);
                
                return (
                  <td key={mesIndex} className={`subcategoria-valor ${corCalor}`}>
                    <span 
                      className="subcategoria-valor-texto"
                      title={modoHoras && valorHoraTrabalhada && ehDespesa ? 
                        `R$ ${formatCurrencyDREComplete(valor || 0)} = ${formatHorasTrabalho(valor || 0, valorHoraTrabalhada)}` : 
                        `R$ ${formatCurrencyDREComplete(valor || 0)}`
                      }
                    >
                      {modoHoras && valorHoraTrabalhada && ehDespesa ? 
                        formatHorasTrabalho(valor || 0, valorHoraTrabalhada) : 
                        formatCurrencyDRE(valor || 0)
                      }
                    </span>
                  </td>
                );
              })}
                <td className="subcategoria-total">
                  <span className="subcategoria-total-texto">
                    {modoHoras && valorHoraTrabalhada && ehDespesa ? 
                      formatHorasTrabalho(subcat.total_anual || 0, valorHoraTrabalhada) : 
                      formatCurrencyDRE(subcat.total_anual || 0)
                    }
                  </span>
                </td>
            </tr>
          );
        })}
      </React.Fragment>
    );
  };

  // Renderizar saldo líquido
  const renderSaldoLiquido = () => {
    if (!dadosDRE || !dadosDRE.receitas || !dadosDRE.despesas || !indicadores) return null;

    const saldosMensais = meses.map((_, index) => {
      const receitaMes = calcularTotalMensal(dadosDRE.receitas, index);
      const despesaMes = calcularTotalMensal(dadosDRE.despesas, index);
      return receitaMes - despesaMes;
    });

    return (
      <tr className="saldo-liquido-row">
        <td className="saldo-titulo">
          <div className="saldo-header">
            <DollarSign size={16} />
            <span>SALDO LÍQUIDO</span>
          </div>
        </td>
        {saldosMensais.map((saldo, index) => {
          let corSaldo = 'saldo-neutral';
          let emoji = '';
          
          if (saldo > 0) {
            const intensidade = Math.min(Math.abs(saldo) / 5000, 1);
            if (intensidade >= 0.8) {
              corSaldo = 'saldo-excelente';
              emoji = '🎉';
            } else if (intensidade >= 0.6) {
              corSaldo = 'saldo-bom';
            } else if (intensidade >= 0.3) {
              corSaldo = 'saldo-ok';
            }
          } else {
            const intensidade = Math.min(Math.abs(saldo) / 2000, 1);
            if (intensidade >= 0.8) {
              corSaldo = 'saldo-critico';
              emoji = '🚨';
            } else if (intensidade >= 0.6) {
              corSaldo = 'saldo-atencao';
              emoji = '⚠️';
            } else if (intensidade >= 0.3) {
              corSaldo = 'saldo-negativo';
            }
          }
          
          return (
            <td key={index} className={`saldo-cell ${corSaldo}`}>
              <div className="saldo-container">
                <span className="saldo-valor-texto">{formatCurrencyDRE(saldo)}</span>
                {emoji && <span className="saldo-emoji">{emoji}</span>}
              </div>
            </td>
          );
        })}
        <td className={`saldo-total ${indicadores.saldoLiquido >= 0 ? 'positivo' : 'negativo'}`}>
          <span className="saldo-total-valor">{formatCurrencyDRE(indicadores.saldoLiquido)}</span>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="dre-loading">
        <RefreshCw className="animate-spin" size={32} />
        <p>Carregando dados do DRE para {anoSelecionado}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dre-error">
        <AlertTriangle size={48} className="text-danger" />
        <h3>Erro ao carregar DRE</h3>
        <p>{error}</p>
        <div className="mt-4 space-x-2">
          <Button onClick={buscarDadosDRE}>
            <RefreshCw size={16} />
            Tentar Novamente
          </Button>
          <Button onClick={() => setError(null)} variant="outline">
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  if (!dadosDRE || !indicadores) {
    return (
      <div className="dre-empty">
        <PieChart size={48} className="text-muted" />
        <h3>Sem dados para exibir</h3>
        <p>Não foram encontradas transações para o ano {anoSelecionado}.</p>
        <div className="mt-4">
          <Button onClick={buscarDadosDRE}>
            <RefreshCw size={16} />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dre-financeiro">
      {/* Header Moderno */}
      <div className="dre-header">
        <div className="dre-title">
          <div className="title-icon">
            <BarChart3 className="text-primary" size={28} />
          </div>
          <div className="title-content">
            <h1>DRE Financeiro Pessoal</h1>
            <p className="title-subtitle">
              Demonstrativo de Resultado do Exercício - {anoSelecionado}
              {incluirNaoEfetivadas && <span className="badge-nao-efetivadas">Incluindo Não Efetivadas</span>}
            </p>
          </div>
        </div>
        
        <div className="dre-controls">
          <div className="control-group">
            <Calendar size={16} />
            <select
              value={anoSelecionado}
              onChange={(e) => handleAnoChange(Number(e.target.value))}
              className="modern-select"
            >
              {anosDisponiveis.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <button
              onClick={toggleIncluirNaoEfetivadas}
              className={`toggle-button ${incluirNaoEfetivadas ? 'active' : ''}`}
              title="Incluir transações não efetivadas"
            >
              {incluirNaoEfetivadas ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>Não Efetivadas</span>
            </button>
          </div>

          <div className="control-group">
            <button
              onClick={toggleModoHoras}
              className={`toggle-button ${modoHoras ? 'active' : ''}`}
              title="Converter despesas para horas de trabalho"
              disabled={loadingValorHora}
            >
              {loadingValorHora ? <RefreshCw size={16} className="animate-spin" /> : modoHoras ? <Clock size={16} /> : <Briefcase size={16} />}
              <span>{loadingValorHora ? 'Carregando...' : 'Ver em Horas'}</span>
            </button>
          </div>
          
          <Button onClick={buscarDadosDRE} variant="outline" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Cards de Resumo Modernos */}
      <div className="dre-resumo">
        <Card className="resumo-card resumo-receitas">
          <div className="resumo-content">
            <div className="resumo-icon">
              <TrendingUp size={24} />
            </div>
            <div className="resumo-info">
              <p className="resumo-label">Total Receitas</p>
              <p className="resumo-valor">{formatCurrencyDRE(indicadores.totalReceitas)}</p>
              <p className="resumo-meta">
                Meta: {formatCurrencyDRE(indicadores.totalReceitas * 1.1)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="resumo-card resumo-despesas">
          <div className="resumo-content">
            <div className="resumo-icon">
              <TrendingDown size={24} />
            </div>
            <div className="resumo-info">
              <p className="resumo-label">Total Despesas</p>
              <p className="resumo-valor">{formatCurrencyDRE(indicadores.totalDespesas)}</p>
              <p className="resumo-meta">
                {((indicadores.totalDespesas / indicadores.totalReceitas) * 100).toFixed(1)}% das receitas
              </p>
            </div>
          </div>
        </Card>
        
        <Card className={`resumo-card resumo-saldo ${indicadores.saldoLiquido >= 0 ? 'positivo' : 'negativo'}`}>
          <div className="resumo-content">
            <div className="resumo-icon">
              <DollarSign size={24} />
            </div>
            <div className="resumo-info">
              <p className="resumo-label">Saldo Líquido</p>
              <p className="resumo-valor">{formatCurrencyDRE(indicadores.saldoLiquido)}</p>
              <p className="resumo-meta">
                Taxa de poupança: {indicadores.taxaPoupanca.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Legenda Modernizada */}
      <Card className="dre-legenda">
        <div className="legenda-header">
          <div className="legenda-title">
            <Info size={18} />
            <h3>Guia de Interpretação dos Mapas de Calor</h3>
          </div>
        </div>
        <div className="legenda-content">
          <div className="legenda-secao">
            <h4>🟢 RECEITAS - Verde Indica Melhor Performance</h4>
            <div className="legenda-items">
              <div className="legenda-item">
                <div className="cor-exemplo heatmap-green-high"></div>
                <span>Meses de alta receita (top 20%)</span>
              </div>
              <div className="legenda-item">
                <div className="cor-exemplo heatmap-green-medium"></div>
                <span>Boa receita (60-80%)</span>
              </div>
              <div className="legenda-item">
                <div className="cor-exemplo heatmap-green-low"></div>
                <span>Receita moderada (40-60%)</span>
              </div>
            </div>
          </div>
          
          <div className="legenda-secao">
            <h4>🔴 DESPESAS - Vermelho Indica Necessidade de Atenção</h4>
            <div className="legenda-items">
              <div className="legenda-item">
                <div className="cor-exemplo heatmap-red-high"></div>
                <span>Gastos altos - Revisar orçamento</span>
              </div>
              <div className="legenda-item">
                <div className="cor-exemplo heatmap-red-medium"></div>
                <span>Gastos moderados</span>
              </div>
              <div className="legenda-item">
                <div className="cor-exemplo heatmap-red-low"></div>
                <span>Gastos controlados</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="legenda-indicadores">
          <div className="indicador-item">
            <div className="anomalia-indicator">
              <AlertTriangle size={8} />
            </div>
            <span>Variação significativa detectada</span>
          </div>
          <div className="indicador-item">
            <span className="badge-variacao">
              <AlertTriangle size={12} />
              Alta Variação
            </span>
            <span>Categoria com padrão irregular</span>
          </div>
        </div>
      </Card>

      {/* Tabela Principal Modernizada */}
      <Card className="dre-tabela-card">
        <div className="dre-tabela-container">
          <table className="dre-tabela">
            <thead>
              <tr className="tabela-header">
                <th className="coluna-categoria">Categoria</th>
                {meses.map((mes, index) => (
                  <th key={index} className="coluna-mes">{mes}</th>
                ))}
                <th className="coluna-total">Total Anual</th>
              </tr>
            </thead>
            
            <tbody>
              {/* RECEITAS COM AGRUPADOR */}
              <tr className="secao-header receitas-header" onClick={toggleReceitas}>
                <td className="secao-titulo">
                  <div className="secao-header-content">
                    {receitasExpandidas ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <TrendingUp size={18} />
                    <span>RECEITAS</span>
                    <span className="categoria-count">
                      ({dadosDRE.receitas?.length || 0} categorias)
                    </span>
                  </div>
                </td>
                {meses.map((_, index) => {
                  const totalMes = calcularTotalMensal(dadosDRE.receitas, index);
                  return (
                    <td key={index} className="secao-total text-success">
                      <span className="secao-valor">{formatCurrencyDRE(totalMes)}</span>
                    </td>
                  );
                })}
                <td className="secao-total-anual text-success">
                  <span className="secao-total-valor">{formatCurrencyDRE(indicadores.totalReceitas)}</span>
                </td>
              </tr>
              
              {/* Categorias de Receitas - só exibe se expandido */}
              {receitasExpandidas && dadosDRE.receitas?.map((categoria) =>
                renderLinhaCategoria('receitas', categoria)
              )}

              {/* DESPESAS COM AGRUPADOR */}
              <tr className="secao-header despesas-header" onClick={toggleDespesas}>
                <td className="secao-titulo">
                  <div className="secao-header-content">
                    {despesasExpandidas ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <TrendingDown size={18} />
                    <span>DESPESAS</span>
                    <span className="categoria-count">
                      ({dadosDRE.despesas?.length || 0} categorias)
                    </span>
                  </div>
                </td>
                {meses.map((_, index) => {
                  const totalMes = calcularTotalMensal(dadosDRE.despesas, index);
                  return (
                    <td key={index} className="secao-total text-danger">
                      <span className="secao-valor">
                        {modoHoras && valorHoraTrabalhada ? 
                          formatHorasTrabalho(totalMes, valorHoraTrabalhada) : 
                          formatCurrencyDRE(totalMes)
                        }
                      </span>
                    </td>
                  );
                })}

                <td className="secao-total-anual text-danger">
                  <span className="secao-total-valor">
                    {modoHoras && valorHoraTrabalhada ? 
                      formatHorasTrabalho(indicadores.totalDespesas, valorHoraTrabalhada) : 
                      formatCurrencyDRE(indicadores.totalDespesas)
                    }
                  </span>
                </td>
              </tr>
              
              {/* Categorias de Despesas - só exibe se expandido */}
              {despesasExpandidas && dadosDRE.despesas?.map((categoria) =>
                renderLinhaCategoria('despesas', categoria)
              )}

              {/* SALDO LÍQUIDO */}
              {renderSaldoLiquido()}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Indicadores de Performance Modernizados */}
      <div className="dre-indicadores">
        <Card className="indicador-card">
          <div className="indicador-header">
            <PieChart size={20} />
            <h3>Taxa de Poupança</h3>
          </div>
          <div className="indicador-content">
            <p className="indicador-valor">{indicadores.taxaPoupanca.toFixed(1)}%</p>
            <div className="indicador-barra">
              <div 
                className="indicador-progresso" 
                style={{ width: `${Math.min(Math.abs(indicadores.taxaPoupanca), 100)}%` }}
              ></div>
            </div>
            <p className="indicador-meta">Meta: 20%</p>
          </div>
        </Card>
        
        <Card className="indicador-card">
          <div className="indicador-header">
            <TrendingDown size={20} />
            <h3>Maior Despesa</h3>
          </div>
          <div className="indicador-content">
            <p className="indicador-titulo">{indicadores.maiorDespesa?.categoria_nome || 'N/A'}</p>
            <p className="indicador-valor">
              {indicadores.maiorDespesa ? formatCurrencyDRE(indicadores.maiorDespesa.total_anual) : 'R$ 0,00'}
            </p>
            <p className="indicador-meta">
              {indicadores.maiorDespesa && indicadores.totalDespesas > 0 
                ? `${((indicadores.maiorDespesa.total_anual / indicadores.totalDespesas) * 100).toFixed(1)}% do total`
                : 'N/A'
              }
            </p>
          </div>
        </Card>
        
        <Card className="indicador-card">
          <div className="indicador-header">
            <DollarSign size={20} />
            <h3>Resultado do Ano</h3>
          </div>
          <div className="indicador-content">
            <p className={`indicador-valor ${indicadores.saldoLiquido >= 0 ? 'positivo' : 'negativo'}`}>
              {indicadores.saldoLiquido >= 0 ? 'Positivo' : 'Negativo'}
            </p>
            <p className="indicador-subtitulo">
              {formatCurrencyDRE(indicadores.saldoLiquido)}
            </p>
            <p className="indicador-meta">
              {indicadores.saldoLiquido >= 0 ? '✅ Superávit' : '⚠️ Déficit'}
            </p>
          </div>
        </Card>
        
        <Card className="indicador-card">
          <div className="indicador-header">
            <Calendar size={20} />
            <h3>Média Mensal</h3>
          </div>
          <div className="indicador-content">
            <p className="indicador-valor">
              {formatCurrencyDRE(indicadores.saldoLiquido / 12)}
            </p>
            <p className="indicador-subtitulo">Saldo líquido</p>
            <p className="indicador-meta">
              Receita: {formatCurrencyDRE(indicadores.totalReceitas / 12)}
            </p>
          </div>
        </Card>
      </div>

      {/* Insights e Recomendações */}
      <Card className="dre-insights">
        <div className="insights-header">
          <div className="insights-title">
            <AlertTriangle size={20} />
            <h3>Insights e Recomendações</h3>
          </div>
        </div>
        <div className="insights-content">
          <div className="insight-item">
            <div className="insight-icon success">
              <TrendingUp size={16} />
            </div>
            <div className="insight-text">
              <p className="insight-titulo">
                Taxa de poupança: {indicadores.taxaPoupanca.toFixed(1)}%
              </p>
              <p className="insight-descricao">
                {indicadores.taxaPoupanca >= 20 
                  ? "Excelente! Você está poupando uma boa quantidade."
                  : indicadores.taxaPoupanca >= 10
                  ? "Bom progresso. Tente aumentar para 20%."
                  : "Considere reduzir gastos ou aumentar receitas."
                }
              </p>
            </div>
          </div>

          {indicadores.maiorDespesa && (
            <div className="insight-item">
              <div className="insight-icon warning">
                <AlertTriangle size={16} />
              </div>
              <div className="insight-text">
                <p className="insight-titulo">
                  Maior categoria de gasto: {indicadores.maiorDespesa.categoria_nome}
                </p>
                <p className="insight-descricao">
                  Representa {((indicadores.maiorDespesa.total_anual / indicadores.totalDespesas) * 100).toFixed(1)}% 
                  dos seus gastos totais. Considere analisar se há oportunidades de economia.
                </p>
              </div>
            </div>
          )}

          <div className="insight-item">
            <div className="insight-icon info">
              <Info size={16} />
            </div>
            <div className="insight-text">
              <p className="insight-titulo">
                Projeção para próximo ano
              </p>
              <p className="insight-descricao">
                Com base no padrão atual, sua projeção de saldo para {anoSelecionado + 1} é de{' '}
                {formatCurrencyDRE(indicadores.saldoLiquido)}.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DREFinanceiro;