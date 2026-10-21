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

export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Real-time Listeners for Admin Whitelist & Admins Collection
  useEffect(() => {
    let emailsFromWhitelist = [];
    let emailsFromAdminsCol = [];

    const updateCombinedAdmins = () => {
      const combined = Array.from(new Set([...emailsFromWhitelist, ...emailsFromAdminsCol]))
        .map(normalizeEmail)
        .filter(Boolean);
      setAllowedEmails(combined);
    };

    // Listen to admin_config/whitelist document
    const whitelistRef = doc(db, 'admin_config', 'whitelist');
    const unsubWhitelist = onSnapshot(whitelistRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        emailsFromWhitelist = Array.isArray(data?.allowedEmails) ? data.allowedEmails : [];
      } else {
        emailsFromWhitelist = [];
      }
      updateCombinedAdmins();
    }, (error) => {
      console.warn("Aviso: listener admin_config/whitelist:", error?.message);
      emailsFromWhitelist = [];
      updateCombinedAdmins();
    });

    // Listen to admins collection
    const adminsColRef = collection(db, 'admins');
    const unsubAdminsCol = onSnapshot(adminsColRef, (snap) => {
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        if (data?.email) list.push(data.email);
        else if (d.id && d.id.includes('@')) list.push(d.id);
      });
      emailsFromAdminsCol = list;
      updateCombinedAdmins();
    }, (error) => {
      console.warn("Aviso: listener coleccion admins:", error?.message);
      emailsFromAdminsCol = [];
      updateCombinedAdmins();
    });

    return () => {
      unsubWhitelist();
      unsubAdminsCol();
    };
  }, []);

  // 2. Compute Admin Status in Real Time with Full Normalization
  useEffect(() => {
    if (!user || !user.email) {
      setIsAdmin(false);
      return;
    }

    const currentEmail = normalizeEmail(user.email);
    const superAdmin = normalizeEmail(SUPER_ADMIN_EMAIL);

    // Immediate Super Admin access
    if (currentEmail === superAdmin) {
      setIsAdmin(true);
      return;
    }

    // Check against real-time allowed list
    const inAllowedList = allowedEmails.some(e => normalizeEmail(e) === currentEmail);

    // Check user profile role/flag if set in Firestore
    const hasRoleAdmin = userProfile?.role === 'admin' || userProfile?.isAdmin === true;

    if (inAllowedList || hasRoleAdmin) {
      setIsAdmin(true);
      return;
    }

    // Direct check for document doc(db, 'admins', currentEmail)
    let isMounted = true;
    const userAdminDocRef = doc(db, 'admins', currentEmail);
    const unsubUserAdmin = onSnapshot(userAdminDocRef, (docSnap) => {
      if (!isMounted) return;
      if (docSnap.exists()) {
        setIsAdmin(true);
      } else {
        setIsAdmin(inAllowedList || hasRoleAdmin);
      }
    }, () => {
      if (isMounted) setIsAdmin(inAllowedList || hasRoleAdmin);
    });

    return () => {
      isMounted = false;
      unsubUserAdmin();
    };
  }, [user, allowedEmails, userProfile]);

  // 3. Auth State & User Profile Listener
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
        setIsAdmin(false);
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
      setIsAdmin(false);
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
