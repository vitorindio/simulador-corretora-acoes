const db = require('../config/database');
const {getPrecosAcoes, getAcoesComVariação, getTickersDisponiveis} = require("../services/acoesService");

// Função para inicializar lista de interesse com 10 ações aleatórias
const inicializarListaInteresse = async (userId) => {
  try {
    // Busca todos os tickers disponíveis
    const tickersDisponiveis = await getTickersDisponiveis();
    
    // Seleciona 10 tickers aleatórios
    const tickersAleatorios = [];
    const tickersCopy = [...tickersDisponiveis];
    
    for (let i = 0; i < 10 && tickersCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * tickersCopy.length);
      tickersAleatorios.push(tickersCopy[randomIndex]);
      tickersCopy.splice(randomIndex, 1);
    }
    
    // Insere os tickers na lista de interesse do usuário
    for (let i = 0; i < tickersAleatorios.length; i++) {
      await db.query(
        'INSERT INTO acao_interesse (id_usuario, ticker, ordem) VALUES (?, ?, ?)',
        [userId, tickersAleatorios[i], i + 1]
      );
    }
    
    console.log(`Lista de interesse inicializada para usuário ${userId} com ${tickersAleatorios.length} ações`);
    return tickersAleatorios;
  } catch (error) {
    console.error('Erro ao inicializar lista de interesse:', error);
    throw error;
  }
};

// Função para verificar e inicializar lista de interesse se necessário
const verificarEInicializarLista = async (userId) => {
  try {
    // Verifica se o usuário já tem ações na lista de interesse
    const [acoesExistentes] = await db.query(
      'SELECT COUNT(*) as total FROM acao_interesse WHERE id_usuario = ?',
      [userId]
    );
    
    if (acoesExistentes[0].total === 0) {
      console.log(`Usuário ${userId} não tem ações na lista de interesse. Inicializando...`);
      await inicializarListaInteresse(userId);
      return true; // Indica que foi inicializado
    }
    
    return false; // Indica que já tinha ações
  } catch (error) {
    console.error('Erro ao verificar lista de interesse:', error);
    throw error;
  }
};

