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
    console.log('1. Tentativa de login para email:', email);
    console.log('2. Senha fornecida:', senha);

    // Busca o usuário
    const users = await db.query(
      'SELECT id, email, senha_hash, numero_falhas_login FROM usuario WHERE email = ?',
      [email]
    );
    console.log('3. Resultado da query:', JSON.stringify(users, null, 2));

    const user = users[0];
    console.log('4. Usuário selecionado:', JSON.stringify(user, null, 2));

    // Verifica se o usuário existe
    if (!user) {
      console.log('5. Usuário não encontrado');
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Verifica se o usuário está bloqueado
    if (user.numero_falhas_login >= 3) {
      console.log('6. Usuário bloqueado por excesso de tentativas');
      return res.status(403).json({ message: 'Usuário bloqueado por excesso de tentativas de login' });
    }

    // Verifica a senha
    console.log('7. Comparando senhas:');
    console.log('   - Senha fornecida:', senha);
    console.log('   - Hash armazenado:', user.senha_hash);
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    console.log('8. Senha válida?', senhaValida);

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
    console.log('1. Tentativa de criar conta para email:', email);

    // Verifica se o email já existe
    const checkQuery = await db.query('SELECT id FROM usuario WHERE email = ?', [email]);
    console.log('2. Resultado da verificação:', JSON.stringify(checkQuery, null, 2));

    if (checkQuery[0] && checkQuery[0].length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);
    console.log('3. Senha criptografada gerada');

    // Cria o usuário
    const insertResult = await db.query(
      'INSERT INTO usuario (email, senha_hash, numero_falhas_login) VALUES (?, ?, 0)',
      [email, senhaHash]
    );
    console.log('4. Resultado da inserção:', insertResult);

    // O resultado da inserção contém o insertId
    if (!insertResult || !insertResult.insertId) {
      throw new Error('Não foi possível recuperar o ID do usuário criado');
    }

    res.status(201).json({
      message: 'Conta criada com sucesso',
      userId: insertResult.insertId
    });

  } catch (error) {
    console.error('Erro detalhado:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Solicitar token de recuperação de senha
router.post('/token-nova-senha', async (req, res) => {
  try {
    const { email } = req.body;

    // Verifica se o email existe
    const users = await db.query(
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
    const users = await db.query(
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
    const users = await db.query(
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