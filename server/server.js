// server/server.js
import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import cookieParser from "cookie-parser";
import http from "http";

// Middlewares personnalisés
import { requestLogger, downloadLogger } from "./middleware/loggerMiddleware.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// Routes
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/event.js";
import inviteRoutes from "./routes/invites.js";
import controllerRoutes from "./routes/controller.js";

// Socket
import { initSocket } from "./socket/index.js";

dotenv.config({ path: path.resolve("./server/.env") });

console.log("🔍 Configuration chargée:");
console.log("PORT =", process.env.PORT);
console.log("FIREBASE_SERVICE_ACCOUNT =", !!process.env.FIREBASE_SERVICE_ACCOUNT);
console.log("FRONTEND_URL =", process.env.FRONTEND_URL);

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = initSocket(server);

// Domaines autorisés
const allowedOrigins = [
  "http://localhost:5173",
  "https://tiptop-event-1.onrender.com"
];

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('🚫 CORS bloqué pour:', origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined"));
app.use(requestLogger);
app.use(downloadLogger);

// Injecter io dans les requêtes
app.use((req, res, next) => {
  req.io = io;
  next();
});



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/controllers", controllerRoutes);

// Dossier des fichiers générés
const generatedDir = path.join(process.cwd(), "server", "generated");
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
  console.log('📁 Dossier generated créé:', generatedDir);
}

// Servir les fichiers statiques
app.use("/generated", express.static(generatedDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.png')) {
      // Forcer le téléchargement au lieu de l'affichage
      const filename = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

// Route de téléchargement avec logging
// Ajoutez cette route après la route /download
app.get("/api/download-pdf/:eventId/:filename", (req, res, next) => {
  const { eventId, filename } = req.params;
  const filePath = path.join(generatedDir, eventId, filename);

  console.log('📄 Tentative téléchargement PDF:', { eventId, filename, filePath });

  if (!fs.existsSync(filePath)) {
    console.error('❌ Fichier PDF non trouvé:', filePath);
    return res.status(404).json({ error: "Fichier PDF non trouvé" });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Erreur téléchargement PDF:', err);
      next(err);
    } else {
      console.log('✅ PDF téléchargé avec succès:', filename);
    }
  });
});

// Route de santé
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 TipTop Event Backend",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Middleware 404
app.use(notFound);

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Créer les dossiers nécessaires
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Generated files: ${generatedDir}`);
  console.log(`🌍 Allowed origins: ${allowedOrigins.join(', ')}`);
});

// Gestion propre des arrêts
process.on('SIGINT', () => {
  console.log('🛑 Server shutting down');
  process.exit(0);
});