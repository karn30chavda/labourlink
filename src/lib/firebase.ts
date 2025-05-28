
// --- MOCK AUTHENTICATION & FIRESTORE with localStorage persistence ---
import type { UserProfile, Job, MockAuthUser, MockUserCredential, UserRole, Application } from '@/types';
import { siteConfig } from '@/config/site';

// --- Start of Mock Auth ---
const MOCK_AUTH_USER_STORAGE_KEY = 'mockAuthUser';
const MOCK_USERS_DB_STORAGE_KEY = 'mockUsersDb';
const MOCK_JOBS_DB_STORAGE_KEY = 'mockJobsDb';
const MOCK_APPLICATIONS_DB_STORAGE_KEY = 'mockApplicationsDb';


let currentMockUser: MockAuthUser | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
  if (storedUser) {
    try {
      currentMockUser = JSON.parse(storedUser);
    } catch (e) {
      console.error("Error parsing stored mock user:", e);
      localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
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
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Valid for 30 days
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
      jobPostLimit: 5, // Example limit
      jobPostCount: 0
    }
  },
};

const initialMockJobsDb: { [id: string]: Job } = {}; // Cleared initial jobs

const initialMockApplicationsDb: { [id: string]: Application } = {}; // Cleared initial applications


// --- Load data from localStorage or use initial mocks ---
let mockUsersDb: { [uid: string]: UserProfile } = { ...initialMockUsersDb };
let mockJobsDb: { [id: string]: Job } = { ...initialMockJobsDb };
let mockApplicationsDb: { [id: string]: Application } = { ...initialMockApplicationsDb };


if (typeof window !== 'undefined') {
  try {
    const storedUsers = localStorage.getItem(MOCK_USERS_DB_STORAGE_KEY);
    if (storedUsers) mockUsersDb = JSON.parse(storedUsers);
    else localStorage.setItem(MOCK_USERS_DB_STORAGE_KEY, JSON.stringify(mockUsersDb)); // Initialize if not present
  } catch (e) { console.error("Error accessing mockUsersDb from localStorage", e); }

  try {
    const storedJobs = localStorage.getItem(MOCK_JOBS_DB_STORAGE_KEY);
    if (storedJobs) mockJobsDb = JSON.parse(storedJobs);
    else localStorage.setItem(MOCK_JOBS_DB_STORAGE_KEY, JSON.stringify(mockJobsDb)); // Initialize
  } catch (e) { console.error("Error accessing mockJobsDb from localStorage", e); }

  try {
    const storedApplications = localStorage.getItem(MOCK_APPLICATIONS_DB_STORAGE_KEY);
    if (storedApplications) mockApplicationsDb = JSON.parse(storedApplications);
    else localStorage.setItem(MOCK_APPLICATIONS_DB_STORAGE_KEY, JSON.stringify(mockApplicationsDb)); // Initialize
  } catch (e) { console.error("Error accessing mockApplicationsDb from localStorage", e); }
}

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


