import { Platform } from "react-native";
import axios from "axios";
import { auth } from "../config/firebase";
import { HOST_IP, PORT } from "../config/network";

const BASE_URL = Platform.OS === "android" ? `http://${HOST_IP}:${PORT}` : `http://localhost:${PORT}`;

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
