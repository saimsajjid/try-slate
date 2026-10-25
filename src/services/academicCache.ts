/**
 * Pure On-Disk Storage Service for Slate Academic Documents.
 *
 * Constraints:
 * 1. ZERO RAM Hoarding: No module-level or global variables holding ArrayBuffers.
 * 2. Pure Disk-Based: Uses browser Cache API ('window.caches') with IndexedDB fallback.
 * 3. Works 100% offline across all devices (Windows, Mac, iOS Safari, Android).
 */

const CACHE_NAME = 'slate-academic-vault-v1';
const IDB_NAME = 'slate_academic_offline_idb';
const IDB_STORE = 'academic_blobs';

// Auto-request persistent storage so browser never evicts cached lectures
if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

/**
 * Open or create IndexedDB fallback database
 */
function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if a document is already saved on local device disk
 */
export async function isPdfOnDisk(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Primary: Cache API
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(url, { ignoreSearch: true });
      if (match) return true;
    } catch (e) {
      // Fall through to IndexedDB
    }
  }

  // 2. Fallback: IndexedDB
  if ('indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      return new Promise<boolean>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.count(url);
        req.onsuccess = () => resolve(req.result > 0);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  return false;
}

/**
 * Read PDF ArrayBuffer directly from local device disk (Zero RAM retention)
 */
function isBufferValidPdf(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 100) return false;
  const tailStart = Math.max(0, buffer.byteLength - 512);
  const tailBytes = new Uint8Array(buffer, tailStart, buffer.byteLength - tailStart);
  let tailStr = '';
  for (let i = 0; i < tailBytes.length; i++) {
    tailStr += String.fromCharCode(tailBytes[i]);
  }
  return tailStr.includes('%%EOF');
}

export async function getPdfFromDisk(url: string): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined') return null;

  // 1. Primary: Cache API
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(url, { ignoreSearch: true });
      if (match) {
        const buf = await match.arrayBuffer();
        if (isBufferValidPdf(buf)) {
          return buf;
        }
        // Truncated/corrupt cache detected: automatically purge from disk
        await cache.delete(url, { ignoreSearch: true });
      }
    } catch (e) {
      console.warn('Cache API read error, trying IndexedDB:', e);
    }
  }

  // 2. Fallback: IndexedDB
  if ('indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      return new Promise<ArrayBuffer | null>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(url);
        req.onsuccess = async () => {
          const val = req.result;
          let buf: ArrayBuffer | null = null;
          if (val instanceof ArrayBuffer) buf = val;
          else if (val instanceof Blob) buf = await val.arrayBuffer();

          if (buf && isBufferValidPdf(buf)) {
            resolve(buf);
          } else {
            if (buf) store.delete(url); // purge corrupt entry
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('IndexedDB read error:', e);
      return null;
    }
  }

  return null;
}

/**
 * Save PDF binary directly to local device disk
 */
export async function savePdfToDisk(url: string, data: ArrayBuffer): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Primary: Cache API
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(data.slice(0), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(data.byteLength),
          'X-Slate-Cached-At': new Date().toISOString()
        }
      });
      await cache.put(url, response);
      return;
    } catch (e) {
      console.warn('Failed saving to Cache API, attempting IndexedDB fallback:', e);
    }
  }

  // 2. Fallback: IndexedDB
  if ('indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        // Store as Blob to ensure true on-disk storage in browser DB engine
        const blob = new Blob([data], { type: 'application/pdf' });
        const req = store.put(blob, url);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('Failed saving to local disk cache:', e);
    }
  }
}

/**
 * Read text content (Markdown, Plain text, Code) directly from local device disk
 */
export async function getTextFromDisk(url: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Primary: Cache API
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(url, { ignoreSearch: true });
      if (match) {
        return await match.text();
      }
    } catch (e) {
      console.warn('Cache API text read error, trying IndexedDB:', e);
    }
  }

  // 2. Fallback: IndexedDB
  if ('indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(url);
        req.onsuccess = () => {
          const val = req.result;
          if (typeof val === 'string') {
            resolve(val);
          } else if (val instanceof Blob) {
            val.text().then(resolve).catch(() => resolve(null));
          } else if (val instanceof ArrayBuffer) {
            const decoded = new TextDecoder('utf-8').decode(val);
            resolve(decoded);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('IndexedDB text read error:', e);
      return null;
    }
  }

  return null;
}

/**
 * Save text content (Markdown, Plain text, Code) directly to local device disk
 */
export async function saveTextToDisk(url: string, text: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);

  // 1. Primary: Cache API
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Length': String(encoded.byteLength),
          'X-Slate-Cached-At': new Date().toISOString()
        }
      });
      await cache.put(url, response);
      return;
    } catch (e) {
      console.warn('Failed saving text to Cache API, attempting IndexedDB fallback:', e);
    }
  }

  // 2. Fallback: IndexedDB
  if ('indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(text, url);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('Failed saving text to local disk cache:', e);
    }
  }
}

export const isTextOnDisk = isPdfOnDisk;
export const deleteTextFromDisk = deletePdfFromDisk;

/**
 * Delete a specific cached document from disk
 */
export async function deletePdfFromDisk(url: string): Promise<boolean> {
  let deleted = false;

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      deleted = await cache.delete(url, { ignoreSearch: true });
    } catch (e) {}
  }

  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.delete(url);
        req.onsuccess = () => {
          deleted = true;
          resolve();
        };
        req.onerror = () => resolve();
      });
    } catch (e) {}
  }

  return deleted;
}

/**
 * Get disk usage statistics
 */
export async function getDiskStorageStats(): Promise<{
  count: number;
  totalBytes: number;
  formattedSize: string;
}> {
  let count = 0;
  let totalBytes = 0;

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const requests = await cache.keys();
      count = requests.length;

      for (const req of requests) {
        const res = await cache.match(req);
        if (res) {
          const len = res.headers.get('content-length');
          if (len) totalBytes += parseInt(len, 10);
        }
      }
    } catch (e) {}
  }

  const mb = totalBytes / (1024 * 1024);
  const formattedSize = mb > 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;

  return { count, totalBytes, formattedSize };
}

/**
 * Clear all cached academic documents from disk
 */
export async function clearAllDiskCache(): Promise<void> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      await caches.delete(CACHE_NAME);
    } catch (e) {}
  }

  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
    } catch (e) {}
  }
}
