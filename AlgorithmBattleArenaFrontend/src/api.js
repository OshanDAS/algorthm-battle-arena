import axios from "axios";

export function createApiClient({ backendBaseUrl = "" } = {}) {
  const client = axios.create({
    baseURL: backendBaseUrl || "http://localhost:5000",
    headers: { "Content-Type": "application/json" }
  });

  function withAuth(token) {
    if (!token) return client;
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return client;
  }

  return {
    withAuth,
    login: (email, password) => client.post("/api/Auth/login", { email, password }),
    registerStudent: (dto) => client.post("/api/Auth/register/student", dto),
    registerTeacher: (dto) => client.post("/api/Auth/register/teacher", dto),
    refreshToken: () => client.get("/api/Auth/refresh/token"),
    getProfile: () => client.get("/api/Auth/profile"),

    // still keep your match API
    startMatch: (lobbyId, body) =>
      client.post(`/api/matches/${encodeURIComponent(lobbyId)}/start`, body)
  };
}
