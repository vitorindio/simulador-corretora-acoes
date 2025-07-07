const axios = require('axios');

// Cache de preços das ações (atualizado a cada minuto)
let cachePrecos = {};
let ultimaAtualizacao = null;
const TEMPO_CACHE = 60 * 1000; // 1 minuto em milissegundos

const TICKERS_URL = 'https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/tickers.json';
const PRECO_MINUTO_URL = (minuto) => `https://raw.githubusercontent.com/marciobarros/dsw-simulador-corretora/refs/heads/main/${minuto}.json`;

async function atualizarPrecos() {
  try {
    // Busca o minuto atual
    const agora = new Date();
    const minuto = agora.getMinutes();
    console.log(`Atualizando preços do minuto ${minuto}...`);
    
    // Busca os preços da API do professor
    const url = PRECO_MINUTO_URL(minuto);
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
    const response = await axios.get(TICKERS_URL);
    return response.data.map(acao => acao.ticker);
  } catch (error) {
    console.error('Erro ao buscar tickers disponíveis:', error);
    throw error;
  }
}

// Busca tickers e preços de fechamento
async function getFechamentos() {
  const response = await axios.get(TICKERS_URL);
  // [{ ticker, fechamento }]
  return response.data;
}

// Busca preços atuais para o minuto simulado
async function getPrecosAtuais(minuto) {
  const response = await axios.get(PRECO_MINUTO_URL(minuto));
  // [{ ticker, preco }]
  return response.data;
}

// Serviço principal: retorna lista de ações com preços e variações
async function getAcoesComVariação({ tickers, minuto }) {
  if (typeof minuto !== 'number' || minuto < 0 || minuto > 59) {
    throw new Error('Minuto simulado inválido (deve ser 0-59)');
  }
  const [fechamentos, precosAtuais] = await Promise.all([
    getFechamentos(),
    getPrecosAtuais(minuto)
  ]);

  // Monta mapa para acesso rápido
  const mapFechamento = Object.fromEntries(fechamentos.map(a => [a.ticker, a.fechamento]));
  const mapPrecoAtual = Object.fromEntries(precosAtuais.map(a => [a.ticker, a.preco]));

  // Se tickers não for passado, retorna todos
  const listaTickers = tickers && tickers.length > 0 ? tickers : Object.keys(mapFechamento);

  // Monta resultado
  const resultado = listaTickers
    .filter(ticker => mapFechamento[ticker] !== undefined && mapPrecoAtual[ticker] !== undefined)
    .map(ticker => {
      const fechamento = mapFechamento[ticker];
      const preco_atual = mapPrecoAtual[ticker];
      const variacao_nominal = +(preco_atual - fechamento).toFixed(2);
      const variacao_percentual = +(((preco_atual - fechamento) / fechamento) * 100).toFixed(2);
      return {
        ticker,
        preco_atual,
        fechamento,
        variacao_nominal,
        variacao_percentual
      };
    });
  return resultado;
}

module.exports = {
  getPrecosAcoes,
  atualizarPrecos,
  getTickersDisponiveis,
  getFechamentos,
  getPrecosAtuais,
  getAcoesComVariação
}; 