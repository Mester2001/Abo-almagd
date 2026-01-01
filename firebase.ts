
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * 🛠️ إعدادات قاعدة بيانات مركز أبو المجد الهندسي
 * -----------------------------------------
 * إذا تركت apiKey فارغاً، سيعمل الموقع تلقائياً بنظام التخزين المحلي (LocalStorage).
 * هذا مفيد جداً للمعاينة السريعة والرفع التجريبي.
 */

const firebaseConfig = {
  apiKey: "", // ضع مفتاح الـ API هنا لتفعيل الحفظ السحابي
  authDomain: "abu-almagd-center.firebaseapp.com",
  projectId: "abu-almagd-center",
  storageBucket: "abu-almagd-center.appspot.com",
  messagingSenderId: "777777777777",
  appId: "1:777777777777:web:abcdef123456"
};

export const isConfigPlaceholder = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === "" ||
  firebaseConfig.apiKey.includes("REPLACE");

let db: any = null;

try {
  if (!isConfigPlaceholder) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("%c✔️ Connected to Cloud Database (Firebase)", "color: #ff9900; font-weight: bold;");
  } else {
    console.log("%cℹ️ Running in Local Mode: Data will be saved in your browser only.", "color: #00aaff; font-weight: bold;");
  }
} catch (e) {
  console.warn("⚠️ Firebase connection failed, using LocalStorage.");
}

export { db };
