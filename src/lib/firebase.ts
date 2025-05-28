
// --- MOCK AUTHENTICATION & FIRESTORE with localStorage persistence ---
import type { UserProfile, Job, MockAuthUser, MockUserCredential, UserRole, Application } from '@/types';
import { siteConfig } from '@/config/site';

// --- localStorage Keys ---
const MOCK_AUTH_USER_STORAGE_KEY = 'mockAuthUser';
const MOCK_USERS_DB_STORAGE_KEY = 'mockUsersDb';
const MOCK_JOBS_DB_STORAGE_KEY = 'mockJobsDb';
const MOCK_APPLICATIONS_DB_STORAGE_KEY = 'mockApplicationsDb';
const MOCK_DB_DELAY = 50; // ms delay for mock async operations

// --- Helper to load from localStorage or use initial ---
const loadFromLocalStorage = <T>(key: string, initialData: T): T => {
  if (typeof window !== 'undefined') {
    try {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        console.log(`[MockDB Load] Loaded ${key} from localStorage.`);
        return JSON.parse(storedData);
      } else {
        console.log(`[MockDB Load] No data for ${key} in localStorage, using initialData. Storing initialData now.`);
        localStorage.setItem(key, JSON.stringify(initialData));
      }
    } catch (e) {
      console.error(`[MockDB Load] Error loading ${key} from localStorage:`, e);
      localStorage.removeItem(key);
    }
  }
  return initialData;
};

