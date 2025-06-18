import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@modules/auth/pages/Login';
import Dashboard from '@modules/dashboard/pages/Dashboard';
import ResetPassword from '@modules/auth/pages/ResetPassword';
import UserProfile from '@modules/contas/components/UserProfile';
import TransacoesRouteHandler from '@modules/transacoes/components/TransacoesRouteHandler.jsx';
import RelatoriosHome from '@modules/relatorios/components/RelatoriosHome.jsx';
import RelatorioCategoria from '@modules/relatorios/components/RelatorioCategoria.jsx';
import RelatorioEvolucao from '@modules/relatorios/components/RelatorioEvolucao.jsx';
import RelatorioProjecao from '@modules/relatorios/components/RelatorioProjecao.jsx';
import AuthCallback from '@modules/auth/pages/AuthCallback';
import ProtectedRoute from '@modules/auth/components/ProtectedRoute';
import MainLayout from '@shared/components/layouts/MainLayout';
import DiagnosticoEmocionalMain from '@modules/diagnostico/DiagnosticoEmocionalMain';
import DiagnosticoEmocionalRouter from '@modules/diagnostico/router/DiagnosticoEmocionalRouter';
import DiagnosticoRoute from './DiagnosticoRoute';

/**
 * Componente para gerenciar as rotas da aplicação
 * ATUALIZADO: Integração com MainLayout para rotas principais
 * NOVO: Rota /susto-consciente para diagnóstico emocional
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
        
        {/* Diagnóstico Emocional "Susto Consciente" - FORA do MainLayout para experiência full-screen */}
        <Route 
          path="/susto-consciente/*" 
          element={
            <ProtectedRoute>
              <DiagnosticoEmocionalMain />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas principais - COM MainLayout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route 
            path="/diagnostico" 
            element={
              <ProtectedRoute>
                <DiagnosticoRoute />
              </ProtectedRoute>
            } 
          />
          
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Diagnóstico original */}
          <Route path="/susto-consciente/*" element={<DiagnosticoEmocionalRouter />} />

          {/* TRANSAÇÕES - NOVA IMPLEMENTAÇÃO COM FILTROS DINÂMICOS */}
          <Route path="/transacoes" element={<TransacoesRouteHandler />} />
          
          {/* Rotas específicas de transações com filtros pré-definidos */}
          <Route 
            path="/transacoes/receitas" 
            element={
              <Navigate 
                to="/transacoes?tipo=receita" 
                replace 
              />
            } 
          />
          <Route 
            path="/transacoes/despesas" 
            element={
              <Navigate 
                to="/transacoes?tipo=despesa" 
                replace 
              />
            } 
          />
          <Route 
            path="/transacoes/cartoes" 
            element={
              <Navigate 
                to="/transacoes?tem_cartao=true" 
                replace 
              />
            } 
          />
          <Route 
            path="/transacoes/contas" 
            element={
              <Navigate 
                to="/transacoes?agrupar_conta=true" 
                replace 
              />
            } 
          />
          
          {/* Relatórios */}
          <Route path="relatorios" element={<RelatoriosHome />} />
          <Route path="relatorios/categorias" element={<RelatorioCategoria />} />
          <Route path="relatorios/evolucao" element={<RelatorioEvolucao />} />
          <Route path="relatorios/projecoes" element={<RelatorioProjecao />} />
          
          {/* CONFIGURAÇÕES - UserProfile na área principal */}
          <Route path="configuracoes" element={<UserProfile />} />
          
          {/* Aliases para compatibilidade - todos redirecionam para /configuracoes */}
          <Route path="profile" element={<Navigate to="/configuracoes" replace />} />
          <Route path="settings" element={<Navigate to="/configuracoes" replace />} />
          <Route path="perfil" element={<Navigate to="/configuracoes" replace />} />
        </Route>
        
        {/* Rota para páginas não encontradas */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;