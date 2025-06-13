// src/modules/diagnostico/router/DiagnosticoEmocionalRouter.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Importar todas as etapas com os nomes corretos
import Step01_WelcomeDiagnostico from '@modules/diagnostico/etapas/Step01_WelcomeDiagnostico.jsx';
import Step02_Renda from '@modules/diagnostico/etapas/Step02_Renda';
import Step03_GastosMensais from '@modules/diagnostico/etapas/Step03_GastosMensais';
import Step04_Dividas from '@modules/diagnostico/etapas/Step04_Dividas';
import Step05_Vilao from '@modules/diagnostico/etapas/Step05_Vilao';
import Step06_SaldoContas from '@modules/diagnostico/etapas/Step06_SaldoConta';
import Step07_ResumoDiagnostico from '@modules/diagnostico/etapas/Step07_ResumoDiagnostico';
import Step08_CtaPlanoEtapa from '@modules/diagnostico/etapas/Step08_CtaPlanoEtapa';

const DiagnosticoEmocionalRouter = () => {
  const location = useLocation();
  
  // Debug para verificar a rota atual
  console.log('Rota atual do diagnóstico:', location.pathname);
  
  return (
    <Routes>
      {/* Etapa 1: Welcome/Introdução */}
      <Route index element={<Step01_WelcomeDiagnostico />} />
      
      {/* Etapa 2: Renda e situação mensal */}
      <Route path="renda" element={<Step02_Renda />} />
      
      {/* Etapa 3: Gastos mensais detalhados */}
      <Route path="gastos-mensais" element={<Step03_GastosMensais />} />
      
      {/* Etapa 4: Dívidas */}
      <Route path="dividas" element={<Step04_Dividas />} />
      
      {/* Etapa 5: Maior vilão do orçamento */}
      <Route path="vilao" element={<Step05_Vilao />} />
      
      {/* Etapa 6: Saldos atuais */}
      <Route path="saldo-contas" element={<Step06_SaldoContas />} />
      
      {/* Etapa 7: Diagnóstico final/resumo */}
      <Route path="resumo" element={<Step07_ResumoDiagnostico />} />
      
      {/* Etapa 8: CTA para plano personalizado */}
      <Route path="plano" element={<Step08_CtaPlanoEtapa />} />
      
      {/* Aliases para retrocompatibilidade (caso alguém tenha links antigos) */}
      <Route path="inicio" element={<Navigate to="/susto-consciente" replace />} />
      <Route path="welcome" element={<Navigate to="/susto-consciente" replace />} />
      
      {/* Redirect any unknown paths to start */}
      <Route path="*" element={<Navigate to="/susto-consciente" replace />} />
    </Routes>
  );
};

export default DiagnosticoEmocionalRouter;