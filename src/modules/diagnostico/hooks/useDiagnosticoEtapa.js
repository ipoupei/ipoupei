// src/modules/diagnostico/hooks/useDiagnosticoEtapa.js
import { useState, useCallback } from 'react';
import { supabase } from '@lib/supabaseClient';
import useAuth from '@modules/auth/hooks/useAuth';

const useDiagnosticoEtapa = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Função para determinar a coluna correta do usuário
  const getUserColumn = () => {
    // ✅ CORRETO: Para a tabela perfil_usuario, usar 'id'
    return 'id';
  };

  // ✅ Função para atualizar etapa atual no banco
  const atualizarEtapaAtual = useCallback(async (numeroEtapa) => {
    if (!user?.id) {
      console.warn('⚠️ Usuário não autenticado - não é possível salvar etapa');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📝 Atualizando etapa atual do diagnóstico para: ${numeroEtapa}`);

      const userColumn = getUserColumn();
      
      const { data, error: updateError } = await supabase
        .from('perfil_usuario')
        .update({ 
          diagnostico_etapa_atual: numeroEtapa,
          updated_at: new Date().toISOString()
        })
        .eq(userColumn, user.id) // ✅ Usar a coluna correta
        .select('diagnostico_etapa_atual');

      if (updateError) {
        console.error('❌ Erro ao atualizar etapa do diagnóstico:', updateError);
        setError(updateError.message);
        return false;
      }

      console.log('✅ Etapa do diagnóstico atualizada com sucesso:', data);
      return true;

    } catch (err) {
      console.error('❌ Erro inesperado ao atualizar etapa:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ Função para buscar etapa atual do banco
  const buscarEtapaAtual = useCallback(async () => {
    if (!user?.id) {
      console.warn('⚠️ Usuário não autenticado - não é possível buscar etapa');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const userColumn = getUserColumn();

      const { data, error: fetchError } = await supabase
        .from('perfil_usuario')
        .select('diagnostico_etapa_atual')
        .eq(userColumn, user.id) // ✅ Usar a coluna correta
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar etapa atual:', fetchError);
        setError(fetchError.message);
        return null;
      }

      console.log('📋 Etapa atual encontrada:', data?.diagnostico_etapa_atual);
      return data?.diagnostico_etapa_atual || 0;

    } catch (err) {
      console.error('❌ Erro inesperado ao buscar etapa:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ Função para marcar diagnóstico como completo
  const marcarDiagnosticoCompleto = useCallback(async () => {
    if (!user?.id) {
      console.warn('⚠️ Usuário não autenticado - não é possível marcar como completo');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🏁 Marcando diagnóstico como completo');

      const userColumn = getUserColumn();

      const { data, error: updateError } = await supabase
        .from('perfil_usuario')
        .update({ 
          diagnostico_etapa_atual: -1, // -1 indica completo
          diagnostico_completo_em: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq(userColumn, user.id) // ✅ Usar a coluna correta
        .select('diagnostico_etapa_atual, diagnostico_completo_em');

      if (updateError) {
        console.error('❌ Erro ao marcar diagnóstico como completo:', updateError);
        setError(updateError.message);
        return false;
      }

      console.log('✅ Diagnóstico marcado como completo:', data);
      return true;

    } catch (err) {
      console.error('❌ Erro inesperado ao marcar como completo:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    atualizarEtapaAtual,
    buscarEtapaAtual,
    marcarDiagnosticoCompleto,
    loading,
    error
  };
};

export default useDiagnosticoEtapa;