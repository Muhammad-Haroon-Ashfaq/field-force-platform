import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import bcrypt from "bcryptjs";

// @desc    Get all users (scoped to company)
// @route   GET /api/users
// @access  Private — company_admin, manager
export const getUsers = async (req, res) => {
  try {
    const filter = { company: req.companyId };

    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
    if (req.query.territory) filter.territory = req.query.territory;

    // Search by name, email, employeeCode, phone
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { employeeCode: regex },
        { phone: regex },
      ];
    }

    // Manager sirf apne assigned employees dekh sakta hai
    if (req.user.role === "manager") {
      filter.manager = req.user._id;
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("territory", "name type")
      .populate("manager", "name email")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private — company_admin, manager
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.companyId,
    })
      .select("-password")
      .populate("territory", "name type")
      .populate("manager", "name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new employee
// @route   POST /api/users
// @access  Private — company_admin
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, employeeCode, territory, manager } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      company: req.companyId,
      role: role || "employee",
      phone: phone || null,
      employeeCode: employeeCode || null,
      territory: territory || null,
      manager: manager || null,
    });

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "user_created",
      targetModel: "User",
      targetId: user._id,
      details: { name: user.name, email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    const userResponse = await User.findById(user._id)
      .select("-password")
      .populate("territory", "name type")
      .populate("manager", "name email");

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private — company_admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, phone, role, employeeCode, territory, manager } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (employeeCode !== undefined) user.employeeCode = employeeCode;
    if (territory !== undefined) user.territory = territory;
    if (manager !== undefined) user.manager = manager;

    const updated = await user.save();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "user_updated",
      targetModel: "User",
      targetId: updated._id,
      ipAddress: req.ip,
    });

    const userResponse = await User.findById(updated._id)
      .select("-password")
      .populate("territory", "name type")
      .populate("manager", "name email");

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enable or disable user
// @route   PUT /api/users/:id/toggle-status
// @access  Private — company_admin
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: user.isActive ? "user_enabled" : "user_disabled",
      targetModel: "User",
      targetId: user._id,
      details: { isActive: user.isActive },
      ipAddress: req.ip,
    });

    res.json({
      message: `User ${user.isActive ? "enabled" : "disabled"} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset user password (admin)
// @route   PUT /api/users/:id/reset-password
// @access  Private — company_admin
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private — company_admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "user_deleted",
      targetModel: "User",
      targetId: req.params.id,
      ipAddress: req.ip,
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};