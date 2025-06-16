const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Rotas públicas
router.post('/', usuarioController.cadastrar);
router.post('/login', usuarioController.login);
router.post('/esqueci', usuarioController.recuperarSenha);
router.post('/resetar', usuarioController.resetarSenha);

module.exports = router; 