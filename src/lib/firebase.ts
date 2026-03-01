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
    _bucket = getStorage(getFirebaseApp()).bucket();
  }
  return _bucket;
}