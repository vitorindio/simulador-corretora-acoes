<template>
  <div class="dashboard">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Simulador de Corretora</h1>
      </div>
      <div class="nav-menu">
        <router-link to="/dashboard" class="nav-link active">Dashboard</router-link>
        <router-link to="/carteira" class="nav-link">Carteira</router-link>
        <router-link to="/ordens" class="nav-link">Ordens</router-link>
        <router-link to="/acoes" class="nav-link">Ações</router-link>
        <router-link to="/minha-lista" class="nav-link">Minha Lista</router-link>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </nav>

    <main class="main-content">
      <SimuladorRelogio @minuto-change="onMinutoChange" />
      <div class="dashboard-header">
        <h2>Bem-vindo ao seu Dashboard</h2>
        <p>Gerencie sua carteira de investimentos</p>
      </div>

      <div class="dashboard-grid">
        <!-- Resumo da Carteira -->
        <div class="card">
          <h3>Resumo da Carteira</h3>
          <div class="card-content">
            <div class="stat">
              <span class="stat-label">Total Investido:</span>
              <span class="stat-value" :class="getAnimacaoClass('carteiraTotal')"> {{ formatCurrency(carteiraTotal) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Posições:</span>
              <span class="stat-value">{{ carteiraPosicoes }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Saldo Disponível:</span>
              <span class="stat-value" :class="getAnimacaoClass('saldoDisponivel')"> {{ formatCurrency(saldoDisponivel) }}</span>
            </div>
          </div>
        </div>

        <!-- Últimas Ordens -->
        <div class="card">
          <h3>Últimas Ordens</h3>
          <div class="card-content">
            <div v-if="ultimasOrdens.length === 0" class="empty-state">
              <p>Nenhuma ordem encontrada</p>
            </div>
            <div v-else class="orders-list">
              <div v-for="ordem in ultimasOrdens.slice(0, 5)" :key="ordem.id" class="order-item">
                <div class="order-info">
                  <span class="order-ticker">{{ ordem.ticker }}</span>
                  <span class="order-type" :class="ordem.tipo">{{ ordem.tipo }}</span>
                </div>
                <div class="order-details">
                  <span>{{ ordem.quantidade }} ações</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações em Alta -->
        <div class="card">
          <h3>Ações em Alta</h3>
          <div class="card-content">
            <div v-if="acoesEmAlta.length === 0" class="empty-state">
              <p>Carregando ações...</p>
            </div>
            <div v-else class="stocks-list">
              <div v-for="acao in acoesEmAlta.slice(0, 5)" :key="acao.ticker" class="stock-item">
                <div class="stock-info">
                  <span class="stock-ticker">{{ acao.ticker }}</span>
                  <span class="stock-price" :class="getAnimacaoClass('alta', acao.ticker)"> {{ formatCurrency(acao.preco_atual) }}</span>
                </div>
                <div class="stock-change positive">
                  +{{ acao.variacao_percentual }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações em Baixa -->
        <div class="card">
          <h3>Ações em Baixa</h3>
          <div class="card-content">
            <div v-if="acoesEmBaixa.length === 0" class="empty-state">
              <p>Carregando ações...</p>
            </div>
            <div v-else class="stocks-list">
              <div v-for="acao in acoesEmBaixa.slice(0, 5)" :key="acao.ticker" class="stock-item">
                <div class="stock-info">
                  <span class="stock-ticker">{{ acao.ticker }}</span>
                  <span class="stock-price" :class="getAnimacaoClass('baixa', acao.ticker)"> {{ formatCurrency(acao.preco_atual) }}</span>
                </div>
                <div class="stock-change negative">
                  {{ acao.variacao_percentual }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios'
import SimuladorRelogio from '../components/SimuladorRelogio.vue'

export default {
  name: 'DashboardView',
  components: { SimuladorRelogio },
  data() {
    return {
      carteiraTotal: 0,
      carteiraPosicoes: 0,
      saldoDisponivel: 10000, // Saldo inicial
      ultimasOrdens: [],
      acoesEmAlta: [],
      acoesEmBaixa: [],
      valoresAnteriores: {
        carteiraTotal: 0,
        saldoDisponivel: 0,
        acoesEmAlta: {},
        acoesEmBaixa: {}
      }
    }
  },
  async mounted() {
    await this.loadDashboardData()
  },
  methods: {
    async loadDashboardData() {
      try {
        const token = localStorage.getItem('token')
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        // Salva valores anteriores para comparação ANTES de atualizar
        const valoresAnteriores = {
          carteiraTotal: this.carteiraTotal,
          saldoDisponivel: this.saldoDisponivel,
          acoesEmAlta: { ...this.valoresAnteriores.acoesEmAlta },
          acoesEmBaixa: { ...this.valoresAnteriores.acoesEmBaixa }
        }

        // Obter minuto simulado (ou usar minuto atual)
        const minuto = Number(localStorage.getItem('minutoSimulado')) || new Date().getMinutes()

        // Carregar dados da carteira
        try {
          const carteiraResponse = await axios.get(`/api/carteira?minuto=${minuto}`, config)
          console.log('Dados da carteira:', carteiraResponse.data) // Debug
          
          this.carteiraPosicoes = carteiraResponse.data.length
          const novoCarteiraTotal = carteiraResponse.data.reduce((total, item) => {
            // Usar o valor_investido que já vem calculado da API
            const valorInvestido = Number(item.valor_investido) || 0
            console.log(`Item ${item.ticker}: qtde=${item.qtde}, preco_compra=${item.preco_compra}, valor_investido=${valorInvestido}`) // Debug
            return total + valorInvestido
          }, 0)
          
          // Atualiza valores anteriores e novos
          this.valoresAnteriores.carteiraTotal = valoresAnteriores.carteiraTotal
          this.carteiraTotal = novoCarteiraTotal
          
          console.log('Total investido calculado:', this.carteiraTotal) // Debug
        } catch (carteiraError) {
          console.error('Erro ao carregar carteira:', carteiraError)
          this.carteiraPosicoes = 0
          this.carteiraTotal = 0
        }

        // Carregar últimas ordens
        try {
          const ordensResponse = await axios.get('/api/ordens/pendentes', config)
          this.ultimasOrdens = ordensResponse.data
        } catch (ordensError) {
          console.error('Erro ao carregar ordens:', ordensError)
          this.ultimasOrdens = []
        }

        // Carregar saldo disponível da conta corrente
        try {
          const saldoResponse = await axios.get('/api/conta-corrente', config)
          const lancamentos = saldoResponse.data.lancamentos || []
          if (lancamentos.length > 0) {
            const novoSaldo = lancamentos[lancamentos.length - 1].saldo
            // Atualiza valores anteriores e novos
            this.valoresAnteriores.saldoDisponivel = valoresAnteriores.saldoDisponivel
            this.saldoDisponivel = novoSaldo
          } else {
            this.saldoDisponivel = 0
          }
          console.log('Saldo disponível:', this.saldoDisponivel)
        } catch (saldoError) {
          console.error('Erro ao carregar saldo da conta corrente:', saldoError)
          this.saldoDisponivel = 0
        }

        // Carregar ações (simulado por enquanto)
        this.loadAcoes(valoresAnteriores)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    },

    async loadAcoes(valoresAnteriores = null) {
      try {
        const token = localStorage.getItem('token')
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        // Obter minuto simulado (ou usar minuto atual)
        const minuto = Number(localStorage.getItem('minutoSimulado')) || new Date().getMinutes()

        const response = await axios.get(`/api/acoes?minuto=${minuto}`, config)
        const acoes = response.data.acoes || response.data

        // Simular variação percentual
        const novasAcoesEmAlta = acoes
          .map(acao => ({
            ...acao,
            variacao_percentual: (Math.random() * 10).toFixed(2)
          }))
          .sort((a, b) => parseFloat(b.variacao_percentual) - parseFloat(a.variacao_percentual))

        const novasAcoesEmBaixa = acoes
          .map(acao => ({
            ...acao,
            variacao_percentual: (-Math.random() * 10).toFixed(2)
          }))
          .sort((a, b) => parseFloat(a.variacao_percentual) - parseFloat(b.variacao_percentual))

        // Salva valores anteriores para comparação
        if (valoresAnteriores) {
          this.valoresAnteriores.acoesEmAlta = valoresAnteriores.acoesEmAlta
          this.valoresAnteriores.acoesEmBaixa = valoresAnteriores.acoesEmBaixa
        } else {
          this.valoresAnteriores.acoesEmAlta = this.acoesEmAlta.reduce((acc, acao) => {
            acc[acao.ticker] = acao.preco_atual
            return acc
          }, {})
          this.valoresAnteriores.acoesEmBaixa = this.acoesEmBaixa.reduce((acc, acao) => {
            acc[acao.ticker] = acao.preco_atual
            return acc
          }, {})
        }

        this.acoesEmAlta = novasAcoesEmAlta
        this.acoesEmBaixa = novasAcoesEmBaixa
      } catch (error) {
        console.error('Erro ao carregar ações:', error)
      }
    },

    // Função para verificar se um valor mudou
    valorMudou(campo, ticker = null) {
      if (ticker) {
        // Para ações
        const acoes = campo === 'alta' ? this.acoesEmAlta : this.acoesEmBaixa
        const acao = acoes.find(a => a.ticker === ticker)
        const valorAnterior = this.valoresAnteriores[`acoesEm${campo === 'alta' ? 'Alta' : 'Baixa'}`][ticker]
        return acao && valorAnterior && acao.preco_atual !== valorAnterior
      } else {
        // Para valores simples
        const valorAnterior = this.valoresAnteriores[campo]
        return this[campo] !== valorAnterior
      }
    },

    // Função para verificar se um valor aumentou
    valorAumentou(campo, ticker = null) {
      if (ticker) {
        // Para ações
        const acoes = campo === 'alta' ? this.acoesEmAlta : this.acoesEmBaixa
        const acao = acoes.find(a => a.ticker === ticker)
        const valorAnterior = this.valoresAnteriores[`acoesEm${campo === 'alta' ? 'Alta' : 'Baixa'}`][ticker]
        return acao && valorAnterior && acao.preco_atual > valorAnterior
      } else {
        // Para valores simples
        const valorAnterior = this.valoresAnteriores[campo]
        return this[campo] > valorAnterior
      }
    },

    // Função para aplicar classe de animação
    getAnimacaoClass(campo, ticker = null) {
      if (!this.valorMudou(campo, ticker)) return ''
      
      if (this.valorAumentou(campo, ticker)) {
        return 'valor-alterado-positivo'
      } else {
        return 'valor-alterado-negativo'
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

    onMinutoChange() {
      this.loadDashboardData()
    }
  }
}
</script>

<style scoped>
.dashboard {
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

.dashboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #666;
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.stat:last-child {
  border-bottom: none;
}

.stat-label {
  color: #666;
  font-weight: 500;
}

.stat-value {
  color: #333;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 2rem 0;
}

.orders-list,
.stocks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-item,
.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 5px;
}

.order-info,
.stock-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-ticker,
.stock-ticker {
  font-weight: bold;
  color: #333;
}

.order-type {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  text-transform: uppercase;
}

.order-type.compra {
  background: #d4edda;
  color: #155724;
}

.order-type.venda {
  background: #f8d7da;
  color: #721c24;
}

.order-details {
  text-align: right;
  font-size: 0.9rem;
  color: #666;
}

.stock-price {
  font-size: 0.9rem;
  color: #666;
}

.stock-change {
  font-weight: bold;
  font-size: 0.9rem;
}

.stock-change.positive {
  color: #28a745;
}

.stock-change.negative {
  color: #dc3545;
}

/* Animação para valores alterados */
@keyframes piscar-positivo {
  0% { background-color: transparent; }
  50% { background-color: #d4edda; border-color: #28a745; }
  100% { background-color: transparent; }
}

@keyframes piscar-negativo {
  0% { background-color: transparent; }
  50% { background-color: #f8d7da; border-color: #dc3545; }
  100% { background-color: transparent; }
}

.valor-alterado-positivo {
  animation: piscar-positivo 1s ease-in-out;
  border-radius: 4px;
  padding: 2px 4px;
  border: 1px solid transparent;
}

.valor-alterado-negativo {
  animation: piscar-negativo 1s ease-in-out;
  border-radius: 4px;
  padding: 2px 4px;
  border: 1px solid transparent;
}

/* Ajustes para os valores que podem piscar */
.stat-value.valor-alterado-positivo,
.stat-value.valor-alterado-negativo {
  animation: piscar-positivo 1s ease-in-out;
}

.stat-value.valor-alterado-negativo {
  animation: piscar-negativo 1s ease-in-out;
}

.stock-price.valor-alterado-positivo {
  animation: piscar-positivo 1s ease-in-out;
}

.stock-price.valor-alterado-negativo {
  animation: piscar-negativo 1s ease-in-out;
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

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style> 