/**
 * IndexedDB Storage for Collections
 */
import { UnifiedCollection } from './types/collectionTypes';

const DB_NAME = 'qa-utils-collections';
const DB_VERSION = 1;
const STORE_NAME = 'collections';

class CollectionDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveCollections(collections: UnifiedCollection[]): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Clear existing and save new
    await store.clear();
    for (const collection of collections) {
      store.put(collection);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async loadCollections(): Promise<UnifiedCollection[]> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCollection(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const collectionDB = new CollectionDB();
