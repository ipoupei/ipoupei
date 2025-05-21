// src/components/DespesasCartaoModal.jsx - Versão ajustada (sem campo de conta para pagamento)
import React, { useState, useEffect, useRef } from 'react';
import ModalWrapper from './ui/ModalWrapper';
import InputMoney from './ui/InputMoney';
import Tooltip from './ui/ToolTip';
import PreviewParcelamento from './PreviewParcelamento';
import useCategorias from '../hooks/useCategorias';
import useCartoes from '../hooks/useCartoes';
import { Info } from 'lucide-react';

/**
 * Modal para lançamento de despesas com cartão de crédito
 * Permite registrar uma nova despesa associada a cartão com parcelamento
 */
const DespesasCartaoModal = ({ isOpen, onClose }) => {
  // Referência para o primeiro campo do formulário (autofoco)
  const dataInputRef = useRef(null);
  
  // Hooks para obter categorias e cartões
  const { categorias } = useCategorias();
  const { cartoes } = useCartoes();
  
  // Filtrar apenas categorias do tipo "despesa"
  const categoriasDespesa = categorias.filter(cat => cat.tipo === 'despesa');
  
  // Filtrar apenas cartões ativos
  const cartoesAtivos = cartoes.filter(cartao => cartao.ativo);
  
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    dataCompra: formatarDataAtual(),
    descricao: '',
    categoria: '',
    subcategoria: '',
    cartaoId: '',
    valorTotal: 0,
    numeroParcelas: 1,
    observacoes: ''
  });

  // Estado para controlar erros de validação
  const [errors, setErrors] = useState({});
  
  // Estado para exibir mensagem de sucesso
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  
  // Estado para armazenar o cartão selecionado
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null);
  
  // Obter subcategorias com base na categoria selecionada
  const subcategoriasFiltradas = formData.categoria 
    ? categoriasDespesa.find(cat => cat.id === formData.categoria)?.subcategorias || []
    : [];
  
  // Opções de parcelamento
  const opcoesParcelamento = Array.from({ length: 24 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}x${i === 0 ? ' à vista' : ''}`
  }));
  
  // Calcula o valor da parcela (com precisão monetária)
  const valorParcela = formData.valorTotal > 0 && formData.numeroParcelas > 0
    ? formData.valorTotal / formData.numeroParcelas
    : 0;
  
  // Efeito para autofoco no primeiro campo quando o modal abre
  useEffect(() => {
    if (isOpen && dataInputRef.current) {
      setTimeout(() => {
        dataInputRef.current.focus();
      }, 100);
    }
    
    // Resetar o formulário quando o modal é aberto
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  // Atualiza o cartão selecionado quando o ID muda
  useEffect(() => {
    if (formData.cartaoId) {
      const cartao = cartoes.find(c => c.id === formData.cartaoId);
      setCartaoSelecionado(cartao);
    } else {
      setCartaoSelecionado(null);
    }
  }, [formData.cartaoId, cartoes]);
  
  // Função para obter a data atual no formato yyyy-MM-dd (para input date)
  function formatarDataAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // Handler para mudanças nos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Lógica especial para campos específicos
    if (name === 'categoria') {
      // Se a categoria mudou, resetar a subcategoria
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
        subcategoria: '' // Reseta a subcategoria
      }));
    } else if (name === 'numeroParcelas') {
      // Garantir que o número de parcelas seja pelo menos 1
      const parcelas = Math.max(1, parseInt(value) || 1);
      setFormData(prevData => ({
        ...prevData,
        [name]: parcelas
      }));
    } else {
      // Comportamento padrão para outros campos
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
    
    // Limpa o erro deste campo se existir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handler específico para o campo de valor total
  const handleValorTotalChange = (value) => {
    setFormData(prevData => ({
      ...prevData,
      valorTotal: value
    }));
    
    // Limpa o erro se existir
    if (errors.valorTotal) {
      setErrors(prev => ({
        ...prev,
        valorTotal: null
      }));
    }
  };
  
  // Handler para controlar o contador de caracteres nas observações
  const handleObservacoesChange = (e) => {
    const { value } = e.target;
    
    // Limita a 300 caracteres
    if (value.length <= 300) {
      setFormData(prevData => ({
        ...prevData,
        observacoes: value
      }));
      
      // Limpa o erro se existir
      if (errors.observacoes) {
        setErrors(prev => ({
          ...prev,
          observacoes: null
        }));
      }
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};
    
    // Validação dos campos obrigatórios
    if (!formData.dataCompra) newErrors.dataCompra = "Data é obrigatória";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.categoria) newErrors.categoria = "Categoria é obrigatória";
    if (!formData.subcategoria) newErrors.subcategoria = "Subcategoria é obrigatória";
    if (!formData.cartaoId) newErrors.cartaoId = "Cartão é obrigatório";
    if (!formData.valorTotal || formData.valorTotal === 0) newErrors.valorTotal = "Valor é obrigatório";
    
    // Validações específicas para parcelamento
    if (formData.numeroParcelas < 1) {
      newErrors.numeroParcelas = "Número de parcelas deve ser pelo menos 1";
    }
    
    if (formData.numeroParcelas > 1 && formData.valorTotal < 10) {
      newErrors.numeroParcelas = "Para parcelar, valor mínimo deve ser R$ 10,00";
    }
    
    // Verifica se o cartão está ativo
    const cartao = cartoes.find(c => c.id === formData.cartaoId);
    if (cartao && !cartao.ativo) {
      newErrors.cartaoId = "Este cartão está inativo";
    }
    
    // Limite de caracteres para observações
    if (formData.observacoes.length > 300) {
      newErrors.observacoes = "Máximo de 300 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Calcula o valor de cada parcela (com precisão monetária)
      const valorParcela = formData.valorTotal / formData.numeroParcelas;
      
      // Constrói o objeto de despesa com cartão
      const despesaCartao = {
        ...formData,
        valorParcela,
        dataRegistro: new Date().toISOString(),
        status: 'aberto'
      };
      
      // Mock da função addDespesaCartao
      console.log("Dados enviados:", despesaCartao);
      
      // Exibe o feedback de sucesso
      setFeedback({
        visible: true,
        message: 'Despesa de cartão registrada com sucesso!',
        type: 'success'
      });
      
      // Limpa o formulário e fecha o feedback após 3 segundos
      setTimeout(() => {
        setFeedback({ visible: false, message: '', type: '' });
        resetForm();
        onClose();
      }, 3000);
    }
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setFormData({
      dataCompra: formatarDataAtual(),
      descricao: '',
      categoria: '',
      subcategoria: '',
      cartaoId: '',
      valorTotal: 0,
      numeroParcelas: 1,
      observacoes: ''
    });
    setErrors({});
    setCartaoSelecionado(null);
  };

  // Estilo para a tabela de formulário
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  // Estilo para cada linha da tabela
  const trStyle = {
    verticalAlign: 'top'
  };

  // Estilo para células da label (primeira coluna)
  const tdLabelStyle = {
    paddingBottom: '15px',
    paddingRight: '10px',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    width: '1%', // Faz com que a coluna tenha a largura mínima necessária
    fontSize: '14px',
    color: '#4a5568'
  };

  // Estilo para células do input (segunda coluna)
  const tdInputStyle = {
    paddingBottom: '15px',
    width: '99%' // Faz com que a coluna ocupe o resto do espaço
  };

  // Estilo para inputs
  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '6px 10px',
    border: `1px solid ${hasError ? '#e53e3e' : '#d1d5db'}`,
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  });

  // Estilo para mensagens de erro
  const errorStyle = {
    color: '#e53e3e',
    fontSize: '12px',
    marginTop: '2px'
  };

  // Estilo para o contador de caracteres
  const charCountStyle = {
    textAlign: 'right',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  };

  // Estilo para os textos opcionais
  const optionalTextStyle = {
    fontSize: '12px',
    color: '#718096'
  };

  // Estilo para o botão de informação
  const infoButtonStyle = {
    marginLeft: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'help',
    color: '#718096',
    position: 'relative', // Garante que o z-index funcione corretamente
    zIndex: 5 // Valor mais alto que o padrão
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Lançamento de Despesa com Cartão de Crédito"
    >
      {feedback.visible && (
        <div style={{
          padding: '10px 12px',
          marginBottom: '16px',
          borderRadius: '4px',
          backgroundColor: feedback.type === 'success' ? '#e6fffa' : '#fff5f5',
          color: feedback.type === 'success' ? '#2c7a7b' : '#c53030',
          border: `1px solid ${feedback.type === 'success' ? '#b2f5ea' : '#feb2b2'}`,
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ marginRight: '8px' }}>
            {feedback.type === 'success' ? '✅' : '❌'}
          </span>
          {feedback.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <table style={tableStyle}>
          <tbody>
            {/* Campo Data da Compra */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="dataCompra">Data da Compra:</label>
              </td>
              <td style={tdInputStyle}>
                <input
                  ref={dataInputRef}
                  type="date"
                  id="dataCompra"
                  name="dataCompra"
                  value={formData.dataCompra}
                  onChange={handleChange}
                  style={inputStyle(errors.dataCompra)}
                />
                {errors.dataCompra && <p style={errorStyle}>{errors.dataCompra}</p>}
              </td>
            </tr>
            
            {/* Campo Descrição */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="descricao">Descrição:</label>
              </td>
              <td style={tdInputStyle}>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  placeholder="Ex: Compra na Amazon"
                  value={formData.descricao}
                  onChange={handleChange}
                  style={inputStyle(errors.descricao)}
                />
                {errors.descricao && <p style={errorStyle}>{errors.descricao}</p>}
              </td>
            </tr>
            
            {/* Campo Categoria */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="categoria">Categoria:</label>
              </td>
              <td style={tdInputStyle}>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  style={inputStyle(errors.categoria)}
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriasDespesa.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
                {errors.categoria && <p style={errorStyle}>{errors.categoria}</p>}
              </td>
            </tr>
            
            {/* Campo Subcategoria */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="subcategoria">Subcategoria:</label>
              </td>
              <td style={tdInputStyle}>
                <select
                  id="subcategoria"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  disabled={!formData.categoria}
                  style={{
                    ...inputStyle(errors.subcategoria),
                    backgroundColor: !formData.categoria ? '#f9fafb' : 'white'
                  }}
                >
                  <option value="">Selecione uma subcategoria</option>
                  {subcategoriasFiltradas.map(subcategoria => (
                    <option key={subcategoria.id} value={subcategoria.id}>
                      {subcategoria.nome}
                    </option>
                  ))}
                </select>
                {errors.subcategoria && <p style={errorStyle}>{errors.subcategoria}</p>}
              </td>
            </tr>
            
            {/* Campo Cartão de Crédito */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="cartaoId">Cartão de Crédito:</label>
              </td>
              <td style={tdInputStyle}>
                <select
                  id="cartaoId"
                  name="cartaoId"
                  value={formData.cartaoId}
                  onChange={handleChange}
                  style={inputStyle(errors.cartaoId)}
                >
                  <option value="">Selecione um cartão</option>
                  {cartoes.map(cartao => (
                    <option 
                      key={cartao.id} 
                      value={cartao.id}
                      disabled={!cartao.ativo}
                    >
                      {cartao.nome} {!cartao.ativo ? '(Inativo)' : ''}
                    </option>
                  ))}
                </select>
                {errors.cartaoId && <p style={errorStyle}>{errors.cartaoId}</p>}
              </td>
            </tr>
            
            {/* Campo Valor Total */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="valorTotal">Valor Total:</label>
              </td>
              <td style={tdInputStyle}>
                <InputMoney
                  id="valorTotal"
                  name="valorTotal"
                  value={formData.valorTotal}
                  onChange={handleValorTotalChange}
                  placeholder="R$ 0,00"
                  style={inputStyle(errors.valorTotal)}
                />
                {errors.valorTotal && <p style={errorStyle}>{errors.valorTotal}</p>}
              </td>
            </tr>
            
            {/* Campo Número de Parcelas */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="numeroParcelas">
                  Parcelas:
                  <Tooltip
                    content="Número de parcelas que esta compra será dividida. Impacta em faturas futuras."
                    position="right"
                  >
                    <span style={infoButtonStyle}>
                      <Info size={14} />
                    </span>
                  </Tooltip>
                </label>
              </td>
              <td style={tdInputStyle}>
                <select
                  id="numeroParcelas"
                  name="numeroParcelas"
                  value={formData.numeroParcelas}
                  onChange={handleChange}
                  style={inputStyle(errors.numeroParcelas)}
                >
                  {opcoesParcelamento.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
                {errors.numeroParcelas && <p style={errorStyle}>{errors.numeroParcelas}</p>}
              </td>
            </tr>
            
            {/* Preview do Parcelamento */}
            {formData.valorTotal > 0 && formData.cartaoId && (
              <tr style={trStyle}>
                <td style={tdLabelStyle}></td>
                <td style={tdInputStyle}>
                  <PreviewParcelamento
                    valorTotal={formData.valorTotal}
                    numeroParcelas={formData.numeroParcelas}
                    dataCompra={formData.dataCompra}
                    diaFechamento={cartaoSelecionado?.diaFechamento || 1}
                    diaVencimento={cartaoSelecionado?.diaVencimento || 10}
                  />
                </td>
              </tr>
            )}
            
            {/* Campo Observações */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="observacoes">Observações:</label>
              </td>
              <td style={tdInputStyle}>
                <div style={optionalTextStyle}>(opcional, máx. 300 caracteres)</div>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleObservacoesChange}
                  placeholder="Adicione informações extras sobre esta compra"
                  rows="3"
                  style={{
                    ...inputStyle(errors.observacoes),
                    resize: 'vertical'
                  }}
                ></textarea>
                <div style={charCountStyle}>
                  {formData.observacoes.length}/300
                </div>
                {errors.observacoes && <p style={errorStyle}>{errors.observacoes}</p>}
              </td>
            </tr>
          </tbody>
        </table>
        
        {/* Botões de ação */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '20px',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Salvar
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default DespesasCartaoModal;