
import type { UserProfile, Job, MockAuthUser, MockUserCredential } from '@/types';

// --- MOCK AUTHENTICATION ---
let currentMockUser: MockAuthUser | null = null;
let authStateListener: ((user: MockAuthUser | null) => void) | null = null;

// Simple in-memory store for user profiles
const mockUsersDb: { [uid: string]: UserProfile } = {
  "adminUID": { uid: 'adminUID', name: 'Admin User', email: 'admin@labourlink.com', role: 'admin', createdAt: new Date() },
  "labourUID": { uid: 'labourUID', name: 'Labour User', email: 'labour@labourlink.com', role: 'labour', roleType: "Plumber", city: 'MockCity', skills: ['Plumbing', 'Electrical'], availability: true, createdAt: new Date() },
  "customerUID": { uid: 'customerUID', name: 'Customer User', email: 'customer@labourlink.com', role: 'customer', createdAt: new Date(), subscription: { planId: 'free', planType: 'free', validUntil: null, status: 'active', jobPostLimit: 1, jobPostCount: 0 } },
};

const auth = {
  onAuthStateChanged: (callback: (user: MockAuthUser | null) => void): (() => void) => {
    authStateListener = callback;
    // Immediately call with current state
    Promise.resolve().then(() => callback(currentMockUser));
    return () => {
      authStateListener = null; // Unsubscribe
    };
  },
  signInWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    console.log("Mock Sign In Attempt:", email);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    for (const uid in mockUsersDb) {
      if (mockUsersDb[uid].email === email && password === "password") { // Simple password check
        currentMockUser = { uid, email, displayName: mockUsersDb[uid].name };
        if (authStateListener) authStateListener(currentMockUser);
        return { user: currentMockUser };
      }
    }
    throw new Error("Mock Auth: Invalid credentials.");
  },
  createUserWithEmailAndPassword: async (email: string, password: string): Promise<MockUserCredential> => {
    console.log("Mock Register Attempt:", email);
    await new Promise(resolve => setTimeout(resolve, 200));
    if (Object.values(mockUsersDb).find(u => u.email === email)) {
      throw new Error("Mock Auth: Email already in use.");
    }
    const uid = `mockUID-${Date.now()}`;
    // The actual UserProfile creation will be handled by AuthContext,
    // this just creates the auth user part.
    currentMockUser = { uid, email }; 
    if (authStateListener) authStateListener(currentMockUser);
    return { user: currentMockUser };
  },
  signOut: async (): Promise<void> => {
    console.log("Mock Sign Out");
    await new Promise(resolve => setTimeout(resolve, 100));
    currentMockUser = null;
    if (authStateListener) authStateListener(null);
  },
  // Add other auth methods if needed, e.g., currentUser getter
  get currentUser(): MockAuthUser | null {
    return currentMockUser;
  }
};

// --- MOCK FIRESTORE ---
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
      const id = docId || `mockDoc-${Date.now()}`; // Generate ID if not provided
      return {
        get: async () => {
          console.log(`Mock DB Get: ${collectionName}/${id}`);
          await new Promise(resolve => setTimeout(resolve, 150));
          let dataStore = collectionName === 'users' ? mockUsersDb : mockJobsDb;
          const docData = dataStore[id];
          if (docData) {
            return { exists: () => true, data: () => ({...docData}), id };
          }
          return { exists: () => false, data: () => null, id };
        },
        set: async (data: any) => {
          console.log(`Mock DB Set: ${collectionName}/${id}`, data);
          await new Promise(resolve => setTimeout(resolve, 150));
          if (collectionName === 'users') {
            mockUsersDb[id] = { ...data, uid: id } as UserProfile;
          } else if (collectionName === 'jobs') {
            mockJobsDb[id] = { ...data, id } as Job;
          }
        },
        update: async (data: any) => {
          console.log(`Mock DB Update: ${collectionName}/${id}`, data);
          await new Promise(resolve => setTimeout(resolve, 150));
          if (collectionName === 'users' && mockUsersDb[id]) {
            mockUsersDb[id] = { ...mockUsersDb[id], ...data, updatedAt: new Date() };
          } else if (collectionName === 'jobs' && mockJobsDb[id]) {
            mockJobsDb[id] = { ...mockJobsDb[id], ...data, updatedAt: new Date() };
          } else {
            throw new Error(`Mock DB: Document ${collectionName}/${id} not found for update.`);
          }
        },
        delete: async () => {
           console.log(`Mock DB Delete: ${collectionName}/${id}`);
           await new Promise(resolve => setTimeout(resolve, 150));
           if (collectionName === 'users') {
            delete mockUsersDb[id];
          } else if (collectionName === 'jobs') {
            delete mockJobsDb[id]; // For hard delete simulation
            // Or for soft delete: mockJobsDb[id].status = 'deleted'; mockJobsDb[id].updatedAt = new Date();
          }
        }
      };
    },
    add: async (data: any) => {
      console.log(`Mock DB Add to ${collectionName}:`, data);
      await new Promise(resolve => setTimeout(resolve, 150));
      const newId = collectionName === 'jobs' ? `job${jobIdCounter++}` : `user-${Date.now()}`;
      if (collectionName === 'users') {
        mockUsersDb[newId] = { ...data, uid: newId, createdAt: new Date() } as UserProfile;
      } else if (collectionName === 'jobs') {
        mockJobsDb[newId] = { ...data, id: newId, createdAt: new Date() } as Job;
      }
      return { id: newId };
    },
    where: (field: keyof Job | keyof UserProfile, operator: string, value: any) => ({
      get: async () => {
        console.log(`Mock DB Where: ${collectionName} WHERE ${String(field)} ${operator} ${value}`);
        await new Promise(resolve => setTimeout(resolve, 150));
        let storeToSearch = collectionName === 'jobs' ? Object.values(mockJobsDb) : Object.values(mockUsersDb);
        
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
            id: (doc as any).id || (doc as any).uid, 
            data: () => ({...doc}) 
          })),
        };
      }
      // Add orderBy, limit etc. mocks if needed for more complex queries
    })
  })
};

// --- MOCK STORAGE ---
const storage = {
  // Mock storage methods if needed, e.g., ref, uploadBytes, getDownloadURL
  // For now, a minimal mock:
  ref: (path: string) => ({
    put: async () => ({ snapshot: { ref: { getDownloadURL: async () => `https://placehold.co/100x100.png?text=MOCK`}}}),
    getDownloadURL: async () => `https://placehold.co/100x100.png?text=MOCK`
  })
};

// Export mocks
export { auth, db, storage };
