// src/modules/diagnostico/components/DiagnosticoButton.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import useAuth from '@/modules/auth/hooks/useAuth';

// IMPORTANTE: Importar o CSS
import '../styles/DiagnosticoButton.css';

/**
 * Componente inteligente para o botão de diagnóstico
 * Detecta se o usuário já fez o diagnóstico e adapta o visual
 */
const DiagnosticoButton = ({ isScrolled, className = '', onClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [diagnosticoStatus, setDiagnosticoStatus] = useState({
    jaFez: false,
    dataUltimo: null,
    loading: true
  });

  // Verifica se o usuário já fez o diagnóstico
  useEffect(() => {
    const verificarDiagnostico = async () => {
      if (!user?.id) {
        setDiagnosticoStatus({ jaFez: false, dataUltimo: null, loading: false });
        return;
      }

      try {
        // Verifica na tabela perfil_usuario se já completou o diagnóstico
        const { data: perfil, error } = await supabase
          .from('perfil_usuario')
          .select('diagnostico_completo, data_diagnostico')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Erro ao verificar diagnóstico:', error);
        }

        setDiagnosticoStatus({
          jaFez: perfil?.diagnostico_completo || false,
          dataUltimo: perfil?.data_diagnostico,
          loading: false
        });
      } catch (error) {
        console.error('Erro ao verificar diagnóstico:', error);
        setDiagnosticoStatus({ jaFez: false, dataUltimo: null, loading: false });
      }
    };

    verificarDiagnostico();
  }, [user?.id]);

  // Handler para navegação
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      navigate('/diagnostico');
    }
  }, [navigate, onClick]);

  // Determina as classes CSS baseado no status
  const getButtonClasses = () => {
    let baseClasses = `action-button diagnostico-button ${className}`;
    
    if (diagnosticoStatus.loading) {
      baseClasses += ' loading';
    }
    
    if (!diagnosticoStatus.jaFez && !diagnosticoStatus.loading) {
      baseClasses += ' first-time';
    }
    
    if (location.pathname === '/diagnostico') {
      baseClasses += ' active';
    }
    
    return baseClasses;
  };

  // Determina o texto do botão
  const getButtonText = () => {
    if (diagnosticoStatus.loading) return 'Carregando...';
    if (!diagnosticoStatus.jaFez) return 'Diagnóstico';
    return 'Diagnóstico';
  };

  // Determina o tooltip
  const getTooltip = () => {
    if (diagnosticoStatus.loading) return 'Carregando...';
    if (!diagnosticoStatus.jaFez) return 'Faça seu diagnóstico financeiro completo!';
    return 'Refazer diagnóstico financeiro';
  };

  // Determina o ícone
  const getIcon = () => {
    if (!diagnosticoStatus.jaFez && !diagnosticoStatus.loading) {
      return <Sparkles size={isScrolled ? 16 : 20} />;
    }
    return <Brain size={isScrolled ? 16 : 20} />;
  };

  // Verifica se precisa mostrar indicador de atualização
  const shouldShowUpdateIndicator = () => {
    if (!diagnosticoStatus.jaFez || !diagnosticoStatus.dataUltimo) return false;
    
    const dataUltimo = new Date(diagnosticoStatus.dataUltimo);
    const agora = new Date();
    const diasDiferenca = Math.floor((agora - dataUltimo) / (1000 * 60 * 60 * 24));
    
    return diasDiferenca > 90;
  };

  return (
    <div className="diagnostico-button-container">
      <button 
        className={getButtonClasses()}
        onClick={handleClick}
        data-tooltip={getTooltip()}
        disabled={diagnosticoStatus.loading}
      >
        {getIcon()}
        <span>{getButtonText()}</span>
        
        {/* Badge de "novo" para quem nunca fez */}
        {!diagnosticoStatus.jaFez && !diagnosticoStatus.loading && (
          <div className="diagnostico-novo-badge">
            Novo!
          </div>
        )}
        
        {/* Indicador de atualização disponível */}
        {shouldShowUpdateIndicator() && (
          <div className="diagnostico-update-indicator">
            <div className="update-dot" title="Recomendamos atualizar seu diagnóstico"></div>
          </div>
        )}
      </button>
      
      {/* Tooltip flutuante para primeira vez */}
      {!diagnosticoStatus.jaFez && !diagnosticoStatus.loading && (
        <div className="diagnostico-floating-tooltip">
          <div className="tooltip-content">
            <Sparkles size={16} />
            <span>Comece sua jornada financeira!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticoButton;