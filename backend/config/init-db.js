const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  let connection;
  
  try {
    // Conectar ao MySQL sem especificar o banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin'
    });
    
    console.log("Variáveis carregadas:");
    console.log({
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD
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

    // Ler o arquivo database.sql
    const databaseSQL = await fs.readFile(path.join(__dirname, 'database.sql'), 'utf8');

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