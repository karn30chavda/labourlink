
// --- MOCK AUTHENTICATION ---
import type { UserProfile, Job, MockAuthUser, MockUserCredential, UserRole } from '@/types';
import { siteConfig } from '@/config/site';

const MOCK_AUTH_USER_STORAGE_KEY = 'mockAuthUser';

// Attempt to load user from localStorage on initial load
let initialUser: MockAuthUser | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
  if (storedUser) {
    try {
      initialUser = JSON.parse(storedUser);
    } catch (e) {
      console.error("Error parsing stored mock user:", e);
      localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
    }
  }
}

let currentMockUser: MockAuthUser | null = initialUser;
let authStateListener: ((user: MockAuthUser | null) => void) | null = null;

// Simple in-memory store for user profiles - this still resets on refresh but auth state will persist
const mockUsersDb: { [uid: string]: UserProfile } = {
  "adminUID": {
    uid: 'adminUID', name: 'Admin User', email: 'admin@labourlink.com', role: 'admin',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  "labourUID": {
    uid: 'labourUID', name: 'Labour User', email: 'labour@labourlink.com', role: 'labour',
    roleType: "Plumber", city: 'MockCity', skills: ['Plumber', 'Electrical'], availability: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    subscription: {
      planId: siteConfig.paymentPlans.labour[0].id,
      planType: siteConfig.paymentPlans.labour[0].interval,
      status: 'active',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  "customerUID": {
    uid: 'customerUID', name: 'Customer User', email: 'customer@labourlink.com', role: 'customer',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    subscription: {
      planId: 'free_customer',
      planType: 'free',
      validUntil: null,
      status: 'active',
      jobPostLimit: 1,
      jobPostCount: 0
    }
  },
};

const auth = {
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void): (() => void) => {
    authStateListener = callback;
    // Simulate async behavior for initial check, now respecting localStorage
    setTimeout(() => {
      if (authStateListener) {
        authStateListener(currentMockUser);
      }
    }, 0);
    return () => {
      authStateListener = null;
    };
  },
  signInWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    console.log("Mock Sign In Attempt:", email);
    await new Promise(resolve => setTimeout(resolve, 50));
    for (const uid in mockUsersDb) {
      if (mockUsersDb[uid].email === email && password === "password") { // Simple password check
        currentMockUser = { uid, email, displayName: mockUsersDb[uid].name };
        if (typeof window !== 'undefined') {
          localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
        }
        if (authStateListener) authStateListener(currentMockUser);
        return { user: currentMockUser };
      }
    }
    throw new Error("Mock Auth: Invalid credentials.");
  },
  createUserWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    console.log("Mock Register Attempt:", email);
    await new Promise(resolve => setTimeout(resolve, 50));
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}`;
    currentMockUser = { uid, email, displayName: '' }; // Name will be set by AuthContext
     if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
    }
    if (authStateListener) authStateListener(currentMockUser);
    return { user: currentMockUser };
  },
  signOut: async (): Promise<void> => {
    console.log("Mock Sign Out");
    await new Promise(resolve => setTimeout(resolve, 50));
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

// --- MOCK FIRESTORE (USERS and JOBS) ---
// This data will still reset on refresh, but user auth state will persist.
// For full data persistence in mock, localStorage would be needed here too.
let mockJobsDb: { [id: string]: Job } = {
  'job1': { id: 'job1', title: 'Plumbing Work (Open)', customerId: 'customerUID', customerName: 'Customer User', description: 'Fix leaky pipes and install new sink.', requiredSkill: 'Plumbing', location: 'MockCity', duration: '2 days', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  'job2': { id: 'job2', title: 'Electrical Wiring for New Office', customerId: 'customerUID2', customerName: 'Tech Solutions Ltd.', description: 'Complete electrical wiring for a new office space.', requiredSkill: 'Electrical', location: 'AnotherCity', duration: '5 days', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  'jobCust1': { id: 'jobCust1', title: 'Customer Job 1 (Open)', customerId: 'customerUID', customerName: 'Customer User', description: 'Garden wall construction needed.', requiredSkill: 'Mason', location: 'MockCity', duration: '1 week', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  'jobCust2': { id: 'jobCust2', title: 'Customer Job 2 (Pending)', customerId: 'customerUID', customerName: 'Customer User', description: 'Interior painting for 2 rooms.', requiredSkill: 'Painter', location: 'MockCity', duration: '3 days', status: 'pending_approval', approvedByAdmin: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
};
let jobIdCounter = Object.keys(mockJobsDb).length + 1;

const db = {
  collection: (collectionName: string) => ({
    doc: (docId?: string) => {
      const id = docId || `mockDoc-${Date.now()}`;
      return {
        get: async (): Promise<{ exists: () => boolean; data: () => any; id: string }> => {
          await new Promise(resolve => setTimeout(resolve, 50));
          let dataStore = collectionName === 'users' ? mockUsersDb : mockJobsDb;
          const docData = (dataStore as any)[id];
          // If fetching users and user doesn't exist in mockUsersDb, try to add from auth if currentMockUser matches
          if (collectionName === 'users' && !docData && currentMockUser && currentMockUser.uid === id) {
             // This case is more for when AuthContext tries to fetch user data after rehydrating from localStorage
             if (!mockUsersDb[id] && currentMockUser.email) { // Ensure we don't overwrite if it was populated by register
                console.warn(`Mock DB: User ${id} not in mockUsersDb, creating a shell from auth state.`);
                // This is a simplified shell; ideally, role and other details would also be persisted or defaulted
                mockUsersDb[id] = {
                    uid: id,
                    email: currentMockUser.email,
                    name: currentMockUser.displayName || 'User from Storage',
                    role: 'labour', // Default role, could be more sophisticated
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                return { exists: () => true, data: () => ({...mockUsersDb[id]}), id };
             }
          }
          if (docData) {
            return { exists: () => true, data: () => ({...docData}), id };
          }
          return { exists: () => false, data: () => null as any, id };
        },
        set: async (data: any) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          if (collectionName === 'users') {
            mockUsersDb[id] = { ...data, uid: id } as UserProfile;
          } else if (collectionName === 'jobs') {
            mockJobsDb[id] = { ...data, id } as Job;
          }
        },
        update: async (data: any) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          if (collectionName === 'users' && mockUsersDb[id]) {
            mockUsersDb[id] = { ...mockUsersDb[id], ...data, updatedAt: new Date().toISOString() };
          } else if (collectionName === 'jobs' && mockJobsDb[id]) {
            mockJobsDb[id] = { ...mockJobsDb[id], ...data, updatedAt: new Date().toISOString() };
          } else {
            console.warn(`Mock DB: Document ${collectionName}/${id} not found for update.`);
          }
        },
        delete: async () => {
           await new Promise(resolve => setTimeout(resolve, 50));
           if (collectionName === 'users') {
            delete mockUsersDb[id];
          } else if (collectionName === 'jobs') {
            delete mockJobsDb[id];
          }
        }
      };
    },
    add: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      const newId = collectionName === 'jobs' ? `job${jobIdCounter++}` : `user-${Date.now()}`;
      if (collectionName === 'users') {
        mockUsersDb[newId] = { ...data, uid: newId, createdAt: new Date().toISOString() } as UserProfile;
      } else if (collectionName === 'jobs') {
        mockJobsDb[newId] = { ...data, id: newId, createdAt: new Date().toISOString() } as Job;
      }
      return { id: newId };
    },
    // @ts-ignore
    where: (field: keyof Job | keyof UserProfile, operator: string, value: any) => ({
      get: async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        let storeToSearch = collectionName === 'jobs' ? Object.values(mockJobsDb) : Object.values(mockUsersDb);

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

// --- MOCK STORAGE ---
const storage = {
  ref: (path?: string) => ({
    put: async () => ({ snapshot: { ref: { getDownloadURL: async () => `https://placehold.co/100x100.png?text=MOCK`}}}),
    getDownloadURL: async () => `https://placehold.co/100x100.png?text=MOCK`
  })
};

export { auth, db, storage };
