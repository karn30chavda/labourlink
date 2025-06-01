
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { auth, db } from "@/lib/firebase"; // Uses MOCK Firebase
import type { UserProfile, UserRole, MockAuthUser } from "@/types";
import { siteConfig } from "@/config/site";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: MockAuthUser | null;
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
  const [authProcessLoading, setAuthProcessLoading] = useState(true);

  const _handleUserSession = useCallback(async (currentAuthUser: MockAuthUser | null) => {
    if (currentAuthUser) {
      try {
        const userDocSnap = await db.collection("users").doc(currentAuthUser.uid).get();
        if (userDocSnap.exists()) {
          const fetchedProfile = userDocSnap.data() as UserProfile;

          if (fetchedProfile.disabled) {
            toast({ title: "Access Denied", description: "Your account has been disabled. You have been logged out.", variant: "destructive" });
            await auth.signOut(auth); // This will trigger onAuthStateChanged again with null
            // State updates (setUser, setUserData, setAuthProcessLoading) will be handled by the re-entrant call to onAuthStateChanged.
            return; 
          } else {
            setUser(currentAuthUser);
            setUserData(fetchedProfile);
          }
        } else {
          toast({ title: "Profile Error", description: "Your user profile was not found. Please contact support.", variant: "destructive" });
          await auth.signOut(auth);
          return;
        }
      } catch (error) {
        console.error("[AuthContext] Error processing user session:", error);
        toast({ title: "Session Error", description: "Could not verify your session. Please try logging in again.", variant: "destructive" });
        // Attempt to sign out to clear corrupted state, if any user was present
        if (auth.currentUser) { // Check if there's a Firebase auth user
             await auth.signOut(auth);
        } else { // If no Firebase user, just clean up local state
            setUser(null);
            setUserData(null);
        }
        // setAuthProcessLoading(false) will be handled by onAuthStateChanged after signOut or directly if no user.
        // If already no user, and we hit this catch, ensure loading is false.
        if(!currentAuthUser) setAuthProcessLoading(false);
        return; // Ensure we don't proceed to setAuthProcessLoading(false) below if we returned or error occurred
      }
    } else { // currentAuthUser is null
      setUser(null);
      setUserData(null);
    }
    setAuthProcessLoading(false);
  }, []); // Assuming toast, db, auth are stable and don't need to be in deps. If they were props or from other contexts, they might be.

  useEffect(() => {
    setAuthProcessLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (currentAuthUser: MockAuthUser | null) => {
      await _handleUserSession(currentAuthUser);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [_handleUserSession]);

  const login = async (email: string, password: string): Promise<void> => {
    setAuthProcessLoading(true);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user as MockAuthUser;

      const userDocSnap = await db.collection("users").doc(authUser.uid).get();
      if (userDocSnap.exists()) {
        const userProfile = userDocSnap.data() as UserProfile;
        if (userProfile.disabled) {
          await auth.signOut(auth); 
          toast({ title: "Login Failed", description: "Your account has been disabled by an administrator.", variant: "destructive" });
          // setAuthProcessLoading(false); // onAuthStateChanged will handle this after signOut completes
          throw new Error("Account disabled.");
        }
        // If not disabled, onAuthStateChanged will call _handleUserSession and set user/userData.
        toast({ title: "Login Successful", description: "Welcome back!" });
      } else {
        await auth.signOut(auth);
        toast({ title: "Login Failed", description: "User profile not found. Please contact support.", variant: "destructive" });
        // setAuthProcessLoading(false);
        throw new Error("User profile not found after login.");
      }
    } catch (error) {
      const knownError = error instanceof Error ? error.message : "";
      if (knownError !== "Account disabled." && knownError !== "User profile not found after login.") {
         toast({ title: "Login Failed", description: knownError || "Invalid credentials or network error.", variant: "destructive" });
      }
      setAuthProcessLoading(false); // Ensure loading is false if any part of login fails.
      console.error("[AuthContext] Login failed for:", email, error);
      throw error;
    }
    // Don't set authProcessLoading(false) here on success, onAuthStateChanged will handle it.
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
        disabled: false, // New users are not disabled by default
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
      
      // onAuthStateChanged will call _handleUserSession for the new user.
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
      setAuthProcessLoading(false);
      throw error;
    }
    // Don't set authProcessLoading(false) here on success, onAuthStateChanged will handle it.
  };

  const logout = async () => {
    try {
      await auth.signOut(auth);
      // onAuthStateChanged will set user to null and authProcessLoading to false.
      toast({ title: "Logout Successful", description: "You have been logged out." });
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      toast({ title: "Logout Error", description: String((error as Error).message || "Could not log out."), variant: "destructive" });
      // If signOut errors, state might be inconsistent, ensure loading is false
      setAuthProcessLoading(false);
    }
  };

  const refreshUserData = useCallback(async () => {
    // Use the user from state, as auth.currentUser might not be reliable in mock or immediately after state changes
    const currentUserFromState = user; 
    if (currentUserFromState) {
      console.log("[AuthContext] Refreshing user data for:", currentUserFromState.uid);
      setAuthProcessLoading(true);
      await _handleUserSession(currentUserFromState);
    } else {
      console.log("[AuthContext] refreshUserData called but no user is logged in via context state.");
      await _handleUserSession(null); // This will ensure states are null and loading is false.
    }
  }, [user, _handleUserSession]);

  const isAdmin = userData?.role === "admin";
  const isLabour = userData?.role === "labour";
  const isCustomer = userData?.role === "customer";

  const contextValue = { 
    user, 
    userData, 
    loading: authProcessLoading,
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
