// src/modules/diagnostico/DiagnosticoEmocionalMain.jsx
import React from 'react';
import DiagnosticoEmocionalRouter from './router/DiagnosticoEmocionalRouter';
import './styles/DiagnosticoEmocional.css';

/**
 * Componente principal que gerencia todo o fluxo do diagnóstico emocional
 * Este componente serve como wrapper para o router e configurações globais
 */
const DiagnosticoEmocionalMain = () => {
  return (
    <div className="diagnostico-emocional-app">
      <DiagnosticoEmocionalRouter />
    </div>
  );
};

export default DiagnosticoEmocionalMain;