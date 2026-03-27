import mongoose from "mongoose";

const deliveryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  notes: { type: String, default: "" },
  urgent: { type: Boolean, default: false },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: "" },
});

const deliveryOrderSchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    category: {
      type: String,
      enum: ["medicine", "grocery"],
      required: true,
    },
    items: {
      type: [deliveryItemSchema],
      required: true,
      validate: [(v) => v.length > 0, "At least one item is required"],
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    specialInstructions: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    estimatedArrival: {
      type: Date,
      default: null,
    },
    volunteerLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    statusHistory: [statusHistorySchema],
    deliveryProofUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

deliveryOrderSchema.index({ volunteerLocation: "2dsphere" });
deliveryOrderSchema.index({ elder: 1, status: 1 });
deliveryOrderSchema.index({ volunteer: 1, status: 1 });

export default mongoose.model("DeliveryOrder", deliveryOrderSchema);
