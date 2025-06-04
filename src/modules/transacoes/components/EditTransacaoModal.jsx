import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  X, Save, Trash2, ArrowUp, 
  ArrowDown, CreditCard, Wallet, 
  CalendarIcon, ClockIcon, TextIcon,
  TagIcon, BanknoteIcon, ClipboardIcon
} from 'lucide-react';
import { supabase } from '@lib/supabaseClient';

const EditTransacaoModal = ({ 
  transacao, 
  isOpen, 
  onClose, 
  onSave,
  contas = [],
  categorias = [],
  cartoes = []
}) => {
  // Estado para os dados da transação
  const [formData, setFormData] = useState({
    descricao: '',
    tipo: 'despesa',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    conta_id: '',
    cartao_id: '',
    categoria_id: '',
    subcategoria_id: '',
    efetivada: false,
    observacao: '',
    recorrente: false,
    fatura_vencimento: null
  });
  
  // Estado para subcategorias disponíveis
  const [subcategorias, setSubcategorias] = useState([]);
  
  // Estado de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Carregar dados da transação quando o modal abrir
  useEffect(() => {
    if (transacao) {
      setFormData({
        id: transacao.id,
        descricao: transacao.descricao || '',
        tipo: transacao.tipo || 'despesa',
        valor: transacao.valor || 0,
        data: transacao.data ? (
          typeof transacao.data === 'string' 
            ? transacao.data.split('T')[0] 
            : format(transacao.data, 'yyyy-MM-dd')
        ) : new Date().toISOString().split('T')[0],
        conta_id: transacao.conta_id || '',
        cartao_id: transacao.cartao_id || '',
        categoria_id: transacao.categoria_id || '',
        subcategoria_id: transacao.subcategoria_id || '',
        efetivada: transacao.efetivada || false,
        observacao: transacao.observacao || '',
        recorrente: transacao.recorrente || false,
        fatura_vencimento: transacao.fatura_vencimento 
          ? (typeof transacao.fatura_vencimento === 'string'
              ? transacao.fatura_vencimento.split('T')[0]
              : format(transacao.fatura_vencimento, 'yyyy-MM-dd')
            )
          : null
      });
    }
  }, [transacao]);
  
  // Atualizar subcategorias quando a categoria mudar
  useEffect(() => {
    if (formData.categoria_id) {
      const categoria = categorias.find(cat => cat.id === formData.categoria_id);
      setSubcategorias(categoria?.subcategorias || []);
      
      // Se a subcategoria atual não pertencer à categoria selecionada, limpar
      if (categoria?.subcategorias) {
        const subcategoriaExiste = categoria.subcategorias.some(
          sub => sub.id === formData.subcategoria_id
        );
        
        if (!subcategoriaExiste) {
          setFormData(prev => ({ ...prev, subcategoria_id: '' }));
        }
      }
    } else {
      setSubcategorias([]);
      setFormData(prev => ({ ...prev, subcategoria_id: '' }));
    }
  }, [formData.categoria_id, categorias]);
  
  // Quando o tipo de transação mudar, filtre categorias compatíveis
  useEffect(() => {
    if (formData.tipo !== 'transferencia') {
      // Se a categoria atual não for do tipo selecionado, limpar
      const categoriaAtual = categorias.find(cat => cat.id === formData.categoria_id);
      
      if (categoriaAtual && categoriaAtual.tipo !== formData.tipo) {
        setFormData(prev => ({ 
          ...prev, 
          categoria_id: '', 
          subcategoria_id: '' 
        }));
      }
    } else {
      // Se for transferência, limpar categoria
      setFormData(prev => ({ 
        ...prev, 
        categoria_id: '', 
        subcategoria_id: '' 
      }));
    }
  }, [formData.tipo, formData.categoria_id, categorias]);
  
  // Função para atualizar o formulário
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Função para atualizar o tipo de transação
  const handleTipoChange = (novoTipo) => {
    setFormData(prev => ({
      ...prev,
      tipo: novoTipo,
      // Se mudar para transferência, limpar campos incompatíveis
      ...(novoTipo === 'transferencia' 
        ? { categoria_id: '', subcategoria_id: '', cartao_id: '' } 
        : {}),
      // Se mudar para receita ou despesa de transferência, limpar campos específicos
      ...(prev.tipo === 'transferencia' && novoTipo !== 'transferencia'
        ? { conta_destino_id: '' }
        : {})
    }));
  };
  
  // Função para salvar a transação
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validações básicas
      if (!formData.descricao.trim()) {
        throw new Error('A descrição é obrigatória');
      }
      
      if (formData.valor <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }
      
      if (!formData.data) {
        throw new Error('A data é obrigatória');
      }
      
      if (formData.tipo !== 'transferencia' && !formData.categoria_id) {
        throw new Error('A categoria é obrigatória');
      }
      
      if (!formData.conta_id && !formData.cartao_id) {
        throw new Error('Selecione uma conta ou cartão');
      }
      
      // Preparar dados para envio
      const dadosTransacao = {
        descricao: formData.descricao.trim(),
        tipo: formData.tipo,
        valor: Number(formData.valor),
        data: formData.data,
        conta_id: formData.conta_id || null,
        cartao_id: formData.cartao_id || null,
        categoria_id: formData.categoria_id || null,
        subcategoria_id: formData.subcategoria_id || null,
        efetivada: formData.efetivada,
        observacao: formData.observacao?.trim() || null,
        recorrente: formData.recorrente,
        fatura_vencimento: formData.cartao_id ? formData.fatura_vencimento : null,
        updated_at: new Date().toISOString()
      };
      
      // Atualizar a transação no banco de dados
      const { data, error } = await supabase
        .from('transacoes')
        .update(dadosTransacao)
        .eq('id', formData.id)
        .select();
      
      if (error) throw error;
      
      setSuccess('Transação atualizada com sucesso!');
      
      // Aguardar um momento para mostrar a mensagem de sucesso antes de fechar
      setTimeout(() => {
        onSave(data[0]);
      }, 1000);
      
    } catch (err) {
      console.error('Erro ao atualizar transação:', err);
      setError(err.message || 'Erro ao salvar a transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para excluir a transação
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', formData.id);
      
      if (error) throw error;
      
      setSuccess('Transação excluída com sucesso!');
      
      // Aguardar um momento para mostrar a mensagem de sucesso antes de fechar
      setTimeout(() => {
        onSave(); // Sem parâmetros para indicar exclusão
      }, 1000);
      
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
      setError(err.message || 'Erro ao excluir a transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizar categorias filtradas por tipo
  const filteredCategorias = categorias.filter(
    cat => formData.tipo === 'transferencia' || cat.tipo === formData.tipo
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container edit-transacao-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {formData.tipo === 'receita' && <ArrowUp className="title-icon receita" />}
            {formData.tipo === 'despesa' && <ArrowDown className="title-icon despesa" />}
            {formData.tipo === 'transferencia' && <ArrowDown className="title-icon transferencia" />}
            Editar Transação
          </h2>
          
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-content">
          {error && (
            <div className="feedback-message feedback-message--error">
              {error}
            </div>
          )}
          
          {success && (
            <div className="feedback-message feedback-message--success">
              {success}
            </div>
          )}
          
          <div className="tipo-selector">
            <button
              type="button"
              className={`tipo-button ${formData.tipo === 'receita' ? 'active receita' : ''}`}
              onClick={() => handleTipoChange('receita')}
            >
              <ArrowUp className="button-icon" />
              Receita
            </button>
            
            <button
              type="button"
              className={`tipo-button ${formData.tipo === 'despesa' ? 'active despesa' : ''}`}
              onClick={() => handleTipoChange('despesa')}
            >
              <ArrowDown className="button-icon" />
              Despesa
            </button>
            
            <button
              type="button"
              className={`tipo-button ${formData.tipo === 'transferencia' ? 'active transferencia' : ''}`}
              onClick={() => handleTipoChange('transferencia')}
            >
              <ArrowDown className="button-icon" />
              Transferência
            </button>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <TextIcon className="label-icon" />
              Descrição
            </label>
            <input
              type="text"
              name="descricao"
              className="form-input"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Ex: Salário, Mercado, Conta de luz..."
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <BanknoteIcon className="label-icon" />
                Valor
              </label>
              <div className="valor-input-container">
                <span className="currency-symbol">R$</span>
                <input
                  type="number"
                  name="valor"
                  className="form-input valor-input"
                  value={formData.valor}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <CalendarIcon className="label-icon" />
                Data
              </label>
              <input
                type="date"
                name="data"
                className="form-input"
                value={formData.data}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            {formData.tipo !== 'transferencia' && (
              <div className="form-group">
                <label className="form-label">
                  <TagIcon className="label-icon" />
                  Categoria
                </label>
                <select
                  name="categoria_id"
                  className="form-input"
                  value={formData.categoria_id}
                  onChange={handleChange}
                  required={formData.tipo !== 'transferencia'}
                >
                  <option value="">Selecione uma categoria</option>
                  {filteredCategorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {formData.tipo !== 'transferencia' && formData.categoria_id && (
              <div className="form-group">
                <label className="form-label">
                  <TagIcon className="label-icon" />
                  Subcategoria
                </label>
                <select
                  name="subcategoria_id"
                  className="form-input"
                  value={formData.subcategoria_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione uma subcategoria</option>
                  {subcategorias.map(subcategoria => (
                    <option key={subcategoria.id} value={subcategoria.id}>
                      {subcategoria.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {formData.tipo === 'transferencia' && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    <Wallet className="label-icon" />
                    Conta de Origem
                  </label>
                  <select
                    name="conta_id"
                    className="form-input"
                    value={formData.conta_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione uma conta</option>
                    {contas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <Wallet className="label-icon" />
                    Conta de Destino
                  </label>
                  <select
                    name="conta_destino_id"
                    className="form-input"
                    value={formData.conta_destino_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione uma conta</option>
                    {contas
                      .filter(conta => conta.id !== formData.conta_id)
                      .map(conta => (
                        <option key={conta.id} value={conta.id}>
                          {conta.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}
          </div>
          
          {formData.tipo !== 'transferencia' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Wallet className="label-icon" />
                  Conta
                </label>
                <select
                  name="conta_id"
                  className="form-input"
                  value={formData.conta_id}
                  onChange={(e) => {
                    // Limpar cartão se selecionar conta
                    if (e.target.value) {
                      setFormData(prev => ({
                        ...prev,
                        conta_id: e.target.value,
                        cartao_id: '',
                        fatura_vencimento: null
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        conta_id: ''
                      }));
                    }
                  }}
                  disabled={formData.cartao_id}
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <CreditCard className="label-icon" />
                  Cartão
                </label>
                <select
                  name="cartao_id"
                  className="form-input"
                  value={formData.cartao_id}
                  onChange={(e) => {
                    // Limpar conta se selecionar cartão
                    if (e.target.value) {
                      setFormData(prev => ({
                        ...prev,
                        cartao_id: e.target.value,
                        conta_id: ''
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        cartao_id: '',
                        fatura_vencimento: null
                      }));
                    }
                  }}
                  disabled={formData.conta_id}
                >
                  <option value="">Selecione um cartão</option>
                  {cartoes.map(cartao => (
                    <option key={cartao.id} value={cartao.id}>
                      {cartao.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {formData.cartao_id && (
            <div className="form-group">
              <label className="form-label">
                <CalendarIcon className="label-icon" />
                Vencimento da Fatura
              </label>
              <input
                type="date"
                name="fatura_vencimento"
                className="form-input"
                value={formData.fatura_vencimento || ''}
                onChange={handleChange}
              />
              <div className="form-helper">
                Data de vencimento da fatura onde esta compra será lançada
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">
              <ClipboardIcon className="label-icon" />
              Observações
            </label>
            <textarea
              name="observacao"
              className="form-input form-textarea"
              value={formData.observacao || ''}
              onChange={handleChange}
              placeholder="Detalhes adicionais sobre esta transação..."
              rows={3}
            />
          </div>
          
          <div className="form-options">
            <label className="form-toggle">
              <input
                type="checkbox"
                name="efetivada"
                checked={formData.efetivada}
                onChange={handleChange}
              />
              <div className="toggle-track">
                <div className="toggle-thumb"></div>
              </div>
              <span className="toggle-label">
                <ClockIcon className="toggle-icon" />
                Transação efetivada
              </span>
            </label>
            
            <label className="form-toggle">
              <input
                type="checkbox"
                name="recorrente"
                checked={formData.recorrente}
                onChange={handleChange}
              />
              <div className="toggle-track">
                <div className="toggle-thumb"></div>
              </div>
              <span className="toggle-label">
                <RefreshCw className="toggle-icon" />
                Transação recorrente
              </span>
            </label>
          </div>
        </form>
        
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="button-icon" />
            Excluir
          </button>
          
          <div className="footer-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className={`btn btn--primary ${loading ? 'btn--loading' : ''}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              <Save className="button-icon" />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTransacaoModal;