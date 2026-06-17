import Submission from "../models/Submission.js";
import Shop from "../models/Shop.js";
import AuditLog from "../models/AuditLog.js";

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// @desc    Create submission (mobile app)
// @route   POST /api/submissions
// @access  Private — employee
export const createSubmission = async (req, res) => {
  try {
    const {
      clientUUID, activityType, shop, formTemplate,
      location, answers, comments, syncStatus,
    } = req.body;

    if (!clientUUID) {
      return res.status(400).json({ message: "clientUUID is required" });
    }

    if (!activityType) {
      return res.status(400).json({ message: "activityType is required" });
    }

    // Idempotency — same UUID dobara aaye toh duplicate nahi banaye
    const existing = await Submission.findOne({ clientUUID });
    if (existing) {
      return res.status(200).json({ message: "Already synced", submission: existing });
    }

    // Location validation
    let locationValidationStatus = "not_required";
    let distanceFromShop = null;

    if (shop && location?.lat && location?.lng) {
      const shopDoc = await Shop.findOne({ _id: shop, company: req.companyId });
      if (shopDoc?.latitude && shopDoc?.longitude) {
        distanceFromShop = calculateDistance(
          location.lat, location.lng,
          shopDoc.latitude, shopDoc.longitude
        );

        const radius = req.user.company?.settings?.submissionRadiusMeters || 50;

        if (distanceFromShop <= radius) {
          locationValidationStatus = "valid";
        } else {
          locationValidationStatus = "warning_outside_radius";
        }
      }
    } else if (location?.lat && location?.lng) {
      locationValidationStatus = "valid";
    }

    const submission = await Submission.create({
      clientUUID,
      company: req.companyId,
      user: req.user._id,
      shop: shop || null,
      activityType,
      formTemplate: formTemplate || null,
      location: {
        lat: location?.lat || null,
        lng: location?.lng || null,
        accuracyMeters: location?.accuracyMeters || null,
        distanceFromShop,
        validationStatus: locationValidationStatus,
      },
      answers: answers || {},
      comments: comments || null,
      syncStatus: syncStatus || "synced",
      syncedAt: new Date(),
    });

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "submission_created",
      targetModel: "Submission",
      targetId: submission._id,
      ipAddress: req.ip,
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all submissions (admin/manager)
// @route   GET /api/submissions
// @access  Private — company_admin, manager
export const getSubmissions = async (req, res) => {
  try {
    const filter = { company: req.companyId };

    if (req.query.user) filter.user = req.query.user;
    if (req.query.shop) filter.shop = req.query.shop;
    if (req.query.activityType) filter.activityType = req.query.activityType;
    if (req.query.syncStatus) filter.syncStatus = req.query.syncStatus;
    if (req.query.locationStatus) {
      filter["location.validationStatus"] = req.query.locationStatus;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const to = new Date(req.query.dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    // Manager sirf apni team ki submissions dekhe
    if (req.user.role === "manager") {
      const teamIds = await import("../models/User.js").then(({ default: User }) =>
        User.find({ manager: req.user._id, company: req.companyId }).distinct("_id")
      );
      filter.user = { $in: [...teamIds, req.user._id] };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Submission.countDocuments(filter);

    const submissions = await Submission.find(filter)
      .populate("user", "name email employeeCode")
      .populate("shop", "name area city")
      .populate("activityType", "name")
      .populate("formTemplate", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      submissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      company: req.companyId,
    })
      .populate("user", "name email employeeCode phone")
      .populate("shop", "name ownerName phone address area city latitude longitude")
      .populate("activityType", "name requiresPhoto requiresLocation")
      .populate("formTemplate", "name fields")
      .populate("mediaFiles");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get own submissions (employee/mobile)
// @route   GET /api/submissions/my
// @access  Private — employee
export const getMySubmissions = async (req, res) => {
  try {
    const filter = {
      company: req.companyId,
      user: req.user._id,
    };

    if (req.query.syncStatus) filter.syncStatus = req.query.syncStatus;

    const submissions = await Submission.find(filter)
      .populate("shop", "name")
      .populate("activityType", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};