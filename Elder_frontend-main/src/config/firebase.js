import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXrFeIOFbRUqozh1ytKj9_xJO8157X5hU",
  authDomain: "elderconnect-ed538.firebaseapp.com",
  projectId: "elderconnect-ed538",
  storageBucket: "elderconnect-ed538.firebasestorage.app",
  messagingSenderId: "509253369220",
  appId: "1:509253369220:web:2bcd5533f91e22c59771d1",
  measurementId: "G-95DMNYPNR3"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;