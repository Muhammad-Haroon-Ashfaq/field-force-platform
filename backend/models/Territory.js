import mongoose from "mongoose";

const territorySchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: ["region", "city", "zone", "route"],
      required: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Territory",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Territory", territorySchema);