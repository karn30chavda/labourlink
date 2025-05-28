"use client";

import type { User } from "firebase/auth"; // Will be undefined if firebase is not fully set up
import React, { createContext, useState, useEffect, ReactNode } from "react";
// import { auth, db, mockFirestore } from "@/lib/firebase"; // Using mockFirestore for UI dev
import { auth, mockFirestore } from "@/lib/firebase"; // Using mockFirestore for UI dev
// import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"; // Will be undefined
import type { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  user: User | null; // Firebase auth user
  userData: UserProfile | null; // Additional user data from Firestore
  loading: boolean;
  isAdmin: boolean;
  isLabour: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<any>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: User) => {
    if (!firebaseUser) {
      setUserData(null);
      return;
    }
    try {
      // const userDocRef = doc(db, "users", firebaseUser.uid);
      // const userDoc = await getDoc(userDocRef);
      const userDoc = await mockFirestore.collection("users").doc(firebaseUser.uid).get(); // MOCK
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserProfile);
      } else {
        // This case might happen if a user is created in Firebase Auth but not in Firestore yet
        // Or if it's a new registration, it will be handled by the register function
        console.warn("User data not found in Firestore for UID:", firebaseUser.uid);
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
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
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: User | null) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      // Auth state change will trigger useEffect to fetch user data
      // setLoading(false) will be handled by onAuthStateChanged
      return userCredential;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        const newUserProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name,
          role,
          createdAt: new Date(), // serverTimestamp(),
          // Initialize other fields based on role if necessary
          ...(role === 'labour' ? { availability: true, skills: [], city: '' } : {}),
          ...(role === 'customer' ? { subscription: { planId: 'free', planType: 'free', validUntil: null, status: 'active', jobPostLimit: 1, jobPostCount: 0 } } : {}),
        };
        // await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
        await mockFirestore.collection("users").doc(firebaseUser.uid).set(newUserProfile); // MOCK
        setUserData(newUserProfile); 
      }
      // setLoading(false) will be handled by onAuthStateChanged
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
      setUser(null);
      setUserData(null);
      // setLoading(false) will be handled by onAuthStateChanged
    } catch (error) {
      setLoading(false);
      throw error;
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
