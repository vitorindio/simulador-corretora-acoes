const jwt = require('jsonwebtoken');

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
  // Verifica se o header de autorização existe
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  // Verifica se o token está no formato correto (Bearer <token>)
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Token mal formatado' });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: 'Token mal formatado' });
  }

  // Verifica o token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Adiciona o ID do usuário ao request
    req.userId = decoded.userId;
    return next();
  });
};

// Middleware para verificar se o usuário está bloqueado
const checkUserBlocked = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const [user] = await db.query(
      'SELECT numero_falhas_login FROM usuario WHERE id = ?',
      [req.userId]
    );

    if (user && user.numero_falhas_login >= 3) {
      return res.status(403).json({ message: 'Usuário bloqueado por excesso de tentativas de login' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar bloqueio do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  verifyToken,
  checkUserBlocked
}; 