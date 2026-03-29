import express from "express";
import verifyUser from "../middleware/verifyUser.js";
import requireRole from "../middleware/requireRole.js";
import DeliveryOrder from "../models/DeliveryOrder.js";

const router = express.Router();

// ── Elder: Place a new delivery order ──
router.post(
  "/order",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      const { category, items, deliveryAddress, specialInstructions } = req.body;

      if (!category || !items || !items.length || !deliveryAddress) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const order = await DeliveryOrder.create({
        elder: req.user._id,
        category,
        items,
        deliveryAddress,
        specialInstructions: specialInstructions || "",
        statusHistory: [{ status: "pending", note: "Order placed" }],
      });

      // Emit to any listening volunteers
      if (req.io) req.io.emit("new-delivery-order", { orderId: order._id, category });

      res.status(201).json(order);
    } catch (err) {
      console.error("❌ CREATE DELIVERY ORDER ERROR:", err);
      res.status(500).json({ message: "Failed to create delivery order" });
    }
  }
);

// ── Elder: Get my orders ──
router.get(
  "/orders",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      const orders = await DeliveryOrder.find({ elder: req.user._id })
        .populate("volunteer", "name phone")
        .sort({ createdAt: -1 });

      res.json(orders);
    } catch (err) {
      console.error("❌ FETCH ORDERS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  }
);

// ── Elder/Volunteer: Get single order details ──
router.get(
  "/order/:id",
  verifyUser,
  async (req, res) => {
    try {
      const order = await DeliveryOrder.findById(req.params.id)
        .populate("elder", "name phone address email")
        .populate("volunteer", "name phone email");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only the elder who placed it or assigned volunteer can view
      const userId = req.user._id.toString();
      const isElder = order.elder._id.toString() === userId;
      const isVolunteer = order.volunteer && order.volunteer._id.toString() === userId;
      const isAdmin = req.user.role === "admin";

      if (!isElder && !isVolunteer && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (err) {
      console.error("❌ FETCH ORDER ERROR:", err);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  }
);

// ── Volunteer: Get available (pending) delivery orders ──
router.get(
  "/available",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      if (!req.user.approved) {
        return res.status(403).json({ message: "Account verification pending. You cannot accept deliveries yet." });
      }

      const orders = await DeliveryOrder.find({ status: "pending" })
        .populate("elder", "name address")
        .sort({ createdAt: -1 });

      res.json(orders);
    } catch (err) {
      console.error("❌ FETCH AVAILABLE DELIVERIES ERROR:", err);
      res.status(500).json({ message: "Failed to fetch available deliveries" });
    }
  }
);

// ── Volunteer: Accept a delivery order ──
router.post(
  "/accept/:id",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      if (!req.user.approved) {
        return res.status(403).json({ message: "Account verification pending. You cannot accept deliveries yet." });
      }
      const order = await DeliveryOrder.findById(req.params.id);

      if (!order || order.status !== "pending") {
        return res.status(400).json({ message: "Order not available" });
      }

      order.status = "accepted";
      order.volunteer = req.user._id;
      order.statusHistory.push({
        status: "accepted",
        note: `Accepted by ${req.user.name}`,
      });
      await order.save();

      // Notify elder in real-time
      if (req.io) {
        req.io.to(`delivery-${order._id}`).emit("status-update", {
          status: "accepted",
          timestamp: new Date(),
          volunteerName: req.user.name,
        });
      }

      res.json({ message: "Delivery accepted", order });
    } catch (err) {
      console.error("❌ ACCEPT DELIVERY ERROR:", err);
      res.status(500).json({ message: "Failed to accept delivery" });
    }
  }
);

// ── Volunteer: Update delivery status ──
router.put(
  "/status/:id",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const { status, note, estimatedArrival } = req.body;
      const validStatuses = ["picked_up", "out_for_delivery", "delivered"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await DeliveryOrder.findOne({
        _id: req.params.id,
        volunteer: req.user._id,
      });

      if (!order) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      order.status = status;
      order.statusHistory.push({
        status,
        note: note || `Status updated to ${status}`,
      });

      if (estimatedArrival) {
        order.estimatedArrival = new Date(estimatedArrival);
      }

      await order.save();

      // Notify elder in real-time
      if (req.io) {
        req.io.to(`delivery-${order._id}`).emit("status-update", {
          status,
          timestamp: new Date(),
          estimatedArrival: order.estimatedArrival,
        });
      }

      res.json({ message: "Status updated", order });
    } catch (err) {
      console.error("❌ UPDATE STATUS ERROR:", err);
      res.status(500).json({ message: "Failed to update status" });
    }
  }
);

// ── Volunteer: Update live location ──
router.put(
  "/location/:id",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const { latitude, longitude } = req.body;

      if (latitude == null || longitude == null) {
        return res.status(400).json({ message: "Missing coordinates" });
      }

      const order = await DeliveryOrder.findOneAndUpdate(
        { _id: req.params.id, volunteer: req.user._id },
        {
          volunteerLocation: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      // Broadcast to elder in real-time
      if (req.io) {
        req.io.to(`delivery-${order._id}`).emit("location-update", {
          latitude,
          longitude,
          timestamp: new Date(),
        });
      }

      res.json({ message: "Location updated" });
    } catch (err) {
      console.error("❌ UPDATE LOCATION ERROR:", err);
      res.status(500).json({ message: "Failed to update location" });
    }
  }
);

// ── Volunteer: Get active delivery ──
router.get(
  "/active",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const activeOrder = await DeliveryOrder.findOne({
        volunteer: req.user._id,
        status: { $in: ["accepted", "picked_up", "out_for_delivery"] },
      })
        .populate("elder", "name phone address email")
        .sort({ updatedAt: -1 });

      res.json(activeOrder || null);
    } catch (err) {
      console.error("❌ FETCH ACTIVE DELIVERY ERROR:", err);
      res.status(500).json({ message: "Failed to fetch active delivery" });
    }
  }
);

// ── Volunteer: Get delivery history (completed/cancelled) ──
router.get(
  "/history",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const history = await DeliveryOrder.find({
        volunteer: req.user._id,
        status: { $in: ["delivered", "cancelled"] },
      })
        .populate("elder", "name address")
        .sort({ updatedAt: -1 });

      res.json(history);
    } catch (err) {
      console.error("❌ FETCH DELIVERY HISTORY ERROR:", err);
      res.status(500).json({ message: "Failed to fetch delivery history" });
    }
  }
);

// ── Elder: Cancel a pending order ──
router.put(
  "/cancel/:id",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      const order = await DeliveryOrder.findOne({
        _id: req.params.id,
        elder: req.user._id,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Can only cancel pending orders" });
      }

      order.status = "cancelled";
      order.statusHistory.push({
        status: "cancelled",
        note: "Cancelled by elder",
      });
      await order.save();

      res.json({ message: "Order cancelled", order });
    } catch (err) {
      console.error("❌ CANCEL ORDER ERROR:", err);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  }
);

export default router;
