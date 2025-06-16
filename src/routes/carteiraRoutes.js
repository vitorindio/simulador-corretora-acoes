const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const db = require('../config/database');
const { getPrecosAcoes } = require('../services/acoesService');

// GET /api/carteira
router.get('/', verifyToken, async (req, res) => {
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

    // Busca os preços atuais das ações
    const tickers = carteira.map(item => item.ticker);
    const precos = await getPrecosAcoes(tickers);

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
        variacao_percentual: Number(variacaoPercentual.toFixed(2))
      };
    }).sort((a, b) => b.valor_atual - a.valor_atual);

    // Calcula totais
    const totais = carteiraCompleta.reduce((acc, item) => ({
      valorTotal: acc.valorTotal + (item.valor_atual || 0),
      valorInvestido: acc.valorInvestido + (item.valor_investido || 0),
      lucroPrejuizo: acc.lucroPrejuizo + (item.lucro_prejuizo || 0)
    }), { valorTotal: 0, valorInvestido: 0, lucroPrejuizo: 0 });

    // Calcula variação percentual total
    totais.variacaoPercentual = totais.valorInvestido > 0 
      ? ((totais.valorTotal - totais.valorInvestido) / totais.valorInvestido) * 100 
      : 0;

    res.json({
      carteira: carteiraCompleta,
      totais: {
        ...totais,
        variacaoPercentual: Number(totais.variacaoPercentual.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Erro ao listar carteira:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router; 