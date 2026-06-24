import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyARAIZJrvC34oEw-wOfzLWCF_ysWt_eUUA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dgmitra.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dgmitra",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dgmitra.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "305656395851",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:305656395851:web:80d84ffae3c375ca2af5ce",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VR5ZSFDLMK"
};

export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);

export const loginWithEmailFirebase = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const signUpWithEmailFirebase = async (email: string, pass: string) => {
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const loginWithGoogleFirebase = async () => {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
};

export const logoutFirebase = async () => {
  return await signOut(auth);
};

export { onAuthStateChanged };
