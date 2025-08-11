import admin from '../services/firebase.js';

export const createEvent = async (req, res) => {
  const { name, date, location } = req.body;
  const adminId = req.user.uid;

  if (!name || !date || !location) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  try {
    const db = admin.firestore();
    const newEventRef = db.collection("events").doc();
    await newEventRef.set({
      name,
      date,
      location,
      adminId,
      createdAt: Date.now(),
    });

    res.status(201).json({ id: newEventRef.id, name, date, location });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création" });
  }
};

export const getEventsByAdmin = async (req, res) => {
  const adminId = req.user.uid;

  try {
    const db = admin.firestore();
    const snapshot = await db.collection("events").where("adminId", "==", adminId).get();

    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Erreur de récupération des événements" });
  }
};
