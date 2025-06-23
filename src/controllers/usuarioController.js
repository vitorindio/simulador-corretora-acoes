const db = require('../config/database');

// POST /api/usuario/atualizar-hora-negociacao
const atualizarHoraNegociacao = async (req, res) => {
  try {
    const { hora_negociacao } = req.body;
    const userId = req.userId; // Vem do middleware de autenticação

    // Validação básica da hora
    if (!hora_negociacao || typeof hora_negociacao !== 'string') {
      return res.status(400).json({ message: 'Hora de negociação é obrigatória' });
    }

    // Atualiza a hora de negociação do usuário
    await db.query(
      'UPDATE usuario SET ultima_hora_negociacao = ? WHERE id = ?',
      [hora_negociacao, userId]
    );

    res.json({ 
      message: 'Hora de negociação atualizada com sucesso',
      hora_negociacao: hora_negociacao
    });
  } catch (error) {
    console.error('Erro ao atualizar hora de negociação:', error);
    res.status(500).json({ message: 'Erro ao atualizar hora de negociação' });
  }
};

module.exports = {
  atualizarHoraNegociacao
}; 