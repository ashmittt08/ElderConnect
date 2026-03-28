import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    uid: { type: String, required: true, unique: true },

    email: { type: String, required: true, unique: true },

    role: {
      type: String,
      enum: ["elder", "volunteer", "ngo", "admin"],
      required: true,
    },

    // NGO Memberships
    joinedNGO: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For Elder
    joinedNGOs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // For Volunteer

    // ✅ ADD THESE
    phone: { type: String },
    address: { type: String },
    gender: { type: String },
    emergencyContact: { type: String },
    profilePhoto: { type: String, default: "" },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    approved: {
      type: Boolean,
      default: true,
    },

    verification: {
      idType: { type: String },
      idFrontUrl: { type: String },
      idBackUrl: { type: String },
      selfieUrl: { type: String },

      status: {
        type: String,
        enum: ["not_uploaded", "pending", "verified", "rejected"],
        default: "not_uploaded",
      },

      rejectionReason: { type: String },
      verifiedAt: { type: Date },
    },
  },
  { timestamps: true }
);


export default mongoose.model("User", userSchema);
