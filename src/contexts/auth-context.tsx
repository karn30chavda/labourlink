
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase"; // Uses MOCK Firebase
import type { UserProfile, UserRole, MockAuthUser } from "@/types";
import { siteConfig } from "@/config/site";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: MockAuthUser | null;
  userData: UserProfile | null;
  loading: boolean; // This is the public name for the loading state
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
  const [authProcessLoading, setAuthProcessLoading] = useState(true); // Internal loading state

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
      } else if (userDocSnap && typeof userDocSnap.exists === 'boolean' && userDocSnap.exists) {
        const fetchedData = userDocSnap.data;
        console.log("[AuthContext] User data found (mock boolean exists):", fetchedData);
        setUserData(fetchedData as UserProfile);
      }
      else {
        console.warn(`[AuthContext] No profile found for UID: ${currentAuthUser.uid}.`);
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
      setAuthProcessLoading(true); 
      await fetchUserData(user);
      setAuthProcessLoading(false);
    } else {
      console.log("[AuthContext] refreshUserData called but no user is logged in.");
    }
  };

  useEffect(() => {
    setAuthProcessLoading(true);
    console.log("[AuthContext] Setting up onAuthStateChanged listener.");
    const unsubscribe = auth.onAuthStateChanged(async (currentAuthUser: MockAuthUser | null) => {
      console.log("[AuthContext] onAuthStateChanged triggered. currentAuthUser:", currentAuthUser);
      setUser(currentAuthUser); // Set user state
      if (currentAuthUser) {
        await fetchUserData(currentAuthUser); // Fetch and set user data
      } else {
        setUserData(null); // Clear user data if no auth user
      }
      setAuthProcessLoading(false); // Auth process complete, set loading to false
    });
    return () => {
      console.log("[AuthContext] Unsubscribing from onAuthStateChanged.");
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setAuthProcessLoading(true);
    try {
      await auth.signInWithEmailAndPassword(auth, email, password); 
      // onAuthStateChanged will set user, userData, and authProcessLoading to false.
      // Toast is called after signIn is successful.
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      console.log("[AuthContext] Login successful for:", email);
    } catch (error) {
      console.error("[AuthContext] Login failed for:", email, error);
      toast({
        title: "Login Failed",
        description: (error as Error).message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setAuthProcessLoading(false); // Ensure loading is false on login error
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setAuthProcessLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(auth, email, password);
      const newAuthUser = userCredential.user as MockAuthUser;
      
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
            planId: 'none', planType: 'none', status: 'inactive', validUntil: null,
          }
        } : {}),
        ...(role === 'customer' ? {
          subscription: {
            planId: 'free_customer', planType: 'free', validUntil: null, status: 'active', jobPostLimit: 5, jobPostCount: 0
          }
        } : {}),
      };
      await db.collection("users").doc(newAuthUser.uid).set(newUserProfile);
      console.log("[AuthContext] Registration successful, mock profile created for:", email, newUserProfile);
      
      // Manually set user and userData for immediate UI update, onAuthStateChanged will also run.
      // setUser(newAuthUser); 
      // setUserData(newUserProfile); 
      // Relying on onAuthStateChanged to set the final state including authProcessLoading.

      toast({
        title: "Registration Successful",
        description: "Welcome to LabourLink! Your account has been created.",
      });
    } catch (error: any) {
      console.error("[AuthContext] Registration failed for:", email, error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setAuthProcessLoading(false); // Ensure loading is false on registration error
      throw error;
    }
  };

  const logout = async () => {
    console.log("[AuthContext] Logging out user:", user?.email);
    // Do not set authProcessLoading to true here.
    // The app is already in a loaded state.
    // onAuthStateChanged will handle setting user to null and authProcessLoading to false.
    try {
      await auth.signOut(auth); 
      // At this point, onAuthStateChanged should have already executed or will execute very soon,
      // setting user to null and authProcessLoading to false.
      toast({
        title: "Logout Successful",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      toast({
        title: "Logout Error",
        description: String((error as Error).message || "Could not log out."),
        variant: "destructive",
      });
      // If signOut itself errors, user might still be logged in, 
      // so authProcessLoading should ideally be false from its previous loaded state.
      // No explicit setAuthProcessLoading(false) here, as onAuthStateChanged is the source of truth.
    }
  };

  const isAdmin = userData?.role === "admin";
  const isLabour = userData?.role === "labour";
  const isCustomer = userData?.role === "customer";

  const contextValue = { 
    user, 
    userData, 
    loading: authProcessLoading, // Expose internal loading state as 'loading'
    isAdmin, 
    isLabour, 
    isCustomer, 
    login, 
    register, 
    logout, 
    refreshUserData 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

    