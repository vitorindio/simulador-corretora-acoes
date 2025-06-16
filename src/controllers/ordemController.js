const db = require('../config/database');
const { verificarToken } = require('../middleware/auth');

// Funções auxiliares
const calcularPrecoMedio = (quantidadeAtual, precoAtual, quantidadeNova, precoNovo) => {
  return ((quantidadeAtual * precoAtual) + (quantidadeNova * precoNovo)) / (quantidadeAtual + quantidadeNova);
};

// Controllers de Ordem de Compra
const criarOrdemCompra = async (req, res) => {
  try {
    const { ticker, quantidade, modo, preco_referencia } = req.body;
    const id_usuario = req.usuario.id;

    // Validações básicas
    if (!ticker || !quantidade || !modo) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }
    if (modo === 'limite' && !preco_referencia) {
      return res.status(400).json({ message: 'Preço de referência obrigatório para ordem limitada' });
    }
    if (quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que zero' });
    }

    // Insere ordem
    const [result] = await db.query(
      'INSERT INTO ordem_compra (id_usuario, data_hora, ticker, quantidade, modo, preco_referencia) VALUES (?, NOW(), ?, ?, ?, ?)',
      [id_usuario, ticker, quantidade, modo, preco_referencia]
    );

    res.status(201).json({ 
      message: 'Ordem de compra criada com sucesso',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Erro ao criar ordem de compra:', error);
    res.status(500).json({ message: 'Erro ao criar ordem de compra' });
  }
};

const executarOrdemCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.usuario.id;

    // Busca ordem
    const [ordens] = await db.query(
      'SELECT * FROM ordem_compra WHERE id = ? AND id_usuario = ? AND executada = false',
      [id, id_usuario]
    );

    if (ordens.length === 0) {
      return res.status(404).json({ message: 'Ordem não encontrada ou já executada' });
    }

    const ordem = ordens[0];
    const preco_execucao = ordem.modo === 'mercado' ? 
      Math.random() * 10 + 20 : // Simulação de preço de mercado
      ordem.preco_referencia;

    // Atualiza ordem
    await db.query(
      'UPDATE ordem_compra SET executada = true, preco_execucao = ?, data_hora_execucao = NOW() WHERE id = ?',
      [preco_execucao, id]
    );

    // Atualiza carteira
    const [carteiras] = await db.query(
      'SELECT * FROM carteira WHERE id_usuario = ? AND ticker = ?',
      [id_usuario, ordem.ticker]
    );

    if (carteiras.length === 0) {
      // Nova posição
      await db.query(
        'INSERT INTO carteira (id_usuario, ticker, quantidade, preco_compra) VALUES (?, ?, ?, ?)',
        [id_usuario, ordem.ticker, ordem.quantidade, preco_execucao]
      );
    } else {
      // Atualiza posição existente
      const carteira = carteiras[0];
      const novo_preco_medio = calcularPrecoMedio(
        carteira.quantidade,
        carteira.preco_compra,
        ordem.quantidade,
        preco_execucao
      );

      await db.query(
        'UPDATE carteira SET quantidade = quantidade + ?, preco_compra = ? WHERE id = ?',
        [ordem.quantidade, novo_preco_medio, carteira.id]
      );
    }

    // Registra movimentação na conta
    const valor_total = ordem.quantidade * preco_execucao;
    await db.query(
      'INSERT INTO conta_corrente (id_usuario, historico, data_hora, valor) VALUES (?, ?, NOW(), ?)',
      [id_usuario, `Compra ${ordem.ticker}`, -valor_total]
    );

    res.json({ 
      message: 'Ordem executada com sucesso',
      preco_execucao,
      valor_total
    });
  } catch (error) {
    console.error('Erro ao executar ordem de compra:', error);
    res.status(500).json({ message: 'Erro ao executar ordem de compra' });
  }
};

const listarOrdensCompra = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const [ordens] = await db.query(
      'SELECT * FROM ordem_compra WHERE id_usuario = ? ORDER BY data_hora DESC',
      [id_usuario]
    );
    res.json(ordens);
  } catch (error) {
    console.error('Erro ao listar ordens de compra:', error);
    res.status(500).json({ message: 'Erro ao listar ordens de compra' });
  }
};

const cancelarOrdemCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.usuario.id;

    const [result] = await db.query(
      'DELETE FROM ordem_compra WHERE id = ? AND id_usuario = ? AND executada = false',
      [id, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ordem não encontrada ou já executada' });
    }

    res.json({ message: 'Ordem cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar ordem de compra:', error);
    res.status(500).json({ message: 'Erro ao cancelar ordem de compra' });
  }
};

