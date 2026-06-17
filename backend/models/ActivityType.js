import mongoose from "mongoose";

const activityTypeSchema = new mongoose.Schema(
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

    description: {
      type: String,
      trim: true,
    },

    requiresShop: {
      type: Boolean,
      default: true,
    },

    requiresLocation: {
      type: Boolean,
      default: true,
    },

    requiresPhoto: {
      type: Boolean,
      default: false,
    },

    requiresComments: {
      type: Boolean,
      default: false,
    },

    allowedOffline: {
      type: Boolean,
      default: true,
    },

    formTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormTemplate",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ActivityType", activityTypeSchema);