// --- Initial Mock Data (Fallbacks if localStorage is empty/invalid) ---
const initialMockUsersDb: { [uid: string]: UserProfile } = {
  "adminUID": {
    uid: 'adminUID', name: 'Admin User', email: 'admin@labourlink.com', role: 'admin',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  "labourUID": {
    uid: 'labourUID', name: 'Labour User', email: 'labour@labourlink.com', role: 'labour',
    roleType: "Plumber", city: 'Mumbai', skills: ['Plumber', 'Electrician'], availability: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    subscription: {
      planId: siteConfig.paymentPlans.labour[0].id,
      planType: siteConfig.paymentPlans.labour[0].interval,
      status: 'active',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  "customerTestUID": {
    uid: 'customerTestUID', name: 'Test Customer', email: 'customer@labourlink.com', role: 'customer',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    subscription: {
      planId: 'free_customer',
      planType: 'free',
      validUntil: null,
      status: 'active',
      jobPostLimit: 5,
      jobPostCount: 0
    }
  },
};

const initialMockJobsDb: { [id: string]: Job } = {};
const initialMockApplicationsDb: { [id: string]: Application } = {};


// --- Load data from localStorage or use initial mocks ---
let mockUsersDb: { [uid: string]: UserProfile } = loadFromLocalStorage(MOCK_USERS_DB_STORAGE_KEY, initialMockUsersDb);
let mockJobsDb: { [id: string]: Job } = loadFromLocalStorage(MOCK_JOBS_DB_STORAGE_KEY, initialMockJobsDb);
let mockApplicationsDb: { [id: string]: Application } = loadFromLocalStorage(MOCK_APPLICATIONS_DB_STORAGE_KEY, initialMockApplicationsDb);


// --- Helper functions to save to localStorage ---
const saveMockUsersDb = () => {
  if (typeof window !== 'undefined') {
    console.log('[MockDB Save] Saving mockUsersDb to localStorage:', JSON.parse(JSON.stringify(mockUsersDb)));
    localStorage.setItem(MOCK_USERS_DB_STORAGE_KEY, JSON.stringify(mockUsersDb));
  }
};
const saveMockJobsDb = () => {
  if (typeof window !== 'undefined') {
    console.log('[MockDB Save] Saving mockJobsDb to localStorage:', JSON.parse(JSON.stringify(mockJobsDb)));
    localStorage.setItem(MOCK_JOBS_DB_STORAGE_KEY, JSON.stringify(mockJobsDb));
  }
};
const saveMockApplicationsDb = () => {
  if (typeof window !== 'undefined') {
    console.log('[MockDB Save] Saving mockApplicationsDb to localStorage:', JSON.parse(JSON.stringify(mockApplicationsDb)));
    localStorage.setItem(MOCK_APPLICATIONS_DB_STORAGE_KEY, JSON.stringify(mockApplicationsDb));
  }
};

// --- Counters for new IDs ---
let jobIdCounter = Object.keys(mockJobsDb).length > 0 ? Math.max(1, ...Object.keys(mockJobsDb).map(k => parseInt(k.replace(/^\D+/g, '') || '0'))) + 1 : 1;
let applicationIdCounter = Object.keys(mockApplicationsDb).length > 0 ? Math.max(1, ...Object.keys(mockApplicationsDb).map(k => parseInt(k.replace(/^\D+/g, '') || '0'))) + 1 : 1;

// --- Mock Auth ---
let currentMockUser: MockAuthUser | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
  if (storedUser) {
    try {
      currentMockUser = JSON.parse(storedUser);
    } catch (e) { console.error("Error parsing stored mock user:", e); localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY); }
  }
}
let authStateListener: ((user: MockAuthUser | null) => void) | null = null;

const auth = {
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void): (() => void) => {
    authStateListener = callback;
    setTimeout(() => {
      if (authStateListener) {
        let userFromStorage: MockAuthUser | null = null;
        if (typeof window !== 'undefined') {
          const storedUserStr = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
          if (storedUserStr) {
            try {
              userFromStorage = JSON.parse(storedUserStr);
            } catch (e) {
              console.error("Error parsing stored user for onAuthStateChanged:", e);
              localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
            }
          }
        }
        currentMockUser = userFromStorage; // Update currentMockUser based on localStorage
        console.log("[MockAuth onAuthStateChanged] Notifying listener with user:", currentMockUser);
        authStateListener(currentMockUser);
      }
    }, MOCK_DB_DELAY);
    return () => { authStateListener = null; };
  },
  signInWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
    console.log("[MockAuth signIn] Attempting login for:", email);
    const foundUser = Object.values(mockUsersDb).find(u => u.email === email);

    if (foundUser && (password === "password" || email === "customer@labourlink.com" || email === "labour@labourlink.com" || email === "admin@labourlink.com")) {
      currentMockUser = { uid: foundUser.uid, email: foundUser.email, displayName: foundUser.name };
      if (typeof window !== 'undefined') localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
      if (authStateListener) authStateListener(currentMockUser);
      console.log("[MockAuth signIn] Login successful for:", email, currentMockUser);
      return { user: currentMockUser };
    }
    console.error("[MockAuth signIn] Login failed for:", email);
    throw new Error("Mock Auth: Invalid credentials. (Hint: Use 'password' for any mock user).");
  },
  createUserWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      console.error("[MockAuth register] Email already in use:", email);
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    currentMockUser = { uid, email, displayName: '' };
    if (typeof window !== 'undefined') localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
    // Note: UserProfile creation and saving to mockUsersDb happens in AuthContext
    if (authStateListener) authStateListener(currentMockUser);
    console.log("[MockAuth register] User created with UID:", uid, "Email:", email);
    return { user: currentMockUser };
  },
  signOut: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
    console.log("[MockAuth signOut] Signing out user:", currentMockUser?.email);
    currentMockUser = null;
    if (typeof window !== 'undefined') localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
    if (authStateListener) authStateListener(null);
  },
  get currentUser(): MockAuthUser | null {
    if (typeof window !== 'undefined') {
      const storedUserStr = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
      if (storedUserStr) {
        try {
          return JSON.parse(storedUserStr);
        } catch (e) {
          console.error("Error parsing currentUser from localStorage:", e);
          localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
          return null;
        }
      }
    }
    return null;
  }
};
// --- End of Mock Auth ---


