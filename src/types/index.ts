

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
  roleType?: string; // Added from LabourProfileForm
  currentWorkSites?: string[];
  pastWorkSites?: string[];
  
  // Subscription details (for Labour and Customer with post limits)
  subscription?: {
    planId: string; // e.g., 'monthly_99', 'yearly_499'
    planType: 'monthly' | 'yearly' | 'free' | 'premium_customer';
    validUntil: Date | null; 
    razorpayPaymentId?: string;
    status: 'active' | 'inactive' | 'expired';
    jobPostLimit?: number; // For customers
    jobPostCount?: number; // For customers
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Job {
  id: string;
  customerId: string; // UID of the customer who posted
  customerName?: string; // Name of the customer
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
  assignedLabourId?: string; // UID of the labour assigned
}

export interface Application {
  id: string;
  labourId: string;
  labourName?: string;
  jobId: string;
  jobTitle?: string;
  customerId?: string; 
  message?: string; 
  dateApplied: Date | string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected_by_customer' | 'withdrawn_by_labour';
  proposedRate?: string; 
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

// For AI Flows (remain unchanged as they are server-side concepts)
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

// Mock User type for client-side auth simulation
export interface MockAuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface MockUserCredential {
  user: MockAuthUser;
}
