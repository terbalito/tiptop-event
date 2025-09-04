// client/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => config);

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

export const loginBackend = async (idToken) => {
  const { data } = await api.post("/auth/login", { idToken });
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
  return data;
};

export const fetchInvitesCount = async (eventId) => {
  const { data } = await api.get(`/invites/${eventId}/count`);
  return data;
};

// 👇 NEW: déclenche la génération (QR + cartes) pour l’event
export const generateCards = async (eventId) => {
  const { data } = await api.post(`/invites/${eventId}/generate-cards`);
  return data;
};

export const logout = async () => {
  try { await api.post("/auth/logout"); } catch {}
};





// ✅ bien mettre eventId dans l’URL
export const fetchInviteById = (eventId, inviteId) =>
  api.get(`/invites/${eventId}/invites/${inviteId}`).then(res => res.data);


export const registerDeviceForInvite = (eventId, inviteId, deviceId) =>
  api.post(`/events/${eventId}/invites/${inviteId}/register`, { deviceId });

// Exemple : récupérer un invité
export const getInviteById = (eventId, inviteId) =>
  api.get(`/events/${eventId}/invites/${inviteId}`);

// Exemple : enregistrer un device
export const registerDevice = (eventId, inviteId, deviceId) =>
  api.post(`/events/${eventId}/invites/${inviteId}/register`, { deviceId });


export default api;
