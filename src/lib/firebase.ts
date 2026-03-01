import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { Bucket } from "@google-cloud/storage";

let _db: Firestore | null = null;
let _bucket: Bucket | null = null;

function getFirebaseApp() {
  return getApps().length
    ? getApp()
    : initializeApp({
        // Allow undefined storageBucket during build time; it will be provided at runtime
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
}

export function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

export function getBucket(): Bucket {
  if (!_bucket) {
    // If bucket name is missing (build time), don't throw yet.
    // The bucket() call requires a name if the app options didn't have one.
    // But we only call getBucket() at runtime in API routes.
    const app = getFirebaseApp();
    const storage = getStorage(app);
    // At runtime, if env var is missing, this will still fail, which is correct behavior.
    // But at build time, Next.js won't execute this function unless it prerenders a page that calls it.
    _bucket = storage.bucket(); 
  }
  return _bucket;
}
