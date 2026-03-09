import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "[REDACTED]",
    authDomain: "axiosync-6cc31.firebaseapp.com",
    projectId: "axiosync-6cc31",
    storageBucket: "axiosync-6cc31.firebasestorage.app",
    messagingSenderId: "[REDACTED]",
    appId: "[REDACTED]",
    measurementId: "[REDACTED]",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
