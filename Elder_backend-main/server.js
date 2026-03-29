import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIO } from "socket.io";
import connectDB from "./src/config/db.js";
import volunteerRoutes from "./src/routes/volunteerRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import elderRoutes from "./src/routes/elderRoutes.js";
import ngoRoutes from "./src/routes/ngoRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import deliveryRoutes from "./src/routes/deliveryRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";


connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIO(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT"] },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Join a delivery tracking room
  socket.on("join-delivery", (orderId) => {
    socket.join(`delivery-${orderId}`);
    console.log(`📍 Socket ${socket.id} joined delivery-${orderId}`);
  });

  // Leave a delivery tracking room
  socket.on("leave-delivery", (orderId) => {
    socket.leave(`delivery-${orderId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

// Attach io to every request so routes can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ElderConnect Backend is Running 🚀",
    version: "1.0.0"
  });
});
app.use("/auth", authRoutes);
app.use("/elder", elderRoutes);
app.use("/volunteer", volunteerRoutes);
app.use("/ngo", ngoRoutes);
app.use("/admin", adminRoutes);
app.use("/profile", profileRoutes);
app.use("/delivery", deliveryRoutes);
app.use("/events", eventRoutes);

console.log("ENV:", process.env.FIREBASE_SERVICE_ACCOUNT ? "FOUND" : "MISSING");


const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
