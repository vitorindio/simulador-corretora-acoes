const db = require('../config/database');

// GET /api/conta-corrente
const listarLancamentos = async (req, res) => {
  try {
    const [lancamentos] = await db.query(
      `SELECT id, historico, data_hora, tipo, valor, saldo
       FROM conta_corrente
       WHERE id_usuario = ?
       ORDER BY data_hora ASC, id ASC`,
      [req.userId]
    );
    res.json({ lancamentos });
  } catch (error) {
    console.error('Erro ao listar lançamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// POST /api/conta-corrente/deposito
const registrarDeposito = async (req, res) => {
  try {
    const { historico, valor } = req.body;
    if (!historico || !valor || valor <= 0) {
      return res.status(400).json({ message: 'Histórico e valor positivo são obrigatórios.' });
    }
    // Busca saldo atual
    const [[ultimo]] = await db.query(
      'SELECT saldo FROM conta_corrente WHERE id_usuario = ? ORDER BY data_hora DESC, id DESC LIMIT 1',
      [req.userId]
    );
    const saldoAnterior = ultimo ? Number(ultimo.saldo) : 0;
    const novoSaldo = saldoAnterior + Number(valor);
    await db.query(
      'INSERT INTO conta_corrente (id_usuario, historico, data_hora, tipo, valor, saldo) VALUES (?, ?, NOW(), ?, ?, ?)',
      [req.userId, historico, 'deposito', valor, novoSaldo]
    );
    res.status(201).json({ message: 'Depósito registrado com sucesso.' });
  } catch (error) {
    console.error('Erro ao registrar depósito:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// POST /api/conta-corrente/retirada
const registrarRetirada = async (req, res) => {
  try {
    const { historico, valor } = req.body;
    if (!historico || !valor || valor <= 0) {
      return res.status(400).json({ message: 'Histórico e valor positivo são obrigatórios.' });
    }
    // Busca saldo atual
    const [[ultimo]] = await db.query(
      'SELECT saldo FROM conta_corrente WHERE id_usuario = ? ORDER BY data_hora DESC, id DESC LIMIT 1',
      [req.userId]
    );
    const saldoAnterior = ultimo ? Number(ultimo.saldo) : 0;
    const novoSaldo = saldoAnterior - Number(valor);
    await db.query(
      'INSERT INTO conta_corrente (id_usuario, historico, data_hora, tipo, valor, saldo) VALUES (?, ?, NOW(), ?, ?, ?)',
      [req.userId, historico, 'retirada', valor, novoSaldo]
    );
    res.status(201).json({ message: 'Retirada registrada com sucesso.' });
  } catch (error) {
    console.error('Erro ao registrar retirada:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarLancamentos,
  registrarDeposito,
  registrarRetirada
}; 