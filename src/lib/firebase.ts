
// --- MOCK AUTHENTICATION ---
import type { UserProfile, Job, MockAuthUser, MockUserCredential, UserRole, Application } from '@/types';
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
  "customerUID": { // This was the original customer account
    uid: 'customerUID', name: 'Original Customer', email: 'customer.original@labourlink.com', role: 'customer',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    subscription: {
      planId: 'free_customer',
      planType: 'free',
      validUntil: null,
      status: 'active',
      jobPostLimit: 3,
      jobPostCount: 0
    }
  },
  "customerTestUID": { // New dummy customer account
    uid: 'customerTestUID', name: 'Test Customer', email: 'customer@labourlink.com', role: 'customer',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    subscription: {
      planId: 'free_customer',
      planType: 'free',
      validUntil: null,
      status: 'active',
      jobPostLimit: 5, // Giving them a few posts for testing
      jobPostCount: 0
    }
  },
};

const auth = {
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void): (() => void) => {
    authStateListener = callback;
    // Simulate async loading of initial auth state
    setTimeout(() => {
      let userFromStorage: MockAuthUser | null = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_AUTH_USER_STORAGE_KEY);
        if (stored) {
          try {
            userFromStorage = JSON.parse(stored);
          } catch (e) {
            localStorage.removeItem(MOCK_AUTH_USER_STORAGE_KEY);
          }
        }
      }
      currentMockUser = userFromStorage;
      if (authStateListener) {
        authStateListener(currentMockUser);
      }
    }, 50); 
    return () => {
      authStateListener = null;
    };
  },
  signInWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    for (const uid in mockUsersDb) {
      if (mockUsersDb[uid].email === email && password === "password") { 
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
    await new Promise(resolve => setTimeout(resolve, 50));
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}`;
    // Note: name and role will be set by the calling function (AuthContext register)
    currentMockUser = { uid, email, displayName: '' }; 
     if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
    }
    if (authStateListener) authStateListener(currentMockUser);
    return { user: currentMockUser };
  },
  signOut: async (): Promise<void> => {
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

// --- MOCK FIRESTORE (USERS, JOBS, APPLICATIONS) ---
let mockJobsDb: { [id: string]: Job } = {
  'job1': { id: 'job1', title: 'Urgent Plumbing for New Condo', customerId: 'customerTestUID', customerName: 'Test Customer', description: 'Fix leaky pipes and install new sink in a newly constructed condominium. Requires experience with PEX and copper piping. All materials will be provided on site. Work to be completed within 2 days.', requiredSkill: 'Plumber', location: 'MockCity', duration: '2 days', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(), budget: '₹5,000 - ₹8,000' },
  'job2': { id: 'job2', title: 'Electrical Wiring for Retail Outlet', customerId: 'customerUID2', customerName: 'Fashion Forward Inc.', description: 'Complete electrical wiring, fixture installation, and panel setup for a new retail store. Must adhere to commercial electrical codes. Blueprints available.', requiredSkill: 'Electrician', location: 'AnotherCity', duration: '5 days', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), budget: '₹15,000' },
  'jobCust1': { id: 'jobCust1', title: 'Garden Wall Construction - Phase 1', customerId: 'customerTestUID', customerName: 'Test Customer', description: 'Build a 20-meter long, 1.5-meter high brick garden wall. Foundation is already prepared. Masonry skills and attention to detail are key.', requiredSkill: 'Mason', location: 'MockCity', duration: '1 week', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), budget: '₹20,000 - ₹25,000' },
  'jobCust2': { id: 'jobCust2', title: 'Interior Painting (2 Rooms)', customerId: 'customerTestUID', customerName: 'Test Customer', description: 'Interior painting for a living room and bedroom, approximately 500 sq ft total. Walls and ceilings. Customer will provide paint.', requiredSkill: 'Painter', location: 'MockCity', duration: '3 days', status: 'open', approvedByAdmin: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), budget: 'Negotiable' },
};
let jobIdCounter = Object.keys(mockJobsDb).length + 10; 

let mockApplicationsDb: { [id: string]: Application } = {
  'app1': { id: 'app1', labourId: 'labourUID', labourName: 'Labour User', jobId: 'jobCust1', jobTitle: 'Garden Wall Construction - Phase 1', customerId: 'customerTestUID', customerName: 'Test Customer', status: 'Pending', dateApplied: new Date(Date.now() - 86400000 * 1).toISOString(), jobRequiredSkill: 'Mason', jobLocation: 'MockCity' },
};
let applicationIdCounter = Object.keys(mockApplicationsDb).length + 1;


const db = {
  collection: (collectionName: string) => ({
    doc: (docId?: string) => {
      const id = docId || `mockDoc-${collectionName}-${Date.now()}`;
      return {
        get: async (): Promise<{ exists: () => boolean; data: () => any; id: string } | { exists: false; data: () => null; id: string }> => {
          await new Promise(resolve => setTimeout(resolve, 20)); // Reduced delay
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
          await new Promise(resolve => setTimeout(resolve, 20));
          if (collectionName === 'users') {
            mockUsersDb[id] = { ...data, uid: id, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as UserProfile;
          } else if (collectionName === 'jobs') {
            mockJobsDb[id] = { ...data, id, status: 'open', approvedByAdmin: true, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as Job;
          } else if (collectionName === 'applications') {
            mockApplicationsDb[id] = { ...data, id, dateApplied: data.dateApplied || new Date().toISOString() } as Application;
          }
        },
        update: async (data: any) => {
          await new Promise(resolve => setTimeout(resolve, 20));
          if (collectionName === 'users' && mockUsersDb[id]) {
            mockUsersDb[id] = { ...mockUsersDb[id], ...data, updatedAt: new Date().toISOString() };
          } else if (collectionName === 'jobs' && mockJobsDb[id]) {
            mockJobsDb[id] = { ...mockJobsDb[id], ...data, status: data.status || 'open', approvedByAdmin: data.approvedByAdmin !== undefined ? data.approvedByAdmin : true, updatedAt: new Date().toISOString() };
          } else if (collectionName === 'applications' && mockApplicationsDb[id]) {
            mockApplicationsDb[id] = { ...mockApplicationsDb[id], ...data, updatedAt: new Date().toISOString() };
          } else {
            console.warn(`Mock DB: Document ${collectionName}/${id} not found for update.`);
          }
        },
         add: async (data: any) => {
          await new Promise(resolve => setTimeout(resolve, 20));
          let newId = '';
          if (collectionName === 'users') {
            newId = data.uid || `user-${Date.now()}`; // Use provided uid if available (e.g. from auth)
            mockUsersDb[newId] = { ...data, uid: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as UserProfile;
          } else if (collectionName === 'jobs') {
            newId = `job${jobIdCounter++}`;
            mockJobsDb[newId] = { ...data, id: newId, status: 'open', approvedByAdmin: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Job;
          } else if (collectionName === 'applications') {
            newId = `app${applicationIdCounter++}`;
            mockApplicationsDb[newId] = { ...data, id: newId, dateApplied: new Date().toISOString() } as Application;
          }
          return { id: newId };
        },
        delete: async () => { // For jobs, this should be a soft delete (update status)
           await new Promise(resolve => setTimeout(resolve, 20));
           if (collectionName === 'users') delete mockUsersDb[id];
           else if (collectionName === 'jobs') {
             if (mockJobsDb[id]) {
                mockJobsDb[id].status = 'deleted'; // Soft delete
                mockJobsDb[id].updatedAt = new Date().toISOString();
             }
           }
           else if (collectionName === 'applications') delete mockApplicationsDb[id];
        }
      };
    },
    // @ts-ignore
    where: (field: keyof Job | keyof UserProfile | keyof Application, operator: string, value: any) => ({
      where: (field2: keyof Application, operator2: string, value2: any) => ({
         get: async () => {
          await new Promise(resolve => setTimeout(resolve, 20));
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
        await new Promise(resolve => setTimeout(resolve, 20));
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
            id: (doc as any).id || (doc as any).uid, // Use id or uid
            data: () => ({...doc})
          })),
        };
      }
    })
  })
};

const storage = {
  ref: (path?: string) => ({
    put: async () => ({ snapshot: { ref: { getDownloadURL: async () => `https://placehold.co/100x100.png?text=MOCK`}}}),
    getDownloadURL: async () => `https://placehold.co/100x100.png?text=MOCK`
  })
};

export { auth, db, storage };
