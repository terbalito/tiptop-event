import express from "express";
import multer from "multer";
import { uploadInvites, getInvitesByEvent, getInvitesCount } from "../controllers/inviteController.js";
import  authMiddleware  from "../middleware/authMiddleware.js";

const router = express.Router();

// config multer
const upload = multer({ dest: "server/uploads/" });

// Upload Excel
router.post(
  "/upload/:eventId",
  authMiddleware,
  upload.single("file"),
  uploadInvites
);

// Lister invités d'un event
router.get("/:eventId", authMiddleware, getInvitesByEvent);

// Obtenir le compteur d'invités d'un event
router.get("/:eventId/count", authMiddleware, getInvitesCount);

export default router;