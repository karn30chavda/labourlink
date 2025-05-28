
// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
// It's best practice to load this from environment variables

const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomainFromEnv = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucketFromEnv = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

console.log("--- Firebase Configuration Loading ---");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", apiKeyFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", authDomainFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", projectIdFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", storageBucketFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", messagingSenderIdFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_APP_ID:", appIdFromEnv);

const firebaseConfig = {
  apiKey: apiKeyFromEnv,
  authDomain: authDomainFromEnv,
  projectId: projectIdFromEnv,
  storageBucket: storageBucketFromEnv,
  messagingSenderId: messagingSenderIdFromEnv,
  appId: appIdFromEnv,
};

console.log("Attempting to initialize Firebase app with config:", firebaseConfig);


let app: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("CRITICAL: Firebase apiKey or projectId is missing. Firebase will NOT be initialized.");
  // Fallback to mock objects if critical config is missing
  // This part is important to avoid crashing the app if env vars are not set,
  // but for a real deployment, you'd want the app to fail or show an error.
  // For now, during transition, we can log an error.
  // You might want to throw an error in a production setup if config is missing.
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully.");
    } catch (e) {
      console.error("Firebase initialization error:", e);
      // Handle initialization error, perhaps by setting app to a mock or re-throwing
    }
  } else {
    app = getApp();
    console.log("Firebase app already initialized.");
  }

  // @ts-ignore: app might be uninitialized if config is missing
  authInstance = getAuth(app);
  // @ts-ignore: app might be uninitialized if config is missing
  dbInstance = getFirestore(app);
  // @ts-ignore: app might be uninitialized if config is missing
  storageInstance = getStorage(app);
}

// Export the initialized services
// If initialization failed, these might be undefined, and a proper error handling
// strategy would be needed in the parts of the app that use them.
export { app, authInstance as auth, dbInstance as db, storageInstance as storage };
