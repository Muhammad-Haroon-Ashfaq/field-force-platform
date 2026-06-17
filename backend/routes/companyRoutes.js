import express from "express";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompanySettings,
  toggleCompanyStatus,
} from "../controllers/companyController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", checkRole(["super_admin"]), getCompanies);
router.post("/", checkRole(["super_admin"]), createCompany);
router.get("/:id", checkRole(["super_admin", "company_admin"]), getCompanyById);
router.put("/:id/settings", tenantScope, checkRole(["company_admin", "super_admin"]), updateCompanySettings);
router.put("/:id/toggle-status", checkRole(["super_admin"]), toggleCompanyStatus);

export default router;