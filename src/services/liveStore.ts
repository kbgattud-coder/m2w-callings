import {
  applyOp,
  COLLECTIONS,
  docKey,
  type AllDocs,
  type CollectionName,
  type Doc,
  type DocChange,
  type LiveMessage,
  type Snapshot,
  type WriteOp,
  type WriteResult,
} from '../lib/syncProtocol';

/**
 * Browser copy of the Durable Object's documents, kept current over the /api/live WebSocket.
 * Plays the part Firestore's SDK used to: listeners get every document of a collection whenever
 * it changes, and local writes show up at once, then get confirmed (or rolled back) by the server.
 */

type Listener = {
  collection: CollectionName;
  onDocs: (entries: [string, Doc][]) => void;
  onError?: (error: Error) => void;
};

let docs: AllDocs | null = null;
let floorSeq = 0; // the latest snapshot's sequence number; anything at or below it is already in `docs`
const docSeq = new Map<string, number>(); // documents changed since that snapshot
const pending = new Map<string, number>(); // local writes still waiting for the server, per document
const deferred = new Map<string, { change: DocChange; seq: number }>(); // server updates held back meanwhile
const listeners = new Set<Listener>();
let connection: LiveConnection | null = null;

const splitKey = (key: string) => {
  const slash = key.indexOf('/');
  return [key.slice(0, slash) as CollectionName, key.slice(slash + 1)] as const;
};

