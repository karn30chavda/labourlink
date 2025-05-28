import type { Timestamp } from "firebase/firestore"; // Will be undefined if firebase is not fully set up

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
  currentWorkSites?: string[];
  pastWorkSites?: string[];
  
  // Subscription details (for Labour and Customer with post limits)
  subscription?: {
    planId: string; // e.g., 'monthly_99', 'yearly_499'
    planType: 'monthly' | 'yearly' | 'free' | 'premium_customer';
    validUntil: Timestamp | Date | null; // Firestore Timestamp or Date string
    razorpayPaymentId?: string;
    status: 'active' | 'inactive' | 'expired';
    jobPostLimit?: number; // For customers
    jobPostCount?: number; // For customers
  };
  createdAt: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export interface Job {
  id: string;
  customerId: string; // UID of the customer who posted
  customerName?: string; // Name of the customer
  title: string;
  description: string;
  requiredSkill: string; // Can be a comma-separated string or ideally an array
  location: string; // City or more specific address
  duration: string; // e.g., "1 week", "2 months", "Ongoing"
  budget?: string; // Optional, e.g., "₹5000 - ₹7000", "Negotiable"
  status: 'pending_approval' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled_by_customer' | 'expired';
  createdAt: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
  approvedByAdmin?: boolean;
  assignedLabourId?: string; // UID of the labour assigned
}

export interface Application {
  id: string;
  labourId: string;
  labourName?: string;
  jobId: string;
  jobTitle?: string;
  customerId?: string; // UID of the customer who owns the job
  message?: string; // Cover letter or message from labour
  dateApplied: Timestamp | Date | string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected_by_customer' | 'withdrawn_by_labour';
  // Optional: labour proposed rate if different from job budget
  proposedRate?: string; 
}

export interface Payment {
  id: string;
  userId: string;
  userRole: 'labour' | 'customer';
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  planId: string; // e.g., 'monthly_99_labour', 'yearly_499_labour', 'customer_basic_jobs'
  planType: string; // 'monthly', 'yearly', 'job_pack'
  amount: number;
  currency: 'INR';
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  createdAt: Timestamp | Date | string;
}

export type UserRole = 'labour' | 'customer' | 'admin';

// For AI Flows
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
