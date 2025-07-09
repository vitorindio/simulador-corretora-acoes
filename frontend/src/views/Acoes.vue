<template>
  <div class="acoes">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Simulador de Corretora</h1>
      </div>
      <div class="nav-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/carteira" class="nav-link">Carteira</router-link>
        <router-link to="/ordens" class="nav-link">Ordens</router-link>
        <router-link to="/acoes" class="nav-link active">Ações</router-link>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </nav>

    <main class="main-content">
      <div class="acoes-header">
        <h2>Mercado de Ações</h2>
        <div class="header-actions">
          <button @click="refreshAcoes" class="btn-secondary">Atualizar Preços</button>
          <button @click="showNovaOrdem = true" class="btn-primary">Nova Ordem</button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filtros">
        <input 
          type="text" 
          v-model="filtroBusca" 
          placeholder="Buscar por ticker..."
          class="busca-input"
        />
        <select v-model="filtroOrdenacao" class="ordenacao-select">
          <option value="ticker">Ordenar por Ticker</option>
          <option value="preco">Ordenar por Preço</option>
          <option value="variacao">Ordenar por Variação</option>
        </select>
      </div>

      <!-- Lista de Ações -->
      <div class="acoes-content">
        <div v-if="loading" class="loading">
          <p>Carregando ações...</p>
        </div>
        
        <div v-else-if="acoesFiltradas.length === 0" class="empty-state">
          <p>Nenhuma ação encontrada.</p>
        </div>
        
        <div v-else class="acoes-grid">
          <div v-for="acao in acoesFiltradas" :key="acao.ticker" class="acao-card">
            <div class="acao-header">
              <h3>{{ acao.ticker }}</h3>
              <span class="acao-nome">{{ acao.nome || 'Ação' }}</span>
            </div>
            
            <div class="acao-preco">
              <span class="preco-atual"> {{ formatCurrency(acao.preco_atual) }}</span>
              <span class="preco-anterior"> {{ formatCurrency(acao.preco_anterior || acao.preco_atual) }}</span>
            </div>
            
            <div class="acao-variacao">
              <span 
                class="variacao-valor" 
                :class="getVariacaoClass(acao.variacao_percentual)"
              >
                {{ formatVariacao(acao.variacao_percentual) }}
              </span>
              <span class="variacao-percentual">
                {{ formatPercentual(acao.variacao_percentual) }}
              </span>
            </div>
            
            <div class="acao-info">
              <div class="info-item">
                <span class="label">Volume:</span>
                <span class="value">{{ formatVolume(acao.volume) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Máximo:</span>
                <span class="value"> {{ formatCurrency(acao.preco_maximo || acao.preco_atual) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Mínimo:</span>
                <span class="value"> {{ formatCurrency(acao.preco_minimo || acao.preco_atual) }}</span>
              </div>
            </div>
            
            <div class="acao-actions">
              <button @click="comprarAcao(acao)" class="btn-compra">Comprar</button>
              <button @click="venderAcao(acao)" class="btn-venda">Vender</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Nova Ordem -->
    <div v-if="showNovaOrdem" class="modal-overlay" @click="showNovaOrdem = false">
      <div class="modal" @click.stop>
        <h3>Nova Ordem</h3>
        
        <form @submit.prevent="criarOrdem" class="ordem-form">
          <div class="form-group">
            <label for="tipo">Tipo de Ordem:</label>
            <select id="tipo" v-model="novaOrdem.tipo" required>
              <option value="">Selecione o tipo</option>
              <option value="compra">Compra</option>
              <option value="venda">Venda</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="ticker">Ação:</label>
            <select id="ticker" v-model="novaOrdem.ticker" required>
              <option value="">Selecione uma ação</option>
              <option v-for="acao in acoesDisponiveis" :key="acao.ticker" :value="acao.ticker">
                {{ acao.ticker }} {{ formatCurrency(acao.preco_atual) }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="quantidade">Quantidade:</label>
            <input 
              type="number" 
              id="quantidade" 
              v-model="novaOrdem.quantidade" 
              min="1" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="modo">Tipo de Ordem:</label>
            <select id="modo" v-model="novaOrdem.modo" required>
              <option value="mercado">Mercado</option>
              <option value="limite">Limite</option>
            </select>
          </div>
          
          <div v-if="novaOrdem.modo === 'limite'" class="form-group">
            <label for="preco">Preço Limite:</label>
            <input 
              type="number" 
              id="preco" 
              v-model="novaOrdem.preco_referencia" 
              step="0.01" 
              min="0"
              required
            />
          </div>
          
          <div class="form-actions">
            <button type="button" @click="showNovaOrdem = false" class="btn-cancel">
              Cancelar
            </button>
            <button type="submit" :disabled="criandoOrdem" class="btn-primary">
              {{ criandoOrdem ? 'Criando...' : 'Criar Ordem' }}
            </button>
          </div>
        </form>
        
        <div v-if="ordemError" class="error-message">
          {{ ordemError }}
        </div>
      </div>
    </div>

    <!-- Modal Adicionar Ação -->
    <div v-if="showAdicionarAcao" class="modal-overlay" @click="showAdicionarAcao = false">
      <div class="modal" @click.stop>
        <h3>Adicionar Ação de Interesse</h3>
        <select v-model="novaAcaoInteresse">
          <option value="">Selecione uma ação</option>
          <option v-for="ticker in tickersDisponiveis.filter(t => !acoesInteresse.includes(t))" :key="ticker" :value="ticker">{{ ticker }}</option>
        </select>
        <div class="form-actions">
          <button @click="showAdicionarAcao = false" class="btn-cancel">Cancelar</button>
          <button @click="adicionarInteresse" class="btn-primary">Adicionar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AcoesView',
  data() {
    return {
      acoesMercado: [], // todas as ações do mercado
      acoesInteresse: [], // tickers de interesse do usuário
      loading: true,
      filtroBusca: '',
      filtroOrdenacao: 'ticker',
      showNovaOrdem: false,
      showAdicionarAcao: false,
      tickersDisponiveis: [],
      novaAcaoInteresse: '',
      novaOrdem: {
        tipo: '',
        ticker: '',
        quantidade: 1,
        modo: 'mercado',
        preco_referencia: null
      },
      criandoOrdem: false,
      ordemError: '',
      minutoSimulado: Number(localStorage.getItem('minutoSimulado')) || 0
    }
  },
  computed: {
    acoesFiltradas() {
      // Mostra apenas as ações de interesse do usuário
      let acoes = this.acoesMercado.filter(acao => this.acoesInteresse.includes(acao.ticker))
      // Filtro de busca
      if (this.filtroBusca) {
        acoes = acoes.filter(acao => 
          acao.ticker.toLowerCase().includes(this.filtroBusca.toLowerCase()) ||
          (acao.nome && acao.nome.toLowerCase().includes(this.filtroBusca.toLowerCase()))
        )
      }
      // Ordenação
      switch (this.filtroOrdenacao) {
        case 'preco':
          return acoes.sort((a, b) => b.preco_atual - a.preco_atual)
        case 'variacao':
          return acoes.sort((a, b) => (b.variacao_percentual || 0) - (a.variacao_percentual || 0))
        default:
          return acoes.sort((a, b) => a.ticker.localeCompare(b.ticker))
      }
    },
    acoesDisponiveis() {
      // Para o modal de compra, mostrar todas as ações do mercado
      return this.acoesMercado
    }
  },
  async mounted() {
    await this.loadAcoesMercado()
    await this.loadAcoesInteresse()
    await this.loadTickersDisponiveis()
  },
  methods: {
    async loadAcoesMercado() {
      this.loading = true
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      console.log(token);
      const response = await axios.get(`http://localhost:3000/api/acoes?minuto=${this.minutoSimulado}`, config)
      this.acoesMercado = response.data.acoes
      this.loading = false
    },
    async loadAcoesInteresse() {
      // Busca os tickers de interesse do usuário
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const response = await axios.get(`http://localhost:3000/api/acoes?minuto=${this.minutoSimulado}`, config)
      this.acoesInteresse = response.data.acoes.map(a => a.ticker)
    },
    async loadTickersDisponiveis() {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const response = await axios.get('http://localhost:3000/api/acoes/tickers', config)
      this.tickersDisponiveis = response.data.tickers
    },
    async adicionarInteresse() {
      if (!this.novaAcaoInteresse) return
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post('http://localhost:3000/api/acoes/interesse', { ticker: this.novaAcaoInteresse }, config)
      this.showAdicionarAcao = false
      this.novaAcaoInteresse = ''
      await this.loadAcoesInteresse()
    },
    async removerInteresse(ticker) {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.delete(`http://localhost:3000/api/acoes/interesse/${ticker}`, config)
      await this.loadAcoesInteresse()
    },
    getNomeAcao(ticker) {
      const nomes = {
        'PETR4': 'Petrobras PN',
        'VALE3': 'Vale ON',
        'ITUB4': 'Itaú Unibanco PN',
        'BBDC4': 'Bradesco PN',
        'ABEV3': 'Ambev ON',
        'WEGE3': 'WEG ON',
        'RENT3': 'Localiza ON',
        'BBAS3': 'Banco do Brasil ON'
      }
      return nomes[ticker] || ticker
    },
    async criarOrdem() {
      this.criandoOrdem = true
      this.ordemError = ''

      try {
        const token = localStorage.getItem('token')
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        const ordemData = {
          ticker: this.novaOrdem.ticker,
          quantidade: parseInt(this.novaOrdem.quantidade),
          modo: this.novaOrdem.modo
        }

        if (this.novaOrdem.modo === 'limite') {
          ordemData.preco_referencia = parseFloat(this.novaOrdem.preco_referencia)
        }

        const endpoint = this.novaOrdem.tipo === 'venda' ? 'venda' : 'compra'
        await axios.post(`http://localhost:3000/api/ordens/${endpoint}`, ordemData, config)
        
        this.showNovaOrdem = false
        this.novaOrdem = {
          tipo: '',
          ticker: '',
          quantidade: 1,
          modo: 'mercado',
          preco_referencia: null
        }
        
        alert('Ordem criada com sucesso!')
      } catch (error) {
        this.ordemError = error.response?.data?.message || 'Erro ao criar ordem'
      } finally {
        this.criandoOrdem = false
      }
    },
    comprarAcao(acao) {
      this.novaOrdem.tipo = 'compra'
      this.novaOrdem.ticker = acao.ticker
      this.showNovaOrdem = true
    },
    venderAcao(acao) {
      this.novaOrdem.tipo = 'venda'
      this.novaOrdem.ticker = acao.ticker
      this.showNovaOrdem = true
    },
    async refreshAcoes() {
      this.loading = true
      await this.loadAcoesMercado()
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    },
    formatVariacao(variacao) {
      if (!variacao) return '0,00'
      const valor = Math.abs(variacao)
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valor)
    },
    formatPercentual(variacao) {
      if (!variacao) return '0,00%'
      return `${variacao >= 0 ? '+' : ''}${variacao.toFixed(2)}%`
    },
    formatVolume(volume) {
      return new Intl.NumberFormat('pt-BR').format(volume)
    },
    getVariacaoClass(variacao) {
      if (!variacao) return 'neutral'
      return variacao > 0 ? 'positive' : 'negative'
    },
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    },
    avancarMinuto(delta = 1) {
      this.minutoSimulado = (this.minutoSimulado + delta) % 60
      if (this.minutoSimulado < 0) this.minutoSimulado += 60
      localStorage.setItem('minutoSimulado', this.minutoSimulado)
      this.loadAcoesMercado()
    }
  }
}
</script>

<style scoped>
.acoes {
  min-height: 100vh;
  background: #f5f7fa;
}

.navbar {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h1 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.nav-menu {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: all 0.3s;
}

.nav-link:hover,
.nav-link.active {
  background: #667eea;
  color: white;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.logout-btn:hover {
  opacity: 0.8;
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.acoes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.acoes-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.3s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.3s;
}

.btn-secondary:hover {
  opacity: 0.9;
}

.filtros {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.busca-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.busca-input:focus {
  outline: none;
  border-color: #667eea;
}

.ordenacao-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  background: white;
}

.ordenacao-select:focus {
  outline: none;
  border-color: #667eea;
}

.acoes-content {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.acoes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.acao-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.5rem;
  transition: box-shadow 0.3s;
}

.acao-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.acao-header {
  margin-bottom: 1rem;
}

.acao-header h3 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1.3rem;
}

.acao-nome {
  color: #666;
  font-size: 0.9rem;
}

.acao-preco {
  margin-bottom: 1rem;
}

.preco-atual {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
}

.preco-anterior {
  color: #666;
  font-size: 0.9rem;
  text-decoration: line-through;
}

.acao-variacao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.variacao-valor {
  font-weight: bold;
  font-size: 1.1rem;
}

.variacao-valor.positive {
  color: #28a745;
}

.variacao-valor.negative {
  color: #dc3545;
}

.variacao-valor.neutral {
  color: #666;
}

.variacao-percentual {
  font-size: 0.9rem;
  font-weight: 500;
}

.acao-info {
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.info-item .label {
  color: #666;
  font-size: 0.9rem;
}

.info-item .value {
  font-weight: 500;
  color: #333;
}

.acao-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-compra,
.btn-venda {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.3s;
}

.btn-compra {
  background: #28a745;
  color: white;
}

.btn-venda {
  background: #dc3545;
  color: white;
}

.btn-compra:hover,
.btn-venda:hover {
  opacity: 0.8;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  text-align: center;
}

.ordem-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-cancel {
  background: #666;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  flex: 1;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 5px;
  margin-top: 1rem;
  text-align: center;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-menu {
    flex-wrap: wrap;
    justify-content: center;
  }

  .acoes-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
  }

  .filtros {
    flex-direction: column;
  }

  .acoes-grid {
    grid-template-columns: 1fr;
  }
}
</style> 