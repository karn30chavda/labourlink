
// --- MOCK AUTHENTICATION & FIRESTORE ---
import type { UserProfile, Job, MockAuthUser, MockUserCredential, UserRole, Application } from '@/types';
import { siteConfig } from '@/config/site';

// --- Start of Mock Auth ---
const MOCK_AUTH_USER_STORAGE_KEY = 'mockAuthUser';

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

const mockUsersDb: { [uid: string]: UserProfile } = {
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

const auth = {
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void): (() => void) => {
    authStateListener = callback;
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
    }, 50); // Simulate async nature
    return () => {
      authStateListener = null;
    };
  },
  signInWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    console.log("Mock signInWithEmailAndPassword attempt:", email);
    await new Promise(resolve => setTimeout(resolve, 50));
    for (const uid in mockUsersDb) {
      if (mockUsersDb[uid].email === email && password === "password") {
        currentMockUser = { uid, email, displayName: mockUsersDb[uid].name };
        if (typeof window !== 'undefined') {
          localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
        }
        if (authStateListener) authStateListener(currentMockUser);
        console.log("Mock signInWithEmailAndPassword success:", currentMockUser);
        return { user: currentMockUser };
      }
    }
    console.log("Mock signInWithEmailAndPassword failed for:", email);
    throw new Error("Mock Auth: Invalid credentials. (Hint: Use 'password' for any mock user).");
  },
  createUserWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    console.log("Mock createUserWithEmailAndPassword attempt:", email);
    await new Promise(resolve => setTimeout(resolve, 50));
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      console.log("Mock createUserWithEmailAndPassword failed, email exists:", email);
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}`;
    currentMockUser = { uid, email, displayName: '' }; // displayName will be set by caller context
     if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_AUTH_USER_STORAGE_KEY, JSON.stringify(currentMockUser));
    }
    // The actual user profile is created in AuthContext after this call
    if (authStateListener) authStateListener(currentMockUser);
    console.log("Mock createUserWithEmailAndPassword success:", currentMockUser);
    return { user: currentMockUser };
  },
  signOut: async (): Promise<void> => {
    console.log("Mock signOut called");
    await new Promise(resolve => setTimeout(resolve, 50));
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
    return currentMockUser;
  }
};
// --- End of Mock Auth ---


// --- MOCK FIRESTORE (USERS, JOBS, APPLICATIONS) ---
let mockJobsDb: { [id: string]: Job } = {
  'job1': { id: 'job1', title: 'Urgent Plumbing for New Condo', customerId: 'customerTestUID', customerName: 'Test Customer', description: 'Fix leaky pipes and install new sink in a newly constructed condominium. Requires experience with PEX and copper piping. All materials will be provided on site. Work to be completed within 2 days.', requiredSkill: 'Plumber', location: 'Mumbai', duration: '2 days', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(), budget: '₹5,000 - ₹8,000' },
  'job2': { id: 'job2', title: 'Electrical Wiring for Retail Outlet', customerId: 'customerUID2', customerName: 'Fashion Forward Inc.', description: 'Complete electrical wiring, fixture installation, and panel setup for a new retail store. Must adhere to commercial electrical codes. Blueprints available.', requiredSkill: 'Electrician', location: 'Delhi', duration: '5 days', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), budget: '₹15,000' },
  'jobCust1': { id: 'jobCust1', title: 'Garden Wall Construction - Phase 1', customerId: 'customerTestUID', customerName: 'Test Customer', description: 'Build a 20-meter long, 1.5-meter high brick garden wall. Foundation is already prepared. Masonry skills and attention to detail are key.', requiredSkill: 'Mason', location: 'Mumbai', duration: '1 week', status: 'open', approvedByAdmin: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), budget: '₹20,000 - ₹25,000' },
  'jobCust2': { id: 'jobCust2', title: 'Interior Painting (2 Rooms)', customerId: 'customerTestUID', customerName: 'Test Customer', description: 'Interior painting for a living room and bedroom, approximately 500 sq ft total. Walls and ceilings. Customer will provide paint.', requiredSkill: 'Painter', location: 'Mumbai', duration: '3 days', status: 'open', approvedByAdmin: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), budget: 'Negotiable' },
};
let jobIdCounter = Object.keys(mockJobsDb).length + 10;

let mockApplicationsDb: { [id: string]: Application } = {
  'app1': { id: 'app1', labourId: 'labourUID', labourName: 'Labour User', jobId: 'jobCust1', jobTitle: 'Garden Wall Construction - Phase 1', customerId: 'customerTestUID', customerName: 'Test Customer', status: 'Pending', dateApplied: new Date(Date.now() - 86400000 * 1).toISOString(), jobRequiredSkill: 'Mason', jobLocation: 'Mumbai' },
};
let applicationIdCounter = Object.keys(mockApplicationsDb).length + 1;


const db = {
  collection: (collectionName: string) => ({
    doc: (docId?: string) => {
      const id = docId || `mockDoc-${collectionName}-${Date.now()}`;
      return {
        get: async (): Promise<{ exists: () => boolean; data: () => any; id: string } | { exists: false; data: () => null; id: string }> => {
          await new Promise(resolve => setTimeout(resolve, 20));
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
            mockJobsDb[id] = { ...data, id, status: data.status || 'open', approvedByAdmin: data.approvedByAdmin !== undefined ? data.approvedByAdmin : true, createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } as Job;
          } else if (collectionName === 'applications') {
            mockApplicationsDb[id] = { ...data, id, dateApplied: data.dateApplied || new Date().toISOString(), status: data.status || 'Pending' } as Application;
          }
        },
        update: async (data: any) => {
          await new Promise(resolve => setTimeout(resolve, 20));
          if (collectionName === 'users' && mockUsersDb[id]) {
            mockUsersDb[id] = { ...mockUsersDb[id], ...data, updatedAt: new Date().toISOString() };
          } else if (collectionName === 'jobs' && mockJobsDb[id]) {
             // Ensure status and approvedByAdmin are not accidentally overwritten if not provided
            mockJobsDb[id] = {
              ...mockJobsDb[id],
              ...data,
              status: data.status || mockJobsDb[id].status,
              approvedByAdmin: data.approvedByAdmin !== undefined ? data.approvedByAdmin : mockJobsDb[id].approvedByAdmin,
              updatedAt: new Date().toISOString()
            };
          } else if (collectionName === 'applications' && mockApplicationsDb[id]) {
            mockApplicationsDb[id] = { ...mockApplicationsDb[id], ...data, updatedAt: new Date().toISOString() };
          } else {
            // console.warn(`Mock DB: Document ${collectionName}/${id} not found for update.`);
          }
        },
        delete: async () => {
           await new Promise(resolve => setTimeout(resolve, 20));
           if (collectionName === 'users') delete mockUsersDb[id];
           else if (collectionName === 'jobs') {
             if (mockJobsDb[id]) {
                mockJobsDb[id].status = 'deleted';
                mockJobsDb[id].updatedAt = new Date().toISOString();
             }
           }
           else if (collectionName === 'applications') delete mockApplicationsDb[id];
        }
      };
    },
    add: async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 20));
        let newId = '';
        if (collectionName === 'users') {
            newId = data.uid || `user-${Date.now()}`; // Should be set by AuthContext
            mockUsersDb[newId] = {
            ...data,
            uid: newId,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            } as UserProfile;
        } else if (collectionName === 'jobs') {
            newId = `job-${jobIdCounter++}`;
            mockJobsDb[newId] = {
            ...data,
            id: newId,
            status: data.status || 'open', // Default to 'open' for new jobs in mock
            approvedByAdmin: data.approvedByAdmin !== undefined ? data.approvedByAdmin : true, // Auto-approve for mock
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            } as Job;
        } else if (collectionName === 'applications') {
            newId = `app-${applicationIdCounter++}`;
            mockApplicationsDb[newId] = {
            ...data,
            id: newId,
            dateApplied: data.dateApplied || new Date().toISOString(),
            status: data.status || 'Pending',
            } as Application;
        }
        return {
            id: newId,
            get: async () => ({ id: newId, data: () => data, exists: () => true })
        };
    },
    // @ts-ignore
    where: (field: keyof Job | keyof UserProfile | keyof Application, operator: string, value: any) => ({
      where: (field2: keyof Application, operator2: string, value2: any) => ({ // For multi-where queries
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
            id: (doc as any).id || (doc as any).uid,
            data: () => ({...doc})
          })),
        };
      }
    })
  })
};

// Mock Firebase Storage
const storage = {
  ref: (path?: string) => ({
    put: async (file: File) => { // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        snapshot: {
          ref: {
            getDownloadURL: async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
              return `https://placehold.co/100x100.png?text=MOCKIMG`; // Return a placeholder URL
            }
          }
        }
      };
    },
    getDownloadURL: async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return `https://placehold.co/100x100.png?text=MOCK`;
    }
  })
};

console.log("--- Using MOCK Firebase services ---");

export { auth, db, storage };
