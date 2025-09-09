// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/event.js';
import inviteRoutes from './routes/invites.js';
import controllerRoutes from "./routes/controller.js";
import { initSocket } from "./socket/index.js";
import http from "http";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = initSocket(server);

app.use(cors({
  origin: [
    "http://localhost:5173",           // dev local
    "https://terbalito.github.io/tiptop-event"  // prod frontend
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Middleware pour injecter io dans req
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/invites', inviteRoutes);

// 👇 CORRECTION ICI - Chemin absolu pour les fichiers générés
const generatedDir = path.join(process.cwd(), 'server', 'generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

// Servir les images générées
app.use('/generated', express.static(generatedDir));

// Route pour télécharger les images
app.get('/download/:eventId/:filename', (req, res) => {
  const { eventId, filename } = req.params;
  const filePath = path.join(generatedDir, eventId, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, `${filename}`, (err) => {
      if (err) {
        console.error('Erreur téléchargement:', err);
        res.status(500).send('Erreur lors du téléchargement');
      }
    });
  } else {
    res.status(404).send('Fichier non trouvé');
  }
});

app.get('/', (req, res) => {
  res.send('🚀 TipTop Event Backend is alive!');
});

// Créer le dossier uploads si pas là
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


app.use("/api/controllers", controllerRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});