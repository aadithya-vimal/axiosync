import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD6yZrB3itYSKcm0RMBqA1igKWUBTb3rRs",
    authDomain: "axiosync-6cc31.firebaseapp.com",
    projectId: "axiosync-6cc31",
    storageBucket: "axiosync-6cc31.firebasestorage.app",
    messagingSenderId: "1046006295128",
    appId: "1:1046006295128:web:79c3d973154483f7a4f82d",
    measurementId: "G-W9C1ZQ4K81",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
