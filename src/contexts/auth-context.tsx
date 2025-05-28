
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase"; // Using new mock from firebase.ts
import type { UserProfile, UserRole, MockAuthUser, MockUserCredential } from "@/types";

interface AuthContextType {
  user: MockAuthUser | null; // Firebase auth user (now mock)
  userData: UserProfile | null; // Additional user data from Firestore (now mock)
  loading: boolean;
  isAdmin: boolean;
  isLabour: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<MockUserCredential | void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<MockUserCredential | void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockAuthUser | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (mockAuthUser: MockAuthUser) => {
    if (!mockAuthUser) {
      setUserData(null);
      return;
    }
    console.log("AuthContext: Fetching user data for mock user UID:", mockAuthUser.uid);
    try {
      const userDoc = await db.collection("users").doc(mockAuthUser.uid).get();
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserProfile);
        console.log("AuthContext: User data found for UID:", mockAuthUser.uid, userDoc.data());
      } else {
        console.warn("AuthContext: User data not found in mock DB for UID:", mockAuthUser.uid);
        setUserData(null); // Should not happen if register creates it properly
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user data from mock DB:", error);
      setUserData(null);
    }
  };
  
  const refreshUserData = async () => {
    if (user) {
      console.log("AuthContext: Refreshing user data for UID:", user.uid);
      setLoading(true);
      await fetchUserData(user);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (mockAuthUser: MockAuthUser | null) => {
      console.log("AuthContext: onAuthStateChanged triggered. Mock Auth User:", mockAuthUser);
      setUser(mockAuthUser);
      if (mockAuthUser) {
        await fetchUserData(mockAuthUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<MockUserCredential | void> => {
    setLoading(true);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle setting user and fetching userData
      return userCredential;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<MockUserCredential | void> => {
    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const mockAuthUser = userCredential.user;
      if (mockAuthUser) {
        const newUserProfile: UserProfile = {
          uid: mockAuthUser.uid,
          email: mockAuthUser.email,
          name,
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(role === 'labour' ? { 
            availability: true, 
            skills: [], 
            city: '', 
            roleType: siteConfig.skills[0] // Default to first skill as roleType
          } : {}),
          ...(role === 'customer' ? { 
            subscription: { 
              planId: 'free', 
              planType: 'free', 
              validUntil: null, 
              status: 'active', 
              jobPostLimit: 1, 
              jobPostCount: 0 
            } 
          } : {}),
        };
        await db.collection("users").doc(mockAuthUser.uid).set(newUserProfile);
        // setUserData(newUserProfile); // Set directly or let onAuthStateChanged handle it
        // onAuthStateChanged will handle setting user and fetching userData
      }
      return userCredential;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      // onAuthStateChanged will set user and userData to null
    } catch (error) {
      setLoading(false);
      throw error;
    }
    // Ensure loading is set to false even if onAuthStateChanged is slow or fails for some reason
    // Though with mock, it should be quick.
    // setLoading(false); 
  };

  const isAdmin = userData?.role === "admin";
  const isLabour = userData?.role === "labour";
  const isCustomer = userData?.role === "customer";

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, isAdmin, isLabour, isCustomer, login, register, logout, refreshUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Dummy siteConfig for roleType default in register
const siteConfig = {
  skills: [
    "Electrician", "Mason", "Plumber", "Carpenter", "Painter", "Welder", "Roofer",
    "HVAC Technician", "Heavy Equipment Operator", "General Laborer", "Site Supervisor",
    "Project Manager", "Surveyor", "Architect", "Civil Engineer",
  ],
};


export default AuthContext;
