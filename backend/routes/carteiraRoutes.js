const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const carteiraController = require('../controllers/carteiraController');

// GET /api/carteira
router.get('/', verifyToken, carteiraController.listarCarteira);

// GET /api/carteira/total-investido
router.get('/total-investido', verifyToken, carteiraController.getTotalInvestido);

module.exports = router;
