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
        <router-link to="/minha-lista" class="nav-link">Minha Lista</router-link>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </nav>

    <main class="main-content">
      <SimuladorRelogio @minuto-change="onMinutoChange" />
      <!-- Remover o antigo bloco de horário simulado e botões -->
      <div class="acoes-header">
        <h2>Mercado de Ações</h2>
        <div class="header-actions">
          <!-- REMOVER: <span class="relogio-simulado">Horário simulado: {{ horaSimulada }}</span> ... botões ... -->
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
              <div class="acao-controls">
                <button 
                  v-if="!acoesInteresse.includes(acao.ticker)" 
                  class="btn-adicionar" 
                  @click="adicionarInteresse(acao.ticker)" 
                  title="Adicionar à Lista de Interesse"
                >
                  +
                </button>
                <button 
                  v-else 
                  class="btn-remover" 
                  @click="removerInteresse(acao.ticker)" 
                  title="Remover da Lista de Interesse"
                >
                  ×
                </button>
              </div>
            </div>
            <div class="acao-preco">
              <span class="preco-atual-label">Preço Atual:</span>
              <span class="preco-atual" :class="getAnimacaoClass(acao.ticker, 'preco_atual')">{{ formatCurrency(acao.preco_atual) }}</span>
            </div>
            <div class="acao-fechamento">
              <span class="fechamento-label">Fechamento Anterior:</span>
              <span class="fechamento-valor">{{ formatCurrency(acao.fechamento) }}</span>
            </div>
            <div class="acao-variacao">
              <span class="variacao-label">Variação R$:</span>
              <span class="variacao-valor" :class="getVariacaoClass(acao.variacao_nominal) + ' ' + getAnimacaoClass(acao.ticker, 'variacao_nominal')">
                {{ formatCurrency(acao.variacao_nominal) }}
              </span>
              <span class="variacao-label">Variação %:</span>
              <span class="variacao-percentual" :class="getVariacaoClass(acao.variacao_percentual) + ' ' + getAnimacaoClass(acao.ticker, 'variacao_percentual')">
                {{ formatPercentual(acao.variacao_percentual) }}
              </span>
            </div>
            <div class="acao-actions">
              <button @click="comprarAcao(acao)" class="btn-compra">Comprar</button>
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
        <p class="modal-subtitle">Selecione uma ação que não esteja na sua lista de interesse:</p>
        
        <div class="acoes-disponiveis">
          <div 
            v-for="acao in acoesDisponiveisParaAdicionar" 
            :key="acao.ticker" 
            class="acao-opcao"
            @click="selecionarAcaoParaAdicionar(acao.ticker)"
            :class="{ 'selecionada': novaAcaoInteresse === acao.ticker }"
          >
            <div class="acao-opcao-info">
              <span class="acao-ticker">{{ acao.ticker }}</span>
              <span class="acao-preco">{{ formatCurrency(acao.preco_atual) }}</span>
            </div>
            <div class="acao-opcao-variacao">
              <span :class="getVariacaoClass(acao.variacao_percentual)">
                {{ formatPercentual(acao.variacao_percentual) }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="acoesDisponiveisParaAdicionar.length === 0" class="empty-state">
          <p>Todas as ações já estão na sua lista de interesse!</p>
        </div>
        
        <div class="form-actions">
          <button @click="showAdicionarAcao = false" class="btn-cancel">Cancelar</button>
          <button @click="adicionarInteresse" :disabled="!novaAcaoInteresse" class="btn-primary">
            Adicionar à Lista
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import SimuladorRelogio from '../components/SimuladorRelogio.vue'

export default {
  name: 'AcoesView',
  components: { SimuladorRelogio },
  data() {
    return {
      acoesMercado: [], // todas as ações do mercado
      acoesInteresse: [], // tickers de interesse do usuário
      acoesAnteriores: {}, // para rastrear valores anteriores
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
      minutoSimulado: 0
    }
  },
  computed: {
    acoesFiltradas() {
      // Mostra TODAS as ações do mercado (não apenas as de interesse)
      let acoes = this.acoesMercado
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
    },
    acoesDisponiveisParaAdicionar() {
      // Retorna apenas ações que não estão na lista de interesse
      return this.acoesMercado.filter(acao => !this.acoesInteresse.includes(acao.ticker))
    },
    horaSimulada() {
      // Exibe o horário simulado no formato 14:MM
      const baseHour = 14;
      const min = this.minutoSimulado.toString().padStart(2, '0');
      return `${baseHour}:${min}`;
    }
  },
  async mounted() {
    this.carregarMinutoSimulado()
    await this.loadAcoesMercado()
    await this.loadAcoesInteresse()
    await this.loadTickersDisponiveis()
  },
  methods: {
    // Função para decodificar o token JWT e obter o ID do usuário
    obterUserId() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return null
        
        // JWT é dividido em 3 partes por pontos
        const parts = token.split('.')
        if (parts.length !== 3) return null
        
        // Decodifica a segunda parte (payload) que contém os dados do usuário
        const payload = JSON.parse(atob(parts[1]))
        return payload.id
      } catch (error) {
        console.error('Erro ao decodificar token:', error)
        return null
      }
    },
    
    // Função para obter a chave do localStorage específica do usuário
    obterChaveMinuto() {
      const userId = this.obterUserId()
      return userId ? `minutoSimulado_${userId}` : 'minutoSimulado'
    },
    
    // Função para carregar o minuto simulado do localStorage
    carregarMinutoSimulado() {
      const chave = this.obterChaveMinuto()
      const minutoSalvo = localStorage.getItem(chave)
      this.minutoSimulado = minutoSalvo ? Number(minutoSalvo) : 0
    },
    
    async loadAcoesMercado() {
      try {
        this.loading = true
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        
        // Salva valores anteriores para animação ANTES de carregar novos dados
        this.salvarValoresAnteriores()
        
        // Carrega todas as ações do mercado com o minuto simulado
        const response = await axios.get(`/api/acoes?minuto=${this.minutoSimulado}`, config)
        this.acoesMercado = response.data
      } catch (error) {
        console.error('Erro ao carregar ações:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadAcoesInteresse() {
      try {
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        const response = await axios.get('/api/acoes/interesse', config)
        this.acoesInteresse = response.data.map(item => item.ticker)
      } catch (error) {
        console.error('Erro ao carregar ações de interesse:', error)
      }
    },
    async loadTickersDisponiveis() {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const response = await axios.get('/api/acoes/tickers', config)
      this.tickersDisponiveis = response.data.tickers
    },
    selecionarAcaoParaAdicionar(ticker) {
      this.novaAcaoInteresse = ticker
    },
    
    async adicionarInteresse(ticker) {
      if (!ticker) return
      
      // Garantir que ticker seja uma string
      const tickerString = typeof ticker === 'string' ? ticker : ticker.ticker || ticker.toString()
      
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      
      // Garantir que apenas o ticker seja enviado
      const data = { ticker: tickerString }
      console.log('Enviando dados:', data)
      
      await axios.post('/api/acoes/interesse', data, config)
      this.acoesInteresse.push(tickerString)
      this.showAdicionarAcao = false
      this.novaAcaoInteresse = ''
      await this.loadAcoesInteresse()
    },
    async removerInteresse(ticker) {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.delete(`/api/acoes/interesse/${ticker}`, config)
      this.acoesInteresse = this.acoesInteresse.filter(t => t !== ticker)
      await this.loadAcoesInteresse()
    },
    async subirAcao(ticker) {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`/api/acoes/interesse/subir/${ticker}`, {}, config)
      await this.loadAcoesInteresse()
    },
    async descerAcao(ticker) {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`/api/acoes/interesse/descer/${ticker}`, {}, config)
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
      await this.loadAcoesInteresse()
      this.loading = false
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
      localStorage.setItem(this.obterChaveMinuto(), this.minutoSimulado)
      this.refreshAcoes()
    },
    onMinutoChange(minuto) {
      // Atualiza o minuto simulado local
      this.minutoSimulado = minuto
      // Recarrega as ações quando o minuto muda
      this.loadAcoesMercado()
      // Também recarrega as ações de interesse
      this.loadAcoesInteresse()
    },
    // Função para verificar se um valor mudou
    valorMudou(ticker, campo) {
      const acao = this.acoesMercado.find(a => a.ticker === ticker)
      if (!acao || !this.acoesAnteriores[ticker]) return false
      
      const valorAnterior = this.acoesAnteriores[ticker][campo]
      const valorAtual = acao[campo]
      
      return valorAnterior !== valorAtual
    },

    // Função para verificar se um valor aumentou
    valorAumentou(ticker, campo) {
      const acao = this.acoesMercado.find(a => a.ticker === ticker)
      if (!acao || !this.acoesAnteriores[ticker]) return false
      
      const valorAnterior = this.acoesAnteriores[ticker][campo]
      const valorAtual = acao[campo]
      
      return valorAtual > valorAnterior
    },

    // Função para aplicar classe de animação
    getAnimacaoClass(ticker, campo) {
      if (!this.valorMudou(ticker, campo)) return ''
      
      if (this.valorAumentou(ticker, campo)) {
        return 'valor-alterado-positivo'
      } else {
        return 'valor-alterado-negativo'
      }
    },
    salvarValoresAnteriores() {
      // Só salva se já existem ações carregadas
      if (this.acoesMercado && this.acoesMercado.length > 0) {
        this.acoesMercado.forEach(acao => {
          this.acoesAnteriores[acao.ticker] = {
            preco_atual: acao.preco_atual,
            variacao_nominal: acao.variacao_nominal,
            variacao_percentual: acao.variacao_percentual
          }
        })
      }
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

.relogio-simulado {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
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

.btn-adicionar-lista {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.3s;
}

.btn-adicionar-lista:hover {
  opacity: 0.8;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.acao-controls {
  display: flex;
  gap: 0.25rem;
}

.btn-subir,
.btn-descer {
  background: #e0e0e0;
  color: #333;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-subir:hover,
.btn-descer:hover {
  background-color: #d0d0d0;
}

.btn-remover {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
}

.btn-remover:hover {
  opacity: 0.8;
}

.btn-adicionar {
  background: #4CAF50; /* Verde */
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-adicionar:hover {
  background-color: #388E3C; /* Verde mais escuro */
}

.acao-preco {
  margin-bottom: 1rem;
}

.preco-atual-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.preco-atual {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.acao-fechamento {
  margin-bottom: 1rem;
}

.fechamento-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.fechamento-valor {
  display: block;
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

.acao-variacao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.variacao-label {
  font-size: 0.9rem;
  color: #666;
  margin-right: 0.5rem;
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

.variacao-percentual.positive {
  color: #28a745;
}

.variacao-percentual.negative {
  color: #dc3545;
}

.variacao-percentual.neutral {
  color: #666;
}

.acao-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-compra {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.3s;
  background: #28a745;
  color: white;
}

.btn-compra:hover {
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

/* Modal Adicionar Ação */
.modal-subtitle {
  color: #666;
  margin-bottom: 1rem;
  text-align: center;
}

.acoes-disponiveis {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.acao-opcao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.acao-opcao:hover {
  background-color: #f8f9fa;
  border-color: #667eea;
}

.acao-opcao.selecionada {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.acao-opcao-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.acao-ticker {
  font-weight: bold;
  font-size: 1.1rem;
}

.acao-preco {
  font-size: 0.9rem;
  opacity: 0.8;
}

.acao-opcao-variacao {
  font-weight: bold;
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
.preco-atual.valor-alterado-positivo {
  animation: piscar-positivo 1s ease-in-out;
}

.preco-atual.valor-alterado-negativo {
  animation: piscar-negativo 1s ease-in-out;
}

.variacao-valor.valor-alterado-positivo,
.variacao-percentual.valor-alterado-positivo {
  animation: piscar-positivo 1s ease-in-out;
}

.variacao-valor.valor-alterado-negativo,
.variacao-percentual.valor-alterado-negativo {
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