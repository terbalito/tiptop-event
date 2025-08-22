// server/middleware/authMiddleware.js
import admin from '../services/firebase.js';

const authMiddleware = async (req, res, next) => {
  const sessionCookie = req.cookies?.session || '';   
  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

export default authMiddleware;
