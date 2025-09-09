import { admin } from "../services/firebase.js";

// Login Firebase (création de session)
export const login = async (req, res) => {
  const idToken = req.body.idToken;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 jours en ms

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    res.cookie("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true en prod
      sameSite: "strict",
    });
    res.status(200).json({ message: "Session créée" });
  } catch (error) {
    console.error("Login Firebase error:", error);
    res.status(401).json({ error: "Token invalide" });
  }
};

// Logout
export const logout = async (req, res) => {
  res.clearCookie("session");
  res.status(200).json({ message: "Déconnecté" });
};
