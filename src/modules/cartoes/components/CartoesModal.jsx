// src/modules/cartoes/components/CartoesModal.jsx - VERSÃO REFATORADA SEM DEPENDÊNCIAS DE CONTAS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Archive,
  ArchiveRestore,
  X, 
  Calculator,
  DollarSign,
  Palette,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

import { useAuthStore } from '@modules/auth/store/authStore';
import { useUIStore } from '@store/uiStore';
import { formatCurrency } from '@utils/formatCurrency';
import useCartoesData from '@modules/cartoes/hooks/useCartoesData';
import useFaturaOperations from '@modules/cartoes/hooks/useFaturaOperations';
import '@shared/styles/PrincipalArquivoDeClasses.css';

/**
 * Modal de Gerenciamento de Cartões - VERSÃO LIMPA SEM DEPENDÊNCIAS DE CONTAS
 * ✅ Remove todas as dependências do sistema de contas
 * ✅ Mantém todas as funcionalidades existentes dos cartões
 * ✅ Interface consistente com documentação técnica
 */
const CartoesModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  
  // ✅ HOOKS: Mantém funcionalidade dos cartões, remove useContas
  const {
    fetchCartoes,
    loading: cartoesLoading
  } = useCartoesData();
  
  const {
    criarCartao,
    editarCartao,
    arquivarCartao,
    loading: operationLoading
  } = useFaturaOperations();
  
  const nomeInputRef = useRef(null);

  // =============================================================================
  // ESTADOS PRINCIPAIS
  // =============================================================================
  
  const [submitting, setSubmitting] = useState(false);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [cartoes, setCartoes] = useState([]);
  const [cartoesArquivados, setCartoesArquivados] = useState([]);
  
  // Estados do formulário de cartão - ✅ REMOVIDO: contaId
  const [modoFormulario, setModoFormulario] = useState(null); // null, 'criar', 'editar'
  const [cartaoEditando, setCartaoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'credito',
    limite: '0,00',
    vencimento: '',
    fechamento: '',
    bandeira: '',
    cor: '#8B5CF6'
  });
  const [formErrors, setFormErrors] = useState({});

  // Estados dos modais de ação
  const [modalCorrigirLimite, setModalCorrigirLimite] = useState({
    ativo: false,
    cartao: null,
    novoLimite: '',
    motivo: ''
  });

  const [modalArquivar, setModalArquivar] = useState({
    ativo: false,
    cartao: null,
    motivo: ''
  });

  const [modalDesarquivar, setModalDesarquivar] = useState({
    ativo: false,
    cartao: null
  });

  // =============================================================================
  // CONFIGURAÇÕES E CONSTANTES
  // =============================================================================
  
  const tiposCartao = [
    { value: 'credito', label: 'Crédito', icon: '💳' },
  ];

  const bandeirasPredefinidas = [
    'Visa',
    'Mastercard',
    'Elo',
    'American Express',
    'Hipercard',
    'Diners',
    'Discover',
    'JCB',
    'Aura',
    'Sorocred'
  ];

  const coresPredefinidas = [
    // Linha 1 - Cores vibrantes e principais
    '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#3B82F6', '#84CC16', '#F97316', '#6366F1',
    // Linha 2 - Cores complementares e neutras
    '#14B8A6', '#F43F5E', '#8B5A2B', '#7C3AED', '#DC2626',
    '#059669', '#0EA5E9', '#D97706', '#7C2D12', '#4C1D95'
  ];

  const diasVencimento = Array.from({ length: 31 }, (_, i) => i + 1);

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================
  
  const formatarValorInput = useCallback((valor) => {
    const apenasNumeros = valor.toString().replace(/\D/g, '');
    if (!apenasNumeros || apenasNumeros === '0') return '';
    const valorEmCentavos = parseInt(apenasNumeros, 10);
    const valorEmReais = valorEmCentavos / 100;
    return valorEmReais.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  const parseValorInput = useCallback((valorString) => {
    if (!valorString) return 0;
    
    const valorLimpo = valorString.toString();
    if (valorLimpo.includes(',')) {
      const partes = valorLimpo.split(',');
      const inteira = partes[0].replace(/\./g, '');
      const decimal = partes[1] || '00';
      const valorFinal = parseFloat(`${inteira}.${decimal}`);
      return isNaN(valorFinal) ? 0 : valorFinal;
    } else {
      const apenasNumeros = valorLimpo.replace(/\./g, '');
      const valorFinal = parseFloat(apenasNumeros) / 100;
      return isNaN(valorFinal) ? 0 : valorFinal;
    }
  }, []);

  const resetFormulario = useCallback(() => {
    setFormData({
      nome: '',
      tipo: 'credito',
      limite: '0,00',
      vencimento: '',
      fechamento: '',
      bandeira: '',
      cor: '#8B5CF6'
    });
    setFormErrors({});
    setCartaoEditando(null);
    setModoFormulario(null);
  }, []);

  // =============================================================================
  // CARREGAMENTO DE DADOS - ✅ SIMPLIFICADO: Remove carregamento de contas
  // =============================================================================
  
  const carregarDados = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('🔓 Modal aberto, carregando cartões...');
      
      const cartoesData = await fetchCartoes().catch(err => { 
        console.error('Erro fetchCartoes:', err); 
        return []; 
      });
      
      // ✅ CORREÇÃO: Garantir que são arrays
      const cartoesArray = Array.isArray(cartoesData) ? cartoesData : [];
      
      // Separar cartões ativos dos arquivados
      const cartoesAtivos = cartoesArray.filter(cartao => cartao.ativo !== false);
      const cartoesArquivadosData = cartoesArray.filter(cartao => 
        cartao.ativo === false || cartao.ativo === 0
      );      
      setCartoes(cartoesAtivos);
      setCartoesArquivados(cartoesArquivadosData);
      
      console.log('✅ Dados carregados:', {
        cartoesAtivos: cartoesAtivos.length,
        cartoesArquivados: cartoesArquivadosData.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados', 'error');
    }
  }, [user, fetchCartoes, showNotification]);

  // =============================================================================
  // CÁLCULOS E RESUMOS
  // =============================================================================
  
  const resumo = React.useMemo(() => {
    const limiteTotal = cartoes.reduce((sum, cartao) => sum + (cartao.limite || 0), 0);
    const cartoesCredito = cartoes.filter(cartao => cartao.tipo === 'credito').length;
    const cartoesDebito = cartoes.filter(cartao => cartao.tipo === 'debito').length;
    
    return { 
      limiteTotal, 
      cartoesCredito, 
      cartoesDebito, 
      totalAtivos: cartoes.length,
      totalArquivados: cartoesArquivados.length
    };
  }, [cartoes, cartoesArquivados]);

  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  // Carregar dados ao abrir modal
  useEffect(() => {
    if (isOpen && user) {
      carregarDados();
    }
  }, [isOpen, user, carregarDados]);

  // ESC para fechar - CORRIGIDO para fechar modais aninhados primeiro
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        // Prioridade: fechar modais aninhados primeiro
        if (modalCorrigirLimite.ativo) {
          setModalCorrigirLimite({ ativo: false, cartao: null, novoLimite: '', motivo: '' });
        } else if (modalArquivar.ativo) {
          setModalArquivar({ ativo: false, cartao: null, motivo: '' });
        } else if (modalDesarquivar.ativo) {
          setModalDesarquivar({ ativo: false, cartao: null });
        } else if (modoFormulario) {
          resetFormulario();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, modoFormulario, modalCorrigirLimite.ativo, modalArquivar.ativo, modalDesarquivar.ativo, resetFormulario, onClose]);

  // =============================================================================
  // HANDLERS DO FORMULÁRIO
  // =============================================================================
  
  const toggleMostrarArquivados = useCallback(() => {
    const novoEstado = !mostrarArquivados;
    console.log('🔄 Toggle mostrar arquivados:', {
      de: mostrarArquivados,
      para: novoEstado,
      cartoesArquivados: cartoesArquivados.length
    });
    setMostrarArquivados(novoEstado);
  }, [mostrarArquivados, cartoesArquivados.length]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [formErrors]);

  const handleLimiteChange = useCallback((e) => {
    const valorOriginal = e.target.value;
    
    if (valorOriginal === '') {
      setFormData(prev => ({ ...prev, limite: valorOriginal }));
      if (formErrors.limite) {
        setFormErrors(prev => ({ ...prev, limite: null }));
      }
      return;
    }
    
    const valorFormatado = formatarValorInput(valorOriginal);
    
    setFormData(prev => ({ ...prev, limite: valorFormatado }));
    if (formErrors.limite) {
      setFormErrors(prev => ({ ...prev, limite: null }));
    }
  }, [formatarValorInput, formErrors.limite]);

  const handleCorChange = useCallback((cor) => {
    setFormData(prev => ({ ...prev, cor }));
  }, []);

  // =============================================================================
  // AÇÕES DO FORMULÁRIO
  // =============================================================================
  
  const iniciarCriacaoCartao = useCallback(() => {
    resetFormulario();
    setModoFormulario('criar');
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  }, [resetFormulario]);

  const iniciarEdicaoCartao = useCallback((cartao) => {
    setFormData({
      nome: cartao.nome,
      tipo: 'credito',
      limite: (cartao.limite || 0).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }),
      vencimento: cartao.dia_vencimento?.toString() || '',
      fechamento: cartao.dia_fechamento?.toString() || '',
      bandeira: cartao.bandeira || '',
      cor: cartao.cor || '#8B5CF6'
    });
    setCartaoEditando(cartao);
    setModoFormulario('editar');
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  }, []);

  // ✅ VALIDAÇÃO SIMPLIFICADA: Remove validação de contaId
  const validarFormulario = useCallback(() => {
    const erros = {};
    
    if (!formData.nome.trim()) {
      erros.nome = "Nome é obrigatório";
    }
    if (!formData.bandeira.trim()) {
      erros.bandeira = "Bandeira é obrigatória";
    }
    if (!formData.limite || parseValorInput(formData.limite) <= 0) {
      erros.limite = "Limite é obrigatório e deve ser maior que zero";
    }
    if (!formData.vencimento || formData.vencimento < 1 || formData.vencimento > 31) {
      erros.vencimento = "Dia de vencimento deve estar entre 1 e 31";
    }
    if (!formData.fechamento || formData.fechamento < 1 || formData.fechamento > 31) {
      erros.fechamento = "Dia de fechamento deve estar entre 1 e 31";
    }
    
    setFormErrors(erros);
    return Object.keys(erros).length === 0;
  }, [formData]);

  // ✅ FUNÇÃO CORRIGIDA - Remove conta_debito_id
  const submeterFormulario = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const dadosCartao = {
        nome: formData.nome.trim(),
        limite: parseValorInput(formData.limite),
        dia_vencimento: parseInt(formData.vencimento),
        dia_fechamento: parseInt(formData.fechamento),
        bandeira: formData.bandeira.trim(),
        cor: formData.cor
      };
      
      if (modoFormulario === 'editar' && cartaoEditando) {
        const resultado = await editarCartao(cartaoEditando.id, dadosCartao);
        
        if (resultado.success) {
          showNotification('Cartão atualizado com sucesso!', 'success');
        } else {
          throw new Error(resultado.error);
        }
        
      } else {
        const resultado = await criarCartao(dadosCartao);
        
        if (resultado.success) {
          showNotification('Cartão criado com sucesso!', 'success');
        } else {
          throw new Error(resultado.error);
        }
      }
      
      // Recarregar dados
      await carregarDados();
      resetFormulario();
      if (onSave) onSave();
      
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      showNotification('Erro ao salvar cartão', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validarFormulario, modoFormulario, cartaoEditando, formData, parseValorInput, editarCartao, criarCartao, carregarDados, resetFormulario, onSave, showNotification]);

  // =============================================================================
  // AÇÕES DE CORREÇÃO DE LIMITE
  // =============================================================================
  
  const iniciarCorrecaoLimite = useCallback((cartao) => {
    setModalCorrigirLimite({
      ativo: true,
      cartao,
      novoLimite: (cartao.limite || 0).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }),
      motivo: ''
    });
  }, []);

  const processarCorrecaoLimite = useCallback(async () => {
    if (!modalCorrigirLimite.cartao) return;

    const novoLimiteNumerico = parseFloat(
      modalCorrigirLimite.novoLimite.replace(/\./g, '').replace(',', '.')
    );

    if (isNaN(novoLimiteNumerico)) {
      showNotification('Valor inválido', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const resultado = await editarCartao(modalCorrigirLimite.cartao.id, {
        limite: novoLimiteNumerico
      });

      if (resultado.success) {
        setModalCorrigirLimite({ ativo: false, cartao: null, novoLimite: '', motivo: '' });
        await carregarDados();
        showNotification('Limite atualizado com sucesso!', 'success');
        if (onSave) onSave();
      } else {
        throw new Error(resultado.error);
      }
    } catch (error) {
      console.error('Erro ao corrigir limite:', error);
      showNotification('Erro ao atualizar limite', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [modalCorrigirLimite, editarCartao, carregarDados, onSave, showNotification]);

  // =============================================================================
  // AÇÕES DE ARQUIVAMENTO
  // =============================================================================
  
  const iniciarArquivamento = useCallback((cartao) => {
    setModalArquivar({ ativo: true, cartao, motivo: '' });
  }, []);

  const processarArquivamento = useCallback(async () => {
    if (!modalArquivar.cartao) return;
    
    setSubmitting(true);
    try {
      const resultado = await arquivarCartao(modalArquivar.cartao.id);
      
      if (resultado.success) {
        setModalArquivar({ ativo: false, cartao: null, motivo: '' });
        await carregarDados();
        showNotification('Cartão arquivado com sucesso!', 'success');
        if (onSave) onSave();
      } else {
        throw new Error(resultado.error);
      }
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      showNotification('Erro ao arquivar cartão', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [modalArquivar, arquivarCartao, carregarDados, onSave, showNotification]);

  const iniciarDesarquivamento = useCallback((cartao) => {
    setModalDesarquivar({ ativo: true, cartao });
  }, []);

  const processarDesarquivamento = useCallback(async () => {
    if (!modalDesarquivar.cartao) return;
    
    setSubmitting(true);
    try {
      const resultado = await editarCartao(modalDesarquivar.cartao.id, {
        ativo: true
      });
      
      if (resultado.success) {
        setModalDesarquivar({ ativo: false, cartao: null });
        await carregarDados();
        showNotification('Cartão desarquivado com sucesso!', 'success');
        if (onSave) onSave();
      } else {
        throw new Error(resultado.error);
      }
    } catch (error) {
      console.error('Erro ao desarquivar:', error);
      showNotification('Erro ao desarquivar cartão', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [modalDesarquivar, editarCartao, carregarDados, onSave, showNotification]);

  // =============================================================================
  // RENDER COMPONENTS - ✅ SIMPLIFICADO: Remove referências a contas
  // =============================================================================

  const renderCartao = useCallback((cartao, isArquivado = false) => {
    const limite = cartao.limite || 0;
    
    return (
      <div 
        key={cartao.id} 
        className={`ip_card_item_destaque ${isArquivado ? 'ip_estado_inativo' : ''}`}
        style={{ borderLeftColor: cartao.cor }}
      >
        {/* Ações no canto superior direito */}
        <div className="ip_acoes_item_posicionadas">
          {!isArquivado && cartao.tipo === 'credito' && (
            <button
              type="button"
              className="ip_botao_icone_pequeno_card"
              onClick={() => iniciarCorrecaoLimite(cartao)}
              disabled={submitting}
              title="Ajustar limite"
            >
              <Calculator size={11} />
            </button>
          )}
          
          {!isArquivado && (
            <button
              type="button"
              className="ip_botao_icone_pequeno_card"
              onClick={() => iniciarEdicaoCartao(cartao)}
              disabled={submitting}
              title="Editar cartão"
            >
              <Edit size={11} />
            </button>
          )}
          
          <button
            type="button"
            className={`ip_botao_icone_pequeno_card ${isArquivado ? 'verde' : 'vermelho'}`}
            onClick={() => {
              if (isArquivado) {
                iniciarDesarquivamento(cartao);
              } else {
                iniciarArquivamento(cartao);
              }
            }}
            disabled={submitting}
            title={isArquivado ? "Desarquivar cartão" : "Arquivar cartão"}
          >
            {isArquivado ? <ArchiveRestore size={11} /> : <Archive size={11} />}
          </button>
        </div>

        {/* Header com informações principais */}
        <div className="ip_header_item">
          <div 
            className="ip_icone_item" 
            style={{ backgroundColor: cartao.cor }}
          >
            {tiposCartao.find(t => t.value === cartao.tipo)?.icon || '💳'}
          </div>
          
          <div className="ip_info_item">
            <div className="ip_nome_item">
              {cartao.nome}
              {isArquivado && (
                <span className="ip_badge_amarelo">ARQUIVADO</span>
              )}
            </div>
            
            <div className="ip_tipo_item">
              {tiposCartao.find(t => t.value === cartao.tipo)?.label}
              {cartao.bandeira && ` • ${cartao.bandeira}`}
              {cartao.dia_vencimento && ` • Venc. dia ${cartao.dia_vencimento}`}
              {cartao.dia_fechamento && ` • Fech. dia ${cartao.dia_fechamento}`}
            </div>
            
            <div className="ip_valores_item">
              {cartao.tipo === 'credito' && (
                <div className="ip_valor_neutro">
                  Limite: {formatCurrency(limite)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [tiposCartao, submitting, iniciarCorrecaoLimite, iniciarEdicaoCartao, iniciarArquivamento, iniciarDesarquivamento]);

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================

  if (!isOpen) return null;

  return (
    <>
      {/* MODAL PRINCIPAL - Z-INDEX: 1000 */}
      <div className="ip_modal_fundo" style={{ zIndex: 1000 }}>
        <div className="ip_modal_medio">
          {/* Header */}
          <div className="ip_modal_header ip_header_roxo">
            <div className="ip_flex ip_gap_3">
              <div className="ip_icone_item">
                <CreditCard size={24} />
              </div>
              <div>
                <h2 className="ip_modal_titulo">Gerenciar Cartões</h2>
                <p className="ip_modal_subtitulo">
                  {resumo.totalAtivos} ativo{resumo.totalAtivos !== 1 ? 's' : ''} • 
                  {resumo.totalArquivados > 0 && ` ${resumo.totalArquivados} arquivado${resumo.totalArquivados !== 1 ? 's' : ''} • `}
                  Limite total: {formatCurrency(resumo.limiteTotal)}
                </p>
              </div>
            </div>
            <button className="ip_modal_close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="ip_modal_content">
            {cartoesLoading ? (
              <div className="ip_loading_container">
                <div className="ip_loading_spinner"></div>
                <p className="ip_loading_texto">Carregando cartões...</p>
              </div>
            ) : (
              <>
                {/* Controles superiores */}
                <div className="ip_flex ip_gap_4 ip_mb_4" style={{justifyContent: 'space-between', alignItems: 'center'}}>
                  <button
                    onClick={toggleMostrarArquivados}
                    className={`ip_botao_base ip_botao_pequeno ${mostrarArquivados ? 'ip_botao_roxo_outline' : 'ip_botao_cinza'}`}
                  >
                    {mostrarArquivados ? <EyeOff size={14} /> : <Eye size={14} />}
                    {mostrarArquivados ? 'Ocultar Arquivados' : 'Ver Arquivados'}
                    {resumo.totalArquivados > 0 && (
                      <span className="ip_badge_amarelo">{resumo.totalArquivados}</span>
                    )}
                  </button>
                  
                  <div className="ip_flex ip_gap_2">
                    {!modoFormulario ? (
                      <button
                        onClick={iniciarCriacaoCartao}
                        disabled={submitting}
                        className="ip_botao_base ip_botao_roxo ip_botao_pequeno"
                      >
                        <Plus size={14} />
                        Novo Cartão
                      </button>
                    ) : (
                      <button
                        onClick={resetFormulario}
                        disabled={submitting}
                        className="ip_botao_base ip_botao_cinza ip_botao_pequeno"
                      >
                        <X size={14} />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Formulário de cartão */}
                {modoFormulario && (
                  <div className="ip_card_grande ip_mb_3">
                    <h3 className="ip_header_secundario">
                      {modoFormulario === 'editar' ? 'Editar Cartão' : 'Novo Cartão'}
                    </h3>

                    <form onSubmit={submeterFormulario}>
                      {/* Nome e Limite na mesma linha */}
                      <div className="ip_flex ip_gap_3 ip_mb_3">
                        <div className="ip_grupo_formulario ip_w_100">
                          <label className="ip_label">
                            <CreditCard size={14} />
                            Nome do Cartão *
                          </label>
                          <input
                            ref={nomeInputRef}
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleInputChange}
                            placeholder="Ex: Cartão principal, Empresarial, etc..."
                            disabled={submitting}
                            className={`ip_input_base ${formErrors.nome ? 'ip_input_erro' : ''}`}
                          />
                          {formErrors.nome && <div className="ip_erro_formulario">{formErrors.nome}</div>}
                        </div>

                        <div className="ip_grupo_formulario ip_w_100">
                          <label className="ip_label">
                            <DollarSign size={14} />
                            Limite do Cartão *
                          </label>
                          <input
                            type="text"
                            value={formData.limite}
                            onChange={handleLimiteChange}
                            placeholder="0,00"
                            disabled={submitting}
                            className={`ip_input_base ip_input_dinheiro ip_valor_neutro ${formErrors.limite ? 'ip_input_erro' : ''}`}
                          />
                          {formErrors.limite && <div className="ip_erro_formulario">{formErrors.limite}</div>}
                        </div>
                      </div>

                      {/* Bandeira, Fechamento e Vencimento na mesma linha */}
                      <div className="ip_flex ip_gap_3 ip_mb_3">
                        <div className="ip_grupo_formulario ip_w_100">
                          <label className="ip_label">
                            💳 Bandeira *
                          </label>
                          <select
                            name="bandeira"
                            value={formData.bandeira}
                            onChange={handleInputChange}
                            disabled={submitting}
                            className={`ip_input_base ip_input_select ${formErrors.bandeira ? 'ip_input_erro' : ''}`}
                          >
                            <option value="">Selecione a bandeira</option>
                            {bandeirasPredefinidas.map(bandeira => (
                              <option key={bandeira} value={bandeira}>
                                {bandeira}
                              </option>
                            ))}
                          </select>
                          {formErrors.bandeira && <div className="ip_erro_formulario">{formErrors.bandeira}</div>}
                        </div>

                        <div className="ip_grupo_formulario ip_w_100">
                          <label className="ip_label">
                            🗓️ Fechamento *
                          </label>
                          <select
                            name="fechamento"
                            value={formData.fechamento}
                            onChange={handleInputChange}
                            disabled={submitting}
                            className={`ip_input_base ip_input_select ${formErrors.fechamento ? 'ip_input_erro' : ''}`}
                          >
                            <option value="">Dia do fechamento</option>
                            {diasVencimento.map(dia => (
                              <option key={dia} value={dia}>
                                Dia {dia}
                              </option>
                            ))}
                          </select>
                          {formErrors.fechamento && <div className="ip_erro_formulario">{formErrors.fechamento}</div>}
                        </div>
                        
                        <div className="ip_grupo_formulario ip_w_100">
                          <label className="ip_label">
                            📅 Vencimento *
                          </label>
                          <select
                            name="vencimento"
                            value={formData.vencimento}
                            onChange={handleInputChange}
                            disabled={submitting}
                            className={`ip_input_base ip_input_select ${formErrors.vencimento ? 'ip_input_erro' : ''}`}
                          >
                            <option value="">Dia do vencimento</option>
                            {diasVencimento.map(dia => (
                              <option key={dia} value={dia}>
                                Dia {dia}
                              </option>
                            ))}
                          </select>
                          {formErrors.vencimento && <div className="ip_erro_formulario">{formErrors.vencimento}</div>}
                        </div>
                      </div>

                      {/* Seletor de Cor */}
                      <div className="ip_grupo_formulario ip_mb_3">
                        <label className="ip_label">
                          <Palette size={14} />
                          Cor do Cartão
                        </label>
                        
                        {/* Grid de Cores */}
                        <div className="ip_color_palette">
                          {coresPredefinidas.map((cor) => (
                            <button
                              key={cor}
                              type="button"
                              onClick={() => handleCorChange(cor)}
                              disabled={submitting}
                              className={`ip_color_swatch ${formData.cor === cor ? 'ip_selected' : ''}`}
                              style={{ backgroundColor: cor }}
                              title={cor}
                            >
                              {formData.cor === cor && (
                                <Check size={12} className="ip_color_check" />
                              )}
                            </button>
                          ))}
                        </div>
                        
                        {/* Preview e Input Personalizado */}
                        <div className="ip_color_custom">
                          <div className="ip_color_preview_group">
                            <div 
                              className="ip_color_preview" 
                              style={{ backgroundColor: formData.cor }}
                            />
                            <div>
                              <span className="ip_color_code">{formData.cor}</span>
                              <p className="ip_color_hint">Cor selecionada</p>
                            </div>
                          </div>
                          
                          <div className="ip_color_custom_section">
                            <label className="ip_color_custom_label">
                              Criar cor personalizada
                            </label>
                            <input
                              type="color"
                              value={formData.cor}
                              onChange={(e) => handleCorChange(e.target.value)}
                              disabled={submitting}
                              className="ip_color_input"
                              title="Clique para escolher uma cor personalizada"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ações do formulário */}
                      <div className="ip_flex ip_gap_3">
                        <button
                          type="button"
                          onClick={resetFormulario}
                          disabled={submitting}
                          className="ip_botao_base ip_botao_cinza"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="ip_botao_base ip_botao_roxo"
                        >
                          {submitting ? (
                            <>
                              <span className="ip_loading_spinner_pequeno"></span>
                              Salvando...
                            </>
                          ) : (
                            <>
                              {modoFormulario === 'editar' ? <Edit size={14} /> : <Plus size={14} />}
                              {modoFormulario === 'editar' ? 'Atualizar Cartão' : 'Criar Cartão'}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Lista de Cartões Ativos */}
                {!modoFormulario && cartoes.length > 0 && (
                  <div className="ip_mb_3">
                    <h3 className="ip_header_secundario">Cartões Ativos ({cartoes.length})</h3>
                    <div className="ip_grid_responsivo_cards">
                      {cartoes.map(cartao => renderCartao(cartao, false))}
                    </div>
                  </div>
                )}

                {/* Lista de Cartões Arquivados */}
                {!modoFormulario && mostrarArquivados && cartoesArquivados.length > 0 && (
                  <div className="ip_mb_3">
                    <h3 className="ip_header_secundario">Cartões Arquivados ({cartoesArquivados.length})</h3>
                    <div className="ip_grid_responsivo_cards">
                      {cartoesArquivados.map(cartao => renderCartao(cartao, true))}
                    </div>
                  </div>
                )}

                {/* Estado vazio */}
                {!modoFormulario && cartoes.length === 0 && !cartoesLoading && (
                  <div className="ip_estado_vazio">
                    <CreditCard size={48} className="ip_estado_vazio_icone" />
                    <h3 className="ip_estado_vazio_titulo">
                      {cartoesArquivados.length > 0 ? 
                        'Todos os cartões estão arquivados' : 
                        'Nenhum cartão cadastrado'
                      }
                    </h3>
                    <p className="ip_estado_vazio_descricao">
                      {cartoesArquivados.length > 0 ? 
                        'Use o botão "Ver Arquivados" para visualizar seus cartões arquivados' :
                        'Crie seu primeiro cartão para começar a gerenciar suas faturas'
                      }
                    </p>
                    <button
                      onClick={iniciarCriacaoCartao}
                      className="ip_botao_base ip_botao_roxo"
                    >
                      <Plus size={16} />
                      Criar Primeiro Cartão
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAIS ANINHADOS - Z-INDEX: 1100 */}

      {/* Modal de Correção de Limite */}
      {modalCorrigirLimite.ativo && (
        <div className="ip_modal_fundo" style={{ zIndex: 1100 }}>
          <div className="ip_modal_pequeno">
            <div className="ip_modal_header ip_header_roxo">
              <div className="ip_flex ip_gap_3">
                <div className="ip_icone_item">
                  <Calculator size={18} />
                </div>
                <div>
                  <h2 className="ip_modal_titulo">Ajustar Limite do Cartão</h2>
                  <p className="ip_modal_subtitulo">Altere o limite conforme necessário</p>
                </div>
              </div>
              <button 
                className="ip_modal_close" 
                onClick={() => setModalCorrigirLimite({ ativo: false, cartao: null, novoLimite: '', motivo: '' })}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="ip_modal_content">
              <div className="ip_card_pequeno ip_mb_3">
                <h4>{modalCorrigirLimite.cartao?.nome}</h4>
                <div className="ip_flex ip_gap_4">
                  <div>Tipo: <strong>{tiposCartao.find(t => t.value === modalCorrigirLimite.cartao?.tipo)?.label}</strong></div>
                  <div>Limite atual: <strong>{formatCurrency(modalCorrigirLimite.cartao?.limite || 0)}</strong></div>
                </div>
              </div>
              
              <div className="ip_grupo_formulario ip_mb_3">
                <label className="ip_label">Novo limite desejado:</label>
                <input
                  type="text"
                  value={modalCorrigirLimite.novoLimite}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,-]/g, '');
                    setModalCorrigirLimite(prev => ({ ...prev, novoLimite: valor }));
                  }}
                  placeholder="0,00"
                  className="ip_input_base ip_input_dinheiro"
                />
              </div>

              <div className="ip_grupo_formulario ip_mb_3">
                <label className="ip_label">
                  Motivo da alteração (opcional)
                </label>
                <input
                  type="text"
                  value={modalCorrigirLimite.motivo}
                  onChange={(e) => setModalCorrigirLimite(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ex: Aumento de renda, necessidade temporária"
                  className="ip_input_base"
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="ip_modal_footer">
              <button 
                onClick={() => setModalCorrigirLimite({ ativo: false, cartao: null, novoLimite: '', motivo: '' })}
                className="ip_botao_base ip_botao_cinza"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                onClick={processarCorrecaoLimite}
                disabled={submitting || !modalCorrigirLimite.novoLimite}
                className="ip_botao_base ip_botao_roxo"
              >
                {submitting ? (
                  <>
                    <span className="ip_loading_spinner_pequeno"></span>
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Calculator size={14} />
                    Atualizar Limite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Arquivamento */}
      {modalArquivar.ativo && (
        <div className="ip_modal_fundo" style={{ zIndex: 1100 }}>
          <div className="ip_modal_pequeno">
            <div className="ip_modal_header ip_header_vermelho">
              <div className="ip_flex ip_gap_3">
                <div className="ip_icone_item">
                  <Archive size={18} />
                </div>
                <div>
                  <h2 className="ip_modal_titulo">Arquivar Cartão</h2>
                  <p className="ip_modal_subtitulo">Esta ação pode ser desfeita</p>
                </div>
              </div>
              <button 
                className="ip_modal_close" 
                onClick={() => setModalArquivar({ ativo: false, cartao: null, motivo: '' })}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="ip_modal_content">
              <div className="ip_mensagem_feedback aviso ip_mb_3">
                <Archive size={16} />
                <div>
                  <strong>{modalArquivar.cartao?.nome}</strong>
                  <p>
                    Você está arquivando este cartão. Ele não aparecerá mais na lista principal, 
                    mas as faturas e transações continuarão visíveis nos relatórios.
                    {modalArquivar.cartao?.tipo === 'credito' && (
                      <> O limite de <strong>{formatCurrency(modalArquivar.cartao?.limite || 0)}</strong> não será mais contabilizado.</>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="ip_grupo_formulario ip_mb_3">
                <label className="ip_label">
                  Motivo do arquivamento (opcional)
                </label>
                <input
                  type="text"
                  value={modalArquivar.motivo}
                  onChange={(e) => setModalArquivar(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ex: Cartão cancelado, não utilizo mais"
                  className="ip_input_base"
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="ip_modal_footer">
              <button 
                onClick={() => setModalArquivar({ ativo: false, cartao: null, motivo: '' })}
                className="ip_botao_base ip_botao_cinza"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                onClick={processarArquivamento}
                disabled={submitting}
                className="ip_botao_base ip_botao_vermelho"
              >
                {submitting ? (
                  <>
                    <span className="ip_loading_spinner_pequeno"></span>
                    Arquivando...
                  </>
                ) : (
                  <>
                    <Archive size={14} />
                    Arquivar Cartão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Desarquivamento */}
      {modalDesarquivar.ativo && (
        <div className="ip_modal_fundo" style={{ zIndex: 1100 }}>
          <div className="ip_modal_pequeno">
            <div className="ip_modal_header ip_header_verde">
              <div className="ip_flex ip_gap_3">
                <div className="ip_icone_item">
                  <ArchiveRestore size={18} />
                </div>
                <div>
                  <h2 className="ip_modal_titulo">Desarquivar Cartão</h2>
                  <p className="ip_modal_subtitulo">Reativar cartão arquivado</p>
                </div>
              </div>
              <button 
                className="ip_modal_close" 
                onClick={() => setModalDesarquivar({ ativo: false, cartao: null })}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="ip_modal_content">
              <div className="ip_mensagem_feedback sucesso ip_mb_3">
                <ArchiveRestore size={16} />
                <div>
                  <strong>{modalDesarquivar.cartao?.nome}</strong>
                  <p>
                    Este cartão será reativado e voltará a aparecer na lista principal.
                    {modalDesarquivar.cartao?.tipo === 'credito' && (
                      <> O limite de <strong>{formatCurrency(modalDesarquivar.cartao?.limite || 0)}</strong> será incluído nos cálculos novamente.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="ip_modal_footer">
              <button 
                onClick={() => setModalDesarquivar({ ativo: false, cartao: null })}
                className="ip_botao_base ip_botao_cinza"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                onClick={processarDesarquivamento}
                disabled={submitting}
                className="ip_botao_base ip_botao_verde"
              >
                {submitting ? (
                  <>
                    <span className="ip_loading_spinner_pequeno"></span>
                    Desarquivando...
                  </>
                ) : (
                  <>
                    <ArchiveRestore size={14} />
                    Desarquivar Cartão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

CartoesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default React.memo(CartoesModal);