
// This file provides a MOCK Firebase implementation for development.
// Login state is persisted via localStorage.
// Other data (users, jobs, applications, directJobOffers) is persisted via localStorage.

import type { UserProfile, Job, Application, DirectJobOffer, MockAuthUser, UserRole } from "@/types";
import { siteConfig } from "@/config/site";

// --- Storage Keys ---
const MOCK_USERS_DB_STORAGE_KEY = 'mockUsersDb';
const MOCK_JOBS_DB_STORAGE_KEY = 'mockJobsDb';
const MOCK_APPLICATIONS_DB_STORAGE_KEY = 'mockApplicationsDb';
const MOCK_DIRECT_JOB_OFFERS_DB_STORAGE_KEY = 'mockDirectJobOffersDb';
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
let initialMockJobsDb: Record<string, Job> = {};
let initialMockApplicationsDb: Record<string, Application> = {};
let initialMockDirectJobOffersDb: Record<string, DirectJobOffer> = {};

// --- LocalStorage Helper ---
const loadFromLocalStorage = <T>(key: string, initialData: T): T => {
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // console.log(`[MockDB Load] Loaded ${key} from localStorage:`, JSON.parse(JSON.stringify(parsedData)));
        return parsedData;
      } catch (e) {
        console.error(`[MockDB Load] Error parsing ${key} from localStorage:`, e, "Stored data:", storedData);
        localStorage.removeItem(key); // Remove corrupted data
      }
    } else {
        // console.log(`[MockDB Load] No data for ${key} in localStorage, using initial data.`);
    }
  }
  return JSON.parse(JSON.stringify(initialData)); // Return a deep copy of initial data
};

const saveToLocalStorage = <T>(key: string, data: T) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // console.log(`[MockDB Save] Saved ${key} to localStorage. Data items:`, Object.keys(data).length);
    } catch (e) {
      console.error(`[MockDB Save] Error saving ${key} to localStorage:`, e);
    }
  }
};

// --- Mock Databases (In-Memory, with localStorage persistence) ---
let mockUsersDb = loadFromLocalStorage(MOCK_USERS_DB_STORAGE_KEY, initialMockUsersDb);
let mockJobsDb = loadFromLocalStorage(MOCK_JOBS_DB_STORAGE_KEY, initialMockJobsDb);
let mockApplicationsDb = loadFromLocalStorage(MOCK_APPLICATIONS_DB_STORAGE_KEY, initialMockApplicationsDb);
let mockDirectJobOffersDb = loadFromLocalStorage(MOCK_DIRECT_JOB_OFFERS_DB_STORAGE_KEY, initialMockDirectJobOffersDb);


const saveMockUsersDb = () => { saveToLocalStorage(MOCK_USERS_DB_STORAGE_KEY, mockUsersDb); };
const saveMockJobsDb = () => { saveToLocalStorage(MOCK_JOBS_DB_STORAGE_KEY, mockJobsDb); };
const saveMockApplicationsDb = () => { saveToLocalStorage(MOCK_APPLICATIONS_DB_STORAGE_KEY, mockApplicationsDb); };
const saveMockDirectJobOffersDb = () => { saveToLocalStorage(MOCK_DIRECT_JOB_OFFERS_DB_STORAGE_KEY, mockDirectJobOffersDb); };


// --- Mock Authentication ---
let currentMockUserAuth: MockAuthUser | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem(MOCK_CURRENT_USER_STORAGE_KEY);
  if (storedUser) {
    try {
      currentMockUserAuth = JSON.parse(storedUser);
    } catch (e) {
      localStorage.removeItem(MOCK_CURRENT_USER_STORAGE_KEY);
    }
  }
}

