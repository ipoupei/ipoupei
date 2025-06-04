// src/components/PreviewParcelamento.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '@utils/formatCurrency';

/**
 * Componente para exibir o preview do parcelamento de uma compra no cartão de crédito
 * Mostra o valor total, número de parcelas, valor por parcela e data da primeira parcela
 */
const PreviewParcelamento = ({ 
  valorTotal = 0, 
  numeroParcelas = 1, 
  dataCompra, 
  diaFechamento = 1, 
  diaVencimento = 10 
}) => {
  // Calcula o valor das parcelas com precisão monetária
  const valorPorParcela = valorTotal / numeroParcelas;
  
  // Calcula a data da primeira parcela com base na data da compra e fechamento do cartão
  const calcularDataPrimeiraParcela = () => {
    if (!dataCompra) return '';
    
    const dataOriginal = new Date(dataCompra);
    const mesCompra = dataOriginal.getMonth();
    const anoCompra = dataOriginal.getFullYear();
    const diaCompra = dataOriginal.getDate();
    
    // Determina o mês da primeira fatura
    let mesFatura, anoFatura;
    
    // Se a compra foi feita após o fechamento, entra na fatura do mês seguinte
    if (diaCompra > diaFechamento) {
      mesFatura = (mesCompra + 1) % 12;
      anoFatura = mesFatura === 0 && mesCompra === 11 ? anoCompra + 1 : anoCompra;
    } else {
      // Se a compra foi feita antes ou no dia do fechamento, entra na fatura do mesmo mês
      mesFatura = mesCompra;
      anoFatura = anoCompra;
    }
    
    // Vencimento da primeira parcela
    const dataPrimeiraParcela = new Date(anoFatura, mesFatura, diaVencimento);
    
    return dataPrimeiraParcela.toLocaleDateString('pt-BR');
  };
  
  // Calcula as datas das próximas parcelas a partir da primeira
  const calcularProximasParcelas = () => {
    if (!dataCompra || numeroParcelas <= 1) return [];
    
    const dataPrimeira = new Date(dataCompra);
    const diaCompra = dataPrimeira.getDate();
    
    // Ajusta para o dia de fechamento
    if (diaCompra > diaFechamento) {
      dataPrimeira.setMonth(dataPrimeira.getMonth() + 1);
    }
    
    // Inicialmente setamos para o mês da primeira parcela
    const parcelas = [];
    
    for (let i = 1; i <= numeroParcelas; i++) {
      const dataParcela = new Date(dataPrimeira);
      dataParcela.setMonth(dataPrimeira.getMonth() + (i - 1)); // Incrementa os meses
      dataParcela.setDate(diaVencimento); // Ajusta para o dia de vencimento
      
      parcelas.push({
        numero: i,
        data: dataParcela.toLocaleDateString('pt-BR'),
        valor: valorPorParcela
      });
    }
    
    return parcelas;
  };

  // Container style
  const containerStyle = {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px'
  };
  
  // Header style
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    borderBottom: '1px dashed #d1d5db',
    paddingBottom: '8px'
  };
  
  // Title style
  const titleStyle = {
    fontWeight: 500,
    fontSize: '14px',
    color: '#4b5563'
  };
  
  // Total style
  const totalStyle = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937'
  };
  
  // Summary style
  const summaryStyle = {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1f2937',
    marginBottom: '8px',
    textAlign: 'center'
  };
  
  // Detail style
  const detailStyle = {
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'center'
  };
  
  // Parcelas table style
  const parcelasTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    fontSize: '12px'
  };
  
  // Table header style
  const tableHeaderStyle = {
    backgroundColor: '#e5e7eb',
    textAlign: 'left',
    padding: '6px 8px',
    color: '#4b5563',
    fontWeight: 500
  };
  
  // Table cell style
  const tableCellStyle = {
    padding: '6px 8px',
    borderBottom: '1px solid #e5e7eb'
  };

  // Formata o valor da parcela
  const valorParcelaFormatado = formatCurrency(valorPorParcela);
  
  // Calcula a data da primeira parcela
  const dataPrimeiraParcela = calcularDataPrimeiraParcela();
  
  // Obtém a lista de parcelas
  const parcelas = calcularProximasParcelas();
  
  // Calcula se existem muitas parcelas (mais de 3)
  const muitasParcelas = numeroParcelas > 3;
  
  // Limita a exibição para 3 parcelas + última se houver muitas
  const parcelasExibidas = muitasParcelas 
    ? [...parcelas.slice(0, 3), parcelas[parcelas.length - 1]] 
    : parcelas;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Simulação de Parcelamento</span>
        <span style={totalStyle}>{formatCurrency(valorTotal)}</span>
      </div>
      
      <div style={summaryStyle}>
        {valorTotal > 0 
          ? `${formatCurrency(valorTotal)} em ${numeroParcelas}x de ${valorParcelaFormatado}` 
          : 'Informe o valor da compra para visualizar o parcelamento'}
      </div>
      
      {dataPrimeiraParcela && (
        <div style={detailStyle}>
          Primeira parcela em: {dataPrimeiraParcela}
        </div>
      )}
      
      {/* Tabela detalhada de parcelas (mostrada apenas se tiver parcelas) */}
      {parcelas.length > 0 && (
        <table style={parcelasTableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Parcela</th>
              <th style={tableHeaderStyle}>Vencimento</th>
              <th style={tableHeaderStyle}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {parcelasExibidas.map((parcela, index) => (
              // Se for a quarta parcela e tiver muitas, mostra reticências
              index === 3 && muitasParcelas && parcelas.length > 4 ? (
                <tr key="gap">
                  <td style={tableCellStyle} colSpan="3" align="center">...</td>
                </tr>
              ) : (
                <tr key={parcela.numero}>
                  <td style={tableCellStyle}>{parcela.numero}ª</td>
                  <td style={tableCellStyle}>{parcela.data}</td>
                  <td style={tableCellStyle}>{formatCurrency(parcela.valor)}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

PreviewParcelamento.propTypes = {
  valorTotal: PropTypes.number,
  numeroParcelas: PropTypes.number,
  dataCompra: PropTypes.string,
  diaFechamento: PropTypes.number,
  diaVencimento: PropTypes.number
};

export default PreviewParcelamento;