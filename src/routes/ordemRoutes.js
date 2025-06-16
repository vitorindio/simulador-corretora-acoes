const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ordemController = require('../controllers/ordemController');

// Middleware de autenticação para todas as rotas
router.use(verifyToken);

// Rotas de Ordem de Compra
router.post('/compra', ordemController.criarOrdemCompra);
router.post('/compra/:id/executar', ordemController.executarOrdemCompra);
router.get('/compra', ordemController.listarOrdensCompra);
router.delete('/compra/:id', ordemController.cancelarOrdemCompra);

// Rotas de Ordem de Venda
router.post('/venda', ordemController.criarOrdemVenda);
router.post('/venda/:id/executar', ordemController.executarOrdemVenda);
router.get('/venda', ordemController.listarOrdensVenda);
router.delete('/venda/:id', ordemController.cancelarOrdemVenda);

// Rota para listar todas as ordens pendentes
router.get('/pendentes', ordemController.listarOrdensPendentes);

module.exports = router; 