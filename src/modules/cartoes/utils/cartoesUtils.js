// src/modules/cartoes/utils/cartoesUtils.js

/**
 * Formata o mês em português
 */
export const formatarMesPortugues = (dataVencimento) => {
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

/**
 * Calcula dias até o vencimento
 */
export const calcularDiasVencimento = (dataVencimento) => {
  if (!dataVencimento) return 0;
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  return Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
};

/**
 * Obtém status de utilização baseado no percentual
 */
export const obterStatusUtilizacao = (percentual) => {
  if (percentual <= 30) return 'status-verde';
  if (percentual <= 60) return 'status-amarelo';
  return 'status-vermelho';
};

/**
 * Obtém status de vencimento baseado nos dias
 */
export const obterStatusVencimento = (dias) => {
  if (dias > 7) return { classe: 'status-verde', texto: 'No Prazo' };
  if (dias > 3) return { classe: 'status-amarelo', texto: 'Atenção' };
  return { classe: 'status-vermelho', texto: 'Urgente' };
};

/**
 * Gera opções de meses para seletor
 */
export const gerarOpcoesMeses = (quantidade = 12) => {
  const opcoes = [];
  const hoje = new Date();
  
  for (let i = 0; i < quantidade; i++) {
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