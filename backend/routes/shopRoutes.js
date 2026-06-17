import express from "express";
import {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
} from "../controllers/shopController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/", getShops);
router.get("/:id", getShopById);
router.post("/", createShop);
router.put("/:id", checkRole(["company_admin", "super_admin"]), updateShop);
router.delete("/:id", checkRole(["company_admin", "super_admin"]), deleteShop);

export default router;