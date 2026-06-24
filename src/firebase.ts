import { supabase } from './supabase';
import { auth, loginWithEmailFirebase, signUpWithEmailFirebase, logoutFirebase, loginWithGoogleFirebase, onAuthStateChanged } from './firebaseAuth';

export const db = {};
export const storage = {};

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
  return false;
}

// Firestore API mocks
export const collection = (db: any, path: string) => ({ type: 'collection', path });
export const doc = (db: any, table: string, id: string) => ({ type: 'doc', table, id });
export const query = (col: any, ...ops: any[]) => ({ type: 'query', col, ops });
export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const orderBy = (field: string, direction: 'asc'|'desc') => ({ type: 'orderBy', field, direction });
export const limit = (n: number) => ({ type: 'limit', n });

export const getDocs = async (q: any) => {
  if (q.type === 'collection') {
    const { data } = await supabase.from(q.path).select('*');
    return { empty: !data || data.length === 0, docs: (data || []).map((d: any) => ({ id: d.id || d.uid, ...d, data: () => d })) };
  }
  let builder: any = supabase.from(q.col.path).select('*');
  for (const op of q.ops) {
    if (op.type === 'where') builder = builder.eq(op.field, op.value); // Simple mapping
    if (op.type === 'orderBy') builder = builder.order(op.field, { ascending: op.direction === 'asc' });
    if (op.type === 'limit') builder = builder.limit(op.n);
  }
  const { data, error } = await builder;
  if (error) console.error(error);
  return {
    empty: !data || data.length === 0,
    docs: (data || []).map((d: any) => ({ id: d.id || d.uid, ...d, data: () => d }))
  };
};

export const getDocsFromCache = getDocs;

export const getDoc = async (d: any) => {
  const { data } = await supabase.from(d.table).select('*').eq(d.table === 'users' ? 'uid' : 'id', d.id).single();
  return { exists: () => !!data, data: () => data, id: d.id };
};
export const getDocFromCache = getDoc;

export const addDoc = async (col: any, data: any) => {
  const { data: ret, error } = await supabase.from(col.path).insert(data).select().single();
  if (error) console.error(error);
  return { id: ret?.id };
};

export const setDoc = async (d: any, data: any) => {
  const payload = d.table === 'users' ? { uid: d.id, ...data } : { id: d.id, ...data };
  await supabase.from(d.table).upsert(payload);
};

export const updateDoc = async (d: any, data: any) => {
  await supabase.from(d.table).update(data).eq(d.table === 'users' ? 'uid' : 'id', d.id);
};

export const deleteDoc = async (d: any) => {
  await supabase.from(d.table).delete().eq(d.table === 'users' ? 'uid' : 'id', d.id);
};

export const serverTimestamp = () => new Date().toISOString();

export const onSnapshot = (d: any, onNext: Function, onError?: Function) => {
  if (d.type === 'doc') { getDoc(d).then(res => onNext(res)).catch(e => onError && onError(e)); }
  else { getDocs(d).then(res => onNext(res)).catch(e => onError && onError(e)); }
  return () => {};
};

export const getDocFromServer = getDoc;
export const enableIndexedDbPersistence = async () => {};

// Storage API mocks
export const ref = (storage: any, path: string) => ({ path });
export const uploadBytes = async (r: any, file: Blob) => {
  await supabase.storage.from('app-storage').upload(r.path, file, { upsert: true });
  return { ref: r };
};
export const uploadString = async (r: any, data: string, format: string) => {
  const base64Data = data.includes(',') ? data.split(',')[1] : data;
  const buffer = Buffer.from(base64Data, 'base64');
  await supabase.storage.from('app-storage').upload(r.path, buffer, { upsert: true });
  return { ref: r };
};
export const getDownloadURL = async (r: any) => {
  const { data } = supabase.storage.from('app-storage').getPublicUrl(r.path);
  return data.publicUrl;
};
export const deleteObject = async (r: any) => {
  await supabase.storage.from('app-storage').remove([r.path]);
};

export const uploadBase64ToStorage = async (base64: string, path: string): Promise<string> => {
  const r = ref(storage, path);
  await uploadString(r, base64, 'data_url');
  return await getDownloadURL(r);
};
