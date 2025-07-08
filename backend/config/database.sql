-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS simulador_corretora;
USE simulador_corretora;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  token_rec_senha VARCHAR(255),
  data_token_rs DATETIME,
  numero_falhas_login INT DEFAULT 0,
  ultima_hora_negociacao TIME DEFAULT '10:00:00'
);

-- Tabela de ações de interesse
CREATE TABLE IF NOT EXISTS acao_interesse (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  ticker VARCHAR(10),
  ordem INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id)
);

-- Tabela de carteira
DROP TABLE IF EXISTS carteira;

CREATE TABLE carteira (
  id_usuario INT NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  qtde INT NOT NULL,
  preco_compra DECIMAL(10, 2) NOT NULL,
  preco_venda DECIMAL(10, 2),
  qtde_vendido INT DEFAULT 0,
  PRIMARY KEY (id_usuario, ticker),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Tabela de ordens de compra
CREATE TABLE IF NOT EXISTS ordem_compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  data_hora DATETIME NOT NULL,
  ticker VARCHAR(10),
  quantidade INT NOT NULL,
  modo ENUM('mercado', 'limite') NOT NULL,
  preco_referencia DECIMAL(10,2),
  executada BOOLEAN DEFAULT FALSE,
  preco_execucao DECIMAL(10,2),
  data_hora_execucao DATETIME,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id)
);

-- Tabela de ordens de venda
CREATE TABLE IF NOT EXISTS ordem_venda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  data_hora DATETIME NOT NULL,
  ticker VARCHAR(10),
  quantidade INT NOT NULL,
  modo ENUM('mercado', 'limite') NOT NULL,
  preco_repasse DECIMAL(10,2),
  executada BOOLEAN DEFAULT FALSE,
  preco_execucao DECIMAL(10,2),
  data_hora_execucao DATETIME,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id)
);

-- Tabela de conta corrente
DROP TABLE IF EXISTS conta_corrente;

CREATE TABLE conta_corrente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  historico VARCHAR(255) NOT NULL,
  data_hora DATETIME NOT NULL,
  tipo ENUM('deposito', 'retirada') NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  saldo DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);