import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Bell, 
  CreditCard, 
  LogOut, 
  Check, 
  X, 
  Camera,
  Users,
  Trash2,
  Settings,
  FileText,
  Phone
} from 'lucide-react';
import useAuth from "@modules/auth/hooks/useAuth";
import AmigosEFamiliares from '@modules/Amigos/components/AmigosEFamiliares';
import ExcluirConta from '@modules/contas/components/ExcluirConta';
import { supabase } from '@lib/supabaseClient';
import '@modules/contas/styles/UserProfile.css';
/**
 * Página de Perfil do Usuário - VERSÃO FINAL SEM DEBUG
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
  
  // Inicializa dados do formulário a partir do usuário autenticado
  useEffect(() => {
    if (user) {
      // Formata telefone ao carregar
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
  
  // Carrega preferências do usuário - MELHORADA
  const loadUserPreferences = async () => {
    try {
      if (!user) return;
      
      // Tenta carregar do banco de dados primeiro
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
        // Fallback para metadados ou valores padrão
        const savedPrefs = user.user_metadata?.preferences || {};
        setPreferences({
          aceita_notificacoes: savedPrefs.aceita_notificacoes ?? true,
          aceita_marketing: savedPrefs.aceita_marketing ?? false
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar preferências:', err);
      // Define valores padrão em caso de erro
      setPreferences({
        aceita_notificacoes: true,
        aceita_marketing: false
      });
    }
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
  
  // Função de salvamento de informações pessoais - CORRIGIDA
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
      const dataToSave = {};
      
      if (personalInfo.nome && personalInfo.nome.trim()) {
        dataToSave.nome = personalInfo.nome.trim();
      }
      
      if (personalInfo.telefone) {
        const cleanPhone = personalInfo.telefone.replace(/\D/g, '');
        dataToSave.telefone = cleanPhone;
      } else {
        dataToSave.telefone = '';
      }
      
      if (personalInfo.avatar_url) {
        dataToSave.avatar_url = personalInfo.avatar_url;
      }
      
      // CORREÇÃO: Usar a função updateProfile original para informações pessoais
      const result = await updateProfile(dataToSave);
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao atualizar perfil');
      }
      
      setMessage({
        type: 'success',
        text: 'Informações atualizadas com sucesso!'
      });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
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
    if (passwordData.novaSenha.length < 6) {
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
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Erro ao alterar senha. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para salvar preferências - SEPARADA DO updateProfile
  const savePreferences = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Salva APENAS as preferências diretamente no banco
      const { data: existingProfile } = await supabase
        .from('perfil_usuario')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Atualiza perfil existente - APENAS as preferências
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
        // Cria perfil básico se não existir
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
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
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
  
  // Renderiza a aba de informações pessoais
  const renderPersonalTab = () => (
    <div className="profile-form-container">
      <div className="profile-form-header">
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
          <div className="input-container">
            <User size={18} className="input-icon" />
            <input
              type="text"
              id="nome"
              name="nome"
              value={personalInfo.nome}
              onChange={handlePersonalChange}
              placeholder="Seu nome completo"
              className="input-with-icon"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <div className="input-container">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={personalInfo.email}
              readOnly
              disabled
              className="input-with-icon disabled"
            />
          </div>
          <small className="input-help">O email não pode ser alterado</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="telefone">Telefone</label>
          <div className="input-container">
            <Phone size={18} className="input-icon" />
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={personalInfo.telefone}
              onChange={handlePersonalChange}
              placeholder="(11) 99999-9999"
              className="input-with-icon"
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
            className="btn-primary" 
            onClick={savePersonalInfo}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Renderiza a aba de segurança
  const renderSecurityTab = () => (
    <div className="profile-form-container">
      <div className="profile-form-header">
        <h2>Segurança</h2>
        <p>Altere sua senha e configure opções de segurança</p>
      </div>
      
      <div className="profile-form">
        <div className="form-group">
          <label htmlFor="senhaAtual">Senha Atual</label>
          <div className="input-container">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              id="senhaAtual"
              name="senhaAtual"
              value={passwordData.senhaAtual}
              onChange={handlePasswordChange}
              placeholder="Sua senha atual"
              className="input-with-icon"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="novaSenha">Nova Senha</label>
          <div className="input-container">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              id="novaSenha"
              name="novaSenha"
              value={passwordData.novaSenha}
              onChange={handlePasswordChange}
              placeholder="Nova senha"
              className="input-with-icon"
            />
          </div>
          <small className="input-help">Mínimo de 6 caracteres</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
          <div className="input-container">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={passwordData.confirmarSenha}
              onChange={handlePasswordChange}
              placeholder="Confirme a nova senha"
              className="input-with-icon"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={changePassword}
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Aba de preferências - SEM DEBUG
  const renderPreferencesTab = () => (
    <div className="profile-form-container">
      <div className="profile-form-header">
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
            className="btn-primary" 
            onClick={savePreferences}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Renderiza aba de amigos e familiares
  const renderAmigosTab = () => <AmigosEFamiliares />;
  
  // Renderiza aba de exclusão de conta
  const renderDeleteTab = () => <ExcluirConta />;
  
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
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="profile-header">
          <div className="profile-avatar">
            {personalInfo.avatar_url ? (
              <img src={personalInfo.avatar_url} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {personalInfo.nome ? personalInfo.nome.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>{personalInfo.nome || 'Usuário iPoupei'}</h2>
            <p>{personalInfo.email}</p>
          </div>
        </div>
        
        <nav className="profile-nav">
          <button 
            className={`nav-item ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <User size={18} />
            <span>Informações Pessoais</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            <span>Segurança</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Settings size={18} />
            <span>Preferências</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'amigos' ? 'active' : ''}`}
            onClick={() => setActiveTab('amigos')}
          >
            <Users size={18} />
            <span>Amigos e Familiares</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <FileText size={18} />
            <span>Meus Dados</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'delete' ? 'active' : ''}`}
            onClick={() => setActiveTab('delete')}
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={18} />
            <span>Excluir Conta</span>
          </button>
          
          <button 
            className="nav-item logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sair da Conta</span>
          </button>
        </nav>
      </div>
      
      <div className="profile-content">
        {renderMessage()}
        
        {activeTab === 'personal' && renderPersonalTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'amigos' && renderAmigosTab()}
        {activeTab === 'data' && (
          <div className="profile-form-container">
            <div className="profile-form-header">
              <h2>Meus Dados</h2>
              <p>Gerencie, exporte ou faça backup dos seus dados</p>
            </div>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <FileText size={48} style={{ color: '#9ca3af', marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
              <p style={{ color: '#6b7280' }}>
                Funcionalidade de gestão de dados em desenvolvimento.
                Em breve você poderá exportar, importar e gerenciar todos os seus dados financeiros.
              </p>
            </div>
          </div>
        )}
        {activeTab === 'delete' && renderDeleteTab()}
      </div>
    </div>
  );
};

export default UserProfile;