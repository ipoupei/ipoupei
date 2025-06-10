import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Home, BarChart3 } from 'lucide-react';

const BotaoContas = () => {
  const navigate = useNavigate();

  const testRoutes = [
    { name: 'Dashboard', route: '/dashboard', icon: Home },
    { name: 'Diagnóstico', route: '/diagnostico', icon: BarChart3 },
    { name: 'Contas Etapa', route: '/contas-etapa', icon: Wallet },
    { name: 'Root', route: '/', icon: Home }
  ];

  const handleClick = (route, name) => {
    console.log(`🚀 Testando rota: ${route} (${name})`);
    
    // Força a navegação de forma mais agressiva
    if (route === '/diagnostico') {
      console.log('🔥 FORÇANDO navegação para diagnóstico...');
      window.location.href = '/diagnostico';
      return;
    }
    
    navigate(route);
  };

  // Teste direto via URL
  const handleDirectTest = () => {
    console.log('🔥 TESTE DIRETO: Alterando URL do navegador...');
    window.history.pushState({}, '', '/diagnostico');
    window.location.reload();
  };

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem'
    }}>
      <h2 style={{ marginBottom: '2rem', color: '#374151' }}>
        🧪 Teste de Rotas
      </h2>
      
      {testRoutes.map(({ name, route, icon: Icon }) => (
        <button
          key={route}
          onClick={() => handleClick(route, name)}
          style={{
            background: route === '/diagnostico' 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: '200px',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
        >
          <Icon size={16} />
          {name} ({route})
        </button>
      ))}
      
      {/* BOTÃO DE TESTE EXTREMO */}
      <button
        onClick={handleDirectTest}
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          color: 'white',
          border: 'none',
          padding: '1rem 2rem',
          borderRadius: '12px',
          fontSize: '1.125rem',
          fontWeight: '700',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        🔥 TESTE EXTREMO: Forçar /diagnostico
      </button>
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f3f4f6', 
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        💡 O botão vermelho tenta uma navegação forçada<br/>
        O botão roxo altera a URL diretamente
      </div>
      
      {/* INFO ÚTIL */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        background: '#fef3c7', 
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#92400e',
        maxWidth: '400px'
      }}>
        <strong>🔍 Se nada funcionar:</strong><br/>
        1. Pare o servidor (Ctrl+C)<br/>
        2. Execute: <code>npm start</code> ou <code>yarn start</code><br/>
        3. Limpe o cache: Ctrl+F5
      </div>
    </div>
  );
};

export default BotaoContas;