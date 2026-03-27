import express from "express";
import upload from "../middleware/upload.js";
import verifyUser from "../middleware/verifyUser.js";
import { uploadIdController } from "../controller/profileController.js";

const router = express.Router();

router.post("/update", verifyUser, async (req, res) => {
  try {
    const {
      phone,
      address,
      gender,
      emergencyContact,
      idType,
      idFrontUrl,
      idBackUrl,
      selfieUrl,
    } = req.body;

    const user = await User.findById(req.user._id);

    user.phone = phone;
    user.address = address;
    user.gender = gender;
    user.emergencyContact = emergencyContact;

    user.verification = {
      idType,
      idFrontUrl,
      idBackUrl,
      selfieUrl,
      status: "pending",
    };

    user.profileCompleted = true;

    await user.save();

    res.json({ message: "Profile submitted for verification" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Profile update failed" });
  }
});

export default router;
