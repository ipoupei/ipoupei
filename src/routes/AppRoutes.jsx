import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ResetPassword from '../pages/ResetPassword';
import UserProfile from '../pages/UserProfile';
import Transacoes from '../pages/Transacoes';
import ProtectedRoute from '../Components/ProtectedRoute';

/**
 * Componente para gerenciar as rotas da aplicação
 * Incluindo a nova tela de transações
 */
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
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
        
        {/* Nova rota de transações */}
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