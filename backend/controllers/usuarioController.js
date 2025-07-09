const db = require('../config/database');

// POST /api/usuario/atualizar-hora-negociacao
// Função auxiliar para manipular horários sem dependência externa
const addMinutesToTime = (timeString, minutes) => {
  const [hours, minutesStr, seconds] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutesStr + minutes, seconds);
  return date.toTimeString().slice(0, 8); // Retorna HH:mm:ss
};

const atualizarHoraNegociacao = async (req, res) => {
  try {
    const { incrementoMinutos } = req.body; // Pode ser 1 ou 5
    const userId = req.userId;

    if (![1, 5].includes(incrementoMinutos)) {
      return res.status(400).json({ message: 'Incremento inválido' });
    }

    // Busca a hora atual de negociação do usuário
    const [rows] = await db.query(
      'SELECT ultima_hora_negociacao FROM usuario WHERE id = ?',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const horaAtual = rows[0].ultima_hora_negociacao;

    // Avança os minutos
    const novaHora = addMinutesToTime(horaAtual, incrementoMinutos);

    // Atualiza no banco
    await db.query(
      'UPDATE usuario SET ultima_hora_negociacao = ? WHERE id = ?',
      [novaHora, userId]
    );

    res.json({ 
      message: `Hora de negociação atualizada (+${incrementoMinutos} min)`,
      hora_negociacao: novaHora
    });
  } catch (error) {
    console.error('Erro ao atualizar hora de negociação:', error);
    res.status(500).json({ message: 'Erro ao atualizar hora de negociação' });
  }
};


module.exports = {
  atualizarHoraNegociacao
}; 