// Import the functions you need from the SDKs you need
// import { initializeApp, getApp, getApps } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const db = getFirestore(app);
// const auth = getAuth(app);
// const storage = getStorage(app);

// export { app, db, auth, storage };

// Placeholder exports - uncomment and replace with actual Firebase initialization
export const app = {};
export const db = {};
export const auth = {
  // Mock auth functions for UI development
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Simulate loading and then no user / a mock user
    // setTimeout(() => callback(null), 1000); 
    // To test with a mock user:
    // setTimeout(() => callback({ uid: 'mockUserId', email: 'mock@example.com', displayName: 'Mock User' }), 1000);
    return () => {}; // Unsubscribe function
  },
  signInWithEmailAndPassword: async (email?: string, password?: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === "admin@labourlink.com" && password === "admin123") {
      return { user: { uid: 'adminUID', email: 'admin@labourlink.com', displayName: 'Admin User' } };
    }
    if (email === "labour@labourlink.com" && password === "labour123") {
      return { user: { uid: 'labourUID', email: 'labour@labourlink.com', displayName: 'Labour User' } };
    }
    if (email === "customer@labourlink.com" && password === "customer123") {
      return { user: { uid: 'customerUID', email: 'customer@labourlink.com', displayName: 'Customer User' } };
    }
    throw new Error("Invalid credentials");
  },
  createUserWithEmailAndPassword: async (email?: string, password?: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate successful registration
    return { user: { uid: `newUser-${Date.now()}`, email, displayName: 'New User' } };
  },
  signOut: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
export const storage = {};

// Firestore mock functions for UI development
export const mockFirestore = {
  collection: (collectionName: string) => ({
    doc: (docId?: string) => ({
      get: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
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
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Firestore mock: set data in ${collectionName}/${docId || 'new_doc'}`, data);
      },
      update: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Firestore mock: update data in ${collectionName}/${docId}`, data);
      }
    }),
    add: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newId = `newDoc-${Date.now()}`;
      console.log(`Firestore mock: add data to ${collectionName}, new ID: ${newId}`, data);
      return { id: newId };
    },
    where: (field: string, operator: string, value: any) => ({
      get: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (collectionName === 'jobs' && field === 'status' && value === 'open') {
          return { empty: false, docs: [
            { id: 'job1', data: () => ({ id: 'job1', title: 'Plumbing Work', description: 'Fix leaky pipes', requiredSkill: 'Plumbing', location: 'MockCity', duration: '2 days', status: 'open', customerId: 'customerUID' }) },
            { id: 'job2', data: () => ({ id: 'job2', title: 'Electrical Wiring', description: 'Install new wiring', requiredSkill: 'Electrical', location: 'AnotherCity', duration: '5 days', status: 'open', customerId: 'customerUID2' }) },
          ]};
        }
        if (collectionName === 'users' && field === 'role' && value === 'labour') {
           return { empty: false, docs: [
            { id: 'labour1', data: () => ({ id: 'labour1', name: 'John Doe', role: 'labour', skills: ['Plumbing', 'Welding'], city: 'MockCity', availability: true }) },
            { id: 'labour2', data: () => ({ id: 'labour2', name: 'Jane Smith', role: 'labour', skills: ['Electrical', 'Carpentry'], city: 'AnotherCity', availability: false }) },
          ]};
        }
        return { empty: true, docs: [] };
      }
    })
  }),
};
