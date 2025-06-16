const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function initDatabase() {
  let connection;
  
  try {
    // Conectar ao MySQL sem especificar o banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'simulador_corretora'
    });

    console.log('Conectado ao MySQL');

    // Ler os arquivos SQL
    const databaseSQL = await fs.readFile(path.join(__dirname, 'database.sql'), 'utf8');
    const seedTestesSQL = await fs.readFile(path.join(__dirname, '../../scripts/seed-testes.sql'), 'utf8');

    // Criar o banco e as tabelas
    console.log('Criando banco de dados e tabelas...');
    await connection.query(databaseSQL);
    console.log('Banco de dados e tabelas criados com sucesso!');

    // Inserir dados de teste
    console.log('Inserindo dados de teste...');
    await connection.query(seedTestesSQL);
    console.log('Dados de teste inseridos com sucesso!');

  } catch (error) {
    if (error.code === 'ER_DB_CREATE_EXISTS') {
      console.log('Banco de dados já existe, continuando...');
    } else {
      console.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = initDatabase; 