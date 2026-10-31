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
  const buf = await getPdfFromDisk(url);
  return buf !== null;
}

/**
 * Validate that an ArrayBuffer contains a structurally intact, complete PDF file:
 * 1. Must be >= 100 bytes
 * 2. Must start with %PDF- header in first 1024 bytes
 * 3. Must end with %%EOF marker in last 4096 bytes
 */
export function isBufferValidPdf(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 100) return false;

  // 1. Verify %PDF- header
  const headLen = Math.min(1024, buffer.byteLength);
  const headBytes = new Uint8Array(buffer, 0, headLen);
  let headStr = '';
  for (let i = 0; i < headLen; i++) {
    headStr += String.fromCharCode(headBytes[i]);
  }
  if (!headStr.includes('%PDF-')) {
    return false;
  }

  // 2. Verify %%EOF trailer marker
  const tailLen = Math.min(4096, buffer.byteLength);
  const tailStart = buffer.byteLength - tailLen;
  const tailBytes = new Uint8Array(buffer, tailStart, tailLen);
  let tailStr = '';
  for (let i = 0; i < tailLen; i++) {
    tailStr += String.fromCharCode(tailBytes[i]);
  }
  return tailStr.includes('%%EOF');
}

/**
 * Explicitly purge a PDF from both Cache API and IndexedDB
 */
export async function purgePdfFromDisk(url: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(url, { ignoreSearch: true });
    } catch (e) {
      console.warn('Cache API purge error:', e);
    }
  }

  if ('indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.delete(url);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn('IndexedDB purge error:', e);
    }
  }
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
        console.warn(`[SlateCache] Corrupt/truncated PDF in Cache API detected for ${url}. Purging...`);
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
            if (buf) {
              console.warn(`[SlateCache] Corrupt/truncated PDF in IndexedDB detected for ${url}. Purging...`);
              store.delete(url);
            }
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

  // Strict guard: NEVER cache incomplete or corrupt PDF files on device disk
  if (!isBufferValidPdf(data)) {
    console.warn(`[SlateCache] Refusing to cache incomplete/corrupt PDF for ${url} (${data.byteLength} bytes)`);
    return;
  }

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
    } catch {}
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
    } catch {}
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
    } catch {}
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
    } catch {}
  }

  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      const db = await openIndexedDb();
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
    } catch {}
  }
}
