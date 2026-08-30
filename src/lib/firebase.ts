import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocFromServer,
  Firestore,
} from "firebase/firestore";
import { JournalEntry, WeeklyDigest, UserProfile } from "../types";
import { sanitizePayload } from "../utils/sanitizer";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Storage keys
const STORAGE_ACTIVE_USER = "lumina_active_user_profile";
const STORAGE_ENTRIES_PREFIX = "lumina_entries_";
const STORAGE_DIGESTS_PREFIX = "lumina_digests_";

// Firebase App & Service initialization with graceful failure protection
let app: FirebaseApp | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: Firestore | null = null;
export let isFirebaseAvailable = false;

try {
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env || {} : {};
  const envApiKey = metaEnv.VITE_FIREBASE_API_KEY || "";
  const isValidEnvKey = envApiKey && !envApiKey.includes("Dummy") && !envApiKey.includes("AIzaSyDemo");

  if (isValidEnvKey) {
    const config = {
      apiKey: envApiKey,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "personal-ai-journal.firebaseapp.com",
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "personal-ai-journal",
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "personal-ai-journal.appspot.com",
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
      appId: metaEnv.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef",
    };

    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    isFirebaseAvailable = true;
  } else {
    // Graceful offline/local mode without throwing unhandled auth errors
    console.info("Lumina Journal running in secure client-managed identity mode.");
  }
} catch (err) {
  console.warn("Firebase initialized in resilient local mode:", err);
  isFirebaseAvailable = false;
}

export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      providerInfo: currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn("Firestore Operation Notice: ", JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get active user from local persistent state
 */
export function getSavedActiveUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save active user to local session state
 */
export function saveActiveUser(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(profile));
  } catch (e) {
    console.warn("Could not cache active user session:", e);
  }
}

/**
 * Sign in with Google with popup or fallback to intelligent profile selector
 */
export async function signInWithGoogle(): Promise<UserProfile | null> {
  if (isFirebaseAvailable && auth) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isDemo: false,
      };
      saveActiveUser(profile);
      return profile;
    } catch (error: any) {
      console.warn("Firebase popup authentication deferred to account picker modal:", error?.message);
      // Return null so the UI opens the Google Account Picker Modal gracefully
      return null;
    }
  }
  // Return null to trigger the Google Account Picker Modal
  return null;
}

export async function signOutUser(): Promise<void> {
  try {
    if (auth && isFirebaseAvailable) {
      await firebaseSignOut(auth);
    }
  } catch (err) {
    console.warn("Sign out error:", err);
  }
  try {
    localStorage.removeItem(STORAGE_ACTIVE_USER);
  } catch {}
}

export async function getCurrentToken(): Promise<string> {
  if (isFirebaseAvailable && auth?.currentUser) {
    try {
      return await auth.currentUser.getIdToken(true);
    } catch (e) {
      console.warn("Retrying with local identity token:", e);
    }
  }

  const activeUser = getSavedActiveUser();
  if (activeUser) {
    const infoPayload = {
      uid: activeUser.uid,
      email: activeUser.email,
      displayName: activeUser.displayName,
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(infoPayload))));
    return `local_token_${activeUser.uid}__info__${b64}`;
  }

  return "local_token_author_primary";
}

/**
 * Persist Journal Entry with Cloud Firestore and local persistence
 */
export async function persistJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  const sanitized = sanitizePayload(entry);
  const path = `users/${userId}/entries/${entry.id}`;

  // 1. Write to local storage mirror
  try {
    const key = `${STORAGE_ENTRIES_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    const list: JournalEntry[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((e) => e.id === entry.id);
    if (index >= 0) {
      list[index] = sanitized;
    } else {
      list.unshift(sanitized);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn("Local storage cache write notice:", e);
  }

  // 2. Write to Cloud Firestore if connected
  if (isFirebaseAvailable && db) {
    try {
      const entryRef = doc(db, "users", userId, "entries", entry.id);
      await setDoc(entryRef, sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

/**
 * Subscribe to user entries with real-time Firestore and local persistence
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    return () => {};
  }

  const key = `${STORAGE_ENTRIES_PREFIX}${userId}`;

  // Load from local storage mirror immediately
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const cached = JSON.parse(raw);
      if (Array.isArray(cached) && cached.length > 0) {
        onUpdate(cached);
      }
    }
  } catch (e) {
    console.warn("Error reading cached entries:", e);
  }

  if (!isFirebaseAvailable || !db) {
    return () => {};
  }

  try {
    const entriesRef = collection(db, "users", userId, "entries");
    const entriesQuery = query(entriesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      entriesQuery,
      (snapshot) => {
        const items: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as JournalEntry);
        });
        if (items.length > 0) {
          try {
            localStorage.setItem(key, JSON.stringify(items));
          } catch {}
          onUpdate(items);
        }
      },
      (error) => {
        console.warn("Firestore snapshot notice:", error);
      }
    );

    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/entries/${entryId}`;

  // 1. Remove from local storage
  try {
    const key = `${STORAGE_ENTRIES_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: JournalEntry[] = JSON.parse(raw);
      const filtered = list.filter((e) => e.id !== entryId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Local storage delete notice:", e);
  }

  // 2. Remove from Firestore
  if (isFirebaseAvailable && db) {
    try {
      const docRef = doc(db, "users", userId, "entries", entryId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

/**
 * Persist Weekly Digest
 */
export async function persistWeeklyDigest(userId: string, digest: WeeklyDigest): Promise<void> {
  const sanitized = sanitizePayload(digest);
  const path = `users/${userId}/digests/${digest.id}`;

  // 1. Local storage mirror
  try {
    const key = `${STORAGE_DIGESTS_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    const list: WeeklyDigest[] = raw ? JSON.parse(raw) : [];
    list.unshift(sanitized);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn("Local storage digest write notice:", e);
  }

  // 2. Firestore write
  if (isFirebaseAvailable && db) {
    try {
      const digestRef = doc(db, "users", userId, "digests", digest.id);
      await setDoc(digestRef, sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}
