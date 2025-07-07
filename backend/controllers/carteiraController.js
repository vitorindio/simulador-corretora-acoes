const db = require('../config/database');
const { getAcoesComVariação } = require('../services/acoesService');

// GET /api/carteira?minuto=XX
const listarCarteira = async (req, res) => {
  try {
    // Busca todas as ações na carteira do usuário
    const [carteira] = await db.query(`
      SELECT 
        c.ticker,
        c.quantidade,
        c.preco_compra as preco_medio,
        c.quantidade_vendido,
        c.preco_venda
      FROM carteira c
      WHERE c.id_usuario = ? AND c.quantidade > 0
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
      const valorAtual = item.quantidade * precoAtual;
      const valorInvestido = item.quantidade * item.preco_medio;
      const lucroPrejuizo = valorAtual - valorInvestido;
      const variacaoPercentual = item.preco_medio > 0
          ? ((precoAtual - item.preco_medio) / item.preco_medio) * 100
          : 0;

      return {
        ...item,
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

// CORRETA exportação
module.exports = {
  listarCarteira
};