// Firestore returned query results ordered by document id; keep that order
const sortedEntries = (collection: CollectionName): [string, Doc][] =>
  Object.entries(docs![collection]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

function notify(collections: Iterable<CollectionName>) {
  if (!docs) return;
  const changed = new Set(collections);
  for (const listener of listeners) {
    if (changed.has(listener.collection)) listener.onDocs(sortedEntries(listener.collection));
  }
}

function putDoc(collection: CollectionName, id: string, data: Doc | null) {
  if (data) docs![collection][id] = data;
  else delete docs![collection][id];
}

function applyServerChange(change: DocChange, seq: number): boolean {
  const key = docKey(change.collection, change.id);
  if (!docs || seq <= Math.max(floorSeq, docSeq.get(key) ?? 0)) return false;
  docSeq.set(key, seq);
  putDoc(change.collection, change.id, change.data);
  return true;
}

function receiveSnapshot(snapshot: Snapshot) {
  const previous = docs;
  docs = snapshot.docs;
  if (previous) {
    // Keep documents that changed after this snapshot was taken, and local writes not yet confirmed
    for (const [key, seq] of [...docSeq]) {
      if (seq <= snapshot.seq) docSeq.delete(key);
    }
    for (const key of new Set([...docSeq.keys(), ...pending.keys()])) {
      const [collection, id] = splitKey(key);
      putDoc(collection, id, previous[collection][id] ?? null);
    }
  }
  floorSeq = snapshot.seq;
  notify(COLLECTIONS);
}

function receiveChanges(result: WriteResult) {
  const touched = new Set<CollectionName>();
  for (const change of result.changes) {
    const key = docKey(change.collection, change.id);
    if (pending.has(key)) {
      const held = deferred.get(key);
      if (!held || held.seq < result.seq) deferred.set(key, { change, seq: result.seq });
    } else if (applyServerChange(change, result.seq)) {
      touched.add(change.collection);
    }
  }
  notify(touched);
}

// A write finished (result) or failed (null): the server's version of its documents takes over again
function settle(keys: string[], result: WriteResult | null) {
  const touched = new Set<CollectionName>();
  for (const key of keys) {
    const left = (pending.get(key) ?? 1) - 1;
    if (left > 0) {
      pending.set(key, left);
      continue;
    }
    pending.delete(key);
    const [collection, id] = splitKey(key);
    const confirmed = result?.changes.find((c) => c.collection === collection && c.id === id);
    if (confirmed) applyServerChange(confirmed, result!.seq);
    const held = deferred.get(key);
    if (held) applyServerChange(held.change, held.seq);
    deferred.delete(key);
    touched.add(collection);
  }
  notify(touched);
}

async function fetchSnapshot(): Promise<Snapshot> {
  const res = await fetch('/api/data', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Loading data failed (${res.status})`);
  return res.json();
}

/** Current documents straight from the server (like Firestore's getDocs); listeners aren't called. */
export async function fetchAll(): Promise<AllDocs> {
  return (await fetchSnapshot()).docs;
}

/** Applies the operations here at once, then saves them on the server, all or nothing. */
export async function write(ops: WriteOp[]): Promise<void> {
  if (ops.length === 0) return;
  const keys = [...new Set(ops.map((op) => docKey(op.collection, op.id)))];
  if (docs) {
    for (const op of ops) putDoc(op.collection, op.id, applyOp(docs[op.collection][op.id] ?? null, op));
    notify(ops.map((op) => op.collection));
  }
  for (const key of keys) pending.set(key, (pending.get(key) ?? 0) + 1);

  let result: WriteResult;
  try {
    const res = await fetch('/api/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops }),
    });
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
    result = await res.json();
  } catch (error) {
    settle(keys, null);
    fetchSnapshot().then(receiveSnapshot, () => {}); // undo the local change with the server's current data
    throw error;
  }
  settle(keys, result);
}

/** Calls onDocs with every document in the collection now (once loaded) and after each change. */
export function subscribe(
  collection: CollectionName,
  onDocs: Listener['onDocs'],
  onError?: Listener['onError']
): () => void {
  const listener: Listener = { collection, onDocs, onError };
  listeners.add(listener);
  if (docs) queueMicrotask(() => listeners.has(listener) && onDocs(sortedEntries(collection)));
  if (!connection) {
    connection = new LiveConnection({
      onMessage: (msg) => (msg.type === 'snapshot' ? receiveSnapshot(msg) : receiveChanges(msg)),
      onDisconnect: () => {
        for (const l of listeners) l.onError?.(new Error('Live connection lost; reconnecting'));
      },
    });
    connection.start();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      connection?.stop();
      connection = null;
    }
  };
}

const HEARTBEAT_MS = 20_000;
const HEARTBEAT_TIMEOUT_MS = 10_000;
const MAX_RETRY_MS = 15_000;

/**
 * Keeps one WebSocket open to /api/live. Phones drop sockets when the screen locks or the network
 * changes, so this reconnects with backoff, immediately when the app becomes visible or comes back
 * online, and when heartbeats stop getting answered. Every (re)connect delivers a full snapshot.
 */
class LiveConnection {
  private ws: WebSocket | null = null;
  private stopped = false;
  private retryMs = 1000;
  private retryTimer: number | undefined;
  private heartbeatTimer: number | undefined;
  private lastPong = 0;

  constructor(private handlers: { onMessage: (msg: LiveMessage) => void; onDisconnect: () => void }) {}

  start() {
    this.stopped = false;
    document.addEventListener('visibilitychange', this.handleWake);
    window.addEventListener('online', this.handleWake);
    this.connect();
  }

  stop() {
    this.stopped = true;
    document.removeEventListener('visibilitychange', this.handleWake);
    window.removeEventListener('online', this.handleWake);
    window.clearTimeout(this.retryTimer);
    window.clearInterval(this.heartbeatTimer);
    this.ws?.close();
    this.ws = null;
  }

  private handleWake = () => {
    if (document.visibilityState !== 'visible' || this.stopped) return;
    const ws = this.ws;
    if (ws?.readyState === WebSocket.OPEN) {
      // The socket may have died silently while the phone was asleep; verify it right away
      const sentAt = Date.now();
      ws.send('ping');
      window.setTimeout(() => {
        if (this.ws === ws && this.lastPong < sentAt) this.drop(ws);
      }, 3000);
      return;
    }
    this.retryMs = 1000;
    this.connect();
  };

  private connect() {
    if (this.stopped) return;
    window.clearTimeout(this.retryTimer);
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return; // already connecting/open

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/api/live`);
    this.ws = ws;

    ws.onopen = () => {
      this.retryMs = 1000;
      this.lastPong = Date.now();
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = window.setInterval(() => this.heartbeat(ws), HEARTBEAT_MS);
    };

    ws.onmessage = (event) => {
      if (event.data === 'pong') {
        this.lastPong = Date.now();
        return;
      }
      try {
        this.handlers.onMessage(JSON.parse(event.data));
      } catch (error) {
        console.error('Ignoring live update:', error);
      }
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      window.clearInterval(this.heartbeatTimer);
      this.handlers.onDisconnect();
      if (!this.stopped) {
        this.retryTimer = window.setTimeout(() => this.connect(), this.retryMs);
        this.retryMs = Math.min(this.retryMs * 2, MAX_RETRY_MS);
      }
    };
  }

  // Abandon a socket that stopped answering (closing a dead socket can take minutes) and reconnect now
  private drop(ws: WebSocket) {
    if (this.ws !== ws) return;
    this.ws = null;
    window.clearInterval(this.heartbeatTimer);
    ws.close();
    this.handlers.onDisconnect();
    this.connect();
  }

  private heartbeat(ws: WebSocket) {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (Date.now() - this.lastPong > HEARTBEAT_MS + HEARTBEAT_TIMEOUT_MS) {
      this.drop(ws);
      return;
    }
    ws.send('ping');
  }
}
