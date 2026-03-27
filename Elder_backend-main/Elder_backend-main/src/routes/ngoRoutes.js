import express from "express";
import User from "../models/User.js";
import Request from "../models/Request.js";
import verifyUser from "../middleware/verifyUser.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// DASHBOARD STATS
router.get(
  "/stats",
  verifyUser,
  requireRole("ngo"),
  async (req, res) => {
    try {
      const volunteers = await User.countDocuments({
        role: "volunteer",
      });

      const openRequests = await Request.countDocuments({
        status: "pending",
      });

      const completedTasks = await Request.countDocuments({
        status: "completed",
      });

      res.json({
        volunteers,
        openRequests,
        completedTasks,
      });
    } catch (err) {
      res.status(500).json({ message: "Stats fetch failed" });
    }
  }
);


// GET ALL REQUESTS
router.get(
  "/requests",
  verifyUser,
  requireRole("ngo"),
  async (req, res) => {
    try {
      const requests = await Request.find({
        status: "pending",
      })
        .populate("elder", "name email")
        .sort({ createdAt: -1 });

      res.json(requests);
    } catch (err) {
      console.error("❌ NGO FETCH REQUESTS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  }
);

// GET ALL VOLUNTEERS
router.get(
  "/volunteers",
  verifyUser,
  requireRole("ngo"),
  async (req, res) => {
    try {
      const volunteers = await User.find({ role: "volunteer" });
      res.json(volunteers);
    } catch (err) {
      console.error("FETCH VOLUNTEERS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch volunteers" });
    }
  }
);


// ASSIGN VOLUNTEER
router.post(
  "/assign",
  verifyUser,
  requireRole("ngo"),
  async (req, res) => {
    try {
      const { requestId, volunteerId } = req.body;

      const request = await Request.findById(requestId);

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.volunteer = volunteerId;
      request.status = "assigned";

      await request.save();

      res.json({ message: "Volunteer assigned successfully" });
    } catch (err) {
      console.error("ASSIGN ERROR:", err);
      res.status(500).json({ message: "Failed to assign volunteer" });
    }
  }
);

router.get(
  "/completed",
  verifyUser,
  requireRole("ngo"),
  async (req, res) => {
    try {
      const completedRequests = await Request.find({
        status: "completed",
      })
        .populate("elder", "name email")
        .populate("volunteer", "name email")
        .sort({ updatedAt: -1 }) // latest completed first
        .limit(5); // only latest 5

      res.json(completedRequests);
    } catch (err) {
      console.error("COMPLETED FETCH ERROR:", err);
      res.status(500).json({ message: "Failed to fetch completed requests" });
    }
  }
);



export default router;
