USE simulador_corretora;

-- Inserir usuário de teste (senha: 123456)
INSERT INTO usuario (email, senha_hash, numero_falhas_login, ultima_hora_negociacao) VALUES
('teste@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 0, '14:00:00');

-- Inserir algumas ações de interesse (usando tickers reais)
INSERT INTO acao_interesse (id_usuario, ticker, ordem) VALUES
(1, 'PETR4', 1),
(1, 'VALE3', 2),
(1, 'ITUB4', 3),
(1, 'BBDC4', 4),
(1, 'ABEV3', 5);

-- Inserir algumas ordens de compra
INSERT INTO ordem_compra (id_usuario, data_hora, ticker, quantidade, modo, preco_referencia, executada) VALUES
(1, NOW(), 'PETR4', 100, 'mercado', NULL, true),
(1, NOW(), 'VALE3', 50, 'limite', 54.88, false);

-- Inserir algumas ordens de venda
INSERT INTO ordem_venda (id_usuario, data_hora, ticker, quantidade, modo, preco_repasse, executada) VALUES
(1, NOW(), 'ITUB4', 200, 'mercado', NULL, true),
(1, NOW(), 'BBDC4', 150, 'limite', 11.43, false);

-- Inserir dados na carteira
INSERT INTO carteira (id_usuario, ticker, qtde, preco_compra, qtde_vendido, preco_venda) VALUES
(1, 'PETR4', 1000, 32.82, 0, NULL),
(1, 'VALE3', 500, 54.88, 0, NULL),
(1, 'ITUB4', 2000, 29.59, 500, 30.00);

-- Inserir movimentações na conta corrente
INSERT INTO conta_corrente (id_usuario, historico, data_hora, valor) VALUES
(1, 'Depósito inicial', NOW(), 10000.00),
(1, 'Compra PETR4', NOW(), -32820.00),
(1, 'Venda ITUB4', NOW(), 15000.00); 