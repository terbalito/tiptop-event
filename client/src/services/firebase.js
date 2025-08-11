import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDErwOfxukRmu_MEm-p-8F9FgvXrLbM-io",
  authDomain: "tiptop-event.firebaseapp.com",
  projectId: "tiptop-event",
  storageBucket: "tiptop-event.firebasestorage.app",
  messagingSenderId: "295068901051",
  appId: "1:295068901051:web:730cb5de516ca5d6c4939e",
  measurementId: "G-CHXB17KEZL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);