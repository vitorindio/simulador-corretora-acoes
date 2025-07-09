const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getFechamentos, getAcoesComVariação } = require('../services/acoesService');

const acoesController = require('../controllers/acoesController');

// POST /api/acoes/interesse
router.post('/interesse', verifyToken, acoesController.interesse);

// DELETE /api/acoes/interesse/:ticker
router.delete('/interesse/:ticker', verifyToken, acoesController.deletar);

// PUT /api/acoes/interesse/:ticker/subir
router.put('/interesse/:ticker/subir', verifyToken, acoesController.ordemTickerSobe);

// PUT /api/acoes/interesse/:ticker/descer
router.put('/interesse/:ticker/descer', verifyToken, acoesController.ordemTickerDesce);

// GET /api/acoes/interesse
router.get('/interesse', verifyToken, acoesController.ordensUsuario);

// GET /api/acoes/tickers
router.get('/tickers', verifyToken, async (req, res) => {
  try {
    const fechamentos = await getFechamentos();
    const tickers = fechamentos.map(a => a.ticker);
    res.json({ tickers });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tickers do mercado' });
  }
});

// GET /api/acoes?minuto=XX
router.get('/', verifyToken, acoesController.listarAcoes);

module.exports = router; 