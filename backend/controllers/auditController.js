import AuditLog from "../models/AuditLog.js";

// @desc    Get audit logs (scoped to company)
// @route   GET /api/audit-logs
// @access  Private — company_admin
export const getAuditLogs = async (req, res) => {
  try {
    const filter = { company: req.companyId };

    if (req.query.user) filter.user = req.query.user;
    if (req.query.action) filter.action = req.query.action;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const to = new Date(req.query.dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const total = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};