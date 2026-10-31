import { COLLECTIONS, isCollectionName, type AllDocs, type WriteOp } from "../src/lib/syncProtocol";

export { CouncilRoom } from "./council-room";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_OPS = 2000;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

// A single ward, so a single Durable Object instance holds everything. The location hint makes
// Cloudflare create it in Asia-Pacific, close to the ward. (It only applies when it is first created.)
const councilRoom = (env: Env) => env.COUNCIL.get(env.COUNCIL.idFromName("masagana2"), { locationHint: "apac" });

// Browsers send Origin on cross-site POSTs; reject writes that don't come from this site
function isSameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === url.origin;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isValidId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 300 && !id.includes("/");

function parseOps(body: unknown): WriteOp[] | null {
  const ops = isPlainObject(body) ? body.ops : null;
  if (!Array.isArray(ops) || ops.length === 0 || ops.length > MAX_OPS) return null;
  for (const op of ops) {
    if (!isPlainObject(op) || !isCollectionName(op.collection) || !isValidId(op.id)) return null;
    if (op.op === "set" ? !isPlainObject(op.data) : op.op !== "delete") return null;
  }
  return ops as WriteOp[];
}

// The import endpoint only exists while the IMPORT_TOKEN secret is set
async function hasImportToken(request: Request, env: Env): Promise<boolean> {
  const expected = env.IMPORT_TOKEN;
  const given = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
  if (!expected || given.length !== expected.length) return false;
  const encoder = new TextEncoder();
  return crypto.subtle.timingSafeEqual(encoder.encode(given), encoder.encode(expected));
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method !== "GET" && method !== "HEAD" && !isSameOrigin(request, url)) {
      return json({ error: "Cross-origin request blocked" }, 403);
    }

    try {
      // Live updates (WebSocket handled by the Durable Object)
      if (pathname === "/api/live") {
        return councilRoom(env).fetch(request);
      }

      if (pathname === "/api/data" && method === "GET") {
        return json(await councilRoom(env).getSnapshot());
      }

      if (pathname === "/api/write" && method === "POST") {
        const ops = parseOps(await request.json().catch(() => null));
        if (!ops) return json({ error: "Invalid write" }, 400);
        return json(await councilRoom(env).write(ops));
      }

      // One-time migration of the Firestore export (scripts/import-data.mjs); replaces all data
      if (pathname === "/api/admin/import" && method === "POST") {
        if (!(await hasImportToken(request, env))) return json({ error: "Unauthorized" }, 401);
        const body = await request.json<{ collections?: Partial<AllDocs> }>();
        const collections = body?.collections;
        if (!isPlainObject(collections) || !COLLECTIONS.every((c) => isPlainObject(collections[c]))) {
          return json({ error: "Expected every collection in the export" }, 400);
        }
        return json({ imported: await councilRoom(env).importAll(collections as AllDocs) });
      }

      if (pathname === "/api/health") {
        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error(`${method} ${pathname} failed:`, err);
      return json({ error: "Server error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
