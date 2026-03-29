import { io } from "socket.io-client";
import { BASE_URL } from "../config/network";

const SOCKET_URL = BASE_URL;

let socket = null;

export const connectSocket = () => {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected");
  });

  return socket;
};

export const joinDelivery = (orderId) => {
  if (socket) {
    socket.emit("join-delivery", orderId);
  }
};

export const leaveDelivery = (orderId) => {
  if (socket) {
    socket.emit("leave-delivery", orderId);
  }
};

export const onLocationUpdate = (callback) => {
  if (socket) {
    socket.on("location-update", callback);
  }
};

export const onStatusUpdate = (callback) => {
  if (socket) {
    socket.on("status-update", callback);
  }
};

export const offLocationUpdate = () => {
  if (socket) socket.off("location-update");
};

export const offStatusUpdate = () => {
  if (socket) socket.off("status-update");
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
