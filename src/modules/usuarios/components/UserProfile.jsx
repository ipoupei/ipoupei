import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Bell, 
  Settings, 
  LogOut, 
  Check, 
  X, 
  Camera,
  FileText,
  Trash2,
  Phone,
  AlertCircle,
  Chrome,
  Clock,
  Download
} from 'lucide-react';
import useAuth from "@modules/auth/hooks/useAuth";
import useDeleteAccount from "@modules/auth/hooks/useDeleteAccount";
import { supabase } from '@lib/supabaseClient';
import '@shared/styles/FormsModal.css';

/**
 * Página de Perfil do Usuário - Refatorada com Tabs Horizontais
 */
const UserProfile = () => {
  const { user, updateProfile, updatePassword, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState('personal');
  
  // Estados para os formulários
  const [personalInfo, setPersonalInfo] = useState({
    nome: '',
    email: '',
    telefone: '',
    avatar_url: null
  });
  
  const [passwordData, setPasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  
  const [preferences, setPreferences] = useState({
    aceita_notificacoes: true,
    aceita_marketing: false
  });
  
  // Estados para feedback ao usuário
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Verifica se é login via Google SSO
  const isGoogleUser = user?.app_metadata?.provider === 'google';
  
  // Inicializa dados do formulário a partir do usuário autenticado
  useEffect(() => {
    if (user) {
      const savedPhone = user.user_metadata?.telefone || '';
      const formattedPhone = savedPhone ? formatPhoneNumber(savedPhone) : '';
      
      setPersonalInfo({
        nome: user.user_metadata?.nome || user.user_metadata?.full_name || '',
        email: user.email || '',
        telefone: formattedPhone,
        avatar_url: user.user_metadata?.avatar_url || null
      });
      
      loadUserPreferences();
    }
  }, [user]);
  
  // Limpa mensagens automaticamente
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Carrega preferências do usuário
  const loadUserPreferences = async () => {
    try {
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('perfil_usuario')
        .select('aceita_notificacoes, aceita_marketing')
        .eq('id', user.id)
        .single();
      
      if (profile && !error) {
        setPreferences({
          aceita_notificacoes: profile.aceita_notificacoes ?? true,
          aceita_marketing: profile.aceita_marketing ?? false
        });
      } else {
        const savedPrefs = user.user_metadata?.preferences || {};
        setPreferences({
          aceita_notificacoes: savedPrefs.aceita_notificacoes ?? true,
          aceita_marketing: savedPrefs.aceita_marketing ?? false
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar preferências:', err);
      setPreferences({
        aceita_notificacoes: true,
        aceita_marketing: false
      });
    }
  };
  
  // Formata número de telefone brasileiro
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 11);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return limited.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    } else if (limited.length <= 10) {
      return limited.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return limited.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  };
  
  // Valida número de telefone
  const validatePhoneNumber = (phone) => {
    if (!phone) return true;
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10 || cleaned.length > 11) {
      return false;
    }
    
    const areaCode = cleaned.slice(0, 2);
    if (parseInt(areaCode) < 11 || parseInt(areaCode) > 99) {
      return false;
    }
    
    if (cleaned.length === 11) {
      const firstDigit = cleaned.charAt(2);
      if (firstDigit !== '9') {
        return false;
      }
    }
    
    return true;
  };
  
  // Valida senha
  const validatePassword = (password) => {
    return password.length >= 6;
  };
  
  // Handler para alterações nos campos de informações pessoais
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'telefone') {
      const formattedPhone = formatPhoneNumber(value);
      setPersonalInfo(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setPersonalInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handler para alterações nos campos de senha
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handler para alterações nas preferências
  const handlePreferenceChange = (name) => {
    setPreferences(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };
  
  // Handler para upload de imagem de perfil
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'Imagem muito grande. Máximo 5MB.'
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setMessage({
          type: 'error',
          text: 'Arquivo deve ser uma imagem.'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonalInfo(prev => ({
          ...prev,
          avatar_url: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Função de salvamento de informações pessoais - SIMPLIFICADA SEM ERROS
  const savePersonalInfo = async () => {
    if (personalInfo.telefone && !validatePhoneNumber(personalInfo.telefone)) {
      setMessage({
        type: 'error',
        text: 'Número de telefone inválido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX'
      });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Preparar dados para user_metadata
      const userMetadata = {};
      
      if (personalInfo.nome && personalInfo.nome.trim()) {
        userMetadata.nome = personalInfo.nome.trim();
        userMetadata.full_name = personalInfo.nome.trim();
      }
      
      if (personalInfo.telefone) {
        const cleanPhone = personalInfo.telefone.replace(/\D/g, '');
        userMetadata.telefone = cleanPhone;
      } else {
        userMetadata.telefone = '';
      }
      
      if (personalInfo.avatar_url) {
        userMetadata.avatar_url = personalInfo.avatar_url;
      }
      
      // ABORDAGEM SIMPLES: Salvar apenas no auth.users user_metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: userMetadata
      });
      
      if (authError) {
        throw authError;
      }
      
      // OPCIONAL: Também salvar na tabela perfil_usuario (apenas campos que existem)
      try {
        const profileData = {
          id: user.id,
          updated_at: new Date().toISOString()
        };
        
        // Só adicionar campos que existem na tabela
        if (userMetadata.nome) {
          profileData.nome = userMetadata.nome;
        }
        
        if (userMetadata.telefone !== undefined) {
          profileData.telefone = userMetadata.telefone;
        }
        
        if (userMetadata.avatar_url) {
          profileData.avatar_url = userMetadata.avatar_url;
        }
        
        // Se já existe registro, apenas atualiza (não usa upsert)
        const { data: existingProfile } = await supabase
          .from('perfil_usuario')
          .select('id')
          .eq('id', user.id)
          .single();
        
        if (existingProfile) {
          // Atualizar registro existente
          await supabase
            .from('perfil_usuario')
            .update(profileData)
            .eq('id', user.id);
        } else {
          // Inserir novo registro com email obrigatório
          profileData.email = user.email;
          await supabase
            .from('perfil_usuario')
            .insert(profileData);
        }
      } catch (profileError) {
        // Se falhar na tabela perfil_usuario, não é crítico
        console.warn('Aviso: Não foi possível atualizar perfil_usuario:', profileError);
      }
      
      setMessage({
        type: 'success',
        text: 'Informações atualizadas com sucesso!'
      });
      
      // Atualizar estado local
      setPersonalInfo(prev => ({
        ...prev,
        nome: userMetadata.nome || prev.nome,
        telefone: personalInfo.telefone, // Manter formatado
        avatar_url: userMetadata.avatar_url || prev.avatar_url
      }));
      
    } catch (err) {
      console.error('Erro ao salvar informações pessoais:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Erro ao atualizar perfil. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para alterar senha
  const changePassword = async () => {
    if (!validatePassword(passwordData.novaSenha)) {
      setMessage({
        type: 'error',
        text: 'A nova senha deve ter pelo menos 6 caracteres'
      });
      return;
    }
    
    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      setMessage({
        type: 'error',
        text: 'As senhas não coincidem'
      });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { success, error } = await updatePassword(passwordData.novaSenha);
      
      if (!success) {
        throw new Error(error || 'Falha ao atualizar senha');
      }
      
      setMessage({
        type: 'success',
        text: 'Senha alterada com sucesso!'
      });
      
      setPasswordData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });
      
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Erro ao alterar senha. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para salvar preferências
  const savePreferences = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: existingProfile } = await supabase
        .from('perfil_usuario')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        const { error } = await supabase
          .from('perfil_usuario')
          .update({
            aceita_notificacoes: preferences.aceita_notificacoes,
            aceita_marketing: preferences.aceita_marketing,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('perfil_usuario')
          .insert({
            id: user.id,
            email: user.email,
            nome: user.user_metadata?.nome || user.user_metadata?.full_name || '',
            aceita_notificacoes: preferences.aceita_notificacoes,
            aceita_marketing: preferences.aceita_marketing,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          throw error;
        }
      }
      
      setMessage({
        type: 'success',
        text: 'Preferências atualizadas com sucesso!'
      });
      
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
      setMessage({
        type: 'error',
        text: 'Erro ao atualizar preferências. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erro ao fazer logout. Tente novamente.'
      });
    }
  };
  
  // Definição das abas
  const tabs = [
    { id: 'personal', label: 'Informações Pessoais', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'preferences', label: 'Preferências', icon: Settings },
    { id: 'data', label: 'Meus Dados', icon: FileText },
    { id: 'delete', label: 'Exclusão de Conta', icon: Trash2 }
  ];
  
  // Renderiza as abas horizontais
  const renderTabs = () => (
    <div className="profile-tabs">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
  
  // Renderiza a aba de informações pessoais
  const renderPersonalTab = () => (
    <div className="profile-tab-content">
      <div className="profile-section-header">
        <h2>Informações Pessoais</h2>
        <p>Atualize suas informações básicas de perfil</p>
      </div>
      
      <div className="profile-photo-section">
        <div className="profile-photo-container">
          {personalInfo.avatar_url ? (
            <img 
              src={personalInfo.avatar_url} 
              alt="Foto de perfil" 
              className="profile-photo" 
            />
          ) : (
            <div className="profile-photo-placeholder">
              <User size={32} />
            </div>
          )}
          <label className="profile-photo-edit" htmlFor="photo-upload">
            <Camera size={16} />
            <input 
              type="file" 
              id="photo-upload" 
              accept="image/*" 
              onChange={handleImageUpload}
              hidden 
            />
          </label>
        </div>
      </div>
      
      <div className="profile-form">
        <div className="form-group">
          <label htmlFor="nome">Nome Completo</label>
          <div className="input-with-icon">
            <User size={18} className="input-icon" />
            <input
              type="text"
              id="nome"
              name="nome"
              value={personalInfo.nome}
              onChange={handlePersonalChange}
              placeholder="Seu nome completo"
              className="input-text"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={personalInfo.email}
              readOnly
              disabled
              className="input-text input-disabled"
            />
          </div>
          <small className="input-help">O email não pode ser alterado</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="telefone">Telefone</label>
          <div className="input-with-icon">
            <Phone size={18} className="input-icon" />
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={personalInfo.telefone}
              onChange={handlePersonalChange}
              placeholder="(11) 99999-9999"
              className="input-text"
              maxLength={15}
            />
          </div>
          <small className="input-help">
            Formato: (XX) XXXXX-XXXX para celular ou (XX) XXXX-XXXX para fixo
          </small>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className={`btn-primary ${loading ? 'loading' : ''}`}
            onClick={savePersonalInfo}
            disabled={loading}
          >
            {loading && <div className="btn-spinner"></div>}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Renderiza a aba de segurança
  const renderSecurityTab = () => (
    <div className="profile-tab-content">
      <div className="profile-section-header">
        <h2>Segurança</h2>
        <p>Altere sua senha e configure opções de segurança</p>
      </div>
      
      {isGoogleUser ? (
        <div className="google-auth-notice">
          <div className="google-auth-icon">
            <Chrome size={24} />
          </div>
          <div className="google-auth-content">
            <h3>Conta vinculada ao Google</h3>
            <p>
              Sua conta está autenticada via Google. Para alterar sua senha, 
              acesse as configurações da sua Conta Google diretamente.
            </p>
            <a 
              href="https://myaccount.google.com/security" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Gerenciar Conta Google
            </a>
          </div>
        </div>
      ) : (
        <div className="profile-form">
          <div className="form-group">
            <label htmlFor="senhaAtual">Senha Atual</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="senhaAtual"
                name="senhaAtual"
                value={passwordData.senhaAtual}
                onChange={handlePasswordChange}
                placeholder="Sua senha atual"
                className="input-text"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="novaSenha">Nova Senha</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="novaSenha"
                name="novaSenha"
                value={passwordData.novaSenha}
                onChange={handlePasswordChange}
                placeholder="Nova senha"
                className="input-text"
              />
            </div>
            <small className="input-help">Mínimo de 6 caracteres</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="confirmarSenha"
                name="confirmarSenha"
                value={passwordData.confirmarSenha}
                onChange={handlePasswordChange}
                placeholder="Confirme a nova senha"
                className="input-text"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className={`btn-primary ${loading ? 'loading' : ''}`}
              onClick={changePassword}
              disabled={loading}
            >
              {loading && <div className="btn-spinner"></div>}
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  // Renderiza a aba de preferências
  const renderPreferencesTab = () => (
    <div className="profile-tab-content">
      <div className="profile-section-header">
        <h2>Preferências</h2>
        <p>Personalize sua experiência no iPoupei</p>
      </div>
      
      <div className="profile-form">
        <div className="preferences-list">
          <div className="preference-item">
            <div className="preference-info">
              <Bell size={20} />
              <div className="preference-text">
                <h3>Notificações</h3>
                <p>Receba alertas de vencimentos e lançamentos</p>
              </div>
            </div>
            <div className="preference-control">
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.aceita_notificacoes} 
                  onChange={() => handlePreferenceChange('aceita_notificacoes')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="preference-item">
            <div className="preference-info">
              <Mail size={20} />
              <div className="preference-text">
                <h3>Emails Promocionais</h3>
                <p>Receba ofertas e novidades por email</p>
              </div>
            </div>
            <div className="preference-control">
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.aceita_marketing} 
                  onChange={() => handlePreferenceChange('aceita_marketing')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className={`btn-primary ${loading ? 'loading' : ''}`}
            onClick={savePreferences}
            disabled={loading}
          >
            {loading && <div className="btn-spinner"></div>}
            {loading ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Renderiza a aba de dados
  const renderDataTab = () => (
    <div className="profile-tab-content">
      <div className="profile-section-header">
        <h2>Meus Dados</h2>
        <p>Gerencie, exporte ou faça backup dos seus dados</p>
      </div>
      
      <div className="data-placeholder">
        <FileText size={48} />
        <h3>Gestão de Dados</h3>
        <p>
          Funcionalidade de gestão de dados em desenvolvimento.
          Em breve você poderá exportar, importar e gerenciar todos os seus dados financeiros.
        </p>
      </div>
    </div>
  );
  
  // Renderiza a aba de exclusão
  const renderDeleteTab = () => {
    return <ExcluirConta />;
  };
  
  // Componente ExcluirConta integrado - VERSÃO CORRIGIDA
  const ExcluirConta = () => {
    console.log('🔧 ExcluirConta interno renderizado!'); // Debug inicial
    
    const {
      loading: deleteLoading,
      error: deleteError,
      backupData,
      generateBackup,
      downloadBackup,
      validateDeletion,
      deleteAccount,
      deactivateAccount
    } = useDeleteAccount();

    // Estados locais
    const [currentStep, setCurrentStep] = useState(1);
    const [validationIssues, setValidationIssues] = useState([]);
    const [confirmText, setConfirmText] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [backupSummary, setBackupSummary] = useState(null);

    // Log do estado inicial
    useEffect(() => {
      console.log('🔧 ExcluirConta interno mounted - Estado:', {
        currentStep,
        deleteLoading,
        backupData: !!backupData,
        deleteError
      });
    }, []);

    // Estilos para modais (inline para garantir que funcionem)
    const modalStyles = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    };

    const modalContainerStyles = {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    };

    // Gera backup dos dados - VERSÃO CORRIGIDA
    const handleGenerateBackup = async () => {
      console.log('🚀 handleGenerateBackup interno iniciado...'); // Debug
      
      try {
        console.log('📦 Chamando generateBackup...'); // Debug
        const result = await generateBackup();
        console.log('📦 Resultado do backup:', result); // Debug
        
        if (result && result.success) {
          console.log('✅ Backup bem-sucedido!'); // Debug
          
          // Usar dados do backup retornado
          const data = result.data || backupData;
          console.log('📊 Dados do backup:', data); // Debug
          
          // Criar resumo a partir dos dados reais
          const resumo = {
            contas: data?.contas?.length || 0,
            cartoes: data?.cartoes?.length || 0,
            transacoes: data?.transacoes?.length || 0,
            categorias: data?.categorias?.length || 0,
            transferencias: data?.transferencias?.length || 0,
            dividas: data?.dividas?.length || 0,
            amigos: data?.amigos?.length || 0
          };
          
          console.log('📋 Resumo do backup:', resumo); // Debug
          setBackupSummary(resumo);
          
          setMessage({
            type: 'success',
            text: 'Backup gerado com sucesso! Você pode baixá-lo agora.'
          });
          
          console.log('🎯 Avançando para etapa 2...'); // Debug
          
          // Forçar atualização para próxima etapa
          setTimeout(() => {
            console.log('🔄 Mudando currentStep para 2...'); // Debug
            setCurrentStep(2);
          }, 100);
          
        } else {
          console.error('❌ Erro no backup:', result?.error || 'Resultado inválido');
          setMessage({
            type: 'error',
            text: result?.error || 'Erro ao gerar backup - resultado inválido'
          });
        }
      } catch (error) {
        console.error('💥 Erro inesperado no backup:', error);
        setMessage({
          type: 'error',
          text: 'Erro inesperado ao gerar backup: ' + error.message
        });
      }
    };

    // Baixa o backup - VERSÃO CORRIGIDA E SEMPRE ATIVA
    const handleDownloadBackup = () => {
      console.log('📥 Tentando baixar backup...', backupData); // Debug
      
      // Se não há backupData real, criar um backup básico de demonstração
      if (!backupData) {
        console.log('⚠️ Não há backupData, criando backup de demonstração...');
        
        const demoBackup = {
          usuario: {
            id: user?.id,
            email: user?.email,
            nome: user?.user_metadata?.nome || user?.user_metadata?.full_name
          },
          data_backup: new Date().toISOString(),
          versao_backup: '3.0',
          contas: [],
          cartoes: [],
          transacoes: [],
          categorias: [],
          transferencias: [],
          dividas: [],
          amigos: [],
          observacao: 'Backup gerado através do botão de debug - dados podem estar incompletos'
        };
        
        try {
          const dataStr = JSON.stringify(demoBackup, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `ipoupei-backup-demo-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
          
          setMessage({
            type: 'success',
            text: 'Backup de demonstração baixado com sucesso!'
          });
          return true;
        } catch (err) {
          console.error('Erro ao baixar backup de demonstração:', err);
          setMessage({
            type: 'error',
            text: 'Erro ao baixar backup: ' + err.message
          });
          return false;
        }
      }
      
      // Usar função original do hook se há dados reais
      const success = downloadBackup();
      if (success) {
        setMessage({
          type: 'success',
          text: 'Backup baixado com sucesso!'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Erro ao baixar backup. Tente novamente.'
        });
      }
    };

    // Valida se pode excluir - VERSÃO CORRIGIDA
    const handleValidateDeletion = async () => {
      console.log('🔍 Validando exclusão...'); // Debug
      const result = await validateDeletion();
      console.log('🔍 Resultado da validação:', result); // Debug
      
      if (result.success) {
        setValidationIssues(result.issues || []);
        setCurrentStep(3);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao validar exclusão'
        });
      }
    };

    // Processa exclusão
    const handleDeleteAccount = async () => {
      if (confirmText !== 'EXCLUIR MINHA CONTA') {
        setMessage({
          type: 'error',
          text: 'Digite exatamente "EXCLUIR MINHA CONTA" para confirmar'
        });
        return;
      }

      const result = await deleteAccount('', confirmText);
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Conta excluída com sucesso. Você será desconectado em instantes.'
        });
        setShowDeleteModal(false);
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao excluir conta'
        });
      }
    };

    // Processa desativação
    const handleDeactivateAccount = async () => {
      const result = await deactivateAccount();
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Conta desativada com sucesso. Você pode reativá-la fazendo login novamente.'
        });
        setShowDeactivateModal(false);
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao desativar conta'
        });
      }
    };

    const renderStep = () => {
      switch (currentStep) {
        case 1:
          return (
            <div className="delete-step">
              <div className="delete-step-icon">
                <AlertCircle size={64} color="#ef4444" />
              </div>
              <div className="delete-step-content">
                <h3>Exclusão de Conta</h3>
                <p>Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.</p>
                
                <div className="warning-box">
                  <h4>O que será excluído:</h4>
                  <ul>
                    <li>Todas as suas transações e histórico financeiro</li>
                    <li>Contas bancárias e cartões de crédito cadastrados</li>
                    <li>Categorias personalizadas e configurações</li>
                    <li>Relacionamentos com amigos e familiares</li>
                    <li>Dados do perfil e preferências</li>
                    <li>Transferências e histórico de movimentações</li>
                  </ul>
                </div>

                <div className="info-box">
                  <p>
                    <strong>Recomendação:</strong> Faça um backup dos seus dados antes de prosseguir. 
                    O backup será um arquivo JSON com todas as suas informações.
                  </p>
                </div>

                <button
                  type="button"
                  className={`btn-primary ${deleteLoading ? 'loading' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ onMouseDown - Botão "Gerar Backup" pressionado!');
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ onClick - Botão "Gerar Backup" clicado! (interno)');
                    handleGenerateBackup();
                  }}
                  disabled={deleteLoading}
                  style={{ 
                    position: 'relative', 
                    zIndex: 1000,
                    pointerEvents: 'auto'
                  }}
                >
                  {deleteLoading && <div className="btn-spinner"></div>}
                  {deleteLoading ? 'Gerando backup...' : 'Gerar Backup dos Dados'}
                </button>
                
                {/* Botão de debug temporário */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      console.log('🔧 [DEBUG] Forçando etapa 2...');
                      setCurrentStep(2);
                    }}
                    style={{ marginTop: '1rem' }}
                  >
                    Seguir para exclusão
                  </button>
                )}
              </div>
            </div>
          );

        case 2:
          return (
            <div className="delete-step">
              <div className="delete-step-icon">
                <FileText size={64} color="#3b82f6" />
              </div>
              <div className="delete-step-content">
                <h3>Backup Gerado</h3>
                <p>Seus dados foram compilados em um arquivo de backup.</p>

                <div className="backup-info">
                  <h4>Backup gerado com sucesso!</h4>
                  
                  {backupSummary ? (
                    <div className="backup-stats">
                      <span>{backupSummary.contas || 0} conta(s)</span>
                      <span>{backupSummary.cartoes || 0} cartão(ões)</span>
                      <span>{backupSummary.transacoes || 0} transação(ões)</span>
                      <span>{backupSummary.categorias || 0} categoria(s)</span>
                      <span>{backupSummary.transferencias || 0} transferência(s)</span>
                      <span>{backupSummary.dividas || 0} dívida(s)</span>
                      <span>{backupSummary.amigos || 0} relacionamento(s)</span>
                    </div>
                  ) : (
                    <p>Backup contém todos os seus dados financeiros.</p>
                  )}
                  
                  {backupData?.resumo && (
                    <div className="backup-summary">
                      <p>
                        <strong>Total:</strong> {backupData.resumo.total_registros || 0} registros em {backupData.resumo.total_tabelas || 0} tabelas
                      </p>
                      {backupData.resumo.tabelas_com_dados?.length > 0 && (
                        <p>
                          <strong>Tabelas com dados:</strong> {backupData.resumo.tabelas_com_dados.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="step-actions">
                  <button
                    className="btn-secondary"
                    onClick={handleDownloadBackup}
                    disabled={false} // ✅ SEMPRE ATIVO AGORA
                  >
                    <Download size={16} /> Baixar Backup
                  </button>
                  <button
                    className={`btn-primary ${deleteLoading ? 'loading' : ''}`}
                    onClick={handleValidateDeletion}
                    disabled={deleteLoading}
                  >
                    {deleteLoading && <div className="btn-spinner"></div>}
                    {deleteLoading ? 'Validando...' : 'Continuar'}
                  </button>
                </div>
                
                <div className="step-back">
                  <button
                    className="btn-link"
                    onClick={() => setCurrentStep(1)}
                  >
                    ← Voltar ao início
                  </button>
                </div>
              </div>
            </div>
          );

        case 3:
          return (
            <div className="delete-step">
              <div className="delete-step-icon">
                <Shield size={64} color="#f59e0b" />
              </div>
              <div className="delete-step-content">
                <h3>Validação de Exclusão</h3>
                <p>Verificamos sua conta e encontramos os seguintes pontos de atenção:</p>

                {validationIssues.length > 0 ? (
                  <div className="validation-issues">
                    {validationIssues.map((issue, index) => (
                      <div key={index} className={`validation-issue ${issue.type}`}>
                        <AlertCircle size={20} />
                        <div>
                          <h4>{issue.title}</h4>
                          <p>{issue.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="validation-success">
                    <Check size={20} />
                    <p>Sua conta está pronta para ser excluída sem problemas.</p>
                  </div>
                )}

                <div className="alternatives">
                  <h4>Alternativas à exclusão:</h4>
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className="alternative-btn"
                  >
                    <Clock size={18} />
                    <div>
                      <strong>Desativar temporariamente</strong>
                      <p>Suspende sua conta mas mantém os dados para reativação futura</p>
                    </div>
                  </button>
                </div>

                <div className="step-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentStep(2)}
                  >
                    ← Voltar
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 size={16} /> Prosseguir com Exclusão
                  </button>
                </div>
                
                <div className="step-back">
                  <button
                    className="btn-link"
                    onClick={() => setCurrentStep(1)}
                  >
                    Cancelar processo
                  </button>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="exclusao-conta-container">
        {/* Debug info - remover em produção */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            padding: '1rem', 
            background: '#f3f4f6', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace'
          }}>
            <strong>DEBUG INTERNO:</strong> Step: {currentStep}, Loading: {deleteLoading ? 'true' : 'false'}, 
            BackupData: {backupData ? 'exists' : 'null'}, 
            BackupSummary: {backupSummary ? 'exists' : 'null'},
            Error: {deleteError || 'none'}
          </div>
        )}
      
        {/* Cabeçalho */}
        <div className="section-header">
          <h2>Exclusão de Conta</h2>
          <p>Gerencie a exclusão ou desativação da sua conta iPoupei</p>
        </div>

        {/* Barra de progresso */}
        <div className="progress-container">
          <div className="progress-info">
            <span>Etapa {currentStep} de 3</span>
            <span>{Math.round((currentStep / 3) * 100)}% concluído</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Erro geral */}
        {deleteError && (
          <div className="profile-message error">
            <X size={16} />
            <span>{deleteError}</span>
          </div>
        )}

        {/* Conteúdo da etapa atual */}
        {renderStep()}

        {/* Modal de Confirmação de Exclusão - COM ESTILOS INLINE */}
        {showDeleteModal && (
          <div style={modalStyles}>
            <div style={modalContainerStyles}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Confirmar Exclusão Permanente</h3>
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer',
                    padding: '0.25rem',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px'
                }}>
                  <AlertCircle size={24} color="#ef4444" />
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#dc2626' }}>
                      Atenção: Esta ação é irreversível!
                    </h4>
                    <p style={{ margin: 0, color: '#7f1d1d' }}>
                      Todos os seus dados serão permanentemente excluídos e não poderão ser recuperados.
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    color: '#374951', 
                    fontSize: '0.875rem', 
                    fontWeight: 500, 
                    marginBottom: '0.5rem' 
                  }}>
                    Para confirmar, digite exatamente: <strong>EXCLUIR MINHA CONTA</strong>
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="EXCLUIR MINHA CONTA"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: confirmText === 'EXCLUIR MINHA CONTA' ? '2px solid #10b981' : '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: confirmText === 'EXCLUIR MINHA CONTA' ? '#f0fdf4' : 'white',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    autoComplete="off"
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  justifyContent: 'flex-end' 
                }}>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setConfirmText('');
                    }}
                    disabled={deleteLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374951',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || confirmText !== 'EXCLUIR MINHA CONTA'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: confirmText === 'EXCLUIR MINHA CONTA' && !deleteLoading ? '#dc2626' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: confirmText === 'EXCLUIR MINHA CONTA' && !deleteLoading ? 'pointer' : 'not-allowed',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      opacity: confirmText === 'EXCLUIR MINHA CONTA' && !deleteLoading ? 1 : 0.6
                    }}
                  >
                    {deleteLoading && <div className="btn-spinner"></div>}
                    <Trash2 size={16} />
                    {deleteLoading ? 'Excluindo...' : 'Excluir Conta Permanentemente'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Desativação - COM ESTILOS INLINE */}
        {showDeactivateModal && (
          <div style={modalStyles}>
            <div style={modalContainerStyles}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Desativar Conta Temporariamente</h3>
                <button 
                  onClick={() => setShowDeactivateModal(false)} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer',
                    padding: '0.25rem',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px'
                }}>
                  <Clock size={24} color="#f59e0b" />
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                      Desativação Temporária
                    </h4>
                    <p style={{ margin: 0 }}>
                      Sua conta será desativada, mas seus dados ficarão salvos em segurança. 
                      Você pode reativar a qualquer momento fazendo login novamente.
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Vantagens da desativação:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#6b7280', fontSize: '0.8125rem' }}>
                    <li style={{ marginBottom: '0.25rem' }}>Todos os dados permanecem salvos</li>
                    <li style={{ marginBottom: '0.25rem' }}>Pode reativar a qualquer momento</li>
                    <li style={{ marginBottom: '0.25rem' }}>Suas configurações são preservadas</li>
                    <li style={{ marginBottom: '0.25rem' }}>Histórico financeiro permanece intacto</li>
                  </ul>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  justifyContent: 'flex-end' 
                }}>
                  <button
                    onClick={() => setShowDeactivateModal(false)}
                    disabled={deleteLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374951',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeactivateAccount}
                    disabled={deleteLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: deleteLoading ? '#6b7280' : '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: deleteLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      opacity: deleteLoading ? 0.6 : 1
                    }}
                  >
                    {deleteLoading && <div className="btn-spinner"></div>}
                    <Clock size={16} />
                    {deleteLoading ? 'Desativando...' : 'Desativar Conta'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Renderiza mensagem de sucesso ou erro
  const renderMessage = () => {
    if (!message.text) return null;
    
    return (
      <div className={`profile-message ${message.type}`}>
        {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
        <span>{message.text}</span>
      </div>
    );
  };
  
  // Se ainda está carregando os dados do usuário
  if (authLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Carregando informações do perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header com informações básicas do usuário */}
      <div className="profile-header-card">
        <div className="profile-avatar-small">
          {personalInfo.avatar_url ? (
            <img src={personalInfo.avatar_url} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder">
              {personalInfo.nome ? personalInfo.nome.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
        <div className="profile-info-small">
          <h1>{personalInfo.nome || 'Usuário iPoupei'}</h1>
          <p>{personalInfo.email}</p>
        </div>
        <div className="profile-actions">
          <button 
            className="btn-logout"
            onClick={handleLogout}
            title="Sair da conta"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </div>
      
      {/* Navegação por abas horizontais */}
      {renderTabs()}
      
      {/* Mensagens de feedback */}
      {renderMessage()}
      
      {/* Conteúdo da aba ativa */}
      <div className="profile-content">
        {activeTab === 'personal' && renderPersonalTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'delete' && renderDeleteTab()}
      </div>
    </div>
  );
};

export default UserProfile;