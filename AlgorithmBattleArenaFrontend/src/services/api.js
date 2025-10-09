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

  matches = {
    start: (lobbyId, data) => this.client.post(`/api/Matches/${lobbyId}/start`, data)
  };

  problems = {
    getAll: (filters) => this.client.get('/api/Problems', { params: filters }),
    getById: (id) => this.client.get(`/api/Problems/${id}`),
    create: (data) => this.client.post('/api/Problems', data),
    generate: (data) => this.client.post('/api/Problems/generate', data),
    update: (id, data) => this.client.put(`/api/Problems/${id}`, data),
    delete: (id) => this.client.delete(`/api/Problems/${id}`)
  };

  submissions = {
    create: (data) => this.client.post('/api/Submissions', data)
  };

  students = {
    getByStatus: (status) => this.client.get(`/api/Students?status=${status}`),
    acceptRequest: (requestId) => this.client.put(`/api/Students/${requestId}/accept`),
    rejectRequest: (requestId) => this.client.put(`/api/Students/${requestId}/reject`),
    requestTeacher: (teacherId) => this.client.post('/api/Students/request', teacherId)
  };

  teachers = {
    getAll: () => this.client.get('/api/Teachers')
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

  admin = {
    getUsers: ({ q, role, page = 1, pageSize = 25 }) => 
      this.client.get('/api/Admin/users', { params: { q, role, page, pageSize } }),
    toggleUserActive: (prefixedId, deactivate) => 
      this.client.put(`/api/Admin/users/${encodeURIComponent(prefixedId)}/deactivate`, { deactivate }),
    importProblems: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return this.client.post('/api/Admin/problems/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  };
}

export default new ApiService();
