import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyANetPg-QjaxA6fwYG44fqKlL482O93tiU",
  authDomain: "budget-tracker12.firebaseapp.com",
  databaseURL: "https://budget-tracker12-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "budget-tracker12",
  storageBucket: "budget-tracker12.firebasestorage.app",
  messagingSenderId: "1019568144059",
  appId: "1:1019568144059:web:e18f0c3cf363b8cd2ef39e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };