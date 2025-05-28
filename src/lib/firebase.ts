
// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import type { UserProfile, Job, Application } from "@/types"; // Ensure types are imported for mock data

// --- BEGIN INLINE MOCK DEFINITIONS ---
// In a larger setup, these could be in a separate firebase-mock.ts file

let MOCK_USERS_DB_STORAGE_KEY = 'mockUsersDb';
let MOCK_JOBS_DB_STORAGE_KEY = 'mockJobsDb';
let MOCK_APPLICATIONS_DB_STORAGE_KEY = 'mockApplicationsDb';

let initialMockUsersDb: Record<string, UserProfile> = {
  "mockUID-labour": { uid: "mockUID-labour", name: "Labour User", email: "labour@labourlink.com", role: "labour", skills: ["Plumber", "Electrician"], city: "Mumbai", availability: true, roleType: "Plumber", profilePhotoUrl: "https://placehold.co/100x100.png?text=LU", subscription: { planId: "labour_monthly_99", planType: "month", status: 'active', validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }, createdAt: new Date().toISOString() },
  "mockUID-customer": { uid: "mockUID-customer", name: "Customer User", email: "customer@labourlink.com", role: "customer", createdAt: new Date().toISOString(), subscription: { planId: "free_customer", planType: "free", status: 'active', validUntil: null, jobPostLimit: 5, jobPostCount: 0 } },
  "mockUID-admin": { uid: "mockUID-admin", name: "Admin User", email: "admin@labourlink.com", role: "admin", createdAt: new Date().toISOString() },
};
let initialMockJobsDb: Record<string, Job> = {};
let initialMockApplicationsDb: Record<string, Application> = {};


const loadFromLocalStorage = <T>(key: string, initialData: T): T => {
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      try {
        console.log(`[MockDB Load] Loaded ${key} from localStorage:`, JSON.parse(storedData));
        return JSON.parse(storedData);
      } catch (e) {
        console.error(`[MockDB Load] Error parsing ${key} from localStorage:`, e);
        localStorage.removeItem(key); // Remove corrupted data
        return initialData;
      }
    }
  }
  return initialData;
};

