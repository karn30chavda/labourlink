
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, UserRole, MockAuthUser, MockUserCredential } from "@/types";
import { siteConfig } from "@/config/site";

interface AuthContextType {
  user: MockAuthUser | null;
  userData: UserProfile | null;
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

  const fetchUserData = async (currentAuthUser: MockAuthUser) => {
    if (!currentAuthUser) {
      setUserData(null);
      return;
    }
    try {
      const userDocSnap = await db.collection("users").doc(currentAuthUser.uid).get();
      if (userDocSnap.exists()) {
        setUserData(userDocSnap.data() as UserProfile);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user data from mock DB:", error);
      setUserData(null);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      setLoading(true);
      await fetchUserData(user);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (currentAuthUser: MockAuthUser | null) => {
      setUser(currentAuthUser);
      if (currentAuthUser) {
        await fetchUserData(currentAuthUser);
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
      const newAuthUser = userCredential.user;
      if (newAuthUser) {
        const newUserProfile: UserProfile = {
          uid: newAuthUser.uid,
          email: newAuthUser.email,
          name,
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(role === 'labour' ? {
            availability: true,
            skills: [],
            city: '',
            roleType: siteConfig.skills[0], // Default roleType
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
              jobPostLimit: 5, // Initial free limit for mock
              jobPostCount: 0
            }
          } : {}),
        };
        await db.collection("users").doc(newAuthUser.uid).set(newUserProfile);
        setUserData(newUserProfile); // Explicitly set userData here to ensure immediate update
      }
      return userCredential;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false); // Ensure loading is set to false in finally block
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      // setUser and setUserData to null will be handled by onAuthStateChanged
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
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
