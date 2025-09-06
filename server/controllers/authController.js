import { admin } from "../services/firebase.js";

export const login = async (req, res) => {
  const idToken = req.body.idToken;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 jours

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    res.cookie("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    });
    res.status(200).json({ message: "Session created" });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("session");
  res.status(200).json({ message: "Logged out" });
};
