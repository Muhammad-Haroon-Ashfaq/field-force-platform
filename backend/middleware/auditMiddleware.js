import AuditLog from "../models/AuditLog.js";

// Usage: auditAction("submission_created")
const auditAction = (action) => {
  return async (req, res, next) => {
    // Original json function store karein
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Sirf successful responses log karein (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await AuditLog.create({
            company: req.user?.company?._id || req.user?.company || null,
            user: req.user?._id || null,
            action,
            targetModel: data?._id ? action.split("_")[0] : null,
            targetId: data?._id || null,
            details: {},
            ipAddress: req.ip,
          });
        } catch (err) {
          // Audit log fail hone se actual response block nahi hona chahiye
          console.error("Audit log error:", err.message);
        }
      }
      return originalJson(data);
    };

    next();
  };
};

export default auditAction;