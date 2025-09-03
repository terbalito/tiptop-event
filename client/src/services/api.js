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

export const fetchInviteById = async (inviteId) => {
  const { data } = await api.get(`/invites/invite/${inviteId}`); // public
  return data;
};

export const registerDeviceForInvite = async (inviteId, deviceId) => {
  const { data } = await api.post(`/invites/invite/${inviteId}/register-device`, { deviceId });
  return data;
};

export default api;
