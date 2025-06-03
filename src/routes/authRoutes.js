const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Busca o usuário
    const [users] = await db.query(
      'SELECT id, email, senha_hash, numero_falhas_login FROM usuario WHERE email = ?',
      [email]
    );

    const user = users[0];

    // Verifica se o usuário existe
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Verifica se o usuário está bloqueado
    if (user.numero_falhas_login >= 3) {
      return res.status(403).json({ message: 'Usuário bloqueado por excesso de tentativas de login' });
    }

    // Verifica a senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      // Incrementa o contador de falhas
      await db.query(
        'UPDATE usuario SET numero_falhas_login = numero_falhas_login + 1 WHERE id = ?',
        [user.id]
      );
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Reseta o contador de falhas se o login for bem sucedido
    if (user.numero_falhas_login > 0) {
      await db.query(
        'UPDATE usuario SET numero_falhas_login = 0 WHERE id = ?',
        [user.id]
      );
    }

    // Gera o token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Logout (apenas invalida o token no frontend)
router.post('/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// Criar conta
router.post('/criar-conta', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verifica se o email já existe
    const [existingUsers] = await db.query(
      'SELECT id FROM usuario WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria o usuário
    const [result] = await db.query(
      'INSERT INTO usuario (email, senha_hash, numero_falhas_login) VALUES (?, ?, 0)',
      [email, senhaHash]
    );

    res.status(201).json({
      message: 'Conta criada com sucesso',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Solicitar token de recuperação de senha
router.post('/token-nova-senha', async (req, res) => {
  try {
    const { email } = req.body;

    // Verifica se o email existe
    const [users] = await db.query(
      'SELECT id FROM usuario WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Email não encontrado' });
    }

    // Gera um token aleatório
    const token = require('crypto').randomBytes(32).toString('hex');
    const dataExpiracao = new Date(Date.now() + 3600000); // 1 hora

    // Salva o token no banco
    await db.query(
      'UPDATE usuario SET token_rec_senha = ?, data_token_rs = ? WHERE id = ?',
      [token, dataExpiracao, users[0].id]
    );

    // TODO: Enviar email com o token
    // Por enquanto, apenas retorna o token (em produção, enviar por email)
    res.json({
      message: 'Token de recuperação de senha gerado com sucesso',
      token // Em produção, remover esta linha
    });
  } catch (error) {
    console.error('Erro ao gerar token de recuperação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Recuperar senha
router.post('/recuperar-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    // Verifica se o token existe e é válido
    const [users] = await db.query(
      'SELECT id FROM usuario WHERE token_rec_senha = ? AND data_token_rs > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    // Criptografa a nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualiza a senha e limpa o token
    await db.query(
      'UPDATE usuario SET senha_hash = ?, token_rec_senha = NULL, data_token_rs = NULL WHERE id = ?',
      [senhaHash, users[0].id]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Trocar senha (requer autenticação)
router.post('/trocar-senha', verifyToken, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    // Busca o usuário
    const [users] = await db.query(
      'SELECT senha_hash FROM usuario WHERE id = ?',
      [req.userId]
    );

    const user = users[0];

    // Verifica a senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, user.senha_hash);
    if (!senhaValida) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    // Criptografa a nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualiza a senha
    await db.query(
      'UPDATE usuario SET senha_hash = ? WHERE id = ?',
      [senhaHash, req.userId]
    );

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router; 