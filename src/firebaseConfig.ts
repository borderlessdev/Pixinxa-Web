// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage'; // Importando o Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyC2BEd3T0ITH2vfszBIR7wgH9SQ99SonPY",
  authDomain: "pixinxa-fdcb5.firebaseapp.com",
  projectId: "pixinxa-fdcb5",
  storageBucket: "pixinxa-fdcb5.appspot.com",
  messagingSenderId: "92783386803",
  appId: "1:92783386803:web:94e450d905269bfcf590c6",
  measurementId: "G-Y1CKS2QQQV",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); 

export { auth, db, storage };