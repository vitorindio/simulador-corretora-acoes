const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const usuarioController = require('../controllers/usuarioController');

// POST /api/usuario/atualizar-hora-negociacao
router.post('/atualizar-hora-negociacao', verifyToken, usuarioController.atualizarHoraNegociacao);

module.exports = router; 