const saveToLocalStorage = <T>(key: string, data: T) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[MockDB Save] Error saving ${key} to localStorage:`, e);
    }
  }
};

let mockUsersDb = loadFromLocalStorage(MOCK_USERS_DB_STORAGE_KEY, initialMockUsersDb);
let mockJobsDb = loadFromLocalStorage(MOCK_JOBS_DB_STORAGE_KEY, initialMockJobsDb);
let mockApplicationsDb = loadFromLocalStorage(MOCK_APPLICATIONS_DB_STORAGE_KEY, initialMockApplicationsDb);

const saveMockUsersDb = () => { console.log('[MockDB Save] Saving mockUsersDb to localStorage:', JSON.parse(JSON.stringify(mockUsersDb))); saveToLocalStorage(MOCK_USERS_DB_STORAGE_KEY, mockUsersDb); };
const saveMockJobsDb = () => { console.log('[MockDB Save] Saving mockJobsDb to localStorage:', JSON.parse(JSON.stringify(mockJobsDb))); saveToLocalStorage(MOCK_JOBS_DB_STORAGE_KEY, mockJobsDb); };
const saveMockApplicationsDb = () => { console.log('[MockDB Save] Saving mockApplicationsDb to localStorage:', JSON.parse(JSON.stringify(mockApplicationsDb))); saveToLocalStorage(MOCK_APPLICATIONS_DB_STORAGE_KEY, mockApplicationsDb); };


let currentMockUser: UserProfile | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem('currentMockUser');
  if (storedUser) {
    currentMockUser = JSON.parse(storedUser);
  }
}

const mockAuthInternal: any = {
  onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentMockUser');
      if (storedUser) {
        currentMockUser = JSON.parse(storedUser);
      }
    }
    callback(currentMockUser); // Notify immediately with current state
    // This mock doesn't actively listen for external changes, it's just a snapshot
    return () => { }; // Return an unsubscribe function
  },
  signInWithEmailAndPassword: (auth: any, email: string, pass: string) => {
    const userEntry = Object.values(mockUsersDb).find(u => u.email === email);
    // In a real app, you'd verify the password hash. Here, we just check if user exists.
    if (userEntry) {
      currentMockUser = userEntry;
      if (typeof window !== 'undefined') localStorage.setItem('currentMockUser', JSON.stringify(currentMockUser));
      // Simulate onAuthStateChanged broadcast
      mockAuthInternal._notifyAuthStateChange(currentMockUser);
      return Promise.resolve({ user: currentMockUser });
    }
    return Promise.reject(new Error("Mock Auth: Invalid email or password."));
  },
  createUserWithEmailAndPassword: (auth: any, email: string, pass: string) => {
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      return Promise.reject(new Error("Mock Auth: Email already in use."));
    }
    const uid = `mockUID-${Date.now()}`;
    // Name and role would be set when creating the user profile document
    const newUserAuthData = { uid, email, name: "New User", role: "labour" }; // Placeholder, actual role comes from form
    currentMockUser = newUserAuthData as UserProfile; // Cast for simplicity
    if (typeof window !== 'undefined') localStorage.setItem('currentMockUser', JSON.stringify(currentMockUser));
     // Simulate onAuthStateChanged broadcast
    mockAuthInternal._notifyAuthStateChange(currentMockUser);
    return Promise.resolve({ user: currentMockUser });
  },
  signOut: (auth: any) => {
    currentMockUser = null;
    if (typeof window !== 'undefined') localStorage.removeItem('currentMockUser');
    // Simulate onAuthStateChanged broadcast
    mockAuthInternal._notifyAuthStateChange(null);
    return Promise.resolve();
  },
  _listeners: [] as Array<(user: UserProfile | null) => void>,
  _notifyAuthStateChange: (user: UserProfile | null) => {
    mockAuthInternal._listeners.forEach((listener: (user: UserProfile | null) => void) => listener(user));
  },
  // Add this to allow AuthContext to register its listener
  _onAuthStateChangedActual: (callback: (user: UserProfile | null) => void) => {
    mockAuthInternal._listeners.push(callback);
    // Initial call
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentMockUser');
      currentMockUser = storedUser ? JSON.parse(storedUser) : null;
    }
    callback(currentMockUser);
    return () => { // Unsubscribe
      mockAuthInternal._listeners = mockAuthInternal._listeners.filter((l: any) => l !== callback);
    };
  }
};


const mockDbInternal: any = {
  collection: (collectionName: string) => {
    let dbInstance: any;
    let saveDbInstance: () => void;

    if (collectionName === 'users') {
      dbInstance = mockUsersDb;
      saveDbInstance = saveMockUsersDb;
    } else if (collectionName === 'jobs') {
      dbInstance = mockJobsDb;
      saveDbInstance = saveMockJobsDb;
    } else if (collectionName === 'applications') {
      dbInstance = mockApplicationsDb;
      saveDbInstance = saveMockApplicationsDb;
    } else {
      console.warn(`[MockDB] Accessing unknown collection: ${collectionName}`);
      dbInstance = {};
      saveDbInstance = () => {};
    }

    return {
      doc: (docId?: string) => {
        const id = docId || `mockDoc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id,
          get: () => {
            console.log(`[MockDB Get] Getting doc ${id} from ${collectionName}`);
            const docData = dbInstance[id];
            return Promise.resolve({
              exists: () => !!docData, // exists is a function
              data: () => docData || null,
              id,
            });
          },
          set: (data: any) => {
             console.log(`[MockDB Set] Setting doc ${id} in ${collectionName} with:`, JSON.parse(JSON.stringify(data)));
            dbInstance[id] = { ...data, id, updatedAt: new Date().toISOString() }; // Ensure id is part of the stored data
            if (!dbInstance[id].createdAt) {
              dbInstance[id].createdAt = new Date().toISOString();
            }
            saveDbInstance();
            return Promise.resolve();
          },
          update: (data: any) => {
            console.log(`[MockDB Update] Attempting to update ${collectionName}/${id} with data:`, JSON.parse(JSON.stringify(data)));
            if (dbInstance[id]) {
                console.log(`[MockDB Update] ${collectionName} ${id} before:`, JSON.parse(JSON.stringify(dbInstance[id])));
                dbInstance[id] = { ...dbInstance[id], ...data, updatedAt: new Date().toISOString() };
                console.log(`[MockDB Update] ${collectionName} ${id} after:`, JSON.parse(JSON.stringify(dbInstance[id])));
                saveDbInstance();
            } else {
                console.warn(`[MockDB Update] Document ${id} not found in ${collectionName} for update.`);
            }
            return Promise.resolve();
          },
          delete: () => {
            console.log(`[MockDB Delete] Deleting doc ${id} from ${collectionName}`);
            delete dbInstance[id];
            saveDbInstance();
            return Promise.resolve();
          }
        };
      },
      add: (data: any) => {
        const id = `${collectionName.slice(0,3)}-${Date.now()}-${Object.keys(dbInstance).length}`;
        console.log(`[MockDB Add] Adding to ${collectionName} with new id ${id}:`, JSON.parse(JSON.stringify(data)));
        dbInstance[id] = { ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        saveDbInstance();
        return Promise.resolve({ id });
      },
      where: (field: string, operator: string, value: any) => {
        // Simplified mock 'where' that supports basic equality and array-contains
        return {
          get: () => {
            console.log(`[MockDB WhereGet] Querying ${collectionName} where ${field} ${operator} ${JSON.stringify(value)}`);
            const results = Object.values(dbInstance).filter((doc: any) => {
              if (!doc || typeof doc[field] === 'undefined') return false;
              switch (operator) {
                case '==': return doc[field] === value;
                case '!=': return doc[field] !== value;
                case 'array-contains': return Array.isArray(doc[field]) && doc[field].includes(value);
                case 'in': return Array.isArray(value) && value.includes(doc[field]);
                // Add more operators as needed for mocks
                default: return false;
              }
            });
            return Promise.resolve({
              empty: results.length === 0,
              docs: results.map((doc: any) => ({
                id: doc.id,
                data: () => doc,
                exists: () => true,
              })),
            });
          },
        };
      },
      get: () => { // For db.collection("someCollection").get()
        console.log(`[MockDB GetCollection] Getting all docs from ${collectionName}`);
        const allDocs = Object.values(dbInstance);
        return Promise.resolve({
          empty: allDocs.length === 0,
          docs: allDocs.map((doc: any) => ({
            id: doc.id,
            data: () => doc,
            exists: () => true,
          })),
        });
      },
    };
  },
};

