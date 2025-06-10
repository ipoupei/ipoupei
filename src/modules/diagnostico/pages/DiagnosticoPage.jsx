// src/modules/diagnostico/pages/DiagnosticoPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DiagnosticoFlow from '../components/DiagnosticoFlow';
import { useDiagnosticoFlowStore } from '../store/diagnosticoFlowStore';
import { supabase } from '../../../lib/supabaseClient';

const DiagnosticoPage = () => {
  const navigate = useNavigate();
  const { iniciarDiagnostico } = useDiagnosticoFlowStore();

  useEffect(() => {
    checkAuthAndInit();
  }, []);

  const checkAuthAndInit = async () => {
    try {
      // Verificar se usuário está autenticado
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate('/login');
        return;
      }

      // Verificar se o usuário já fez o diagnóstico
      await checkDiagnosticoStatus(user);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      navigate('/login');
    }
  };

  const checkDiagnosticoStatus = async (user) => {
    try {
      // Verificar se o usuário já completou o diagnóstico
      const { data: perfil, error } = await supabase
        .from('perfil_usuario')
        .select('diagnostico_completo')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
      }
      
      // Se já fez o diagnóstico, pode mostrar opção de refazer
      // Por enquanto, sempre permite fazer o diagnóstico
      // if (perfil?.diagnostico_completo) {
      //   navigate('/dashboard');
      //   return;
      // }
      
      // Iniciar diagnóstico
      iniciarDiagnostico();
    } catch (error) {
      console.error('Erro ao verificar diagnóstico:', error);
      // Em caso de erro, permite fazer o diagnóstico
      iniciarDiagnostico();
    }
  };

  return (
    <div className="diagnostico-page">
      <DiagnosticoFlow />
    </div>
  );
};

export default DiagnosticoPage;