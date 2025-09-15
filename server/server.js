// server/server.js
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("./server/.env") });


console.log("FIREBASE_SERVICE_ACCOUNT existe =", !!process.env.FIREBASE_SERVICE_ACCOUNT);

import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/event.js";
import inviteRoutes from "./routes/invites.js";
import controllerRoutes from "./routes/controller.js";
import { initSocket } from "./socket/index.js";
import http from "http";

// === DEBUG ENV ===
console.log("🔍 Chargement .env terminé");
console.log("PORT =", process.env.PORT);
console.log(
  "FIREBASE_SERVICE_ACCOUNT existe =",
  !!process.env.FIREBASE_SERVICE_ACCOUNT
);

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = initSocket(server);

// Liste des domaines autorisés
const allowedOrigins = [
  "http://localhost:5173", // pour ton dev local
  "https://tiptop-event-1.onrender.com" // ton frontend Render
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Middleware pour injecter io dans req
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/controllers", controllerRoutes);

// 👇 CORRECTION ICI - Chemin absolu pour les fichiers générés
const generatedDir = path.join(process.cwd(), "server", "generated");
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

// Servir les images générées
app.use("/generated", express.static(generatedDir));

// Route pour télécharger les images
app.get("/download/:eventId/:filename", (req, res) => {
  const { eventId, filename } = req.params;
  const filePath = path.join(generatedDir, eventId, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, `${filename}`, (err) => {
      if (err) {
        console.error("Erreur téléchargement:", err);
        res.status(500).send("Erreur lors du téléchargement");
      }
    });
  } else {
    res.status(404).send("Fichier non trouvé");
  }
});

app.get("/", (req, res) => {
  res.send("🚀 TipTop Event Backend is alive!");
});

// Créer le dossier uploads si pas là
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// === FRONTEND en production ===
const clientBuildPath = path.join(process.cwd(), "client", "dist");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  // Catch-all -> React Router
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Exemple routes auth
app.post("/auth/login", (req, res) => {
  res.json({ message: "Login OK" });
});

app.post("/auth/logout", (req, res) => {
  res.json({ message: "Logout OK" });
})


// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
