import express from "express";
import Request from "../models/Request.js";
import User from "../models/User.js";
import verifyUser from "../middleware/verifyUser.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// Get all pending requests
router.get(
  "/requests",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    const requests = await Request.find({ status: "pending" })
      .populate("elder", "name email");

    res.json(requests);
  }
);

// My tasks
router.get(
  "/tasks",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const tasks = await Request.find({
        volunteer: req.user._id,
      })
        .populate("elder", "name email")
        .sort({ createdAt: -1 });

      res.json(tasks);
    } catch (err) {
      console.error("FETCH TASKS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  }
);

//Accept task
router.post(
  "/accept/:id",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.id);

      if (!request || request.status !== "pending") {
        return res.status(400).json({ message: "Request not available" });
      }

      request.status = "assigned";
      request.volunteer = req.user._id;   // 🔥 VERY IMPORTANT
      await request.save();

      res.json({ message: "Request accepted", request });
    } catch (err) {
      console.error("ACCEPT ERROR:", err);
      res.status(500).json({ message: "Failed to accept request" });
    }
  }
);


// Complete task
router.post(
  "/complete/:id",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    const request = await Request.findOne({
      _id: req.params.id,
      volunteer: req.user._id,
    });

    if (!request) {
      return res.status(404).json({ message: "Task not found" });
    }

    request.status = "completed";
    await request.save();

    res.json(request);
  }
);

router.get(
  "/completed",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const completedTasks = await Request.find({
        volunteer: req.user._id,
        status: "completed",
      })
        .populate("elder", "name email")
        .sort({ updatedAt: -1 });

      res.json(completedTasks);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch history" });
    }
  }
);

// GET ALL NGOs
router.get(
  "/ngos",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const user = req.user;
      let query = { role: "ngo", approved: true };

      if (user.address) {
        const parts = user.address.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const city = parts[parts.length - 2];
          if (city) {
            query.address = { $regex: city, $options: 'i' };
          }
        }
      }

      const ngos = await User.find(query).select(
        "name address phone profilePhoto email"
      );
      res.status(200).json(ngos);
    } catch (err) {
      console.error("❌ FETCH NGOS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch NGOs" });
    }
  }
);

// JOIN NGO (Volunteer joins multiple NGOs)
router.post(
  "/join-ngo/:ngoId",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const ngoId = req.params.ngoId;
      const volunteerId = req.user._id;

      const ngo = await User.findById(ngoId);
      if (!ngo || ngo.role !== "ngo") {
        return res.status(404).json({ message: "NGO not found" });
      }

      // Check if already joined
      const volunteer = await User.findById(volunteerId);
      if (volunteer.joinedNGOs && volunteer.joinedNGOs.includes(ngoId)) {
        return res.status(400).json({ message: "Already joined this NGO" });
      }

      volunteer.joinedNGOs.push(ngoId);
      await volunteer.save();

      res.status(200).json({ message: "Successfully joined NGO" });
    } catch (err) {
      console.error("❌ JOIN NGO ERROR:", err);
      res.status(500).json({ message: "Failed to join NGO" });
    }
  }
);

// GET MY JOINED NGOs
router.get(
  "/my-ngos",
  verifyUser,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const volunteer = await User.findById(req.user._id).populate("joinedNGOs", "name address phone profilePhoto email");
      res.json(volunteer.joinedNGOs || []);
    } catch (err) {
      console.error("❌ FETCH MY NGOS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch joined NGOs" });
    }
  }
);

export default router;
