// src/modules/core/hooks/useRefreshAllData.js - VERSÃO FINAL CORRIGIDA
import { useRef } from 'react';
import { useTransactionsStore } from '@/modules/transacoes/store/transactionsStore';
import useContas from '@/modules/contas/hooks/useContas';
import { useDashboardData } from '@modules/dashboard/store/dashboardStore';
import { useAuthStore } from '@/modules/auth/store/authStore';

/**
 * Hook central para refresh global de dados - VERSÃO FINAL CORRIGIDA
 * ✅ Usa forceRefreshContas para garantir saldos atualizados após transferências
 * ✅ Sequência otimizada: Contas → Transações → Dashboard
 * ✅ Previne execuções simultâneas
 * ✅ Tratamento robusto de erros
 * ✅ Debug detalhado para troubleshooting
 */
export const useRefreshAllData = () => {
  const fetchTransacoes = useTransactionsStore(state => state.fetchTransacoes);
  const { forceRefreshContas } = useContas();
  const { refreshData } = useDashboardData();
  const { user } = useAuthStore();
  
  // Prevenir execuções simultâneas
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);
  const refreshCount = useRef(0);

  const refreshAll = async () => {
    // ✅ Evitar execução simultânea
    if (isRefreshing.current) {
      console.log('⏳ Refresh já em andamento, aguardando...');
      return;
    }

    if (!user?.id) {
      console.warn('👤 Usuário não autenticado, pulando refresh');
      return;
    }

    const now = Date.now();
    refreshCount.current++;

    try {
      isRefreshing.current = true;
      
      console.log(`🔄 === REFRESH GLOBAL #${refreshCount.current} INICIADO ===`);
      console.log(`👤 Usuário: ${user.email}`);
      console.log(`⏰ Último refresh: ${Math.round((now - lastRefreshTime.current) / 1000)}s atrás`);

      const startTime = Date.now();

      // ✅ ETAPA 1: PRIORIDADE MÁXIMA - Forçar refresh das contas
      console.log(`🏦 [${refreshCount.current}] ETAPA 1/3 - Forçando refresh das contas...`);
      
      if (forceRefreshContas) {
        try {
          const contasStartTime = Date.now();
          await forceRefreshContas(true); // Incluir arquivadas
          const contasTime = Date.now() - contasStartTime;
          console.log(`✅ [${refreshCount.current}] Contas atualizadas em ${contasTime}ms`);
        } catch (contasError) {
          console.error(`❌ [${refreshCount.current}] Erro no refresh das contas:`, contasError);
          // Não falhar o processo todo por conta disso
        }
      } else {
        console.warn(`⚠️ [${refreshCount.current}] forceRefreshContas não disponível`);
      }

      // ✅ ETAPA 2: Atualizar transações
      console.log(`💰 [${refreshCount.current}] ETAPA 2/3 - Atualizando transações...`);
      
      if (fetchTransacoes) {
        try {
          const transacoesStartTime = Date.now();
          await fetchTransacoes();
          const transacoesTime = Date.now() - transacoesStartTime;
          console.log(`✅ [${refreshCount.current}] Transações atualizadas em ${transacoesTime}ms`);
        } catch (transacoesError) {
          console.error(`❌ [${refreshCount.current}] Erro no refresh das transações:`, transacoesError);
          // Não bloquear por causa disso
        }
      } else {
        console.warn(`⚠️ [${refreshCount.current}] fetchTransacoes não disponível`);
      }

      // ✅ ETAPA 3: Refresh do dashboard
      console.log(`📊 [${refreshCount.current}] ETAPA 3/3 - Atualizando dashboard...`);
      
      if (refreshData) {
        try {
          const dashboardStartTime = Date.now();
          await refreshData();
          const dashboardTime = Date.now() - dashboardStartTime;
          console.log(`✅ [${refreshCount.current}] Dashboard atualizado em ${dashboardTime}ms`);
        } catch (dashboardError) {
          console.error(`❌ [${refreshCount.current}] Erro no refresh do dashboard:`, dashboardError);
          // Não bloquear
        }
      } else {
        console.warn(`⚠️ [${refreshCount.current}] refreshData não disponível`);
      }

      // ✅ ETAPA 4: Processamento final
      console.log(`⏳ [${refreshCount.current}] Aguardando processamento final...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      lastRefreshTime.current = now;
      const totalTime = Date.now() - startTime;
      
      console.log(`✅ === REFRESH GLOBAL #${refreshCount.current} CONCLUÍDO ===`);
      console.log(`📊 Tempo total: ${totalTime}ms`);
      console.log(`🎯 Próximo refresh permitido em: ${new Date(now + 2000).toLocaleTimeString()}`);

    } catch (error) {
      console.error(`❌ === ERRO CRÍTICO NO REFRESH GLOBAL #${refreshCount.current} ===`);
      console.error(error);
      
      // ✅ Fallback: tentar refresh básico individual
      console.warn(`⚠️ [${refreshCount.current}] Tentando refresh básico como fallback...`);
      
      const fallbackPromises = [];
      
      if (forceRefreshContas) {
        fallbackPromises.push(
          forceRefreshContas().catch(e => {
            console.warn('Fallback contas falhou:', e.message);
            return null;
          })
        );
      }
      
      if (fetchTransacoes) {
        fallbackPromises.push(
          fetchTransacoes().catch(e => {
            console.warn('Fallback transações falhou:', e.message);
            return null;
          })
        );
      }
      
      if (refreshData) {
        fallbackPromises.push(
          refreshData().catch(e => {
            console.warn('Fallback dashboard falhou:', e.message);
            return null;
          })
        );
      }

      try {
        await Promise.allSettled(fallbackPromises);
        console.log(`✅ [${refreshCount.current}] Refresh fallback concluído`);
      } catch (fallbackError) {
        console.error(`❌ [${refreshCount.current}] Falha total no refresh:`, fallbackError);
        throw fallbackError;
      }
    } finally {
      isRefreshing.current = false;
    }
  };

  // ✅ Função de debug para verificar estado
  const debugRefreshState = () => {
    const now = Date.now();
    const timeSinceLastRefresh = lastRefreshTime.current > 0 ? now - lastRefreshTime.current : 0;
    
    console.log('🔍 === DEBUG REFRESH STATE ===');
    console.log('📊 Estado atual:', {
      isRefreshing: isRefreshing.current,
      refreshCount: refreshCount.current,
      lastRefreshTime: lastRefreshTime.current > 0 ? 
        new Date(lastRefreshTime.current).toLocaleTimeString() : 'Nunca',
      timeSinceLastRefresh: timeSinceLastRefresh > 0 ? 
        `${Math.round(timeSinceLastRefresh / 1000)}s` : 'N/A',
      user: user?.email || 'Não autenticado'
    });
    console.log('🔧 Funções disponíveis:', {
      forceRefreshContas: !!forceRefreshContas,
      fetchTransacoes: !!fetchTransacoes,
      refreshData: !!refreshData
    });
    console.log('===========================');
  };

  // ✅ Função para aguardar refresh completo
  const waitForRefresh = async (maxWaitTime = 15000) => {
    const startTime = Date.now();
    
    console.log(`⏳ Aguardando refresh completar (timeout: ${maxWaitTime}ms)...`);
    
    while (isRefreshing.current && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const waitTime = Date.now() - startTime;
    
    if (isRefreshing.current) {
      console.warn(`⚠️ Timeout aguardando refresh após ${waitTime}ms - continuando...`);
    } else {
      console.log(`✅ Refresh completado em ${waitTime}ms`);
    }
    
    return !isRefreshing.current;
  };

  // ✅ Função para forçar refresh com aguardo
  const forceRefreshAndWait = async (maxWaitTime = 15000) => {
    console.log('🚀 Forçando refresh e aguardando conclusão...');
    
    // Iniciar refresh
    const refreshPromise = refreshAll();
    
    // Aguardar conclusão
    const success = await waitForRefresh(maxWaitTime);
    
    // Garantir que o promise termine
    try {
      await refreshPromise;
    } catch (error) {
      console.warn('Erro no refresh promise:', error.message);
    }
    
    return success;
  };

  return { 
    refreshAll,
    debugRefreshState,
    waitForRefresh,
    forceRefreshAndWait,
    
    // Estado
    isRefreshing: () => isRefreshing.current,
    getLastRefreshTime: () => lastRefreshTime.current,
    getRefreshCount: () => refreshCount.current,
    
    // Utilitários
    getTimeSinceLastRefresh: () => {
      return lastRefreshTime.current > 0 ? 
        Date.now() - lastRefreshTime.current : 0;
    },
    canRefresh: () => {
      const timeSince = lastRefreshTime.current > 0 ? 
        Date.now() - lastRefreshTime.current : Infinity;
      return !isRefreshing.current && timeSince >= 2000; // 2s mínimo
    }
  };
};

export default useRefreshAllData;