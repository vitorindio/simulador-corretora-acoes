USE simulador_corretora;

-- Inserir usuário de teste (senha: 123456)
INSERT INTO usuario (email, senha_hash, numero_falhas_login, ultima_hora_negociacao) VALUES
('teste@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 0, '14:00:00');

-- Inserir algumas ações de interesse
INSERT INTO acoes_interesse (id_usuario, ticker, ordem) VALUES
(1, 'PETR4', 1),
(1, 'VALE5', 2),
(1, 'ITUB4', 3),
(1, 'BBDC4', 4),
(1, 'ABEV3', 5);

-- Inserir algumas ordens de compra
INSERT INTO ordem_compra (id_usuario, data_hora, ticker, quantidade, modo, preco_referencia, executada) VALUES
(1, NOW(), 'PETR4', 100, 'mercado', NULL, true),
(1, NOW(), 'VALE5', 50, 'limite', 30.50, false);

-- Inserir algumas ordens de venda
INSERT INTO ordem_venda (id_usuario, data_hora, ticker, quantidade, modo, preco_repasse, executada) VALUES
(1, NOW(), 'ITUB4', 200, 'mercado', NULL, true),
(1, NOW(), 'BBDC4', 150, 'limite', 15.75, false);

-- Inserir dados na carteira
INSERT INTO carteira (id_usuario, ticker, quantidade, preco_compra, preco_venda_medio, quantidade_vendida) VALUES
(1, 'PETR4', 1000, 28.50, NULL, 0),
(1, 'VALE5', 500, 65.75, NULL, 0),
(1, 'ITUB4', 2000, 22.30, 23.45, 500);

-- Inserir movimentações na conta corrente
INSERT INTO conta_corrente (id_usuario, historico, data_hora, valor) VALUES
(1, 'Depósito inicial', NOW(), 10000.00),
(1, 'Compra PETR4', NOW(), -2850.00),
(1, 'Venda ITUB4', NOW(), 11725.00); 