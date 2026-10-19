import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc,
  deleteDoc,
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXJdTMsDgK_BtrmUDWdkYbwwxmYltoavA",
  authDomain: "stream-itgb-trivia.firebaseapp.com",
  projectId: "stream-itgb-trivia",
  storageBucket: "stream-itgb-trivia.firebasestorage.app",
  messagingSenderId: "787505392921",
  appId: "1:787505392921:web:dd76d0da9e81e10e7ae988",
  measurementId: "G-8MFT5YTPXM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally (only in browser environment)
let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Firebase Analytics not initialized:", e);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { 
  signInWithPopup, 
  signOut, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc,
  deleteDoc,
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
};

export default app;
