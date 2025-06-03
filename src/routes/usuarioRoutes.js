const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const db = require('../config/database');

// POST /api/usuario/atualizar-hora-negociacao
router.post('/atualizar-hora-negociacao', verifyToken, async (req, res) => {
  try {
    const { novaHora } = req.body;
    // Validação simples do formato HH:mm
    if (!/^\d{2}:\d{2}$/.test(novaHora)) {
      return res.status(400).json({ message: 'Formato de hora inválido. Use HH:mm.' });
    }
    // Atualiza no banco
    await db.query(
      'UPDATE usuario SET ultima_hora_negociacao = ? WHERE id = ?',
      [novaHora, req.userId]
    );
    res.json({
      message: 'Hora de negociação atualizada com sucesso',
      horaNegociacao: novaHora
    });
  } catch (error) {
    console.error('Erro ao atualizar hora de negociação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router; 