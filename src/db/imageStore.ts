import { v4 as uuid } from 'uuid';

const DB_NAME = 'project_manager_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export interface StoredImage {
  id: string;
  mimeType: string;
  data: ArrayBuffer;
  createdAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openImageDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function storeImage(file: File): Promise<string> {
  const db = await openImageDB();
  const id = uuid();
  const data = await file.arrayBuffer();
  const image: StoredImage = { id, mimeType: file.type, data, createdAt: new Date().toISOString() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(image);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getImageUrl(id: string): Promise<string | null> {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      const img = req.result as StoredImage | undefined;
      if (!img) { resolve(null); return; }
      const blob = new Blob([img.data], { type: img.mimeType });
      resolve(URL.createObjectURL(blob));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImage(id: string): Promise<void> {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function extractImageIds(markdown: string): string[] {
  const matches = markdown.matchAll(/img:\/\/([a-f0-9-]{36})/g);
  return [...matches].map((m) => m[1]);
}
