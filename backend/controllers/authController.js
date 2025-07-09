const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { getTickersDisponiveis } = require('../services/acoesService');

// Funções auxiliares
const gerarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Função para inicializar lista de interesse com 10 ações aleatórias
const inicializarListaInteresse = async (userId) => {
  try {
    // Busca todos os tickers disponíveis
    const tickersDisponiveis = await getTickersDisponiveis();
    
    // Seleciona 10 tickers aleatórios
    const tickersAleatorios = [];
    const tickersCopy = [...tickersDisponiveis];
    
    for (let i = 0; i < 10 && tickersCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * tickersCopy.length);
      tickersAleatorios.push(tickersCopy[randomIndex]);
      tickersCopy.splice(randomIndex, 1);
    }
    
    // Insere os tickers na lista de interesse do usuário
    for (let i = 0; i < tickersAleatorios.length; i++) {
      await db.query(
        'INSERT INTO acao_interesse (id_usuario, ticker, ordem) VALUES (?, ?, ?)',
        [userId, tickersAleatorios[i], i + 1]
      );
    }
    
    console.log(`Lista de interesse inicializada para usuário ${userId} com ${tickersAleatorios.length} ações`);
    return tickersAleatorios;
  } catch (error) {
    console.error('Erro ao inicializar lista de interesse:', error);
    throw error;
  }
};

// POST /api/auth/login
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

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    // Para logout, podemos invalidar o token adicionando-o a uma blacklist
    // ou simplesmente retornar sucesso (o frontend remove o token)
    // Por simplicidade, vamos apenas retornar sucesso
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ message: 'Erro ao fazer logout' });
  }
};

// POST /api/auth/criar-conta
const criarConta = async (req, res) => {
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

    const userId = result.insertId;

    // Inicializa lista de interesse com 10 ações aleatórias
    try {
      await inicializarListaInteresse(userId);
    } catch (error) {
      console.error('Erro ao inicializar lista de interesse, mas usuário foi criado:', error);
      // Não falha a criação do usuário se a inicialização falhar
    }

    // Retorna apenas os dados do usuário (sem senha)
    res.status(201).json({ 
      id: userId,
      email: email,
      message: 'Usuário cadastrado com sucesso. Faça login para obter o token de acesso.'
    });
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
  }
};

// POST /api/auth/token-nova-senha
const tokenNovaSenha = async (req, res) => {
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
    console.error('Erro ao gerar token de recuperação:', error);
    res.status(500).json({ message: 'Erro ao gerar token de recuperação' });
  }
};

// POST /api/auth/recuperar-senha
const recuperarSenha = async (req, res) => {
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
    console.error('Erro ao recuperar senha:', error);
    res.status(500).json({ message: 'Erro ao recuperar senha' });
  }
};

// POST /api/auth/trocar-senha
const trocarSenha = async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    const userId = req.userId; // Vem do middleware de autenticação

    // Busca usuário
    const [usuarios] = await db.query('SELECT * FROM usuario WHERE id = ?', [userId]);
    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuario = usuarios[0];

    // Verifica senha atual
    const senhaValida = await bcrypt.compare(senha_atual, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(nova_senha, 10);

    // Atualiza senha
    await db.query(
      'UPDATE usuario SET senha_hash = ? WHERE id = ?',
      [senhaHash, userId]
    );

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    res.status(500).json({ message: 'Erro ao trocar senha' });
  }
};

module.exports = {
  login,
  logout,
  criarConta,
  tokenNovaSenha,
  recuperarSenha,
  trocarSenha
}; 