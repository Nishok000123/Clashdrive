/**
 * In-memory chunk cache for preview chunks during active session.
 * Completely DB-less — no IndexedDB or persistent browser databases.
 */

const chunkMemoryCache = new Map<string, Uint8Array>();
const MAX_MEM_ENTRIES = 50;

export async function getCachedChunk(
  fileId: string,
  chunkIndex: number
): Promise<Uint8Array | null> {
  const key = `${fileId}:${chunkIndex}`;
  return chunkMemoryCache.get(key) || null;
}

export async function setCachedChunk(
  fileId: string,
  chunkIndex: number,
  data: Uint8Array
): Promise<void> {
  const key = `${fileId}:${chunkIndex}`;
  if (chunkMemoryCache.size >= MAX_MEM_ENTRIES) {
    const firstKey = chunkMemoryCache.keys().next().value;
    if (firstKey) chunkMemoryCache.delete(firstKey);
  }
  chunkMemoryCache.set(key, data);
}
