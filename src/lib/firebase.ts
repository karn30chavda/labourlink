
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
        console.log(`[MockDB Load] Loaded ${key} from localStorage:`, JSON.parse(storedData));
        return JSON.parse(storedData);
      } else {
        console.log(`[MockDB Load] No data for ${key} in localStorage, using initialData. Storing initialData now.`);
        localStorage.setItem(key, JSON.stringify(initialData));
      }
    } catch (e) {
      console.error(`[MockDB Load] Error loading ${key} from localStorage:`, e);
      localStorage.removeItem(key); // Clear corrupted data
    }
  }
  return initialData;
};

// --- Initial Mock Data (Fallbacks if localStorage is empty/invalid) ---
const initialMockUsersDb: { [uid: string]: UserProfile } = {
  "adminUID": {
    uid: 'adminUID', name: 'Admin User', email: 'admin@labourlink.com', role: 'admin',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), profilePhotoUrl: 'https://placehold.co/100x100.png?text=AU'
  },
  "labourUID": {
    uid: 'labourUID', name: 'Labour User', email: 'labour@labourlink.com', role: 'labour',
    roleType: "Plumber", city: 'Mumbai', skills: ['Plumber', 'Electrician'], availability: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    profilePhotoUrl: 'https://placehold.co/100x100.png?text=LU',
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
    profilePhotoUrl: 'https://placehold.co/100x100.png?text=TC',
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
const getNextId = (prefix: string, dbObject: Record<string, any>): string => {
    const existingIds = Object.keys(dbObject).map(k => parseInt(k.replace(/^\D+/g, '') || '0')).filter(num => !isNaN(num));
    const maxId = existingIds.length > 0 ? Math.max(0, ...existingIds) : 0;
    return `${prefix}-${maxId + 1}`;
};


// --- Mock Auth ---
let currentMockUser: MockAuthUser | null = null;
if (typeof window !== 'undefined') { // Ensure this only runs on the client
  const storedUser = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
  if (storedUser) {
    try {
      currentMockUser = JSON.parse(storedUser);
    } catch (e) {
      console.error("Error parsing stored mock user from localStorage:", e);
      localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY); // Clear corrupted data
    }
  }
}

let authStateListener: ((user: MockAuthUser | null) => void) | null = null;

