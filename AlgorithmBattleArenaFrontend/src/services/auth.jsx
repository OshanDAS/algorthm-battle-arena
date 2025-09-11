import React, { createContext, useContext, useState, useEffect } from "react";
import jwtDecode from "jwt-decode";

const API = import.meta.env.VITE_API_BASE || "";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("access_token");
    return saved ? jwtDecode(saved) : null;
  });

  // --- Auto logout if token expired ---
  useEffect(() => {
    if (!token) return;

    try {
      const { exp } = jwtDecode(token);
      if (Date.now() >= exp * 1000) {
        logout();
      } else {
        // Optional: schedule logout exactly when token expires
        const timeout = setTimeout(() => logout(), exp * 1000 - Date.now());
        return () => clearTimeout(timeout);
      }
    } catch (err) {
      console.error("Failed to decode token", err);
      logout();
    }
  }, [token]);

  // --- Login ---
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      const t = data.accessToken || data.token;
      if (!t) throw new Error("No token returned from server");

      localStorage.setItem("access_token", t);
      setToken(t);
      setUser(jwtDecode(t));
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  // --- Logout ---
  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
