import { createConnection } from 'mysql2/promise';
import { promises as fs } from 'fs';
import { join } from 'path';

async function initDatabase() {
  let connection;
  
  try {
    // Conectar ao MySQL sem especificar o banco
    connection = await createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root' // ajuste conforme sua senha
    });

    console.log('Conectado ao MySQL');

    // Ler os arquivos SQL
    const databaseSQL = await fs.readFile(join(__dirname, 'database.sql'), 'utf8');
    const seedTestesSQL = await fs.readFile(join(__dirname, '../../scripts/seed-testes.sql'), 'utf8');

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

export default initDatabase; 