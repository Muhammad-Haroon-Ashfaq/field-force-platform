// Legacy support — sirf company_admin aur super_admin ke liye
const admin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "company_admin" || req.user.role === "super_admin")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
};

export default admin;