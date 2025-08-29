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

// Middlewares
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,               
}));
app.use(express.json());
app.use(cookieParser());          
app.use(morgan('dev'));


// Route d'auth
app.use('/api/auth', authRoutes); 

// Test route
app.get('/', (req, res) => {
  res.send('🚀 TipTop Event Backend is alive!');
});

app.use('/api/events', eventRoutes);

app.use('/api/invites', inviteRoutes); 

// Créer le dossier uploads si pas encore là
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
