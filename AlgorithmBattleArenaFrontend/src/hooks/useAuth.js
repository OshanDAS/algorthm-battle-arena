import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function useAuth() {
  const navigate = useNavigate();

  // login function
  const login = useCallback(async (email, password) => {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password,
    });

    // adjust based on backend response (token, jwt, accessToken, etc.)
    const token = res.data.token || res.data.jwt || res.data.accessToken;
    if (!token) throw new Error("No token in login response");

    // store token in localStorage
    localStorage.setItem("jwt", token);
    localStorage.setItem("aba_email", email);

    return token;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("aba_email");
    navigate("/login");
  }, [navigate]);

  const token = localStorage.getItem("jwt");
  const email = localStorage.getItem("aba_email");

  return { token, email, login, logout };
}
