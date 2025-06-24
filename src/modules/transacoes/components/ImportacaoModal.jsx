// src/Components/ImportacaoModal.jsx - Versão Completa
import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Download,
  Building,
  Tag,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  FileSpreadsheet,
  DollarSign,
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react';

import useImportacao from '../hooks/useImportacao';
import useContas from '@modules/contas/hooks/useContas';
import useCategorias from '../hooks/useCategorias';
import { useUIStore } from '@store/uiStore';


import { formatCurrency } from '@utils/formatCurrency';
import '@shared/styles/FormsModal.css';
const ImportacaoModal = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  const { showNotification } = useUIStore();
  
  // Hooks
  const {
    loading: loadingImportacao,
    error: errorImportacao,
    dadosImportados,
    estatisticas,
    importarArquivo,
    atualizarItem,
    ignorarItem,
    definirContaGlobal,
    salvarDespesas,
    limparDados,
    itensValidos,
    valorTotalValido
  } = useImportacao();

  const { contas, loading: loadingContas } = useContas();
  const { categorias, loading: loadingCategorias } = useCategorias();

  // Estados locais
  const [etapa, setEtapa] = useState('upload'); // 'upload', 'configuracao', 'revisao'
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [mostrarApenasPendentes, setMostrarApenasPendentes] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'validos', 'invalidos', 'ignorados'

  // Limpar dados quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      limparDados();
      setEtapa('upload');
      setContaSelecionada('');
      setArquivoSelecionado(null);
      setMostrarApenasPendentes(false);
      setFiltroStatus('todos');
    }
  }, [isOpen, limparDados]);

  // Handler para seleção de arquivo
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showNotification('Arquivo muito grande. Tamanho máximo: 10MB', 'error');
        return;
      }
      setArquivoSelecionado(file);
    }
  }, [showNotification]);

  // Handler para drag and drop
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (allowedTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        if (file.size > 10 * 1024 * 1024) {
          showNotification('Arquivo muito grande. Tamanho máximo: 10MB', 'error');
          return;
        }
        setArquivoSelecionado(file);
      } else {
        showNotification('Tipo de arquivo não suportado. Use CSV ou XLSX.', 'error');
      }
    }
  }, [showNotification]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  // Handler para importar arquivo
  const handleImportarArquivo = useCallback(async () => {
    if (!arquivoSelecionado) {
      showNotification('Selecione um arquivo primeiro', 'error');
      return;
    }

    try {
      await importarArquivo(arquivoSelecionado);
      setEtapa('configuracao');
      showNotification('Arquivo importado com sucesso!', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [arquivoSelecionado, importarArquivo, showNotification]);

  // Handler para definir conta global
  const handleDefinirContaGlobal = useCallback(() => {
    if (!contaSelecionada) {
      showNotification('Selecione uma conta primeiro', 'error');
      return;
    }

    definirContaGlobal(contaSelecionada);
    setEtapa('revisao');
    showNotification('Conta definida para todas as despesas', 'success');
  }, [contaSelecionada, definirContaGlobal, showNotification]);

  // Handler para atualizar item
  const handleAtualizarItem = useCallback((id, campo, valor) => {
    atualizarItem(id, { [campo]: valor });
  }, [atualizarItem]);

  // Handler para salvar despesas
  const handleSalvarDespesas = useCallback(async () => {
    const itensParaSalvar = dadosImportados.filter(item => 
      !item.ignorar && 
      item.erros.length === 0 && 
      item.conta_id &&
      item.categoria_id
    );

    if (itensParaSalvar.length === 0) {
      showNotification('Nenhuma despesa válida para salvar. Configure as categorias primeiro.', 'error');
      return;
    }

    try {
      const resultado = await salvarDespesas();
      showNotification(`${resultado.despesasSalvas} despesas importadas com sucesso!`, 'success');
      
      if (onSuccess) {
        onSuccess(resultado);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [dadosImportados, salvarDespesas, showNotification, onSuccess, onClose]);

  // Filtrar dados para exibição
  const dadosFiltrados = dadosImportados.filter(item => {
    if (filtroStatus === 'validos') return item.erros.length === 0 && !item.ignorar;
    if (filtroStatus === 'invalidos') return item.erros.length > 0;
    if (filtroStatus === 'ignorados') return item.ignorar;
    return true;
  });

  // Dados derivados para estatísticas
  const estatisticasAtuais = {
    total: dadosImportados.length,
    validos: dadosImportados.filter(item => !item.ignorar && item.erros.length === 0).length,
    invalidos: dadosImportados.filter(item => item.erros.length > 0).length,
    ignorados: dadosImportados.filter(item => item.ignorar).length,
    configurados: dadosImportados.filter(item => !item.ignorar && item.erros.length === 0 && item.categoria_id).length
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container importacao-modal">
        {/* Header */}
        <div className="modal-header" style={{ 
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(234, 88, 12, 0.02) 100%)',
          borderBottom: '1px solid rgba(234, 88, 12, 0.1)' 
        }}>
          <h2 className="modal-title">
            <div className="form-icon-wrapper" style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: 'white'
            }}>
              <Upload size={18} />
            </div>
            <div>
              <div className="form-title-main">
                📊 Importar Despesas
                {etapa === 'configuracao' && ' - Configuração'}
                {etapa === 'revisao' && ' - Revisão'}
              </div>
              <div className="form-title-subtitle">
                {etapa === 'upload' && 'Faça upload do seu arquivo CSV ou Excel'}
                {etapa === 'configuracao' && 'Defina a conta para as despesas'}
                {etapa === 'revisao' && 'Revise e configure as categorias'}
              </div>
            </div>
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content importacao-content">
          
          {/* ETAPA 1: Upload do Arquivo */}
          {etapa === 'upload' && (
            <div className="importacao-etapa">
              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <div 
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <FileSpreadsheet size={48} className="upload-icon" />
                  <h3>Selecione ou arraste seu arquivo</h3>
                  <p>Clique para escolher ou arraste um arquivo CSV ou Excel aqui</p>
                  <small>Formatos aceitos: .csv, .xlsx (máximo 10MB)</small>
                </div>
                
                {arquivoSelecionado && (
                  <div className="arquivo-selecionado">
                    <FileText size={16} />
                    <span>{arquivoSelecionado.name}</span>
                    <small>({(arquivoSelecionado.size / 1024 / 1024).toFixed(2)} MB)</small>
                    <button 
                      onClick={() => setArquivoSelecionado(null)}
                      className="btn-remover"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="upload-info">
                <div className="info-header">
                  <Info size={16} />
                  <h4>Formato esperado do arquivo:</h4>
                </div>
                <ul>
                  <li><strong>Colunas obrigatórias:</strong> Data, Descrição, Valor</li>
                  <li><strong>Colunas opcionais:</strong> Categoria, Observações</li>
                  <li><strong>Formato de data:</strong> DD/MM/AAAA, DD-MM-AAAA ou AAAA-MM-DD</li>
                  <li><strong>Formato de valor:</strong> 123.45, 123,45 ou R$ 123,45</li>
                  <li><strong>Exemplo:</strong> Data,Descrição,Valor,Categoria</li>
                </ul>
                
                <div className="exemplo-csv">
                  <strong>Exemplo de CSV:</strong>
                  <code>
                    01/12/2024,Supermercado XYZ,150.50,Alimentação<br/>
                    15/12/2024,Posto de Gasolina,80.00,Transporte
                  </code>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="form-btn form-btn-secondary"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={handleImportarArquivo}
                  disabled={!arquivoSelecionado || loadingImportacao}
                  className="form-btn form-btn-primary"
                >
                  {loadingImportacao ? (
                    <>
                      <div className="form-spinner"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Processar Arquivo
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 2: Configuração da Conta */}
          {etapa === 'configuracao' && (
            <div className="importacao-etapa">
              {/* Estatísticas da Importação */}
              <div className="importacao-stats">
                <div className="stat-card success">
                  <CheckCircle size={20} />
                  <div>
                    <div className="stat-number">{estatisticas.validas}</div>
                    <div className="stat-label">Válidas</div>
                  </div>
                </div>
                <div className="stat-card error">
                  <AlertTriangle size={20} />
                  <div>
                    <div className="stat-number">{estatisticas.invalidas}</div>
                    <div className="stat-label">Com Erros</div>
                  </div>
                </div>
                <div className="stat-card">
                  <DollarSign size={20} />
                  <div>
                    <div className="stat-number">{formatCurrency(estatisticas.valorTotal)}</div>
                    <div className="stat-label">Valor Total</div>
                  </div>
                </div>
              </div>

              {/* Seleção de Conta */}
              <div className="form-field-group">
                <label className="form-label">
                  <Building size={14} />
                  Conta para Débito das Despesas *
                </label>
                <select
                  value={contaSelecionada}
                  onChange={(e) => setContaSelecionada(e.target.value)}
                  disabled={loadingContas}
                  className="form-input"
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} - {formatCurrency(conta.saldo || 0)}
                    </option>
                  ))}
                </select>
                <small className="form-help">
                  Esta conta será atribuída a todas as despesas. Você poderá alterar individualmente na próxima etapa.
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setEtapa('upload')}
                  className="form-btn form-btn-secondary"
                >
                  Voltar
                </button>
                
                <button
                  type="button"
                  onClick={handleDefinirContaGlobal}
                  disabled={!contaSelecionada}
                  className="form-btn form-btn-primary"
                >
                  <Tag size={14} />
                  Continuar para Categorias
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3: Revisão e Configuração */}
          {etapa === 'revisao' && (
            <div className="importacao-etapa revisao">
              {/* Estatísticas Atualizadas */}
              <div className="importacao-stats">
                <div className="stat-card success">
                  <CheckCircle size={20} />
                  <div>
                    <div className="stat-number">{estatisticasAtuais.configurados}</div>
                    <div className="stat-label">Configuradas</div>
                  </div>
                </div>
                <div className="stat-card warning">
                  <AlertCircle size={20} />
                  <div>
                    <div className="stat-number">{estatisticasAtuais.validos - estatisticasAtuais.configurados}</div>
                    <div className="stat-label">Pendentes</div>
                  </div>
                </div>
                <div className="stat-card error">
                  <AlertTriangle size={20} />
                  <div>
                    <div className="stat-number">{estatisticasAtuais.ignorados}</div>
                    <div className="stat-label">Ignoradas</div>
                  </div>
                </div>
                <div className="stat-card">
                  <DollarSign size={20} />
                  <div>
                    <div className="stat-number">{formatCurrency(valorTotalValido)}</div>
                    <div className="stat-label">Valor a Importar</div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="importacao-filtros">
                <div className="filtro-grupo">
                  <label>Filtrar por status:</label>
                  <select 
                    value={filtroStatus} 
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="form-input filtro-select"
                  >
                    <option value="todos">Todos ({dadosImportados.length})</option>
                    <option value="validos">Válidos ({estatisticasAtuais.validos})</option>
                    <option value="invalidos">Com Erros ({estatisticasAtuais.invalidos})</option>
                    <option value="ignorados">Ignorados ({estatisticasAtuais.ignorados})</option>
                  </select>
                </div>
                
                <div className="filtro-grupo">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={mostrarApenasPendentes}
                      onChange={(e) => setMostrarApenasPendentes(e.target.checked)}
                    />
                    Mostrar apenas pendentes de configuração
                  </label>
                </div>
              </div>

              {/* Lista de Despesas */}
              <div className="despesas-lista">
                <div className="lista-header">
                  <h4>Despesas Importadas ({dadosFiltrados.length})</h4>
                </div>
                
                <div className="lista-content">
                  {dadosFiltrados.length === 0 ? (
                    <div className="lista-vazia">
                      <FileText size={32} />
                      <p>Nenhuma despesa encontrada com os filtros aplicados</p>
                    </div>
                  ) : (
                    dadosFiltrados
                      .filter(item => !mostrarApenasPendentes || (!item.categoria_id && !item.ignorar && item.erros.length === 0))
                      .map((item) => (
                        <DespesaItem
                          key={item.id}
                          item={item}
                          categorias={categorias}
                          contas={contas}
                          onAtualizar={handleAtualizarItem}
                          onIgnorar={ignorarItem}
                        />
                      ))
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setEtapa('configuracao')}
                  className="form-btn form-btn-secondary"
                >
                  Voltar
                </button>
                
                <button
                  type="button"
                  onClick={handleSalvarDespesas}
                  disabled={loadingImportacao || estatisticasAtuais.configurados === 0}
                  className="form-btn form-btn-primary success"
                >
                  {loadingImportacao ? (
                    <>
                      <div className="form-spinner"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Salvar {estatisticasAtuais.configurados} Despesas
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Erro da Importação */}
          {errorImportacao && (
            <div className="form-error-global">
              <AlertTriangle size={16} />
              {errorImportacao}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para cada item de despesa
const DespesaItem = ({ item, categorias, contas, onAtualizar, onIgnorar }) => {
  const [expandido, setExpandido] = useState(false);
  const [editando, setEditando] = useState(null);

  const categoriasDespesa = categorias.filter(cat => cat.tipo === 'despesa');
  const categoriaSelecionada = categorias.find(cat => cat.id === item.categoria_id);
  const subcategorias = categoriaSelecionada?.subcategorias || [];

  const handleSalvarEdicao = (campo, valor) => {
    onAtualizar(item.id, campo, valor);
    setEditando(null);
  };

  const getStatusIcon = () => {
    if (item.ignorar) return <EyeOff size={16} className="status-icon ignored" />;
    if (item.erros.length > 0) return <AlertTriangle size={16} className="status-icon error" />;
    if (!item.categoria_id) return <AlertCircle size={16} className="status-icon warning" />;
    return <CheckCircle size={16} className="status-icon success" />;
  };

  const getStatusClass = () => {
    if (item.ignorar) return 'despesa-item ignored';
    if (item.erros.length > 0) return 'despesa-item error';
    if (!item.categoria_id) return 'despesa-item warning';
    return 'despesa-item success';
  };

  return (
    <div className={getStatusClass()}>
      <div className="despesa-header" onClick={() => setExpandido(!expandido)}>
        <div className="despesa-info">
          {getStatusIcon()}
          <div className="despesa-detalhes">
            <div className="despesa-descricao">{item.descricao}</div>
            <div className="despesa-meta">
              Linha {item.linha} • {formatCurrency(item.valor)} • {item.data}
              {item.erros.length > 0 && (
                <span className="error-badge">{item.erros.length} erro(s)</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="despesa-acoes">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIgnorar(item.id, !item.ignorar);
            }}
            className={`btn-acao ${item.ignorar ? 'ativo' : ''}`}
            title={item.ignorar ? 'Incluir na importação' : 'Ignorar esta despesa'}
          >
            {item.ignorar ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="despesa-detalhes-expandido">
          {/* Erros */}
          {item.erros.length > 0 && (
            <div className="despesa-erros">
              <h5>Erros encontrados:</h5>
              <ul>
                {item.erros.map((erro, index) => (
                  <li key={index}>{erro}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Configuração - apenas para itens válidos e não ignorados */}
          {item.erros.length === 0 && !item.ignorar && (
            <div className="despesa-configuracao">
              <div className="config-row">
                <div className="config-field">
                  <label>Data:</label>
                  {editando === 'data' ? (
                    <div className="edit-field">
                      <input
                        type="date"
                        defaultValue={item.data}
                        onBlur={(e) => handleSalvarEdicao('data', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSalvarEdicao('data', e.target.value)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="field-display" onClick={() => setEditando('data')}>
                      {item.data}
                      <Edit3 size={12} />
                    </div>
                  )}
                </div>

                <div className="config-field">
                  <label>Conta:</label>
                  {editando === 'conta' ? (
                    <div className="edit-field">
                      <select
                        defaultValue={item.conta_id}
                        onBlur={(e) => handleSalvarEdicao('conta_id', e.target.value)}
                        onChange={(e) => handleSalvarEdicao('conta_id', e.target.value)}
                        autoFocus
                      >
                        <option value="">Selecionar...</option>
                        {contas.map(conta => (
                          <option key={conta.id} value={conta.id}>
                            {conta.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="field-display" onClick={() => setEditando('conta')}>
                      {contas.find(c => c.id === item.conta_id)?.nome || 'Não definida'}
                      <Edit3 size={12} />
                    </div>
                  )}
                </div>
              </div>

              <div className="config-row">
                <div className="config-field">
                  <label>Categoria: *</label>
                  {editando === 'categoria' ? (
                    <div className="edit-field">
                      <select
                        defaultValue={item.categoria_id}
                        onBlur={(e) => handleSalvarEdicao('categoria_id', e.target.value)}
                        onChange={(e) => handleSalvarEdicao('categoria_id', e.target.value)}
                        autoFocus
                      >
                        <option value="">Selecionar...</option>
                        {categoriasDespesa.map(categoria => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div 
                      className={`field-display ${!item.categoria_id ? 'required' : ''}`}
                      onClick={() => setEditando('categoria')}
                    >
                      {categoriaSelecionada?.nome || 'Não definida *'}
                      <Edit3 size={12} />
                    </div>
                  )}
                </div>

                <div className="config-field">
                  <label>Subcategoria:</label>
                  {editando === 'subcategoria' ? (
                    <div className="edit-field">
                      <select
                        defaultValue={item.subcategoria_id || ''}
                        onBlur={(e) => handleSalvarEdicao('subcategoria_id', e.target.value)}
                        onChange={(e) => handleSalvarEdicao('subcategoria_id', e.target.value)}
                        autoFocus
                      >
                        <option value="">Nenhuma</option>
                        {subcategorias.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="field-display" onClick={() => setEditando('subcategoria')}>
                      {subcategorias.find(s => s.id === item.subcategoria_id)?.nome || 'Nenhuma'}
                      <Edit3 size={12} />
                    </div>
                  )}
                </div>
              </div>

              <div className="config-row">
                <div className="config-field full-width">
                  <label>Observações:</label>
                  {editando === 'observacoes' ? (
                    <div className="edit-field">
                      <input
                        type="text"
                        defaultValue={item.observacoes}
                        onBlur={(e) => handleSalvarEdicao('observacoes', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSalvarEdicao('observacoes', e.target.value)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="field-display" onClick={() => setEditando('observacoes')}>
                      {item.observacoes || 'Adicionar observações...'}
                      <Edit3 size={12} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ImportacaoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

DespesaItem.propTypes = {
  item: PropTypes.object.isRequired,
  categorias: PropTypes.array.isRequired,
  contas: PropTypes.array.isRequired,
  onAtualizar: PropTypes.func.isRequired,
  onIgnorar: PropTypes.func.isRequired
};

export default React.memo(ImportacaoModal);