const mockStorageInternal: any = {
  ref: (path?: string) => ({
    put: (file: File) => {
      console.log(`[MockStorage Put] Simulating upload of ${file.name} to path ${path}`);
      return Promise.resolve({
        snapshot: {
          ref: {
            getDownloadURL: () => {
              const newPicUrl = `https://placehold.co/100x100.png?text=NEWPIC_${Date.now()}`;
              console.log(`[MockStorage GetURL] Simulating getDownloadURL, returning: ${newPicUrl}`);
              return Promise.resolve(newPicUrl);
            }
          }
        }
      });
    },
    child: (childPath: string) => mockStorageInternal.ref(`${path}/${childPath}`)
  }),
};

// --- END INLINE MOCK DEFINITIONS ---


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

console.log("Firebase effective config:", JSON.stringify(firebaseConfig));


let app: FirebaseApp | undefined = undefined;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("CRITICAL: Firebase apiKey or projectId is missing. Firebase will NOT be initialized. FALLING BACK TO MOCK IMPLEMENTATION.");
  authInstance = mockAuthInternal._onAuthStateChangedActual ? mockAuthInternal : { ...mockAuthInternal, onAuthStateChanged: mockAuthInternal._onAuthStateChangedActual };
  dbInstance = mockDbInternal as Firestore;
  storageInstance = mockStorageInternal as FirebaseStorage;
} else {
  console.log("Firebase config seems present. Attempting to initialize real Firebase.");
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
    } catch (e: any) {
      console.error("Firebase app initialization error:", e.message);
      app = undefined; // Ensure app is undefined if init fails
    }
  } else {
    app = getApp();
    console.log("Firebase app already initialized.");
  }

  if (app) {
    try {
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);
      storageInstance = getStorage(app);
      console.log("Real Firebase services obtained.");
    } catch (e: any) {
      console.error("Error getting Firebase services after app initialization:", e.message);
      console.error("FALLING BACK TO MOCK IMPLEMENTATION due to service retrieval error.");
      authInstance = mockAuthInternal._onAuthStateChangedActual ? mockAuthInternal : { ...mockAuthInternal, onAuthStateChanged: mockAuthInternal._onAuthStateChangedActual };
      dbInstance = mockDbInternal as Firestore;
      storageInstance = mockStorageInternal as FirebaseStorage;
    }
  } else {
    // This case means apiKey and projectId were present, but initializeApp failed or app is still not defined.
    console.error("Firebase app is undefined after initialization attempt. FALLING BACK TO MOCK IMPLEMENTATION.");
    authInstance = mockAuthInternal._onAuthStateChangedActual ? mockAuthInternal : { ...mockAuthInternal, onAuthStateChanged: mockAuthInternal._onAuthStateChangedActual };
    dbInstance = mockDbInternal as Firestore;
    storageInstance = mockStorageInternal as FirebaseStorage;
  }
}

export { app, authInstance as auth, dbInstance as db, storageInstance as storage };

