// src/components/ReceitasModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import ModalWrapper from './ui/ModalWrapper';
import InputMoney from './ui/InputMoney';
import useCategorias from '../hooks/useCategorias';
import useContas from '../hooks/useContas';

/**
 * Modal para lançamento de receitas
 * Permite registrar uma nova receita associada a categoria, subcategoria e conta
 */
const ReceitasModal = ({ isOpen, onClose }) => {
  // Referência para o primeiro campo do formulário (autofoco)
  const dataInputRef = useRef(null);
  
  // Hooks para obter categorias e contas
  const { categorias } = useCategorias();
  const { contas } = useContas();
  
  // Filtrar apenas categorias do tipo "receita"
  const categoriasReceita = categorias.filter(cat => cat.tipo === 'receita');
  
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    data: formatarDataAtual(),
    descricao: '',
    categoria: '',
    subcategoria: '',
    contaDeposito: '',
    valor: 0,
    observacoes: ''
  });

  // Estado para controlar erros de validação
  const [errors, setErrors] = useState({});
  
  // Estado para exibir mensagem de sucesso
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  
  // Obter subcategorias com base na categoria selecionada
  const subcategoriasFiltradas = formData.categoria 
    ? categoriasReceita.find(cat => cat.id === formData.categoria)?.subcategorias || []
    : [];
  
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
    
    // Se a categoria mudou, resetar a subcategoria
    if (name === 'categoria') {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
        subcategoria: '' // Reseta a subcategoria
      }));
    } else {
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
  
  // Handler específico para o campo de valor
  const handleValorChange = (value) => {
    setFormData(prevData => ({
      ...prevData,
      valor: value
    }));
    
    // Limpa o erro se existir
    if (errors.valor) {
      setErrors(prev => ({
        ...prev,
        valor: null
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
    if (!formData.data) newErrors.data = "Data é obrigatória";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.categoria) newErrors.categoria = "Categoria é obrigatória";
    if (!formData.subcategoria) newErrors.subcategoria = "Subcategoria é obrigatória";
    if (!formData.contaDeposito) newErrors.contaDeposito = "Conta é obrigatória";
    if (!formData.valor || formData.valor === 0) newErrors.valor = "Valor é obrigatório";
    
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
      // Mock da função addReceita
      console.log("Dados enviados:", formData);
      
      // Exibe o feedback de sucesso
      setFeedback({
        visible: true,
        message: 'Receita registrada com sucesso!',
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
      data: formatarDataAtual(),
      descricao: '',
      categoria: '',
      subcategoria: '',
      contaDeposito: '',
      valor: 0,
      observacoes: ''
    });
    setErrors({});
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

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Lançamento de Receitas"
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
            {/* Campo Data */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="data">Data:</label>
              </td>
              <td style={tdInputStyle}>
                <input
                  ref={dataInputRef}
                  type="date"
                  id="data"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                  style={inputStyle(errors.data)}
                />
                {errors.data && <p style={errorStyle}>{errors.data}</p>}
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
                  placeholder="Ex: Pagamento projeto XPTO"
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
                  {categoriasReceita.map(categoria => (
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
            
            {/* Campo Conta Depósito (em vez de Conta Débito) */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="contaDeposito">Conta Depósito:</label>
              </td>
              <td style={tdInputStyle}>
                <select
                  id="contaDeposito"
                  name="contaDeposito"
                  value={formData.contaDeposito}
                  onChange={handleChange}
                  style={inputStyle(errors.contaDeposito)}
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
                {errors.contaDeposito && <p style={errorStyle}>{errors.contaDeposito}</p>}
              </td>
            </tr>
            
            {/* Campo Valor */}
            <tr style={trStyle}>
              <td style={tdLabelStyle}>
                <label htmlFor="valor">Valor:</label>
              </td>
              <td style={tdInputStyle}>
                <InputMoney
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  style={inputStyle(errors.valor)}
                />
                {errors.valor && <p style={errorStyle}>{errors.valor}</p>}
              </td>
            </tr>
            
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
                  placeholder="Adicione informações extras sobre esta receita"
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

export default ReceitasModal;