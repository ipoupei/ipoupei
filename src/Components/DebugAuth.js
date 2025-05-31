// src/components/DebugAuth.js
import React, { useState, useEffect } from 'react';
import { supabase, listarUsuarios, testarCriacaoUsuario, verificarAutenticacao } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Componente de debug para autenticação
 * Apenas para desenvolvimento - remover em produção
 */
const DebugAuth = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState('');
  const { user, isAuthenticated, signIn, signUp } = useAuth();

  // Carrega usuários ao montar o componente
  useEffect(() => {
    if (import.meta.env.DEV) {
      carregarUsuarios();
    }
  }, []);

  const carregarUsuarios = async () => {
    const users = await listarUsuarios();
    setUsuarios(users || []);
  };

  const testarConexao = async () => {
    setLoading(true);
    try {
      const result = await verificarAutenticacao();
      setResultado(`Conexão: ${result.success ? 'OK' : 'ERRO'} - Autenticado: ${result.isAuthenticated}`);
    } catch (err) {
      setResultado(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const criarUsuarioTeste = async () => {
    setLoading(true);
    try {
      const result = await signUp({
        email: `teste${Date.now()}@exemplo.com`,
        password: 'senha123',
        nome: 'Usuário Teste'
      });
      
      setResultado(`Criação: ${result.success ? 'SUCESSO' : 'ERRO - ' + result.error}`);
      await carregarUsuarios();
    } catch (err) {
      setResultado(`Erro na criação: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fazerLoginTeste = async () => {
    if (usuarios.length === 0) {
      setResultado('Nenhum usuário encontrado para teste');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn({
        email: usuarios[0].email,
        password: 'senha123'
      });
      
      setResultado(`Login: ${result.success ? 'SUCESSO' : 'ERRO - ' + result.error}`);
    } catch (err) {
      setResultado(`Erro no login: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const verificarTabelas = async () => {
    setLoading(true);
    try {
      // Testa cada tabela principal
      const tabelas = ['perfil_usuario', 'contas', 'categorias', 'cartoes'];
      const resultados = [];

      for (const tabela of tabelas) {
        try {
          const { data, error } = await supabase
            .from(tabela)
            .select('*')
            .limit(1);
          
          resultados.push(`${tabela}: ${error ? 'ERRO' : 'OK'}`);
        } catch (err) {
          resultados.push(`${tabela}: ERRO - ${err.message}`);
        }
      }

      setResultado(`Tabelas: ${resultados.join(', ')}`);
    } catch (err) {
      setResultado(`Erro ao verificar tabelas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Não renderiza em produção
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '16px',
      width: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1000,
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#3b82f6' }}>🛠️ Debug Auth</h3>
      
      {/* Status atual */}
      <div style={{ marginBottom: '12px', padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
        <strong>Status:</strong><br/>
        Autenticado: {isAuthenticated ? '✅' : '❌'}<br/>
        Usuário: {user?.email || 'N/A'}<br/>
        Total usuários: {usuarios.length}
      </div>

      {/* Botões de teste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={testarConexao}
          disabled={loading}
          style={{ 
            padding: '6px 12px', 
            background: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Testar Conexão
        </button>

        <button
          onClick={verificarTabelas}
          disabled={loading}
          style={{ 
            padding: '6px 12px', 
            background: '#8b5cf6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Verificar Tabelas
        </button>

        <button
          onClick={criarUsuarioTeste}
          disabled={loading}
          style={{ 
            padding: '6px 12px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Criar Usuário Teste
        </button>

        {usuarios.length > 0 && (
          <button
            onClick={fazerLoginTeste}
            disabled={loading}
            style={{ 
              padding: '6px 12px', 
              background: '#f59e0b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Login com 1º Usuário
          </button>
        )}

        <button
          onClick={carregarUsuarios}
          disabled={loading}
          style={{ 
            padding: '6px 12px', 
            background: '#6b7280', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Recarregar Lista
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: '#fef3c7', 
          borderRadius: '4px',
          fontSize: '10px',
          wordBreak: 'break-word'
        }}>
          <strong>Resultado:</strong><br/>
          {resultado}
        </div>
      )}

      {/* Lista de usuários */}
      {usuarios.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <strong>Usuários:</strong>
          <div style={{ maxHeight: '100px', overflow: 'auto', fontSize: '10px' }}>
            {usuarios.map((user, index) => (
              <div key={user.id} style={{ padding: '2px 0' }}>
                {index + 1}. {user.email} ({user.nome})
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(255,255,255,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '8px'
        }}>
          ⏳ Carregando...
        </div>
      )}
    </div>
  );
};

export default DebugAuth;