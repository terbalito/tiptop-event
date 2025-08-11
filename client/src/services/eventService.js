import axios from 'axios';

const API_URL = 'http://localhost:4000/api/events';

export const createEvent = async (eventData, token) => {
  return await axios.post(`${API_URL}/create`, eventData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchEvents = async (token) => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
