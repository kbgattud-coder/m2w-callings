// Shared by the browser (src/services/liveStore.ts) and the Worker (worker/council-room.ts).
// The data model is the one the app had on Firestore: named collections of JSON documents keyed by id.

export const COLLECTIONS = ['callings', 'proposals', 'council_messages', 'system_meta'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

export type Doc = Record<string, unknown>;
export type AllDocs = Record<CollectionName, Record<string, Doc>>;

// `merge: true` behaves like Firestore's setDoc(..., { merge: true }); without it the document is replaced
export type WriteOp =
  | { op: 'set'; collection: CollectionName; id: string; data: Doc; merge?: boolean }
  | { op: 'delete'; collection: CollectionName; id: string };

// The resulting state of one document after a write; data is null when it was deleted
export interface DocChange {
  collection: CollectionName;
  id: string;
  data: Doc | null;
}

// Every write gets the next sequence number, so clients can tell newer states from older ones
export interface Snapshot {
  seq: number;
  docs: AllDocs;
}

export interface WriteResult {
  seq: number;
  changes: DocChange[];
}

// Messages pushed to connected clients over the /api/live WebSocket
export type LiveMessage =
  | ({ type: 'snapshot' } & Snapshot)
  | ({ type: 'changes' } & WriteResult);

export const isCollectionName = (value: unknown): value is CollectionName =>
  typeof value === 'string' && (COLLECTIONS as readonly string[]).includes(value);

export const emptyDocs = (): AllDocs => ({ callings: {}, proposals: {}, council_messages: {}, system_meta: {} });

const isPlainObject = (value: unknown): value is Doc =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Firestore's merge: nested maps are merged field by field, everything else (arrays, scalars,
 * empty maps) replaces what was there, and fields missing from `incoming` are kept.
 */
export function mergeDoc(existing: Doc, incoming: Doc): Doc {
  const result: Doc = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    const current = result[key];
    result[key] =
      isPlainObject(value) && Object.keys(value).length > 0 && isPlainObject(current)
        ? mergeDoc(current, value)
        : value;
  }
  return result;
}

export function applyOp(existing: Doc | null, op: WriteOp): Doc | null {
  if (op.op === 'delete') return null;
  return op.merge && existing ? mergeDoc(existing, op.data) : op.data;
}

export const docKey = (collection: CollectionName, id: string) => `${collection}/${id}`;
