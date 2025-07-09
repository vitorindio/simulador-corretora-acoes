<template>
  <div class="ordens">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Simulador de Corretora</h1>
      </div>
      <div class="nav-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/carteira" class="nav-link">Carteira</router-link>
        <router-link to="/ordens" class="nav-link active">Ordens</router-link>
        <router-link to="/acoes" class="nav-link">Ações</router-link>
        <router-link to="/minha-lista" class="nav-link">Minha Lista</router-link>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </nav>

    <main class="main-content">
      <SimuladorRelogio @minuto-change="onMinutoChange" />
      <!-- Remover qualquer bloco antigo de horário simulado e botões -->
      <div class="ordens-header">
        <h2>Minhas Ordens</h2>
        <div class="header-actions">
          <button @click="showNovaOrdem = true" class="btn-primary">Nova Ordem</button>
          <button @click="refreshOrdens" class="btn-secondary">Atualizar</button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filtros">
        <button 
          @click="filtroAtivo = 'todas'" 
          :class="['filtro-btn', { active: filtroAtivo === 'todas' }]"
        >
          Todas
        </button>
        <button 
          @click="filtroAtivo = 'pendentes'" 
          :class="['filtro-btn', { active: filtroAtivo === 'pendentes' }]"
        >
          Pendentes
        </button>
        <button 
          @click="filtroAtivo = 'executadas'" 
          :class="['filtro-btn', { active: filtroAtivo === 'executadas' }]"
        >
          Executadas
        </button>
      </div>

      <!-- Lista de Ordens -->
      <div class="ordens-content">
        <div v-if="loading" class="loading">
          <p>Carregando ordens...</p>
        </div>
        
        <div v-else-if="ordensFiltradas.length === 0" class="empty-state">
          <p>Nenhuma ordem encontrada.</p>
        </div>
        
        <div v-else class="ordens-list">
          <div v-for="ordem in ordensFiltradas" :key="`${ordem.tipo}-${ordem.id}`" class="ordem-card">
            <div class="ordem-header">
              <div class="ordem-info">
                <span class="ordem-ticker">{{ ordem.ticker }}</span>
                <span class="ordem-tipo" :class="ordem.tipo">{{ ordem.tipo }}</span>
                <span class="ordem-status" :class="ordem.executada ? 'executada' : 'pendente'">
                  {{ ordem.executada ? 'Executada' : 'Pendente' }}
                </span>
              </div>
              <div class="ordem-data">
                {{ formatDate(ordem.data_hora) }}
              </div>
            </div>
            
            <div class="ordem-details">
              <div class="detail-item">
                <span class="label">Quantidade:</span>
                <span class="value">{{ ordem.quantidade }} ações</span>
              </div>
              
              <div class="detail-item">
                <span class="label">Modo:</span>
                <span class="value">{{ ordem.modo }}</span>
              </div>
              
              <div v-if="ordem.modo === 'limite'" class="detail-item">
                <span class="label">Preço Limite:</span>
                <span class="value"> {{ formatCurrency(ordem.preco_referencia || ordem.preco_repasse) }}</span>
              </div>
              
              <div v-if="ordem.executada" class="detail-item">
                <span class="label">Preço Execução:</span>
                <span class="value"> {{ formatCurrency(ordem.preco_execucao) }}</span>
              </div>
              
              <div v-if="ordem.executada" class="detail-item">
                <span class="label">Data Execução:</span>
                <span class="value">{{ formatDate(ordem.data_hora_execucao) }}</span>
              </div>
            </div>
            
            <div class="ordem-actions">
              <button 
                v-if="!ordem.executada" 
                @click="executarOrdem(ordem)" 
                class="btn-executar"
              >
                Executar
              </button>
              <button 
                v-if="!ordem.executada" 
                @click="cancelarOrdem(ordem)" 
                class="btn-cancelar"
              >
                Cancelar
              </button>
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
  name: 'OrdensView',
  components: { SimuladorRelogio },
  data() {
    return {
      ordens: [],
      acoesDisponiveis: [],
      loading: true,
      filtroAtivo: 'todas',
      showNovaOrdem: false,
      novaOrdem: {
        tipo: '',
        ticker: '',
        quantidade: 1,
        modo: 'mercado',
        preco_referencia: null
      },
      criandoOrdem: false,
      ordemError: '',
      minutoSimulado: 0 // Adicionado para controlar o minuto simulado
    }
  },
  computed: {
    ordensFiltradas() {
      switch (this.filtroAtivo) {
        case 'pendentes':
          return this.ordens.filter(ordem => !ordem.executada)
        case 'executadas':
          return this.ordens.filter(ordem => ordem.executada)
        default:
          return this.ordens
      }
    }
  },
  async mounted() {
    await this.loadOrdens()
    await this.loadAcoesDisponiveis()
  },
  methods: {
    async loadOrdens() {
      try {
        const token = localStorage.getItem('token')
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        const [compraResponse, vendaResponse] = await Promise.all([
          axios.get('http://localhost:3000/api/ordens/compra', config),
          axios.get('http://localhost:3000/api/ordens/venda', config)
        ])

        const ordensCompra = compraResponse.data.map(ordem => ({ ...ordem, tipo: 'compra' }))
        const ordensVenda = vendaResponse.data.map(ordem => ({ ...ordem, tipo: 'venda' }))
        
        this.ordens = [...ordensCompra, ...ordensVenda]
          .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))
      } catch (error) {
        console.error('Erro ao carregar ordens:', error)
      } finally {
        this.loading = false
      }
    },

    async loadAcoesDisponiveis() {
      try {
        const token = localStorage.getItem('token')
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }
        // Usa o minuto simulado se existir, senão o minuto atual
        const minuto = Number(localStorage.getItem('minutoSimulado')) || new Date().getMinutes();
        const response = await axios.get(`http://localhost:3000/api/acoes?minuto=${minuto}`, config)
        this.acoesDisponiveis = response.data.acoes // resposta é { acoes: [...] }
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
        await this.loadOrdens()
      } catch (error) {
        this.ordemError = error.response?.data?.message || 'Erro ao criar ordem'
      } finally {
        this.criandoOrdem = false
      }
    },

    async executarOrdem(ordem) {
      if (confirm(`Deseja executar esta ordem de ${ordem.tipo}?`)) {
        try {
          const token = localStorage.getItem('token')
          const config = {
            headers: { Authorization: `Bearer ${token}` }
          }

          await axios.post(`http://localhost:3000/api/ordens/${ordem.tipo}/${ordem.id}/executar`, {}, config)
          
          alert('Ordem executada com sucesso!')
          await this.loadOrdens()
        } catch (error) {
          alert(error.response?.data?.message || 'Erro ao executar ordem')
        }
      }
    },

    async cancelarOrdem(ordem) {
      if (confirm(`Deseja cancelar esta ordem?`)) {
        try {
          const token = localStorage.getItem('token')
          const config = {
            headers: { Authorization: `Bearer ${token}` }
          }

          await axios.delete(`http://localhost:3000/api/ordens/${ordem.tipo}/${ordem.id}`, config)
          
          alert('Ordem cancelada com sucesso!')
          await this.loadOrdens()
        } catch (error) {
          alert(error.response?.data?.message || 'Erro ao cancelar ordem')
        }
      }
    },

    async refreshOrdens() {
      this.loading = true
      await this.loadOrdens()
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
    },

    onMinutoChange(minuto) {
      this.minutoSimulado = minuto
      this.loadOrdens()
      this.loadAcoesDisponiveis()
    }
  }
}
</script>

