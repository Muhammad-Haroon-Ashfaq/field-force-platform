import mongoose from "mongoose";

const mediaFileSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    filename: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
    },

    mimeType: {
      type: String,
    },

    sizeBytes: {
      type: Number,
    },

    path: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MediaFile", mediaFileSchema);