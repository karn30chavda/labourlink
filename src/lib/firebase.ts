
// This file provides a MOCK Firebase implementation for development.
// It does NOT connect to a real Firebase backend.
// Login state is persisted via localStorage.
// Other data (users, jobs, applications) is persisted via localStorage.

import type { UserProfile, Job, Application, MockAuthUser } from "@/types";
import { siteConfig } from "@/config/site";

// --- Storage Keys ---
const MOCK_USERS_DB_STORAGE_KEY = 'mockUsersDb';
const MOCK_JOBS_DB_STORAGE_KEY = 'mockJobsDb';
const MOCK_APPLICATIONS_DB_STORAGE_KEY = 'mockApplicationsDb';
const MOCK_CURRENT_USER_STORAGE_KEY = 'currentMockUser';


// --- Initial Mock Data ---
let initialMockUsersDb: Record<string, UserProfile> = {
  "mockUID-labour": {
    uid: "mockUID-labour",
    name: "Labour User",
    email: "labour@labourlink.com",
    role: "labour",
    skills: ["Plumber", "Electrician"],
    city: "Mumbai",
    availability: true,
    roleType: "Plumber",
    profilePhotoUrl: "https://placehold.co/100x100.png?text=LU",
    subscription: {
        planId: "labour_monthly_99",
        planType: "month",
        status: 'active',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "mockUID-customer": {
    uid: "mockUID-customer",
    name: "Customer User",
    email: "customer@labourlink.com",
    role: "customer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscription: {
        planId: "free_customer",
        planType: "free",
        status: 'active',
        validUntil: null,
        jobPostLimit: 5,
        jobPostCount: 0
    }
  },
  "mockUID-admin": {
    uid: "mockUID-admin",
    name: "Admin User",
    email: "admin@labourlink.com",
    role: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};
let initialMockJobsDb: Record<string, Job> = {
  // Starts empty as per user request
};
let initialMockApplicationsDb: Record<string, Application> = {
  // Starts empty as per user request
};

// --- LocalStorage Helper ---
const loadFromLocalStorage = <T>(key: string, initialData: T): T => {
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log(`[MockDB Load] Loaded ${key} from localStorage:`, JSON.parse(JSON.stringify(parsedData)));
        return parsedData;
      } catch (e) {
        console.error(`[MockDB Load] Error parsing ${key} from localStorage:`, e, "Stored data:", storedData);
        localStorage.removeItem(key); // Remove corrupted data
      }
    } else {
        console.log(`[MockDB Load] No data for ${key} in localStorage, using initial data.`);
    }
  }
  return JSON.parse(JSON.stringify(initialData)); // Return a deep copy of initial data
};

const saveToLocalStorage = <T>(key: string, data: T) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`[MockDB Save] Saved ${key} to localStorage. Data:`, JSON.parse(JSON.stringify(data)));
    } catch (e) {
      console.error(`[MockDB Save] Error saving ${key} to localStorage:`, e);
    }
  }
};

// --- Mock Databases (In-Memory, with localStorage persistence) ---
let mockUsersDb = loadFromLocalStorage(MOCK_USERS_DB_STORAGE_KEY, initialMockUsersDb);
let mockJobsDb = loadFromLocalStorage(MOCK_JOBS_DB_STORAGE_KEY, initialMockJobsDb);
let mockApplicationsDb = loadFromLocalStorage(MOCK_APPLICATIONS_DB_STORAGE_KEY, initialMockApplicationsDb);

const saveMockUsersDb = () => { saveToLocalStorage(MOCK_USERS_DB_STORAGE_KEY, mockUsersDb); };
const saveMockJobsDb = () => { saveToLocalStorage(MOCK_JOBS_DB_STORAGE_KEY, mockJobsDb); };
const saveMockApplicationsDb = () => { saveToLocalStorage(MOCK_APPLICATIONS_DB_STORAGE_KEY, mockApplicationsDb); };


// --- Mock Authentication ---
let currentMockUserAuth: MockAuthUser | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem(MOCK_CURRENT_USER_STORAGE_KEY);
  if (storedUser) {
    try {
      currentMockUserAuth = JSON.parse(storedUser);
      console.log("[MockAuth] Loaded currentMockUserAuth from localStorage:", currentMockUserAuth);
    } catch (e) {
      console.error("[MockAuth] Error parsing currentMockUserAuth from localStorage:", e);
      localStorage.removeItem(MOCK_CURRENT_USER_STORAGE_KEY);
    }
  }
}

