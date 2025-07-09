<template>
  <div class="minha-lista">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Simulador de Corretora</h1>
      </div>
      <div class="nav-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/carteira" class="nav-link">Carteira</router-link>
        <router-link to="/ordens" class="nav-link">Ordens</router-link>
        <router-link to="/acoes" class="nav-link">Ações</router-link>
        <router-link to="/minha-lista" class="nav-link active">Minha Lista</router-link>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </nav>

    <main class="main-content">
      <SimuladorRelogio @minuto-change="onMinutoChange" />
      <div class="header">
        <h1>Minha Lista de Interesse</h1>
        <p class="subtitle">Gerencie suas ações de interesse</p>
      </div>

    <!-- Filtros -->
    <div class="filtros">
      <div class="filtro-grupo">
        <label for="busca">Buscar:</label>
        <input 
          id="busca"
          v-model="filtroBusca" 
          type="text" 
          placeholder="Digite o ticker ou nome da ação..."
          class="input-busca"
        >
      </div>
      
      <div class="filtro-grupo">
        <label for="ordenacao">Ordenar por:</label>
        <select v-model="filtroOrdenacao" id="ordenacao" class="select-ordenacao">
          <option value="ordem">Ordem da Lista</option>
          <option value="preco">Preço</option>
          <option value="variacao">Variação</option>
          <option value="ticker">Ticker</option>
        </select>
      </div>
      
      <div class="filtro-grupo">
        <button @click="showAdicionarAcao = true" class="btn-adicionar-lista">
          + Adicionar à Lista
        </button>
      </div>
    </div>

    <!-- Lista de Ações de Interesse -->
    <div class="acoes-content">
      <div v-if="loading" class="loading">
        <p>Carregando sua lista de interesse...</p>
      </div>
      
      <div v-else-if="acoesFiltradas.length === 0" class="empty-state">
        <p>Nenhuma ação na sua lista de interesse.</p>
        <p>Adicione ações na página "Ações" para vê-las aqui.</p>
      </div>
      
      <div v-else class="acoes-grid">
        <div v-for="(acao, index) in acoesFiltradas" :key="acao.ticker" class="acao-card">
          <div class="acao-header">
            <h3>{{ acao.ticker }}</h3>
            <span class="acao-nome">{{ acao.nome || 'Ação' }}</span>
            <div class="acao-controls">
              <button 
                v-if="index > 0" 
                class="btn-subir" 
                @click="subirAcao(acao.ticker)" 
                title="Mover para cima"
              >
                ↑
              </button>
              <button 
                v-if="index < acoesFiltradas.length - 1" 
                class="btn-descer" 
                @click="descerAcao(acao.ticker)" 
                title="Mover para baixo"
              >
                ↓
              </button>
              <button 
                class="btn-remover" 
                @click="removerInteresse(acao.ticker)" 
                title="Remover da Lista"
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

    <!-- Modal de Compra -->
    <div v-if="showModalCompra" class="modal-overlay" @click="showModalCompra = false">
      <div class="modal" @click.stop>
        <h3>Comprar {{ acaoSelecionada?.ticker }}</h3>
        <div class="form-group">
          <label>Quantidade:</label>
          <input 
            v-model.number="quantidadeCompra" 
            type="number" 
            min="1" 
            class="form-control"
          >
        </div>
        <div class="form-group">
          <label>Preço por ação:</label>
          <span class="preco-info">{{ formatCurrency(acaoSelecionada?.preco_atual) }}</span>
        </div>
        <div class="form-group">
          <label>Valor total:</label>
          <span class="valor-total">{{ formatCurrency(valorTotalCompra) }}</span>
        </div>
        <div class="modal-actions">
          <button @click="confirmarCompra" class="btn-confirmar">Confirmar Compra</button>
          <button @click="showModalCompra = false" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
    
    <!-- Modal para adicionar ação -->
    <div v-if="showAdicionarAcao" class="modal-overlay" @click="showAdicionarAcao = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Adicionar Ação à Lista</h3>
          <button @click="showAdicionarAcao = false" class="btn-fechar">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="acoes-disponiveis">
            <h4>Ações Disponíveis:</h4>
            <div class="lista-acoes-disponiveis">
              <div 
                v-for="acao in acoesDisponiveis" 
                :key="acao.ticker"
                class="acao-disponivel"
                :class="{ 'selecionada': acaoSelecionadaModal === acao.ticker }"
                @click="selecionarAcao(acao.ticker)"
              >
                <div class="acao-info">
                  <span class="ticker">{{ acao.ticker }}</span>
                  <span class="preco">R$ {{ (acao.preco_atual || acao.preco || 0).toFixed(2) }}</span>
                  <span class="variacao" :class="getVariacaoClass(acao.variacao_percentual || acao.variacao)">
                    {{ (acao.variacao_percentual || acao.variacao || 0) > 0 ? '+' : '' }}{{ (acao.variacao_percentual || acao.variacao || 0).toFixed(2) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showAdicionarAcao = false" class="btn-cancelar">Cancelar</button>
          <button @click="adicionarInteresse" class="btn-confirmar" :disabled="!acaoSelecionadaModal">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  </main>
  </div>
</template>

<script>
import axios from 'axios'
import SimuladorRelogio from '@/components/SimuladorRelogio.vue'

export default {
  name: 'MinhaLista',
  components: {
    SimuladorRelogio
  },
  data() {
    return {
      acoesInteresse: [],
      acoesAnteriores: {},
      loading: false,
      filtroBusca: '',
      filtroOrdenacao: 'ordem',
      showModalCompra: false,
      acaoSelecionada: null,
      quantidadeCompra: 1,
      acoesDisponiveis: [],
      showAdicionarAcao: false,
      acaoSelecionadaModal: null
    }
  },
  computed: {
    acoesFiltradas() {
      // Mostra apenas as ações de interesse do usuário
      let acoes = this.acoesInteresse
      
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
        case 'ticker':
          return acoes.sort((a, b) => a.ticker.localeCompare(b.ticker))
        case 'ordem':
        default:
          // Mantém a ordem da lista de interesse (já vem ordenada do backend)
          return acoes
      }
    },
    valorTotalCompra() {
      if (!this.acaoSelecionada || !this.quantidadeCompra) return 0
      return this.acaoSelecionada.preco_atual * this.quantidadeCompra
    }
  },
  async mounted() {
    await this.loadAcoesInteresse()
  },
  watch: {
    async showAdicionarAcao(newVal) {
      if (newVal) {
        await this.carregarAcoesDisponiveis()
      }
    }
  },
  methods: {
    async loadAcoesInteresse() {
      try {
        this.loading = true
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }

        // Salva valores anteriores ANTES de buscar novos dados
        this.salvarValoresAnteriores()

        // Busca apenas as ações de interesse do usuário
        const response = await axios.get('/api/acoes/interesse', config)
        this.acoesInteresse = response.data
      } catch (error) {
        console.error('Erro ao carregar ações de interesse:', error)
        alert('Erro ao carregar sua lista de interesse')
      } finally {
        this.loading = false
      }
    },
    
    async subirAcao(ticker) {
      try {
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        await axios.put(`/api/acoes/interesse/${ticker}/subir`, {}, config)
        await this.loadAcoesInteresse()
        alert('Ação movida para cima')
      } catch (error) {
        console.error('Erro ao mover ação:', error)
        alert('Erro ao mover ação')
      }
    },
    
    async descerAcao(ticker) {
      try {
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        await axios.put(`/api/acoes/interesse/${ticker}/descer`, {}, config)
        await this.loadAcoesInteresse()
        alert('Ação movida para baixo')
      } catch (error) {
        console.error('Erro ao mover ação:', error)
        alert('Erro ao mover ação')
      }
    },
    
    async removerInteresse(ticker) {
      try {
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        await axios.delete(`/api/acoes/interesse/${ticker}`, config)
        await this.loadAcoesInteresse()
        alert('Ação removida da lista de interesse')
      } catch (error) {
        console.error('Erro ao remover ação:', error)
        alert('Erro ao remover ação da lista')
      }
    },
    
    comprarAcao(acao) {
      this.acaoSelecionada = acao
      this.quantidadeCompra = 1
      this.showModalCompra = true
    },
    
    async confirmarCompra() {
      if (!this.acaoSelecionada || !this.quantidadeCompra || this.quantidadeCompra <= 0) {
        alert('Quantidade inválida')
        return
      }
      
      try {
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        
        const ordemData = {
          ticker: this.acaoSelecionada.ticker,
          quantidade: this.quantidadeCompra,
          tipo: 'compra',
          preco: this.acaoSelecionada.preco_atual
        }
        
        await axios.post('/api/ordens/compra', ordemData, config)
        
        this.showModalCompra = false
        alert('Ordem de compra executada com sucesso!')
        
        // Recarrega os dados
        await this.loadAcoesInteresse()
      } catch (error) {
        console.error('Erro ao executar compra:', error)
        if (error.response?.data?.message) {
          alert(error.response.data.message)
        } else {
          alert('Erro ao executar compra')
        }
      }
    },
    
    onMinutoChange() {
      // Recarrega as ações quando o minuto muda
      this.loadAcoesInteresse()
    },
    
    // Função para verificar se um valor mudou
    getAnimacaoClass(ticker, campo) {
      const acao = this.acoesInteresse.find(a => a.ticker === ticker)
      if (!acao || !this.acoesAnteriores[ticker]) return ''
      
      const valorAnterior = this.acoesAnteriores[ticker][campo]
      const valorAtual = acao[campo]
      
      // Verifica se os valores são diferentes e não são null/undefined
      if (valorAtual !== valorAnterior && valorAtual != null && valorAnterior != null) {
        return valorAtual > valorAnterior ? 'valor-alterado-positivo' : 'valor-alterado-negativo'
      }
      return ''
    },
    
    getVariacaoClass(valor) {
      if (!valor) return ''
      return valor > 0 ? 'variacao-positiva' : valor < 0 ? 'variacao-negativa' : ''
    },
    
    formatCurrency(value) {
      if (value === null || value === undefined) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    },
    
    formatPercentual(value) {
      if (value === null || value === undefined) return '0,00%'
      return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value / 100)
    },
    
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    },
    
    salvarValoresAnteriores() {
      // Só salva se já existem ações carregadas
      this.acoesInteresse.forEach(acao => {
        this.acoesAnteriores[acao.ticker] = {
          preco_atual: acao.preco_atual,
          variacao_nominal: acao.variacao_nominal,
          variacao_percentual: acao.variacao_percentual
        }
      })
    },
    
    async carregarAcoesDisponiveis() {
      try {
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        
        // Busca todas as ações do mercado
        const response = await axios.get('/api/acoes', config)
        const todasAcoes = response.data
        
        // Filtra apenas as ações que não estão na lista de interesse
        const tickersInteresse = this.acoesInteresse.map(acao => acao.ticker)
        this.acoesDisponiveis = todasAcoes.filter(acao => 
          !tickersInteresse.includes(acao.ticker)
        )
        
        // Garante que os dados tenham as propriedades necessárias
        this.acoesDisponiveis = this.acoesDisponiveis.map(acao => ({
          ...acao,
          preco_atual: acao.preco_atual || acao.preco || 0,
          variacao_percentual: acao.variacao_percentual || acao.variacao || 0
        }))
        
        console.log('Ações disponíveis carregadas:', this.acoesDisponiveis.length)
      } catch (error) {
        console.error('Erro ao carregar ações disponíveis:', error)
        alert('Erro ao carregar ações disponíveis')
      }
    },
    
    selecionarAcao(ticker) {
      this.acaoSelecionadaModal = ticker
    },
    
    async adicionarInteresse() {
      if (!this.acaoSelecionadaModal) return
      
      try {
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` } }
        
        // Garantir que ticker seja uma string
        const tickerString = typeof this.acaoSelecionadaModal === 'string' ? 
          this.acaoSelecionadaModal : 
          this.acaoSelecionadaModal.ticker || this.acaoSelecionadaModal.toString()
        
        const data = { ticker: tickerString }
        console.log('Enviando dados:', data)
        
        await axios.post('/api/acoes/interesse', data, config)
        
        // Fecha o modal e recarrega a lista
        this.showAdicionarAcao = false
        this.acaoSelecionadaModal = null
        await this.loadAcoesInteresse()
        
        alert('Ação adicionada à lista de interesse!')
      } catch (error) {
        console.error('Erro ao adicionar ação de interesse:', error)
        if (error.response?.data?.message) {
          alert(error.response.data.message)
        } else {
          alert('Erro ao adicionar ação à lista')
        }
      }
    }
  }
}
</script>

<style scoped>
.minha-lista {
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

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.filtros {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Adicione este seletor para alinhar o botão com o campo */
.filtro-grupo .btn-adicionar-lista {
  align-self: flex-end;
  margin-top: 1.7rem; /* Ajuste esse valor para alinhar perfeitamente */
  height: 38px; /* igual ao input/select, se necessário */
  padding-top: 0;
  padding-bottom: 0;
  display: flex;
  align-items: center;
}

.filtro-grupo label {
  font-weight: 600;
  color: #2c3e50;
}

.input-busca, .select-ordenacao {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.input-busca {
  min-width: 250px;
}

.select-ordenacao {
  min-width: 150px;
}

.acoes-content {
  margin-top: 2rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.acoes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.acao-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  transition: transform 0.2s, box-shadow 0.2s;
}

.acao-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.acao-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.acao-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: bold;
}

.acao-nome {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.acao-controls {
  display: flex;
  gap: 0.25rem;
}

.btn-subir, .btn-descer, .btn-remover {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-subir:hover, .btn-descer:hover {
  background-color: #2980b9;
}

.btn-remover {
  background: #e74c3c;
}

.btn-remover:hover {
  background-color: #c0392b;
}

.acao-preco, .acao-fechamento, .acao-variacao {
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preco-atual-label, .fechamento-label, .variacao-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.preco-atual {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

.fechamento-valor {
  color: #7f8c8d;
}

.variacao-valor, .variacao-percentual {
  font-weight: 600;
}

.variacao-positiva {
  color: #27ae60;
}

.variacao-negativa {
  color: #e74c3c;
}

.acao-actions {
  margin-top: 1rem;
  text-align: center;
}

.btn-compra {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
  width: 100%;
}

.btn-compra:hover {
  background-color: #229954;
}

/* Animações para valores alterados */
.valor-alterado {
  animation: blink 1s ease-in-out;
}

.valor-alterado-positivo {
  animation: blinkPositive 1s ease-in-out;
}

.valor-alterado-negativo {
  animation: blinkNegative 1s ease-in-out;
}

@keyframes blink {
  0%, 100% { background-color: transparent; }
  50% { background-color: #f39c12; }
}

@keyframes blinkPositive {
  0%, 100% { background-color: transparent; }
  50% { background-color: #27ae60; }
}

@keyframes blinkNegative {
  0%, 100% { background-color: transparent; }
  50% { background-color: #e74c3c; }
}

/* Modal de Compra */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 400px;
  max-width: 500px;
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.preco-info, .valor-total {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-confirmar, .btn-cancelar {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  flex: 1;
}

.btn-confirmar {
  background: #27ae60;
  color: white;
}

.btn-confirmar:hover {
  background: #229954;
}

.btn-cancelar {
  background: #95a5a6;
  color: white;
}

.btn-cancelar:hover {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .minha-lista {
    padding: 1rem;
  }
  
  .filtros {
    flex-direction: column;
  }
  
  .input-busca, .select-ordenacao {
    min-width: auto;
  }
  
  .acoes-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    margin: 1rem;
    min-width: auto;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}

/* Modal para adicionar ação */
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 500px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-fechar {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-fechar:hover {
  color: #e74c3c;
}

.modal-body {
  margin-bottom: 1.5rem;
}

.acoes-disponiveis h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.lista-acoes-disponiveis {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
}

.acao-disponivel {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.acao-disponivel:hover {
  background-color: #f8f9fa;
}

.acao-disponivel.selecionada {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.acao-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.acao-info .ticker {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.1rem;
}

.acao-info .preco {
  color: #2c3e50;
  font-weight: 600;
}

.acao-info .variacao {
  font-weight: 600;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.btn-adicionar-lista {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-adicionar-lista:hover {
  background: #229954;
}
</style> 