const interesse = async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) {
      return res.status(400).json({ message: 'Ticker é obrigatório' });
    }

    console.log('Adicionando ação de interesse:', { userId: req.userId, ticker });

    // Verifica se já existe
    const [existe] = await db.query(
      'SELECT id FROM acao_interesse WHERE id_usuario = ? AND ticker = ?',
      [req.userId, ticker]
    );
    if (existe.length > 0) {
      return res.status(400).json({ message: 'Ação já existe na lista de interesse' });
    }

    // Descobre a próxima ordem
    const [maxOrdem] = await db.query(
      'SELECT MAX(ordem) as maxOrdem FROM acao_interesse WHERE id_usuario = ?',
      [req.userId]
    );
    const ordem = (maxOrdem[0].maxOrdem || 0) + 1;

    console.log('Inserindo ação:', { userId: req.userId, ticker, ordem });

    const query = 'INSERT INTO acao_interesse (id_usuario, ticker, ordem) VALUES (?, ?, ?)';
    const params = [req.userId, ticker, ordem];
    console.log('Query:', query, 'Params:', params);
    
    await db.query(query, params);

    res.status(201).json({ message: 'Ação adicionada à lista de interesse' });
  } catch (error) {
    console.error('Erro ao adicionar ação de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

const deletar = async (req, res) => {
  try {
    const { ticker } = req.params;
    const [result] = await db.query(
      'DELETE FROM acao_interesse WHERE id_usuario = ? AND ticker = ?',
      [req.userId, ticker]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ação não encontrada na lista de interesse' });
    }
    res.json({ message: 'Ação removida da lista de interesse' });
  } catch (error) {
    console.error('Erro ao remover ação de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

const ordemTickerSobe = async (req, res) => {
  try {
      const { ticker } = req.params;
      // Busca a ação atual
      const [acoes] = await db.query('SELECT id, ordem FROM acao_interesse WHERE id_usuario = ? AND ticker = ?', [req.userId, ticker]);
      if (acoes.length === 0) {
        return res.status(404).json({ message: 'Ação não encontrada na lista de interesse' });
      }
      const acao = acoes[0];
      if (acao.ordem === 1) {
        return res.status(400).json({ message: 'Ação já está no topo da lista' });
      }
      // Busca a ação acima
      const acima = await db.query('SELECT id, ordem, ticker FROM acao_interesse WHERE id_usuario = ? AND ordem = ?', [req.userId, acao.ordem - 1]);
      if (acima.length === 0) {
        return res.status(400).json({ message: 'Não há ação acima para trocar' });
      }
      // Troca as ordens
      await db.query('UPDATE acao_interesse SET ordem = ? WHERE id = ?', [acao.ordem - 1, acao.id]);
      await db.query('UPDATE acao_interesse SET ordem = ? WHERE id = ?', [acao.ordem, acima[0].id]);
      res.json({ message: 'Ação movida para cima com sucesso' });
    } catch (error) {
      console.error('Erro ao subir ação de interesse:', error);
      res.status(500).json({ message: 'Erro interno do servidor' }); 
    }
  }

const ordemTickerDesce = async (req, res) => {
  try {
      const { ticker } = req.params;
      // Busca a ação atual
      const [acoes] = await db.query('SELECT id, ordem FROM acao_interesse WHERE id_usuario = ? AND ticker = ?', [req.userId, ticker]);
      if (acoes.length === 0) {
        return res.status(404).json({ message: 'Ação não encontrada na lista de interesse' });
      }
      const acao = acoes[0];
      // Busca a ação abaixo
      const abaixo = await db.query('SELECT id, ordem, ticker FROM acao_interesse WHERE id_usuario = ? AND ordem = ?', [req.userId, acao.ordem + 1]);
      if (abaixo.length === 0) {
        return res.status(400).json({ message: 'Ação já está na última posição' });
      }
      // Troca as ordens
      await db.query('UPDATE acao_interesse SET ordem = ? WHERE id = ?', [acao.ordem + 1, acao.id]);
      await db.query('UPDATE acao_interesse SET ordem = ? WHERE id = ?', [acao.ordem, abaixo[0].id]);
      res.json({ message: 'Ação movida para baixo com sucesso' });
    } catch (error) {
      console.error('Erro ao descer ação de interesse:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

const ordensUsuario = async (req, res) => {
  try {
    // Verifica e inicializa lista de interesse se necessário
    await verificarEInicializarLista(req.userId);
    
    // Busca as ações de interesse do usuário
    const [acoesInteresse] = await db.query(`
      SELECT ticker, ordem
      FROM acao_interesse
      WHERE id_usuario = ?
      ORDER BY ordem ASC
    `, [req.userId]);

    // Busca o minuto simulado da query string
    let minuto = req.query.minuto ? parseInt(req.query.minuto, 10) : null;
    if (minuto === null || isNaN(minuto) || minuto < 0 || minuto > 59) {
      // Se não for informado, usa o minuto atual
      minuto = new Date().getMinutes();
    }

    // Busca os preços e variações corretos para os tickers de interesse
    const tickers = acoesInteresse.map(acao => acao.ticker);
    const precos = await getAcoesComVariação({ tickers, minuto });

    // Combina os dados mantendo a ordem de interesse
    const acoes = acoesInteresse.map(acao => ({
      ...acao,
      ...precos.find(p => p.ticker === acao.ticker)
    }));

    res.json(acoes);
  } catch (error) {
    console.error('Erro ao listar ações de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

// GET /api/acoes?minuto=XX
const listarAcoes = async (req, res) => {
  try {
    let minuto = req.query.minuto ? parseInt(req.query.minuto, 10) : null;
    if (minuto === null || isNaN(minuto) || minuto < 0 || minuto > 59) {
      // Se não for informado, usa o minuto atual
      minuto = new Date().getMinutes();
    }
    // Busca todos os tickers disponíveis
    const tickers = await getTickersDisponiveis();
    // Busca os preços e variações para todos os tickers
    const acoes = await getAcoesComVariação({ tickers, minuto });
    res.json(acoes);
  } catch (error) {
    console.error('Erro ao buscar ações do mercado:', error);
    res.status(500).json({ message: 'Erro ao buscar ações do mercado', error: error.message });
  }
};


module.exports = {
  interesse,
  deletar,
  ordemTickerSobe,
  ordemTickerDesce,
  ordensUsuario,
  listarAcoes
};