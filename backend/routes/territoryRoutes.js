import express from "express";
import {
  createTerritory,
  getTerritories,
  getTerritoryTree,
  getTerritoryById,
  updateTerritory,
  deleteTerritory,
} from "../controllers/territoryController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/tree", getTerritoryTree);
router.get("/", getTerritories);
router.get("/:id", getTerritoryById);
router.post("/", checkRole(["company_admin", "super_admin"]), createTerritory);
router.put("/:id", checkRole(["company_admin", "super_admin"]), updateTerritory);
router.delete("/:id", checkRole(["company_admin", "super_admin"]), deleteTerritory);

export default router;