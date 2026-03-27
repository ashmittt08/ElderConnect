import User from "../models/User.js";

export const uploadIdController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.verification = {
      idType: req.body.idType,
      idFrontUrl: req.files.idFront?.[0]?.path || "",
      idBackUrl: req.files.idBack?.[0]?.path || "",
      selfieUrl: req.files.selfie?.[0]?.path || "",
      status: "pending",
      rejectionReason: "",
      verifiedAt: null,
    };

    await user.save();

    res.status(200).json({
      message: "ID uploaded successfully",
      status: "pending",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};
