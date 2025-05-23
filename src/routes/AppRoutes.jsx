import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ResetPassword from '../pages/ResetPassword';
import UserProfile from '../pages/UserProfile';
import ProtectedRoute from '../Components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

/**
 * Componente para gerenciar as rotas da aplicação
 * Inclui rotas públicas e protegidas
 */
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;