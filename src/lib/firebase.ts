
// --- MOCK AUTHENTICATION & FIRESTORE with localStorage persistence ---
import type { UserProfile, Job, MockAuthUser, MockUserCredential, UserRole, Application } from '@/types';
import { siteConfig } from '@/config/site';

// --- Start of Mock Auth ---
const MOCK_AUTH_USER_STORAGE_KEY = 'mockAuthUser';
const MOCK_USERS_DB_STORAGE_KEY = 'mockUsersDb';
const MOCK_JOBS_DB_STORAGE_KEY = 'mockJobsDb';
const MOCK_APPLICATIONS_DB_STORAGE_KEY = 'mockApplicationsDb';

// --- Load initial user from localStorage if available ---
let currentMockUser: MockAuthUser | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
  if (storedUser) {
    try {
      currentMockUser = JSON.parse(storedUser);
    } catch (e) {
      console.error("Error parsing stored mock user:", e);
      localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY); // Clear invalid data
    }
  }
}

let authStateListener: ((user: MockAuthUser | null) => void) | null = null;

// --- Initial Mock Data (Fallbacks) ---
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

// --- Function to load from localStorage or use initial ---
const loadFromLocalStorage = <T>(key: string, initialData: T): T => {
  if (typeof window !== 'undefined') {
    try {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (e) {
      console.error(`Error loading ${key} from localStorage:`, e);
      localStorage.removeItem(key); // Clear potentially corrupted data
    }
  }
  return initialData;
};

// --- Load data from localStorage or use initial mocks ---
let mockUsersDb: { [uid: string]: UserProfile } = loadFromLocalStorage(MOCK_USERS_DB_STORAGE_KEY, initialMockUsersDb);
let mockJobsDb: { [id: string]: Job } = loadFromLocalStorage(MOCK_JOBS_DB_STORAGE_KEY, initialMockJobsDb);
let mockApplicationsDb: { [id: string]: Application } = loadFromLocalStorage(MOCK_APPLICATIONS_DB_STORAGE_KEY, initialMockApplicationsDb);


// --- Helper functions to save to localStorage ---
const saveMockUsersDb = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_USERS_DB_STORAGE_KEY, JSON.stringify(mockUsersDb));
  }
};
const saveMockJobsDb = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_JOBS_DB_STORAGE_KEY, JSON.stringify(mockJobsDb));
  }
};
const saveMockApplicationsDb = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_APPLICATIONS_DB_STORAGE_KEY, JSON.stringify(mockApplicationsDb));
  }
};

// Initialize with localStorage data if it wasn't loaded above (e.g. first run after code change)
if (typeof window !== 'undefined') {
    if (!localStorage.getItem(MOCK_USERS_DB_STORAGE_KEY)) saveMockUsersDb();
    if (!localStorage.getItem(MOCK_JOBS_DB_STORAGE_KEY)) saveMockJobsDb();
    if (!localStorage.getItem(MOCK_APPLICATIONS_DB_STORAGE_KEY)) saveMockApplicationsDb();
}


