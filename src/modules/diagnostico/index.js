// src/modules/diagnostico/index.js
export { default as DiagnosticoEmocionalMain } from './DiagnosticoEmocionalMain';
export { default as useDiagnosticoEmocionalStore } from './store/diagnosticoEmocionalStore';

// Páginas
export { default as WelcomeDiagnostico } from './pages/WelcomeDiagnostico';
export { default as RendaEtapa } from './pages/RendaEtapa';
export { default as VilaoEtapa } from './etapas/VilaoEtapa';
export { default as DividasEtapa } from './pages/DividasEtapa';
export { default as ResumoDiagnostico } from './pages/ResumoDiagnostico';
export { default as CtaPlanoEtapa } from './etapas/CtaPlanoEtapa';

// Componentes
export {
  ProgressBarDiagnostico,
  StepWrapper,
  OptionCard,
  MoneyInput,
  AlertBox,
  ResultadoVisual
} from './components/DiagnosticoComponents';

// Router
export { default as DiagnosticoEmocionalRouter } from './router/DiagnosticoEmocionalRouter';