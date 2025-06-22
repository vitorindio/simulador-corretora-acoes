const db = require('../config/database');
const {getPrecosAcoes} = require("../services/acoesService");

const interesse = async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) {
      return res.status(400).json({ message: 'Ticker é obrigatório' });
    }

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

    await db.query(
      'INSERT INTO acao_interesse (id_usuario, ticker, ordem) VALUES (?, ?, ?)',
      [req.userId, ticker, ordem]
    );

    res.status(201).json({ message: 'Ação adicionada à lista de interesse' });
  } catch (error) {
    console.error('Erro ao adicionar ação de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

const deletar = async (req, res) => {
  try {
    const { ticker } = req.params;
    const result = await db.query(
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
      const acoes = await db.query('SELECT id, ordem FROM acao_interesse WHERE id_usuario = ? AND ticker = ?', [req.userId, ticker]);
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
    // Busca as ações de interesse do usuário
    const [acoesInteresse] = await db.query(`
      SELECT ticker, ordem
      FROM acao_interesse
      WHERE id_usuario = ?
      ORDER BY ordem ASC
    `, [req.userId]);

    console.log('Ações de interesse do usuário:', acoesInteresse);

    // Busca os preços atuais das ações
    const tickers = acoesInteresse.map(acao => acao.ticker);
    const precos = await getPrecosAcoes(tickers);

    // Combina os dados
    const acoes = acoesInteresse.map(acao => ({
      ...acao,
      ...precos.find(p => p.ticker === acao.ticker)
    }));

    res.json({ acoes });
  } catch (error) {
    console.error('Erro ao listar ações de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}


module.exports = {
  interesse,
  deletar,
  ordemTickerSobe,
  ordemTickerDesce,
  ordensUsuario
};