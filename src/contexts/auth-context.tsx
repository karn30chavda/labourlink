
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase"; // Uses real Firebase
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  type User as FirebaseAuthUser // Renamed to avoid conflict with MockAuthUser if needed
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { UserProfile, UserRole } from "@/types";
import { siteConfig } from "@/config/site";

interface AuthContextType {
  user: FirebaseAuthUser | null; // Changed from MockAuthUser
  userData: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isLabour: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<void>; // Removed UserCredential return for simplicity
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>; // Removed UserCredential
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentAuthUser: FirebaseAuthUser) => {
    if (!currentAuthUser || !currentAuthUser.uid) {
      console.warn("[AuthContext] fetchUserData called with invalid currentAuthUser:", currentAuthUser);
      setUserData(null);
      return;
    }
    console.log("[AuthContext] Fetching user data for UID:", currentAuthUser.uid);
    try {
      const userDocRef = doc(db, "users", currentAuthUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const fetchedData = userDocSnap.data();
        console.log("[AuthContext] User data found:", fetchedData);
        setUserData(fetchedData as UserProfile);
      } else {
        console.warn(`[AuthContext] No profile found for UID: ${currentAuthUser.uid}. User may need to complete profile or this is a new registration.`);
        setUserData(null); // Ensure userData is null if profile doesn't exist
      }
    } catch (error) {
      console.error("[AuthContext] Error fetching user data:", error);
      setUserData(null);
    }
  };
  
  const refreshUserData = async () => {
    if (user) {
      console.log("[AuthContext] Refreshing user data for:", user.uid);
      setLoading(true); // Indicate loading during refresh
      await fetchUserData(user);
      setLoading(false);
    } else {
      console.log("[AuthContext] refreshUserData called but no user is logged in.");
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentAuthUser) => {
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
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and fetching userData
      console.log("[AuthContext] Login successful for:", email);
    } catch (error) {
      console.error("[AuthContext] Login failed for:", email, error);
      setLoading(false); // Ensure loading is false on error
      throw error;
    }
    // setLoading(false) will be handled by onAuthStateChanged's final setLoading
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newAuthUser = userCredential.user;
      
      const timestamp = serverTimestamp(); // Use Firestore server timestamp

      const newUserProfile: UserProfile = {
        uid: newAuthUser.uid,
        email: newAuthUser.email,
        name,
        role,
        createdAt: timestamp as any, // Will be converted by Firestore
        updatedAt: timestamp as any, // Will be converted by Firestore
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
            jobPostLimit: 5,
            jobPostCount: 0
          }
        } : {}),
      };
      await setDoc(doc(db, "users", newAuthUser.uid), newUserProfile);
      console.log("[AuthContext] Registration successful, profile created for:", email, newUserProfile);
      setUser(newAuthUser); 
      setUserData(newUserProfile); 
    } catch (error) {
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
      await signOut(auth);
      // setUser and setUserData to null will be handled by onAuthStateChanged
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      // Still set loading to false even if logout fails, though this is rare
      setLoading(false);
    }
    // setLoading(false) will be handled by onAuthStateChanged's final setLoading
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
