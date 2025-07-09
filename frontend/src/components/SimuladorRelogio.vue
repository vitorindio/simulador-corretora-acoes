<template>
  <div class="simulador-relogio">
    <span class="relogio-simulado">Horário simulado: {{ horaSimulada }}</span>
    <button @click="avancarMinuto(-5)" class="btn-secondary">-5 min</button>
    <button @click="avancarMinuto(-1)" class="btn-secondary">-1 min</button>
    <button @click="avancarMinuto(1)" class="btn-secondary">+1 min</button>
    <button @click="avancarMinuto(5)" class="btn-secondary">+5 min</button>
  </div>
</template>

<script>
export default {
  name: 'SimuladorRelogio',
  props: {
    onMinutoChange: Function
  },
  data() {
    return {
      minutoSimulado: 0
    }
  },
  computed: {
    horaSimulada() {
      const baseHour = 14;
      const min = this.minutoSimulado.toString().padStart(2, '0');
      return `${baseHour}:${min}`;
    }
  },
  mounted() {
    this.carregarMinutoSimulado()
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
    
    avancarMinuto(delta) {
      this.minutoSimulado = (this.minutoSimulado + delta) % 60
      if (this.minutoSimulado < 0) this.minutoSimulado += 60
      
      // Salva no localStorage com a chave específica do usuário
      const chave = this.obterChaveMinuto()
      localStorage.setItem(chave, this.minutoSimulado)
      
      this.$emit('minuto-change', this.minutoSimulado)
      if (this.onMinutoChange) this.onMinutoChange(this.minutoSimulado)
    }
  }
}
</script>

<style scoped>
.simulador-relogio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.relogio-simulado {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}
.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.3s;
}
.btn-secondary:hover {
  opacity: 0.9;
}
</style> 