// src/services/auth.jsx  (update imports & initial state)
import React, { createContext, useContext, useState, useEffect } from "react";
import jwtDecode from "jwt-decode";
import { getToken, setToken as saveToken, clearToken } from "./tokenStorage";

const API = import.meta.env.VITE_API_BASE || "";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(() => {
    const saved = getToken();
    return saved ? jwtDecode(saved) : null;
  });

  // Sync when token changes via our helper (also pick up manual localStorage changes)
  useEffect(() => {
    const onTokenChanged = () => {
      const t = getToken();
      setTokenState(t);
      setUser(t ? jwtDecode(t) : null);
    };

    window.addEventListener("token-changed", onTokenChanged);
    window.addEventListener("storage", onTokenChanged); // cross-tab updates
    return () => {
      window.removeEventListener("token-changed", onTokenChanged);
      window.removeEventListener("storage", onTokenChanged);
    };
  }, []);

  // --- Login: use same API as before but persist via helper ---
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      const t = data.accessToken || data.token || data.jwt || data.access_token;
      if (!t) throw new Error("No token returned from server");

      // Persist via helper (writes canonical key and legacy key)
      saveToken(t);
      setTokenState(t);
      setUser(jwtDecode(t));
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
