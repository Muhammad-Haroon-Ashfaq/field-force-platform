import ActivityType from "../models/ActivityType.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Create activity type
// @route   POST /api/activity-types
// @access  Private — company_admin
export const createActivityType = async (req, res) => {
  try {
    const {
      name, description, requiresShop, requiresLocation,
      requiresPhoto, requiresComments, allowedOffline, formTemplate,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Activity name is required" });
    }

    const activity = await ActivityType.create({
      company: req.companyId,
      name,
      description: description || null,
      requiresShop: requiresShop !== undefined ? requiresShop : true,
      requiresLocation: requiresLocation !== undefined ? requiresLocation : true,
      requiresPhoto: requiresPhoto !== undefined ? requiresPhoto : false,
      requiresComments: requiresComments !== undefined ? requiresComments : false,
      allowedOffline: allowedOffline !== undefined ? allowedOffline : true,
      formTemplate: formTemplate || null,
    });

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "activity_created",
      targetModel: "ActivityType",
      targetId: activity._id,
      details: { name: activity.name },
      ipAddress: req.ip,
    });

    const populated = await ActivityType.findById(activity._id).populate("formTemplate", "name");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all activity types (scoped to company)
// @route   GET /api/activity-types
// @access  Private
export const getActivityTypes = async (req, res) => {
  try {
    const filter = { company: req.companyId };

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const activities = await ActivityType.find(filter)
      .populate("formTemplate", "name fields")
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single activity type
// @route   GET /api/activity-types/:id
// @access  Private
export const getActivityTypeById = async (req, res) => {
  try {
    const activity = await ActivityType.findOne({
      _id: req.params.id,
      company: req.companyId,
    }).populate("formTemplate", "name fields");

    if (!activity) {
      return res.status(404).json({ message: "Activity type not found" });
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update activity type
// @route   PUT /api/activity-types/:id
// @access  Private — company_admin
export const updateActivityType = async (req, res) => {
  try {
    const activity = await ActivityType.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!activity) {
      return res.status(404).json({ message: "Activity type not found" });
    }

    const fields = [
      "name", "description", "requiresShop", "requiresLocation",
      "requiresPhoto", "requiresComments", "allowedOffline", "formTemplate", "isActive",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) activity[field] = req.body[field];
    });

    const updated = await activity.save();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "activity_updated",
      targetModel: "ActivityType",
      targetId: updated._id,
      ipAddress: req.ip,
    });

    const populated = await ActivityType.findById(updated._id).populate("formTemplate", "name");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle activity type active/inactive
// @route   PUT /api/activity-types/:id/toggle-status
// @access  Private — company_admin
export const toggleActivityStatus = async (req, res) => {
  try {
    const activity = await ActivityType.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!activity) {
      return res.status(404).json({ message: "Activity type not found" });
    }

    activity.isActive = !activity.isActive;
    await activity.save();

    res.json({
      message: `Activity type ${activity.isActive ? "activated" : "deactivated"}`,
      isActive: activity.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};