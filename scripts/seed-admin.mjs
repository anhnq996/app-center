import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const email = required("ADMIN_EMAIL").toLowerCase();
const password = required("ADMIN_PASSWORD");
const name = process.env.ADMIN_NAME?.trim() || "Workspace Admin";

if (!email.includes("@")) throw new Error("ADMIN_EMAIL must be a valid email address.");
if (password.length < 6) throw new Error("ADMIN_PASSWORD must contain at least 6 characters.");

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
const credential = privateKey
  ? cert({
      projectId: required("FIREBASE_ADMIN_PROJECT_ID"),
      clientEmail: required("FIREBASE_ADMIN_CLIENT_EMAIL"),
      privateKey,
    })
  : applicationDefault();

const app =
  getApps()[0] ??
  initializeApp({
    credential,
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
const auth = getAuth(app);
const firestore = getFirestore(app);

let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`Using existing Firebase Authentication user: ${user.uid}`);
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({ email, password, displayName: name, emailVerified: true });
  console.log(`Created Firebase Authentication user: ${user.uid}`);
}

const userRef = firestore.collection("users").doc(user.uid);
const existingProfile = await userRef.get();
await userRef.set(
  {
    id: user.uid,
    name,
    email,
    role: "owner",
    avatar: existingProfile.data()?.avatar ?? null,
    createdAt: existingProfile.data()?.createdAt ?? new Date().toISOString(),
  },
  { merge: true },
);

console.log(`Administrator profile created at users/${user.uid}.`);
