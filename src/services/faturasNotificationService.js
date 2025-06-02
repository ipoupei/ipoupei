// src/services/faturasNotificationService.js - Versão corrigida
import React, { useState, useEffect } from 'react'; // CORRIGIDO: Importação explícita

/**
 * Serviço para gerenciar notificações relacionadas às faturas
 */
class FaturasNotificationService {
  constructor() {
    this.notificationCallbacks = new Set();
  }

  // Registra callback para receber notificações
  subscribe(callback) {
    this.notificationCallbacks.add(callback);
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  // Emite notificação para todos os listeners
  emit(notification) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Erro ao emitir notificação:', error);
      }
    });
  }

  // Verifica faturas e gera notificações quando necessário
  verificarFaturas(faturas) {
    const hoje = new Date();
    const notificacoes = [];

    if (!faturas || faturas.length === 0) {
      return notificacoes;
    }

    faturas.forEach(fatura => {
      const vencimento = new Date(fatura.fatura_vencimento);
      const diasParaVencimento = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

      // Fatura vencida
      if (diasParaVencimento < 0) {
        notificacoes.push({
          id: `vencida-${fatura.cartao_id}-${fatura.fatura_vencimento}`,
          tipo: 'error',
          prioridade: 'alta',
          titulo: 'Fatura Vencida',
          mensagem: `A fatura do cartão ${fatura.cartao_nome} venceu há ${Math.abs(diasParaVencimento)} dia(s)`,
          valor: fatura.valor_total_fatura,
          cartao: fatura.cartao_nome,
          dataVencimento: fatura.fatura_vencimento,
          diasParaVencimento,
          acao: {
            texto: 'Ver Fatura',
            link: `/faturas/cartao`
          },
          timestamp: new Date().toISOString()
        });
      }
      // Vence hoje
      else if (diasParaVencimento === 0) {
        notificacoes.push({
          id: `hoje-${fatura.cartao_id}-${fatura.fatura_vencimento}`,
          tipo: 'warning',
          prioridade: 'alta',
          titulo: 'Fatura Vence Hoje',
          mensagem: `A fatura do cartão ${fatura.cartao_nome} vence hoje`,
          valor: fatura.valor_total_fatura,
          cartao: fatura.cartao_nome,
          dataVencimento: fatura.fatura_vencimento,
          diasParaVencimento,
          acao: {
            texto: 'Ver Fatura',
            link: `/faturas/cartao`
          },
          timestamp: new Date().toISOString()
        });
      }
      // Vence amanhã
      else if (diasParaVencimento === 1) {
        notificacoes.push({
          id: `amanha-${fatura.cartao_id}-${fatura.fatura_vencimento}`,
          tipo: 'warning',
          prioridade: 'media',
          titulo: 'Fatura Vence Amanhã',
          mensagem: `A fatura do cartão ${fatura.cartao_nome} vence amanhã`,
          valor: fatura.valor_total_fatura,
          cartao: fatura.cartao_nome,
          dataVencimento: fatura.fatura_vencimento,
          diasParaVencimento,
          acao: {
            texto: 'Ver Fatura',
            link: `/faturas/cartao`
          },
          timestamp: new Date().toISOString()
        });
      }
      // Vence em 3 dias
      else if (diasParaVencimento <= 3) {
        notificacoes.push({
          id: `3dias-${fatura.cartao_id}-${fatura.fatura_vencimento}`,
          tipo: 'info',
          prioridade: 'media',
          titulo: 'Fatura Vence em Breve',
          mensagem: `A fatura do cartão ${fatura.cartao_nome} vence em ${diasParaVencimento} dia(s)`,
          valor: fatura.valor_total_fatura,
          cartao: fatura.cartao_nome,
          dataVencimento: fatura.fatura_vencimento,
          diasParaVencimento,
          acao: {
            texto: 'Ver Fatura',
            link: `/faturas/cartao`
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    return notificacoes;
  }

  // Gera relatório de status das faturas
  gerarRelatorioStatus(faturas) {
    if (!faturas || faturas.length === 0) {
      return {
        total: 0,
        vencidas: 0,
        vencendoHoje: 0,
        vencendoEm3Dias: 0,
        vencendoEm7Dias: 0,
        emDia: 0,
        valorTotalVencidas: 0,
        valorTotalProximas: 0
      };
    }

    const hoje = new Date();
    const relatorio = {
      total: faturas.length,
      vencidas: 0,
      vencendoHoje: 0,
      vencendoEm3Dias: 0,
      vencendoEm7Dias: 0,
      emDia: 0,
      valorTotalVencidas: 0,
      valorTotalProximas: 0
    };

    faturas.forEach(fatura => {
      const vencimento = new Date(fatura.fatura_vencimento);
      const diasParaVencimento = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

      if (diasParaVencimento < 0) {
        relatorio.vencidas++;
        relatorio.valorTotalVencidas += fatura.valor_total_fatura;
      } else if (diasParaVencimento === 0) {
        relatorio.vencendoHoje++;
        relatorio.valorTotalProximas += fatura.valor_total_fatura;
      } else if (diasParaVencimento <= 3) {
        relatorio.vencendoEm3Dias++;
        relatorio.valorTotalProximas += fatura.valor_total_fatura;
      } else if (diasParaVencimento <= 7) {
        relatorio.vencendoEm7Dias++;
        relatorio.valorTotalProximas += fatura.valor_total_fatura;
      } else {
        relatorio.emDia++;
      }
    });

    return relatorio;
  }

  // Solicita permissão para notificações
  async solicitarPermissaoNotificacoes() {
    if (!('Notification' in window)) {
      return 'not-supported';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }
}

// Instância singleton
export const faturasNotificationService = new FaturasNotificationService();

// Hook React para usar o serviço
export const useFaturasNotifications = () => {
  const [notificacoes, setNotificacoes] = useState([]);

  useEffect(() => {
    const unsubscribe = faturasNotificationService.subscribe((notificacao) => {
      setNotificacoes(prev => [...prev, notificacao]);
    });

    return unsubscribe;
  }, []);

  const limparNotificacao = (id) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  const limparTodas = () => {
    setNotificacoes([]);
  };

  return {
    notificacoes,
    limparNotificacao,
    limparTodas,
    verificarFaturas: faturasNotificationService.verificarFaturas.bind(faturasNotificationService),
    gerarRelatorioStatus: faturasNotificationService.gerarRelatorioStatus.bind(faturasNotificationService),
    solicitarPermissao: faturasNotificationService.solicitarPermissaoNotificacoes.bind(faturasNotificationService)
  };
};

export default faturasNotificationService;