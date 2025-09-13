// src/services/auth.jsx  (update imports & initial state)
import React, { createContext, useContext, useState, useEffect } from "react";
import jwtDecode from "jwt-decode";
import { getToken, setToken as saveToken, clearToken } from "./tokenStorage";
import apiService from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(() => {
    const saved = getToken();
    return saved ? jwtDecode(saved) : null;
  });

  useEffect(() => {
    const onTokenChanged = () => {
      const t = getToken();
      setTokenState(t);
      setUser(t ? jwtDecode(t) : null);
      apiService.setAuthToken(t);
    };

    window.addEventListener("token-changed", onTokenChanged);
    window.addEventListener("storage", onTokenChanged);
    return () => {
      window.removeEventListener("token-changed", onTokenChanged);
      window.removeEventListener("storage", onTokenChanged);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiService.auth.login(email, password);
      const { token: t, role } = response.data;
      
      if (!t) throw new Error("No token returned from server");

      saveToken(t);
      setTokenState(t);
      const decoded = jwtDecode(t);
      setUser({ ...decoded, role });
      apiService.setAuthToken(t);
      
      return { role };
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
    apiService.setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
