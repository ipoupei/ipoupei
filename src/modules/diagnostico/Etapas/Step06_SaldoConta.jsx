// src/modules/diagnostico/etapas/Step06_SaldoContasEtapa.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  PiggyBank, 
  CreditCard, 
  Plus, 
  Trash2,
  DollarSign,
  TrendingUp 
} from 'lucide-react';
import useDiagnosticoEmocionalStore from '@modules/diagnostico/store/diagnosticoEmocionalStore';
import { StepWrapper, MoneyInput, OptionCard } from '@modules/diagnostico/components/DiagnosticoComponents';
import '@modules/diagnostico/styles/DiagnosticoEmocional.css';

const Step06_SaldoContasEtapa = () => {
  const navigate = useNavigate();
  const { 
    saldoContas,
    setSaldoContas,
    nextEtapa, 
    prevEtapa 
  } = useDiagnosticoEmocionalStore();

  const [temSaldo, setTemSaldo] = useState(null);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [modoDetalhado, setModoDetalhado] = useState(false);
  const [listaContas, setListaContas] = useState([]);

  const opcoesSaldo = [
    {
      value: 'sim',
      titulo: '💰 Tenho dinheiro guardado',
      descricao: 'Tenho algum valor em contas ou poupança',
      color: 'green'
    },
    {
      value: 'pouco',
      titulo: '🪙 Tenho pouco guardado',
      descricao: 'Só o básico para emergências pequenas',
      color: 'orange'
    },
    {
      value: 'nao',
      titulo: '😅 Estou no vermelho',
      descricao: 'Sem reservas ou com saldo negativo',
      color: 'red'
    },
    {
      value: 'nao_sei',
      titulo: '🤷‍♂️ Não sei quanto tenho',
      descricao: 'Não tenho controle dos meus saldos',
      color: 'gray'
    }
  ];

  const tiposConta = [
    { valor: 'conta_corrente', nome: 'Conta Corrente', icone: <Wallet size={20} /> },
    { valor: 'poupanca', nome: 'Poupança', icone: <PiggyBank size={20} /> },
    { valor: 'investimento', nome: 'Investimentos', icone: <TrendingUp size={20} /> },
    { valor: 'carteira', nome: 'Dinheiro em Espécie', icone: <DollarSign size={20} /> },
    { valor: 'outros', nome: 'Outros', icone: <CreditCard size={20} /> }
  ];

  const handleVoltar = () => {
    prevEtapa();
    navigate('/susto-consciente/vilao');
  };

  const handleContinuar = () => {
    // Salva informações dos saldos
    let infoCompleta = '';
    
    if (temSaldo === 'sim' || temSaldo === 'pouco') {
      if (modoDetalhado && listaContas.length > 0) {
        infoCompleta = {
          tipo: 'detalhado',
          contas: listaContas,
          totalSaldo: listaContas.reduce((total, conta) => total + conta.saldo, 0)
        };
      } else {
        infoCompleta = {
          tipo: 'simples',
          saldoTotal: saldoTotal,
          situacao: temSaldo
        };
      }
    } else {
      infoCompleta = {
        tipo: 'simples',
        situacao: temSaldo
      };
    }
    
    setSaldoContas(infoCompleta);
    nextEtapa();
    navigate('/susto-consciente/resumo');
  };

  const handleTemSaldo = (opcao) => {
    setTemSaldo(opcao);
    if (opcao !== 'sim' && opcao !== 'pouco') {
      setSaldoTotal(0);
      setListaContas([]);
      setModoDetalhado(false);
    }
  };

  const adicionarConta = () => {
    setListaContas(prev => [...prev, {
      id: Date.now(),
      tipo: '',
      nome: '',
      saldo: 0
    }]);
  };

  const removerConta = (id) => {
    setListaContas(prev => prev.filter(conta => conta.id !== id));
  };

  const atualizarConta = (id, campo, valor) => {
    setListaContas(prev => prev.map(conta => 
      conta.id === id ? { ...conta, [campo]: valor } : conta
    ));
  };

  const totalSaldoDetalhado = listaContas.reduce((total, conta) => total + conta.saldo, 0);
  const podeAvancar = true; // Esta etapa sempre pode avançar

  const getIconeTipo = (tipo) => {
    const tipoObj = tiposConta.find(t => t.valor === tipo);
    return tipoObj ? tipoObj.icone : <Wallet size={20} />;
  };

  const getSituacaoFeedback = () => {
    const valor = modoDetalhado ? totalSaldoDetalhado : saldoTotal;
    
    if (valor >= 10000) return "💎 Excelente reserva! Vamos otimizar esses investimentos.";
    if (valor >= 5000) return "👍 Boa reserva! Dá para fazer render mais.";
    if (valor >= 1000) return "💪 Reserva básica! Vamos trabalhar para aumentar.";
    if (valor > 0) return "🌱 Todo começo é importante! Vamos fazer crescer.";
    return "🎯 Vamos construir sua reserva do zero!";
  };

  return (
    <div className="diagnostico-emocional-wrapper">
      <div className="diagnostico-emocional-container">
        <StepWrapper
          titulo="Quanto você tem guardado hoje?"
          subtitulo="Vamos mapear seus saldos atuais para criar a melhor estratégia"
          onVoltar={handleVoltar}
          onContinuar={handleContinuar}
          podeContinuar={podeAvancar}
          etapaAtual={5}
          totalEtapas={7}
        >
          <div className="saldo-intro">
            <div className="saldo-icon">
              <PiggyBank size={32} color="#3b82f6" />
            </div>
            <p className="saldo-description">
              Seja honesto sobre sua situação atual. Isso vai nos ajudar a definir 
              prioridades e metas realistas para você.
            </p>
          </div>

          <div className="option-cards-grid single-column">
            {opcoesSaldo.map((opcao) => (
              <OptionCard
                key={opcao.value}
                value={opcao.value}
                titulo={opcao.titulo}
                descricao={opcao.descricao}
                color={opcao.color}
                isSelected={temSaldo === opcao.value}
                onClick={handleTemSaldo}
                size="large"
              />
            ))}
          </div>

          {(temSaldo === 'sim' || temSaldo === 'pouco') && (
            <div className="saldo-detalhes">
              <div className="saldo-modo-selector">
                <div className="modo-buttons">
                  <button 
                    className={`modo-btn ${!modoDetalhado ? 'active' : ''}`}
                    onClick={() => setModoDetalhado(false)}
                  >
                    <DollarSign size={20} />
                    Valor Total
                  </button>
                  <button 
                    className={`modo-btn ${modoDetalhado ? 'active' : ''}`}
                    onClick={() => setModoDetalhado(true)}
                  >
                    <Wallet size={20} />
                    Por Conta
                  </button>
                </div>
              </div>

              {!modoDetalhado ? (
                <div className="form-section">
                  <h3 className="form-section-title">
                    Quanto você tem no total?
                  </h3>
                  <p className="form-section-description">
                    Considere tudo: conta corrente, poupança, investimentos, dinheiro em casa...
                  </p>
                  
                  <MoneyInput
                    value={saldoTotal}
                    onChange={setSaldoTotal}
                    placeholder="R$ 0,00"
                    size="large"
                    autoFocus
                  />

                  {saldoTotal > 0 && (
                    <div className="saldo-feedback">
                      <p className="feedback-text">{getSituacaoFeedback()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="contas-detalhadas">
                  <div className="contas-header">
                    <h4 className="form-section-title">
                      Vamos detalhar suas contas
                    </h4>
                    <button 
                      onClick={adicionarConta}
                      className="btn-adicionar-conta"
                    >
                      <Plus size={16} />
                      Adicionar conta
                    </button>
                  </div>

                  {listaContas.map((conta, index) => (
                    <div key={conta.id} className="conta-item">
                      <div className="conta-header">
                        <span className="conta-numero">Conta {index + 1}</span>
                        <button 
                          onClick={() => removerConta(conta.id)}
                          className="btn-remover-conta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="conta-campos">
                        <div className="campo-tipo">
                          <label className="campo-label">Tipo:</label>
                          <select 
                            value={conta.tipo}
                            onChange={(e) => atualizarConta(conta.id, 'tipo', e.target.value)}
                            className="select-tipo"
                          >
                            <option value="">Selecione...</option>
                            {tiposConta.map(tipo => (
                              <option key={tipo.valor} value={tipo.valor}>{tipo.nome}</option>
                            ))}
                          </select>
                        </div>

                        <div className="campo-nome">
                          <label className="campo-label">Nome (opcional):</label>
                          <input
                            type="text"
                            value={conta.nome}
                            onChange={(e) => atualizarConta(conta.id, 'nome', e.target.value)}
                            placeholder="Ex: Nubank, Itaú..."
                            className="input-nome"
                          />
                        </div>

                        <div className="campo-saldo">
                          <label className="campo-label">Saldo atual:</label>
                          <MoneyInput
                            value={conta.saldo}
                            onChange={(valor) => atualizarConta(conta.id, 'saldo', valor)}
                            placeholder="R$ 0,00"
                            size="small"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {listaContas.length > 0 && (
                    <div className="resumo-contas">
                      <div className="total-saldo">
                        <span className="total-label">Total disponível:</span>
                        <span className="total-valor positivo">
                          R$ {totalSaldoDetalhado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {totalSaldoDetalhado > 0 && (
                        <div className="saldo-feedback">
                          <p className="feedback-text">{getSituacaoFeedback()}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {listaContas.length === 0 && (
                    <div className="contas-vazia">
                      <div className="vazia-icon">
                        <Wallet size={32} color="#6b7280" />
                      </div>
                      <p className="vazia-text">
                        Clique em "Adicionar conta" para começar a mapear seus saldos.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {temSaldo && (
            <div className="saldo-situacao-feedback">
              <div className="feedback-box">
                {temSaldo === 'sim' && (
                  <p>
                    <strong>🎉 Muito bom!</strong> Ter reservas te dá flexibilidade para 
                    tomar decisões financeiras mais inteligentes.
                  </p>
                )}
                {temSaldo === 'pouco' && (
                  <p>
                    <strong>👍 É um começo!</strong> Vamos trabalhar para aumentar sua reserva 
                    e criar mais segurança financeira.
                  </p>
                )}
                {temSaldo === 'nao' && (
                  <p>
                    <strong>🎯 Sem problemas!</strong> Vamos primeiro organizar suas finanças 
                    e depois construir sua reserva do zero.
                  </p>
                )}
                {temSaldo === 'nao_sei' && (
                  <p>
                    <strong>📊 Entendido!</strong> Vamos implementar um sistema de controle 
                    para você saber exatamente onde está financeiramente.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="saldo-motivacao">
            <div className="motivacao-box">
              <TrendingUp size={20} color="#10b981" />
              <p className="motivacao-text">
                <strong>Lembre-se:</strong> Não importa onde você está hoje. O que importa 
                é ter um plano claro para chegar onde quer estar!
              </p>
            </div>
          </div>
        </StepWrapper>
      </div>
    </div>
  );
};

export default Step06_SaldoContasEtapa;