const axios = require('axios');

// Cache de preços das ações (atualizado a cada minuto)
let cachePrecos = {};
let ultimaAtualizacao = null;
const TEMPO_CACHE = 60 * 1000; // 1 minuto em milissegundos

async function atualizarPrecos() {
  try {
    // Busca o minuto atual
    const agora = new Date();
    const minuto = agora.getMinutes();
    console.log(`Atualizando preços do minuto ${minuto}...`);
    
    // Busca os preços da API do professor
    const url = `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/${minuto}.json`;
    console.log(`Buscando preços em: ${url}`);
    const response = await axios.get(url);
    const precos = response.data;
    console.log(`Preços recebidos:`, precos);
    
    // Atualiza o cache
    cachePrecos = precos.reduce((acc, acao) => {
      acc[acao.ticker] = {
        ticker: acao.ticker,
        preco_atual: acao.preco,
        variacao_dia: 0, // A API não fornece variação
        variacao_percentual_dia: 0 // A API não fornece variação percentual
      };
      return acc;
    }, {});
    
    ultimaAtualizacao = agora;
    console.log('Cache atualizado:', cachePrecos);
    
    return cachePrecos;
  } catch (error) {
    console.error('Erro ao atualizar preços:', error.message);
    if (error.response) {
      console.error('Resposta da API:', error.response.data);
      console.error('Status:', error.response.status);
    }
    throw error;
  }
}

async function getPrecosAcoes(tickers) {
  console.log('Buscando preços para tickers:', tickers);
  
  // Verifica se os tickers estão disponíveis
  const tickersDisponiveis = await getTickersDisponiveis();
  const tickersInvalidos = tickers.filter(ticker => !tickersDisponiveis.includes(ticker));
  
  if (tickersInvalidos.length > 0) {
    console.log('Tickers inválidos:', tickersInvalidos);
    throw new Error(`Tickers não disponíveis: ${tickersInvalidos.join(', ')}`);
  }
  
  // Se o cache estiver vazio ou expirado, atualiza
  if (!ultimaAtualizacao || (new Date() - ultimaAtualizacao) > TEMPO_CACHE) {
    console.log('Cache expirado ou vazio, atualizando...');
    await atualizarPrecos();
  } else {
    console.log('Usando cache existente');
  }

  // Retorna os preços das ações solicitadas
  const precos = tickers.map(ticker => {
    const preco = cachePrecos[ticker] || {
      ticker,
      preco_atual: null,
      variacao_dia: null,
      variacao_percentual_dia: null
    };
    console.log(`Preço para ${ticker}:`, preco);
    return preco;
  });

  return precos;
}

// Função para buscar a lista de tickers disponíveis
async function getTickersDisponiveis() {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/tickers.json');
    return response.data.map(acao => acao.ticker);
  } catch (error) {
    console.error('Erro ao buscar tickers disponíveis:', error);
    throw error;
  }
}

module.exports = {
  getPrecosAcoes,
  atualizarPrecos,
  getTickersDisponiveis
}; 