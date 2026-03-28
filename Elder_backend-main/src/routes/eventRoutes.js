import express from "express";
import Event from "../models/Event.js";
import User from "../models/User.js";
import verifyUser from "../middleware/verifyUser.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// CREATE EVENT (NGO only)
router.post(
  "/",
  verifyUser,
  requireRole("ngo"),
  async (req, res) => {
    try {
      const { title, description, date, location } = req.body;
      if (!title || !description || !date || !location) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const event = await Event.create({
        title,
        description,
        date,
        location,
        ngo: req.user._id,
      });

      res.status(201).json(event);
    } catch (err) {
      console.error("❌ CREATE EVENT ERROR:", err);
      res.status(500).json({ message: "Failed to create event" });
    }
  }
);

// GET ALL EVENTS (All authenticated users)
router.get(
  "/",
  verifyUser,
  async (req, res) => {
    try {
      const events = await Event.find()
        .populate("ngo", "name email phone profilePhoto")
        .sort({ date: 1 });
      res.status(200).json(events);
    } catch (err) {
      console.error("❌ FETCH EVENTS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  }
);

// JOIN EVENT (Volunteer only)
router.post(
  "/:id/join",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const volunteerId = req.user._id;

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if already joined
      if (event.volunteers.includes(volunteerId)) {
        return res.status(400).json({ message: "Already joined this event" });
      }

      event.volunteers.push(volunteerId);
      await event.save();

      res.status(200).json({ message: "Joined event successfully", event });
    } catch (err) {
      console.error("❌ JOIN EVENT ERROR:", err);
      res.status(500).json({ message: "Failed to join event" });
    }
  }
);

export default router;
