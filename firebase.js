// Firebase v10 Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// 🔑 Replace with your Firebase config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC90fwHFWbIWo8y_FUvxH6hJc-oAbckOZo",
  authDomain: "stokebilling-5fa7c.firebaseapp.com",
  projectId: "stokebilling-5fa7c",
  storageBucket: "stokebilling-5fa7c.firebasestorage.app",
  messagingSenderId: "1065289105101",
  appId: "1:1065289105101:web:72b29121ac42b0c49a3384",
  measurementId: "G-BBHDT0924M"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- User Auth ---
export async function registerUser(email, password, name, role){
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    await addDoc(collection(db, "users"), { uid: userId, name, email, role });
    return userCredential.user;
}

export async function loginUser(email, password){
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function logoutUser(){
    await signOut(auth);
}
