const mysql = require('mysql2/promise');

// Configuração do pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'simulador_corretora',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função para testar a conexão
async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

// Função para executar queries
async function query(sql, params) {
  try {
    return await pool.query(sql, params); // Retorna [rows, fields]
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  query
}; 