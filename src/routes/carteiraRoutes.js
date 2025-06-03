const express = require('express');
const router = express.Router();

// GET /api/carteira
router.get('/', (req, res) => {
  res.json({ message: 'Listar carteira (não implementado)' });
});

module.exports = router; 