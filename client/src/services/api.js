// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

// middleware auth si besoin
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// FONCTION POUR SE CONNECTER AU BACKEND ET CREER LA SESSION
export const loginBackend = async (idToken) => {
  const { data } = await api.post("/auth/login", { idToken }); // 👈 MODIFICATION : envoi de l'idToken
  return data;
};

export const createEvent = async (payload) => {
  const { data } = await api.post("/events", payload);
  return data;
};

export const fetchEvents = async () => {
  const { data } = await api.get("/events");
  return data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch {}
};

export default api;