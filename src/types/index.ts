

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
    validUntil: string | null; // Changed from Date | string | null to string | null for localStorage
    razorpayPaymentId?: string; 
    status: 'active' | 'inactive' | 'expired' | 'none';
    jobPostLimit?: number; 
    jobPostCount?: number; 
  };
  createdAt: string; // Changed from Date | string
  updatedAt?: string; // Changed from Date | string
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
  createdAt: string; // Changed from Date | string
  updatedAt?: string; // Changed from Date | string
  approvedByAdmin?: boolean;
  assignedLabourId?: string; 
}

export interface Application {
  id: string;
  labourId: string;
  labourName?: string;
  labourRoleType?: string; // Added to store labour's primary role/skill
  jobId: string;
  jobTitle?: string;
  customerId?: string; 
  customerName?: string;
  message?: string; 
  dateApplied: string; // Changed from Date | string
  status: 'Pending' | 'Shortlisted' | 'Accepted' | 'Rejected_by_customer' | 'Withdrawn_by_labour';
  proposedRate?: string; 
  jobRequiredSkill?: string;
  jobLocation?: string;
  updatedAt?: string; // Added for consistency
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
  createdAt: string; // Changed from Date | string
}

export type UserRole = 'labour' | 'customer' | 'admin';

export interface Labor { // This seems to be for the AI flow, keep as is
  name: string;
  role: string;
  skills: string[];
  availability: boolean;
  city: string;
  pastWorkSites: string[];
}

export interface JobPosting { // This seems to be for the AI flow, keep as is
  title: string;
  description: string;
  requiredSkill: string;
  location: string;
}

// Mock Auth Types - Keep as is
export interface MockAuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface MockUserCredential {
  user: MockAuthUser;
}
