const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente
dotenv.config();

// Importa as rotas
const usuariosRoutes = require('./routes/usuariosRoutes');
const acoesRoutes = require('./routes/acoesRoutes');
const ordemRoutes = require('./routes/ordemRoutes');
const carteiraRoutes = require('./routes/carteiraRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/usuarios', usuariosRoutes);
app.use('/acoes', acoesRoutes);
app.use('/ordens', ordemRoutes);
app.use('/carteira', carteiraRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API do Simulador de Corretora de Ações' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app; 