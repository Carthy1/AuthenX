// 1. Import the specific social login tools from Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnvQqv6EkNdX7Zx1lAvdMQW2M0BjyVVho",
  authDomain: "authenx-6b7d5.firebaseapp.com",
  projectId: "authenx-6b7d5",
  storageBucket: "authenx-6b7d5.firebasestorage.app",
  messagingSenderId: "1042037148757",
  appId: "1:1042037148757:web:98b1dd76ff709d281718dc"
};

// 2. Initialize the core app
const app = initializeApp(firebaseConfig);

// 3. Export the tools so we can use them in Modal.js
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ 4. THIS IS THE MISSING PIECE: Export the Social Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const appleProvider = new OAuthProvider('apple.com');