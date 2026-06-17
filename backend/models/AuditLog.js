import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
      enum: [
        "user_login",
        "user_logout",
        "user_created",
        "user_updated",
        "user_enabled",
        "user_disabled",
        "user_deleted",
        "shop_created",
        "shop_updated",
        "shop_deleted",
        "product_created",
        "product_updated",
        "product_deleted",
        "submission_created",
        "submission_synced",
        "form_created",
        "form_updated",
        "activity_created",
        "activity_updated",
        "company_settings_updated",
      ],
    },

    targetModel: {
      type: String,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);