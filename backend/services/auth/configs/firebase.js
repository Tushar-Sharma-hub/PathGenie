//Intialize app using service account key from firebase.
import { cert, initializeApp } from "firebase-admin";

import serviceAccount from "../serviceAccountKey.json" with {type: "json"}

export const app = initializeApp({
    credential: cert(serviceAccount)
})