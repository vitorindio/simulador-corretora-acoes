# Simulador de Corretora de Ações

Projeto desenvolvido para a disciplina de Desenvolvimento de Software Web (DSW).

## Descrição

Este é um simulador de corretora de ações que permite aos usuários:
- Criar conta e gerenciar autenticação
- Visualizar e acompanhar ações do mercado
- Realizar operações de compra e venda de ações
- Gerenciar carteira de investimentos
- Controlar conta corrente

## Tecnologias Utilizadas

- Backend: Node.js + Express
- Banco de Dados: MySQL
- Frontend: Vue.js 3 (a ser implementado)

## Requisitos

- Node.js 18.x ou superior
- MySQL 8.x ou superior
- NPM ou Yarn

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd simulador-corretora-acoes
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Copie o arquivo `.env.example` para `.env`
- Ajuste as variáveis conforme seu ambiente

4. Inicialize o banco de dados:
```bash
mysql -u root -p < scripts/init-db.sql
```

5. Inicie o servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## Estrutura do Projeto

```
simulador-corretora-acoes/
├── src/
│   ├── config/          # Configurações (banco, auth)
│   ├── controllers/     # Controladores da API
│   ├── models/         # Modelos de dados
│   ├── routes/         # Rotas da API
│   ├── middleware/     # Middlewares (auth, validação)
│   └── app.js          # Arquivo principal
├── scripts/
│   └── init-db.sql     # Script de inicialização do banco
├── .env                # Variáveis de ambiente
├── package.json
└── README.md
```

## API Endpoints

### Autenticação
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/criar-conta
- POST /api/auth/token-nova-senha
- POST /api/auth/recuperar-senha
- POST /api/auth/trocar-senha

### Usuário
- POST /api/usuario/atualizar-hora-negociacao

### Ações
- POST /api/acoes/interesse
- DELETE /api/acoes/interesse/{ticker}
- POST /api/acoes/interesse/{ticker}/subir
- POST /api/acoes/interesse/{ticker}/descer
- GET /api/acoes/interesse

### Ordens
- POST /api/ordens/compra
- POST /api/ordens/compra/{id}/executar
- GET /api/ordens/compra
- POST /api/ordens/venda
- POST /api/ordens/venda/{id}/executar
- GET /api/ordens/venda

### Carteira
- GET /api/carteira

## Desenvolvimento

Para a primeira entrega, focamos na implementação do backend com:
1. Sistema de autenticação completo
2. Estrutura do banco de dados
3. Endpoints básicos para gerenciamento de usuários e ações

As próximas entregas incluirão:
1. Implementação do frontend em Vue.js
2. Funcionalidades de compra e venda de ações
3. Gerenciamento de carteira
4. Sistema de conta corrente

## Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request 

## Contribuidores
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/vitorindio">
        <img src="https://avatars.githubusercontent.com/u/88738275?s=100&v=4" alt="Vitor Indio" width="100px"/><br />
        <sub><b>Vitor Indio</b></sub>
        <br />
      </a>
      <span>Desenvolvedor</span>
    </td>
    <td align="center">
      <a href="https://github.com/marciobfl">
        <img src="https://avatars.githubusercontent.com/u/37818174?u=5fbeb7dab8ac9deb784112bb07278a7a90ed690c&v=4&" alt="" width="100px"/><br />
        <sub><b>Marcio Brasil</b></sub>
        <br />
      </a>
      <span>Desenvolvedor</span>
    </td>
  </tr>
</table>

