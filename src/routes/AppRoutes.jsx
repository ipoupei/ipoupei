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

/**
 * Componente para gerenciar as rotas da aplicação
 * Incluindo callback do Google OAuth e todas as telas
 * ATUALIZADO: Rotas de transações e relatórios corrigidas
 */
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Rota para callback do Google OAuth */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Rotas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } 
        />
        
        {/* Nova rota de transações - usando a TransacoesPage completa */}
        <Route 
          path="/transacoes" 
          element={
            <ProtectedRoute>
              <TransacoesPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas de Relatórios */}
        <Route 
          path="/relatorios" 
          element={
            <ProtectedRoute>
              <RelatoriosHome />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/relatorios/categorias" 
          element={
            <ProtectedRoute>
              <RelatorioCategoria />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/relatorios/evolucao" 
          element={
            <ProtectedRoute>
              <RelatorioEvolucao />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/relatorios/projecoes" 
          element={
            <ProtectedRoute>
              <RelatorioProjecao />
            </ProtectedRoute>
          } 
        />
        
        {/* Alias para configurações (redireciona para perfil) */}
        <Route 
          path="/settings" 
          element={<Navigate to="/profile" replace />}
        />
        
        <Route 
          path="/configuracoes" 
          element={<Navigate to="/profile" replace />}
        />
        
        {/* Alias para manter compatibilidade */}
        <Route 
          path="/perfil" 
          element={<Navigate to="/profile" replace />}
        />
        
        {/* Redireciona rota raiz para dashboard ou login */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* Rota para páginas não encontradas */}
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;