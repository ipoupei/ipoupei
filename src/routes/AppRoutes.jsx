import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 🆕 LANDING PAGE (Marketing) - NOVAS ROTAS
import LandingPage from '@modules/landing/pages/LandingPage';
import TermosDeUso from '@modules/landing/pages/TermosDeUso';

// ROTAS ORIGINAIS (mantidas como estavam)
import Login from '@modules/auth/pages/Login';
import Dashboard from '@modules/dashboard/pages/Dashboard';
import ResetPassword from '@modules/auth/pages/ResetPassword';
import UserProfile from '@modules/usuarios/components/UserProfile';
import TransacoesRouteHandler from '@modules/transacoes/components/TransacoesRouteHandler.jsx';
import ImportacaoPage from '@modules/transacoes/components/ImportacaoPage.jsx';
//import RelatoriosHome from '@modules/relatorios/components/RelatoriosHome.jsx';
import DREFinanceiro from '@modules/relatorios/components/DREFinanceiro.jsx';
import AuthCallback from '@modules/auth/pages/AuthCallback';
import ProtectedRoute from '@modules/auth/components/ProtectedRoute';
import MainLayout from '@shared/components/layouts/MainLayout';
import DiagnosticoEmocionalMain from '@modules/diagnostico/DiagnosticoEmocionalMain';
import DiagnosticoEmocionalRouter from '@modules/diagnostico/router/DiagnosticoEmocionalRouter';
import DiagnosticoRoute from './DiagnosticoRoute';
import GestaoCartoes from '@modules/cartoes/components/GestaoCartoes';
import PlanejamentoPage from '@modules/planejamento/pages/PlanejamentoPage';
import ContaAnalysisPage from '@modules/relatorios/components/ContaAnalysisPage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================
            🆕 LANDING PAGE - PÚBLICA
            ======================================== */}
        
        {/* Landing Page para usuários não logados */}
        <Route path="/home" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Termos e Política */}
        <Route path="/termos" element={<TermosDeUso />} />
        <Route path="/privacidade" element={<TermosDeUso />} />
        
        {/* ========================================
            🔐 ROTAS PÚBLICAS - SEM MainLayout
            ======================================== */}
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
        
        {/* ========================================
            📊 ROTAS PRINCIPAIS - COM MainLayout (ORIGINAL)
            ======================================== */}
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

          {/* 💰 PLANEJAMENTO - COACH PSICOLÓGICO FINANCEIRO */}
          <Route path="planejamento" element={<PlanejamentoPage />} />
          
          {/* Aliases para compatibilidade do planejamento */}
          <Route path="orcamento" element={<Navigate to="/planejamento" replace />} />
          <Route path="metas" element={<Navigate to="/planejamento" replace />} />
          <Route path="coach" element={<Navigate to="/planejamento" replace />} />
          <Route path="coach-financeiro" element={<Navigate to="/planejamento" replace />} />
          <Route path="regra-50-30-20" element={<Navigate to="/planejamento" replace />} />

          {/* Diagnóstico original */}
          <Route path="/susto-consciente/*" element={<DiagnosticoEmocionalRouter />} />

          {/* TRANSAÇÕES - NOVA IMPLEMENTAÇÃO COM FILTROS DINÂMICOS */}
          <Route path="/transacoes" element={<TransacoesRouteHandler />} />
          
          {/* NOVA ROTA: Importação de Transações como página completa */}
          <Route 
            path="/transacoes/importar" 
            element={<ImportacaoPage />} 
          />
          
          {/* Rotas específicas de transações com filtros pré-definidos */}
          <Route 
            path="/transacoes/receitas" 
            element={
              <Navigate 
                to="/transacoes?filter=receitas" 
                replace 
              />
            } 
          />
          <Route 
            path="/transacoes/despesas" 
            element={
              <Navigate 
                to="/transacoes?filter=despesas" 
                replace 
              />
            } 
          />
          <Route 
            path="/transacoes/cartoes" 
            element={
              <Navigate 
                to="/transacoes?filter=cartoes" 
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

          {/* CARTÕES - NOVA IMPLEMENTAÇÃO COMPLETA */}
          <Route path="cartoes">
            <Route index element={<Navigate to="gestao" replace />} />
            <Route path="gestao" element={<GestaoCartoes />} />
            <Route path="faturas" element={<GestaoCartoes />} />
            <Route path="faturas/:cartaoId" element={<GestaoCartoes />} />
            <Route path="lista" element={<Navigate to="gestao" replace />} />
            <Route path="minhas-faturas" element={<Navigate to="faturas" replace />} />
            <Route path="meus-cartoes" element={<Navigate to="gestao" replace />} />
            <Route path="*" element={<Navigate to="gestao" replace />} />
          </Route>

          {/* RELATÓRIOS - EXPANDIDO COM DRE FINANCEIRO E ANÁLISE DE CONTA */}
          <Route path="relatorios">
            <Route path="relatorios/dre" element={<DREFinanceiro />} />
            
            {/* 🆕 NOVA ROTA: DRE Financeiro Pessoal */}
            <Route path="dre" element={<DREFinanceiro />} />
            
            {/* 🆕 NOVA ROTA: Análise Detalhada por Conta */}
            <Route path="analise-conta" element={<ContaAnalysisPage />} />
            
            {/* Aliases para compatibilidade do DRE */}
            <Route path="dre-financeiro" element={<Navigate to="/relatorios/dre" replace />} />
            <Route path="demonstrativo" element={<Navigate to="/relatorios/dre" replace />} />
            <Route path="resultado" element={<Navigate to="/relatorios/dre" replace />} />
            
            {/* Aliases para análise de conta */}
            <Route path="conta" element={<Navigate to="/relatorios/analise-conta" replace />} />
            <Route path="analise" element={<Navigate to="/relatorios/analise-conta" replace />} />
            <Route path="conta-detalhada" element={<Navigate to="/relatorios/analise-conta" replace />} />
            <Route path="insights" element={<Navigate to="/relatorios/analise-conta" replace />} />
            <Route path="projecao" element={<Navigate to="/relatorios/analise-conta" replace />} />
            
            {/* Rota padrão para /relatorios/qualquer-coisa-inexistente */}
            <Route path="*" element={<Navigate to="/relatorios" replace />} />
          </Route>
          
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