// Usage: checkRole(["company_admin", "manager"])
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        });
    }

    next();
  };
};

export default checkRole;