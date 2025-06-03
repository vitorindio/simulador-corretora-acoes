const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const db = require('../config/database');

// POST /api/acoes/interesse
router.post('/interesse', verifyToken, async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) {
      return res.status(400).json({ message: 'Ticker é obrigatório' });
    }
    // Verifica se já existe
    const existe = await db.query(
      'SELECT id FROM acoes_interesse WHERE id_usuario = ? AND ticker = ?',
      [req.userId, ticker]
    );
    if (existe.length > 0) {
      return res.status(400).json({ message: 'Ação já existe na lista de interesse' });
    }
    // Descobre a próxima ordem
    const maxOrdem = await db.query(
      'SELECT MAX(ordem) as maxOrdem FROM acoes_interesse WHERE id_usuario = ?',
      [req.userId]
    );
    const ordem = (maxOrdem[0].maxOrdem || 0) + 1;
    await db.query(
      'INSERT INTO acoes_interesse (id_usuario, ticker, ordem) VALUES (?, ?, ?)',
      [req.userId, ticker, ordem]
    );
    res.status(201).json({ message: 'Ação adicionada à lista de interesse' });
  } catch (error) {
    console.error('Erro ao adicionar ação de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/acoes/interesse/:ticker
router.delete('/interesse/:ticker', verifyToken, async (req, res) => {
  try {
    const { ticker } = req.params;
    const result = await db.query(
      'DELETE FROM acoes_interesse WHERE id_usuario = ? AND ticker = ?',
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
});

// POST /api/acoes/interesse/:ticker/subir
router.post('/interesse/:ticker/subir', verifyToken, async (req, res) => {
  try {
    const { ticker } = req.params;
    // Busca a ação e a ordem atual
    const acoes = await db.query(
      'SELECT id, ordem FROM acoes_interesse WHERE id_usuario = ? AND ticker = ?',
      [req.userId, ticker]
    );
    if (acoes.length === 0) {
      return res.status(404).json({ message: 'Ação não encontrada na lista de interesse' });
    }
    const { id, ordem } = acoes[0];
    if (ordem === 1) {
      return res.status(400).json({ message: 'Ação já está no topo' });
    }
    // Busca a ação acima
    const acima = await db.query(
      'SELECT id, ordem FROM acoes_interesse WHERE id_usuario = ? AND ordem = ?',
      [req.userId, ordem - 1]
    );
    if (acima.length === 0) {
      return res.status(400).json({ message: 'Não é possível subir' });
    }
    // Troca as ordens
    await db.query('UPDATE acoes_interesse SET ordem = ? WHERE id = ?', [ordem - 1, id]);
    await db.query('UPDATE acoes_interesse SET ordem = ? WHERE id = ?', [ordem, acima[0].id]);
    res.json({ message: 'Ordem da ação atualizada' });
  } catch (error) {
    console.error('Erro ao subir ação de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/acoes/interesse/:ticker/descer
router.post('/interesse/:ticker/descer', verifyToken, async (req, res) => {
  try {
    const { ticker } = req.params;
    // Busca a ação e a ordem atual
    const acoes = await db.query(
      'SELECT id, ordem FROM acoes_interesse WHERE id_usuario = ? AND ticker = ?',
      [req.userId, ticker]
    );
    if (acoes.length === 0) {
      return res.status(404).json({ message: 'Ação não encontrada na lista de interesse' });
    }
    const { id, ordem } = acoes[0];
    // Busca a ação abaixo
    const abaixo = await db.query(
      'SELECT id, ordem FROM acoes_interesse WHERE id_usuario = ? AND ordem = ?',
      [req.userId, ordem + 1]
    );
    if (abaixo.length === 0) {
      return res.status(400).json({ message: 'Ação já está na base' });
    }
    // Troca as ordens
    await db.query('UPDATE acoes_interesse SET ordem = ? WHERE id = ?', [ordem + 1, id]);
    await db.query('UPDATE acoes_interesse SET ordem = ? WHERE id = ?', [ordem, abaixo[0].id]);
    res.json({ message: 'Ordem da ação atualizada' });
  } catch (error) {
    console.error('Erro ao descer ação de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/acoes/interesse
router.get('/interesse', verifyToken, async (req, res) => {
  try {
    const acoes = await db.query(
      'SELECT ticker, ordem FROM acoes_interesse WHERE id_usuario = ? ORDER BY ordem ASC',
      [req.userId]
    );
    res.json({ acoes });
  } catch (error) {
    console.error('Erro ao listar ações de interesse:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router; 