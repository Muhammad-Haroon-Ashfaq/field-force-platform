// Yeh middleware ensure karta hai ke request mein company context available ho
// Aur user sirf apni company ka data access kar sake
const tenantScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // super_admin ke paas company restriction nahi hoti
  if (req.user.role === "super_admin") {
    req.companyId = req.query.companyId || null;
    return next();
  }

  if (!req.user.company) {
    return res.status(403).json({ message: "No company assigned to this user" });
  }

  req.companyId = req.user.company._id;
  next();
};

export default tenantScope;