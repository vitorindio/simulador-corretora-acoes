-- Cria o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS simulador_corretora;

-- Usa o banco de dados
USE simulador_corretora;

-- Tabela: usuario
CREATE TABLE IF NOT EXISTS usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  token_rec_senha VARCHAR(255),
  data_token_rs DATETIME,
  numero_falhas_login INT DEFAULT 0,
  ultima_hora_negociacao TIME DEFAULT '14:00:00'
);

-- Tabela: acoes_interesse
CREATE TABLE IF NOT EXISTS acoes_interesse (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  ordem INT NOT NULL,
  UNIQUE KEY (id_usuario, ticker),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Tabela: ordem_compra
CREATE TABLE IF NOT EXISTS ordem_compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  data_hora DATETIME NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  quantidade INT NOT NULL,
  modo VARCHAR(10) NOT NULL, -- 'mercado' ou 'limite'
  preco_referencia DECIMAL(10, 2),
  executada BOOLEAN DEFAULT FALSE,
  preco_execucao DECIMAL(10, 2),
  data_hora_execucao DATETIME,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Tabela: ordem_venda
CREATE TABLE IF NOT EXISTS ordem_venda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  data_hora DATETIME NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  quantidade INT NOT NULL,
  modo VARCHAR(10) NOT NULL, -- 'mercado' ou 'limite'
  preco_referencia DECIMAL(10, 2),
  executada BOOLEAN DEFAULT FALSE,
  preco_execucao DECIMAL(10, 2),
  data_hora_execucao DATETIME,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Tabela: carteira
CREATE TABLE IF NOT EXISTS carteira (
  id_usuario INT NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  qtde INT NOT NULL,
  preco_compra DECIMAL(10, 2) NOT NULL,
  preco_venda DECIMAL(10, 2),
  qtde_vendido INT DEFAULT 0,
  PRIMARY KEY (id_usuario, ticker),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Tabela: conta_corrente
CREATE TABLE IF NOT EXISTS conta_corrente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  historico VARCHAR(255) NOT NULL,
  data_hora DATETIME NOT NULL,
  tipo ENUM('deposito', 'retirada') NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  saldo DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Índices para melhorar a performance
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_ordem_compra_usuario ON ordem_compra(id_usuario);
CREATE INDEX idx_ordem_venda_usuario ON ordem_venda(id_usuario);
CREATE INDEX idx_carteira_usuario ON carteira(id_usuario);
CREATE INDEX idx_conta_corrente_usuario ON conta_corrente(id_usuario);
CREATE INDEX idx_acoes_interesse_usuario ON acoes_interesse(id_usuario);

-- Exemplo de inserts para conta_corrente
INSERT INTO conta_corrente (id_usuario, historico, data_hora, tipo, valor, saldo) VALUES
(1, 'Depósito inicial', NOW(), 'deposito', 10000.00, 10000.00),
(1, 'Compra PETR4', NOW(), 'retirada', 32820.00, -22820.00),
(1, 'Venda ITUB4', NOW(), 'deposito', 15000.00, -7820.00); 