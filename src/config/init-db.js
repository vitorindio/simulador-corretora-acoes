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
      password: process.env.DB_PASSWORD || '123456'
    });

    console.log('Conectado ao MySQL');

    // Dropar o banco de dados se existir
    await connection.query('DROP DATABASE IF EXISTS simulador_corretora');
    console.log('Banco de dados antigo removido');

    // Criar o banco de dados
    await connection.query('CREATE DATABASE simulador_corretora');
    console.log('Banco de dados criado');

    // Usar o banco de dados
    await connection.query('USE simulador_corretora');
    console.log('Usando banco simulador_corretora');

    // Ler os arquivos SQL
    const databaseSQL = await fs.readFile(path.join(__dirname, 'database.sql'), 'utf8');
    const seedTestesSQL = await fs.readFile(path.join(__dirname, '../../scripts/seed-testes.sql'), 'utf8');

    // Dividir o SQL em comandos individuais
    const commands = databaseSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    // Executar cada comando separadamente
    for (const cmd of commands) {
      try {
        await connection.query(cmd);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('Tabela já existe, continuando...');
        } else {
          throw error;
        }
      }
    }
    console.log('Tabelas criadas com sucesso!');

    // Inserir dados de teste
    console.log('Inserindo dados de teste...');
    const seedCommands = seedTestesSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const cmd of seedCommands) {
      try {
        await connection.query(cmd);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log('Dado já existe, continuando...');
        } else {
          throw error;
        }
      }
    }
    console.log('Dados de teste inseridos com sucesso!');

  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = initDatabase; 