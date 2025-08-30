import QRCode from "qrcode";
import crypto from "crypto";

export const generateInviteLink = (eventId, inviteId, token) => {
  return `https://ton-domaine.com/ticket/${eventId}/${inviteId}/${token}`;
};

export const generateInviteQR = async (eventId, inviteId) => {
  const token = crypto.randomBytes(12).toString("hex");

  const link = generateInviteLink(eventId, inviteId, token);

  const qrDataUrl = await QRCode.toDataURL(link);

  return { qrDataUrl, token, link };
};
