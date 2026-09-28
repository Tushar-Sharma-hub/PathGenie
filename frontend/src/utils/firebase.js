
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "pathgenie-t.firebaseapp.com",
  projectId: "pathgenie-t",
  storageBucket: "pathgenie-t.firebasestorage.app",
  messagingSenderId: "585945260178",
  appId: "1:585945260178:web:ec1a36152bdb30c4f3064b"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}