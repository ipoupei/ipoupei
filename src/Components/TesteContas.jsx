import React, { useEffect } from 'react';
import useContas from '../hooks/useContas';

const TesteContas = () => {
  const { contas, loading, error, isAuthenticated, fetchContas } = useContas();

  useEffect(() => {
    console.log('🔥 TesteContas');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('loading:', loading);
    console.log('error:', error);
    console.log('contas:', contas);
  }, [contas, loading, error, isAuthenticated]);

  if (loading) return <p>Carregando contas...</p>;
  if (error) return <p>Erro: {error}</p>;

  return (
    <div>
      <h2>Contas</h2>
      {contas.length === 0 ? (
        <p>🙁 Nenhuma conta encontrada</p>
      ) : (
        <ul>
          {contas.map((conta) => (
            <li key={conta.id}>{conta.nome}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TesteContas;
