<template>
  <div class="carteira">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Simulador de Corretora</h1>
      </div>
      <div class="nav-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/carteira" class="nav-link active">Carteira</router-link>
        <router-link to="/ordens" class="nav-link">Ordens</router-link>
        <router-link to="/acoes" class="nav-link">Ações</router-link>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </nav>

    <main class="main-content">
      <SimuladorRelogio @minuto-change="onMinutoChange" />
      <!-- Remover qualquer bloco antigo de horário simulado e botões -->
      <div class="carteira-header">
        <h2>Minha Carteira</h2>
        <div>
          <button @click="showNovaOrdem = true" class="btn-primary">Nova Ordem</button>
          <button @click="irParaContaCorrente" class="btn-secondary" style="margin-left: 1rem;">Conta Corrente</button>
        </div>
      </div>

      <!-- Resumo da Carteira -->
      <div class="carteira-resumo">
        <div class="resumo-card">
          <h3>Total Investido</h3>
          <p class="resumo-valor"> {{ formatCurrency(totalInvestido) }}</p>
        </div>
        <div class="resumo-card">
          <h3>Valor Atual</h3>
          <p class="resumo-valor"> {{ formatCurrency(valorAtual) }}</p>
        </div>
        <div class="resumo-card">
          <h3>Lucro/Prejuízo</h3>
          <p class="resumo-valor" :class="lucroPrejuizo >= 0 ? 'positive' : 'negative'">
            {{ lucroPrejuizo >= 0 ? '+' : '' }} {{ formatCurrency(lucroPrejuizo) }}
          </p>
        </div>
        <div class="resumo-card">
          <h3>Posições</h3>
          <p class="resumo-valor">{{ carteira.length }}</p>
        </div>
      </div>

      <!-- Lista de Ações -->
      <div class="carteira-content">
        <h3>Minhas Ações</h3>
        
        <div v-if="loading" class="loading">
          <p>Carregando carteira...</p>
        </div>
        
        <div v-else-if="carteira.length === 0" class="empty-state">
          <p>Você ainda não possui ações na carteira.</p>
          <button @click="showNovaOrdem = true" class="btn-primary">Fazer Primeira Compra</button>
        </div>
        
        <div v-else class="acoes-grid">
          <div v-for="acao in carteira" :key="acao.id" class="acao-card">
            <div class="acao-header">
              <h4>{{ acao.ticker }}</h4>
              <span class="acao-quantidade">{{ acao.qtde }} ações</span>
            </div>
            
            <div class="acao-info">
              <div class="info-item">
                <span class="label">Preço Médio:</span>
                <span class="value"> {{ formatCurrency(acao.preco_compra) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Preço Atual:</span>
                <span class="value"> {{ formatCurrency(acao.preco_atual || acao.preco_compra) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Valor Total:</span>
                <span class="value"> {{ formatCurrency(acao.qtde * (acao.preco_atual || acao.preco_compra)) }}</span>
              </div>
            </div>
            
            <div class="acao-actions">
              <button @click="comprarMais(acao)" class="btn-compra">Comprar Mais</button>
              <button @click="vender(acao)" class="btn-venda">Vender</button>
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
            <label for="ticker">Ação:</label>
            <select id="ticker" v-model="novaOrdem.ticker" required>
              <option value="">Selecione uma ação</option>
              <option v-for="acao in acoesDisponiveis" :key="acao.ticker" :value="acao.ticker">
                {{ acao.ticker }} - R$ {{ formatCurrency(acao.preco_atual) }}
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
  </div>
</template>

<script>
import axios from 'axios'
import SimuladorRelogio from '../components/SimuladorRelogio.vue'

export default {
  name: 'CarteiraView',
  components: { SimuladorRelogio },
  data() {
    return {
      carteira: [],
      acoesDisponiveis: [],
      loading: true,
      showNovaOrdem: false,
      novaOrdem: {
        ticker: '',
        quantidade: 1,
        modo: 'mercado',
        preco_referencia: null
      },
      criandoOrdem: false,
      ordemError: '',
      minutoSimulado: Number(localStorage.getItem('minutoSimulado')) || 0,
      totalInvestidoFromAPI: 0
    }
  },
  computed: {
    totalInvestido() {
      // Usar o total investido calculado baseado nas ordens executadas
      return this.totalInvestidoFromAPI || 0
    },
    valorAtual() {
      return this.carteira.reduce((total, acao) => {
        return total + (acao.qtde * (acao.preco_atual || acao.preco_compra))
      }, 0)
    },
    lucroPrejuizo() {
      return this.valorAtual - this.totalInvestido
    }
  },
  async mounted() {
    await this.loadCarteira()
    await this.loadAcoesDisponiveis()
  },
  methods: {
    async loadCarteira() {
      this.loading = true
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const response = await axios.get(`/api/carteira?minuto=${this.minutoSimulado}`, config)
      console.log('Dados da carteira recebidos:', response.data) // Debug
      
      // Mapeia os campos do backend para os nomes esperados no frontend
      this.carteira = response.data.map(acao => ({
        ...acao,
        preco_compra: acao.preco_compra ?? 0,
        preco_atual: acao.preco_atual ?? 0
      }))
      
      console.log('Carteira processada:', this.carteira) // Debug
      
      // Carregar total investido baseado nas ordens executadas
      try {
        const totalInvestidoResponse = await axios.get('/api/carteira/total-investido', config)
        console.log('Total investido da API:', totalInvestidoResponse.data) // Debug
        this.totalInvestidoFromAPI = totalInvestidoResponse.data.total_liquido || 0
      } catch (error) {
        console.error('Erro ao carregar total investido:', error)
        this.totalInvestidoFromAPI = 0
      }
      
      console.log('Total investido final:', this.totalInvestido) // Debug
      this.loading = false
    },

    async loadAcoesDisponiveis() {
      try {
        const token = localStorage.getItem('token')
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }
        const minuto = Number(localStorage.getItem('minutoSimulado')) || new Date().getMinutes();
        const response = await axios.get(`/api/acoes?minuto=${minuto}`, config)
        this.acoesDisponiveis = response.data.acoes
      } catch (error) {
        console.error('Erro ao carregar ações:', error)
      }
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

        await axios.post('/api/ordens/compra', ordemData, config)
        
        this.showNovaOrdem = false
        this.novaOrdem = {
          ticker: '',
          quantidade: 1,
          modo: 'mercado',
          preco_referencia: null
        }
        
        alert('Ordem criada com sucesso!')
        await this.loadCarteira()
      } catch (error) {
        this.ordemError = error.response?.data?.message || 'Erro ao criar ordem'
      } finally {
        this.criandoOrdem = false
      }
    },

    comprarMais(acao) {
      this.novaOrdem.ticker = acao.ticker
      this.showNovaOrdem = true
    },

    async vender(acao) {
      if (confirm(`Deseja vender ${acao.qtde || acao.quantidade} ações de ${acao.ticker}?`)) {
        try {
          const token = localStorage.getItem('token')
          const config = {
            headers: { Authorization: `Bearer ${token}` }
          }

          await axios.post('/api/ordens/venda', {
            ticker: acao.ticker,
            quantidade: acao.qtde || acao.quantidade,
            modo: 'mercado'
          }, config)

          alert('Ordem de venda criada com sucesso!')
          await this.loadCarteira()
        } catch (error) {
          alert(error.response?.data?.message || 'Erro ao criar ordem de venda')
        }
      }
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    },

    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    },

    irParaContaCorrente() {
      this.$router.push('/conta-corrente')
    },

    onMinutoChange(minuto) {
      this.minutoSimulado = minuto
      this.loadCarteira()
      this.loadAcoesDisponiveis()
    }
  }
}
</script>

<style scoped>
.carteira {
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

.carteira-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.carteira-header h2 {
  margin: 0;
  color: #333;
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
  background: #4CAF50; /* A green color for the secondary button */
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

.carteira-resumo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.resumo-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.resumo-card h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.resumo-valor {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.resumo-valor.positive {
  color: #28a745;
}

.resumo-valor.negative {
  color: #dc3545;
}

.carteira-content {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.carteira-content h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.acoes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.acao-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.acao-quantidade {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
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
  padding: 0.5rem;
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

  .carteira-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .carteira-resumo {
    grid-template-columns: 1fr;
  }

  .acoes-grid {
    grid-template-columns: 1fr;
  }
}
</style> 