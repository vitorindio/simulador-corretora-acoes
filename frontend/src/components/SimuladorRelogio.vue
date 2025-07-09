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
      minutoSimulado: Number(localStorage.getItem('minutoSimulado')) || new Date().getMinutes()
    }
  },
  computed: {
    horaSimulada() {
      const baseHour = 14;
      const min = this.minutoSimulado.toString().padStart(2, '0');
      return `${baseHour}:${min}`;
    }
  },
  methods: {
    avancarMinuto(delta) {
      this.minutoSimulado = (this.minutoSimulado + delta) % 60
      if (this.minutoSimulado < 0) this.minutoSimulado += 60
      localStorage.setItem('minutoSimulado', this.minutoSimulado)
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