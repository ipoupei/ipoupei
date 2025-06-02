// src/routes/FaturasRoute.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CreditCard } from 'lucide-react';

// Importação lazy para otimização
const FaturasCartaoPage = React.lazy(() => import('../pages/FaturasCartaoPage'));

// Componente de rota principal para faturas
const FaturasRoute = () => {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando faturas...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route index element={<FaturasCartaoPage />} />
        <Route path="cartao" element={<FaturasCartaoPage />} />
        <Route path="cartao/:cartaoId" element={<FaturasCartaoPage />} />
        <Route path="cartao/:cartaoId/:anoMes" element={<FaturasCartaoPage />} />
      </Routes>
    </React.Suspense>
  );
};

// Configuração para o menu/navegação
export const faturasMenuConfig = {
  path: '/faturas',
  name: 'Faturas',
  icon: CreditCard,
  description: 'Gerencie suas faturas de cartão de crédito',
  color: 'blue',
  badge: null, // Pode ser usado para mostrar faturas vencendo
  children: [
    {
      path: '/faturas/cartao',
      name: 'Faturas de Cartão',
      description: 'Visualize e gerencie faturas detalhadas'
    }
  ]
};

// Hook para obter dados do menu (exemplo para integração)
export const useFaturasMenuData = () => {
  // Aqui você poderia buscar dados como:
  // - Número de faturas vencendo
  // - Valor total das próximas faturas
  // - Alertas importantes
  
  return {
    badge: null, // Exemplo: "3" para 3 faturas vencendo
    notification: false, // true se houver alertas
    quickActions: [
      {
        name: 'Ver Fatura Atual',
        path: '/faturas/cartao',
        icon: CreditCard
      }
    ]
  };
};

export default FaturasRoute;