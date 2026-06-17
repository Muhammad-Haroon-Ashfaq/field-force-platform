import express from "express";
import {
  createForm,
  getForms,
  getFormById,
  updateForm,
  deleteForm,
} from "../controllers/formController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/", getForms);
router.get("/:id", getFormById);
router.post("/", checkRole(["company_admin", "super_admin"]), createForm);
router.put("/:id", checkRole(["company_admin", "super_admin"]), updateForm);
router.delete("/:id", checkRole(["company_admin", "super_admin"]), deleteForm);

export default router;