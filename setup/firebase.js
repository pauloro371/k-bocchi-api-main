// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbFXk2UKbPqS_fzsfkCjySpDuwYONEKAA",
  authDomain: "kbocchi-1254b.firebaseapp.com",
  projectId: "kbocchi-1254b",
  storageBucket: "kbocchi-1254b.appspot.com",
  messagingSenderId: "280897534781",
  appId: "1:280897534781:web:880b1ec78fc9ea2b3e6354",
  measurementId: "G-FPWW2DZD5S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;
