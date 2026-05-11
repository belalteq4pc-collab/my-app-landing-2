import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

// Device-based user ID (persisted in localStorage)
const USER_KEY = "qz_user_id";
export function getUserId() {
  let uid = localStorage.getItem(USER_KEY);
  if (!uid) {
    uid =
      "u_" +
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36).slice(-4);
    localStorage.setItem(USER_KEY, uid);
  }
  return uid;
}

export async function listPlaces(userId) {
  const { data } = await api.get(`/places`, { params: { user_id: userId } });
  return data;
}
export async function createPlace(payload) {
  const { data } = await api.post(`/places`, payload);
  return data;
}
export async function updatePlace(id, payload) {
  const { data } = await api.put(`/places/${id}`, payload);
  return data;
}
export async function deletePlace(id) {
  const { data } = await api.delete(`/places/${id}`);
  return data;
}
export async function listVisits(userId) {
  const { data } = await api.get(`/visits`, { params: { user_id: userId } });
  return data;
}
export async function createVisit(payload) {
  const { data } = await api.post(`/visits`, payload);
  return data;
}
export async function clearVisits(userId) {
  const { data } = await api.delete(`/visits`, { params: { user_id: userId } });
  return data;
}
export async function getStats(userId) {
  const { data } = await api.get(`/stats`, { params: { user_id: userId } });
  return data;
}
