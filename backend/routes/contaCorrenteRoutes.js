const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const contaCorrenteController = require('../controllers/contaCorrenteController');

// GET /api/conta-corrente
router.get('/', verifyToken, contaCorrenteController.listarLancamentos);

// POST /api/conta-corrente/deposito
router.post('/deposito', verifyToken, contaCorrenteController.registrarDeposito);

// POST /api/conta-corrente/retirada
router.post('/retirada', verifyToken, contaCorrenteController.registrarRetirada);

module.exports = router; 