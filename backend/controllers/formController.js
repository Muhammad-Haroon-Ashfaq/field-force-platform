import FormTemplate from "../models/FormTemplate.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Create form template
// @route   POST /api/forms
// @access  Private — company_admin
export const createForm = async (req, res) => {
  try {
    const { name, fields } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Form name is required" });
    }

    const form = await FormTemplate.create({
      company: req.companyId,
      name,
      fields: fields || [],
    });

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "form_created",
      targetModel: "FormTemplate",
      targetId: form._id,
      details: { name: form.name },
      ipAddress: req.ip,
    });

    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all forms (scoped to company)
// @route   GET /api/forms
// @access  Private
export const getForms = async (req, res) => {
  try {
    const filter = { company: req.companyId };

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const forms = await FormTemplate.find(filter).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single form
// @route   GET /api/forms/:id
// @access  Private
export const getFormById = async (req, res) => {
  try {
    const form = await FormTemplate.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update form template
// @route   PUT /api/forms/:id
// @access  Private — company_admin
export const updateForm = async (req, res) => {
  try {
    const form = await FormTemplate.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (req.body.name) form.name = req.body.name;
    if (req.body.fields) form.fields = req.body.fields;
    if (req.body.isActive !== undefined) form.isActive = req.body.isActive;

    const updated = await form.save();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "form_updated",
      targetModel: "FormTemplate",
      targetId: updated._id,
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private — company_admin
export const deleteForm = async (req, res) => {
  try {
    const form = await FormTemplate.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    await form.deleteOne();
    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};