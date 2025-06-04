import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@modules/auth/pages/Login';
import Dashboard from '@modules/dashboard/pages/Dashboard';
import ResetPassword from '@modules/auth/pages/ResetPassword';
import UserProfile from '@modules/contas/components/UserProfile';
import TransacoesPage from '@modules/transacoes/components/TransacoesPage.jsx';
import RelatoriosHome from '@modules/relatorios/components/RelatoriosHome.jsx';
import RelatorioCategoria from '@modules/relatorios/components/RelatorioCategoria.jsx';
import RelatorioEvolucao from '@modules/relatorios/components/RelatorioEvolucao.jsx';
import RelatorioProjecao from '@modules/relatorios/components/RelatorioProjecao.jsx';
import AuthCallback from '@modules/auth/pages/AuthCallback';
import ProtectedRoute from '@modules/auth/components/ProtectedRoute';
import FaturasRoute from '@routes/FaturasRoute';
import MainLayout from '@shared/components/layouts/MainLayout';



/**
 * Componente para gerenciar as rotas da aplicação
 * ATUALIZADO: Integração com MainLayout para rotas principais
 * Rotas especiais (login, reset, callback) ficam fora do layout
 */
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas - SEM MainLayout */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Rotas principais - COM MainLayout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Transações */}
          <Route path="transacoes" element={<TransacoesPage />} />
          
          {/* Faturas - ADICIONADO */}
          <Route path="faturas/*" element={<FaturasRoute />} />
          
          {/* Relatórios */}
          <Route path="relatorios" element={<RelatoriosHome />} />
          <Route path="relatorios/categorias" element={<RelatorioCategoria />} />
          <Route path="relatorios/evolucao" element={<RelatorioEvolucao />} />
          <Route path="relatorios/projecoes" element={<RelatorioProjecao />} />
          
          {/* Perfil do usuário */}
          <Route path="profile" element={<UserProfile />} />
          
          {/* Aliases para compatibilidade */}
          <Route path="settings" element={<Navigate to="/profile" replace />} />
          <Route path="configuracoes" element={<Navigate to="/profile" replace />} />
          <Route path="perfil" element={<Navigate to="/profile" replace />} />
        </Route>
        
        {/* Rota para páginas não encontradas */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;