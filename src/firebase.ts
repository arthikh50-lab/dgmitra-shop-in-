import { app } from './firebaseAuth';
import { getFirestore, collection, doc, query, where, orderBy, limit, getDocs, getDocsFromCache, getDoc, getDocFromCache, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, loginWithEmailFirebase, signUpWithEmailFirebase, logoutFirebase, loginWithGoogleFirebase, onAuthStateChanged } from './firebaseAuth';

export const db = getFirestore(app);
export const storage = getStorage(app);

export { auth, onAuthStateChanged };

export const loginWithGoogle = loginWithGoogleFirebase;
export const loginWithEmail = loginWithEmailFirebase;
export const signUpWithEmail = signUpWithEmailFirebase;
export const logout = logoutFirebase;

export enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Database Error: ', error);
  throw error;
}

export function isQuotaError(error: any): boolean {
  if (error?.code === 'resource-exhausted') {
    return true;
  }
  return false;
}

export {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDocsFromCache,
  getDoc,
  getDocFromCache,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  getDocFromServer,
  enableIndexedDbPersistence,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject
};

export const uploadBase64ToStorage = async (base64: string, path: string): Promise<string> => {
  const r = ref(storage, path);
  await uploadString(r, base64, 'data_url');
  return await getDownloadURL(r);
};
