// src/hooks/useRealtimeUpdates.js
import { useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthStore } from '@modules/auth/store/authStore';

/**
 * 🔄 HOOK UNIVERSAL PARA AUTO-REFRESH EM TEMPO REAL
 * ✅ Funciona em qualquer página
 * ✅ Escuta mudanças nas tabelas que você especificar
 * ✅ Chama função de refresh automaticamente
 */
const useRealtimeUpdates = ({ 
  tables = ['transacoes'], // Tabelas para escutar
  onUpdate, // Função para chamar quando houver mudança
  debounceMs = 1500 // Delay para evitar spam
}) => {
  const { user } = useAuthStore();

  const debouncedUpdate = useCallback(() => {
    let timeout;
    return () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (onUpdate) {
          console.log('🔔 Mudança detectada - atualizando página...');
          onUpdate();
        }
      }, debounceMs);
    };
  }, [onUpdate, debounceMs]);

  useEffect(() => {
    if (!user?.id || !onUpdate) return;

    console.log(`📡 Configurando listeners para:`, tables);

    const channels = tables.map(table => {
      return supabase
        .channel(`${table}_updates_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `usuario_id=eq.${user.id}`
          },
          (payload) => {
            console.log(`🔔 ${table} alterada:`, payload.eventType);
            debouncedUpdate()();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Listener ativo para ${table}`);
          }
        });
    });

    // Cleanup
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      console.log('🧹 Listeners removidos');
    };
  }, [user?.id, tables, debouncedUpdate, onUpdate]);
};

export default useRealtimeUpdates;