// src/modules/diagnostico/etapas/CadastroEtapa.jsx
import { useEffect, useState } from 'react';
import { useDiagnosticoFlowStore } from '../store/diagnosticoFlowStore';
import Button from '../../../shared/components/ui/Button';

// Importar hooks para puxar dados reais
import useContas from '../../contas/hooks/useContas';
import useCartoes from '../../cartoes/hooks/useCartoes';
import useTransacoes from '../../transacoes/hooks/useTransacoes';

// Função para identificar se um gasto é fixo (movida para fora do componente)
const isGastoFixo = (transacao) => {
  const categoriasFixas = [
    'moradia', 'aluguel', 'financiamento', 'internet', 'telefone',
    'energia', 'agua', 'gas', 'seguro', 'escola', 'faculdade',
    'plano-saude', 'academia', 'streaming'
  ];
  
  const categoria = transacao.categoria?.nome?.toLowerCase() || '';
  const descricao = transacao.descricao?.toLowerCase() || '';
  
  return categoriasFixas.some(cat => 
    categoria.includes(cat) || descricao.includes(cat)
  );
};

const CadastroEtapa = ({ etapa }) => {
  const { 
    proximaEtapa, 
    voltarEtapa, 
    pularEtapa,
    abrirModal,
    dadosColetados,
    atualizarDadosContas,
    atualizarDadosCartoes,
    atualizarDadosReceitas,
    atualizarDadosDespesas
  } = useDiagnosticoFlowStore();

  // Hooks para dados reais
  const { contas, loading: loadingContas } = useContas();
  const { cartoes, loading: loadingCartoes } = useCartoes();
  const { transacoes, loading: loadingTransacoes } = useTransacoes();

  const [dadosAtualizados, setDadosAtualizados] = useState(false);

  // Sincronizar dados reais com o store do diagnóstico
  useEffect(() => {
    let precisaAtualizar = false;

    // Sincronizar contas
    if (contas && contas.length > 0 && dadosColetados.contas.length === 0) {
      atualizarDadosContas(contas);
      precisaAtualizar = true;
    }

    // Sincronizar cartões
    if (cartoes && cartoes.length > 0 && dadosColetados.cartoes.length === 0) {
      atualizarDadosCartoes(cartoes);
      precisaAtualizar = true;
    }

    // Sincronizar transações
    if (transacoes && transacoes.length > 0) {
      const receitas = transacoes.filter(t => t.tipo === 'receita');
      const despesas = transacoes.filter(t => t.tipo === 'despesa');
      
      if (receitas.length > 0 && dadosColetados.receitas.length === 0) {
        atualizarDadosReceitas(receitas);
        precisaAtualizar = true;
      }
      
      if (despesas.length > 0) {
        const despesasFixas = despesas.filter(d => d.recorrente || isGastoFixo(d));
        const despesasVariaveis = despesas.filter(d => !d.recorrente && !isGastoFixo(d));
        
        if (despesasFixas.length > 0 && dadosColetados.despesasFixas.length === 0) {
          atualizarDadosDespesas(despesasFixas, 'fixas');
          precisaAtualizar = true;
        }
        
        if (despesasVariaveis.length > 0 && dadosColetados.despesasVariaveis.length === 0) {
          atualizarDadosDespesas(despesasVariaveis, 'variaveis');
          precisaAtualizar = true;
        }
      }
    }

    if (precisaAtualizar) {
      setDadosAtualizados(true);
    }
  }, [contas, cartoes, transacoes, dadosColetados, atualizarDadosContas, atualizarDadosCartoes, atualizarDadosReceitas, atualizarDadosDespesas]);

  const getDadosRelevantes = () => {
    switch (etapa.id) {
      case 'contas':
        // Priorizar dados reais dos hooks
        return contas && contas.length > 0 ? contas : dadosColetados.contas || [];
      case 'cartoes':
        return cartoes && cartoes.length > 0 ? cartoes : dadosColetados.cartoes || [];
      case 'renda':
        const receitasReais = transacoes ? transacoes.filter(t => t.tipo === 'receita') : [];
        return receitasReais.length > 0 ? receitasReais : dadosColetados.receitas || [];
      case 'gastos-fixos':
        const despesasReais = transacoes ? transacoes.filter(t => t.tipo === 'despesa') : [];
        const fixasReais = despesasReais.filter(d => d.recorrente || isGastoFixo(d));
        return fixasReais.length > 0 ? fixasReais : dadosColetados.despesasFixas || [];
      case 'gastos-variaveis':
        const despesasReais2 = transacoes ? transacoes.filter(t => t.tipo === 'despesa') : [];
        const variaveisReais = despesasReais2.filter(d => !d.recorrente && !isGastoFixo(d));
        return variaveisReais.length > 0 ? variaveisReais : dadosColetados.despesasVariaveis || [];
      default:
        return [];
    }
  };

  const dados = getDadosRelevantes();
  const temDados = dados.length > 0;
  const isLoading = loadingContas || loadingCartoes || loadingTransacoes;

  const handleAbrirModal = () => {
    abrirModal(etapa.modal);
  };

  const getInstrucoes = () => {
    switch (etapa.id) {
      case 'contas':
        return {
          explicacao: 'Suas contas bancárias são onde seu dinheiro fica guardado. Cadastre pelo menos sua conta principal.',
          exemplos: ['Conta Corrente', 'Conta Poupança', 'Conta Digital (Nubank, Inter, etc.)']
        };
      case 'cartoes':
        return {
          explicacao: 'Cartões de crédito podem ser grandes vilões se não controlados. Vamos cadastrá-los.',
          exemplos: ['Cartão do banco', 'Cartão de loja', 'Cartão de crédito internacional']
        };
      case 'renda':
        return {
          explicacao: 'Toda fonte de dinheiro que entra na sua vida. Seja honesto para um diagnóstico preciso.',
          exemplos: ['Salário', 'Freelances', 'Aluguéis', 'Renda extra', 'Aposentadoria']
        };
      case 'gastos-fixos':
        return {
          explicacao: 'Gastos que se repetem todo mês. Esses são os mais importantes de controlar.',
          exemplos: ['Aluguel/Financiamento', 'Internet', 'Energia', 'Supermercado básico', 'Planos (saúde, celular)']
        };
      case 'gastos-variaveis':
        return {
          explicacao: 'Gastos que variam de mês para mês. Aqui é onde geralmente "fura" o orçamento.',
          exemplos: ['Restaurantes', 'Lazer', 'Roupas', 'Uber', 'Compras extras']
        };
      default:
        return { explicacao: '', exemplos: [] };
    }
  };

  const instrucoes = getInstrucoes();

  if (isLoading) {
    return (
      <div className="etapa-container cadastro-etapa">
        <div className="etapa-header">
          <div className="etapa-icone-grande">{etapa.icone}</div>
          <h1>{etapa.titulo}</h1>
          <p className="etapa-subtitulo">Carregando seus dados...</p>
        </div>
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Verificando dados existentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="etapa-container cadastro-etapa">
      <div className="etapa-header">
        <div className="etapa-icone-grande">{etapa.icone}</div>
        <h1>{etapa.titulo}</h1>
        <p className="etapa-subtitulo">{etapa.subtitulo}</p>
      </div>

      <div className="cadastro-content">
        <div className="instrucoes">
          <p>{instrucoes.explicacao}</p>
          
          {instrucoes.exemplos.length > 0 && (
            <div className="exemplos">
              <h4>💡 Exemplos:</h4>
              <ul>
                {instrucoes.exemplos.map((exemplo, index) => (
                  <li key={index}>{exemplo}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="objetivo">
          <p><strong>🎯 Objetivo:</strong> {etapa.objetivo}</p>
        </div>

        {temDados && (
          <div className="dados-cadastrados">
            <h4>✅ Dados já cadastrados: {dados.length}</h4>
            <div className="lista-resumo">
              {dados.slice(0, 3).map((item, index) => (
                <div key={index} className="item-resumo">
                  {item.nome || item.descricao || 'Item cadastrado'}
                  {item.valor && (
                    <span className="item-valor">
                      R$ {Number(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                  )}
                </div>
              ))}
              {dados.length > 3 && (
                <div className="item-resumo">
                  +{dados.length - 3} mais...
                </div>
              )}
            </div>
            
            {dadosAtualizados && (
              <div className="dados-sincronizados">
                <p>🔄 Dados sincronizados automaticamente do seu app!</p>
              </div>
            )}
          </div>
        )}

        <div className="acoes-cadastro">
          <Button 
            onClick={handleAbrirModal}
            variant="primary" 
            size="large"
          >
            {temDados ? `Gerenciar ${etapa.titulo}` : `Cadastrar ${etapa.titulo}`}
          </Button>
          
          {etapa.id === 'cartoes' && (
            <Button 
              onClick={pularEtapa}
              variant="ghost"
              size="small"
            >
              Não tenho cartões
            </Button>
          )}
        </div>
      </div>

      <div className="etapa-footer">
        <Button onClick={voltarEtapa} variant="secondary">
          Voltar
        </Button>
        <Button 
          onClick={proximaEtapa} 
          variant="primary"
          disabled={!temDados && etapa.id !== 'cartoes'}
        >
          {temDados ? 'Continuar' : 'Cadastre primeiro'}
        </Button>
      </div>
    </div>
  );
};

export default CadastroEtapa;