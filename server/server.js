import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/auth.js'; // 👈 AJOUT
import eventRoutes from './routes/event.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Route d'auth
app.use('/api/auth', authRoutes); // 👈 AJOUT

// Test route
app.get('/', (req, res) => {
  res.send('🚀 TipTop Event Backend is alive!');
});

app.use('/api/events', eventRoutes);

// Créer le dossier uploads si pas encore là
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
