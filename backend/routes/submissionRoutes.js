import express from "express";
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getMySubmissions,
} from "../controllers/submissionController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/my", getMySubmissions);
router.get("/", checkRole(["company_admin", "manager", "super_admin"]), getSubmissions);
router.get("/:id", checkRole(["company_admin", "manager", "super_admin"]), getSubmissionById);
router.post("/", createSubmission);

export default router;