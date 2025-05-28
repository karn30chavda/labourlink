
// This file provides a MOCK Firebase implementation for development.
// It does NOT connect to a real Firebase backend.

import type { UserProfile, Job, Application, UserRole, MockAuthUser } from "@/types";
import { siteConfig } from "@/config/site";

// --- Mock Databases (In-Memory, with localStorage for current user session only) ---

const MOCK_USERS_DB_STORAGE_KEY = 'mockUsersDb'; // For actual user data, not session
const MOCK_CURRENT_USER_STORAGE_KEY = 'currentMockUser'; // For session

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
    createdAt: new Date().toISOString() 
  },
  "mockUID-customer": { 
    uid: "mockUID-customer", 
    name: "Customer User", 
    email: "customer@labourlink.com", 
    role: "customer", 
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString() 
  },
};

let initialMockJobsDb: Record<string, Job> = {
  // Jobs will be empty initially as per user request
};
let initialMockApplicationsDb: Record<string, Application> = {
  // Applications will be empty initially
};

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
      }
    }
  }
  return JSON.parse(JSON.stringify(initialData)); // Return a deep copy of initial data
};

const saveToLocalStorage = <T>(key: string, data: T) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`[MockDB Save] Saved ${key} to localStorage`);
    } catch (e) {
      console.error(`[MockDB Save] Error saving ${key} to localStorage:`, e);
    }
  }
};

let mockUsersDb = loadFromLocalStorage(MOCK_USERS_DB_STORAGE_KEY, initialMockUsersDb);
// Jobs and Applications are in-memory and reset on refresh, as per earlier state
let mockJobsDb: Record<string, Job> = JSON.parse(JSON.stringify(initialMockJobsDb));
let mockApplicationsDb: Record<string, Application> = JSON.parse(JSON.stringify(initialMockApplicationsDb));


const saveMockUsersDb = () => { 
    console.log('[MockDB Save] Saving mockUsersDb to localStorage:', JSON.parse(JSON.stringify(mockUsersDb))); 
    saveToLocalStorage(MOCK_USERS_DB_STORAGE_KEY, mockUsersDb); 
};
// No saveToLocalStorage for jobs and applications for this reverted state


// --- Mock Authentication ---
let currentMockUser: UserProfile | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem(MOCK_CURRENT_USER_STORAGE_KEY);
  if (storedUser) {
    currentMockUser = JSON.parse(storedUser);
  }
}

const mockAuthInternal: any = {
  _listeners: [] as Array<(user: MockAuthUser | null) => void>,
  _notifyAuthStateChange: (user: MockAuthUser | null) => {
    mockAuthInternal._listeners.forEach((listener: (user: MockAuthUser | null) => void) => listener(user));
  },
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void) => {
    console.log("[MockAuth] onAuthStateChanged listener attached. Current mock user:", currentMockUser);
    mockAuthInternal._listeners.push(callback);
    // Initial call
    if (typeof window !== 'undefined') { // Ensure this runs client-side
        const storedUser = localStorage.getItem(MOCK_CURRENT_USER_STORAGE_KEY);
        currentMockUser = storedUser ? JSON.parse(storedUser) : null;
    }
    callback(currentMockUser ? { uid: currentMockUser.uid, email: currentMockUser.email } as MockAuthUser : null);
    
    return () => { // Unsubscribe
      mockAuthInternal._listeners = mockAuthInternal._listeners.filter((l: any) => l !== callback);
      console.log("[MockAuth] onAuthStateChanged listener detached.");
    };
  },
  signInWithEmailAndPassword: (_auth: any, email: string, _pass: string) => {
    console.log("[MockAuth] Attempting signInWithEmailAndPassword for:", email);
    const userEntry = Object.values(mockUsersDb).find(u => u.email === email);
    if (userEntry) {
      currentMockUser = userEntry;
      if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_CURRENT_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
      }
      mockAuthInternal._notifyAuthStateChange({ uid: currentMockUser.uid, email: currentMockUser.email } as MockAuthUser);
      console.log("[MockAuth] signInWithEmailAndPassword successful for:", email);
      return Promise.resolve({ user: { uid: currentMockUser.uid, email: currentMockUser.email } });
    }
    console.warn("[MockAuth] signInWithEmailAndPassword failed for:", email);
    return Promise.reject(new Error("Mock Auth: Invalid email or password."));
  },
  createUserWithEmailAndPassword: (_auth: any, email: string, _pass: string) => {
    console.log("[MockAuth] Attempting createUserWithEmailAndPassword for:", email);
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      console.warn("[MockAuth] createUserWithEmailAndPassword failed, email already in use:", email);
      return Promise.reject(new Error("Mock Auth: Email already in use."));
    }
    const uid = `mockUID-${Date.now()}`;
    const newUserAuthData = { uid, email }; // Name and role set during profile creation
    
    // Note: currentMockUser is set with full UserProfile in AuthContext after profile creation
    console.log("[MockAuth] createUserWithEmailAndPassword (auth part) successful for:", email, "UID:", uid);
    return Promise.resolve({ user: newUserAuthData });
  },
  signOut: (_auth: any) => {
    console.log("[MockAuth] signOut called. Current user:", currentMockUser?.email);
    currentMockUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_CURRENT_USER_STORAGE_KEY);
    }
    mockAuthInternal._notifyAuthStateChange(null);
    console.log("[MockAuth] signOut successful.");
    return Promise.resolve();
  },
};


