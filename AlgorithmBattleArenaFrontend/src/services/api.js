import axios from 'axios';

const BASE_URL = 'htttps://algorithmbattlearena-dwdmb7a6c0a7hqdc.southindia-01.azurewebsites.net';

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
    join: (id) => this.client.post(`/api/Lobbies/${id}/join`),
    leave: (id) => this.client.post(`/api/Lobbies/${id}/leave`),
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
}

export default new ApiService();
