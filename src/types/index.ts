

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
    validUntil: Date | string | null; 
    razorpayPaymentId?: string; 
    status: 'active' | 'inactive' | 'expired' | 'none';
    jobPostLimit?: number; 
    jobPostCount?: number; 
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
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
  createdAt: Date | string;
  updatedAt?: Date | string;
  approvedByAdmin?: boolean;
  assignedLabourId?: string; 
}

export interface Application {
  id: string;
  labourId: string;
  labourName?: string; // Added
  jobId: string;
  jobTitle?: string;
  customerId?: string; 
  customerName?: string; // Added
  message?: string; 
  dateApplied: Date | string;
  status: 'Pending' | 'Shortlisted' | 'Accepted' | 'Rejected_by_customer' | 'Withdrawn_by_labour'; // Consistent casing
  proposedRate?: string; 
  // Added fields to enrich application display
  jobRequiredSkill?: string;
  jobLocation?: string;
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
  createdAt: Date | string;
}

export type UserRole = 'labour' | 'customer' | 'admin';

export interface Labor {
  name: string;
  role: string;
  skills: string[];
  availability: boolean;
  city: string;
  pastWorkingSites: string[];
}

export interface JobPosting {
  title: string;
  description: string;
  requiredSkill: string;
  location: string;
}

export interface MockAuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface MockUserCredential {
  user: MockAuthUser;
}
