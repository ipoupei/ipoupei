// src/components/widgets/FaturasDashboardWidget.jsx
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Calendar, AlertTriangle, 
  TrendingUp, ArrowRight, Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useFaturasCartao from '../../hooks/useFaturasCartao';
import useCartoes from '../../hooks/useCartoes';
import { formatCurrency } from '../../utils/formatCurrency';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FaturasDashboardWidget = () => {
  const { faturas, loading, fetchFaturas, getResumoGeral } = useFaturasCartao();
  const { cartoes } = useCartoes();
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    fetchFaturas();
  }, [fetchFaturas]);

  useEffect(() => {
    if (faturas.length > 0) {
      const resumoAtual = getResumoGeral();
      setResumo(resumoAtual);
    }
  }, [faturas, getResumoGeral]);

  // Próximas faturas a vencer (próximos 7 dias)
  const proximasFaturas = faturas.filter(fatura => {
    const hoje = new Date();
    const vencimento = new Date(fatura.fatura_vencimento);
    const dias = differenceInDays(vencimento, hoje);
    return dias >= 0 && dias <= 7;
  }).slice(0, 3);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Faturas do Cartão</h3>
          </div>
          <Link 
            to="/faturas/cartao"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Ver todas
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {faturas.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma fatura encontrada</p>
            <p className="text-gray-400 text-xs mt-1">
              As faturas aparecerão quando houver transações no cartão
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo rápido */}
            {resumo && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Faturas</p>
                  <p className="text-lg font-bold text-gray-900">{resumo.totalFaturas}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(resumo.valorTotal)}
                  </p>
                </div>
              </div>
            )}

            {/* Alertas importantes */}
            {resumo?.vencidas > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">
                  {resumo.vencidas} fatura(s) vencida(s)
                </span>
              </div>
            )}

            {resumo?.proximasVencer > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  {resumo.proximasVencer} fatura(s) vencendo em breve
                </span>
              </div>
            )}

            {/* Lista das próximas faturas */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Próximas a Vencer
              </h4>
              
              {proximasFaturas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma fatura vencendo nos próximos 7 dias
                </p>
              ) : (
                <div className="space-y-2">
                  {proximasFaturas.map(fatura => {
                    const cartao = cartoes.find(c => c.id === fatura.cartao_id);
                    const diasParaVencimento = differenceInDays(
                      new Date(fatura.fatura_vencimento), 
                      new Date()
                    );
                    
                    return (
                      <div 
                        key={`${fatura.cartao_id}-${fatura.fatura_vencimento}`}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cartao?.cor || '#3B82F6' }}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {fatura.cartao_nome}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar size={12} />
                              {format(new Date(fatura.fatura_vencimento), "dd 'de' MMM", { locale: ptBR })}
                              {diasParaVencimento === 0 && (
                                <span className="text-red-600 font-medium">(Hoje)</span>
                              )}
                              {diasParaVencimento === 1 && (
                                <span className="text-orange-600 font-medium">(Amanhã)</span>
                              )}
                              {diasParaVencimento > 1 && (
                                <span className="text-gray-600">({diasParaVencimento} dias)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(fatura.valor_total_fatura)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {fatura.total_compras} compra(s)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ações rápidas */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/faturas/cartao"
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Eye size={14} />
                  Ver Faturas
                </Link>
                
                <Link
                  to="/faturas/cartao?aba=estatisticas"
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <TrendingUp size={14} />
                  Estatísticas
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaturasDashboardWidget;