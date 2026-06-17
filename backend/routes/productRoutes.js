import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", checkRole(["company_admin", "super_admin"]), createProduct);
router.put("/:id", checkRole(["company_admin", "super_admin"]), updateProduct);
router.delete("/:id", checkRole(["company_admin", "super_admin"]), deleteProduct);

export default router;