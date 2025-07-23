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
import '@shared/styles/UnifiedModalSystem.css';

/**
 * Página de Perfil do Usuário - Refatorada com Classes Genéricas
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


   const compressImage = (file, maxWidth = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Função para fazer upload da imagem para o Supabase Storage
  const uploadAvatarToStorage = async (file, userId) => {
    try {
      // Comprimir imagem primeiro
      const compressedFile = await compressImage(file);
      
      // Gerar nome único para o arquivo
      const fileExt = 'jpg'; // Sempre JPEG após compressão
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('📤 Fazendo upload do avatar:', filePath);

      // Upload para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads') // ⚠️ Verifique se este bucket existe
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true // Substitui se já existir
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload concluído:', uploadData);

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 URL pública gerada:', publicUrl);

      return {
        success: true,
        url: publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('❌ Erro no upload do avatar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Função para deletar avatar antigo do storage
  const deleteOldAvatar = async (oldAvatarUrl) => {
    try {
      if (!oldAvatarUrl || !oldAvatarUrl.includes('user-uploads')) {
        return; // Não é um avatar do nosso storage
      }
      
      // Extrair o path da URL
      const url = new URL(oldAvatarUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/user-uploads\/(.+)$/);
      
      if (pathMatch) {
        const filePath = pathMatch[1];
        console.log('🗑️ Removendo avatar antigo:', filePath);
        
        const { error } = await supabase.storage
          .from('user-uploads')
          .remove([filePath]);
          
        if (error) {
          console.warn('⚠️ Não foi possível remover avatar antigo:', error);
        } else {
          console.log('✅ Avatar antigo removido');
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao remover avatar antigo:', error);
    }
  };

  
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
   const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validações básicas
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setMessage({
        type: 'error',
        text: 'Imagem muito grande. Máximo 10MB.'
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

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🔄 Iniciando upload do avatar...');
      
      // Preview local enquanto faz upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonalInfo(prev => ({
          ...prev,
          avatar_url: reader.result // Preview temporário
        }));
      };
      reader.readAsDataURL(file);

      // Upload para o storage
      const uploadResult = await uploadAvatarToStorage(file, user.id);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Falha no upload');
      }

      console.log('✅ Avatar enviado com sucesso:', uploadResult.url);

      // Atualizar estado com URL final
      setPersonalInfo(prev => ({
        ...prev,
        avatar_url: uploadResult.url
      }));

      setMessage({
        type: 'success',
        text: 'Foto carregada! Clique em "Salvar Alterações" para confirmar.'
      });

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      
      // Reverter preview em caso de erro
      setPersonalInfo(prev => ({
        ...prev,
        avatar_url: user.user_metadata?.avatar_url || null
      }));
      
      setMessage({
        type: 'error',
        text: `Erro ao carregar foto: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  

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
      console.log('💾 Salvando informações do perfil...');
      
      // Preparar dados para user_metadata
      const userMetadata = {};
      const oldAvatarUrl = user.user_metadata?.avatar_url;
      
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
      
      // ✅ CORREÇÃO PRINCIPAL: Salvar URL da imagem, não Base64
      if (personalInfo.avatar_url && personalInfo.avatar_url !== oldAvatarUrl) {
        // Se é uma URL do storage, salvar diretamente
        if (personalInfo.avatar_url.includes('supabase')) {
          userMetadata.avatar_url = personalInfo.avatar_url;
          
          // Remover avatar antigo se existir
          if (oldAvatarUrl) {
            await deleteOldAvatar(oldAvatarUrl);
          }
        }
        // Se ainda é base64 (não deveria acontecer), fazer upload agora
        else if (personalInfo.avatar_url.startsWith('data:image')) {
          console.log('⚠️ Detectado Base64, fazendo upload...');
          
          // Converter base64 para blob
          const response = await fetch(personalInfo.avatar_url);
          const blob = await response.blob();
          
          // Upload para storage
          const uploadResult = await uploadAvatarToStorage(blob, user.id);
          
          if (uploadResult.success) {
            userMetadata.avatar_url = uploadResult.url;
            // Remover avatar antigo
            if (oldAvatarUrl) {
              await deleteOldAvatar(oldAvatarUrl);
            }
          } else {
            throw new Error('Falha no upload da imagem');
          }
        }
      }
      
      console.log('📤 Atualizando user_metadata:', userMetadata);
      
      // Salvar no auth.users user_metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: userMetadata
      });
      
      if (authError) {
        console.error('❌ Erro no auth.updateUser:', authError);
        throw authError;
      }
      
      console.log('✅ user_metadata atualizado');
      
      // Opcional: Também salvar na tabela perfil_usuario
      try {
        const profileData = {
          id: user.id,
          updated_at: new Date().toISOString()
        };
        
        if (userMetadata.nome) {
          profileData.nome = userMetadata.nome;
        }
        
        if (userMetadata.telefone !== undefined) {
          profileData.telefone = userMetadata.telefone;
        }
        
        if (userMetadata.avatar_url) {
          profileData.avatar_url = userMetadata.avatar_url;
        }
        
        // Verificar se perfil existe
        const { data: existingProfile } = await supabase
          .from('perfil_usuario')
          .select('id')
          .eq('id', user.id)
          .single();
        
        if (existingProfile) {
          const { error: updateError } = await supabase
            .from('perfil_usuario')
            .update(profileData)
            .eq('id', user.id);
            
          if (updateError) {
            console.warn('⚠️ Erro ao atualizar perfil_usuario:', updateError);
          } else {
            console.log('✅ perfil_usuario atualizado');
          }
        } else {
          profileData.email = user.email;
          const { error: insertError } = await supabase
            .from('perfil_usuario')
            .insert(profileData);
            
          if (insertError) {
            console.warn('⚠️ Erro ao inserir perfil_usuario:', insertError);
          } else {
            console.log('✅ perfil_usuario criado');
          }
        }
      } catch (profileError) {
        console.warn('⚠️ Erro na tabela perfil_usuario (não crítico):', profileError);
      }
      
      setMessage({
        type: 'success',
        text: 'Informações atualizadas com sucesso!'
      });
      
      // Atualizar estado local
      setPersonalInfo(prev => ({
        ...prev,
        nome: userMetadata.nome || prev.nome,
        telefone: personalInfo.telefone,
        avatar_url: userMetadata.avatar_url || prev.avatar_url
      }));
      
      console.log('✅ Perfil salvo com sucesso');
      
    } catch (err) {
      console.error('❌ Erro ao salvar informações pessoais:', err);
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
    <div className="tab-navigation">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'tab-item--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={18} />
            <span className="tab-item__text">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
  
  // Renderiza a aba de informações pessoais
  const renderPersonalTab = () => (
    <div className="content-card__body">
      <div className="section-header">
        <h2 className="section-header__title">Informações Pessoais</h2>
        <p className="section-header__description">Atualize suas informações básicas de perfil</p>
      </div>
      
      <div className="photo-editor">
        <div className="photo-container">
          {personalInfo.avatar_url ? (
            <img 
              src={personalInfo.avatar_url} 
              alt="Foto de perfil" 
              className="avatar avatar--large" 
            />
          ) : (
            <div className="avatar avatar--large">
              <div className="avatar-placeholder">
                <User size={32} />
              </div>
            </div>
          )}
          <label className="photo-edit-button" htmlFor="photo-upload">
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
      
      <div className="form-layout">
        <div className="field-group">
          <label htmlFor="nome" className="field-label">Nome Completo</label>
          <div className="input-with-icon">
            <User size={18} className="input-icon" />
            <input
              type="text"
              id="nome"
              name="nome"
              value={personalInfo.nome}
              onChange={handlePersonalChange}
              placeholder="Seu nome completo"
              className="input-field"
            />
          </div>
        </div>
        
        <div className="field-group">
          <label htmlFor="email" className="field-label">Email</label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={personalInfo.email}
              readOnly
              disabled
              className="input-field input-field--disabled"
            />
          </div>
          <small className="field-help">O email não pode ser alterado</small>
        </div>
        
        <div className="field-group">
          <label htmlFor="telefone" className="field-label">Telefone</label>
          <div className="input-with-icon">
            <Phone size={18} className="input-icon" />
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={personalInfo.telefone}
              onChange={handlePersonalChange}
              placeholder="(11) 99999-9999"
              className="input-field"
              maxLength={15}
            />
          </div>
          <small className="field-help">
            Formato: (XX) XXXXX-XXXX para celular ou (XX) XXXX-XXXX para fixo
          </small>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className={`action-button action-button--primary ${loading ? 'action-button--loading' : ''}`}
            onClick={savePersonalInfo}
            disabled={loading}
          >
            {loading && <div className="button-spinner"></div>}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Renderiza a aba de segurança
  const renderSecurityTab = () => (
    <div className="content-card__body">
      <div className="section-header">
        <h2 className="section-header__title">Segurança</h2>
        <p className="section-header__description">Altere sua senha e configure opções de segurança</p>
      </div>
      
      {isGoogleUser ? (
        <div className="auth-notice">
          <div className="auth-notice__icon">
            <Chrome size={24} />
          </div>
          <div className="auth-notice__content">
            <h3 className="auth-notice__title">Conta vinculada ao Google</h3>
            <p className="auth-notice__description">
              Sua conta está autenticada via Google. Para alterar sua senha, 
              acesse as configurações da sua Conta Google diretamente.
            </p>
            <a 
              href="https://myaccount.google.com/security" 
              target="_blank" 
              rel="noopener noreferrer"
              className="action-button action-button--secondary"
            >
              Gerenciar Conta Google
            </a>
          </div>
        </div>
      ) : (
        <div className="form-layout">
          <div className="field-group">
            <label htmlFor="senhaAtual" className="field-label">Senha Atual</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="senhaAtual"
                name="senhaAtual"
                value={passwordData.senhaAtual}
                onChange={handlePasswordChange}
                placeholder="Sua senha atual"
                className="input-field"
              />
            </div>
          </div>
          
          <div className="field-group">
            <label htmlFor="novaSenha" className="field-label">Nova Senha</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="novaSenha"
                name="novaSenha"
                value={passwordData.novaSenha}
                onChange={handlePasswordChange}
                placeholder="Nova senha"
                className="input-field"
              />
            </div>
            <small className="field-help">Mínimo de 6 caracteres</small>
          </div>
          
          <div className="field-group">
            <label htmlFor="confirmarSenha" className="field-label">Confirmar Nova Senha</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="confirmarSenha"
                name="confirmarSenha"
                value={passwordData.confirmarSenha}
                onChange={handlePasswordChange}
                placeholder="Confirme a nova senha"
                className="input-field"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className={`action-button action-button--primary ${loading ? 'action-button--loading' : ''}`}
              onClick={changePassword}
              disabled={loading}
            >
              {loading && <div className="button-spinner"></div>}
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  // Renderiza a aba de preferências
  const renderPreferencesTab = () => (
    <div className="content-card__body">
      <div className="section-header">
        <h2 className="section-header__title">Preferências</h2>
        <p className="section-header__description">Personalize sua experiência no iPoupei</p>
      </div>
      
      <div className="form-layout">
        <div className="preference-list">
          <div className="preference-item">
            <div className="preference-info">
              <Bell size={20} />
              <div className="preference-text">
                <h3 className="preference-text__title">Notificações</h3>
                <p className="preference-text__description">Receba alertas de vencimentos e lançamentos</p>
              </div>
            </div>
            <div className="preference-control">
              <label className="toggle-switch">
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
                <h3 className="preference-text__title">Emails Promocionais</h3>
                <p className="preference-text__description">Receba ofertas e novidades por email</p>
              </div>
            </div>
            <div className="preference-control">
              <label className="toggle-switch">
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
            className={`action-button action-button--primary ${loading ? 'action-button--loading' : ''}`}
            onClick={savePreferences}
            disabled={loading}
          >
            {loading && <div className="button-spinner"></div>}
            {loading ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Renderiza a aba de dados
  const renderDataTab = () => (
    <div className="content-card__body">
      <div className="section-header">
        <h2 className="section-header__title">Meus Dados</h2>
        <p className="section-header__description">Gerencie, exporte ou faça backup dos seus dados</p>
      </div>
      
      <div className="data-placeholder">
        <FileText size={48} />
        <h3 className="data-placeholder__title">Gestão de Dados</h3>
        <p className="data-placeholder__description">
          Funcionalidade de gestão de dados em desenvolvimento.
          Em breve você poderá exportar, importar e gerenciar todos os seus dados financeiros.
        </p>
      </div>
    </div>
  );
  
  // Renderiza a aba de exclusão
  const renderDeleteTab = () => {
    return <AccountDeletionSection />;
  };
  
  // Componente de exclusão de conta refatorado
  const AccountDeletionSection = () => {
    const { deleteAccount, deactivateAccount } = useDeleteAccount();

    // Estados locais
    const [confirmText, setConfirmText] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);

    // Função para gerar e baixar backup automaticamente
    const generateAndDownloadBackup = async () => {
      if (!user?.id) {
        setMessage({ type: 'error', text: 'Usuário não autenticado' });
        return;
      }

      setIsGeneratingBackup(true);
      setMessage({ type: '', text: '' });

      try {
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

        // Buscar dados de todas as tabelas
        const tables = [
          { name: 'contas', key: 'contas' },
          { name: 'cartoes', key: 'cartoes' },
          { name: 'categorias', key: 'categorias' },
          { name: 'transacoes', key: 'transacoes' },
          { name: 'transferencias', key: 'transferencias' },
          { name: 'dividas', key: 'dividas' }
        ];

        for (const table of tables) {
          try {
            const { data } = await supabase
              .from(table.name)
              .select('*')
              .eq('usuario_id', user.id);
            backup.dados[table.key] = data || [];
            backup.resumo.total_registros += backup.dados[table.key].length;
          } catch (err) {
            console.warn(`Erro ao buscar ${table.name}:`, err);
          }
        }

        // Buscar amigos
        try {
          const { data: amigos } = await supabase
            .from('amigos')
            .select('*')
            .or(`usuario_proprietario.eq.${user.id},usuario_convidado.eq.${user.id}`);
          backup.dados.amigos = amigos || [];
          backup.resumo.total_registros += backup.dados.amigos.length;
        } catch (err) {
          console.warn('Erro ao buscar amigos:', err);
        }

        backup.resumo.tabelas_processadas = tables.length + 1;
        
        // Fazer download automaticamente
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
        
        setMessage({
          type: 'success',
          text: `Backup gerado e baixado com sucesso! ${backup.resumo.total_registros} registros salvos.`
        });

      } catch (error) {
        console.error('Erro ao gerar backup:', error);
        setMessage({
          type: 'error',
          text: 'Erro ao gerar backup: ' + error.message
        });
      } finally {
        setIsGeneratingBackup(false);
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
      <div className="content-card__body">
        <div className="section-header">
          <h2 className="section-header__title">Exclusão de Conta</h2>
          <p className="section-header__description">Gerencie a exclusão ou desativação da sua conta iPoupei</p>
        </div>

        {/* Aviso importante */}
        <div className="feedback-message feedback-message--error" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={24} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
              ⚠️ Atenção: Ação Irreversível
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados serão perdidos.
              <strong> Faça um backup antes de prosseguir.</strong>
            </p>
          </div>
        </div>

        {/* Seção de Backup */}
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
          <div className="content-card__body content-card__body--compact">
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
                onClick={generateAndDownloadBackup}
                disabled={isGeneratingBackup}
                className={`action-button action-button--primary ${isGeneratingBackup ? 'action-button--loading' : ''}`}
              >
                {isGeneratingBackup && <div className="button-spinner"></div>}
                <FileText size={16} />
                {isGeneratingBackup ? 'Gerando e baixando...' : '💾 Gerar e Baixar Backup'}
              </button>
            </div>
          </div>
        </div>

        {/* Seção de Ações de Conta */}
        <div className="content-card">
          <div className="content-card__body content-card__body--compact">
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
              <div className="preference-item" style={{ backgroundColor: '#fffbeb' }}>
                <div className="preference-info">
                  <Clock size={20} color="#f59e0b" />
                  <div className="preference-text">
                    <h4 className="preference-text__title">⏸️ Desativar Temporariamente</h4>
                    <p className="preference-text__description">
                      Suspende sua conta mas mantém os dados para reativação futura
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="action-button action-button--secondary"
                  style={{ backgroundColor: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}
                >
                  Desativar
                </button>
              </div>

              {/* Opção de Exclusão */}
              <div className="preference-item" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                <div className="preference-info">
                  <Trash2 size={20} color="#ef4444" />
                  <div className="preference-text">
                    <h4 className="preference-text__title">🗑️ Excluir Permanentemente</h4>
                    <p className="preference-text__description">
                      Remove sua conta e todos os dados de forma irreversível
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="action-button"
                  style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && (
          <div className="modal-overlay active">
            <div className="forms-modal-container">
              <div className="modal-header">
                <div className="modal-header-content">
                  <div className="modal-icon-container modal-icon-danger">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="modal-title">🗑️ Confirmar Exclusão Permanente</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="modal-close"
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="feedback-message feedback-message--error">
                  <AlertCircle size={24} />
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                      ⚠️ Atenção: Esta ação é irreversível!
                    </h4>
                    <p style={{ margin: 0 }}>
                      Todos os seus dados serão permanentemente excluídos e não poderão ser recuperados.
                    </p>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    Para confirmar, digite exatamente: <strong>EXCLUIR MINHA CONTA</strong>
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="EXCLUIR MINHA CONTA"
                    className={`input-field ${confirmText === 'EXCLUIR MINHA CONTA' ? '' : 'input-field--error'}`}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmText('');
                  }}
                  className="action-button action-button--secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'EXCLUIR MINHA CONTA'}
                  className="action-button"
                  style={{ 
                    backgroundColor: confirmText === 'EXCLUIR MINHA CONTA' ? '#dc2626' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    opacity: confirmText === 'EXCLUIR MINHA CONTA' ? 1 : 0.6
                  }}
                >
                  <Trash2 size={16} />
                  🗑️ Excluir Conta Permanentemente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Desativação */}
        {showDeactivateModal && (
          <div className="modal-overlay active">
            <div className="forms-modal-container">
              <div className="modal-header">
                <div className="modal-header-content">
                  <div className="modal-icon-container modal-icon-warning">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="modal-title">⏸️ Desativar Conta Temporariamente</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDeactivateModal(false)} 
                  className="modal-close"
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="feedback-message feedback-message--info">
                  <Clock size={24} />
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
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="action-button action-button--secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeactivateAccount}
                  className="action-button"
                  style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none' }}
                >
                  <Clock size={16} />
                  ⏸️ Desativar Conta
                </button>
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
      <div className={`feedback-message feedback-message--${message.type}`}>
        {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
        <span>{message.text}</span>
      </div>
    );
  };
  
  // Se ainda está carregando os dados do usuário
  if (authLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p className="loading-state__text">Carregando informações do perfil...</p>
      </div>
    );
  }

  return (
    <div className="page-layout">
      {/* Header com informações básicas do usuário */}
      <div className="header-card">
        <div className="avatar avatar--medium">
          {personalInfo.avatar_url ? (
            <img src={personalInfo.avatar_url} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder">
              {personalInfo.nome ? personalInfo.nome.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
        <div className="user-info">
          <h1 className="user-info__title">{personalInfo.nome || 'Usuário iPoupei'}</h1>
          <p className="user-info__subtitle">{personalInfo.email}</p>
        </div>
        <div className="header-actions">
          <button 
            className="action-button--logout"
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
      <div className="content-card">
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