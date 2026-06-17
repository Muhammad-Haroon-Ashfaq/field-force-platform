import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    area: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    shopType: {
      type: String,
      trim: true,
    },

    latitude: {
      type: Number,
    },

    longitude: {
      type: Number,
    },

    territory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Territory",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);