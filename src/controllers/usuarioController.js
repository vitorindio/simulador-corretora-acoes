const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Funções auxiliares
const gerarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Controllers
const cadastrar = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verifica se usuário já existe
    const [usuarios] = await db.query('SELECT * FROM usuario WHERE email = ?', [email]);
    if (usuarios.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere usuário
    const [result] = await db.query(
      'INSERT INTO usuario (email, senha_hash) VALUES (?, ?)',
      [email, senhaHash]
    );

    // Retorna apenas os dados do usuário (sem senha)
    res.status(201).json({ 
      id: result.insertId,
      email: email,
      message: 'Usuário cadastrado com sucesso. Faça login para obter o token de acesso.'
    });
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
  }
};

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Busca usuário
    const [usuarios] = await db.query('SELECT * FROM usuario WHERE email = ?', [email]);
    if (usuarios.length === 0) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    const usuario = usuarios[0];

    // Verifica senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      // Incrementa número de falhas
      await db.query(
        'UPDATE usuario SET numero_falhas_login = numero_falhas_login + 1 WHERE id = ?',
        [usuario.id]
      );
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Reseta número de falhas
    await db.query(
      'UPDATE usuario SET numero_falhas_login = 0 WHERE id = ?',
      [usuario.id]
    );

    // Gera token
    const token = gerarToken(usuario);

    res.json({ token });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

const recuperarSenha = async (req, res) => {
  try {
    const { email } = req.body;

    // Busca usuário
    const [usuarios] = await db.query('SELECT * FROM usuario WHERE email = ?', [email]);
    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Gera token de recuperação
    const token = jwt.sign(
      { id: usuarios[0].id, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Atualiza token no banco
    await db.query(
      'UPDATE usuario SET token_rec_senha = ?, data_token_rs = NOW() WHERE id = ?',
      [token, usuarios[0].id]
    );

    // TODO: Enviar email com token

    res.json({ message: 'Email de recuperação enviado' });
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    res.status(500).json({ message: 'Erro ao recuperar senha' });
  }
};

const resetarSenha = async (req, res) => {
  try {
    const { token, nova_senha } = req.body;

    // Verifica token
    const [usuarios] = await db.query(
      'SELECT * FROM usuario WHERE token_rec_senha = ? AND data_token_rs > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
      [token]
    );

    if (usuarios.length === 0) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(nova_senha, 10);

    // Atualiza senha e limpa token
    await db.query(
      'UPDATE usuario SET senha_hash = ?, token_rec_senha = NULL, data_token_rs = NULL WHERE id = ?',
      [senhaHash, usuarios[0].id]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ message: 'Erro ao resetar senha' });
  }
};

module.exports = {
  cadastrar,
  login,
  recuperarSenha,
  resetarSenha
}; 