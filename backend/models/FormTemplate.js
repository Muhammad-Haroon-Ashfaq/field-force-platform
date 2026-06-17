import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "short_text",
        "long_text",
        "single_select",
        "multi_select",
        "number",
        "date",
        "boolean",
        "product_checklist",
        "rating",
        "photo",
      ],
    },

    placeholder: {
      type: String,
      trim: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0,
    },

    options: {
      type: [String],
      default: [],
    },

    validationRules: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: true }
);

const formTemplateSchema = new mongoose.Schema(
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

    fields: {
      type: [fieldSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FormTemplate", formTemplateSchema);