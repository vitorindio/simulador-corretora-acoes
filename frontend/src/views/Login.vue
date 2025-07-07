<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Simulador de Corretora</h1>
      <h2>Login</h2>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="Digite seu email"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Senha:</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="Digite sua senha"
          />
        </div>
        
        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="register-link">
        <p>Não tem conta? <a href="#" @click.prevent="showRegister = true">Cadastre-se</a></p>
      </div>
    </div>
    
    <!-- Modal de Registro -->
    <div v-if="showRegister" class="modal-overlay" @click="showRegister = false">
      <div class="modal" @click.stop>
        <h2>Cadastro</h2>
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="reg-name">Nome:</label>
            <input 
              type="text" 
              id="reg-name" 
              v-model="registerData.nome" 
              required 
              placeholder="Digite seu nome"
            />
          </div>
          
          <div class="form-group">
            <label for="reg-email">Email:</label>
            <input 
              type="email" 
              id="reg-email" 
              v-model="registerData.email" 
              required 
              placeholder="Digite seu email"
            />
          </div>
          
          <div class="form-group">
            <label for="reg-password">Senha:</label>
            <input 
              type="password" 
              id="reg-password" 
              v-model="registerData.senha" 
              required 
              placeholder="Digite sua senha"
            />
          </div>
          
          <div class="form-actions">
            <button type="button" @click="showRegister = false" class="cancel-btn">
              Cancelar
            </button>
            <button type="submit" :disabled="registerLoading" class="register-btn">
              {{ registerLoading ? 'Cadastrando...' : 'Cadastrar' }}
            </button>
          </div>
        </form>
        
        <div v-if="registerError" class="error-message">
          {{ registerError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: '',
      showRegister: false,
      registerData: {
        nome: '',
        email: '',
        senha: ''
      },
      registerLoading: false,
      registerError: ''
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          email: this.email,
          senha: this.password
        })
        
        localStorage.setItem('token', response.data.token)
        this.$router.push('/dashboard')
      } catch (error) {
        this.error = error.response?.data?.message || 'Erro ao fazer login'
      } finally {
        this.loading = false
      }
    },
    
    async handleRegister() {
      this.registerLoading = true
      this.registerError = ''
      
      try {
        await axios.post('http://localhost:3000/api/auth/criar-conta', {
          nome: this.registerData.nome,
          email: this.registerData.email,
          senha: this.registerData.senha
        })
        
        this.showRegister = false
        this.registerData = { nome: '', email: '', senha: '' }
        alert('Cadastro realizado com sucesso! Faça login para continuar.')
      } catch (error) {
        this.registerError = error.response?.data?.message || 'Erro ao cadastrar'
      } finally {
        this.registerLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.login-card h2 {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 18px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 5px;
  margin-top: 15px;
  text-align: center;
}

.register-link {
  text-align: center;
  margin-top: 20px;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
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
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.cancel-btn {
  background: #666;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  flex: 1;
}

.register-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  flex: 1;
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 