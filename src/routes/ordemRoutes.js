const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const db = require('../config/database');

// POST /api/ordens/compra
router.post('/compra', verifyToken, async (req, res) => {
  try {
    const { ticker, quantidade, modo, precoReferencia } = req.body;
    if (!ticker || !quantidade || !modo || (modo === 'limite' && !precoReferencia)) {
      return res.status(400).json({ message: 'Dados obrigatórios faltando' });
    }
    if (quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que zero' });
    }
    if (modo !== 'mercado' && modo !== 'limite') {
      return res.status(400).json({ message: 'Modo deve ser "mercado" ou "limite"' });
    }
    if (modo === 'limite' && precoReferencia <= 0) {
      return res.status(400).json({ message: 'Preço de referência deve ser maior que zero' });
    }
    // Salva ordem
    const result = await db.query(
      'INSERT INTO ordem_compra (id_usuario, data_hora, ticker, quantidade, modo, preco_referencia) VALUES (?, NOW(), ?, ?, ?, ?)',
      [req.userId, ticker, quantidade, modo, precoReferencia || null]
    );
    res.status(201).json({ message: 'Ordem de compra registrada com sucesso', idOrdem: result.insertId });
  } catch (error) {
    console.error('Erro ao registrar ordem de compra:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/ordens/compra/:id/executar
router.post('/compra/:id/executar', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Busca ordem
    const ordens = await db.query(
      'SELECT * FROM ordem_compra WHERE id = ? AND id_usuario = ?',
      [id, req.userId]
    );
    if (ordens.length === 0) {
      return res.status(404).json({ message: 'Ordem não encontrada' });
    }
    const ordem = ordens[0];
    if (ordem.executada) {
      return res.status(400).json({ message: 'Ordem já executada' });
    }
    // Simula execução (atualiza como executada)
    await db.query(
      'UPDATE ordem_compra SET executada = 1, preco_execucao = ?, data_hora_execucao = NOW() WHERE id = ?',
      [ordem.preco_referencia || 0, id]
    );
    res.json({ message: 'Ordem de compra executada com sucesso' });
  } catch (error) {
    console.error('Erro ao executar ordem de compra:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/ordens/compra
router.get('/compra', verifyToken, async (req, res) => {
  try {
    const [ordens] = await db.query(
      'SELECT * FROM ordem_compra WHERE id_usuario = ? ORDER BY data_hora DESC',
      [req.userId]
    );
    res.json({ ordens });
  } catch (error) {
    console.error('Erro ao listar ordens de compra:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/ordens/venda
router.post('/venda', verifyToken, async (req, res) => {
  try {
    const { ticker, quantidade, modo, precoRepasse } = req.body;
    if (!ticker || !quantidade || !modo || (modo === 'limite' && !precoRepasse)) {
      return res.status(400).json({ message: 'Dados obrigatórios faltando' });
    }
    if (quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que zero' });
    }
    if (modo !== 'mercado' && modo !== 'limite') {
      return res.status(400).json({ message: 'Modo deve ser "mercado" ou "limite"' });
    }
    if (modo === 'limite' && precoRepasse <= 0) {
      return res.status(400).json({ message: 'Preço de repasse deve ser maior que zero' });
    }
    // Salva ordem
    const result = await db.query(
      'INSERT INTO ordem_venda (id_usuario, data_hora, ticker, quantidade, modo, preco_repasse) VALUES (?, NOW(), ?, ?, ?, ?)',
      [req.userId, ticker, quantidade, modo, precoRepasse || null]
    );
    res.status(201).json({ message: 'Ordem de venda registrada com sucesso', idOrdem: result.insertId });
  } catch (error) {
    console.error('Erro ao registrar ordem de venda:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/ordens/venda/:id/executar
router.post('/venda/:id/executar', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Busca ordem
    const ordens = await db.query(
      'SELECT * FROM ordem_venda WHERE id = ? AND id_usuario = ?',
      [id, req.userId]
    );
    if (ordens.length === 0) {
      return res.status(404).json({ message: 'Ordem não encontrada' });
    }
    const ordem = ordens[0];
    if (ordem.executada) {
      return res.status(400).json({ message: 'Ordem já executada' });
    }
    // Simula execução (atualiza como executada)
    await db.query(
      'UPDATE ordem_venda SET executada = 1, preco_execucao = ?, data_hora_execucao = NOW() WHERE id = ?',
      [ordem.preco_repasse || 0, id]
    );
    res.json({ message: 'Ordem de venda executada com sucesso' });
  } catch (error) {
    console.error('Erro ao executar ordem de venda:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/ordens/venda
router.get('/venda', verifyToken, async (req, res) => {
  try {
    const [ordens] = await db.query(
      'SELECT * FROM ordem_venda WHERE id_usuario = ? ORDER BY data_hora DESC',
      [req.userId]
    );
    res.json({ ordens });
  } catch (error) {
    console.error('Erro ao listar ordens de venda:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router; 