export const auth = {
  _listeners: [] as Array<(user: MockAuthUser | null) => void>,
  _notifyAuthStateChange: (user: MockAuthUser | null) => {
    auth._listeners.forEach(listener => listener(user));
  },
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void) => {
    auth._listeners.push(callback);
    // Initial call to inform about current state
    if (typeof window !== 'undefined') { // Ensure this runs client-side
        const storedUser = localStorage.getItem(MOCK_CURRENT_USER_STORAGE_KEY);
        currentMockUserAuth = storedUser ? JSON.parse(storedUser) : null;
    }
    callback(currentMockUserAuth);

    return () => { // Unsubscribe
      auth._listeners = auth._listeners.filter(l => l !== callback);
    };
  },
  signInWithEmailAndPassword: async (_authInstance: any, email: string, _pass: string): Promise<{ user: MockAuthUser }> => {
    const userProfile = Object.values(mockUsersDb).find(u => u.email === email);
    if (userProfile) {
      currentMockUserAuth = { uid: userProfile.uid, email: userProfile.email };
      if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_CURRENT_USER_STORAGE_KEY, JSON.stringify(currentMockUserAuth));
      }
      auth._notifyAuthStateChange(currentMockUserAuth);
      console.log("[MockAuth] signInWithEmailAndPassword successful for:", email);
      return { user: currentMockUserAuth };
    }
    console.warn("[MockAuth] signInWithEmailAndPassword failed for:", email);
    throw new Error("Mock Auth: Invalid email or password.");
  },
  createUserWithEmailAndPassword: async (_authInstance: any, email: string, _pass: string): Promise<{ user: MockAuthUser }> => {
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}`;
    const newUserAuthData: MockAuthUser = { uid, email };
    // The actual UserProfile creation happens in AuthContext and saved to mockUsersDb there
    // For the auth part, we just set the current user
    currentMockUserAuth = newUserAuthData;
     if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_CURRENT_USER_STORAGE_KEY, JSON.stringify(currentMockUserAuth));
    }
    auth._notifyAuthStateChange(currentMockUserAuth);
    console.log("[MockAuth] createUserWithEmailAndPassword (auth part) successful for:", email, "UID:", uid);
    return { user: newUserAuthData };
  },
  signOut: async (_authInstance: any) => {
    currentMockUserAuth = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_CURRENT_USER_STORAGE_KEY);
    }
    auth._notifyAuthStateChange(null);
    console.log("[MockAuth] signOut successful.");
  },
};


// --- Mock Firestore Database ---
export const db = {
  collection: (collectionName: string) => {
    let dbInstance: any;
    let saveDbInstance: (() => void) | null = null;

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
      dbInstance = {}; // Should not happen with type safety
    }

    const createQueryInstance = (existingConditions: Array<{ field: string; operator: string; value: any }> = []) => {
      const conditions = [...existingConditions]; // Clone to ensure current query doesn't affect others

      const queryInterface: {
        where: (field: string, operator: string, value: any) => typeof queryInterface;
        get: () => Promise<{ empty: boolean; docs: Array<{ id: string; data: () => any; exists: () => boolean }> }>;
      } = {
        where: (field: string, operator: string, value: any) => {
          conditions.push({ field, operator, value });
          return queryInterface; // Return self for chaining
        },
        get: async () => {
          console.log(`[MockDB Get] Querying ${collectionName} with conditions:`, JSON.parse(JSON.stringify(conditions)));
          let results = Object.values(dbInstance);
          if (conditions.length > 0) {
            results = results.filter((doc: any) => {
              return conditions.every(cond => {
                if (!doc || typeof doc[cond.field] === 'undefined') {
                    // console.warn(`[MockDB Filter] Document ID ${doc.id} in ${collectionName} missing field ${cond.field} for filtering:`, doc);
                    return false;
                }
                switch (cond.operator) {
                  case '==': return doc[cond.field] === cond.value;
                  case '!=': return doc[cond.field] !== cond.value;
                  case 'array-contains': return Array.isArray(doc[cond.field]) && doc[cond.field].includes(cond.value);
                  case 'in': return Array.isArray(cond.value) && cond.value.includes(doc[cond.field]);
                  // Add more operators as needed (e.g., '>', '<', 'array-contains-any')
                  default:
                    console.warn(`[MockDB Filter] Unsupported operator: ${cond.operator}`);
                    return false;
                }
              });
            });
          }
          return {
            empty: results.length === 0,
            docs: results.map((doc: any) => ({
              id: doc.id,
              data: () => JSON.parse(JSON.stringify(doc)), // Return copy
              exists: () => true, // Assuming if it's in results, it exists
            })),
          };
        }
      };
      return queryInterface;
    };


    return {
      doc: (docId?: string) => {
        const id = docId || `${collectionName.slice(0,3)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id,
          get: async () => {
            const docData = dbInstance[id];
             console.log(`[MockDB Get Doc] Getting doc ${id} from ${collectionName}. Found:`, !!docData);
            return {
              exists: () => !!docData,
              data: () => docData ? JSON.parse(JSON.stringify(docData)) : undefined, // Return copy, or undefined if !docData
              id,
            };
          },
          set: async (data: any) => {
            const timestamp = new Date().toISOString();
            dbInstance[id] = { ...data, id, updatedAt: timestamp };
            if (!dbInstance[id].createdAt) {
              dbInstance[id].createdAt = timestamp;
            }
            console.log(`[MockDB Set] Setting doc ${id} in ${collectionName}. New data:`, JSON.parse(JSON.stringify(dbInstance[id])));
            if (saveDbInstance) saveDbInstance();
          },
          update: async (data: any) => {
            if (dbInstance[id]) {
              console.log(`[MockDB Update] Updating doc ${id} in ${collectionName}. Current:`, JSON.parse(JSON.stringify(dbInstance[id])), "With:", JSON.parse(JSON.stringify(data)));
              dbInstance[id] = { ...dbInstance[id], ...data, updatedAt: new Date().toISOString() };
               console.log(`[MockDB Update] Doc ${id} in ${collectionName} After:`, JSON.parse(JSON.stringify(dbInstance[id])));
              if (saveDbInstance) saveDbInstance();
            } else {
              console.warn(`[MockDB Update] Document ${id} not found in ${collectionName} for update.`);
            }
          },
          delete: async () => {
            console.log(`[MockDB Delete] Deleting doc ${id} from ${collectionName}`);
            delete dbInstance[id];
            if (saveDbInstance) saveDbInstance();
          }
        };
      },
      add: async (data: any) => {
        const id = `${collectionName.slice(0,3)}-${Date.now()}-${Object.keys(dbInstance).length + Math.random().toString(16).slice(2)}`;
        const timestamp = new Date().toISOString();
        dbInstance[id] = { ...data, id, createdAt: timestamp, updatedAt: timestamp };
        console.log(`[MockDB Add] Adding to ${collectionName} with new id ${id}. Data:`, JSON.parse(JSON.stringify(dbInstance[id])));
        if (saveDbInstance) saveDbInstance();
        return { id };
      },
      // Start a query
      where: (field: string, operator: string, value: any) => {
        return createQueryInstance().where(field, operator, value);
      },
      // Get all documents in the collection (no filtering)
      get: async () => {
        return createQueryInstance().get();
      }
    };
  }
};

// Mock Firebase Storage (basic version, no actual upload/download)
export const storage = {
  ref: (_storageInstance?: any, path?: string) => ({
    put: async (file: File) => {
      console.log(`[MockStorage Put] Simulating upload of ${file.name} to path ${path}`);
      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        snapshot: {
          ref: {
            getDownloadURL: async () => {
              const newPicUrl = `https://placehold.co/100x100.png?text=NEWPIC_${Date.now().toString().slice(-4)}`;
              console.log(`[MockStorage GetURL] Simulating getDownloadURL for ${file.name}, returning: ${newPicUrl}`);
              return newPicUrl;
            }
          }
        }
      };
    },
    child: (childPath: string) => storage.ref(undefined, `${path}/${childPath}`)
  }),
  getDownloadURL: async (ref: any) => ref.getDownloadURL(),
  uploadBytes: async (ref: any, file: File) => ref.put(file),
};


// No Firebase app initialization needed for pure mock
export const app = undefined;

console.log("[Firebase Setup] Using MOCK Firebase services. Data persists in localStorage.");
