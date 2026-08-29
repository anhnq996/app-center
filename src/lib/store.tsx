"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { useAuth } from "./auth";
import type { Project, User } from "./types";
import {
  CURRENT_USER_ID,
  seedProjects,
  seedUsers,
  uid,
} from "./data";

interface Store {
  projects: Project[];
  getProject: (id: string) => Project | undefined;
  getProjectBySlug: (slug: string) => Project | undefined;
  addProject: (p: Project) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  users: User[];
  currentUser: User;
  addUser: (u: Omit<User, "id" | "createdAt">, id?: string) => Promise<User>;
  updateUser: (u: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  isLoading: boolean;
  firestoreError: string | null;
}

const StoreContext = createContext<Store | null>(null);

function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => withoutUndefined(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, withoutUndefined(item)]),
    ) as T;
  }
  return value;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const seeded = useRef(false);
  const initialCollections = useRef<{ projects?: boolean; users?: boolean }>({});

  const seedDemoData = useCallback(async (firestore: Firestore) => {
    const batch = writeBatch(firestore);
    seedUsers().forEach((user) => batch.set(doc(firestore, "users", user.id), user));
    seedProjects().forEach((project) => batch.set(doc(firestore, "projects", project.id), project));
    await batch.commit();
  }, []);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      setFirestoreError(
        "Firebase has not been configured. Add the NEXT_PUBLIC_FIREBASE_* values to .env.local.",
      );
      return;
    }
    const firestore = db;

    let projectsLoaded = false;
    let usersLoaded = false;
    const finishLoading = () => {
      if (projectsLoaded && usersLoaded) setIsLoading(false);
    };
    const reportError = (error: unknown) => {
      setFirestoreError(error instanceof Error ? error.message : "Unable to connect to Firestore.");
      setIsLoading(false);
    };
    const maybeSeed = () => {
      const { projects: projectsEmpty, users: usersEmpty } = initialCollections.current;
      if (seeded.current || projectsEmpty !== true || usersEmpty !== true) return;
      seeded.current = true;
      void seedDemoData(firestore).catch(reportError);
    };

    const unsubscribeProjects = onSnapshot(
      collection(firestore, "projects"),
      (snapshot) => {
        if (initialCollections.current.projects === undefined) {
          initialCollections.current.projects = snapshot.empty;
          maybeSeed();
        }
        setProjects(
          snapshot.docs
            .map((snapshotDoc) => ({ ...snapshotDoc.data(), id: snapshotDoc.id }) as Project)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        );
        projectsLoaded = true;
        finishLoading();
      },
      reportError,
    );
    const unsubscribeUsers = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        if (initialCollections.current.users === undefined) {
          initialCollections.current.users = snapshot.empty;
          maybeSeed();
        }
        setUsers(
          snapshot.docs
            .map((snapshotDoc) => ({ ...snapshotDoc.data(), id: snapshotDoc.id }) as User)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        );
        usersLoaded = true;
        finishLoading();
      },
      reportError,
    );

    return () => {
      unsubscribeProjects();
      unsubscribeUsers();
    };
  }, [profile, seedDemoData]);

  const runWrite = useCallback(async (write: (firestore: Firestore) => Promise<void>) => {
    if (!db) {
      const error = new Error("Firebase has not been configured. Add the values in .env.local.");
      setFirestoreError(error.message);
      throw error;
    }
    try {
      await write(db);
      setFirestoreError(null);
    } catch (error) {
      setFirestoreError(error instanceof Error ? error.message : "Unable to save to Firestore.");
      throw error;
    }
  }, []);

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );
  const getProjectBySlug = useCallback(
    (slug: string) => projects.find((p) => p.slug === slug),
    [projects],
  );
  const addProject = useCallback(
    (p: Project) =>
      runWrite((firestore) =>
        setDoc(
          doc(firestore, "projects", p.id),
          withoutUndefined({
            ...p,
            updatedAt: new Date().toISOString(),
          }),
        ),
      ),
    [runWrite],
  );
  const updateProject = useCallback(
    (p: Project) =>
      runWrite((firestore) =>
        setDoc(
          doc(firestore, "projects", p.id),
          withoutUndefined({
            ...p,
            updatedAt: new Date().toISOString(),
          }),
        ),
      ),
    [runWrite],
  );
  const deleteProject = useCallback(
    (id: string) => runWrite((firestore) => deleteDoc(doc(firestore, "projects", id))),
    [runWrite],
  );

  const addUser = useCallback(async (u: Omit<User, "id" | "createdAt">, id?: string) => {
    const created: User = { ...u, id: id ?? uid("user"), createdAt: new Date().toISOString() };
    await runWrite((firestore) => setDoc(doc(firestore, "users", created.id), created));
    return created;
  }, [runWrite]);
  const updateUser = useCallback(
    (u: User) => runWrite((firestore) => setDoc(doc(firestore, "users", u.id), u)),
    [runWrite],
  );
  const deleteUser = useCallback(async (id: string) => {
    if (id === profile?.id) return;
    await runWrite(async (firestore) => {
      const batch = writeBatch(firestore);
      batch.delete(doc(firestore, "users", id));
      projects.forEach((project) => {
        if (project.memberIds.includes(id)) {
          batch.update(doc(firestore, "projects", project.id), {
            memberIds: project.memberIds.filter((memberId) => memberId !== id),
          });
        }
      });
      await batch.commit();
    });
  }, [profile?.id, projects, runWrite]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === profile?.id) ?? profile ?? users[0] ?? seedUsers()[0],
    [profile, users],
  );

  const value = useMemo(
    () => ({
      projects,
      getProject,
      getProjectBySlug,
      addProject,
      updateProject,
      deleteProject,
      users,
      currentUser,
      addUser,
      updateUser,
      deleteUser,
      isLoading,
      firestoreError,
    }),
    [
      projects,
      getProject,
      getProjectBySlug,
      addProject,
      updateProject,
      deleteProject,
      users,
      currentUser,
      addUser,
      updateUser,
      deleteUser,
      isLoading,
      firestoreError,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