const auth = {
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void): (() => void) => {
    authStateListener = callback;
    // Simulate async nature and loading from localStorage
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
        if (storedUser) {
          try {
            currentMockUser = JSON.parse(storedUser);
          } catch (e) {
            localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
            currentMockUser = null;
          }
        } else {
          currentMockUser = null;
        }
      }
      if (authStateListener) {
        authStateListener(currentMockUser);
      }
    }, 50);
    return () => {
      authStateListener = null;
    };
  },
  signInWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate async
    for (const uid in mockUsersDb) {
      // For mock purposes, any password is 'password' or matches a hardcoded one if needed for specific tests
      if (mockUsersDb[uid].email === email && (password === "password" || mockUsersDb[uid].uid === "customerTestUID" || mockUsersDb[uid].uid === "labourUID" || mockUsersDb[uid].uid === "adminUID")) { // Simplified password check
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
    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate async
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}`;
    currentMockUser = { uid, email, displayName: '' }; // DisplayName will be set from profile
     if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
    }
    // Note: User profile creation is now handled in AuthContext after this returns
    if (authStateListener) authStateListener(currentMockUser);
    return { user: currentMockUser };
  },
  signOut: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate async
    currentMockUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
    }
    if (authStateListener) authStateListener(null);
  },
  get currentUser(): MockAuthUser | null {
    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
        if (storedUser) {
          try {
            return JSON.parse(storedUser);
          } catch (e) { return null; }
        }
    }
    return currentMockUser; // Fallback if localStorage is not available or empty
  }
};
// --- End of Mock Auth ---


// --- MOCK FIRESTORE (USERS, JOBS, APPLICATIONS) ---
let jobIdCounter = Object.keys(mockJobsDb).length + 100; // Ensure unique IDs even if localStorage starts empty
let applicationIdCounter = Object.keys(mockApplicationsDb).length + 100;


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
             // Ensure new jobs posted by customers are set to 'open' and 'approvedByAdmin: true' for mock purposes
            mockJobsDb[id] = { ...data, id, status: 'open', approvedByAdmin: true, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as Job;
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
             // When a job is updated, assume it needs re-approval for mock
            mockJobsDb[id] = {
              ...mockJobsDb[id],
              ...data,
              status: 'pending_approval', 
              approvedByAdmin: false,      
              updatedAt: new Date().toISOString()
            };
            saveMockJobsDb();
          } else if (collectionName === 'applications' && mockApplicationsDb[id]) {
            mockApplicationsDb[id] = { ...mockApplicationsDb[id], ...data, updatedAt: new Date().toISOString() };
            saveMockApplicationsDb();
          }
        },
        delete: async () => { // This is a hard delete for mock, Firestore usually means soft delete
           await new Promise(resolve => setTimeout(resolve, 10));
           if (collectionName === 'users') { delete mockUsersDb[id]; saveMockUsersDb(); }
           else if (collectionName === 'jobs') { // Soft delete for jobs for UI consistency
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
    add: async (data: any) => { // Add method at collection level
        await new Promise(resolve => setTimeout(resolve, 10));
        let newId = '';
        if (collectionName === 'users') {
            newId = data.uid || `user-${Date.now()}`; // Use provided uid if exists (from auth)
            mockUsersDb[newId] = { ...data, uid: newId, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as UserProfile;
            saveMockUsersDb();
        } else if (collectionName === 'jobs') {
            newId = `job-${jobIdCounter++}`;
            // Ensure new jobs posted by customers are set to 'open' and 'approvedByAdmin: true' for mock purposes
            mockJobsDb[newId] = { ...data, id: newId, status: 'open', approvedByAdmin: true, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as Job;
            saveMockJobsDb();
        } else if (collectionName === 'applications') {
            newId = `app-${applicationIdCounter++}`;
            mockApplicationsDb[newId] = { ...data, id: newId, dateApplied: data.dateApplied || new Date().toISOString(), status: data.status || 'Pending', updatedAt: new Date().toISOString() } as Application;
            saveMockApplicationsDb();
        }
        // Return a mock DocumentReference-like object
        return {
            id: newId,
            get: async () => ({ id: newId, data: () => data, exists: () => true })
        };
    },
    get: async () => { // Added .get() at the collection level
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
    // @ts-ignore // Keep ts-ignore if complex type for 'field' is hard to specify for all cases
    where: (field: keyof Job | keyof UserProfile | keyof Application, operator: string, value: any) => ({
      // Support for chaining another where (simple case)
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
            // Add more operators as needed for mock

            if (operator2 === '==') condition2 = docValue2 === value2;
            // Add more operators for second condition

            return condition1 && condition2;
          });
          return {
            empty: results.length === 0,
            docs: results.map(doc => ({
              id: (doc as any).id || (doc as any).uid, // Handle both job 'id' and user 'uid'
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
          // Add more operators as needed for mock
          return false;
        });
        return {
          empty: results.length === 0,
          docs: results.map(doc => ({
            id: (doc as any).id || (doc as any).uid, // Handle both job 'id' and user 'uid'
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
    put: async (file: File) => { // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 50));
      // In a real scenario, you'd upload the file and get a URL
      return {
        snapshot: {
          ref: {
            getDownloadURL: async () => {
              await new Promise(resolve => setTimeout(resolve, 20));
              // Return a placeholder image URL
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
