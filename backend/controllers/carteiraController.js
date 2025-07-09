const db = require('../config/database');
const { getAcoesComVariação } = require('../services/acoesService');

// GET /api/carteira?minuto=XX
const listarCarteira = async (req, res) => {
  try {
    // Busca todas as ações na carteira do usuário
    const [carteira] = await db.query(`
      SELECT 
        c.ticker,
        c.qtde,
        c.preco_compra,
        c.qtde_vendido,
        c.preco_venda
      FROM carteira c
      WHERE c.id_usuario = ? AND c.qtde > 0
      ORDER BY c.ticker
    `, [req.userId]);

    // Busca o minuto simulado da query string
    const minuto = req.query.minuto ? parseInt(req.query.minuto, 10) : null;
    if (minuto === null || isNaN(minuto) || minuto < 0 || minuto > 59) {
      return res.status(400).json({ message: 'Parâmetro minuto (0-59) é obrigatório na query string.' });
    }

    // Busca os preços atuais das ações
    const tickers = carteira.map(item => item.ticker);
    const precos = await getAcoesComVariação({ tickers, minuto });

    // Combina os dados e calcula os valores
    const carteiraCompleta = carteira.map(item => {
      const preco = precos.find(p => p.ticker === item.ticker);
      const precoAtual = preco?.preco_atual || 0;
      const valorAtual = item.qtde * precoAtual;
      const valorInvestido = item.qtde * item.preco_compra;
      const lucroPrejuizo = valorAtual - valorInvestido;
      const variacaoPercentual = item.preco_compra > 0
          ? ((precoAtual - item.preco_compra) / item.preco_compra) * 100
          : 0;

      return {
        ticker: item.ticker,
        qtde: item.qtde,
        preco_compra: item.preco_compra,
        qtde_vendido: item.qtde_vendido,
        preco_venda: item.preco_venda,
        preco_atual: precoAtual,
        valor_atual: valorAtual,
        valor_investido: valorInvestido,
        lucro_prejuizo: lucroPrejuizo,
        variacao_percentual: Number(variacaoPercentual.toFixed(2)),
        fechamento: preco?.fechamento,
        variacao_nominal: preco?.variacao_nominal,
        variacao_percentual_mercado: preco?.variacao_percentual
      };
    }).sort((a, b) => b.valor_atual - a.valor_atual);

    res.json(carteiraCompleta);
  } catch (error) {
    console.error('Erro ao listar carteira:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// GET /api/carteira/total-investido
const getTotalInvestido = async (req, res) => {
  try {
    const id_usuario = req.userId;
    
    // Calcula total investido baseado nas ordens executadas
    const [ordensExecutadas] = await db.query(`
      SELECT 
        SUM(quantidade * preco_execucao) as total_investido,
        COUNT(*) as total_ordens
      FROM ordem_compra 
      WHERE id_usuario = ? AND executada = true
    `, [id_usuario]);

    const [vendasExecutadas] = await db.query(`
      SELECT 
        SUM(quantidade * preco_execucao) as total_vendido
      FROM ordem_venda 
      WHERE id_usuario = ? AND executada = true
    `, [id_usuario]);

    const totalInvestido = Number(ordensExecutadas[0]?.total_investido || 0);
    const totalVendido = Number(vendasExecutadas[0]?.total_vendido || 0);
    const totalLiquido = totalInvestido - totalVendido;

    res.json({
      total_investido: totalInvestido,
      total_vendido: totalVendido,
      total_liquido: totalLiquido,
      total_ordens: ordensExecutadas[0]?.total_ordens || 0
    });
  } catch (error) {
    console.error('Erro ao calcular total investido:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// CORRETA exportação
module.exports = {
  listarCarteira,
  getTotalInvestido
};