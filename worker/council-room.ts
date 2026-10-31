import { DurableObject } from "cloudflare:workers";
import {
  applyOp,
  COLLECTIONS,
  emptyDocs,
  type AllDocs,
  type CollectionName,
  type Doc,
  type DocChange,
  type LiveMessage,
  type Snapshot,
  type WriteOp,
  type WriteResult,
} from "../src/lib/syncProtocol";

/**
 * One instance for the ward. Owns every document (callings, proposals, council messages, system
 * metadata) in its SQLite storage and every live connection, so a write and its broadcast happen in
 * one place, in order. Uses the WebSocket Hibernation API so idle connections don't keep it running.
 */
export class CouncilRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS docs (
          collection TEXT NOT NULL,
          id TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (collection, id)
        );
        CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      `);
    });
    // Answered by the runtime without waking the object; clients use it as a heartbeat
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  getSnapshot(): Snapshot {
    const docs = emptyDocs();
    const rows = this.ctx.storage.sql
      .exec<{ collection: CollectionName; id: string; data: string }>("SELECT collection, id, data FROM docs")
      .toArray();
    for (const row of rows) {
      if (docs[row.collection]) docs[row.collection][row.id] = JSON.parse(row.data);
    }
    return { seq: this.getSeq(), docs };
  }

  // Applies the operations in order, all or nothing, then pushes the resulting documents to every client
  write(ops: WriteOp[]): WriteResult {
    const changes = new Map<string, DocChange>();
    const now = Date.now();
    let seq = 0;
    this.ctx.storage.transactionSync(() => {
      for (const op of ops) {
        const key = `${op.collection}/${op.id}`;
        const existing = changes.has(key) ? changes.get(key)!.data : this.getDoc(op.collection, op.id);
        const data = applyOp(existing, op);
        if (data) {
          this.ctx.storage.sql.exec(
            `INSERT INTO docs (collection, id, data, updated_at) VALUES (?, ?, ?, ?)
             ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
            op.collection,
            op.id,
            JSON.stringify(data),
            now
          );
        } else {
          this.ctx.storage.sql.exec("DELETE FROM docs WHERE collection = ? AND id = ?", op.collection, op.id);
        }
        changes.set(key, { collection: op.collection, id: op.id, data });
      }
      seq = this.nextSeq();
    });
    const result: WriteResult = { seq, changes: [...changes.values()] };
    this.broadcast({ type: "changes", ...result });
    return result;
  }

  // Replaces everything with an export of the old Firestore database (scripts/import-data.mjs)
  importAll(docs: AllDocs): Record<CollectionName, number> {
    const now = Date.now();
    const counts = Object.fromEntries(COLLECTIONS.map((c) => [c, 0])) as Record<CollectionName, number>;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec("DELETE FROM docs");
      for (const collection of COLLECTIONS) {
        for (const [id, data] of Object.entries(docs[collection] || {})) {
          this.ctx.storage.sql.exec(
            "INSERT INTO docs (collection, id, data, updated_at) VALUES (?, ?, ?, ?)",
            collection,
            id,
            JSON.stringify(data),
            now
          );
          counts[collection]++;
        }
      }
      this.nextSeq();
    });
    this.broadcast({ type: "snapshot", ...this.getSnapshot() });
    return counts;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    // Every (re)connect starts with the full data set, so a client that was offline catches up
    server.send(JSON.stringify({ type: "snapshot", ...this.getSnapshot() } satisfies LiveMessage));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketClose(ws: WebSocket, code: number) {
    try {
      ws.close(code, "closing");
    } catch {
      // Already closed
    }
  }

  private getDoc(collection: CollectionName, id: string): Doc | null {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM docs WHERE collection = ? AND id = ?", collection, id)
      .toArray()[0];
    return row ? JSON.parse(row.data) : null;
  }

  private getSeq(): number {
    const row = this.ctx.storage.sql.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'seq'").toArray()[0];
    return row ? Number(row.value) : 0;
  }

  private nextSeq(): number {
    const seq = this.getSeq() + 1;
    this.ctx.storage.sql.exec("INSERT OR REPLACE INTO meta (key, value) VALUES ('seq', ?)", String(seq));
    return seq;
  }

  private broadcast(message: LiveMessage) {
    const payload = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        // Socket is closing; it will be cleaned up by the runtime
      }
    }
  }
}
