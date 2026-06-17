import express from "express";
import {
  createActivityType,
  getActivityTypes,
  getActivityTypeById,
  updateActivityType,
  toggleActivityStatus,
} from "../controllers/activityController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/", getActivityTypes);
router.get("/:id", getActivityTypeById);
router.post("/", checkRole(["company_admin", "super_admin"]), createActivityType);
router.put("/:id", checkRole(["company_admin", "super_admin"]), updateActivityType);
router.put("/:id/toggle-status", checkRole(["company_admin", "super_admin"]), toggleActivityStatus);

export default router;