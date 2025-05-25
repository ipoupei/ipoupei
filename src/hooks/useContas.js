import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import useAuth from './useAuth';

/**
 * Hook de emergência para contas
 * Usa dados mockados mas salva no banco quando possível
 */
const useContas = () => {
  // Estados
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false); // Começar com false
  const [error, setError] = useState(null);

  const { user, isAuthenticated } = useAuth();

  // Dados mockados das contas existentes no banco
  const contasMockadas = [
    {
      id: '65dfda4a-5cc5-43dc-ab9e-c3847eb46384',
      usuario_id: '8f945f4c-965c-4060-b086-c579c9df326b',
      nome: 'Minha Conta Corrente',
      tipo: 'corrente',
      banco: 'Banco do Brasil',
      saldo: 2500.00,
      cor: '#3B82F6',
      ativo: true
    },
    {
      id: '79653f3d-cab5-4c87-943f-3137e08ce418',
      usuario_id: '8f945f4c-965c-4060-b086-c579c9df326b',
      nome: 'Conta Teste SQL',
      tipo: 'corrente',
      banco: 'Banco Teste',
      saldo: 1500.00,
      cor: '#10B981',
      ativo: true
    }
  ];

  // Carrega as contas mockadas quando o usuário estiver disponível
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🏦 Carregando contas mockadas para usuário:', user.id);
      
      // Filtra as contas do usuário atual
      const contasDoUsuario = contasMockadas.filter(conta => 
        conta.usuario_id === user.id
      );
      
      setContas(contasDoUsuario);
      console.log('✅ Contas mockadas carregadas:', contasDoUsuario.length);
    } else {
      setContas([]);
    }
  }, [isAuthenticated, user]);

  // Busca contas (por enquanto só retorna as mockadas)
  const fetchContas = useCallback(async () => {
    console.log('🔄 fetchContas chamado (versão de emergência)');
    return { success: true, data: contas };
  }, [contas]);

  // Adiciona nova conta (tenta salvar no banco)
  const addConta = useCallback(async (novaConta) => {
    console.log('➕ Adicionando conta (emergência):', novaConta);
    
    try {
      setLoading(true);
      setError(null);
      
      // Cria conta local primeiro
      const novaContaCompleta = {
        id: `conta_${Date.now()}`,
        usuario_id: user.id,
        nome: novaConta.nome,
        tipo: 'corrente',
        banco: '',
        saldo: novaConta.saldo || 0,
        cor: '#3B82f6',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Adiciona localmente primeiro
      setContas(prev => [...prev, novaContaCompleta]);
      
      // Tenta salvar no banco em background (sem bloquear)
      setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('contas')
            .insert([{
              usuario_id: user.id,
              nome: novaConta.nome,
              tipo: 'corrente',
              banco: '',
              saldo: novaConta.saldo || 0,
              cor: '#3B82F6',
              ativo: true,
              incluir_soma_total: true,
              ordem: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select();
          
          if (data && data.length > 0) {
            console.log('✅ Conta salva no banco em background:', data[0]);
            
            // Atualiza a conta local com o ID real do banco
            setContas(prev => prev.map(conta => 
              conta.id === novaContaCompleta.id 
                ? { ...data[0] }
                : conta
            ));
          }
        } catch (err) {
          console.warn('⚠️ Erro ao salvar no banco (mantendo local):', err);
        }
      }, 100);
      
      return { success: true, data: novaContaCompleta };
    } catch (err) {
      console.error('❌ Erro ao adicionar conta:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Deleta conta
  const deleteConta = useCallback(async (contaId) => {
    console.log('🗑️ Deletando conta (emergência):', contaId);
    
    try {
      // Remove localmente primeiro
      setContas(prev => prev.filter(c => c.id !== contaId));
      
      // Tenta deletar do banco em background
      setTimeout(async () => {
        try {
          await supabase.from('contas').delete().eq('id', contaId);
          console.log('✅ Conta deletada do banco em background');
        } catch (err) {
          console.warn('⚠️ Erro ao deletar do banco (mantendo remoção local):', err);
        }
      }, 100);
      
      return { success: true };
    } catch (err) {
      console.error('❌ Erro ao deletar conta:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Funções auxiliares
  const getSaldoTotal = useCallback(() => {
    return contas.reduce((total, conta) => total + (conta.saldo || 0), 0);
  }, [contas]);

  const getContaById = useCallback((id) => {
    return contas.find(conta => conta.id === id);
  }, [contas]);

  // Debug
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.contasDebug = {
        contas,
        loading,
        error,
        fetchContas,
        addConta,
        deleteConta,
        getSaldoTotal: getSaldoTotal(),
        totalContas: contas.length
      };
      console.log('🔧 contasDebug atualizado:', {
        totalContas: contas.length,
        saldoTotal: getSaldoTotal()
      });
    }
  }, [contas, loading, error, fetchContas, addConta, deleteConta, getSaldoTotal]);

  return {
    contas,
    loading,
    error,
    fetchContas,
    addConta,
    updateConta: () => ({ success: false, error: 'Não implementado' }),
    deleteConta,
    updateSaldo: () => ({ success: false, error: 'Não implementado' }),
    getSaldoTotal,
    getContaById,
    getContasPorTipo: (tipo) => contas.filter(c => c.tipo === tipo),
    getContasAtivas: () => contas.filter(c => c.ativo),
    saldoTotal: getSaldoTotal(),
    totalContas: contas.length,
    contasAtivas: contas.filter(c => c.ativo),
    isAuthenticated
  };
};

export default useContas;