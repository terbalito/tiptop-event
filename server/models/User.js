// Dans models/User.js (backend)
export const getUserRole = async (uid) => {
  const userDoc = await db.collection('users').doc(uid).get();
  return userDoc.exists ? userDoc.data().role : null; // 'admin' ou 'controller'
};