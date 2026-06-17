import express from "express";
import {
  getOverview,
  getByEmployee,
  getByActivity,
  getByDate,
  getShopVisits,
  exportCSV,
} from "../controllers/reportController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope, checkRole(["company_admin", "manager", "super_admin"]));

router.get("/overview", getOverview);
router.get("/by-employee", getByEmployee);
router.get("/by-activity", getByActivity);
router.get("/by-date", getByDate);
router.get("/shop-visits", getShopVisits);
router.get("/export-csv", exportCSV);

export default router;