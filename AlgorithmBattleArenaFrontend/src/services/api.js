import axios from 'axios';

// Automatically detect environment and use appropriate API URL
const BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // Local development
  : 'https://algorithmbattlearena-dwdmb7a6c0a7hqdc.southindia-01.azurewebsites.net'; // Production

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  auth = {
    login: (email, password) => this.client.post('/api/Auth/login', { email, password }),
    registerStudent: (data) => this.client.post('/api/Auth/register/student', data),
    registerTeacher: (data) => this.client.post('/api/Auth/register/teacher', data),
    refreshToken: () => this.client.get('/api/Auth/refresh/token'),
    getProfile: () => this.client.get('/api/Auth/profile')
  };

  lobbies = {
    getAll: () => this.client.get('/api/Lobbies'),
    getById: (id) => this.client.get(`/api/Lobbies/${id}`),
    create: (data) => this.client.post('/api/Lobbies', data),
    join: (lobbyCode) => this.client.post(`/api/Lobbies/${lobbyCode}/join`),
    leave: (id) => this.client.post(`/api/Lobbies/${id}/leave`),
    close: (id) => this.client.post(`/api/Lobbies/${id}/close`),
    kickParticipant: (id, email) => this.client.delete(`/api/Lobbies/${id}/participants/${email}`),
    delete: (id) => this.client.delete(`/api/Lobbies/${id}`)
  };

  matches = {
    start: (lobbyId, data) => this.client.post(`/api/Matches/${lobbyId}/start`, data)
  };

  problems = {
    getAll: (filters) => this.client.get('/api/Problems', { params: filters }),
    getById: (id) => this.client.get(`/api/Problems/${id}`),
    create: (data) => this.client.post('/api/Problems', data),
    update: (id, data) => this.client.put(`/api/Problems/${id}`, data),
    delete: (id) => this.client.delete(`/api/Problems/${id}`)
  };

  lobbies = {
    getAll: () => this.client.get('/api/Lobbies'),
    getById: (id) => this.client.get(`/api/Lobbies/${id}`),
    create: (data) => this.client.post('/api/Lobbies', data),
    join: (lobbyCode) => this.client.post(`/api/Lobbies/${lobbyCode}/join`),
    leave: (id) => this.client.post(`/api/Lobbies/${id}/leave`),
    close: (id) => this.client.post(`/api/Lobbies/${id}/close`),
    kickParticipant: (id, email) => this.client.delete(`/api/Lobbies/${id}/participants/${email}`),
    updatePrivacy: (id, isPublic) => this.client.put(`/api/Lobbies/${id}/privacy`, { isPublic }),
    updateDifficulty: (id, difficulty) => this.client.put(`/api/Lobbies/${id}/difficulty`, { difficulty }),
    delete: (id) => this.client.delete(`/api/Lobbies/${id}`)
  };
}

export default new ApiService();
