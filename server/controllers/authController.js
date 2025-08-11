import admin from "../services/firebase.js";

// Export nommé ES modules
export const login = async (req, res) => {
  const idToken = req.body.idToken;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 jours

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };
    res.cookie("session", sessionCookie, options);
    res.status(200).json({ message: "Session created" });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Export nommé ES modules
export const logout = async (req, res) => {
  res.clearCookie("session");
  res.status(200).json({ message: "Logged out" });
};