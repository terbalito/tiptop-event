import express from "express";
import multer from "multer";
import { uploadInvites } from "../controllers/inviteController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// config multer
const upload = multer({ dest: "server/uploads/" });

router.post(
  "/upload/:eventId",
  authMiddleware,  // protégé par auth
  upload.single("file"),
  uploadInvites
);

export default router;
