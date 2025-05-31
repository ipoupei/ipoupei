import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ResetPassword from '../pages/ResetPassword';
import UserProfile from '../pages/UserProfile';
import Transacoes from '../pages/Transacoes';
import AuthCallback from '../pages/AuthCallback';
import ProtectedRoute from '../Components/ProtectedRoute';

/**
 * Componente para gerenciar as rotas da aplicação
 * Incluindo callback do Google OAuth e todas as telas
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
        
        {/* Rota de transações */}
        <Route 
          path="/transacoes" 
          element={
            <ProtectedRoute>
              <Transacoes />
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