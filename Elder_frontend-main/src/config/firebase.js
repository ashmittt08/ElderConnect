import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPYD1WO_6KFFQnLodVCUfOjkb993dKi8I",
  authDomain: "elder-test-6c26e.firebaseapp.com",
  projectId: "elder-test-6c26e",
  storageBucket: "elder-test-6c26e.firebasestorage.app",
  messagingSenderId: "893498536417",
  appId: "1:893498536417:web:1b1581871cfa30d9eee2a0",
  measurementId: "G-KXP0QFJDVR"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;