// --- Mock Firestore Database ---
const mockDbInternal: any = {
  collection: (collectionName: string) => {
    let dbInstance: any;
    let saveDbInstance: (() => void) | null = null; // Only save users for this revert

    if (collectionName === 'users') {
      dbInstance = mockUsersDb;
      saveDbInstance = saveMockUsersDb;
    } else if (collectionName === 'jobs') {
      dbInstance = mockJobsDb;
    } else if (collectionName === 'applications') {
      dbInstance = mockApplicationsDb;
    } else {
      console.warn(`[MockDB] Accessing unknown collection: ${collectionName}`);
      dbInstance = {};
    }

    return {
      doc: (docId?: string) => {
        const id = docId || `${collectionName.slice(0,3)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id,
          get: () => {
            console.log(`[MockDB Get] Getting doc ${id} from ${collectionName}`);
            const docData = dbInstance[id];
            return Promise.resolve({
              exists: () => !!docData,
              data: () => docData ? JSON.parse(JSON.stringify(docData)) : null, // Return copy
              id,
            });
          },
          set: (data: any) => {
            console.log(`[MockDB Set] Setting doc ${id} in ${collectionName} with:`, JSON.parse(JSON.stringify(data)));
            const timestamp = new Date().toISOString();
            dbInstance[id] = { ...data, id, updatedAt: timestamp };
            if (!dbInstance[id].createdAt) {
              dbInstance[id].createdAt = timestamp;
            }
            if (saveDbInstance) saveDbInstance();
            return Promise.resolve();
          },
          update: (data: any) => {
            console.log(`[MockDB Update] Attempting to update ${collectionName}/${id} with data:`, JSON.parse(JSON.stringify(data)));
            if (dbInstance[id]) {
                console.log(`[MockDB Update] ${collectionName} ${id} before:`, JSON.parse(JSON.stringify(dbInstance[id])));
                dbInstance[id] = { ...dbInstance[id], ...data, updatedAt: new Date().toISOString() };
                console.log(`[MockDB Update] ${collectionName} ${id} after:`, JSON.parse(JSON.stringify(dbInstance[id])));
                if (saveDbInstance) saveDbInstance();
            } else {
                console.warn(`[MockDB Update] Document ${id} not found in ${collectionName} for update.`);
            }
            return Promise.resolve();
          },
          delete: () => {
            console.log(`[MockDB Delete] Deleting doc ${id} from ${collectionName}`);
            delete dbInstance[id];
            if (saveDbInstance) saveDbInstance();
            return Promise.resolve();
          }
        };
      },
      add: (data: any) => {
        const id = `${collectionName.slice(0,3)}-${Date.now()}-${Object.keys(dbInstance).length}`;
        const timestamp = new Date().toISOString();
        console.log(`[MockDB Add] Adding to ${collectionName} with new id ${id}:`, JSON.parse(JSON.stringify(data)));
        dbInstance[id] = { ...data, id, createdAt: timestamp, updatedAt: timestamp };
        if (saveDbInstance && collectionName === 'users') saveDbInstance(); // Only persist users for now
        return Promise.resolve({ id });
      },
      where: (field: string, operator: string, value: any) => {
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
                default: return false;
              }
            });
            return Promise.resolve({
              empty: results.length === 0,
              docs: results.map((doc: any) => ({
                id: doc.id,
                data: () => JSON.parse(JSON.stringify(doc)), // Return copy
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
            data: () => JSON.parse(JSON.stringify(doc)), // Return copy
            exists: () => true,
          })),
        });
      },
    };
  },
};

// Mock Firebase Storage
const mockStorageInternal: any = {
  ref: (_storage?: any, path?: string) => ({ // Adjusted to match Firebase v9 signature if needed
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
    child: (childPath: string) => mockStorageInternal.ref(undefined, `${path}/${childPath}`)
  }),
  getDownloadURL: (ref: any) => ref.getDownloadURL(), // Simplified for mock
  uploadBytes: (ref: any, file: File) => ref.put(file), // Simplified for mock
};

// Export the mock instances
export const auth = mockAuthInternal;
export const db = mockDbInternal;
export const storage = mockStorageInternal;

// No Firebase app initialization or config needed for pure mock
export const app = undefined; 

console.log("[Firebase Setup] Using MOCK Firebase services. Data will NOT persist like a real backend beyond user session.");
