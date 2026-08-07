/**
 * Range-aware streaming cache for video/audio chunk data.
 *
 * Instead of storing only fully-downloaded chunks, this cache supports
 * incremental appending of streamed bytes. Each chunk has a contiguous
 * buffer that grows from offset 0 as data arrives from Telegram.
 *
 * This enables the stream handler to:
 *  1. Serve cached bytes immediately for ranges already downloaded
 *  2. Stream only the missing tail from Telegram
 *  3. Cache new bytes as they arrive for future seeks
 *
 * LRU eviction keeps memory bounded.
 */

interface ChunkBuffer {
  /** Backing buffer — may be larger than validBytes (pre-allocated). */
  data: Uint8Array;
  /** Number of contiguous bytes valid from offset 0. */
  validBytes: number;
  /** Last access timestamp for LRU eviction. */
  lastAccess: number;
}

const chunkBuffers = new Map<string, ChunkBuffer>();
const MAX_CACHED_CHUNKS = 30;

function makeKey(fileId: string, chunkIndex: number): string {
  return `${fileId}:${chunkIndex}`;
}

function touchEntry(buf: ChunkBuffer): void {
  buf.lastAccess = Date.now();
}

function evictIfNeeded(): void {
  if (chunkBuffers.size < MAX_CACHED_CHUNKS) return;

  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  for (const [key, buf] of chunkBuffers) {
    if (buf.lastAccess < oldestTime) {
      oldestTime = buf.lastAccess;
      oldestKey = key;
    }
  }
  if (oldestKey) chunkBuffers.delete(oldestKey);
}

// ---------------------------------------------------------------------------
// Public API — Range-based operations
// ---------------------------------------------------------------------------

/**
 * Returns how many contiguous bytes (from offset 0) are cached for a chunk.
 */
export function getCachedBytes(fileId: string, chunkIndex: number): number {
  const buf = chunkBuffers.get(makeKey(fileId, chunkIndex));
  if (!buf) return 0;
  touchEntry(buf);
  return buf.validBytes;
}

/**
 * Read cached data for a byte range within a chunk.
 *
 * Returns a slice of whatever is available starting at `offset`.
 * The returned array may be *shorter* than `length` if the cache
 * only has partial coverage.  Returns `null` if nothing is cached
 * at the requested offset.
 */
export function getCachedRange(
  fileId: string,
  chunkIndex: number,
  offset: number,
  length: number
): Uint8Array | null {
  const buf = chunkBuffers.get(makeKey(fileId, chunkIndex));
  if (!buf || buf.validBytes <= offset) return null;

  touchEntry(buf);
  const available = Math.min(length, buf.validBytes - offset);
  if (available <= 0) return null;

  return buf.data.subarray(offset, offset + available);
}

/**
 * Append contiguous data at a specific offset inside a chunk buffer.
 *
 * The caller is responsible for appending in order (offset should equal
 * the current validBytes for the append to extend the contiguous range).
 * Out-of-order writes are stored but do NOT advance `validBytes`.
 *
 * `totalChunkSize` is used to pre-allocate the backing buffer on first write.
 */
export function appendCachedData(
  fileId: string,
  chunkIndex: number,
  offset: number,
  data: Uint8Array,
  totalChunkSize: number
): void {
  const key = makeKey(fileId, chunkIndex);
  let buf = chunkBuffers.get(key);

  if (!buf) {
    evictIfNeeded();
    const allocSize = Math.max(totalChunkSize, offset + data.length);
    buf = {
      data: new Uint8Array(allocSize),
      validBytes: 0,
      lastAccess: Date.now(),
    };
    chunkBuffers.set(key, buf);
  }

  // Grow backing buffer if needed
  const end = offset + data.length;
  if (end > buf.data.length) {
    const newBuf = new Uint8Array(Math.max(end, buf.data.length * 2));
    newBuf.set(buf.data.subarray(0, buf.validBytes));
    buf.data = newBuf;
  }

  buf.data.set(data, offset);

  // Only advance validBytes if this write is contiguous from the current end
  if (offset <= buf.validBytes) {
    buf.validBytes = Math.max(buf.validBytes, end);
  }

  touchEntry(buf);
}

// ---------------------------------------------------------------------------
// Public API — Full-chunk operations (backward compat)
// ---------------------------------------------------------------------------

/**
 * Store a fully-downloaded chunk.  Used by `downloadChunkToCache` and
 * `FileCardThumbnail` which download whole chunks at once.
 */
export function setFullCachedChunk(
  fileId: string,
  chunkIndex: number,
  data: Uint8Array
): void {
  const key = makeKey(fileId, chunkIndex);
  if (!chunkBuffers.has(key)) evictIfNeeded();
  chunkBuffers.set(key, {
    data,
    validBytes: data.length,
    lastAccess: Date.now(),
  });
}

/**
 * Get the cached data for a chunk (however much has been downloaded).
 * Returns `null` if nothing is cached.
 */
export function getFullCachedChunk(
  fileId: string,
  chunkIndex: number
): Uint8Array | null {
  const buf = chunkBuffers.get(makeKey(fileId, chunkIndex));
  if (!buf || buf.validBytes === 0) return null;
  touchEntry(buf);
  return buf.data.subarray(0, buf.validBytes);
}

/**
 * Evict all cached data for a specific file.
 */
export function evictFileCache(fileId: string): void {
  for (const key of [...chunkBuffers.keys()]) {
    if (key.startsWith(fileId + ":")) {
      chunkBuffers.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Legacy aliases — kept so existing imports compile without changes
// ---------------------------------------------------------------------------

export async function getCachedChunk(
  fileId: string,
  chunkIndex: number
): Promise<Uint8Array | null> {
  return getFullCachedChunk(fileId, chunkIndex);
}

export async function setCachedChunk(
  fileId: string,
  chunkIndex: number,
  data: Uint8Array
): Promise<void> {
  setFullCachedChunk(fileId, chunkIndex, data);
}
