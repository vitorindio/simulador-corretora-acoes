const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Rotas públicas
router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/criar-conta', authController.criarConta);
router.post('/token-nova-senha', authController.tokenNovaSenha);
router.post('/recuperar-senha', authController.recuperarSenha);

// Rota que requer autenticação
router.post('/trocar-senha', verifyToken, authController.trocarSenha);

module.exports = router; 