const auth = {
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void): (() => void) => {
    authStateListener = callback;
    setTimeout(() => {
      if (authStateListener) {
        authStateListener(currentMockUser);
      }
    }, 50);
    return () => {
      authStateListener = null;
    };
  },
  signInWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    for (const uid in mockUsersDb) {
      if (mockUsersDb[uid].email === email && (password === "password" || uid === "customerTestUID" || uid === "labourUID" || uid === "adminUID")) {
        currentMockUser = { uid, email, displayName: mockUsersDb[uid].name };
        if (typeof window !== 'undefined') {
          localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
        }
        if (authStateListener) authStateListener(currentMockUser);
        return { user: currentMockUser };
      }
    }
    throw new Error("Mock Auth: Invalid credentials. (Hint: Use 'password' for any mock user).");
  },
  createUserWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}`;
    currentMockUser = { uid, email, displayName: '' };
     if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
    }
    if (authStateListener) authStateListener(currentMockUser);
    return { user: currentMockUser };
  },
  signOut: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 20));
    currentMockUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
    }
    if (authStateListener) authStateListener(null);
  },
  get currentUser(): MockAuthUser | null {
    return currentMockUser;
  }
};
// --- End of Mock Auth ---


// --- MOCK FIRESTORE (USERS, JOBS, APPLICATIONS) ---
let jobIdCounter = Object.keys(mockJobsDb).length > 0 ? Math.max(...Object.keys(mockJobsDb).map(k => parseInt(k.split('-')[1] || '0'))) + 1 : 100;
let applicationIdCounter = Object.keys(mockApplicationsDb).length > 0 ? Math.max(...Object.keys(mockApplicationsDb).map(k => parseInt(k.split('-')[1] || '0'))) + 1 : 100;


const db = {
  collection: (collectionName: string) => ({
    doc: (docId?: string) => {
      const id = docId || `mockDoc-${collectionName}-${Date.now()}`;
      return {
        get: async (): Promise<{ exists: () => boolean; data: () => any; id: string } | { exists: false; data: () => null; id: string }> => {
          await new Promise(resolve => setTimeout(resolve, 10));
          let dataStore: any;
          if (collectionName === 'users') dataStore = mockUsersDb;
          else if (collectionName === 'jobs') dataStore = mockJobsDb;
          else if (collectionName === 'applications') dataStore = mockApplicationsDb;
          else return { exists: () => false, data: () => null, id };

          const docData = dataStore[id];
          if (docData) {
            return { exists: () => true, data: () => ({...docData}), id };
          }
          return { exists: () => false, data: () => null, id };
        },
        set: async (data: any) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          if (collectionName === 'users') {
            mockUsersDb[id] = { ...data, uid: id, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as UserProfile;
            saveMockUsersDb();
          } else if (collectionName === 'jobs') {
            mockJobsDb[id] = { ...data, id, status: data.status || 'open', approvedByAdmin: data.approvedByAdmin !== undefined ? data.approvedByAdmin : true, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as Job;
            saveMockJobsDb();
          } else if (collectionName === 'applications') {
            mockApplicationsDb[id] = { ...data, id, dateApplied: data.dateApplied || new Date().toISOString(), status: data.status || 'Pending', updatedAt: new Date().toISOString() } as Application;
            saveMockApplicationsDb();
          }
        },
        update: async (data: any) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          if (collectionName === 'users' && mockUsersDb[id]) {
            mockUsersDb[id] = { ...mockUsersDb[id], ...data, updatedAt: new Date().toISOString() };
            saveMockUsersDb();
          } else if (collectionName === 'jobs' && mockJobsDb[id]) {
            mockJobsDb[id] = {
              ...mockJobsDb[id],
              ...data, // data from form includes new status, approvedByAdmin, and updatedAt
            };
            saveMockJobsDb();
          } else if (collectionName === 'applications' && mockApplicationsDb[id]) {
            mockApplicationsDb[id] = { ...mockApplicationsDb[id], ...data, updatedAt: new Date().toISOString() };
            saveMockApplicationsDb();
          }
        },
        delete: async () => {
           await new Promise(resolve => setTimeout(resolve, 10));
           if (collectionName === 'users') { delete mockUsersDb[id]; saveMockUsersDb(); }
           else if (collectionName === 'jobs') {
             if (mockJobsDb[id]) {
                mockJobsDb[id].status = 'deleted';
                mockJobsDb[id].updatedAt = new Date().toISOString();
                saveMockJobsDb();
             }
           }
           else if (collectionName === 'applications') { delete mockApplicationsDb[id]; saveMockApplicationsDb(); }
        }
      };
    },
    add: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        let newId = '';
        if (collectionName === 'users') {
            newId = data.uid || `user-${Date.now()}`;
            mockUsersDb[newId] = { ...data, uid: newId, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as UserProfile;
            saveMockUsersDb();
        } else if (collectionName === 'jobs') {
            newId = `job-${jobIdCounter++}`;
            mockJobsDb[newId] = { ...data, id: newId, status: data.status || 'open', approvedByAdmin: data.approvedByAdmin !== undefined ? data.approvedByAdmin : true, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as Job;
            saveMockJobsDb();
        } else if (collectionName === 'applications') {
            newId = `app-${applicationIdCounter++}`;
            mockApplicationsDb[newId] = { ...data, id: newId, dateApplied: data.dateApplied || new Date().toISOString(), status: data.status || 'Pending', updatedAt: new Date().toISOString() } as Application;
            saveMockApplicationsDb();
        }
        return {
            id: newId,
            get: async () => ({ id: newId, data: () => data, exists: () => true })
        };
    },
    get: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        let storeToSearch: any[];
        if (collectionName === 'users') storeToSearch = Object.values(mockUsersDb);
        else if (collectionName === 'jobs') storeToSearch = Object.values(mockJobsDb);
        else if (collectionName === 'applications') storeToSearch = Object.values(mockApplicationsDb);
        else storeToSearch = [];

        return {
            empty: storeToSearch.length === 0,
            docs: storeToSearch.map(doc => ({
            id: (doc as any).id || (doc as any).uid,
            data: () => ({...doc})
            })),
        };
    },
    where: (field: keyof Job | keyof UserProfile | keyof Application, operator: string, value: any) => ({
      where: (field2: keyof Job | keyof UserProfile | keyof Application, operator2: string, value2: any) => ({
         get: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          let storeToSearch: any[];
          if (collectionName === 'jobs') storeToSearch = Object.values(mockJobsDb);
          else if (collectionName === 'users') storeToSearch = Object.values(mockUsersDb);
          else if (collectionName === 'applications') storeToSearch = Object.values(mockApplicationsDb);
          else storeToSearch = [];

          const results = storeToSearch.filter(doc => {
            const docValue = doc[field as keyof typeof doc];
            const docValue2 = doc[field2 as keyof typeof doc];
            let condition1 = false;
            let condition2 = false;

            if (operator === '==') condition1 = docValue === value;
            else if (operator === '!=') condition1 = docValue !== value;
            else if (operator === 'array-contains' && Array.isArray(docValue)) condition1 = docValue.includes(value);


            if (operator2 === '==') condition2 = docValue2 === value2;


            return condition1 && condition2;
          });
          return {
            empty: results.length === 0,
            docs: results.map(doc => ({
              id: (doc as any).id || (doc as any).uid,
              data: () => ({...doc})
            })),
          };
        }
      }),
      get: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        let storeToSearch: any[];
        if (collectionName === 'jobs') storeToSearch = Object.values(mockJobsDb);
        else if (collectionName === 'users') storeToSearch = Object.values(mockUsersDb);
        else if (collectionName === 'applications') storeToSearch = Object.values(mockApplicationsDb);
        else storeToSearch = [];

        const results = storeToSearch.filter(doc => {
          const docValue = doc[field as keyof typeof doc];
          if (operator === '==') return docValue === value;
          if (operator === '!=') return docValue !== value;
          if (operator === 'array-contains' && Array.isArray(docValue)) return docValue.includes(value);

          return false;
        });
        return {
          empty: results.length === 0,
          docs: results.map(doc => ({
            id: (doc as any).id || (doc as any).uid,
            data: () => ({...doc})
          })),
        };
      }
    })
  })
};

// Mock Firebase Storage (basic version)
const storage = {
  ref: (path?: string) => ({
    put: async (file: File) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        snapshot: {
          ref: {
            getDownloadURL: async () => {
              await new Promise(resolve => setTimeout(resolve, 20));
              return `https://placehold.co/100x100.png?text=MOCKIMG`;
            }
          }
        }
      };
    },
    getDownloadURL: async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      return `https://placehold.co/100x100.png?text=MOCK`;
    }
  })
};

console.log("--- Using MOCK Firebase services with localStorage persistence ---");

export { auth, db, storage };


    