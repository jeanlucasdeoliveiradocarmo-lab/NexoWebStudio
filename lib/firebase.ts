import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Copie estas chaves do seu projeto do CRM ou do Console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBNulNbR-aJ-IP5FI2U6PW92Mi6D0SsvsY",
  authDomain: "nx-crm-e82e6.firebaseapp.com",
  projectId: "nx-crm-e82e6",
  storageBucket: "nx-crm-e82e6.firebasestorage.app",
  messagingSenderId: "1067704636516",
  appId: "1:1067704636516:web:1e11e3175ecc60a753fb71"
};

// Evita inicializar o Firebase duas vezes no Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
