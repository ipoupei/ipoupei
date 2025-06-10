// src/modules/diagnostico/hooks/useDiagnosticoRefinado.js
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { useUIStore } from '@/store/uiStore';

/**
 * Hook refinado para gerenciar o diagnóstico financeiro
 * Segue os padrões já estabelecidos nos modais do sistema
 * Grava dados reais no Supabase em cada etapa
 */
const useDiagnosticoRefinado = () => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [etapaAtual, setEtapaAtual] = useState(0);

  // ✅ ETAPA 1: Salvar percepções financeiras
  const salvarPercepcoes = useCallback(async (dadosPercepcao) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    try {
      // Atualizar ou inserir no perfil do usuário
      const { data, error } = await supabase
        .from('perfil_usuario')
        .upsert({
          id: user.id,
          sentimento_financeiro: dadosPercepcao.sentimento,
          percepcao_controle: dadosPercepcao.percepcaoControle,
          percepcao_gastos: dadosPercepcao.percepcaoGastos,
          disciplina_financeira: dadosPercepcao.disciplina,
          relacao_dinheiro: dadosPercepcao.relacaoDinheiro,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      showNotification('Percepções salvas com sucesso!', 'success');
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao salvar percepções:', err);
      setError(err.message);
      showNotification('Erro ao salvar percepções', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ ETAPA 2: Salvar renda mensal
  const salvarRenda = useCallback(async (dadosRenda) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    try {
      // Atualizar perfil com renda
      const { error: perfilError } = await supabase
        .from('perfil_usuario')
        .upsert({
          id: user.id,
          renda_mensal: dadosRenda.rendaMensal,
          tipo_renda: dadosRenda.tipoRenda,
          updated_at: new Date().toISOString()
        });

      if (perfilError) throw perfilError;

      // Criar transação de receita recorrente se solicitado
      if (dadosRenda.criarReceita && dadosRenda.rendaMensal > 0) {
        const { error: transacaoError } = await supabase
          .from('transacoes')
          .insert({
            usuario_id: user.id,
            tipo: 'receita',
            descricao: 'Renda Mensal - Diagnóstico',
            valor: dadosRenda.rendaMensal,
            data: new Date().toISOString(),
            categoria_id: null, // Será definida posteriormente
            efetivado: false,
            recorrente: true,
            origem_diagnostico: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (transacaoError) throw transacaoError;
      }
      
      showNotification('Renda salva com sucesso!', 'success');
      return { success: true };
    } catch (err) {
      console.error('Erro ao salvar renda:', err);
      setError(err.message);
      showNotification('Erro ao salvar renda', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ ETAPA 3: Salvar contas bancárias
  const salvarContas = useCallback(async (contas) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    if (!contas || contas.length === 0) return { success: true };
    
    setLoading(true);
    try {
      const contasFormatadas = contas.map(conta => ({
        usuario_id: user.id,
        nome: conta.nome,
        tipo: conta.tipo,
        saldo: conta.saldo || 0,
        saldo_inicial: conta.saldo || 0,
        ativo: true,
        incluir_soma_total: true,
        origem_diagnostico: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('contas')
        .insert(contasFormatadas)
        .select();

      if (error) throw error;
      
      showNotification(`${contas.length} conta(s) criada(s) com sucesso!`, 'success');
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao salvar contas:', err);
      setError(err.message);
      showNotification('Erro ao salvar contas', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ ETAPA 4: Salvar cartões de crédito
  const salvarCartoes = useCallback(async (cartoes) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    if (!cartoes || cartoes.length === 0) return { success: true };
    
    setLoading(true);
    try {
      const cartoesFormatados = cartoes.map(cartao => ({
        usuario_id: user.id,
        nome: cartao.nome,
        bandeira: cartao.bandeira || 'visa',
        limite: cartao.limite || 0,
        dia_fechamento: cartao.diaFechamento || 1,
        dia_vencimento: cartao.diaVencimento || 10,
        ativo: true,
        origem_diagnostico: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('cartoes')
        .insert(cartoesFormatados)
        .select();

      if (error) throw error;
      
      showNotification(`${cartoes.length} cartão(ões) criado(s) com sucesso!`, 'success');
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao salvar cartões:', err);
      setError(err.message);
      showNotification('Erro ao salvar cartões', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ ETAPA 5: Salvar dívidas
  const salvarDividas = useCallback(async (dividas) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    if (!dividas || dividas.length === 0) return { success: true };
    
    setLoading(true);
    try {
      const dividasFormatadas = dividas.map(divida => ({
        usuario_id: user.id,
        descricao: divida.descricao,
        instituicao: divida.instituicao,
        valor_total: divida.valorTotal,
        valor_parcela: divida.valorParcela,
        parcelas_restantes: divida.parcelasRestantes,
        parcelas_totais: divida.parcelasTotais,
        situacao: divida.situacao || 'em_dia',
        origem_diagnostico: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('dividas')
        .insert(dividasFormatadas)
        .select();

      if (error) throw error;
      
      showNotification(`${dividas.length} dívida(s) registrada(s) com sucesso!`, 'success');
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao salvar dívidas:', err);
      setError(err.message);
      showNotification('Erro ao salvar dívidas', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ ETAPA 6: Salvar despesas fixas
  const salvarDespesasFixas = useCallback(async (despesasFixas, contaId = null) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    try {
      const transacoes = [];
      
      // Primeiro, buscar ou criar categorias padrão para despesas fixas
      const categoriasPadrao = [
        { nome: 'Moradia', chave: 'moradia', cor: '#8B5CF6' },
        { nome: 'Contas Básicas', chave: 'contas', cor: '#F59E0B' },
        { nome: 'Alimentação', chave: 'alimentacao', cor: '#10B981' },
        { nome: 'Transporte', chave: 'transporte', cor: '#3B82F6' },
        { nome: 'Educação', chave: 'educacao', cor: '#8B5CF6' },
        { nome: 'Saúde', chave: 'saude', cor: '#EF4444' },
        { nome: 'Outras Despesas', chave: 'outros', cor: '#6B7280' }
      ];

      const categoriasMap = {};
      
      for (const cat of categoriasPadrao) {
        const { data: categoriaExistente } = await supabase
          .from('categorias')
          .select('id')
          .eq('usuario_id', user.id)
          .eq('nome', cat.nome)
          .eq('tipo', 'despesa')
          .single();

        if (categoriaExistente) {
          categoriasMap[cat.chave] = categoriaExistente.id;
        } else {
          const { data: novaCategoria, error } = await supabase
            .from('categorias')
            .insert({
              usuario_id: user.id,
              nome: cat.nome,
              tipo: 'despesa',
              cor: cat.cor,
              ativo: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          categoriasMap[cat.chave] = novaCategoria.id;
        }
      }

      // Criar transações para cada despesa fixa > 0
      Object.entries(despesasFixas).forEach(([categoria, valor]) => {
        if (valor > 0 && categoriasMap[categoria]) {
          transacoes.push({
            usuario_id: user.id,
            tipo: 'despesa',
            descricao: `${categoriasPadrao.find(c => c.chave === categoria)?.nome} - Despesa Fixa`,
            valor: valor,
            categoria_id: categoriasMap[categoria],
            conta_id: contaId,
            data: new Date().toISOString(),
            efetivado: false,
            recorrente: true,
            origem_diagnostico: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      if (transacoes.length > 0) {
        const { error } = await supabase
          .from('transacoes')
          .insert(transacoes);

        if (error) throw error;
      }
      
      showNotification(`${transacoes.length} despesa(s) fixa(s) registrada(s)!`, 'success');
      return { success: true };
    } catch (err) {
      console.error('Erro ao salvar despesas fixas:', err);
      setError(err.message);
      showNotification('Erro ao salvar despesas fixas', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ FINALIZAR DIAGNÓSTICO: Marcar como completo
  const finalizarDiagnostico = useCallback(async () => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('perfil_usuario')
        .upsert({
          id: user.id,
          diagnostico_completo: true,
          data_diagnostico: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      showNotification('Diagnóstico finalizado com sucesso! 🎉', 'success');
      return { success: true };
    } catch (err) {
      console.error('Erro ao finalizar diagnóstico:', err);
      setError(err.message);
      showNotification('Erro ao finalizar diagnóstico', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // ✅ Verificar se diagnóstico já foi concluído
  const verificarDiagnostico = useCallback(async () => {
    if (!user?.id) return { concluido: false };
    
    try {
      const { data, error } = await supabase
        .from('perfil_usuario')
        .select('diagnostico_completo, data_diagnostico')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return {
        concluido: data?.diagnostico_completo || false,
        dataUltimo: data?.data_diagnostico
      };
    } catch (err) {
      console.error('Erro ao verificar diagnóstico:', err);
      return { concluido: false };
    }
  }, [user]);

  // ✅ Controle de navegação
  const proximaEtapa = useCallback(() => {
    setEtapaAtual(prev => prev + 1);
  }, []);

  const etapaAnterior = useCallback(() => {
    setEtapaAtual(prev => Math.max(0, prev - 1));
  }, []);

  const irParaEtapa = useCallback((etapa) => {
    setEtapaAtual(etapa);
  }, []);

  // ✅ Limpeza de erros
  const limparErro = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    loading,
    error,
    etapaAtual,
    
    // Ações de salvamento
    salvarPercepcoes,
    salvarRenda,
    salvarContas,
    salvarCartoes,
    salvarDividas,
    salvarDespesasFixas,
    finalizarDiagnostico,
    
    // Verificação
    verificarDiagnostico,
    
    // Navegação
    proximaEtapa,
    etapaAnterior,
    irParaEtapa,
    
    // Utilitários
    limparErro
  };
};

export default useDiagnosticoRefinado;