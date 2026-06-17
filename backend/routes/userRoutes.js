import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
} from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/", checkRole(["company_admin", "manager", "super_admin"]), getUsers);
router.get("/:id", checkRole(["company_admin", "manager", "super_admin"]), getUserById);
router.post("/", checkRole(["company_admin", "super_admin"]), createUser);
router.put("/:id", checkRole(["company_admin", "super_admin"]), updateUser);
router.put("/:id/toggle-status", checkRole(["company_admin", "super_admin"]), toggleUserStatus);
router.put("/:id/reset-password", checkRole(["company_admin", "super_admin"]), resetUserPassword);
router.delete("/:id", checkRole(["company_admin", "super_admin"]), deleteUser);

export default router;