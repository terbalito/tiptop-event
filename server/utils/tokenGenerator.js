// server/utils/tokenGenerator.js
import crypto from "crypto";

export const generateTokenForAdmin = (inviteId) => {
  const randomString = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
  return crypto.createHash("sha256").update(randomString).digest("hex");
};