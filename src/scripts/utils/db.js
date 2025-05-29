import { openDB } from 'idb';

const DB_NAME = 'dicoding-story-db';
const DB_VERSION = 1;
const STORE_NAME = 'stories';
const DELETED_STORE_NAME = 'deletedStories';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(DELETED_STORE_NAME)) {
      db.createObjectStore(DELETED_STORE_NAME, { keyPath: 'id' });
    }
  },
});

export async function saveStories(stories) {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const story of stories) {
    await store.put(story);
  }
  await tx.done;
}

export async function saveStory(story) {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).put(story);
  await tx.done;
}

export async function getStories() {
  const db = await dbPromise;
  return await db.getAll(STORE_NAME);
}

export async function deleteStory(id) {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).delete(id);
  await tx.done;
}

export async function saveDeletedStory(id) {
  const db = await dbPromise;
  const tx = db.transaction(DELETED_STORE_NAME, 'readwrite');
  await tx.objectStore(DELETED_STORE_NAME).put({ id });
  await tx.done;
}

export async function getDeletedStories() {
  const db = await dbPromise;
  return await db.getAll(DELETED_STORE_NAME);
}

export async function deleteDeletedStory(id) {
  const db = await dbPromise;
  const tx = db.transaction(DELETED_STORE_NAME, 'readwrite');
  await tx.objectStore(DELETED_STORE_NAME).delete(id);
  await tx.done;
}
