import { kv } from '@vercel/kv';

const memoryStore = globalThis.__nexusvaultMemoryStore ?? new Map();
globalThis.__nexusvaultMemoryStore = memoryStore;
let blobApiPromise = null;

function hasKvConfig() {
  return Boolean(
    process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_URL
  );
}

function hasBlobConfig() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function getBlobPath(key) {
  return `state/${encodeURIComponent(key)}.json`;
}

async function getBlobApi() {
  if (!blobApiPromise) {
    blobApiPromise = import('@vercel/blob');
  }

  return blobApiPromise;
}

async function blobGet(key) {
  if (!hasBlobConfig()) {
    return null;
  }

  try {
    const { get } = await getBlobApi();
    const result = await get(getBlobPath(key), {
      access: 'private',
      useCache: false,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const content = await new Response(result.stream).text();
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function blobSet(key, value) {
  if (!hasBlobConfig()) {
    return false;
  }

  try {
    const { put } = await getBlobApi();
    await put(getBlobPath(key), JSON.stringify(value), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return true;
  } catch {
    return false;
  }
}

export async function kvGet(key) {
  if (hasKvConfig()) {
    try {
      return await kv.get(key);
    } catch {
      const blobValue = await blobGet(key);
      return blobValue ?? memoryStore.get(key) ?? null;
    }
  }

  const blobValue = await blobGet(key);
  if (blobValue !== null) {
    return blobValue;
  }

  return memoryStore.get(key) ?? null;
}

export async function kvSet(key, value) {
  if (hasKvConfig()) {
    try {
      await kv.set(key, value);
      return;
    } catch {
      if (await blobSet(key, value)) {
        return;
      }

      memoryStore.set(key, value);
      return;
    }
  }

  if (await blobSet(key, value)) {
    return;
  }

  memoryStore.set(key, value);
}

export async function kvStatus() {
  if (hasKvConfig()) {
    return 'configured';
  }

  if (hasBlobConfig()) {
    return 'blob-fallback';
  }

  return 'memory-fallback';
}
