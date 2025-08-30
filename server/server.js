// server/server.js (ajoute juste la partie static si pas encore fait)
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

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/invites', inviteRoutes);

// 👇 servir les images générées
app.use(
  '/generated',
  express.static(path.join(process.cwd(), 'server', 'generated'))
);

app.get('/', (req, res) => {
  res.send('🚀 TipTop Event Backend is alive!');
});

// Créer le dossier uploads si pas là
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
