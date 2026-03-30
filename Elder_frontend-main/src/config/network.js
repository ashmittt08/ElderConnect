// Local Backend Configuration
export const LOCAL_URL = "http://172.25.217.57:5000";
export const REMOTE_URL = "https://elderconnect-zfi4.onrender.com";

// Toggle between local and remote
const USE_LOCAL = false; // Set to false for Production Deployment

export const PORT = "5000";
export const BASE_URL = USE_LOCAL ? LOCAL_URL : REMOTE_URL;
export const HOST_IP = USE_LOCAL ? "172.25.217.57" : REMOTE_URL;
