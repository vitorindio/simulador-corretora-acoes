const dotenv = require('dotenv');
const initDatabase = require('./config/init-db');
const app = require('./app');

// Carrega as variáveis de ambiente
dotenv.config();

// Inicializar o banco e depois iniciar o servidor
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer(); 