// server/routes/invite.js
import express from "express";
import multer from "multer";
import {
  uploadInvites,
  getInvitesByEvent,
  getInvitesCount,
  generateInvitations,
  getInviteById,
  registerDevice,
  downloadInvitationPdf
} from "../controllers/inviteController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "server/uploads/" });

// Upload Excel (protégé)
router.post("/upload/:eventId", authMiddleware, upload.single("file"), uploadInvites);

// Lister invités d'un event (protégé)
router.get("/:eventId", authMiddleware, getInvitesByEvent);

// Compte d'invités (protégé)
router.get("/:eventId/count", authMiddleware, getInvitesCount);

// Générer cartes (protégé)
router.post("/:eventId/generate-cards", authMiddleware, generateInvitations);

// PUBLIC : obtenir un invité par inviteId (pas besoin d'auth pour page publique)
router.get("/:eventId/invites/:inviteId", getInviteById);

// PUBLIC : enregistrer deviceId (l'invité)
router.post("/:eventId/invites/:inviteId/register", registerDevice);

router.get("/:eventId/:inviteId/pdf", downloadInvitationPdf);

export default router;