const auth = {
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void): (() => void) => {
    authStateListener = callback;
    // Immediately notify with the current user state (potentially loaded from localStorage)
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            if (authStateListener) {
                const storedUserStr = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
                let userFromStorage: MockAuthUser | null = null;
                if (storedUserStr) {
                    try { userFromStorage = JSON.parse(storedUserStr); } catch (e) { console.error("Error parsing user for onAuthStateChanged:", e); localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY); }
                }
                currentMockUser = userFromStorage;
                console.log("[MockAuth onAuthStateChanged] Initial notification with user:", currentMockUser);
                authStateListener(currentMockUser);
            }
        }, MOCK_DB_DELAY);
    }
    return () => { authStateListener = null; };
  },
  signInWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
    console.log("[MockAuth signIn] Attempting login for:", email);
    const foundUser = Object.values(mockUsersDb).find(u => u.email === email);

    if (foundUser && (password === "password" || password === "password123" || ["admin@labourlink.com", "labour@labourlink.com", "customer@labourlink.com"].includes(email) )) {
      currentMockUser = { uid: foundUser.uid, email: foundUser.email, displayName: foundUser.name };
      if (typeof window !== 'undefined') localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
      if (authStateListener) authStateListener(currentMockUser);
      console.log("[MockAuth signIn] Login successful for:", email, currentMockUser);
      return { user: currentMockUser };
    }
    console.error("[MockAuth signIn] Login failed for:", email);
    throw new Error("Mock Auth: Invalid credentials. (Hint: Use 'password' or 'password123').");
  },
  createUserWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      console.error("[MockAuth register] Email already in use:", email);
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    currentMockUser = { uid, email, displayName: '' }; // DisplayName will be set by AuthContext from form
    if (typeof window !== 'undefined') localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
    if (authStateListener) authStateListener(currentMockUser);
    console.log("[MockAuth register] User stub created in auth service with UID:", uid, "Email:", email);
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
        try { return JSON.parse(storedUserStr); } catch (e) { console.error("Error parsing currentUser from localStorage:", e); localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY); return null; }
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
    const getStore = () => {
        if (collectionName === 'users') return mockUsersDb;
        if (collectionName === 'jobs') return mockJobsDb;
        if (collectionName === 'applications') return mockApplicationsDb;
        console.warn(`[MockDB] Unknown collection store for: ${collectionName}`);
        return {} as any;
    };
    const saveStore = () => {
        if (collectionName === 'users') saveMockUsersDb();
        else if (collectionName === 'jobs') saveMockJobsDb();
        else if (collectionName === 'applications') saveMockApplicationsDb();
    };

    return {
      doc: (docId?: string) => {
        const id = docId || getNextId(collectionName.slice(0, -1), getStore());
        console.log(`[MockDB] Accessing doc: ${id} in collection: ${collectionName}`);
        return {
          get: async (): Promise<{ exists: () => boolean; data: () => any | null; id: string }> => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            const dataStore = getStore();
            const docData = dataStore[id];
            if (docData) {
              return { exists: () => true, data: () => ({ ...docData }), id };
            }
            return { exists: () => false, data: () => null, id };
          },
          set: async (data: any) => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            const dataStore = getStore();
            const timestamp = new Date().toISOString();
            dataStore[id] = { ...data, id, uid: id, createdAt: data.createdAt || timestamp, updatedAt: timestamp };
            console.log(`[MockDB Set] Setting ${collectionName} doc ${id}:`, JSON.parse(JSON.stringify(dataStore[id])));
            saveStore();
          },
          update: async (data: any) => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            const dataStore = getStore();
            if (dataStore[id]) {
              console.log(`[MockDB Update] Doc ${id} in ${collectionName} before:`, JSON.parse(JSON.stringify(dataStore[id])));
              dataStore[id] = { ...dataStore[id], ...data, updatedAt: new Date().toISOString() };
              console.log(`[MockDB Update] Doc ${id} in ${collectionName} after:`, JSON.parse(JSON.stringify(dataStore[id])));
              saveStore();
            } else {
              console.warn(`[MockDB Update] Document with ID ${id} not found in ${collectionName} for update.`);
            }
          },
          delete: async () => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            const dataStore = getStore();
            if (collectionName === 'jobs' && dataStore[id]) {
                dataStore[id].status = 'deleted'; // Soft delete for jobs
                dataStore[id].updatedAt = new Date().toISOString();
            } else {
                delete dataStore[id];
            }
            console.log(`[MockDB Delete] Deleted/Marked doc ID ${id} from ${collectionName}`);
            saveStore();
          }
        };
      },
      add: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
        const dataStore = getStore();
        const newId = getNextId(collectionName.slice(0, -1), dataStore);
        const timestamp = new Date().toISOString();
        dataStore[newId] = { ...data, id: newId, uid: (collectionName === 'users' ? newId : data.uid), createdAt: data.createdAt || timestamp, updatedAt: timestamp };
        console.log(`[MockDB Add] Added to ${collectionName} with new ID ${newId}:`, JSON.parse(JSON.stringify(dataStore[newId])));
        saveStore();
        return {
          id: newId,
          get: async () => ({ id: newId, data: () => ({ ...dataStore[newId] }), exists: () => true })
        };
      },
      get: async () => { // For collection.get() to fetch all
        await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
        const dataStore = getStore();
        const storeToSearch = Object.values(dataStore);
        console.log(`[MockDB Get All Docs from Collection] Fetching all from ${collectionName}. Found ${storeToSearch.length} items.`);
        return {
          empty: storeToSearch.length === 0,
          docs: storeToSearch.map((doc: any) => ({
            id: doc.id || doc.uid,
            data: () => ({ ...doc }),
            exists: () => true
          })),
        };
      },
      where: (field: string, operator: string, value: any) => {
        console.log(`[MockDB Where] Querying ${collectionName} where ${String(field)} ${operator} ${String(value)}`);
        return {
          get: async () => {
            await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
            const dataStore = getStore();
            const storeToSearch = Object.values(dataStore);

            const results = storeToSearch.filter((doc: any) => {
              const docValue = doc[field as keyof typeof doc];
              if (operator === '==') return docValue === value;
              if (operator === '!=') return docValue !== value;
              if (operator === 'array-contains' && Array.isArray(docValue)) return docValue.includes(value);
              return false;
            });
            console.log(`[MockDB Where Get] Found ${results.length} results for query.`);
            return {
              empty: results.length === 0,
              docs: results.map((doc: any) => ({
                id: doc.id || doc.uid,
                data: () => ({ ...doc }),
                exists: () => true
              })),
            };
          }
        };
      }
    };
  }
};


// Mock Firebase Storage (basic version, no actual upload/download)
const storage = {
  ref: (path?: string) => ({
    put: async (file: File | Blob) => { // Accept File or Blob for mock
      console.log(`[MockStorage] Simulating upload of a file to ${path}`);
      await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY * 5)); // Longer delay for "upload"
      // In a real scenario, 'file.name' would be used. For mock, we just return a placeholder.
      const mockFileName = file instanceof File ? file.name : 'uploaded_file';
      const mockDownloadURL = `https://placehold.co/100x100.png?text=${encodeURIComponent(mockFileName.substring(0,5))}`;
      return {
        snapshot: {
          ref: {
            getDownloadURL: async () => {
              await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
              console.log(`[MockStorage] getDownloadURL returning: ${mockDownloadURL}`);
              return mockDownloadURL;
            }
          }
        }
      };
    },
    getDownloadURL: async () => {
      console.log(`[MockStorage] Simulating getDownloadURL for ${path}`);
      await new Promise(resolve => setTimeout(resolve, MOCK_DB_DELAY));
      return `https://placehold.co/100x100.png?text=MOCKURL`;
    }
  })
};

export { auth, db, storage };

