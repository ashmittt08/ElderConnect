import express from "express";
import User from "../models/User.js";
import Request from "../models/Request.js";
import verifyUser from "../middleware/verifyUser.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// DASHBOARD STATS (aggregated for admin dashboard)
router.get(
  "/dashboard-stats",
  verifyUser,
  requireRole("admin"),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Run all queries in parallel for performance
      const [
        totalUsers,
        activeNGOs,
        dailyActivities,
        reportsPending,
        usersByRole,
        requestsByType,
        requestsByStatus,
        recentUsers,
        pendingNGOs,
        flaggedReports,
        recentRequests,
        totalRequests,
      ] = await Promise.all([
        // Stat cards
        User.countDocuments(),
        User.countDocuments({ role: "ngo", approved: true }),
        Request.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ "verification.status": "pending" }),

        // Activity charts - users by role
        User.aggregate([
          { $group: { _id: "$role", count: { $sum: 1 } } },
        ]),

        // Activity charts - requests by type
        Request.aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),

        // Requests by status
        Request.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),

        // Recent users
        User.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .select("name email role approved createdAt verification"),

        // Pending NGO approvals
        User.find({ role: "ngo", approved: false }).select(
          "name email createdAt"
        ),

        // Flagged reports (pending verifications)
        User.find({ "verification.status": "pending" }).select(
          "name email role verification createdAt"
        ),

        // Recent requests
        Request.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("elder", "name")
          .populate("volunteer", "name"),

        // Total requests ever
        Request.countDocuments(),
      ]);

      res.json({
        stats: {
          totalUsers,
          activeNGOs,
          dailyActivities,
          reportsPending,
          totalRequests,
        },
        usersByRole,
        requestsByType,
        requestsByStatus,
        recentUsers,
        pendingNGOs,
        flaggedReports,
        recentRequests,
      });
    } catch (err) {
      console.error("DASHBOARD STATS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  }
);

// GET ALL USERS
router.get(
  "/users",
  verifyUser,
  requireRole("admin"),
  async (req, res) => {
    const users = await User.find();
    res.json(users);
  }
);

// APPROVE NGO
router.post(
  "/approve-ngo/:id",
  verifyUser,
  requireRole("admin"),
  async (req, res) => {
    const ngo = await User.findById(req.params.id);

    if (!ngo || ngo.role !== "ngo") {
      return res.status(404).json({ message: "NGO not found" });
    }

    ngo.approved = true;
    await ngo.save();

    res.json({ message: "NGO approved", ngo });
  }
);

// BLOCK / UNBLOCK USER
router.post(
  "/toggle-block/:id",
  verifyUser,
  requireRole("admin"),
  async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.approved = !user.approved;
    await user.save();

    res.json({
      message: user.approved ? "User unblocked" : "User blocked",
      user,
    });
  }
);

// DELETE USER
router.delete(
  "/delete/:id",
  verifyUser,
  requireRole("admin"),
  async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  }
);

router.get("/verifications", verifyUser, requireRole("admin"), async (req, res) => {
  const users = await User.find({
    "verification.status": "pending",
  }).select("name email role verification");

  res.json(users);
});

router.put("/verify-user/:id", verifyUser, requireRole("admin"), async (req, res) => {
  const { status, rejectionReason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  user.verification.status = status;
  user.verification.rejectionReason = rejectionReason || null;
  user.verification.verifiedAt = status === "verified" ? new Date() : null;

  await user.save();

  res.json(user);
});


export default router;
