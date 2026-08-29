"use client";

import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword as updateFirebasePassword,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import { doc, onSnapshot } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth, db, firebaseConfig } from "./firebase";
import type { User } from "./types";

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: User | null;
  isLoading: boolean;
  hasAdminAccess: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
  provisionUser: (email: string, password: string, displayName: string) => Promise<string>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setIsLoading(false);
      return;
    }
    const firestore = db;

    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubscribeProfile?.();
      setUser(nextUser);
      setProfile(null);

      if (!nextUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      unsubscribeProfile = onSnapshot(
        doc(firestore, "users", nextUser.uid),
        (snapshot) => {
          setProfile(snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as User) : null);
          setIsLoading(false);
        },
        () => {
          setProfile(null);
          setIsLoading(false);
        },
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    if (!auth) throw new Error("Firebase has not been configured.");
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signOutUser = useCallback(async () => {
    if (auth) await signOut(auth);
  }, []);

  const provisionUser = useCallback(async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error("Firebase has not been configured.");
    const secondaryApp =
      getApps().find((firebaseApp) => firebaseApp.name === "workspace-user-provisioning") ??
      initializeApp(firebaseConfig, "workspace-user-provisioning");
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await updateProfile(credential.user, { displayName });
      return credential.user.uid;
    } finally {
      await signOut(secondaryAuth);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, nextPassword: string) => {
    const currentUser = auth?.currentUser;
    if (!currentUser?.email) throw new Error("No email/password user is signed in.");
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updateFirebasePassword(currentUser, nextPassword);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      hasAdminAccess: profile?.role === "owner" || profile?.role === "editor",
      signIn,
      signOutUser,
      provisionUser,
      changePassword,
    }),
    [user, profile, isLoading, signIn, signOutUser, provisionUser, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
