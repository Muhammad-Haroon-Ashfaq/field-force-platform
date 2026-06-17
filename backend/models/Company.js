import mongoose from "mongoose";

const companySettingsSchema = new mongoose.Schema(
  {
    submissionRadiusMeters: { type: Number, default: 50 },
    isPhotoRequired: { type: Boolean, default: false },
    isCommentsRequired: { type: Boolean, default: false },
    allowEmployeeShopCreation: { type: Boolean, default: false },
    allowGalleryUpload: { type: Boolean, default: false },
    isLocationMandatory: { type: Boolean, default: true },
    isOfflineModeEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    settings: {
      type: companySettingsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);