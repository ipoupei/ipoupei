import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { addMonths, format, parseISO } from 'date-fns';
import useAuth from "@modules/auth/hooks/useAuth";


/**
 * 📋 HOOK: Dados de Transações Programadas
 * ✅ Busca transações futuras já programadas no banco
 * ✅ Inclui: recorrências, parcelas de cartão, agendamentos
 * ✅ Agrupa por mês para facilitar projeção
 * ✅ Considera datas de vencimento de fatura para cartão
 */
const useDadosRecorrentes = (mesesFuturos = 12) => {
  const { user } = useAuth();
  const [dados, setDados] = useState({
    transacoesFuturas: [],
    resumoPorMes: [],
    loading: true,
    error: null,
    totalEncontrado: 0
  });

  const buscarTransacoesProgramadas = async () => {
    if (!user?.id) return;

    try {
      setDados(prev => ({ ...prev, loading: true, error: null }));

      // 📅 Definir período de busca
      const dataInicio = new Date();
      const dataFim = addMonths(dataInicio, mesesFuturos);

      console.log('📋 Buscando transações programadas:', {
        usuario: user.id,
        periodo: `${format(dataInicio, 'MM/yyyy')} até ${format(dataFim, 'MM/yyyy')}`,
        mesesFuturos
      });

      // 🔄 1. RECORRÊNCIAS FUTURAS
      const { data: recorrencias, error: errorRecorrencias } = await supabase
        .from('transacoes')
        .select(`
          id,
          data,
          descricao,
          valor,
          tipo,
          categoria_id,
          conta_id,
          cartao_id,
          eh_recorrente,
          numero_recorrencia,
          total_recorrencias,
          data_proxima_recorrencia,
          grupo_recorrencia,
          categorias!inner(nome, cor)
        `)
        .eq('usuario_id', user.id)
        .eq('eh_recorrente', true)
        .gte('data_proxima_recorrencia', dataInicio.toISOString())
        .lte('data_proxima_recorrencia', dataFim.toISOString())
        .order('data_proxima_recorrencia');

      if (errorRecorrencias) {
        console.error('❌ Erro ao buscar recorrências:', errorRecorrencias);
      }

      // 💳 2. PARCELAS DE CARTÃO FUTURAS
      const { data: parcelas, error: errorParcelas } = await supabase
        .from('transacoes')
        .select(`
          id,
          data,
          descricao,
          valor,
          valor_parcela,
          tipo,
          categoria_id,
          conta_id,
          cartao_id,
          parcela_atual,
          numero_parcelas,
          fatura_vencimento,
          grupo_parcelamento,
          categorias!inner(nome, cor),
          cartoes!inner(nome, dia_vencimento)
        `)
        .eq('usuario_id', user.id)
        .not('cartao_id', 'is', null)
        .not('grupo_parcelamento', 'is', null)
        .gte('fatura_vencimento', dataInicio.toISOString().split('T')[0])
        .lte('fatura_vencimento', dataFim.toISOString().split('T')[0])
        .order('fatura_vencimento');

      if (errorParcelas) {
        console.error('❌ Erro ao buscar parcelas:', errorParcelas);
      }

      // 📅 3. TRANSAÇÕES AGENDADAS (não efetivadas)
      const { data: agendadas, error: errorAgendadas } = await supabase
        .from('transacoes')
        .select(`
          id,
          data,
          descricao,
          valor,
          tipo,
          categoria_id,
          conta_id,
          cartao_id,
          efetivado,
          categorias!inner(nome, cor)
        `)
        .eq('usuario_id', user.id)
        .eq('efetivado', false)
        .gte('data', dataInicio.toISOString())
        .lte('data', dataFim.toISOString())
        .is('eh_recorrente', null) // Não incluir recorrências aqui
        .is('grupo_parcelamento', null) // Não incluir parcelas aqui
        .order('data');

      if (errorAgendadas) {
        console.error('❌ Erro ao buscar agendadas:', errorAgendadas);
      }

      // ✅ CONSOLIDAR DADOS
      const todasTransacoes = [
        ...(recorrencias || []).map(t => ({
          ...t,
          dataReferencia: parseISO(t.data_proxima_recorrencia),
          origem: 'recorrencia',
          descricaoCompleta: `${t.descricao} (Recorrente ${t.numero_recorrencia}/${t.total_recorrencias})`
        })),
        ...(parcelas || []).map(t => ({
          ...t,
          dataReferencia: parseISO(t.fatura_vencimento),
          origem: 'parcela_cartao',
          valor: t.valor_parcela || t.valor,
          descricaoCompleta: `${t.descricao} (${t.parcela_atual}/${t.numero_parcelas} - ${t.cartoes.nome})`
        })),
        ...(agendadas || []).map(t => ({
          ...t,
          dataReferencia: parseISO(t.data),
          origem: 'agendada',
          descricaoCompleta: `${t.descricao} (Agendada)`
        }))
      ];

      // 📊 AGRUPAR POR MÊS
      const resumoPorMes = {};
      
      todasTransacoes.forEach(transacao => {
        const mesAno = format(transacao.dataReferencia, 'yyyy-MM');
        
        if (!resumoPorMes[mesAno]) {
          resumoPorMes[mesAno] = {
            mes: mesAno,
            mesFormatado: format(transacao.dataReferencia, 'MMM/yy'),
            data: transacao.dataReferencia,
            receitas: 0,
            despesas: 0,
            saldo: 0,
            totalTransacoes: 0,
            transacoes: []
          };
        }

        const valor = parseFloat(transacao.valor) || 0;
        resumoPorMes[mesAno].totalTransacoes++;
        resumoPorMes[mesAno].transacoes.push({
          id: transacao.id,
          descricao: transacao.descricaoCompleta,
          valor,
          tipo: transacao.tipo,
          categoria: transacao.categorias?.nome || 'Sem categoria',
          cor: transacao.categorias?.cor || '#6B7280',
          origem: transacao.origem,
          data: transacao.dataReferencia
        });

        if (transacao.tipo === 'receita') {
          resumoPorMes[mesAno].receitas += valor;
        } else if (transacao.tipo === 'despesa') {
          resumoPorMes[mesAno].despesas += valor;
        }

        resumoPorMes[mesAno].saldo = resumoPorMes[mesAno].receitas - resumoPorMes[mesAno].despesas;
      });

      // 🔄 CONVERTER PARA ARRAY E ORDENAR
      const resumoArray = Object.values(resumoPorMes)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

      console.log('✅ Transações programadas encontradas:', {
        recorrencias: recorrencias?.length || 0,
        parcelas: parcelas?.length || 0,
        agendadas: agendadas?.length || 0,
        total: todasTransacoes.length,
        mesesComDados: resumoArray.length
      });

      setDados({
        transacoesFuturas: todasTransacoes,
        resumoPorMes: resumoArray,
        loading: false,
        error: null,
        totalEncontrado: todasTransacoes.length
      });

    } catch (error) {
      console.error('❌ Erro ao buscar dados recorrentes:', error);
      setDados(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar transações programadas'
      }));
    }
  };

  // 🔄 Buscar dados quando hook for montado ou usuário mudar
  useEffect(() => {
    if (user?.id) {
      buscarTransacoesProgramadas();
    }
  }, [user?.id, mesesFuturos]);

  // 📊 FUNÇÕES AUXILIARES
  const obterSaldoAcumulado = () => {
    let saldoAcumulado = 0;
    return dados.resumoPorMes.map(mes => {
      saldoAcumulado += mes.saldo;
      return {
        ...mes,
        saldoAcumulado
      };
    });
  };

  const obterResumoTotal = () => {
    const totalReceitas = dados.resumoPorMes.reduce((acc, mes) => acc + mes.receitas, 0);
    const totalDespesas = dados.resumoPorMes.reduce((acc, mes) => acc + mes.despesas, 0);
    
    return {
      totalReceitas,
      totalDespesas,
      saldoTotal: totalReceitas - totalDespesas,
      mesesComDados: dados.resumoPorMes.length,
      mediaReceitas: dados.resumoPorMes.length > 0 ? totalReceitas / dados.resumoPorMes.length : 0,
      mediaDespesas: dados.resumoPorMes.length > 0 ? totalDespesas / dados.resumoPorMes.length : 0
    };
  };

  const temDadosSuficientes = () => {
    return dados.totalEncontrado > 0 && dados.resumoPorMes.length > 0;
  };

  return {
    // 📊 Dados principais
    ...dados,
    
    // 📈 Dados processados
    resumoComAcumulado: obterSaldoAcumulado(),
    resumoTotal: obterResumoTotal(),
    
    // 🔄 Funções de controle
    refetch: buscarTransacoesProgramadas,
    temDadosSuficientes: temDadosSuficientes(),
    
    // 📋 Metadados úteis
    metadados: {
      mesesConfigurados: mesesFuturos,
      proximaAtualizacao: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      fonteDados: 'transacoes_programadas'
    }
  };
};

export default useDadosRecorrentes;