
import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  role: 'labour' | 'customer' | 'admin';
  phone?: string;
  profilePhotoUrl?: string;
  
  // Labour specific
  skills?: string[];
  city?: string;
  availability?: boolean;
  roleType?: string; 
  currentWorkSites?: string[];
  pastWorkSites?: string[];
  
  subscription?: {
    planId: string; 
    planType: string; 
    validUntil: Timestamp | string | null; // Can be Firestore Timestamp or ISO string
    razorpayPaymentId?: string; 
    status: 'active' | 'inactive' | 'expired' | 'none';
    jobPostLimit?: number; 
    jobPostCount?: number; 
  };
  createdAt: Timestamp | string; // Can be Firestore Timestamp or ISO string
  updatedAt?: Timestamp | string; // Can be Firestore Timestamp or ISO string
}

export interface Job {
  id: string;
  customerId: string; 
  customerName?: string; 
  title: string;
  description: string;
  requiredSkill: string; 
  location: string; 
  duration: string; 
  budget?: string; 
  status: 'pending_approval' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled_by_customer' | 'expired' | 'deleted';
  createdAt: Timestamp | string; // Can be Firestore Timestamp or ISO string
  updatedAt?: Timestamp | string; // Can be Firestore Timestamp or ISO string
  approvedByAdmin?: boolean;
  assignedLabourId?: string; 
}

export interface Application {
  id: string;
  labourId: string;
  labourName?: string;
  labourRoleType?: string; 
  jobId: string;
  jobTitle?: string;
  customerId?: string; 
  customerName?: string;
  message?: string; 
  dateApplied: Timestamp | string; // Can be Firestore Timestamp or ISO string
  status: 'Pending' | 'Shortlisted' | 'Accepted' | 'Rejected_by_customer' | 'Withdrawn_by_labour';
  proposedRate?: string; 
  jobRequiredSkill?: string;
  jobLocation?: string;
  updatedAt?: Timestamp | string; 
}

export interface Payment {
  id: string;
  userId: string;
  userRole: 'labour' | 'customer';
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  planId: string; 
  planType: string; 
  amount: number;
  currency: 'INR';
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  createdAt: Timestamp | string; // Can be Firestore Timestamp or ISO string
}

export type UserRole = 'labour' | 'customer' | 'admin';

export interface Labor { // This seems to be for the AI flow, keep as is
  name: string;
  role: string;
  skills: string[];
  availability: boolean;
  city: string;
  pastWorkingSites: string[];
}

export interface JobPosting { // This seems to be for the AI flow, keep as is
  title: string;
  description: string;
  requiredSkill: string;
  location: string;
}

// Mock Auth Types - Keep as is for mock environment if needed alongside real Firebase
export interface MockAuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface MockUserCredential {
  user: MockAuthUser;
}
