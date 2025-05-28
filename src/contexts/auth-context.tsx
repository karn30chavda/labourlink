
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase"; // Uses MOCK Firebase
import type { UserProfile, UserRole, MockAuthUser } from "@/types";
import { siteConfig } from "@/config/site";

interface AuthContextType {
  user: MockAuthUser | null; // Using MockAuthUser
  userData: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isLabour: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockAuthUser | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentAuthUser: MockAuthUser) => {
    if (!currentAuthUser || !currentAuthUser.uid) {
      console.warn("[AuthContext] fetchUserData called with invalid currentAuthUser:", currentAuthUser);
      setUserData(null);
      return;
    }
    console.log("[AuthContext] Fetching user data for UID:", currentAuthUser.uid);
    try {
      const userDocSnap = await db.collection("users").doc(currentAuthUser.uid).get();

      if (userDocSnap && typeof userDocSnap.exists === 'function' && userDocSnap.exists()) {
        const fetchedData = userDocSnap.data();
        console.log("[AuthContext] User data found:", fetchedData);
        setUserData(fetchedData as UserProfile);
      } else if (userDocSnap && typeof userDocSnap.exists === 'boolean' && userDocSnap.exists) { // Handle mock where exists is a boolean
        const fetchedData = userDocSnap.data; // Assuming data is a direct property in this mock case
        console.log("[AuthContext] User data found (mock boolean exists):", fetchedData);
        setUserData(fetchedData as UserProfile);
      }
      else {
        console.warn(`[AuthContext] No profile found for UID: ${currentAuthUser.uid}.`);
        console.error(`[AuthContext] userDocSnap value:`, JSON.stringify(userDocSnap));
         if (userDocSnap) {
             console.error(`[AuthContext] typeof userDocSnap.exists:`, typeof userDocSnap.exists);
         }
        setUserData(null);
      }
    } catch (error) {
      console.error("[AuthContext] Error fetching user data:", error);
      setUserData(null);
    }
  };
  
  const refreshUserData = async () => {
    if (user) {
      console.log("[AuthContext] Refreshing user data for:", user.uid);
      setLoading(true); 
      await fetchUserData(user);
      setLoading(false);
    } else {
      console.log("[AuthContext] refreshUserData called but no user is logged in.");
    }
  };

  useEffect(() => {
    setLoading(true);
    console.log("[AuthContext] Setting up onAuthStateChanged listener.");
    const unsubscribe = auth.onAuthStateChanged(async (currentAuthUser: MockAuthUser | null) => {
      console.log("[AuthContext] onAuthStateChanged triggered. currentAuthUser:", currentAuthUser);
      setUser(currentAuthUser);
      if (currentAuthUser) {
        await fetchUserData(currentAuthUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => {
      console.log("[AuthContext] Unsubscribing from onAuthStateChanged.");
      if (typeof unsubscribe === 'function') unsubscribe(); // Mock might return void
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // The mock auth.signInWithEmailAndPassword will update currentMockUser
      // and trigger onAuthStateChanged
      await auth.signInWithEmailAndPassword(auth, email, password); 
      console.log("[AuthContext] Login successful for:", email);
    } catch (error) {
      console.error("[AuthContext] Login failed for:", email, error);
      setLoading(false); 
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(auth, email, password);
      const newAuthUser = userCredential.user as MockAuthUser; // Cast to MockAuthUser
      
      const timestamp = new Date().toISOString();

      const newUserProfile: UserProfile = {
        uid: newAuthUser.uid,
        email: newAuthUser.email,
        name,
        role,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(role === 'labour' ? {
          availability: true,
          skills: [],
          city: '',
          roleType: siteConfig.skills.length > 0 ? siteConfig.skills[0] : 'General Labour',
          subscription: {
            planId: 'none',
            planType: 'none',
            status: 'inactive',
            validUntil: null,
          }
        } : {}),
        ...(role === 'customer' ? {
          subscription: {
            planId: 'free_customer',
            planType: 'free',
            validUntil: null,
            status: 'active',
            jobPostLimit: 5, // Example limit
            jobPostCount: 0
          }
        } : {}),
      };
      await db.collection("users").doc(newAuthUser.uid).set(newUserProfile);
      console.log("[AuthContext] Registration successful, mock profile created for:", email, newUserProfile);
      // Manually set user and userData to update context immediately for mock
      setUser(newAuthUser); 
      setUserData(newUserProfile); 

    } catch (error: any) {
      console.error("[AuthContext] Registration failed for:", email, error);
      throw error;
    } finally {
      setLoading(false); 
    }
  };

  const logout = async () => {
    console.log("[AuthContext] Logging out user:", user?.email);
    setLoading(true);
    try {
      await auth.signOut(auth);
      // setUser and setUserData to null will be handled by mock onAuthStateChanged
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      setLoading(false);
    }
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

export default AuthContext;
