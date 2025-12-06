// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyARTHORkUIFizEKUoSBBEipXJRAp5OLeaY",
  authDomain: "pomodoro-9fc6b.firebaseapp.com",
  projectId: "pomodoro-9fc6b",
  storageBucket: "pomodoro-9fc6b.firebasestorage.app",
  messagingSenderId: "343979182086",
  appId: "1:343979182086:web:6c653a7e0823a791375b87",
  measurementId: "G-PXB4JRVPNJ"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);