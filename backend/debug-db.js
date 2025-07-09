const db = require('./config/database');

async function debugDatabase() {
  try {
    console.log('=== DEBUG DO BANCO DE DADOS ===');
    
    // Verificar se há usuários
    const [usuarios] = await db.query('SELECT * FROM usuario');
    console.log('Usuários:', usuarios);
    
    // Verificar estrutura da tabela acao_interesse
    const [estrutura] = await db.query('DESCRIBE acao_interesse');
    console.log('Estrutura da tabela acao_interesse:', estrutura);
    
    // Verificar se há ações de interesse
    const [acoesInteresse] = await db.query('SELECT * FROM acao_interesse');
    console.log('Ações de interesse:', acoesInteresse);
    
    // Testar inserção manual
    if (usuarios.length > 0) {
      const userId = usuarios[0].id;
      console.log('Testando inserção para usuário ID:', userId);
      
      try {
        await db.query(
          'INSERT INTO acao_interesse (id_usuario, ticker, ordem) VALUES (?, ?, ?)',
          [userId, 'TESTE', 1]
        );
        console.log('Inserção de teste bem-sucedida');
        
        // Remover o teste
        await db.query('DELETE FROM acao_interesse WHERE ticker = ?', ['TESTE']);
        console.log('Teste removido');
      } catch (error) {
        console.error('Erro na inserção de teste:', error);
      }
    }
    
  } catch (error) {
    console.error('Erro no debug:', error);
  } finally {
    process.exit();
  }
}

debugDatabase(); 