import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    clientUUID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },

    activityType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActivityType",
      required: true,
    },

    formTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormTemplate",
    },

    location: {
      lat: { type: Number },
      lng: { type: Number },
      accuracyMeters: { type: Number },
      distanceFromShop: { type: Number },
      validationStatus: {
        type: String,
        enum: ["valid", "warning_outside_radius", "invalid_no_location", "invalid_poor_accuracy", "not_required"],
        default: "not_required",
      },
    },

    answers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    comments: {
      type: String,
      trim: true,
    },

    syncStatus: {
      type: String,
      enum: ["draft", "pending", "uploading", "synced", "failed"],
      default: "synced",
    },

    syncedAt: {
      type: Date,
    },

    mediaFiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaFile",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);