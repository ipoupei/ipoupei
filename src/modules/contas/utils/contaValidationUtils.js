// src/modules/contas/utils/contaValidationUtils.js - VERSÃO REFEITA DO ZERO
import { supabase } from '@lib/supabaseClient';

/**
 * Utilitários de validação para operações com contas
 * Versão simplificada e focada nas validações essenciais
 */

/**
 * Verifica se uma conta pode ser excluída
 * @param {string} contaId - ID da conta
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} Resultado da validação
 */
export const validarExclusaoConta = async (contaId, userId) => {
  try {
    const resultado = {
      podeExcluir: false,
      motivo: '',
      detalhes: {},
      sugestoes: []
    };

    // 1. Verificar se existem transações
    const { count: totalTransacoes, error: transacoesError } = await supabase
      .from('transacoes')
      .select('*', { count: 'exact', head: true })
      .or(`conta_id.eq.${contaId},conta_destino_id.eq.${contaId}`)
      .eq('usuario_id', userId);

    if (transacoesError) throw transacoesError;

    if (totalTransacoes > 0) {
      resultado.podeExcluir = false;
      resultado.motivo = 'POSSUI_TRANSACOES';
      resultado.detalhes.quantidadeTransacoes = totalTransacoes;
      resultado.sugestoes.push({
        acao: 'arquivar',
        titulo: 'Arquivar em vez de excluir',
        descricao: 'Mantenha o histórico mas oculte a conta do dashboard'
      });
      return { success: true, data: resultado };
    }

    // 2. Verificar se é a única conta ativa
    const { count: contasAtivas, error: contasError } = await supabase
      .from('contas')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('ativo', true);

    if (contasError) throw contasError;

    if (contasAtivas <= 1) {
      resultado.podeExcluir = true; // Pode excluir, mas com aviso
      resultado.motivo = 'ULTIMA_CONTA';
      resultado.detalhes.ultimaConta = true;
      resultado.sugestoes.push({
        acao: 'criar_nova',
        titulo: 'Criar nova conta',
        descricao: 'Considere criar uma nova conta antes de excluir esta'
      });
    } else {
      resultado.podeExcluir = true;
      resultado.motivo = 'OK';
    }

    return { success: true, data: resultado };

  } catch (error) {
    console.error('Erro ao validar exclusão:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verifica se uma conta pode ser arquivada
 * @param {string} contaId - ID da conta
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} Resultado da validação
 */
export const validarArquivamentoConta = async (contaId, userId) => {
  try {
    const resultado = {
      podeArquivar: true,
      alertas: [],
      detalhes: {}
    };

    // Verificar transações futuras não efetivadas
    const hoje = new Date().toISOString().split('T')[0];
    const { data: transacoesFuturas, error: futurasError } = await supabase
      .from('transacoes')
      .select('id, data, descricao, valor')
      .eq('conta_id', contaId)
      .eq('usuario_id', userId)
      .eq('efetivado', false)
      .gte('data', hoje);

    if (futurasError) throw futurasError;

    if (transacoesFuturas && transacoesFuturas.length > 0) {
      resultado.alertas.push({
        tipo: 'TRANSACOES_FUTURAS',
        titulo: 'Transações futuras pendentes',
        descricao: `Esta conta possui ${transacoesFuturas.length} transação(ões) futura(s) não efetivada(s)`
      });
      resultado.detalhes.transacoesFuturas = transacoesFuturas.length;
    }

    // Verificar saldo atual
    const { data: conta, error: contaError } = await supabase
      .from('contas')
      .select('nome, saldo, tipo')
      .eq('id', contaId)
      .eq('usuario_id', userId)
      .single();

    if (contaError) throw contaError;

    resultado.detalhes.conta = conta;

    if (conta.saldo && Math.abs(conta.saldo) >= 100) {
      resultado.alertas.push({
        tipo: 'SALDO_SIGNIFICATIVO',
        titulo: 'Saldo significativo',
        descricao: `A conta possui saldo de ${formatCurrency(conta.saldo)}`
      });
    }

    return { success: true, data: resultado };

  } catch (error) {
    console.error('Erro ao validar arquivamento:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Gera backup dos dados de uma conta
 * @param {string} contaId - ID da conta
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} Dados de backup
 */
export const gerarBackupConta = async (contaId, userId) => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      conta: null,
      transacoes: [],
      estatisticas: {}
    };

    // Dados da conta
    const { data: conta, error: contaError } = await supabase
      .from('contas')
      .select('*')
      .eq('id', contaId)
      .eq('usuario_id', userId)
      .single();

    if (contaError) throw contaError;
    backup.conta = conta;

    // Transações da conta
    const { data: transacoes, error: transacoesError } = await supabase
      .from('transacoes')
      .select(`
        *,
        categorias(nome),
        subcategorias(nome)
      `)
      .or(`conta_id.eq.${contaId},conta_destino_id.eq.${contaId}`)
      .eq('usuario_id', userId)
      .order('data', { ascending: true });

    if (transacoesError) throw transacoesError;
    backup.transacoes = transacoes || [];

    // Estatísticas
    backup.estatisticas = {
      totalTransacoes: backup.transacoes.length,
      valorTotalMovimentado: backup.transacoes.reduce((sum, t) => sum + Math.abs(t.valor || 0), 0),
      periodoUso: backup.transacoes.length > 0 ? {
        inicio: backup.transacoes[0].data,
        fim: backup.transacoes[backup.transacoes.length - 1].data
      } : null
    };

    return { success: true, data: backup };

  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Exporta dados de backup para diferentes formatos
 * @param {object} backupData - Dados de backup
 * @param {string} formato - 'json', 'csv', 'txt'
 * @returns {string} Dados formatados
 */
export const exportarDadosConta = (backupData, formato = 'json') => {
  try {
    switch (formato.toLowerCase()) {
      case 'json':
        return JSON.stringify(backupData, null, 2);
        
      case 'csv':
        if (!backupData.transacoes || backupData.transacoes.length === 0) {
          return 'Data,Descrição,Tipo,Valor,Categoria,Efetivado\n';
        }
        
        const headers = ['Data', 'Descrição', 'Tipo', 'Valor', 'Categoria', 'Efetivado'];
        const rows = backupData.transacoes.map(t => [
          t.data,
          t.descricao || '',
          t.tipo || '',
          (t.valor || 0).toLocaleString('pt-BR'),
          t.categorias?.nome || '',
          t.efetivado ? 'Sim' : 'Não'
        ]);
        
        return [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
          
      case 'txt':
        return `BACKUP DA CONTA: ${backupData.conta?.nome || 'N/A'}
=====================================

INFORMAÇÕES GERAIS:
- Nome: ${backupData.conta?.nome || 'N/A'}
- Tipo: ${backupData.conta?.tipo || 'N/A'}
- Banco: ${backupData.conta?.banco || 'N/A'}
- Saldo: ${formatCurrency(backupData.conta?.saldo || 0)}
- Data do Backup: ${new Date(backupData.timestamp).toLocaleString('pt-BR')}

ESTATÍSTICAS:
- Total de Transações: ${backupData.estatisticas?.totalTransacoes || 0}
- Valor Total Movimentado: ${formatCurrency(backupData.estatisticas?.valorTotalMovimentado || 0)}
- Período: ${backupData.estatisticas?.periodoUso?.inicio || 'N/A'} até ${backupData.estatisticas?.periodoUso?.fim || 'N/A'}

TRANSAÇÕES:
${backupData.transacoes?.map((t, i) => 
  `${i + 1}. ${t.data} - ${t.descricao} - ${t.tipo} - ${formatCurrency(t.valor || 0)} ${t.efetivado ? '✓' : '⏳'}`
).join('\n') || 'Nenhuma transação'}

=====================================
Backup gerado pelo sistema iPoupei`;

      default:
        throw new Error(`Formato não suportado: ${formato}`);
    }
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return null;
  }
};

/**
 * Baixa arquivo de backup
 * @param {object} backupData - Dados de backup
 * @param {string} formato - Formato do arquivo
 * @param {string} nomeArquivo - Nome personalizado (opcional)
 * @returns {boolean} Sucesso da operação
 */
export const baixarBackup = (backupData, formato = 'json', nomeArquivo = null) => {
  try {
    const dados = exportarDadosConta(backupData, formato);
    if (!dados) return false;

    const nomeConta = backupData.conta?.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'conta';
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeDefault = `backup_${nomeConta}_${dataAtual}.${formato}`;
    
    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      txt: 'text/plain'
    };
    
    const blob = new Blob([dados], { type: mimeTypes[formato] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = nomeArquivo || nomeDefault;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    return false;
  }
};

/**
 * Gera relatório de impacto para operações
 * @param {string} contaId - ID da conta
 * @param {string} userId - ID do usuário
 * @param {string} operacao - 'arquivar' ou 'excluir'
 * @returns {Promise<object>} Relatório de impacto
 */
export const gerarRelatorioImpacto = async (contaId, userId, operacao = 'arquivar') => {
  try {
    const relatorio = {
      operacao,
      impactos: [],
      recomendacoes: []
    };

    // Dados da conta
    const { data: conta, error: contaError } = await supabase
      .from('contas')
      .select('nome, saldo, tipo, incluir_soma_total')
      .eq('id', contaId)
      .eq('usuario_id', userId)
      .single();

    if (contaError) throw contaError;

    // Impacto no saldo total
    if (conta.incluir_soma_total && conta.saldo) {
      relatorio.impactos.push({
        icone: conta.saldo >= 0 ? '📉' : '📈',
        descricao: `Saldo total ${conta.saldo >= 0 ? 'diminuirá' : 'aumentará'} em ${formatCurrency(Math.abs(conta.saldo))}`
      });
    }

    // Verificar transações futuras
    if (operacao === 'arquivar' || operacao === 'excluir') {
      const hoje = new Date().toISOString().split('T')[0];
      const { count: transacoesFuturas, error: futurasError } = await supabase
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .eq('conta_id', contaId)
        .eq('usuario_id', userId)
        .eq('efetivado', false)
        .gte('data', hoje);

      if (!futurasError && transacoesFuturas > 0) {
        relatorio.impactos.push({
          icone: '📅',
          descricao: `${transacoesFuturas} transação(ões) futura(s) não poderão ser efetivadas`
        });

        relatorio.recomendacoes.push({
          titulo: 'Cancelar transações futuras',
          descricao: 'Cancele ou transfira essas transações antes de prosseguir'
        });
      }
    }

    // Impacto histórico (apenas para exclusão)
    if (operacao === 'excluir') {
      const { count: totalTransacoes, error: historicoError } = await supabase
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .or(`conta_id.eq.${contaId},conta_destino_id.eq.${contaId}`)
        .eq('usuario_id', userId);

      if (!historicoError && totalTransacoes > 0) {
        relatorio.impactos.push({
          icone: '🗑️',
          descricao: `Histórico de ${totalTransacoes} transação(ões) será perdido permanentemente`
        });

        relatorio.recomendacoes.push({
          titulo: 'Fazer backup dos dados',
          descricao: 'Exporte o histórico antes de excluir'
        });
      }
    }

    return { success: true, data: relatorio };

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verifica se há contas duplicadas
 * @param {string} nome - Nome da conta
 * @param {string} banco - Banco da conta
 * @param {string} userId - ID do usuário
 * @param {string} contaAtualId - ID da conta atual (para edição)
 * @returns {Promise<object>} Resultado da verificação
 */
export const verificarContasDuplicadas = async (nome, banco, userId, contaAtualId = null) => {
  try {
    let query = supabase
      .from('contas')
      .select('id, nome, banco, ativo')
      .eq('usuario_id', userId);

    if (contaAtualId) {
      query = query.neq('id', contaAtualId);
    }

    const { data: contas, error } = await query;
    if (error) throw error;

    const nomeNormalizado = nome.toLowerCase().trim();
    const bancoNormalizado = banco?.toLowerCase().trim() || '';

    const duplicatas = contas.filter(conta => {
      const contaNome = conta.nome.toLowerCase().trim();
      const contaBanco = conta.banco?.toLowerCase().trim() || '';
      
      return contaNome === nomeNormalizado && contaBanco === bancoNormalizado;
    });

    const similares = contas.filter(conta => {
      const contaNome = conta.nome.toLowerCase().trim();
      
      return contaNome.includes(nomeNormalizado) || nomeNormalizado.includes(contaNome);
    }).filter(conta => !duplicatas.some(d => d.id === conta.id));

    return {
      success: true,
      data: {
        temDuplicatas: duplicatas.length > 0,
        temSimilares: similares.length > 0,
        duplicatas,
        similares,
        podecriar: duplicatas.length === 0
      }
    };

  } catch (error) {
    console.error('Erro ao verificar duplicatas:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Registra log de auditoria para ações críticas
 * @param {string} userId - ID do usuário
 * @param {string} acao - Ação realizada
 * @param {string} contaId - ID da conta
 * @param {object} detalhes - Detalhes adicionais
 */
export const logAuditoria = (userId, acao, contaId, detalhes = {}) => {
  try {
    const logEntry = {
      userId,
      acao,
      contaId,
      detalhes,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // Salvar no localStorage (em produção, usar API de auditoria)
    const chave = `auditoria_contas_${userId}`;
    const historico = JSON.parse(localStorage.getItem(chave) || '[]');
    
    historico.unshift(logEntry);
    
    // Manter apenas os últimos 50 registros
    if (historico.length > 50) {
      historico.splice(50);
    }
    
    localStorage.setItem(chave, JSON.stringify(historico));
    
    console.log('📋 Auditoria registrada:', logEntry);

  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
};

/**
 * Valida rate limiting para ações sensíveis
 * @param {string} userId - ID do usuário
 * @param {string} acao - Tipo de ação
 * @returns {boolean} Se pode realizar a ação
 */
export const validarRateLimit = (userId, acao) => {
  try {
    const limites = {
      excluir: 3,     // max 3 exclusões por hora
      arquivar: 10,   // max 10 arquivamentos por hora
      desarquivar: 10 // max 10 desarquivamentos por hora
    };

    const limite = limites[acao] || 5;
    const chave = `rate_limit_${acao}_${userId}`;
    const agora = Date.now();
    const umaHora = 60 * 60 * 1000;

    const historico = JSON.parse(localStorage.getItem(chave) || '[]');
    const historicoRecente = historico.filter(timestamp => agora - timestamp < umaHora);

    if (historicoRecente.length >= limite) {
      return false;
    }

    // Registrar nova ação
    historicoRecente.push(agora);
    localStorage.setItem(chave, JSON.stringify(historicoRecente));

    return true;

  } catch (error) {
    console.error('Erro ao validar rate limit:', error);
    return true; // Em caso de erro, permitir a ação
  }
};

/**
 * Formata valor monetário
 * @param {number} valor - Valor numérico
 * @returns {string} Valor formatado
 */
const formatCurrency = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

/**
 * Calcula estatísticas de uso de uma conta
 * @param {string} contaId - ID da conta
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} Estatísticas de uso
 */
export const calcularEstatisticasUso = async (contaId, userId) => {
  try {
    const { data: transacoes, error } = await supabase
      .from('transacoes')
      .select('data, tipo, valor, efetivado')
      .or(`conta_id.eq.${contaId},conta_destino_id.eq.${contaId}`)
      .eq('usuario_id', userId)
      .order('data', { ascending: true });

    if (error) throw error;

    if (!transacoes || transacoes.length === 0) {
      return {
        totalTransacoes: 0,
        ultimaMovimentacao: null,
        valorMovimentado: 0,
        contaAtiva: false
      };
    }

    const transacoesEfetivadas = transacoes.filter(t => t.efetivado);
    const ultimaMovimentacao = transacoesEfetivadas.length > 0 
      ? transacoesEfetivadas[transacoesEfetivadas.length - 1].data 
      : null;

    const valorMovimentado = transacoesEfetivadas.reduce(
      (sum, t) => sum + Math.abs(t.valor || 0), 
      0
    );

    // Verificar se teve movimentação nos últimos 90 dias
    const agora = new Date();
    const ultimaData = ultimaMovimentacao ? new Date(ultimaMovimentacao) : new Date(0);
    const diasInativos = Math.ceil((agora - ultimaData) / (1000 * 60 * 60 * 24));

    return {
      totalTransacoes: transacoes.length,
      transacoesEfetivadas: transacoesEfetivadas.length,
      ultimaMovimentacao,
      valorMovimentado,
      diasInativos,
      contaAtiva: diasInativos <= 90
    };

  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return null;
  }
};

// Exportação padrão
export default {
  validarExclusaoConta,
  validarArquivamentoConta,
  gerarBackupConta,
  exportarDadosConta,
  baixarBackup,
  gerarRelatorioImpacto,
  verificarContasDuplicadas,
  logAuditoria,
  validarRateLimit,
  calcularEstatisticasUso
};