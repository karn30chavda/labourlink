
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Real Firebase Auth
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// --- START DIAGNOSTIC LOGS ---
console.log("--- Firebase Configuration Loading ---");
console.log("Attempting to read environment variables for Firebase config...");
const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomainFromEnv = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucketFromEnv = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", apiKeyFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", authDomainFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", projectIdFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", storageBucketFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", messagingSenderIdFromEnv);
console.log("NEXT_PUBLIC_FIREBASE_APP_ID:", appIdFromEnv);
console.log("--- End of Firebase Environment Variable Check ---");
// --- END DIAGNOSTIC LOGS ---


const firebaseConfig = {
  apiKey: "AIzaSyAxvtZdnBU5inuNBOtw3_8j0ywQoLw11G0",
  authDomain: "labourlink-3aelc.firebaseapp.com",
  projectId: "labourlink-3aelc",
  storageBucket: "labourlink-3aelc.firebasestorage.app",
  messagingSenderId: "476102096775",
  appId: "1:476102096775:web:8a53a4f2a4f7e3d7d40522"
};
// Conditional initialization to prevent re-initialization errors and provide clear feedback
let app;
let db;
let auth; // This will hold the auth instance
let storage;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "CRITICAL FIREBASE CONFIG ERROR: Firebase apiKey or projectId is missing from environment variables." +
    " Firebase will NOT be initialized. Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env.local file," +
    " and that you have restarted your development server after making changes to .env.local."
  );
  // To prevent the app from completely crashing immediately due to undefined Firebase services,
  // you might assign placeholder/dummy objects here, though this will lead to runtime errors later
  // when these services are actually used. Forcing a hard error or a clear non-operational state
  // is often better for debugging.
  // For now, we'll let the subsequent getAuth() etc. fail if app isn't initialized.
}

if (!getApps().length) {
  // Only initialize if critical configs are present
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      console.log("Attempting to initialize Firebase app with config:", firebaseConfig);
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app); // Initialize the auth service
      storage = getStorage(app);
      console.log("Firebase initialized successfully.");
    } catch (error) {
      console.error("CRITICAL: Firebase initialization failed during initializeApp():", error);
      console.error("This usually means the provided Firebase config values (API Key, Project ID, etc.) are incorrect or the Firebase project is not set up properly for this app.");
      // Re-throw to make the error very visible in the server logs and potentially crash the server start,
      // which is appropriate if Firebase is critical.
      throw error;
    }
  } else {
    console.error("Firebase NOT initialized due to missing apiKey or projectId in the resolved config. Check previous logs for environment variable values.");
    // If Firebase is absolutely critical, you might want to throw an error here to halt execution.
    // throw new Error("Firebase cannot be initialized - critical configuration missing.");
  }
} else {
  app = getApp(); // Get the already initialized app
  db = getFirestore(app);
  auth = getAuth(app); // Get the auth service from the existing app
  storage = getStorage(app);
  console.log("Firebase app was already initialized. Using existing app instance.");
}

// Export the initialized services (or undefined if initialization failed and wasn't forced to crash)
export { app, db, auth, storage };


// Firestore mock functions for UI development - these should be removed or clearly separated once real Firebase is working
export const mockFirestore = {
  collection: (collectionName: string) => ({
    doc: (docId?: string) => ({
      get: async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (collectionName === 'users' && docId === 'adminUID') {
          return { exists: () => true, data: () => ({ uid: 'adminUID', name: 'Admin User', email: 'admin@labourlink.com', role: 'admin' }) };
        }
        if (collectionName === 'users' && docId === 'labourUID') {
          return { exists: () => true, data: () => ({ uid: 'labourUID', name: 'Labour User', email: 'labour@labourlink.com', role: 'labour', city: 'MockCity', skills: ['Plumbing', 'Electrical'], availability: true }) };
        }
        if (collectionName === 'users' && docId === 'customerUID') {
          return { exists: () => true, data: () => ({ uid: 'customerUID', name: 'Customer User', email: 'customer@labourlink.com', role: 'customer' }) };
        }
        return { exists: () => false, data: () => null };
      },
      set: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log(`Mock Firestore: set data in ${collectionName}/${docId || 'new_doc'}`, data);
      },
      update: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log(`Mock Firestore: update data in ${collectionName}/${docId}`, data);
      }
    }),
    add: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      const newId = `newDoc-${Date.now()}`;
      console.log(`Mock Firestore: add data to ${collectionName}, new ID: ${newId}`, data);
      return { id: newId };
    },
    where: (field: string, operator: string, value: any) => ({
      get: async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (collectionName === 'jobs' && field === 'status' && value === 'open') {
          return { empty: false, docs: [
            { id: 'job1', data: () => ({ id: 'job1', title: 'Plumbing Work', description: 'Fix leaky pipes', requiredSkill: 'Plumbing', location: 'MockCity', duration: '2 days', status: 'open', customerId: 'customerUID', approvedByAdmin: true }) },
            { id: 'job2', data: () => ({ id: 'job2', title: 'Electrical Wiring', description: 'Install new wiring', requiredSkill: 'Electrical', location: 'AnotherCity', duration: '5 days', status: 'open', customerId: 'customerUID2', approvedByAdmin: true }) },
          ]};
        }
         if (collectionName === 'jobs' && field === 'status' && value !== 'deleted') {
            if (value === 'customerUID' || field === 'customerId'){ 
                 return { empty: false, docs: [
                    { id: 'jobCust1', data: () => ({ id: 'jobCust1', title: 'Customer Job 1 (Open)', customerId: 'customerUID', requiredSkill: 'Plumbing', location: 'MockCity', duration: '1 week', status: 'open', createdAt: new Date(Date.now() - 86400000).toISOString() }) },
                    { id: 'jobCust2', data: () => ({ id: 'jobCust2', title: 'Customer Job 2 (Pending)', customerId: 'customerUID', requiredSkill: 'Electrical', location: 'MockCity', duration: '3 days', status: 'pending_approval', createdAt: new Date().toISOString() }) },
                 ]};
            }
            return { empty: false, docs: [
                { id: 'job1', data: () => ({ id: 'job1', title: 'Plumbing Work', description: 'Fix leaky pipes', requiredSkill: 'Plumbing', location: 'MockCity', duration: '2 days', status: 'open', customerId: 'customerUID', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() }) },
                { id: 'job2', data: () => ({ id: 'job2', title: 'Electrical Wiring', description: 'Install new wiring', requiredSkill: 'Electrical', location: 'AnotherCity', duration: '5 days', status: 'open', customerId: 'customerUID2', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000).toISOString() }) },
                { id: 'job3', data: () => ({ id: 'job3', title: 'Pending Masonry', description: 'Build a wall', requiredSkill: 'Masonry', location: 'MockCity', duration: '1 week', status: 'pending_approval', customerId: 'customerUID', createdAt: new Date().toISOString() }) },
            ]};
        }
        if (collectionName === 'users' && field === 'role' && value === 'labour') {
           return { empty: false, docs: [
            { id: 'labour1', data: () => ({ uid: 'labour1', name: 'John Doe', role: 'labour', skills: ['Plumbing', 'Welding'], city: 'MockCity', availability: true, email: 'john@example.com' }) },
            { id: 'labour2', data: () => ({ uid: 'labour2', name: 'Jane Smith', role: 'labour', skills: ['Electrical', 'Carpentry'], city: 'AnotherCity', availability: false, email: 'jane@example.com' }) },
          ]};
        }
        return { empty: true, docs: [] };
      }
    })
  }),
};
