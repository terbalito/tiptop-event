import axios from "axios";

// Base URL dynamique selon l'environnement
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// 🔒 Interceptor pour gérer les 401 (token expiré / non autorisé)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);


// ========== AUTH ==========
// Login via Firebase ID token
export const loginBackend = async (idToken) => {
  const { data } = await api.post("/auth/login", { idToken });
  return data;
};

// Logout
export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch {}
};

// ========== EVENTS ==========
export const createEvent = async (payload) => {
  const { data } = await api.post("/events", payload);
  return data;
};

export const fetchEvents = async () => {
  const { data } = await api.get("/events");
  return data;
};

// ========== INVITES ==========
export const fetchInvitesByEvent = async (eventId) => {
  const { data } = await api.get(`/invites/${eventId}`);
  return data;
};

export const fetchInvitesCount = async (eventId) => {
  const { data } = await api.get(`/invites/${eventId}/count`);
  return data;
};

export const fetchInviteById = async (eventId, inviteId) => {
  const { data } = await api.get(`/invites/${eventId}/invites/${inviteId}`);
  return data;
};

export const generateCards = async (eventId) => {
  const { data } = await api.post(`/invites/${eventId}/generate-cards`);
  return data;
};

export const registerDeviceForInvite = async (eventId, inviteId, deviceId) =>
  api.post(`/invites/${eventId}/invites/${inviteId}/register`, { deviceId });

export const downloadInvitationPdf = async (eventId, inviteId, token) =>
  api.get(`/invites/${eventId}/${inviteId}/pdf?t=${token}`, { responseType: 'blob' });

// ========== SCANS ==========
export const scanInvite = async (eventId, inviteId) => {
  const { data } = await api.post(`/scan/${eventId}/${inviteId}`);
  return data;
};

// ========== CONTROLLERS ==========
export const fetchControllers = async () => {
  const { data } = await api.get("/controllers");
  return data;
};

export const createController = async (payload) => {
  const { data } = await api.post("/controllers", payload);
  return data;
};

export const loginController = async ({ username, password }) => {
  const { data } = await api.post("/controllers/login", { username, password });
  return data;
};

export const updateController = async (id, payload) => {
  const { data } = await api.put(`/controllers/${id}`, payload);
  return data;
};

export const deleteController = async (id) => {
  const { data } = await api.delete(`/controllers/${id}`);
  return data;
};

export default api;
