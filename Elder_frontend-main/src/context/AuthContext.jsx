import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import api from "../api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Manual login (from signup/login)
  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };


  useEffect(() => {

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      try {

        if (!firebaseUser) {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const token = await firebaseUser.getIdToken();

        const res = await api.get(
          "/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("AUTH USER:", res.data);


        if (isMounted && res.data) {
          setUser(res.data);
        }

      } catch (err) {

        console.log("AUTH ERROR:", err.response?.status === 404 ? "User missing from DB" : err.message);
        if (err.response?.status === 404) {
          await auth.signOut();
          setUser(null);
        }

      } finally {

        if (isMounted) {
          setLoading(false);
        }

      }

    });

    return () => {
      isMounted = false;
      unsubscribe();
    };

  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
