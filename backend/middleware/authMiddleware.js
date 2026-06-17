import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id)
        .select("-password")
        .populate("company", "name code isActive settings");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is disabled. Contact your admin." });
      }

      if (user.company && !user.company.isActive) {
        return res.status(401).json({ message: "Company account is inactive." });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export default protect;