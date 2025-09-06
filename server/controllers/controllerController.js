import { db } from "../services/firebase.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Création contrôleur
export const createController = async (req, res) => {
  try {
    const { username, password, eventId } = req.body;

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ajout Firestore (Admin SDK → db.collection().doc().set())
    const docRef = await db.collection("controllers").add({
      username,
      password: hashedPassword,
      eventId,
      createdAt: new Date(),
    });

    res.json({ id: docRef.id, username, eventId, createdAt: new Date() });
  } catch (error) {
    console.error("Erreur création contrôleur:", error);
    res.status(500).json({ error: "Impossible de créer le contrôleur" });
  }
};

// Liste des contrôleurs
export const getControllers = async (req, res) => {
  try {
    const snap = await db.collection("controllers").get();
    const controllers = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(controllers);
  } catch (err) {
    console.error("Erreur fetch controllers:", err);
    res.status(500).json({ error: "Erreur chargement contrôleurs" });
  }
};

// Login contrôleur
export const loginController = async (req, res) => {
  try {
    const { username, password } = req.body;

    const snap = await db
      .collection("controllers")
      .where("username", "==", username)
      .get();

    if (snap.empty) return res.status(400).json({ error: "Utilisateur introuvable" });

    const ctrl = snap.docs[0].data();
    const id = snap.docs[0].id;

    const match = await bcrypt.compare(password, ctrl.password);
    if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id, username: ctrl.username, eventId: ctrl.eventId, role: "controller" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" }
    );

    res.json({ token, eventId: ctrl.eventId });
  } catch (err) {
    console.error("Erreur login contrôleur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const updateController = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, eventId } = req.body;

    const dataToUpdate = { username, eventId };
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    await db.collection("controllers").doc(id).update(dataToUpdate);

    res.json({ message: "Contrôleur mis à jour" });
  } catch (err) {
    console.error("Erreur update controller:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Delete contrôleur
export const deleteController = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("controllers").doc(id).delete();
    res.json({ message: "Contrôleur supprimé" });
  } catch (err) {
    console.error("Erreur delete controller:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};