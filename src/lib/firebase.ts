import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiTqLeDYwp99OexM8o7DW__7Kqtzeb-vA",
  authDomain: "koys-92fd5.firebaseapp.com",
  projectId: "koys-92fd5",
  storageBucket: "koys-92fd5.firebasestorage.app",
  messagingSenderId: "60255465436",
  appId: "1:60255465436:web:7805540a6f475a69d2a919",
  measurementId: "G-2E8Q83WTQB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);