const auth = {
  _listeners: [] as Array<(user: MockAuthUser | null) => void>,
  _notifyAuthStateChange: (user: MockAuthUser | null) => {
    auth._listeners.forEach(listener => listener(user));
  },
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void) => {
    auth._listeners.push(callback);
     if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem(MOCK_CURRENT_USER_STORAGE_KEY);
        if (storedUser) {
            try {
                currentMockUserAuth = JSON.parse(storedUser);
            } catch (e) {
                localStorage.removeItem(MOCK_CURRENT_USER_STORAGE_KEY);
                currentMockUserAuth = null;
            }
        } else {
            currentMockUserAuth = null;
        }
    }
    callback(currentMockUserAuth);

    return () => { 
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
      return { user: currentMockUserAuth };
    }
    throw new Error("Mock Auth: Invalid email or password.");
  },
  createUserWithEmailAndPassword: async (_authInstance: any, email: string, _pass: string): Promise<{ user: MockAuthUser }> => {
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}`;
    const newUserAuthData: MockAuthUser = { uid, email };
    currentMockUserAuth = newUserAuthData;
     if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_CURRENT_USER_STORAGE_KEY, JSON.stringify(currentMockUserAuth));
    }
    auth._notifyAuthStateChange(currentMockUserAuth);
    return { user: newUserAuthData };
  },
  signOut: async (_authInstance: any) => {
    currentMockUserAuth = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_CURRENT_USER_STORAGE_KEY);
    }
    auth._notifyAuthStateChange(null);
  },
};


// --- Mock Firestore Database ---
const db = {
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
    } else if (collectionName === 'directJobOffers') {
      dbInstance = mockDirectJobOffersDb;
      saveDbInstance = saveMockDirectJobOffersDb;
    }
     else {
      console.warn(`[MockDB] Accessing unknown collection: ${collectionName}`);
      dbInstance = {}; 
    }

    const createQueryInstance = (existingConditions: Array<{ field: string; operator: string; value: any }> = []) => {
      const queryInterface: {
        where: (field: string, operator: string, value: any) => typeof queryInterface;
        get: () => Promise<{ empty: boolean; docs: Array<{ id: string; data: () => any; exists: () => boolean }> }>;
      } = {
        where: (field: string, operator: string, value: any) => {
          const newConditions = [...existingConditions, { field, operator, value }];
          return createQueryInstance(newConditions);
        },
        get: async () => {
          let results = Object.values(dbInstance) as any[];
          if (existingConditions.length > 0) {
            results = results.filter((doc: any) => {
              return existingConditions.every(cond => {
                if (!doc || typeof doc[cond.field] === 'undefined') {
                    return false;
                }
                switch (cond.operator) {
                  case '==': return doc[cond.field] === cond.value;
                  case '!=': return doc[cond.field] !== cond.value;
                  case 'array-contains': return Array.isArray(doc[cond.field]) && doc[cond.field].includes(cond.value);
                  case 'in': return Array.isArray(cond.value) && cond.value.includes(doc[cond.field]);
                  default:
                    console.warn(`[MockDB Filter] Unsupported operator: ${cond.operator} for field ${cond.field}`);
                    return false;
                }
              });
            });
          }
          // console.log(`[MockDB Get] Querying ${collectionName} with conditions:`, JSON.parse(JSON.stringify(existingConditions)), "Results count:", results.length);
          return {
            empty: results.length === 0,
            docs: results.map((doc: any) => ({
              id: doc.id, 
              data: () => JSON.parse(JSON.stringify(doc)),
              exists: () => true, 
            })),
          };
        }
      };
      return queryInterface;
    };

    return {
      doc: (docId?: string) => {
        const id = docId || `${collectionName.slice(0,3)}-${Date.now()}-${Object.keys(dbInstance).length + 1 + Math.random().toString(16).slice(2)}`;
        return {
          id,
          get: async () => {
            const docData = dbInstance[id];
            // console.log(`[MockDB Doc Get] Getting doc ID '${id}' from collection '${collectionName}'. Found:`, !!docData);
            return {
              exists: () => !!docData, 
              data: () => docData ? JSON.parse(JSON.stringify(docData)) : undefined,
              id,
            };
          },
          set: async (data: any) => {
            const timestamp = new Date().toISOString();
            dbInstance[id] = { ...data, id, updatedAt: timestamp };
            if (!dbInstance[id].createdAt) {
              dbInstance[id].createdAt = timestamp;
            }
            console.log(`[MockDB Set] Setting doc ID '${id}' in collection '${collectionName}'. New data:`, JSON.parse(JSON.stringify(dbInstance[id])));
            if (saveDbInstance) saveDbInstance();
          },
          update: async (data: any) => {
            const currentId = id; // Use the id established by .doc(docId)
            console.log(`[MockDB Update] Attempting to update doc in collection '${collectionName}' with ID: '${currentId}'`);
            if (dbInstance[currentId]) {
              const existingDocData = dbInstance[currentId];
              console.log(`[MockDB Update] Current data for doc ID '${currentId}':`, JSON.parse(JSON.stringify(existingDocData)));
              console.log(`[MockDB Update] Update payload for doc ID '${currentId}':`, JSON.parse(JSON.stringify(data)));
              
              dbInstance[currentId] = {
                ...existingDocData,
                ...data, // Payload fields overwrite existing fields
                id: currentId, // Ensure the ID within the object remains correct
                updatedAt: new Date().toISOString(), // Always set a new updatedAt timestamp
              };
              
              console.log(`[MockDB Update] Data for doc ID '${currentId}' AFTER update:`, JSON.parse(JSON.stringify(dbInstance[currentId])));
              if (saveDbInstance) saveDbInstance();
            } else {
              console.warn(`[MockDB Update] Document ID '${currentId}' not found in collection '${collectionName}' for update.`);
            }
          },
          delete: async () => {
            delete dbInstance[id];
            if (saveDbInstance) saveDbInstance();
          }
        };
      },
      add: async (data: any) => {
        const id = `${collectionName.slice(0,3)}-${Date.now()}-${Object.keys(dbInstance).length + 1 + Math.random().toString(16).slice(2)}`;
        const timestamp = new Date().toISOString();
        dbInstance[id] = { ...data, id, createdAt: timestamp, updatedAt: timestamp };
        // console.log(`[MockDB Add] Adding to ${collectionName} with new id ${id}. Data:`, JSON.parse(JSON.stringify(dbInstance[id])));
        if (saveDbInstance) saveDbInstance();
        return { id }; 
      },
      where: (field: string, operator: string, value: any) => {
        return createQueryInstance().where(field, operator, value);
      },
      get: async () => { 
        return createQueryInstance().get();
      }
    };
  }
};

// Mock Firebase Storage
const storage = {
  ref: (_storageInstance?: any, path?: string) => ({
    put: async (file: File) => {
      // console.log(`[MockStorage Put] Simulating upload of ${file.name} to path ${path}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        snapshot: {
          ref: {
            getDownloadURL: async () => {
              const newPicUrl = `https://placehold.co/100x100.png?text=NEWPIC_${Date.now().toString().slice(-4)}`;
              // console.log(`[MockStorage GetURL] Simulating getDownloadURL for ${file.name}, returning: ${newPicUrl}`);
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

const app = undefined;

export { app, db, auth, storage };

console.log("[Firebase Setup] Using MOCK Firebase services. Auth state persists in localStorage. Other data (users, jobs, applications, offers) also persists in localStorage.");