// --- MOCK FIRESTORE (USERS, JOBS, APPLICATIONS) ---
const db = {
  collection: (collectionName: string) => {
    console.log(`[MockDB] Accessing collection: ${collectionName}`);
    return {
      doc: (docId?: string) => {
        const id = docId || `mockDoc-${collectionName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        console.log(`[MockDB] Accessing doc: ${id} in collection: ${collectionName}`);
        return {
          get: async (): Promise<{ exists: () => boolean; data: () => any | null; id: string }> => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            let dataStore: any;
            if (collectionName === 'users') dataStore = mockUsersDb;
            else if (collectionName === 'jobs') dataStore = mockJobsDb;
            else if (collectionName === 'applications') dataStore = mockApplicationsDb;
            else {
              console.warn(`[MockDB Get Doc] Unknown collection: ${collectionName}`);
              return { exists: () => false, data: () => null, id };
            }

            const docData = dataStore[id];
            if (docData) {
              // console.log(`[MockDB Get Doc] Document found in ${collectionName} for ID ${id}:`, JSON.parse(JSON.stringify(docData)));
              return { exists: () => true, data: () => ({ ...docData }), id };
            }
            // console.log(`[MockDB Get Doc] Document NOT found in ${collectionName} for ID ${id}`);
            return { exists: () => false, data: () => null, id };
          },
          set: async (data: any) => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            const timestamp = new Date().toISOString();
            if (collectionName === 'users') {
              console.log(`[MockDB Set] Setting user ${id}:`, JSON.parse(JSON.stringify(data)));
              mockUsersDb[id] = { ...data, uid: id, createdAt: data.createdAt || timestamp, updatedAt: timestamp } as UserProfile;
              saveMockUsersDb();
            } else if (collectionName === 'jobs') {
              mockJobsDb[id] = { ...data, id, createdAt: data.createdAt || timestamp, updatedAt: timestamp } as Job;
              saveMockJobsDb();
            } else if (collectionName === 'applications') {
              mockApplicationsDb[id] = { ...data, id, dateApplied: data.dateApplied || timestamp, updatedAt: timestamp } as Application;
              saveMockApplicationsDb();
            }
          },
          update: async (data: any) => {
            console.log(`[MockDB Update] Attempting to update ${collectionName} doc ID: ${id} with payload:`, JSON.parse(JSON.stringify(data)));
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            const currentTimestamp = new Date().toISOString();
            if (collectionName === 'users' && mockUsersDb[id]) {
              console.log(`[MockDB Update] User ${id} before:`, JSON.parse(JSON.stringify(mockUsersDb[id])));
              mockUsersDb[id] = { ...mockUsersDb[id], ...data, updatedAt: currentTimestamp };
              console.log(`[MockDB Update] User ${id} after:`, JSON.parse(JSON.stringify(mockUsersDb[id])));
              saveMockUsersDb();
            } else if (collectionName === 'jobs' && mockJobsDb[id]) {
              console.log(`[MockDB Update] Job ${id} before:`, JSON.parse(JSON.stringify(mockJobsDb[id])));
              mockJobsDb[id] = { ...mockJobsDb[id], ...data, updatedAt: currentTimestamp };
              console.log(`[MockDB Update] Job ${id} after:`, JSON.parse(JSON.stringify(mockJobsDb[id])));
              saveMockJobsDb();
            } else if (collectionName === 'applications' && mockApplicationsDb[id]) {
              console.log(`[MockDB Update] Application ${id} before:`, JSON.parse(JSON.stringify(mockApplicationsDb[id])));
              mockApplicationsDb[id] = { ...mockApplicationsDb[id], ...data, updatedAt: currentTimestamp };
              console.log(`[MockDB Update] Application ${id} after:`, JSON.parse(JSON.stringify(mockApplicationsDb[id])));
              saveMockApplicationsDb();
            } else {
              console.warn(`[MockDB Update] Document with ID ${id} not found in ${collectionName} for update.`);
            }
          },
          delete: async () => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            if (collectionName === 'users') { delete mockUsersDb[id]; saveMockUsersDb(); }
            else if (collectionName === 'jobs') {
              if (mockJobsDb[id]) {
                mockJobsDb[id].status = 'deleted';
                mockJobsDb[id].updatedAt = new Date().toISOString();
                saveMockJobsDb();
              }
            }
            else if (collectionName === 'applications') { delete mockApplicationsDb[id]; saveMockApplicationsDb(); }
            console.log(`[MockDB Delete] Deleted/Marked as deleted doc ID ${id} from ${collectionName}`);
          }
        };
      },
      add: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
        let newId = '';
        const timestamp = new Date().toISOString();
        if (collectionName === 'users') {
          newId = data.uid || `mockUID-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          mockUsersDb[newId] = { ...data, uid: newId, createdAt: data.createdAt || timestamp, updatedAt: timestamp } as UserProfile;
          saveMockUsersDb();
        } else if (collectionName === 'jobs') {
          newId = `job-${jobIdCounter++}`;
          mockJobsDb[newId] = { ...data, id: newId, createdAt: data.createdAt || timestamp, updatedAt: timestamp } as Job;
          saveMockJobsDb();
        } else if (collectionName === 'applications') {
          newId = `app-${applicationIdCounter++}`;
          mockApplicationsDb[newId] = { ...data, id: newId, dateApplied: data.dateApplied || timestamp, updatedAt: timestamp } as Application;
          saveMockApplicationsDb();
        }
        console.log(`[MockDB Add] Added to ${collectionName} with new ID ${newId}:`, JSON.parse(JSON.stringify(data)));
        return {
          id: newId,
          get: async () => ({ id: newId, data: () => ({ ...data }), exists: () => true })
        };
      },
      get: async () => { // For collection.get()
        await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
        let storeToSearch: any[];
        if (collectionName === 'users') storeToSearch = Object.values(mockUsersDb);
        else if (collectionName === 'jobs') storeToSearch = Object.values(mockJobsDb);
        else if (collectionName === 'applications') storeToSearch = Object.values(mockApplicationsDb);
        else storeToSearch = [];

        console.log(`[MockDB Get All Docs from Collection] Fetching all from ${collectionName}. Found ${storeToSearch.length} items.`);
        return {
          empty: storeToSearch.length === 0,
          docs: storeToSearch.map(doc => ({
            id: (doc as any).id || (doc as any).uid,
            data: () => ({ ...doc }),
            exists: () => true
          })),
        };
      },
      where: (field: keyof Job | keyof UserProfile | keyof Application, operator: string, value: any) => {
        console.log(`[MockDB Where] Querying ${collectionName} where ${String(field)} ${operator} ${value}`);
        return {
          get: async () => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            let storeToSearch: any[];
            if (collectionName === 'users') storeToSearch = Object.values(mockUsersDb);
            else if (collectionName === 'jobs') storeToSearch = Object.values(mockJobsDb);
            else if (collectionName === 'applications') storeToSearch = Object.values(mockApplicationsDb);
            else storeToSearch = [];

            const results = storeToSearch.filter(doc => {
              const docValue = doc[field as keyof typeof doc];
              if (operator === '==') return docValue === value;
              if (operator === '!=') return docValue !== value;
              if (operator === 'array-contains' && Array.isArray(docValue)) return docValue.includes(value);
              // Add more operators as needed for mock
              return false;
            });
            console.log(`[MockDB Where Get] Found ${results.length} results for query.`);
            return {
              empty: results.length === 0,
              docs: results.map(doc => ({
                id: (doc as any).id || (doc as any).uid,
                data: () => ({ ...doc }),
                exists: () => true
              })),
            };
          } // Closes get method within where's return object
        }; // Closes where's return object
      }  // Closes where method
    };   // Closes object returned by collection()
  }     // Closes collection method
};      // Closes db object

// Mock Firebase Storage (basic version, no actual upload/download)
const storage = {
  ref: (path?: string) => ({
    put: async (file: File) => {
      console.log(`[MockStorage] Simulating upload of ${file.name} to ${path}`);
      await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
      return {
        snapshot: {
          ref: {
            getDownloadURL: async () => {
              await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
              return `https://placehold.co/100x100.png?text=MOCKIMG`;
            }
          }
        }
      };
    },
    getDownloadURL: async () => {
      console.log(`[MockStorage] Simulating getDownloadURL for ${path}`);
      await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
      return `https://placehold.co/100x100.png?text=MOCK`;
    }
  })
};

export { auth, db, storage };
