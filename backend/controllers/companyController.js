import Company from "../models/Company.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Create company (super_admin only)
// @route   POST /api/companies
// @access  Private — super_admin
export const createCompany = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Name and code are required" });
    }

    const exists = await Company.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: "Company code already exists" });
    }

    const company = await Company.create({ name, code });

    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all companies (super_admin only)
// @route   GET /api/companies
// @access  Private — super_admin
export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private — super_admin, company_admin
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update company settings
// @route   PUT /api/companies/:id/settings
// @access  Private — company_admin
export const updateCompanySettings = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // company_admin sirf apni company update kar sakta hai
    if (
      req.user.role === "company_admin" &&
      company._id.toString() !== req.companyId.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      submissionRadiusMeters,
      isPhotoRequired,
      isCommentsRequired,
      allowEmployeeShopCreation,
      allowGalleryUpload,
      isLocationMandatory,
      isOfflineModeEnabled,
    } = req.body;

    if (submissionRadiusMeters !== undefined)
      company.settings.submissionRadiusMeters = submissionRadiusMeters;
    if (isPhotoRequired !== undefined)
      company.settings.isPhotoRequired = isPhotoRequired;
    if (isCommentsRequired !== undefined)
      company.settings.isCommentsRequired = isCommentsRequired;
    if (allowEmployeeShopCreation !== undefined)
      company.settings.allowEmployeeShopCreation = allowEmployeeShopCreation;
    if (allowGalleryUpload !== undefined)
      company.settings.allowGalleryUpload = allowGalleryUpload;
    if (isLocationMandatory !== undefined)
      company.settings.isLocationMandatory = isLocationMandatory;
    if (isOfflineModeEnabled !== undefined)
      company.settings.isOfflineModeEnabled = isOfflineModeEnabled;

    await company.save();

    await AuditLog.create({
      company: company._id,
      user: req.user._id,
      action: "company_settings_updated",
      targetModel: "Company",
      targetId: company._id,
      ipAddress: req.ip,
    });

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle company active status
// @route   PUT /api/companies/:id/toggle-status
// @access  Private — super_admin
export const toggleCompanyStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.isActive = !company.isActive;
    await company.save();

    res.json({
      message: `Company ${company.isActive ? "activated" : "deactivated"} successfully`,
      isActive: company.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};