<style scoped>
.ordens {
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

.ordens-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.ordens-header h2 {
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

.filtro-btn {
  background: white;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.filtro-btn:hover,
.filtro-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.ordens-content {
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

.ordens-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ordem-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.5rem;
  transition: box-shadow 0.3s;
}

.ordem-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.ordem-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.ordem-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ordem-ticker {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.ordem-tipo {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 500;
}

.ordem-tipo.compra {
  background: #d4edda;
  color: #155724;
}

.ordem-tipo.venda {
  background: #f8d7da;
  color: #721c24;
}

.ordem-status {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 500;
}

.ordem-status.pendente {
  background: #fff3cd;
  color: #856404;
}

.ordem-status.executada {
  background: #d4edda;
  color: #155724;
}

.ordem-data {
  color: #666;
  font-size: 0.9rem;
}

.ordem-details {
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.detail-item .label {
  color: #666;
  font-size: 0.9rem;
}

.detail-item .value {
  font-weight: 500;
  color: #333;
}

.ordem-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-executar,
.btn-cancelar {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.3s;
}

.btn-executar {
  background: #28a745;
  color: white;
}

.btn-cancelar {
  background: #dc3545;
  color: white;
}

.btn-executar:hover,
.btn-cancelar:hover {
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

  .ordens-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
  }

  .filtros {
    flex-wrap: wrap;
  }

  .ordem-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .ordem-info {
    flex-wrap: wrap;
  }
}
</style> 