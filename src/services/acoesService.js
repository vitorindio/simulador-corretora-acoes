const axios = require('axios');

// Cache de preços das ações (atualizado a cada 5 minutos)
let cachePrecos = {};
let ultimaAtualizacao = null;
const TEMPO_CACHE = 5 * 60 * 1000; // 5 minutos em milissegundos

async function atualizarPrecos() {
  try {
    // Lista de ações para buscar (você pode expandir essa lista)
    const tickers = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'B3SA3', 'BBAS3', 'WEGE3', 'MGLU3', 'HAPV3'];
    
    // Aqui você deve substituir pela sua API de cotação preferida
    // Este é um exemplo usando a API do Yahoo Finance
    const promises = tickers.map(async (ticker) => {
      try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.SA`);
        const data = response.data.chart.result[0];
        const quote = data.meta;
        
        return {
          ticker,
          preco_atual: quote.regularMarketPrice,
          variacao_dia: quote.regularMarketChange,
          variacao_percentual_dia: quote.regularMarketChangePercent
        };
      } catch (error) {
        console.error(`Erro ao buscar preço de ${ticker}:`, error);
        return {
          ticker,
          preco_atual: null,
          variacao_dia: null,
          variacao_percentual_dia: null
        };
      }
    });

    const resultados = await Promise.all(promises);
    
    // Atualiza o cache
    cachePrecos = resultados.reduce((acc, acao) => {
      acc[acao.ticker] = acao;
      return acc;
    }, {});
    
    ultimaAtualizacao = new Date();
    
    return cachePrecos;
  } catch (error) {
    console.error('Erro ao atualizar preços:', error);
    throw error;
  }
}

async function getPrecosAcoes(tickers) {
  // Se o cache estiver vazio ou expirado, atualiza
  if (!ultimaAtualizacao || (new Date() - ultimaAtualizacao) > TEMPO_CACHE) {
    await atualizarPrecos();
  }

  // Retorna os preços das ações solicitadas
  return tickers.map(ticker => cachePrecos[ticker] || {
    ticker,
    preco_atual: null,
    variacao_dia: null,
    variacao_percentual_dia: null
  });
}

module.exports = {
  getPrecosAcoes,
  atualizarPrecos
}; 