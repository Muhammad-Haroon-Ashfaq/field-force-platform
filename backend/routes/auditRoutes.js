import express from "express";
import { getAuditLogs } from "../controllers/auditController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope, checkRole(["company_admin", "super_admin"]));

router.get("/", getAuditLogs);

export default router;