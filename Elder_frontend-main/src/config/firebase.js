import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFiq9_eEFGhLEnk8MQuz5ftYRK5pLLRZQ",
  authDomain: "elderly-connect-c6382.firebaseapp.com",
  projectId: "elderly-connect-c6382",
  storageBucket: "elderly-connect-c6382.firebasestorage.app",
  messagingSenderId: "880632972666",
  appId: "1:880632972666:web:0d3fa85739cab0c1d2c2c3",
  measurementId: "G-LYRJ58J42V"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;