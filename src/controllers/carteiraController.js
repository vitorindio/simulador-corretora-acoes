const db = require('../config/database');

// GET /api/carteira
const listarCarteira = async (req, res) => {
  try {
    const carteira = await db.query(`
      SELECT 
        c.ticker,
        c.quantidade,
        c.preco_medio,
        (SELECT preco_atual FROM acao WHERE ticker = c.ticker) as preco_atual,
        (c.quantidade * (SELECT preco_atual FROM acao WHERE ticker = c.ticker)) as valor_atual,
        (c.quantidade * c.preco_medio) as valor_investido,
        ((c.quantidade * (SELECT preco_atual FROM acao WHERE ticker = c.ticker)) - (c.quantidade * c.preco_medio)) as lucro_prejuizo,
        (((SELECT preco_atual FROM acao WHERE ticker = c.ticker) - c.preco_medio) / c.preco_medio * 100) as variacao_percentual
      FROM carteira c
      WHERE c.id_usuario = ? AND c.quantidade > 0
      ORDER BY valor_atual DESC
    `, [req.userId]);

    const totais = carteira.reduce((acc, item) => ({
      valorTotal: acc.valorTotal + (item.valor_atual || 0),
      valorInvestido: acc.valorInvestido + (item.valor_investido || 0),
      lucroPrejuizo: acc.lucroPrejuizo + (item.lucro_prejuizo || 0)
    }), { valorTotal: 0, valorInvestido: 0, lucroPrejuizo: 0 });

    totais.variacaoPercentual = totais.valorInvestido > 0 
      ? ((totais.valorTotal - totais.valorInvestido) / totais.valorInvestido) * 100 
      : 0;

    res.json({
      carteira,
      totais: {
        ...totais,
        variacaoPercentual: Number(totais.variacaoPercentual.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Erro ao listar carteira:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// CORRETA exportação
module.exports = {
  listarCarteira
};
