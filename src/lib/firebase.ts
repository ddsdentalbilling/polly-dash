import { getApp, getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const app = getApps().length
  ? getApp()
  : initializeApp({
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

export const db = getFirestore(app);
export const bucket = getStorage(app).bucket();