// Controllers de Ordem de Venda
const criarOrdemVenda = async (req, res) => {
  try {
    const { ticker, quantidade, modo, preco_repasse } = req.body;
    const id_usuario = req.usuario.id;

    // Validações básicas
    if (!ticker || !quantidade || !modo) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }
    if (modo === 'limite' && !preco_repasse) {
      return res.status(400).json({ message: 'Preço de repasse obrigatório para ordem limitada' });
    }
    if (quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que zero' });
    }

    // Verifica se tem quantidade suficiente na carteira
    const [carteiras] = await db.query(
      'SELECT * FROM carteira WHERE id_usuario = ? AND ticker = ? AND quantidade >= ?',
      [id_usuario, ticker, quantidade]
    );

    if (carteiras.length === 0) {
      return res.status(400).json({ message: 'Quantidade insuficiente na carteira' });
    }

    // Insere ordem
    const [result] = await db.query(
      'INSERT INTO ordem_venda (id_usuario, data_hora, ticker, quantidade, modo, preco_repasse) VALUES (?, NOW(), ?, ?, ?, ?)',
      [id_usuario, ticker, quantidade, modo, preco_repasse]
    );

    res.status(201).json({ 
      message: 'Ordem de venda criada com sucesso',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Erro ao criar ordem de venda:', error);
    res.status(500).json({ message: 'Erro ao criar ordem de venda' });
  }
};

const executarOrdemVenda = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.usuario.id;

    // Busca ordem
    const [ordens] = await db.query(
      'SELECT * FROM ordem_venda WHERE id = ? AND id_usuario = ? AND executada = false',
      [id, id_usuario]
    );

    if (ordens.length === 0) {
      return res.status(404).json({ message: 'Ordem não encontrada ou já executada' });
    }

    const ordem = ordens[0];
    const preco_execucao = ordem.modo === 'mercado' ? 
      Math.random() * 10 + 20 : // Simulação de preço de mercado
      ordem.preco_repasse;

    // Atualiza ordem
    await db.query(
      'UPDATE ordem_venda SET executada = true, preco_execucao = ?, data_hora_execucao = NOW() WHERE id = ?',
      [preco_execucao, id]
    );

    // Atualiza carteira
    const [carteiras] = await db.query(
      'SELECT * FROM carteira WHERE id_usuario = ? AND ticker = ?',
      [id_usuario, ordem.ticker]
    );

    const carteira = carteiras[0];
    const quantidade_vendida = ordem.quantidade;
    const preco_venda = preco_execucao;

    // Atualiza posição
    await db.query(
      'UPDATE carteira SET quantidade = quantidade - ?, quantidade_vendido = quantidade_vendido + ?, preco_venda = ? WHERE id = ?',
      [quantidade_vendida, quantidade_vendida, preco_venda, carteira.id]
    );

    // Registra movimentação na conta
    const valor_total = ordem.quantidade * preco_execucao;
    await db.query(
      'INSERT INTO conta_corrente (id_usuario, historico, data_hora, valor) VALUES (?, ?, NOW(), ?)',
      [id_usuario, `Venda ${ordem.ticker}`, valor_total]
    );

    res.json({ 
      message: 'Ordem executada com sucesso',
      preco_execucao,
      valor_total
    });
  } catch (error) {
    console.error('Erro ao executar ordem de venda:', error);
    res.status(500).json({ message: 'Erro ao executar ordem de venda' });
  }
};

const listarOrdensVenda = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const [ordens] = await db.query(
      'SELECT * FROM ordem_venda WHERE id_usuario = ? ORDER BY data_hora DESC',
      [id_usuario]
    );
    res.json(ordens);
  } catch (error) {
    console.error('Erro ao listar ordens de venda:', error);
    res.status(500).json({ message: 'Erro ao listar ordens de venda' });
  }
};

const cancelarOrdemVenda = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.usuario.id;

    const [result] = await db.query(
      'DELETE FROM ordem_venda WHERE id = ? AND id_usuario = ? AND executada = false',
      [id, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ordem não encontrada ou já executada' });
    }

    res.json({ message: 'Ordem cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar ordem de venda:', error);
    res.status(500).json({ message: 'Erro ao cancelar ordem de venda' });
  }
};

const listarOrdensPendentes = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    
    const [ordensCompra] = await db.query(
      'SELECT *, "compra" as tipo FROM ordem_compra WHERE id_usuario = ? AND executada = false',
      [id_usuario]
    );
    
    const [ordensVenda] = await db.query(
      'SELECT *, "venda" as tipo FROM ordem_venda WHERE id_usuario = ? AND executada = false',
      [id_usuario]
    );

    const ordensPendentes = [...ordensCompra, ...ordensVenda]
      .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));

    res.json(ordensPendentes);
  } catch (error) {
    console.error('Erro ao listar ordens pendentes:', error);
    res.status(500).json({ message: 'Erro ao listar ordens pendentes' });
  }
};

module.exports = {
  // Ordens de Compra
  criarOrdemCompra,
  executarOrdemCompra,
  listarOrdensCompra,
  cancelarOrdemCompra,

  // Ordens de Venda
  criarOrdemVenda,
  executarOrdemVenda,
  listarOrdensVenda,
  cancelarOrdemVenda,

  // Ordens Pendentes
  listarOrdensPendentes
}; 