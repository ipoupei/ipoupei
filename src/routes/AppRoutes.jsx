import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ResetPassword from '../pages/ResetPassword';
import UserProfile from '../pages/UserProfile';
import TransacoesPage from '../pages/TransacoesPage';
import RelatoriosHome from '../pages/RelatoriosHome';
import RelatorioCategoria from '../pages/RelatorioCategoria';
import RelatorioEvolucao from '../pages/RelatorioEvolucao';
import RelatorioProjecao from '../pages/RelatorioProjecao';
import AuthCallback from '../pages/AuthCallback';
import ProtectedRoute from '../Components/ProtectedRoute';
import FaturasRoute from './FaturasRoute'; // CORRIGIDO: Remover "routes/" duplicado
import MainLayout from '../Layouts/MainLayout';

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