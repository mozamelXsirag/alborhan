
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// إعدادات Firebase الخاصة بمشروع "مقياس البرهان"
const firebaseConfig = {
  apiKey: "AIzaSyCsCwpVQpjhKq4pleDt1AhLPXFxGuz7Jng",
  authDomain: "borhan-scale.firebaseapp.com",
  projectId: "borhan-scale",
  storageBucket: "borhan-scale.firebasestorage.app",
  messagingSenderId: "1082384379934",
  appId: "1:1082384379934:web:0c60dab26e24f095be3e0f",
  measurementId: "G-NZ7NNVGW8H"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// تصدير كائن قاعدة البيانات لاستخدامه في باقي التطبيق
export const db = getFirestore(app);
