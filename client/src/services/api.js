// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

// middleware auth si besoin
api.interceptors.request.use((config) => {
  // Rien à ajouter, les cookies sont gérés automatiquement
  return config;
});

// Ajoutez aussi un intercepteur pour les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Rediriger vers la page de login si non autorisé
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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

export const fetchInvitesByEvent = async (eventId) => {
  const { data } = await api.get(`/invites/${eventId}`);
  return data; // doit renvoyer un tableau d'invités côté backend
};


export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch {}
};

export default api;