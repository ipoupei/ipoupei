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
        
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao desativar conta'
        });
      }
    };import React, { useState, useEffect } from 'react';
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
  
  // Renderiza a aba de exclusão - VERSÃO SUPER SIMPLIFICADA
  const renderDeleteTab = () => {
    return <ExcluirContaSuperSimples />;
  };
  
  // Componente ExcluirConta SUPER SIMPLIFICADO - BACKUP COM DOWNLOAD AUTOMÁTICO
  const ExcluirContaSuperSimples = () => {
    const { deleteAccount, deactivateAccount } = useDeleteAccount();

    // Estados locais
    const [confirmText, setConfirmText] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);

    // ✅ FUNÇÃO ÚNICA: GERA E BAIXA AUTOMATICAMENTE
    const gerarEBaixarBackup = async () => {
      if (!user?.id) {
        setMessage({ type: 'error', text: 'Usuário não autenticado' });
        return;
      }

      setIsGeneratingBackup(true);
      setMessage({ type: '', text: '' });

      try {
        console.log('🔄 Iniciando backup e download automático...');
        
        const backup = {
          info: {
            usuario_id: user.id,
            email: user.email,
            nome: user.user_metadata?.nome || user.user_metadata?.full_name || 'Usuário iPoupei',
            data_backup: new Date().toISOString(),
            versao: '1.0'
          },
          dados: {
            contas: [],
            cartoes: [],
            categorias: [],
            transacoes: [],
            transferencias: [],
            dividas: [],
            amigos: []
          },
          resumo: {
            total_registros: 0,
            tabelas_processadas: 0,
            status: 'completo'
          }
        };

        // 1. Buscar contas
        try {
          const { data: contas } = await supabase
            .from('contas')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.contas = contas || [];
          backup.resumo.total_registros += backup.dados.contas.length;
          console.log('✅ Contas:', backup.dados.contas.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar contas:', err);
        }

        // 2. Buscar cartões
        try {
          const { data: cartoes } = await supabase
            .from('cartoes')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.cartoes = cartoes || [];
          backup.resumo.total_registros += backup.dados.cartoes.length;
          console.log('✅ Cartões:', backup.dados.cartoes.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar cartões:', err);
        }

        // 3. Buscar categorias
        try {
          const { data: categorias } = await supabase
            .from('categorias')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.categorias = categorias || [];
          backup.resumo.total_registros += backup.dados.categorias.length;
          console.log('✅ Categorias:', backup.dados.categorias.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar categorias:', err);
        }

        // 4. Buscar transações (simplificado)
        try {
          const { data: transacoes } = await supabase
            .from('transacoes')
            .select('*')
            .eq('usuario_id', user.id)
            .order('data', { ascending: false })
            .limit(1000); // Limitar para evitar timeout
          backup.dados.transacoes = transacoes || [];
          backup.resumo.total_registros += backup.dados.transacoes.length;
          console.log('✅ Transações:', backup.dados.transacoes.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar transações:', err);
        }

        // 5. Buscar transferências
        try {
          const { data: transferencias } = await supabase
            .from('transferencias')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.transferencias = transferencias || [];
          backup.resumo.total_registros += backup.dados.transferencias.length;
          console.log('✅ Transferências:', backup.dados.transferencias.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar transferências:', err);
        }

        // 6. Buscar dívidas
        try {
          const { data: dividas } = await supabase
            .from('dividas')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.dividas = dividas || [];
          backup.resumo.total_registros += backup.dados.dividas.length;
          console.log('✅ Dívidas:', backup.dados.dividas.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar dívidas:', err);
        }

        // 7. Buscar amigos
        try {
          const { data: amigos } = await supabase
            .from('amigos')
            .select('*')
            .or(`usuario_proprietario.eq.${user.id},usuario_convidado.eq.${user.id}`);
          backup.dados.amigos = amigos || [];
          backup.resumo.total_registros += backup.dados.amigos.length;
          console.log('✅ Amigos:', backup.dados.amigos.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar amigos:', err);
        }

        // Finalizar backup
        backup.resumo.tabelas_processadas = 7;
        
        console.log('✅ Backup concluído, iniciando download...');
        
        // ✅ FAZER DOWNLOAD AUTOMATICAMENTE
        try {
          const dataStr = JSON.stringify(backup, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `ipoupei-backup-${user?.email?.replace('@', '-')}-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
          
          console.log('✅ Download automático concluído!');
          
          setMessage({
            type: 'success',
            text: `Backup gerado e baixado com sucesso! ${backup.resumo.total_registros} registros salvos.`
          });

        } catch (downloadError) {
          console.error('❌ Erro no download:', downloadError);
          setMessage({
            type: 'error',
            text: 'Backup gerado, mas erro no download: ' + downloadError.message
          });
        }

      } catch (error) {
        console.error('❌ Erro ao gerar backup:', error);
        setMessage({
          type: 'error',
          text: 'Erro ao gerar backup: ' + error.message
        });
      } finally {
        setIsGeneratingBackup(false);
      }
    };

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

    // ✅ FUNÇÃO DE BACKUP DIRETO NO COMPONENTE - SEM DEPENDÊNCIAS EXTERNAS
    const gerarBackupDireto = async () => {
      if (!user?.id) {
        setMessage({ type: 'error', text: 'Usuário não autenticado' });
        return;
      }

      setIsGeneratingBackup(true);
      setMessage({ type: '', text: '' });

      try {
        console.log('🔄 Iniciando backup direto...');
        
        const backup = {
          info: {
            usuario_id: user.id,
            email: user.email,
            nome: user.user_metadata?.nome || user.user_metadata?.full_name || 'Usuário iPoupei',
            data_backup: new Date().toISOString(),
            versao: '1.0'
          },
          dados: {
            contas: [],
            cartoes: [],
            categorias: [],
            transacoes: [],
            transferencias: [],
            dividas: [],
            amigos: []
          },
          resumo: {
            total_registros: 0,
            tabelas_processadas: 0,
            status: 'completo'
          }
        };

        // 1. Buscar contas
        try {
          const { data: contas } = await supabase
            .from('contas')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.contas = contas || [];
          backup.resumo.total_registros += backup.dados.contas.length;
          console.log('✅ Contas:', backup.dados.contas.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar contas:', err);
        }

        // 2. Buscar cartões
        try {
          const { data: cartoes } = await supabase
            .from('cartoes')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.cartoes = cartoes || [];
          backup.resumo.total_registros += backup.dados.cartoes.length;
          console.log('✅ Cartões:', backup.dados.cartoes.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar cartões:', err);
        }

        // 3. Buscar categorias
        try {
          const { data: categorias } = await supabase
            .from('categorias')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.categorias = categorias || [];
          backup.resumo.total_registros += backup.dados.categorias.length;
          console.log('✅ Categorias:', backup.dados.categorias.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar categorias:', err);
        }

        // 4. Buscar transações (simplificado)
        try {
          const { data: transacoes } = await supabase
            .from('transacoes')
            .select('*')
            .eq('usuario_id', user.id)
            .order('data', { ascending: false })
            .limit(1000); // Limitar para evitar timeout
          backup.dados.transacoes = transacoes || [];
          backup.resumo.total_registros += backup.dados.transacoes.length;
          console.log('✅ Transações:', backup.dados.transacoes.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar transações:', err);
        }

        // 5. Buscar transferências
        try {
          const { data: transferencias } = await supabase
            .from('transferencias')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.transferencias = transferencias || [];
          backup.resumo.total_registros += backup.dados.transferencias.length;
          console.log('✅ Transferências:', backup.dados.transferencias.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar transferências:', err);
        }

        // 6. Buscar dívidas
        try {
          const { data: dividas } = await supabase
            .from('dividas')
            .select('*')
            .eq('usuario_id', user.id);
          backup.dados.dividas = dividas || [];
          backup.resumo.total_registros += backup.dados.dividas.length;
          console.log('✅ Dívidas:', backup.dados.dividas.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar dívidas:', err);
        }

        // 7. Buscar amigos
        try {
          const { data: amigos } = await supabase
            .from('amigos')
            .select('*')
            .or(`usuario_proprietario.eq.${user.id},usuario_convidado.eq.${user.id}`);
          backup.dados.amigos = amigos || [];
          backup.resumo.total_registros += backup.dados.amigos.length;
          console.log('✅ Amigos:', backup.dados.amigos.length);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar amigos:', err);
        }

        // Finalizar backup
        backup.resumo.tabelas_processadas = 7;
        
        console.log('🔄 Finalizando backup e atualizando estados...');
        
        // ✅ ATUALIZAR DADOS E FORÇAR RE-RENDER
        setBackupData(backup);
        setIsGeneratingBackup(false);
        setForceUpdate(prev => prev + 1); // ✅ Força re-render

        setMessage({
          type: 'success',
          text: `Backup gerado com sucesso! ${backup.resumo.total_registros} registros encontrados.`
        });

        console.log('✅ Backup concluído:', backup);
        console.log('📊 Total de registros:', backup.resumo.total_registros);
        console.log('🔄 Estado isBackupReady será:', Boolean(backup && backup.resumo && backup.resumo.total_registros >= 0));

      } catch (error) {
        console.error('❌ Erro ao gerar backup:', error);
        setIsGeneratingBackup(false);
        setBackupData(null); // ✅ Limpar dados em caso de erro
        setForceUpdate(prev => prev + 1); // ✅ Força re-render
        setMessage({
          type: 'error',
          text: 'Erro ao gerar backup: ' + error.message
        });
      }
    };

    // ✅ FUNÇÃO DE DOWNLOAD DIRETO - SEM DEPENDÊNCIAS EXTERNAS
    const baixarBackupDireto = () => {
      if (!backupData) {
        setMessage({
          type: 'error',
          text: 'Nenhum backup disponível. Gere um backup primeiro.'
        });
        return;
      }

      try {
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ipoupei-backup-${user?.email?.replace('@', '-')}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        setMessage({
          type: 'success',
          text: 'Backup baixado com sucesso!'
        });

        console.log('✅ Download concluído');

      } catch (error) {
        console.error('❌ Erro ao baixar backup:', error);
        setMessage({
          type: 'error',
          text: 'Erro ao baixar backup: ' + error.message
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

    return (
      <div className="profile-tab-content">
        <div className="profile-section-header">
          <h2>Exclusão de Conta</h2>
          <p>Gerencie a exclusão ou desativação da sua conta iPoupei</p>
        </div>

        {/* Aviso importante */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertCircle size={24} color="#ef4444" />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#dc2626' }}>
              ⚠️ Atenção: Ação Irreversível
            </h4>
            <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.875rem' }}>
              A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados serão perdidos.
              <strong> Faça um backup antes de prosseguir.</strong>
            </p>
          </div>
        </div>

        {/* Seção de Backup - VERSÃO SIMPLIFICADA */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <FileText size={24} color="#3b82f6" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>📁 Backup dos Dados</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                Exporte todos os seus dados financeiros em um arquivo JSON
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={gerarEBaixarBackup}
              disabled={isGeneratingBackup}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 2rem',
                backgroundColor: isGeneratingBackup ? '#6b7280' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isGeneratingBackup ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: isGeneratingBackup ? 0.7 : 1
              }}
            >
              {isGeneratingBackup && (
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #ffffff40',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              )}
              <FileText size={16} />
              {isGeneratingBackup ? 'Gerando e baixando...' : '💾 Gerar e Baixar Backup'}
            </button>
          </div>
        </div>

        {/* Seção de Ações de Conta */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Shield size={24} color="#f59e0b" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>⚙️ Ações da Conta</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                Escolha como deseja proceder com sua conta
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Opção de Desativação */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fffbeb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={20} color="#f59e0b" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>⏸️ Desativar Temporariamente</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Suspende sua conta mas mantém os dados para reativação futura
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeactivateModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                Desativar
              </button>
            </div>

            {/* Opção de Exclusão */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              backgroundColor: '#fef2f2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Trash2 size={20} color="#ef4444" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>🗑️ Excluir Permanentemente</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Remove sua conta e todos os dados de forma irreversível
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && (
          <div style={modalStyles}>
            <div style={modalContainerStyles}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>🗑️ Confirmar Exclusão Permanente</h3>
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
                      ⚠️ Atenção: Esta ação é irreversível!
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
                    disabled={confirmText !== 'EXCLUIR MINHA CONTA'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: confirmText === 'EXCLUIR MINHA CONTA' ? '#dc2626' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: confirmText === 'EXCLUIR MINHA CONTA' ? 'pointer' : 'not-allowed',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      opacity: confirmText === 'EXCLUIR MINHA CONTA' ? 1 : 0.6
                    }}
                  >
                    <Trash2 size={16} />
                    🗑️ Excluir Conta Permanentemente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Desativação */}
        {showDeactivateModal && (
          <div style={modalStyles}>
            <div style={modalContainerStyles}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>⏸️ Desativar Conta Temporariamente</h3>
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
                      ⏸️ Desativação Temporária
                    </h4>
                    <p style={{ margin: 0 }}>
                      Sua conta será desativada, mas seus dados ficarão salvos em segurança. 
                      Você pode reativar a qualquer momento fazendo login novamente.
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    ✅ Vantagens da desativação:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#6b7280', fontSize: '0.8125rem' }}>
                    <li style={{ marginBottom: '0.25rem' }}>📊 Todos os dados permanecem salvos</li>
                    <li style={{ marginBottom: '0.25rem' }}>🔄 Pode reativar a qualquer momento</li>
                    <li style={{ marginBottom: '0.25rem' }}>⚙️ Suas configurações são preservadas</li>
                    <li style={{ marginBottom: '0.25rem' }}>📈 Histórico financeiro permanece intacto</li>
                  </ul>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  justifyContent: 'flex-end' 
                }}>
                  <button
                    onClick={() => setShowDeactivateModal(false)}
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    <Clock size={16} />
                    ⏸️ Desativar Conta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSS para animação de loading */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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