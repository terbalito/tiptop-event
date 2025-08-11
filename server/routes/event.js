// server/routes/event.js
import express from 'express';
import { createEvent, getEventsByAdmin } from '../controllers/eventController.js';
import authMiddleware from '../middleware/authMiddleware.js';


const router = express.Router();

// Créer un événement
router.post('/', authMiddleware, createEvent);

// Récupérer les événements de l'admin connecté
router.get('/', authMiddleware, getEventsByAdmin);

export default router;
