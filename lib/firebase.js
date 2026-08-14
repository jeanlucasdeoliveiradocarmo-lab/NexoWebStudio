import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Cole AQUI dentro das aspas os dados que você pegou lá no Firebase (Etapa 1)
const firebaseConfig = {
  apiKey: "AIzaSyBNulNbR-aJ-IP5FI2U6PW92Mi6D0SsvsY",
  authDomain: "nx-crm-e82e6.firebaseapp.com",
  projectId: "nx-crm-e82e6",
  storageBucket: "nx-crm-e82e6.firebasestorage.app",
  messagingSenderId: "1067704636516",
  appId: "1:1067704636516:web:1e11e3175ecc60a753fb71",
  measurementId: "G-DYCE49D2W8"
};

// Conecta ao Firebase sem duplicar a conexão
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Exporta o banco de dados para ser usado no formulário
export const db = getFirestore(app);
