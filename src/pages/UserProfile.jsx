import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Shield, Bell, Monitor, CreditCard, LogOut, Check, X, Camera } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import './UserProfile.css';

/**
 * Página de Perfil do Usuário
 * Permite que o usuário gerencie suas informações pessoais e configurações
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
    fotoPerfil: null
  });
  
  const [passwordData, setPasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  
  const [preferences, setPreferences] = useState({
    temaDark: false,
    mostraSaldo: true,
    notificacoes: true,
    relatoriosMensais: false
  });
  
  // Estados para feedback ao usuário
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Inicializa dados do formulário a partir do usuário autenticado
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        nome: user.user_metadata?.nome || '',
        email: user.email || '',
        telefone: user.user_metadata?.telefone || '',
        fotoPerfil: user.user_metadata?.avatar_url || null
      });
      
      // Se houver preferências salvas, carrega-as
      const savedPrefs = user.user_metadata?.preferences;
      if (savedPrefs) {
        setPreferences(prev => ({
          ...prev,
          ...savedPrefs
        }));
      }
    }
  }, [user]);
  
  // Handler para alterações nos campos de informações pessoais
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
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
      // Aqui você poderia implementar o upload para o Supabase Storage
      // Por enquanto, apenas armazenamos o URL temporário
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonalInfo(prev => ({
          ...prev,
          fotoPerfil: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Função para salvar informações pessoais
  const savePersonalInfo = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Atualiza o perfil do usuário
      const { success, error } = await updateProfile({
        nome: personalInfo.nome,
        telefone: personalInfo.telefone,
        avatar_url: personalInfo.fotoPerfil
      });
      
      if (!success) {
        throw new Error(error || 'Falha ao atualizar perfil');
      }
      
      setMessage({
        type: 'success',
        text: 'Informações atualizadas com sucesso!'
      });
      
      // Limpa a mensagem após 3 segundos
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
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
    // Validações básicas
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
      // Atualiza a senha do usuário
      const { success, error } = await updatePassword(passwordData.novaSenha);
      
      if (!success) {
        throw new Error(error || 'Falha ao atualizar senha');
      }
      
      setMessage({
        type: 'success',
        text: 'Senha alterada com sucesso!'
      });
      
      // Limpa o formulário
      setPasswordData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });
      
      // Limpa a mensagem após 3 segundos
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
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
      // Atualiza as preferências do usuário
      const { success, error } = await updateProfile({
        preferences: preferences
      });
      
      if (!success) {
        throw new Error(error || 'Falha ao atualizar preferências');
      }
      
      setMessage({
        type: 'success',
        text: 'Preferências atualizadas com sucesso!'
      });
      
      // Atualiza o tema da aplicação se necessário
      document.body.classList.toggle('dark-theme', preferences.temaDark);
      
      // Limpa a mensagem após 3 segundos
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (err) {
      console.error('Erro ao atualizar preferências:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Erro ao atualizar preferências. Tente novamente.'
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
      console.error('Erro ao fazer logout:', err);
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
          {personalInfo.fotoPerfil ? (
            <img 
              src={personalInfo.fotoPerfil} 
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
            <div className="input-icon">📱</div>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={personalInfo.telefone}
              onChange={handlePersonalChange}
              placeholder="Seu número de telefone"
              className="input-with-icon"
            />
          </div>
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
  
  // Renderiza a aba de preferências
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
              <Monitor size={20} />
              <div className="preference-text">
                <h3>Tema Escuro</h3>
                <p>Ativa o modo noturno na aplicação</p>
              </div>
            </div>
            <div className="preference-control">
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.temaDark} 
                  onChange={() => handlePreferenceChange('temaDark')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="preference-item">
            <div className="preference-info">
              <CreditCard size={20} />
              <div className="preference-text">
                <h3>Mostrar Saldos</h3>
                <p>Exibe seus saldos bancários no dashboard</p>
              </div>
            </div>
            <div className="preference-control">
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.mostraSaldo} 
                  onChange={() => handlePreferenceChange('mostraSaldo')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
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
                  checked={preferences.notificacoes} 
                  onChange={() => handlePreferenceChange('notificacoes')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="preference-item">
            <div className="preference-info">
              <Mail size={20} />
              <div className="preference-text">
                <h3>Relatórios Mensais</h3>
                <p>Receba relatórios financeiros por email</p>
              </div>
            </div>
            <div className="preference-control">
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.relatoriosMensais} 
                  onChange={() => handlePreferenceChange('relatoriosMensais')}
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
            {personalInfo.fotoPerfil ? (
              <img src={personalInfo.fotoPerfil} alt="Avatar" />
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
            <Bell size={18} />
            <span>Preferências</span>
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
      </div>
    </div>
  );
};

export default UserProfile;