const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

const acoesController = require('../controllers/acoesController');

// POST /api/acoes/interesse
router.post('/interesse', verifyToken, acoesController.interesse);

// DELETE /api/acoes/interesse/:ticker
router.delete('/interesse/:ticker', verifyToken, acoesController.deletar);

// POST /api/acoes/interesse/:ticker/sobe
router.post('/interesse/:ticker/sobe', verifyToken, acoesController.ordemTickerSobe);

// POST /api/acoes/interesse/:ticker/desce
router.post('/interesse/:ticker/desce', verifyToken, acoesController.ordemTickerDesce);

// GET /api/acoes/interesse
router.get('/interesse', verifyToken, acoesController.ordensUsuario);

module.exports = router; 