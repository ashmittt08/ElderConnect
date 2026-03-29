import axios from "axios";
import { auth } from "../config/firebase";
import { BASE_URL } from "../config/network";

const api = axios.create({
  baseURL: BASE_URL
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("TOKEN FETCH FAILED:", e.message);
  }
  console.log(`📡 [${config.method?.toUpperCase()}] -> ${config.baseURL}${config.url}`);
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
