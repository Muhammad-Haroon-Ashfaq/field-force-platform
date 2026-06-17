    import express from "express";
import multer from "multer";
import path from "path";
import { uploadMedia, getMediaBySubmission, deleteMedia } from "../controllers/mediaController.js";
import protect from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import tenantScope from "../middleware/tenantMiddleware.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const router = express.Router();

router.use(protect, tenantScope);

router.post("/upload", upload.single("photo"), uploadMedia);
router.get("/submission/:submissionId", getMediaBySubmission);
router.delete("/:id", checkRole(["company_admin", "super_admin"]), deleteMedia);

export default router;