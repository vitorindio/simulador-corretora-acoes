<template>
  <div class="conta-corrente">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Simulador de Corretora</h1>
      </div>
      <div class="nav-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/carteira" class="nav-link">Carteira</router-link>
        <router-link to="/ordens" class="nav-link">Ordens</router-link>
        <router-link to="/acoes" class="nav-link">Ações</router-link>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </nav>

    <main class="main-content">
      <div class="conta-header">
        <h2>Conta Corrente</h2>
        <div class="header-actions">
          <button @click="showDeposito = true" class="btn-primary">Depositar</button>
          <button @click="showRetirada = true" class="btn-secondary">Retirar</button>
        </div>
      </div>

      <div class="conta-content">
        <h3>Lançamentos</h3>
        <div v-if="loading" class="loading">
          <p>Carregando lançamentos...</p>
        </div>
        <div v-else-if="lancamentos.length === 0" class="empty-state">
          <p>Nenhum lançamento encontrado.</p>
        </div>
        <table v-else class="lancamentos-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(lanc) in lancamentos" :key="lanc.id">
              <td>{{ formatDate(lanc.data_hora) }}</td>
              <td>{{ lanc.descricao }}</td>
              <td :class="lanc.tipo === 'deposito' ? 'positive' : 'negative'">
                {{ lanc.tipo === 'deposito' ? 'Depósito' : 'Retirada' }}
              </td>
              <td :class="lanc.tipo === 'deposito' ? 'positive' : 'negative'">
                {{ lanc.tipo === 'deposito' ? '+' : '-' }}R$ {{ formatCurrency(lanc.valor) }}
              </td>
              <td>{{ formatCurrency(lanc.saldo) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Modal Depósito -->
    <div v-if="showDeposito" class="modal-overlay" @click="showDeposito = false">
      <div class="modal" @click.stop>
        <h3>Depósito</h3>
        <form @submit.prevent="registrarDeposito">
          <div class="form-group">
            <label for="desc-deposito">Descrição:</label>
            <input id="desc-deposito" v-model="descDeposito" required />
          </div>
          <div class="form-group">
            <label for="valor-deposito">Valor:</label>
            <input id="valor-deposito" type="number" v-model.number="valorDeposito" min="0.01" step="0.01" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="showDeposito = false" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-primary">Depositar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Retirada -->
    <div v-if="showRetirada" class="modal-overlay" @click="showRetirada = false">
      <div class="modal" @click.stop>
        <h3>Retirada</h3>
        <form @submit.prevent="registrarRetirada">
          <div class="form-group">
            <label for="desc-retirada">Descrição:</label>
            <input id="desc-retirada" v-model="descRetirada" required />
          </div>
          <div class="form-group">
            <label for="valor-retirada">Valor:</label>
            <input id="valor-retirada" type="number" v-model.number="valorRetirada" min="0.01" step="0.01" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="showRetirada = false" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-secondary">Retirar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ContaCorrenteView',
  data() {
    return {
      lancamentos: [],
      loading: true,
      showDeposito: false,
      showRetirada: false,
      descDeposito: '',
      valorDeposito: null,
      descRetirada: '',
      valorRetirada: null
    }
  },
  async mounted() {
    await this.loadLancamentos()
  },
  methods: {
    async loadLancamentos() {
      this.loading = true
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      // Ajuste o endpoint conforme seu backend
      const response = axios.get('/api/conta-corrente', config)
      // Espera-se que o backend já retorne saldo após cada lançamento
      this.lancamentos = response.data.lancamentos || [] //Erro está
      this.loading = false
    },
    async registrarDeposito() {
      if (!this.descDeposito || !this.valorDeposito || this.valorDeposito <= 0) return
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post('/api/conta-corrente/deposito', {
        descricao: this.descDeposito,
        valor: this.valorDeposito
      }, config)
      this.showDeposito = false
      this.descDeposito = ''
      this.valorDeposito = null
      await this.loadLancamentos()
    },
    async registrarRetirada() {
      if (!this.descRetirada || !this.valorRetirada || this.valorRetirada <= 0) return
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post('/api/conta-corrente/retirada', {
        descricao: this.descRetirada,
        valor: this.valorRetirada
      }, config)
      this.showRetirada = false
      this.descRetirada = ''
      this.valorRetirada = null
      await this.loadLancamentos()
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString('pt-BR')
    },
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.conta-corrente {
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

.conta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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
  background: #4CAF50;
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

.conta-content {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.lancamentos-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.lancamentos-table th, .lancamentos-table td {
  border: 1px solid #eee;
  padding: 0.75rem;
  text-align: left;
}

.lancamentos-table th {
  background: #f5f7fa;
  color: #333;
}

.lancamentos-table td.positive {
  color: #28a745;
  font-weight: bold;
}

.lancamentos-table td.negative {
  color: #dc3545;
  font-weight: bold;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.form-group input:focus {
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
</style> 