import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  onSnapshot 
} from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const SUPER_ADMIN_EMAIL = "liolobo2904@gmail.com";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to admin whitelist in Firestore (both admin_config/whitelist AND admins collection)
  useEffect(() => {
    let emailsFromWhitelist = [];
    let emailsFromAdminsCol = [];

    const updateCombinedAdmins = () => {
      const combined = Array.from(new Set([...emailsFromWhitelist, ...emailsFromAdminsCol]))
        .map(e => e.toLowerCase().trim())
        .filter(Boolean);
      setAllowedEmails(combined);
    };

    // 1. Listen to admin_config/whitelist document
    const whitelistRef = doc(db, 'admin_config', 'whitelist');
    const unsubWhitelist = onSnapshot(whitelistRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        emailsFromWhitelist = Array.isArray(data.allowedEmails) ? data.allowedEmails : [];
      } else {
        emailsFromWhitelist = [];
      }
      updateCombinedAdmins();
    }, (error) => {
      console.warn("Nota: admin_config/whitelist no disponible:", error?.message);
      emailsFromWhitelist = [];
      updateCombinedAdmins();
    });

    // 2. Listen to admins collection
    const adminsColRef = collection(db, 'admins');
    const unsubAdminsCol = onSnapshot(adminsColRef, (snap) => {
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.email) list.push(data.email);
        else if (d.id.includes('@')) list.push(d.id);
      });
      emailsFromAdminsCol = list;
      updateCombinedAdmins();
    }, (error) => {
      // In case collection doesn't exist yet, ignore gracefully
      emailsFromAdminsCol = [];
      updateCombinedAdmins();
    });

    return () => {
      unsubWhitelist();
      unsubAdminsCol();
    };
  }, []);

  // Compute strictly whether current user is an authorized admin
  useEffect(() => {
    if (user && user.email) {
      const emailLower = user.email.toLowerCase().trim();
      const isSuperAdmin = emailLower === SUPER_ADMIN_EMAIL.toLowerCase().trim();
      const inWhitelist = allowedEmails.some(e => e && e.toLowerCase().trim() === emailLower);
      setIsAdmin(isSuperAdmin || inWhitelist);
    } else {
      setIsAdmin(false);
    }
  }, [user, allowedEmails]);

  // Auth State Listener
  useEffect(() => {
    let unsubUserDoc = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);

        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const initialData = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Estudiante ITGB',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              score: 0,
              totalTimeSeconds: 0,
              currentQuestionIndex: 0,
              status: 'registered',
              completedAt: null,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, initialData);
            setUserProfile(initialData);
          } else {
            setUserProfile(snap.data());
          }

          unsubUserDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data());
            }
          });
        } catch (err) {
          console.error("Error al inicializar perfil en Firestore:", err);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        if (unsubUserDoc) unsubUserDoc();
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    } catch (error) {
      console.error("Error en signInWithPopup:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      throw error;
    }
  };

  const updateProfileData = async (data) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAdmin,
      allowedEmails,
      loading,
      loginWithGoogle,
      logout,
      updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
