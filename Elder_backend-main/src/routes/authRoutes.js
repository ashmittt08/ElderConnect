import express from "express";
import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import verifyUser from "../middleware/verifyUser.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { token, role, name } = req.body;

    if (!token || !role || !name) {
      return res
        .status(400)
        .json({ message: "Token, role, and name required" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ uid: decoded.uid });

    if (!user) {
      user = await User.create({
        uid: decoded.uid,
        email: decoded.email,
        name, // 🔥 FIXED
        role,
        profileCompleted: false,
        approved: role === "ngo" ? false : true,
      });
    }

    return res.status(200).json(user.toObject());

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      message: "Register failed",
      error: error.message,
    });
  }
});

// GET CURRENT USER
router.get("/me", verifyUser, (req, res) => {
  return res.status(200).json(req.user || null);
});

router.get("/status", verifyUser, (req, res) => {
  const user = req.user;

  const ready =
    user.profileCompleted === true && user.verification?.status === "verified";

  res.json({
    profileCompleted: user.profileCompleted,
    verificationStatus: user.verification?.status,
    ready,
  });
});

router.put("/update-profile", verifyUser, async (req, res) => {
  try {
    const { phone, address, gender, emergencyContact, idFrontUrl } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    
    

    user.phone = phone;
    user.address = address;
    user.gender = gender;

    if (user.role === "elder") {
      user.emergencyContact = emergencyContact;
    }

    if (idFrontUrl) {
      user.verification = {
        idFrontUrl,
        status: "pending",
      };
    }

    // profile completed check
    if (phone && address && gender) {
      user.profileCompleted = true;
    }

    await user.save();

    res.status(200).json(user);
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
});

router.put("/upload-id", verifyUser, async (req, res) => {
  try {
    const { idType, idFrontUrl, idBackUrl, selfieUrl } = req.body;

    const user = await User.findById(req.user._id);

    user.verification.idType = idType;
    user.verification.idFrontUrl = idFrontUrl;
    user.verification.idBackUrl = idBackUrl;
    user.verification.selfieUrl = selfieUrl;
    user.verification.status = "pending";
    user.verification.rejectionReason = null;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error("UPLOAD ID ERROR:", err);
    res.status(500).json({ message: "Failed to upload ID" });
  }
});

export default router;
